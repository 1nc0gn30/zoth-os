#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS GRAPHICS COMPATIBILITY HELPER  (sourced by app launchers)
#
#  Chromium/Electron apps (Chrome, Element, Signal, Zoth Electron apps) paint a
#  BLACK window and Firefox can crash when their GPU path runs on a virtual or
#  broken GL driver (VirtualBox/VMware SVGA, QEMU std/bochs, virgl, missing DRI
#  render node). On such systems we switch those apps to software rendering.
#  Real hardware with a working DRM render node keeps full GPU acceleration.
#
#  Override (highest priority first):
#     ZOTH_GFX=software|hardware        (environment)
#     /etc/zothos/gfx.conf  ->  ZOTH_GFX=software|hardware|auto
# ==============================================================================

# Nouveau breaks Chromium's EGL swap only when it is the GPU driving the
# screen. Hybrid machines often load nouveau next to a working Intel or AMD
# GPU. Forcing software mode in that case passes --disable-gpu, and Chrome
# then has no WebGL even when hardware acceleration is turned on.
zoth_nouveau_owns_display() {
    local conn status card drv any=0 other=0 node path
    grep -qs '^nouveau ' /proc/modules 2>/dev/null || return 1
    shopt -s nullglob
    for conn in /sys/class/drm/card[0-9]-*; do
        [[ -r "$conn/status" ]] || continue
        status="$(cat "$conn/status" 2>/dev/null || true)"
        [[ "$status" == "connected" ]] || continue
        any=1
        card="$(basename "$conn")"
        card="${card%%-*}"
        drv="$(basename "$(readlink -f "/sys/class/drm/${card}/device/driver" 2>/dev/null)" 2>/dev/null || true)"
        if [[ "$drv" != "nouveau" ]]; then
            other=1
        fi
    done
    # Connectors unreadable: software only when every render node is nouveau.
    if [[ "$any" == 0 ]]; then
        for node in /dev/dri/renderD*; do
            [[ -e "$node" ]] || continue
            any=1
            path="/sys/class/drm/$(basename "$node")/device/driver"
            drv="$(basename "$(readlink -f "$path" 2>/dev/null)" 2>/dev/null || true)"
            if [[ "$drv" != "nouveau" ]]; then
                other=1
            fi
        done
    fi
    [[ "$any" == 1 && "$other" == 0 ]]
}

zoth_gfx_mode() {
    local mode="${ZOTH_GFX:-}"
    if [[ -z "$mode" && -r /etc/zothos/gfx.conf ]]; then
        mode="$(sed -n 's/^[[:space:]]*ZOTH_GFX=["'\'']\{0,1\}\([a-z]*\).*/\1/p' /etc/zothos/gfx.conf | tail -n1)"
    fi
    case "$mode" in
        software|hardware) echo "$mode"; return 0 ;;
    esac
    # auto-detect: virtual machine -> software
    if command -v systemd-detect-virt >/dev/null 2>&1 && systemd-detect-virt --vm --quiet 2>/dev/null; then
        echo software; return 0
    fi
    if zoth_nouveau_owns_display; then
        echo software; return 0
    fi
    # no DRM render node (no usable GPU driver) -> software
    if ! compgen -G "/dev/dri/renderD*" >/dev/null 2>&1; then
        echo software; return 0
    fi
    echo hardware
}

# Extra command-line flags for Chromium / Chrome / Electron apps.
# Usage: mapfile -t GFX_FLAGS < <(zoth_chromium_gfx_flags)
zoth_chromium_gfx_flags() {
    if [[ "$(zoth_gfx_mode)" == software ]]; then
        printf '%s\n' --disable-gpu --disable-gpu-compositing --disable-features=Vulkan
    fi
}

# Environment for Firefox / GTK / Qt apps in software mode.
zoth_export_sw_gl_env() {
    if [[ "$(zoth_gfx_mode)" == software ]]; then
        export LIBGL_ALWAYS_SOFTWARE=1
        export WEBKIT_DISABLE_COMPOSITING_MODE=1
    fi
}
