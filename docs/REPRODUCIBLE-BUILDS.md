# Reproducible builds: status

ZOTHOS is **not reproducible yet**. This tracks what is done and what is left.

## Done
- `SOURCE_DATE_EPOCH` defaults to the last commit time in `build/build-iso.sh`; `TZ=UTC`, `LC_ALL=C.UTF-8`.
- mksquashfs runs with `-mkfs-time`/`-all-time` set to `SOURCE_DATE_EPOCH`.
- Optional `ZOTHOS_SNAPSHOT=YYYYMMDDTHHMMSSZ` pins the Debian archive to snapshot.debian.org.
- APT signature checking is on during the build (fingerprint-pinned Kali/Parrot keys).
- ISO volume/publisher metadata is set by `lb config` (`ZOTHOS_3.1`).

## Left
1. Version-pin the package lists (or rely on the snapshot date for Debian; Kali/Parrot have no equivalent pin yet).
2. Pin `debian:trixie-slim` by digest in `build/docker/Dockerfile.builder`.
3. Replace network fetches in hooks (`apt-get download`, `curl | sh`) with checksummed artifacts.
4. Build releases only with `build/build-iso.sh` (or CI), never `build/pack-iso.sh` on a long-lived chroot,
   whose state is not in git. Note: `pack-iso.sh` does not run `build/hooks/`, so the
   secure-by-default hook only applies to clean builds.
5. Remove committed binaries (`uv`, `xwinwrap`, `zoth-vault-daemon`) in favour of pinned, verified downloads or source.
6. Compare two independent builds with `diffoscope` and publish the result.

## Try it
```bash
sudo ZOTHOS_SNAPSHOT=20261003T000000Z ./build/build-iso.sh
sha256sum build/*.iso
```
