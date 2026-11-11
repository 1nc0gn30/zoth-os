---
title: "ZothTerm Sovereign Shell (Android)"
package_id: "com.termux"
prod_package_id: "tech.nullai.zothterm"
version_code: 122
version_name: "0.122.0"
min_sdk: 21
target_sdk: 28
compile_sdk: 36
build_system: "Gradle 9.2.1 + NDK 29"
fdroid_official: "TWEAK"
fdroid_sovereign: "READY"
play_store: "BLOCKED"
github: "https://github.com/1nc0gn30/zoth-os"
apk_path: "~/NullAITech/zoth-termux/dist/zothterm-0.5_arm64-v8a.apk"
tags: [android-apk, mobile, zothterm, termux, fdroid]
---

# 📱 ZothTerm Sovereign Shell (`com.termux`)

- **Source**: `~/NullAITech/zoth-termux`
- **APK Binaries**: `dist/zothterm-0.5_arm64-v8a.apk` (`32 MB`), `armeabi-v7a.apk`, `x86_64.apk`, `x86.apk`, `universal.apk` (`115 MB`)
- **Signing Key**: Production RSA-4096 `~/.zothterm-signing/zothterm-release.jks` (`SHA-256: ec7dce2dba5344f3ce8d3e6a5ad8124587708a3e6058cd4ec35af55c8e79b013`)
- **Release Checklist**:
  1. Ready today for **Sovereign F-Droid (`fdroid.nullai.tech/repo`)**.
  2. For **Official F-Droid (`fdroiddata`)**, rename `TERMUX_PACKAGE_NAME` to `tech.nullai.zothterm` and rebuild `bootstrap-*.zip` archives with matching `/data/data/tech.nullai.zothterm/files/usr` prefix.

See [[06-Wiki/Zoth Mobile Arsenal — Android APKs, F-Droid & Play Store Roadmap]] and [[Zoth Android APKs & Mobile Store Roadmap.base]].
