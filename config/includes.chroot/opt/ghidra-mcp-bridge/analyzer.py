#!/usr/bin/env python3
"""GhidraMCP Binary Reverse Engineering & Decompilation Engine (v3.6.0).

Integrates host reverse engineering toolchains with pure-Python binary parsers:
- Pure-Python ELF32/ELF64, PE32/PE32+, Mach-O 32/64, and WASM header & section-table parsers
- Per-section and whole-file Shannon entropy (0.00-8.00 bits/byte) with packing detection
- 16-byte-per-line hexadecimal + ASCII dump inspector
- NSA Ghidra Headless Analyzer (/usr/share/ghidra/support/analyzeHeadless)
- Radare2 / r2 (disassembly, function recovery, C pseudocode via pdc, xrefs via axt)
- GNU Binutils (objdump, readelf, nm, strings)
- Agent Capsule Jail sandbox isolation (bwrap / resource limits)
- Spec-compliant JSON-RPC 2.0 MCP dispatcher (8 tools)

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import hashlib
import json
import math
import os
import re
import shutil
import struct
import subprocess
import tempfile
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

VERSION = "3.6.0"
MCP_PROTOCOL_VERSION = "2024-11-05"

# Strict allowlist for function names, symbol identifiers, and hex addresses
# Prevents radare2 command chaining (;, !, |, `, $(), whitespace, quotes, newlines)
SYMBOL_ARG_RE = re.compile(r"^[A-Za-z0-9_.@:$+-]{1,128}$")

# Recognized executable binary magic signatures
MACHO_MAGICS = {
    b"\xfe\xed\xfa\xce",  # Mach-O 32-bit big-endian
    b"\xce\xfa\xed\xfe",  # Mach-O 32-bit little-endian
    b"\xfe\xed\xfa\xcf",  # Mach-O 64-bit big-endian
    b"\xcf\xfa\xed\xfe",  # Mach-O 64-bit little-endian
    b"\xca\xfe\xba\xbe",  # Mach-O Universal / Fat (big-endian)
    b"\xbe\xba\xfe\xca",  # Mach-O Universal / Fat (little-endian)
}


def validate_symbol_arg(val: Any, field_name: str = "symbol") -> str:
    """Strictly validate symbol/function/address/variable identifier arguments."""
    if not isinstance(val, str):
        raise ValueError(f"Invalid {field_name}: must be a string")
    cleaned = val.strip()
    if not cleaned or not SYMBOL_ARG_RE.match(cleaned):
        raise ValueError(
            f"Invalid {field_name} '{cleaned[:48]}': must match ^[A-Za-z0-9_.@:$+-]{{1,128}}$"
        )
    return cleaned


def compute_shannon_entropy(data: bytes) -> float:
    """Calculate exact Shannon entropy in bits/byte (0.00 - 8.00)."""
    length = len(data)
    if length == 0:
        return 0.0
    counts = Counter(data)
    ent = 0.0
    for count in counts.values():
        p = count / length
        ent -= p * math.log2(p)
    return round(ent, 4)


def classify_entropy(entropy: float) -> str:
    if entropy >= 7.0:
        return "PACKED / ENCRYPTED"
    if entropy >= 6.0:
        return "ELEVATED"
    return "NORMAL"


def detect_binary_magic(data: bytes) -> Optional[str]:
    """Return canonical binary format family if magic bytes match ELF/PE/Mach-O/WASM, else None."""
    if len(data) < 4:
        return None
    if data[:4] == b"\x7fELF":
        if len(data) >= 5 and data[4] == 1:
            return "ELF32"
        if len(data) >= 5 and data[4] == 2:
            return "ELF64"
        return "ELF"
    if data[:2] == b"MZ" and len(data) >= 64:
        e_lfanew = struct.unpack_from("<I", data, 0x3C)[0]
        if 0x40 <= e_lfanew <= len(data) - 4 and data[e_lfanew:e_lfanew + 4] == b"PE\x00\x00":
            opt_off = e_lfanew + 24
            if opt_off + 2 <= len(data):
                opt_magic = struct.unpack_from("<H", data, opt_off)[0]
                if opt_magic == 0x20B:
                    return "PE32+"
                if opt_magic == 0x10B:
                    return "PE32"
            return "PE"
    if data[:4] in MACHO_MAGICS:
        if data[:4] in (b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe"):
            return "Mach-O 64-bit"
        if data[:4] in (b"\xfe\xed\xfa\xce", b"\xce\xfa\xed\xfe"):
            return "Mach-O 32-bit"
        # Distinguish Mach-O fat binary from Java class file (both start with CAFEBABE)
        if len(data) >= 8:
            nfat_arch = struct.unpack_from(">I", data, 4)[0]
            if 1 <= nfat_arch <= 16:
                return "Mach-O Universal"
        return None
    if data[:4] == b"\x00asm" and len(data) >= 8:
        return "WASM"
    return None


def _read_cstr(buf: bytes, offset: int) -> str:
    if offset < 0 or offset >= len(buf):
        return ""
    end = buf.find(b"\x00", offset)
    if end == -1:
        end = min(len(buf), offset + 128)
    return buf[offset:end].decode("utf-8", errors="replace")


def parse_binary_headers_and_sections(data: bytes) -> Dict[str, Any]:
    """Pure-Python struct parser for ELF32/64, PE32/32+, Mach-O 32/64, and WASM."""
    fmt = detect_binary_magic(data)
    if not fmt:
        raise ValueError("Target is not a recognized executable binary (ELF/PE/Mach-O/WASM)")

    overall_entropy = compute_shannon_entropy(data)
    result: Dict[str, Any] = {
        "format": fmt,
        "arch": "unknown",
        "endianness": "little",
        "entry_point": "0x0",
        "size_bytes": len(data),
        "overall_entropy": overall_entropy,
        "overall_status": classify_entropy(overall_entropy),
        "sections": [],
        "packed_sections": 0,
    }

    if fmt in ("ELF32", "ELF64", "ELF"):
        is_64 = (len(data) >= 5 and data[4] == 2)
        is_be = (len(data) >= 6 and data[5] == 2)
        endian = ">" if is_be else "<"
        result["endianness"] = "big" if is_be else "little"
        result["format"] = "ELF64" if is_64 else "ELF32"

        machine_map = {
            0x03: "x86",
            0x08: "MIPS",
            0x14: "PowerPC",
            0x28: "ARM",
            0x3E: "x86_64",
            0xB7: "AArch64",
            0xF3: "RISC-V",
        }
        if is_64 and len(data) >= 64:
            e_type, e_machine, _e_ver, e_entry, _e_phoff, e_shoff, _e_flags, _e_ehsize, _e_phentsize, _e_phnum, e_shentsize, e_shnum, e_shstrndx = struct.unpack_from(
                f"{endian}HHIQQQIHHHHHH", data, 16
            )
            result["arch"] = machine_map.get(e_machine, f"ELF-Machine-0x{e_machine:x}")
            result["entry_point"] = hex(e_entry)
            shstr_data = b""
            if e_shoff > 0 and e_shnum > 0 and e_shentsize >= 64 and e_shstrndx < e_shnum:
                str_hdr_off = e_shoff + e_shstrndx * e_shentsize
                if str_hdr_off + 64 <= len(data):
                    sh_off, sh_sz = struct.unpack_from(f"{endian}QQ", data, str_hdr_off + 24)
                    if sh_off + sh_sz <= len(data):
                        shstr_data = data[sh_off:sh_off + sh_sz]
            for i in range(min(e_shnum, 256)):
                off = e_shoff + i * e_shentsize
                if off + 64 > len(data):
                    break
                sh_name, sh_type, sh_flags, sh_addr, sh_offset, sh_size = struct.unpack_from(
                    f"{endian}IIQQQQ", data, off
                )
                sec_name = _read_cstr(shstr_data, sh_name) or f"section_{i}"
                sec_bytes = b""
                if sh_type != 8 and sh_size > 0 and sh_offset + sh_size <= len(data):
                    sec_bytes = data[sh_offset:sh_offset + sh_size]
                ent = compute_shannon_entropy(sec_bytes)
                flags_str = "".join(
                    ch for bit, ch in ((0x1, "W"), (0x2, "A"), (0x4, "X")) if sh_flags & bit
                ) or "-"
                result["sections"].append({
                    "name": sec_name,
                    "vaddr": hex(sh_addr),
                    "offset": hex(sh_offset),
                    "size": sh_size,
                    "flags": flags_str,
                    "entropy": ent,
                    "status": classify_entropy(ent),
                    "packed": ent >= 7.0,
                })
        elif not is_64 and len(data) >= 52:
            e_type, e_machine, _e_ver, e_entry, _e_phoff, e_shoff, _e_flags, _e_ehsize, _e_phentsize, _e_phnum, e_shentsize, e_shnum, e_shstrndx = struct.unpack_from(
                f"{endian}HHIIIIIHHHHHH", data, 16
            )
            result["arch"] = machine_map.get(e_machine, f"ELF-Machine-0x{e_machine:x}")
            result["entry_point"] = hex(e_entry)
            shstr_data = b""
            if e_shoff > 0 and e_shnum > 0 and e_shentsize >= 40 and e_shstrndx < e_shnum:
                str_hdr_off = e_shoff + e_shstrndx * e_shentsize
                if str_hdr_off + 40 <= len(data):
                    sh_off, sh_sz = struct.unpack_from(f"{endian}II", data, str_hdr_off + 16)
                    if sh_off + sh_sz <= len(data):
                        shstr_data = data[sh_off:sh_off + sh_sz]
            for i in range(min(e_shnum, 256)):
                off = e_shoff + i * e_shentsize
                if off + 40 > len(data):
                    break
                sh_name, sh_type, sh_flags, sh_addr, sh_offset, sh_size = struct.unpack_from(
                    f"{endian}IIIIII", data, off
                )
                sec_name = _read_cstr(shstr_data, sh_name) or f"section_{i}"
                sec_bytes = b""
                if sh_type != 8 and sh_size > 0 and sh_offset + sh_size <= len(data):
                    sec_bytes = data[sh_offset:sh_offset + sh_size]
                ent = compute_shannon_entropy(sec_bytes)
                flags_str = "".join(
                    ch for bit, ch in ((0x1, "W"), (0x2, "A"), (0x4, "X")) if sh_flags & bit
                ) or "-"
                result["sections"].append({
                    "name": sec_name,
                    "vaddr": hex(sh_addr),
                    "offset": hex(sh_offset),
                    "size": sh_size,
                    "flags": flags_str,
                    "entropy": ent,
                    "status": classify_entropy(ent),
                    "packed": ent >= 7.0,
                })

    elif fmt in ("PE32", "PE32+", "PE"):
        e_lfanew = struct.unpack_from("<I", data, 0x3C)[0]
        coff_off = e_lfanew + 4
        if coff_off + 20 <= len(data):
            machine, num_sections, _ts, _sym_ptr, _num_syms, opt_size, _chars = struct.unpack_from(
                "<HHIIIHH", data, coff_off
            )
            pe_machines = {
                0x014C: "x86 (i386)",
                0x8664: "x86_64 (AMD64)",
                0xAA64: "ARM64",
                0x01C0: "ARM",
            }
            result["arch"] = pe_machines.get(machine, f"PE-Machine-0x{machine:x}")
            opt_off = coff_off + 20
            if opt_size >= 24 and opt_off + 24 <= len(data):
                opt_magic = struct.unpack_from("<H", data, opt_off)[0]
                entry_rva = struct.unpack_from("<I", data, opt_off + 16)[0]
                image_base = 0
                if opt_magic == 0x20B and opt_off + 32 <= len(data):
                    result["format"] = "PE32+"
                    image_base = struct.unpack_from("<Q", data, opt_off + 24)[0]
                elif opt_magic == 0x10B and opt_off + 32 <= len(data):
                    result["format"] = "PE32"
                    image_base = struct.unpack_from("<I", data, opt_off + 28)[0]
                result["entry_point"] = hex(image_base + entry_rva)
            sec_table_off = opt_off + opt_size
            for i in range(min(num_sections, 128)):
                off = sec_table_off + i * 40
                if off + 40 > len(data):
                    break
                raw_name, virt_size, virt_addr, raw_size, raw_ptr, _r1, _r2, _r3, _r4, characteristics = struct.unpack_from(
                    "<8sIIIIIIHHI", data, off
                )
                sec_name = raw_name.split(b"\x00", 1)[0].decode("utf-8", errors="replace") or f"sec_{i}"
                sec_bytes = data[raw_ptr:raw_ptr + raw_size] if raw_size > 0 and raw_ptr + raw_size <= len(data) else b""
                ent = compute_shannon_entropy(sec_bytes)
                flags_str = "".join(
                    ch
                    for bit, ch in ((0x40000000, "R"), (0x80000000, "W"), (0x20000000, "X"))
                    if characteristics & bit
                ) or "-"
                result["sections"].append({
                    "name": sec_name,
                    "vaddr": hex(virt_addr),
                    "offset": hex(raw_ptr),
                    "size": raw_size or virt_size,
                    "flags": flags_str,
                    "entropy": ent,
                    "status": classify_entropy(ent),
                    "packed": ent >= 7.0,
                })

    elif fmt.startswith("Mach-O"):
        magic = data[:4]
        is_64 = magic in (b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe")
        is_be = magic in (b"\xfe\xed\xfa\xce", b"\xfe\xed\xfa\xcf", b"\xca\xfe\xba\xbe")
        endian = ">" if is_be else "<"
        result["endianness"] = "big" if is_be else "little"
        cpu_map = {
            0x00000007: "x86",
            0x01000007: "x86_64",
            0x0000000C: "ARM",
            0x0100000C: "ARM64",
        }
        if fmt == "Mach-O Universal":
            result["arch"] = "Universal Fat"
        else:
            hdr_size = 32 if is_64 else 28
            if len(data) >= hdr_size:
                if is_64:
                    _m, cputype, _sub, _ftype, ncmds, _sizeofcmds, _flags, _res = struct.unpack_from(
                        f"{endian}IIIIIIII", data, 0
                    )
                else:
                    _m, cputype, _sub, _ftype, ncmds, _sizeofcmds, _flags = struct.unpack_from(
                        f"{endian}IIIIIII", data, 0
                    )
                result["arch"] = cpu_map.get(cputype, f"MachO-CPU-0x{cputype:x}")
                cmd_off = hdr_size
                for _ in range(min(ncmds, 128)):
                    if cmd_off + 8 > len(data):
                        break
                    cmd, cmdsize = struct.unpack_from(f"{endian}II", data, cmd_off)
                    if cmdsize < 8 or cmd_off + cmdsize > len(data):
                        break
                    if cmd == 0x80000028 and cmdsize >= 24:  # LC_MAIN
                        entryoff = struct.unpack_from(f"{endian}Q", data, cmd_off + 8)[0]
                        result["entry_point"] = hex(entryoff)
                    elif cmd == 0x19 and cmdsize >= 72:  # LC_SEGMENT_64
                        segname_raw, vmaddr, _vmsz, _fileoff, _filesz, _maxp, initprot, nsects = struct.unpack_from(
                            f"{endian}16sQQQQIII", data, cmd_off + 8
                        )
                        segname = segname_raw.split(b"\x00", 1)[0].decode("utf-8", errors="replace")
                        sect_off = cmd_off + 72
                        for _s in range(min(nsects, 64)):
                            if sect_off + 80 > cmd_off + cmdsize:
                                break
                            s_name_raw, s_seg_raw, s_addr, s_size, s_offset = struct.unpack_from(
                                f"{endian}16s16sQQI", data, sect_off
                            )
                            s_name = s_name_raw.split(b"\x00", 1)[0].decode("utf-8", errors="replace")
                            s_seg = s_seg_raw.split(b"\x00", 1)[0].decode("utf-8", errors="replace") or segname
                            sec_bytes = data[s_offset:s_offset + s_size] if s_size > 0 and s_offset + s_size <= len(data) else b""
                            ent = compute_shannon_entropy(sec_bytes)
                            flags_str = "".join(
                                ch for bit, ch in ((1, "R"), (2, "W"), (4, "X")) if initprot & bit
                            ) or "-"
                            result["sections"].append({
                                "name": f"{s_seg}.{s_name}",
                                "vaddr": hex(s_addr),
                                "offset": hex(s_offset),
                                "size": s_size,
                                "flags": flags_str,
                                "entropy": ent,
                                "status": classify_entropy(ent),
                                "packed": ent >= 7.0,
                            })
                            sect_off += 80
                    elif cmd == 0x1 and cmdsize >= 56:  # LC_SEGMENT (32-bit)
                        segname_raw, _vmaddr, _vmsz, _fileoff, _filesz, _maxp, initprot, nsects = struct.unpack_from(
                            f"{endian}16sIIIIIII", data, cmd_off + 8
                        )
                        segname = segname_raw.split(b"\x00", 1)[0].decode("utf-8", errors="replace")
                        sect_off = cmd_off + 56
                        for _s in range(min(nsects, 64)):
                            if sect_off + 68 > cmd_off + cmdsize:
                                break
                            s_name_raw, s_seg_raw, s_addr, s_size, s_offset = struct.unpack_from(
                                f"{endian}16s16sIII", data, sect_off
                            )
                            s_name = s_name_raw.split(b"\x00", 1)[0].decode("utf-8", errors="replace")
                            s_seg = s_seg_raw.split(b"\x00", 1)[0].decode("utf-8", errors="replace") or segname
                            sec_bytes = data[s_offset:s_offset + s_size] if s_size > 0 and s_offset + s_size <= len(data) else b""
                            ent = compute_shannon_entropy(sec_bytes)
                            flags_str = "".join(
                                ch for bit, ch in ((1, "R"), (2, "W"), (4, "X")) if initprot & bit
                            ) or "-"
                            result["sections"].append({
                                "name": f"{s_seg}.{s_name}",
                                "vaddr": hex(s_addr),
                                "offset": hex(s_offset),
                                "size": s_size,
                                "flags": flags_str,
                                "entropy": ent,
                                "status": classify_entropy(ent),
                                "packed": ent >= 7.0,
                            })
                            sect_off += 68
                    cmd_off += cmdsize

    elif fmt == "WASM":
        result["arch"] = "WebAssembly (wasm32)"
        result["entry_point"] = "0x8"
        wasm_sec_names = {
            0: "custom", 1: "type", 2: "import", 3: "function", 4: "table",
            5: "memory", 6: "global", 7: "export", 8: "start", 9: "element",
            10: "code", 11: "data", 12: "datacount",
        }
        pos = 8
        while pos < len(data):
            sec_id = data[pos]
            pos += 1
            # LEB128 unsigned length
            sec_len = 0
            shift = 0
            while pos < len(data) and shift < 35:
                b = data[pos]
                pos += 1
                sec_len |= (b & 0x7F) << shift
                if not (b & 0x80):
                    break
                shift += 7
            sec_start = pos
            sec_bytes = data[sec_start:sec_start + sec_len]
            ent = compute_shannon_entropy(sec_bytes)
            result["sections"].append({
                "name": wasm_sec_names.get(sec_id, f"sec_{sec_id}"),
                "vaddr": hex(sec_start),
                "offset": hex(sec_start),
                "size": len(sec_bytes),
                "flags": "RX" if sec_id == 10 else "R",
                "entropy": ent,
                "status": classify_entropy(ent),
                "packed": ent >= 7.0,
            })
            pos += sec_len

    result["packed_sections"] = sum(1 for s in result["sections"] if s["packed"])
    return result


def format_hex_dump(data: bytes, base_offset: int = 0) -> List[Dict[str, str]]:
    """Format raw bytes into canonical 16-byte-per-line hex + ASCII dump rows."""
    rows: List[Dict[str, str]] = []
    for i in range(0, len(data), 16):
        chunk = data[i:i + 16]
        hex_left = " ".join(f"{b:02x}" for b in chunk[:8])
        hex_right = " ".join(f"{b:02x}" for b in chunk[8:])
        hex_col = f"{hex_left:<23}  {hex_right:<23}".rstrip()
        ascii_col = "".join(chr(b) if 32 <= b <= 126 else "." for b in chunk)
        addr = f"0x{base_offset + i:08x}"
        rows.append({
            "offset": addr,
            "hex": hex_col,
            "ascii": ascii_col,
            "line": f"{addr}  {hex_col:<48}  |{ascii_col}|",
        })
    return rows


# Demo binary database for offline testing & sandboxed demos
PROGRAMS_DB = [
    {
        "id": "zoth-vault-daemon",
        "name": "zoth-vault-daemon.elf",
        "arch": "x86_64",
        "format": "ELF64",
        "compiler": "rustc 1.82.0 (LLVM 19.1)",
        "entry_point": "0x00401020",
        "total_functions": 42,
        "strings": [
            "127.0.0.1:8787",
            "Zoth Vault Ring-0 Custody Daemon online.",
            "argon2id_kdf_init: memory cost 65536, iterations 3",
            "ERR_SECRET_KEY_NOT_FOUND",
            "/var/run/zoth-vault.sock",
        ],
        "sections": [
            {"name": ".text", "vaddr": "0x401000", "offset": "0x1000", "size": 16384, "flags": "AX", "entropy": 6.1421, "status": "ELEVATED", "packed": False},
            {"name": ".rodata", "vaddr": "0x405000", "offset": "0x5000", "size": 4096, "flags": "A", "entropy": 4.8920, "status": "NORMAL", "packed": False},
            {"name": ".data", "vaddr": "0x406000", "offset": "0x6000", "size": 1024, "flags": "WA", "entropy": 2.4115, "status": "NORMAL", "packed": False},
            {"name": ".vault_blob", "vaddr": "0x407000", "offset": "0x7000", "size": 2048, "flags": "A", "entropy": 7.4812, "status": "PACKED / ENCRYPTED", "packed": True},
        ],
        "demo_bytes": (
            b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 8
            + b"\x03\x00\x3e\x00\x01\x00\x00\x00\x20\x10\x40\x00\x00\x00\x00\x00"
            + b"\xf3\x0f\x1e\xfa\x55\x48\x89\xe5\x48\x83\xec\x50\x89\x7d\xbc\x48"
            + b"Zoth Vault Ring-0 Custody Daemon online.\x00127.0.0.1:8787\x00"
            + b"argon2id_kdf_init\x00chacha20_poly1305_seal_init\x00"
        ),
        "functions": {
            "main": {
                "address": "0x00401020",
                "size": 148,
                "disasm": [
                    "0x00401020:  endbr64",
                    "0x00401024:  push   rbp",
                    "0x00401025:  mov    rbp, rsp",
                    "0x00401028:  sub    rsp, 0x50",
                    "0x0040102c:  mov    DWORD PTR [rbp-0x44], edi",
                    "0x0040102f:  mov    QWORD PTR [rbp-0x50], rsi",
                    "0x00401033:  lea    rdi, [rbp-0x40]",
                    "0x00401037:  mov    esi, 0x2253",
                    "0x0040103c:  call   0x00401200 <vault_init>",
                    "0x00401041:  test   eax, eax",
                    "0x00401043:  jne    0x00401080",
                    "0x00401045:  lea    rdi, [rip+0x20e4]  # \"Zoth Vault Ring-0...\"",
                    "0x0040104c:  call   0x00401310 <log_info>",
                    "0x00401051:  lea    rdi, [rbp-0x40]",
                    "0x00401055:  call   0x004014f0 <event_loop_run>",
                    "0x0040105a:  leave",
                    "0x0040105b:  ret",
                ],
                "pseudocode": """int main(int argc, char **argv) {
    vault_config_t config;
    int status = vault_init(&config, 8787);
    if (status != 0) {
        log_error("Failed to bind vault enclave on 127.0.0.1:8787");
        return 1;
    }
    argon2id_kdf_init(&config.argon_ctx, 64 * 1024, 3, 4);
    chacha20_poly1305_seal_init(&config.aead_ctx);
    log_info("Zoth Vault Ring-0 Custody Daemon online.");
    return event_loop_run(&config);
}""",
            },
            "argon2id_kdf_derive": {
                "address": "0x00401340",
                "size": 256,
                "disasm": [
                    "0x00401340:  push   rbp",
                    "0x00401341:  mov    rbp, rsp",
                    "0x00401344:  sub    rsp, 0x80",
                    "0x00401348:  mov    QWORD PTR [rbp-0x78], rdi",
                    "0x0040134c:  mov    QWORD PTR [rbp-0x80], rsi",
                    "0x00401350:  call   0x00402100 <argon2_fill_first_blocks>",
                    "0x00401355:  leave",
                    "0x00401356:  ret",
                ],
                "pseudocode": """uint8_t *argon2id_kdf_derive(const uint8_t *passphrase, size_t pass_len, const uint8_t *salt, size_t salt_len) {
    argon2_context_t ctx;
    ctx.m_cost = 65536; // 64 MB
    ctx.t_cost = 3;     // 3 passes
    ctx.lanes  = 4;     // 4 parallel threads
    ctx.flags  = ARGON2_FLAG_CLEAR_PASSWORD | ARGON2_FLAG_CLEAR_SECRET;
    return argon2_hash(&ctx, passphrase, pass_len, salt, salt_len);
}""",
            },
        },
    },
    {
        "id": "firmware-auth-arm",
        "name": "firmware_boot.bin",
        "arch": "ARM Cortex-M4 (Thumb-2)",
        "format": "Raw Flash Binary / Microcontroller",
        "compiler": "arm-none-eabi-gcc 13.2.1",
        "entry_point": "0x08000100",
        "total_functions": 28,
        "strings": [
            "ZOTH-SECURE-BOOT-v2",
            "SIGNATURE_VERIFIED",
            "HALT_TAMPER_DETECTED",
        ],
        "sections": [
            {"name": ".isr_vector", "vaddr": "0x08000000", "offset": "0x0", "size": 256, "flags": "A", "entropy": 2.9102, "status": "NORMAL", "packed": False},
            {"name": ".text", "vaddr": "0x08000100", "offset": "0x100", "size": 8192, "flags": "AX", "entropy": 5.8344, "status": "NORMAL", "packed": False},
            {"name": ".rodata", "vaddr": "0x08002100", "offset": "0x2100", "size": 1024, "flags": "A", "entropy": 4.2108, "status": "NORMAL", "packed": False},
        ],
        "demo_bytes": (
            b"\x00\x10\x00\x20\x01\x01\x00\x08\x21\x01\x00\x08\x31\x01\x00\x08"
            + b"\x04\x48\x80\xf3\x08\x88\x00\xf0\xfb\xf8\x00\xf0\x09\xfa\x18\xb9"
            + b"ZOTH-SECURE-BOOT-v2\x00SIGNATURE_VERIFIED\x00HALT_TAMPER_DETECTED\x00"
        ),
        "functions": {
            "Reset_Handler": {
                "address": "0x08000100",
                "size": 96,
                "disasm": [
                    "0x08000100:  ldr    r0, =0x20001000",
                    "0x08000102:  msr    MSP, r0",
                    "0x08000106:  bl     0x08000300 <SystemInit>",
                    "0x0800010a:  bl     0x08000520 <verify_flash_signature>",
                    "0x0800010e:  cbnz   r0, 0x08000118",
                    "0x08000110:  bl     0x08000600 <enter_sovereign_enclave>",
                    "0x08000114:  b      0x08000114",
                    "0x08000118:  bl     0x08000700 <lockdown_tamper>",
                ],
                "pseudocode": """void Reset_Handler(void) {
    __set_MSP(0x20001000);
    SystemInit();
    uint32_t auth_status = verify_flash_signature(FLASH_BASE, FLASH_SIZE);
    if (auth_status == SIGNATURE_OK) {
        enter_sovereign_enclave();
    } else {
        lockdown_tamper();
    }
}""",
            }
        },
    },
    {
        "id": "probe_check.ko",
        "name": "probe_check.ko",
        "arch": "x86_64",
        "format": "ELF64",
        "compiler": "gcc 14.2.0",
        "entry_point": "0x00000000",
        "total_functions": 18,
        "strings": [
            "ZothOS kernel integrity sentinel loaded.",
            "sys_call_table at %px verified against read-only CR0 WP bit",
        ],
        "sections": [
            {"name": ".text", "vaddr": "0x0", "offset": "0x40", "size": 2048, "flags": "AX", "entropy": 5.6122, "status": "NORMAL", "packed": False},
            {"name": ".rodata", "vaddr": "0x840", "offset": "0x840", "size": 512, "flags": "A", "entropy": 4.4410, "status": "NORMAL", "packed": False},
            {"name": ".modinfo", "vaddr": "0xa40", "offset": "0xa40", "size": 256, "flags": "A", "entropy": 4.1098, "status": "NORMAL", "packed": False},
        ],
        "demo_bytes": (
            b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 8
            + b"\x01\x00\x3e\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
            + b"ZothOS kernel integrity sentinel loaded.\x00"
            + b"sys_call_table verified against CR0 WP bit\x00"
        ),
        "functions": {
            "init_module": {
                "address": "0x00000000",
                "size": 96,
                "disasm": [
                    "0x00000000:  endbr64",
                    "0x00000004:  push   rbp",
                    "0x00000005:  mov    rbp, rsp",
                    "0x00000008:  lea    rdi, [rip+0x200]  # \"ZothOS kernel integrity sentinel loaded.\"",
                    "0x0000000f:  call   0x00000000 <_printk>",
                    "0x00000014:  call   0x00000060 <hook_sys_call_table_verifier>",
                    "0x00000019:  xor    eax, eax",
                    "0x0000001b:  pop    rbp",
                    "0x0000001c:  ret",
                ],
                "pseudocode": """int init_module(void) {
    pr_info("ZothOS kernel integrity sentinel loaded.\\n");
    hook_sys_call_table_verifier();
    register_kprobe(&kp_execve);
    return 0;
}""",
            },
            "hook_sys_call_table_verifier": {
                "address": "0x00000060",
                "size": 180,
                "disasm": [
                    "0x00000060:  endbr64",
                    "0x00000064:  lea    rdi, [rip+0x240]  # \"sys_call_table\"",
                    "0x0000006b:  call   0x00000000 <kallsyms_lookup_name>",
                    "0x00000070:  test   rax, rax",
                    "0x00000073:  je     0x00000084",
                    "0x00000075:  mov    rsi, rax",
                    "0x00000078:  call   0x00000000 <_printk>",
                    "0x00000084:  ret",
                ],
                "pseudocode": """static void hook_sys_call_table_verifier(void) {
    unsigned long *sys_call_table = (unsigned long *)kallsyms_lookup_name("sys_call_table");
    if (!sys_call_table) return;
    pr_info("sys_call_table at %px verified against read-only CR0 WP bit\\n", sys_call_table);
}""",
            },
        },
    },
]

MCP_TOOLS = [
    {
        "name": "list_methods",
        "description": "Enumerate exported, internal, and dynamic functions for a target executable binary.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
                "filter": {"type": "string", "description": "Optional substring filter for function names"},
            },
            "required": ["program_id"],
        },
    },
    {
        "name": "decompile_function",
        "description": "Decompile target function symbol or address to C pseudocode AST with active variable annotations.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
                "function": {"type": "string", "description": "Function name or hexadecimal address to decompile"},
                "engine": {"type": "string", "description": "Decompiler engine: auto, r2, or ghidra"},
            },
            "required": ["program_id", "function"],
        },
    },
    {
        "name": "disassemble_function",
        "description": "Disassemble target function symbol or address to native Intel or AT&T instructions.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
                "function": {"type": "string", "description": "Function name or hexadecimal address to disassemble"},
                "syntax": {"type": "string", "description": "Assembly syntax: intel or att"},
            },
            "required": ["program_id", "function"],
        },
    },
    {
        "name": "search_strings",
        "description": "Scan binary data sections for ASCII/UTF-8 string literals with hexadecimal file offsets.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
                "query": {"type": "string", "description": "Optional string substring query filter"},
                "min_len": {"type": "integer", "description": "Minimum string length (1-256, default: 4)"},
            },
            "required": ["program_id"],
        },
    },
    {
        "name": "get_xrefs",
        "description": "Search cross-references or call sites to the specified symbol or address in binary.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
                "target": {"type": "string", "description": "Symbol name or address to find references to"},
            },
            "required": ["program_id", "target"],
        },
    },
    {
        "name": "annotate_variable",
        "description": "Rename a local stack/register variable in session annotation store and apply it to decompiled/disassembled output.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
                "function": {"type": "string", "description": "Function name containing the variable"},
                "old_name": {"type": "string", "description": "Original symbol/variable identifier"},
                "new_name": {"type": "string", "description": "Replacement identifier"},
            },
            "required": ["program_id", "function", "old_name", "new_name"],
        },
    },
    {
        "name": "inspect_sections_and_entropy",
        "description": "Parse ELF/PE/Mach-O/WASM binary headers, section table, and per-section Shannon entropy (flagging packed/encrypted sections >= 7.0 bits/byte).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
            },
            "required": ["program_id"],
        },
    },
    {
        "name": "read_hex_dump",
        "description": "Read a bounded 16-byte-per-line hexadecimal and ASCII dump from a target executable binary.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Target binary ID or filesystem path"},
                "offset": {"type": "integer", "description": "Starting byte offset (>= 0, default: 0)"},
                "length": {"type": "integer", "description": "Byte count to inspect (16-4096, default: 256)"},
            },
            "required": ["program_id"],
        },
    },
]

MCP_TOOL_NAMES = {t["name"] for t in MCP_TOOLS}

# In-memory session variable annotations store: (canonical_target, function, old_name) -> new_name
ANNOTATIONS_STORE: Dict[Tuple[str, str, str], str] = {}


class BinaryAnalyzer:
    """Hardened binary analysis, header/section/entropy parsing, and decompilation engine."""

    def __init__(self, use_capsule_jail: bool = False):
        self.use_capsule_jail = use_capsule_jail
        self.capsule_jail_bin = (
            shutil.which("agent-capsule-jail")
            or os.path.expanduser("~/.local/bin/agent-capsule-jail")
        )
        self.r2_bin = shutil.which("radare2") or shutil.which("r2") or "/usr/bin/r2"
        self.objdump_bin = shutil.which("objdump") or "/usr/bin/objdump"
        self.readelf_bin = shutil.which("readelf") or "/usr/bin/readelf"
        self.nm_bin = shutil.which("nm") or "/usr/bin/nm"
        self.strings_bin = shutil.which("strings") or "/usr/bin/strings"
        self.ghidra_headless = "/usr/share/ghidra/support/analyzeHeadless"

    def is_ghidra_installed(self) -> bool:
        return os.path.isfile(self.ghidra_headless) and os.access(self.ghidra_headless, os.X_OK)

    def is_r2_installed(self) -> bool:
        return bool(shutil.which("r2") or shutil.which("radare2") or os.path.isfile(self.r2_bin))

    def is_capsule_jail_available(self) -> bool:
        return os.path.isfile(self.capsule_jail_bin) and os.access(self.capsule_jail_bin, os.X_OK)

    def get_engines_status(self) -> Dict[str, Any]:
        return {
            "ghidra_headless": "READY" if self.is_ghidra_installed() else "UNAVAILABLE",
            "radare2": "READY" if self.is_r2_installed() else "UNAVAILABLE",
            "objdump": "READY" if shutil.which("objdump") else "UNAVAILABLE",
            "readelf": "READY" if shutil.which("readelf") else "UNAVAILABLE",
            "strings": "READY" if shutil.which("strings") else "UNAVAILABLE",
            "nm": "READY" if shutil.which("nm") else "UNAVAILABLE",
            "agent_capsule_jail": "READY" if self.is_capsule_jail_available() else "UNAVAILABLE",
            "pure_python_binary_parser": "READY",
        }

    def execute_command(
        self, cmd: List[str], timeout: float = 12.0, force_jail: bool = False
    ) -> Tuple[int, str, str]:
        """Execute command safely with resource quotas or agent-capsule-jail sandbox."""
        use_jail = (force_jail or self.use_capsule_jail) and self.is_capsule_jail_available()

        if use_jail:
            jail_cmd = [
                self.capsule_jail_bin, "exec", "--json", "--quiet",
                "--timeout", str(timeout), "--",
            ] + cmd
            try:
                p = subprocess.run(jail_cmd, capture_output=True, text=True, timeout=timeout + 4.0)
                if p.stdout.strip().startswith("{"):
                    try:
                        data = json.loads(p.stdout)
                        return (
                            data.get("exit_code", 0),
                            data.get("stdout", ""),
                            data.get("stderr", ""),
                        )
                    except json.JSONDecodeError:
                        pass
                return p.returncode, p.stdout, p.stderr
            except subprocess.TimeoutExpired:
                return -1, "", f"Execution timed out after {timeout}s in capsule jail"
            except Exception:
                pass

        def _set_resource_limits():
            try:
                import resource
                resource.setrlimit(resource.RLIMIT_CPU, (15, 20))
                resource.setrlimit(resource.RLIMIT_AS, (1536 * 1024 * 1024, 1536 * 1024 * 1024))
                resource.setrlimit(resource.RLIMIT_FSIZE, (50 * 1024 * 1024, 50 * 1024 * 1024))
            except Exception:
                pass

        try:
            p = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                preexec_fn=_set_resource_limits,
            )
            return p.returncode, p.stdout, p.stderr
        except subprocess.TimeoutExpired:
            return -1, "", f"Execution timed out after {timeout}s"
        except Exception as e:
            return -1, "", str(e)

    def _verify_executable_binary(self, path: str) -> str:
        """Verify file on disk is a recognized executable binary (ELF/PE/Mach-O/WASM)."""
        try:
            with open(path, "rb") as f:
                header = f.read(4096)
        except OSError as e:
            raise PermissionError(f"Cannot read binary target '{path}': {e}") from e

        fmt = detect_binary_magic(header)
        if not fmt:
            raise PermissionError(
                "Target is not a recognized executable binary (ELF/PE/Mach-O/WASM)"
            )
        return fmt

    def resolve_target(self, target: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Resolve target string to a demo program DB entry or a verified executable binary."""
        if not isinstance(target, str):
            raise ValueError("Target program must be a string")
        target = target.strip()
        if "\x00" in target:
            raise ValueError("Target contains invalid null byte")

        # 1. Check demo database (including alias for kernel-module-rootkit-probe)
        if target in ("default", ""):
            return True, PROGRAMS_DB[0]["id"], PROGRAMS_DB[0]
        if target == "kernel-module-rootkit-probe":
            target = "probe_check.ko"
        for prog in PROGRAMS_DB:
            if prog["id"] == target or prog["name"] == target:
                return True, prog["id"], prog

        # 2. Resolve direct filesystem path / PATH lookup / standard system bin dirs
        candidate_path: Optional[str] = None
        expanded = os.path.abspath(os.path.expanduser(target))
        if os.path.isfile(expanded):
            candidate_path = expanded
        else:
            resolved = shutil.which(target)
            if resolved and os.path.isfile(resolved):
                candidate_path = os.path.abspath(resolved)
            else:
                for prefix in ("/bin", "/usr/bin", "/usr/local/bin", "/sbin", "/usr/sbin"):
                    candidate = os.path.join(prefix, target)
                    if os.path.isfile(candidate):
                        candidate_path = os.path.abspath(candidate)
                        break

        if not candidate_path:
            raise FileNotFoundError(
                f"Binary target '{target}' could not be resolved on filesystem or in database"
            )

        # Enforce executable binary magic check (reject plaintext/config/secret files)
        self._verify_executable_binary(candidate_path)
        return False, candidate_path, None

    def _get_annotations_for(self, target_key: str, function: str) -> Dict[str, str]:
        """Return active variable renames for (target_key, function)."""
        found: Dict[str, str] = {}
        for (t_key, fn_key, old_name), new_name in ANNOTATIONS_STORE.items():
            if t_key == target_key and fn_key == function:
                found[old_name] = new_name
        return found

    def _apply_annotations(
        self,
        target_key: str,
        function: str,
        pseudocode: Optional[str] = None,
        disasm: Optional[List[str]] = None,
    ) -> Tuple[Optional[str], Optional[List[str]], Dict[str, str]]:
        """Apply whole-word variable renames and header comment from ANNOTATIONS_STORE."""
        anns = self._get_annotations_for(target_key, function)
        if not anns:
            return pseudocode, disasm, {}

        summary = ", ".join(f"{old} -> {new}" for old, new in anns.items())
        new_pseudo = pseudocode
        if new_pseudo is not None:
            for old_name, new_name in anns.items():
                new_pseudo = re.sub(rf"\b{re.escape(old_name)}\b", new_name, new_pseudo)
            new_pseudo = f"/* Zoth Annotations: {summary} */\n{new_pseudo}"

        new_disasm = disasm
        if new_disasm is not None:
            updated_lines = [f"; Zoth Annotations: {summary}"]
            for line in new_disasm:
                updated = line
                for old_name, new_name in anns.items():
                    updated = re.sub(rf"\b{re.escape(old_name)}\b", new_name, updated)
                updated_lines.append(updated)
            new_disasm = updated_lines

        return new_pseudo, new_disasm, anns

    def inspect_sections_and_entropy(self, target: str) -> Dict[str, Any]:
        """Parse binary headers, section table, and per-section Shannon entropy."""
        is_demo, path_or_id, demo_prog = self.resolve_target(target)
        if is_demo and demo_prog:
            sections = list(demo_prog.get("sections", []))
            demo_bytes = demo_prog.get("demo_bytes", b"")
            overall_ent = compute_shannon_entropy(demo_bytes)
            packed_count = sum(1 for s in sections if s.get("packed"))
            return {
                "program": demo_prog["id"],
                "name": demo_prog["name"],
                "format": demo_prog["format"],
                "arch": demo_prog["arch"],
                "entry_point": demo_prog["entry_point"],
                "size_bytes": len(demo_bytes),
                "overall_entropy": overall_ent,
                "overall_status": classify_entropy(overall_ent),
                "packed_sections": packed_count,
                "sections_count": len(sections),
                "sections": sections,
                "is_demo": True,
            }

        path = path_or_id
        with open(path, "rb") as f:
            data = f.read()
        parsed = parse_binary_headers_and_sections(data)
        return {
            "program": path,
            "name": Path(path).name,
            "path": path,
            "format": parsed["format"],
            "arch": parsed["arch"],
            "endianness": parsed["endianness"],
            "entry_point": parsed["entry_point"],
            "size_bytes": parsed["size_bytes"],
            "overall_entropy": parsed["overall_entropy"],
            "overall_status": parsed["overall_status"],
            "packed_sections": parsed["packed_sections"],
            "sections_count": len(parsed["sections"]),
            "sections": parsed["sections"],
            "is_demo": False,
        }

    def read_hex_dump(self, target: str, offset: int = 0, length: int = 256) -> Dict[str, Any]:
        """Read bounded 16-byte-per-line hex + ASCII dump from binary."""
        if not isinstance(offset, int) or offset < 0:
            raise ValueError("offset must be an integer >= 0")
        if not isinstance(length, int) or length < 16 or length > 4096:
            raise ValueError("length must be an integer between 16 and 4096")

        is_demo, path_or_id, demo_prog = self.resolve_target(target)
        if is_demo and demo_prog:
            raw = demo_prog.get("demo_bytes", b"")
            sliced = raw[offset:offset + length]
            rows = format_hex_dump(sliced, base_offset=offset)
            return {
                "program": demo_prog["id"],
                "name": demo_prog["name"],
                "offset": offset,
                "length": len(sliced),
                "total_bytes": len(raw),
                "rows": rows,
                "dump": "\n".join(r["line"] for r in rows),
                "is_demo": True,
            }

        path = path_or_id
        total_size = os.path.getsize(path)
        with open(path, "rb") as f:
            f.seek(offset)
            chunk = f.read(length)
        rows = format_hex_dump(chunk, base_offset=offset)
        return {
            "program": path,
            "name": Path(path).name,
            "offset": offset,
            "length": len(chunk),
            "total_bytes": total_size,
            "rows": rows,
            "dump": "\n".join(r["line"] for r in rows),
            "is_demo": False,
        }

    def inspect_binary(self, target: str, force_jail: bool = False) -> Dict[str, Any]:
        """Inspect binary metadata, format, architecture, entropy, and sections."""
        is_demo, path_or_id, demo_prog = self.resolve_target(target)
        if is_demo and demo_prog:
            sections = demo_prog.get("sections", [])
            overall_ent = compute_shannon_entropy(demo_prog.get("demo_bytes", b""))
            return {
                "id": demo_prog["id"],
                "name": demo_prog["name"],
                "arch": demo_prog["arch"],
                "format": demo_prog["format"],
                "compiler": demo_prog["compiler"],
                "entry_point": demo_prog["entry_point"],
                "size_bytes": 65536,
                "total_functions": demo_prog["total_functions"],
                "strings_count": len(demo_prog["strings"]),
                "overall_entropy": overall_ent,
                "sections_count": len(sections),
                "packed_sections": sum(1 for s in sections if s.get("packed")),
                "is_demo": True,
            }

        path = path_or_id
        with open(path, "rb") as f:
            raw_bytes = f.read()
        file_size = len(raw_bytes)
        sha256 = hashlib.sha256(raw_bytes).hexdigest()

        parsed = parse_binary_headers_and_sections(raw_bytes)
        fmt = parsed["format"]
        arch = parsed["arch"]
        entry_point = parsed["entry_point"]

        # Optional file(1) description for extra context
        _, f_out, _ = self.execute_command(["file", "-b", "--", path], timeout=4.0, force_jail=force_jail)
        file_desc = f_out.strip() or f"{fmt} ({arch})"

        # Compiler detection from .comment section on ELF binaries
        compiler = "unknown"
        if fmt.startswith("ELF") and shutil.which("readelf"):
            _, c_out, _ = self.execute_command(
                [self.readelf_bin, "-p", ".comment", "--", path], timeout=3.0, force_jail=force_jail
            )
            for line in c_out.splitlines():
                line_s = line.strip()
                if "GCC:" in line_s or "clang" in line_s or "rustc" in line_s:
                    compiler = line_s
                    break

        methods = self.list_methods(path, force_jail=force_jail)

        return {
            "id": Path(path).stem,
            "name": Path(path).name,
            "path": path,
            "arch": arch,
            "format": fmt,
            "endianness": parsed["endianness"],
            "file_description": file_desc,
            "compiler": compiler,
            "entry_point": entry_point,
            "size_bytes": file_size,
            "sha256": sha256,
            "overall_entropy": parsed["overall_entropy"],
            "overall_status": parsed["overall_status"],
            "sections_count": len(parsed["sections"]),
            "packed_sections": parsed["packed_sections"],
            "total_functions": len(methods),
            "is_demo": False,
        }

    def list_methods(
        self, target: str, filter_query: Optional[str] = None, force_jail: bool = False
    ) -> List[Dict[str, Any]]:
        """List exported, dynamic, and internal functions in binary."""
        is_demo, path_or_id, demo_prog = self.resolve_target(target)
        if is_demo and demo_prog:
            res = []
            for name, fn in demo_prog["functions"].items():
                if not filter_query or filter_query.lower() in name.lower():
                    res.append({
                        "name": name,
                        "address": fn["address"],
                        "size": fn["size"],
                        "type": "exported",
                    })
            return res

        path = path_or_id
        methods_map: Dict[str, Dict[str, Any]] = {}

        # 1. Unstripped symbol table via readelf -s -W
        _, s_out, _ = self.execute_command(
            [self.readelf_bin, "-s", "-W", "--", path], timeout=6.0, force_jail=force_jail
        )
        for line in s_out.splitlines():
            parts = line.strip().split()
            if len(parts) >= 8 and parts[3] == "FUNC":
                addr_hex = parts[1]
                addr = f"0x{addr_hex.lstrip('0')}" if addr_hex != "0000000000000000" else "0x0"
                size = int(parts[2]) if parts[2].isdigit() else 0
                name = parts[7].split("@")[0]
                bind = parts[4].lower()
                if name and not name.startswith("$"):
                    methods_map[name] = {
                        "name": name,
                        "address": addr,
                        "size": size,
                        "type": "export" if bind in ("global", "weak") else "internal",
                    }

        # 2. Dynamic symbol table via readelf --dyn-syms -W
        _, dyn_out, _ = self.execute_command(
            [self.readelf_bin, "--dyn-syms", "-W", "--", path], timeout=5.0, force_jail=force_jail
        )
        for line in dyn_out.splitlines():
            parts = line.strip().split()
            if len(parts) >= 8 and parts[3] == "FUNC":
                name = parts[7].split("@")[0]
                if name and name not in methods_map:
                    addr_hex = parts[1]
                    addr = f"0x{addr_hex.lstrip('0')}" if addr_hex != "0000000000000000" else "0x0"
                    size = int(parts[2]) if parts[2].isdigit() else 0
                    is_und = parts[6] == "UND"
                    methods_map[name] = {
                        "name": name,
                        "address": addr,
                        "size": size,
                        "type": "import" if is_und else "export",
                    }

        # 3. Radare2 function analysis (afl) to recover stripped functions & main
        if self.is_r2_installed():
            _, r2_out, _ = self.execute_command(
                [self.r2_bin, "-e", "scr.color=0", "-q", "-c", "aa; afl", "--", path],
                timeout=8.0,
                force_jail=force_jail,
            )
            for line in r2_out.splitlines():
                parts = line.strip().split()
                if len(parts) >= 4 and parts[0].startswith("0x"):
                    addr = parts[0]
                    size = int(parts[2]) if parts[2].isdigit() else 0
                    raw_name = parts[3]
                    clean_name = raw_name
                    if clean_name.startswith("sym.imp."):
                        clean_name = clean_name[8:]
                        fn_type = "import"
                    elif clean_name.startswith("sym."):
                        clean_name = clean_name[4:]
                        fn_type = "symbol"
                    else:
                        fn_type = "r2_function"

                    if clean_name and clean_name not in methods_map:
                        methods_map[clean_name] = {
                            "name": clean_name,
                            "address": addr,
                            "size": size,
                            "type": fn_type,
                        }

        # 4. Fallback: objdump disassembly headers if methods_map is still empty
        if not methods_map:
            _, obj_out, _ = self.execute_command(
                [self.objdump_bin, "-d", "--", path], timeout=8.0, force_jail=force_jail
            )
            for line in obj_out.splitlines():
                m = re.match(r"^([0-9a-fA-F]+)\s+<([^>]+)>:", line.strip())
                if m:
                    addr = f"0x{m.group(1).lstrip('0') or '0'}"
                    raw_name = m.group(2).split("@")[0]
                    if raw_name not in methods_map:
                        methods_map[raw_name] = {
                            "name": raw_name,
                            "address": addr,
                            "size": 0,
                            "type": "disasm_label",
                        }

        res = list(methods_map.values())
        if filter_query:
            q = filter_query.lower()
            res = [m for m in res if q in m["name"].lower() or q in m["address"].lower()]

        res.sort(key=lambda m: (m["size"] == 0, m["name"] != "main", m["name"]))
        return res

    def disassemble_function(
        self,
        target: str,
        function: str,
        syntax: str = "intel",
        max_instructions: int = 150,
        force_jail: bool = False,
    ) -> Dict[str, Any]:
        """Disassemble specified function symbol or address to native instructions."""
        safe_fn = validate_symbol_arg(function, "function")
        syntax_opt = "att" if str(syntax).lower() == "att" else "intel"
        is_demo, path_or_id, demo_prog = self.resolve_target(target)

        if is_demo and demo_prog:
            fn_data = demo_prog["functions"].get(safe_fn)
            if not fn_data:
                first_key = next(iter(demo_prog["functions"]))
                fn_data = demo_prog["functions"][first_key]
                safe_fn = first_key
            _, annotated_disasm, applied = self._apply_annotations(
                path_or_id, safe_fn, disasm=list(fn_data["disasm"])
            )
            return {
                "program": demo_prog["name"],
                "arch": demo_prog["arch"],
                "function": safe_fn,
                "address": fn_data["address"],
                "size_bytes": fn_data["size"],
                "syntax": syntax_opt,
                "disasm": annotated_disasm or [],
                "annotations": applied,
                "engine": "demo_db",
            }

        path = path_or_id
        meta = self.inspect_binary(path, force_jail=force_jail)
        disasm_lines: List[str] = []
        fn_addr = "0x0"
        fn_size = 0
        engine_used = "objdump"

        if self.is_r2_installed():
            r2_cmd = [
                self.r2_bin,
                "-e", "scr.color=0",
                "-e", f"asm.syntax={syntax_opt}",
                "-q",
                "-c", f"aa; pdf @ {safe_fn}",
                "--",
                path,
            ]
            _, r2_out, _ = self.execute_command(r2_cmd, timeout=8.0, force_jail=force_jail)
            lines = [
                l for l in r2_out.splitlines()
                if not l.startswith("WARN:") and not l.startswith("INFO:") and not l.startswith("ERROR:")
            ]
            if len(lines) >= 3:
                disasm_lines = lines[:max_instructions]
                engine_used = f"radare2 (pdf, {syntax_opt})"
                for l in lines:
                    m = re.search(r"(0x[0-9a-fA-F]+)", l)
                    if m:
                        fn_addr = m.group(1)
                        break

        if not disasm_lines:
            syntax_flag = ["-M", "intel"] if syntax_opt == "intel" else []
            _, obj_out, _ = self.execute_command(
                [self.objdump_bin, "-d"] + syntax_flag + ["--no-show-raw-insn", f"--disassemble={safe_fn}", "--", path],
                timeout=8.0,
                force_jail=force_jail,
            )
            raw_lines = [l.strip() for l in obj_out.splitlines() if l.strip()]
            in_fn = False
            for l in raw_lines:
                if f"<{safe_fn}>:" in l or (in_fn and l.endswith(">:")):
                    if in_fn:
                        break
                    in_fn = True
                    m = re.match(r"^([0-9a-fA-F]+)", l)
                    if m:
                        fn_addr = f"0x{m.group(1).lstrip('0') or '0'}"
                    continue
                if in_fn:
                    disasm_lines.append(l)
                    if len(disasm_lines) >= max_instructions:
                        break
            if disasm_lines:
                engine_used = f"objdump ({syntax_opt})"

        if not disasm_lines:
            target_addr = safe_fn if safe_fn.startswith("0x") else validate_symbol_arg(meta["entry_point"], "entry_point")
            fn_addr = target_addr
            if self.is_r2_installed():
                _, r2_out, _ = self.execute_command(
                    [self.r2_bin, "-e", "scr.color=0", "-q", "-c", f"pd 40 @ {target_addr}", "--", path],
                    timeout=5.0,
                    force_jail=force_jail,
                )
                disasm_lines = [
                    l for l in r2_out.splitlines()
                    if not l.startswith("WARN:") and not l.startswith("INFO:")
                ][:max_instructions]
                engine_used = "radare2 (pd fallback)"

        _, annotated_disasm, applied = self._apply_annotations(path, safe_fn, disasm=disasm_lines)

        return {
            "program": meta["name"],
            "path": path,
            "arch": meta["arch"],
            "function": safe_fn,
            "address": fn_addr,
            "size_bytes": fn_size or len(disasm_lines) * 4,
            "syntax": syntax_opt,
            "disasm": annotated_disasm or [],
            "annotations": applied,
            "engine": engine_used,
        }

    def decompile_function(
        self,
        target: str,
        function: str,
        engine: str = "auto",
        force_jail: bool = False,
    ) -> Dict[str, Any]:
        """Decompile target function to high-level C pseudocode AST with active variable annotations."""
        safe_fn = validate_symbol_arg(function, "function")
        if engine not in ("auto", "r2", "ghidra", "objdump"):
            engine = "auto"

        is_demo, path_or_id, demo_prog = self.resolve_target(target)
        if is_demo and demo_prog:
            fn_data = demo_prog["functions"].get(safe_fn)
            if not fn_data:
                first_key = next(iter(demo_prog["functions"]))
                fn_data = demo_prog["functions"][first_key]
                safe_fn = first_key
            annotated_pseudo, annotated_disasm, applied = self._apply_annotations(
                path_or_id, safe_fn, pseudocode=fn_data["pseudocode"], disasm=list(fn_data["disasm"])
            )
            return {
                "program": demo_prog["name"],
                "arch": demo_prog["arch"],
                "function": safe_fn,
                "address": fn_data["address"],
                "size_bytes": fn_data["size"],
                "disasm": annotated_disasm or [],
                "pseudocode": annotated_pseudo or "",
                "annotations": applied,
                "engine_used": "demo_db",
            }

        path = path_or_id
        meta = self.inspect_binary(path, force_jail=force_jail)
        disasm_info = self.disassemble_function(path, safe_fn, syntax="intel", force_jail=force_jail)

        pseudocode = ""
        engine_used = "unknown"

        if engine == "ghidra" and self.is_ghidra_installed():
            pseudocode, ok = self._decompile_with_ghidra_headless(path, safe_fn, force_jail=force_jail)
            if ok:
                engine_used = "NSA Ghidra Headless Decompiler"

        if not pseudocode and self.is_r2_installed() and engine in ("auto", "r2"):
            _, r2_out, _ = self.execute_command(
                [self.r2_bin, "-e", "scr.color=0", "-q", "-c", f"aa; pdc @ {safe_fn}", "--", path],
                timeout=12.0,
                force_jail=force_jail,
            )
            clean_lines = [
                l for l in r2_out.splitlines()
                if not l.startswith("WARN:") and not l.startswith("INFO:") and not l.startswith("ERROR:")
            ]
            if len(clean_lines) >= 3 and ("{" in r2_out or "return" in r2_out or "=" in r2_out):
                pseudocode = "\n".join(clean_lines)
                engine_used = "radare2 (pdc C pseudocode)"

        if not pseudocode:
            pseudocode = self._synthesize_c_ast(
                safe_fn, disasm_info["disasm"], disasm_info["address"], meta["arch"]
            )
            engine_used = "AST Synthesizer (disassembly reconstruction)"

        annotated_pseudo, _, applied = self._apply_annotations(path, safe_fn, pseudocode=pseudocode)

        return {
            "program": meta["name"],
            "path": path,
            "arch": meta["arch"],
            "function": safe_fn,
            "address": disasm_info["address"],
            "size_bytes": disasm_info["size_bytes"],
            "disasm": disasm_info["disasm"],
            "pseudocode": annotated_pseudo or "",
            "annotations": applied,
            "engine_used": engine_used,
        }

    def _decompile_with_ghidra_headless(
        self, binary_path: str, function: str, force_jail: bool = False
    ) -> Tuple[str, bool]:
        """Run NSA Ghidra analyzeHeadless with an ephemeral project to decompile function."""
        safe_fn = validate_symbol_arg(function, "function")
        script_content = """import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionIterator;

public class GhidraDecompileHook extends GhidraScript {
    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        String target = args.length > 0 ? args[0] : "main";
        DecompInterface decomp = new DecompInterface();
        decomp.openProgram(currentProgram);
        FunctionIterator iter = currentProgram.getListing().getFunctions(true);
        while (iter.hasNext()) {
            Function fn = iter.next();
            if (fn.getName().equalsIgnoreCase(target) || fn.getEntryPoint().toString().equalsIgnoreCase(target)) {
                DecompileResults res = decomp.decompileFunction(fn, 45, monitor);
                if (res != null && res.getDecompiledFunction() != null) {
                    println("=== GHIDRA_DECOMPILED_BEGIN ===");
                    println(res.getDecompiledFunction().getC());
                    println("=== GHIDRA_DECOMPILED_END ===");
                    return;
                }
            }
        }
        println("=== GHIDRA_FUNCTION_NOT_FOUND ===");
    }
}
"""
        with tempfile.TemporaryDirectory(prefix="ghidra_proj_") as tmpdir:
            script_path = os.path.join(tmpdir, "GhidraDecompileHook.java")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(script_content)

            cmd = [
                self.ghidra_headless,
                tmpdir, "ephemeral_project",
                "-import", binary_path,
                "-scriptPath", tmpdir,
                "-postScript", "GhidraDecompileHook.java", safe_fn,
                "-deleteProject",
                "-readOnly",
            ]
            _, out, _ = self.execute_command(cmd, timeout=30.0, force_jail=force_jail)
            if "=== GHIDRA_DECOMPILED_BEGIN ===" in out:
                start = out.find("=== GHIDRA_DECOMPILED_BEGIN ===") + len("=== GHIDRA_DECOMPILED_BEGIN ===")
                end = out.find("=== GHIDRA_DECOMPILED_END ===")
                return out[start:end].strip(), True

        return "", False

    def _synthesize_c_ast(self, func_name: str, disasm: List[str], address: str, arch: str) -> str:
        """Synthesize structured C pseudocode AST from disassembled assembly instructions."""
        calls = []
        string_refs = []
        for line in disasm:
            if "call" in line or "bl " in line:
                m = re.search(r"<(.*?)>", line)
                if m:
                    calls.append(m.group(1))
            m_str = re.search(r'#\s*"(.*?)"', line)
            if m_str:
                string_refs.append(m_str.group(1))

        calls_unique = list(dict.fromkeys(calls))
        strings_unique = list(dict.fromkeys(string_refs))

        code = [
            f"/* Decompiled AST Reconstruction for '{func_name}' */",
            f"/* Architecture: {arch} | Virtual Address: {address} */",
            f"/* Recovered Calls: {', '.join(calls_unique) if calls_unique else 'None'} */",
            "",
            f"int {func_name}(int argc, char **argv) {{",
        ]
        for s in strings_unique:
            code.append(f'    /* string literal */ "{s}";')
        for c in calls_unique:
            code.append(f"    {c}();")
        code.append("    return 0;")
        code.append("}")
        return "\n".join(code)

    def search_strings(
        self,
        target: str,
        query: Optional[str] = None,
        min_len: int = 4,
        max_results: int = 300,
        force_jail: bool = False,
    ) -> List[Dict[str, Any]]:
        """Search binary for ASCII/UTF-8 strings with hex file offsets."""
        if not isinstance(min_len, int) or min_len < 1 or min_len > 256:
            raise ValueError("min_len must be an integer between 1 and 256")

        is_demo, path_or_id, demo_prog = self.resolve_target(target)
        if is_demo and demo_prog:
            res = []
            for i, s in enumerate(demo_prog["strings"]):
                if len(s) >= min_len and (not query or query.lower() in s.lower()):
                    res.append({"offset": f"0x{1000 + i * 16:x}", "value": s})
            return res

        path = path_or_id
        _, out, _ = self.execute_command(
            [self.strings_bin, "-a", "-t", "x", f"-n{min_len}", "--", path],
            timeout=8.0,
            force_jail=force_jail,
        )

        results = []
        for line in out.splitlines():
            line_s = line.strip()
            if not line_s:
                continue
            parts = line_s.split(maxsplit=1)
            if len(parts) == 2:
                offset_hex = f"0x{parts[0]}"
                val = parts[1]
                if not query or query.lower() in val.lower():
                    results.append({"offset": offset_hex, "value": val})
                    if len(results) >= max_results:
                        break
        return results

    def get_xrefs(
        self,
        target: str,
        symbol_or_addr: str,
        force_jail: bool = False,
    ) -> List[Dict[str, Any]]:
        """Find cross-references, call sites, and data references to symbol or address."""
        safe_sym = validate_symbol_arg(symbol_or_addr, "target")
        is_demo, path_or_id, demo_prog = self.resolve_target(target)
        if is_demo and demo_prog:
            xrefs = []
            for fn_name, fn in demo_prog["functions"].items():
                for insn in fn["disasm"]:
                    if safe_sym.lower() in insn.lower():
                        m_addr = re.match(r"^(0x[0-9a-fA-F]+):", insn)
                        addr = m_addr.group(1) if m_addr else fn["address"]
                        xrefs.append({
                            "caller_function": fn_name,
                            "address": addr,
                            "type": "CALL" if "call" in insn else "DATA",
                            "instruction": insn,
                        })
            return xrefs

        path = path_or_id
        xrefs_found = []
        seen = set()

        if self.is_r2_installed():
            targets_to_try = [safe_sym]
            if not safe_sym.startswith("sym."):
                targets_to_try.extend([f"sym.imp.{safe_sym}", f"sym.{safe_sym}"])

            for t in targets_to_try:
                _, r2_out, _ = self.execute_command(
                    [self.r2_bin, "-e", "scr.color=0", "-q", "-c", f"aa; axt @ {t}", "--", path],
                    timeout=8.0,
                    force_jail=force_jail,
                )
                for line in r2_out.splitlines():
                    m = re.match(r"(\S+)\s+(0x[0-9a-fA-F]+)\s+\[([^\]]+)\]\s+(.*)", line.strip())
                    if m:
                        key = (m.group(1), m.group(2))
                        if key not in seen:
                            seen.add(key)
                            xrefs_found.append({
                                "caller_function": m.group(1),
                                "address": m.group(2),
                                "type": m.group(3),
                                "instruction": m.group(4),
                            })

        if not xrefs_found:
            _, obj_out, _ = self.execute_command(
                [self.objdump_bin, "-d", "-M", "intel", "--", path],
                timeout=10.0,
                force_jail=force_jail,
            )
            current_fn = "unknown"
            for line in obj_out.splitlines():
                m_hdr = re.match(r"^[0-9a-fA-F]+\s+<([^>]+)>:", line.strip())
                if m_hdr:
                    current_fn = m_hdr.group(1).split("@")[0]
                    continue
                if safe_sym.lower() in line.lower() and ("call" in line or "jmp" in line or "lea" in line):
                    m_ins = re.match(r"^\s*([0-9a-fA-F]+):\s+(.*)", line)
                    if m_ins:
                        addr = f"0x{m_ins.group(1)}"
                        ins = m_ins.group(2)
                        key = (current_fn, addr)
                        if key not in seen:
                            seen.add(key)
                            xrefs_found.append({
                                "caller_function": current_fn,
                                "address": addr,
                                "type": "CALL" if "call" in ins else "BRANCH",
                                "instruction": ins,
                            })
                            if len(xrefs_found) >= 50:
                                break

        return xrefs_found

    def annotate_variable(
        self,
        target: str,
        function: str,
        old_name: str,
        new_name: str,
    ) -> Dict[str, Any]:
        """Rename local stack/register variable in session annotation store."""
        safe_fn = validate_symbol_arg(function, "function")
        safe_old = validate_symbol_arg(old_name, "old_name")
        safe_new = validate_symbol_arg(new_name, "new_name")
        _, canonical_target, _ = self.resolve_target(target)

        key = (canonical_target, safe_fn, safe_old)
        ANNOTATIONS_STORE[key] = safe_new
        return {
            "status": "success",
            "target": canonical_target,
            "function": safe_fn,
            "old_name": safe_old,
            "new_name": safe_new,
            "active_annotations": self._get_annotations_for(canonical_target, safe_fn),
            "total_annotations": len(ANNOTATIONS_STORE),
        }


def handle_mcp_request(
    analyzer: BinaryAnalyzer, rpc_req: Any
) -> Tuple[int, Optional[Dict[str, Any]]]:
    """Spec-compliant JSON-RPC 2.0 MCP dispatcher shared by HTTP :8131 and CLI stdio.

    Returns (http_status_code, response_dict_or_None_for_notifications).
    """
    if not isinstance(rpc_req, dict):
        return 400, {
            "jsonrpc": "2.0",
            "id": None,
            "error": {"code": -32600, "message": "Invalid Request: JSON body must be an object"},
        }

    is_notification = "id" not in rpc_req
    rpc_id = rpc_req.get("id")
    method = rpc_req.get("method")
    params = rpc_req.get("params")
    if params is None:
        params = {}

    if not isinstance(method, str) or not method:
        return 400, {
            "jsonrpc": "2.0",
            "id": rpc_id,
            "error": {"code": -32600, "message": "Invalid Request: missing method"},
        }

    if not isinstance(params, dict):
        return 400, {
            "jsonrpc": "2.0",
            "id": rpc_id,
            "error": {"code": -32602, "message": "Invalid params: expected object"},
        }

    # Notifications (no id) require zero reply over stdio / 204 over HTTP
    if is_notification or method.startswith("notifications/"):
        return 204, None

    if method == "initialize":
        return 200, {
            "jsonrpc": "2.0",
            "id": rpc_id,
            "result": {
                "protocolVersion": MCP_PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "ghidra-mcp-bridge",
                    "version": VERSION,
                },
            },
        }

    if method == "ping":
        return 200, {"jsonrpc": "2.0", "id": rpc_id, "result": {}}

    if method == "tools/list":
        return 200, {"jsonrpc": "2.0", "id": rpc_id, "result": {"tools": MCP_TOOLS}}

    if method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments") or {}
        if not isinstance(tool_name, str) or tool_name not in MCP_TOOL_NAMES:
            return 400, {
                "jsonrpc": "2.0",
                "id": rpc_id,
                "error": {
                    "code": -32601,
                    "message": f"Unknown tool: {tool_name}",
                },
            }
        if not isinstance(args, dict):
            return 400, {
                "jsonrpc": "2.0",
                "id": rpc_id,
                "error": {"code": -32602, "message": "Invalid tool arguments: expected object"},
            }

        target = args.get("program_id") or args.get("path") or args.get("program") or "zoth-vault-daemon"
        try:
            if tool_name == "list_methods":
                methods = analyzer.list_methods(target, filter_query=args.get("filter"))
                res = {"content": [{"type": "text", "text": json.dumps([m["name"] for m in methods])}]}
            elif tool_name == "decompile_function":
                fn = args.get("function") or "main"
                engine = args.get("engine") or "auto"
                decomp = analyzer.decompile_function(target, fn, engine=engine)
                res = {"content": [{"type": "text", "text": decomp.get("pseudocode", "")}]}
            elif tool_name == "disassemble_function":
                fn = args.get("function") or "main"
                syntax = args.get("syntax") or "intel"
                disasm_info = analyzer.disassemble_function(target, fn, syntax=syntax)
                res = {"content": [{"type": "text", "text": "\n".join(disasm_info.get("disasm", []))}]}
            elif tool_name == "search_strings":
                query_term = args.get("query")
                raw_min = args.get("min_len", 4)
                try:
                    min_len = int(raw_min)
                except (TypeError, ValueError) as exc:
                    raise ValueError("min_len must be an integer between 1 and 256") from exc
                strs = analyzer.search_strings(target, query=query_term, min_len=min_len)
                res = {"content": [{"type": "text", "text": json.dumps([s["value"] for s in strs])}]}
            elif tool_name == "get_xrefs":
                target_sym = args.get("target") or "main"
                xrefs = analyzer.get_xrefs(target, target_sym)
                res = {"content": [{"type": "text", "text": json.dumps(xrefs, indent=2)}]}
            elif tool_name == "annotate_variable":
                fn = args.get("function") or "main"
                old_name = args.get("old_name") or ""
                new_name = args.get("new_name") or ""
                ann = analyzer.annotate_variable(target, fn, old_name, new_name)
                res = {
                    "content": [{
                        "type": "text",
                        "text": (
                            f"Annotated variable '{ann['old_name']}' -> '{ann['new_name']}' "
                            f"in function '{ann['function']}' ({ann['target']})"
                        ),
                    }]
                }
            elif tool_name == "inspect_sections_and_entropy":
                sec_data = analyzer.inspect_sections_and_entropy(target)
                res = {"content": [{"type": "text", "text": json.dumps(sec_data, indent=2)}]}
            elif tool_name == "read_hex_dump":
                try:
                    offset = int(args.get("offset", 0))
                    length = int(args.get("length", 256))
                except (TypeError, ValueError) as exc:
                    raise ValueError("offset and length must be integers") from exc
                hex_data = analyzer.read_hex_dump(target, offset=offset, length=length)
                res = {"content": [{"type": "text", "text": json.dumps(hex_data, indent=2)}]}
            else:
                return 400, {
                    "jsonrpc": "2.0",
                    "id": rpc_id,
                    "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"},
                }
            return 200, {"jsonrpc": "2.0", "id": rpc_id, "result": res}
        except (ValueError, PermissionError, FileNotFoundError) as e:
            return 400, {
                "jsonrpc": "2.0",
                "id": rpc_id,
                "error": {"code": -32602, "message": str(e)},
            }

    return 400, {
        "jsonrpc": "2.0",
        "id": rpc_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }
