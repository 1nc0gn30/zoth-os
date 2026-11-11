---
title: "Zoth Signal Bridge v12 (Android)"
package_id: "com.example.zothsignalbridge"
prod_package_id: "tech.nullai.signalbridge"
version_code: 12
version_name: "12.0.0"
min_sdk: 24
target_sdk: 36
compile_sdk: 36
build_system: "Gradle + Jetpack Compose Nav3"
fdroid_official: "TWEAK"
fdroid_sovereign: "READY"
play_store: "TWEAK"
github: "https://github.com/NullAITech/zoth-studio"
apk_path: "~/NullAITech/zoth-studio-og/zoth-signal-bridge-android"
tags: [android-apk, mobile, signal-bridge, compose, fdroid, play-store]
---

# 📱 Zoth Signal Bridge v12 (`tech.nullai.signalbridge`)

- **Source**: `~/NullAITech/zoth-studio-og/zoth-signal-bridge-android`
- **Release Checklist**:
  1. Rename `com.example.zothsignalbridge` → `tech.nullai.signalbridge` in `app/build.gradle.kts`, `AndroidManifest.xml`, and `src/main/java/`.
  2. Remove `android.permission.REQUEST_INSTALL_PACKAGES` for the Google Play Store build.
  3. Add `dependenciesInfo { includeInApk = false }` for Official F-Droid.

See [[06-Wiki/Zoth Mobile Arsenal — Android APKs, F-Droid & Play Store Roadmap]] and [[Zoth Android APKs & Mobile Store Roadmap.base]].
