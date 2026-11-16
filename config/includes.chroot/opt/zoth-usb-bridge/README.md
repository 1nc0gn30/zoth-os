# Zoth USB Bridge (`zoth-usb-bridge`)

**Sovereign USB, ADB, Wireless Debugging & Developer-Mode Device Bridge (`127.0.0.1:8153`)**

## What It Does
`zoth-usb-bridge` gives you a dedicated local workstation and CLI to work directly with USB-connected and Developer-Mode Android/Linux devices without cloud relays or bloated SDK GUIs:
- **Live USB & ADB Discovery**: Combines `adb devices -l` (with Android version, SDK, ABI, and battery enrichment) and `lsusb` hardware bus inspection, plus a browser **WebUSB Probe**.
- **Wireless Debugging (Android 11+) & USB→Wi-Fi Handoff**: Pair with a 6-digit code (`adb pair`), connect (`adb connect`), or flip a USB-attached device into `adb tcpip 5555` and read its Wi-Fi IP automatically.
- **Interactive ADB Shell, Logcat & Packages**: Run real `adb -s <serial> shell` commands, inspect live `logcat`, list 3rd-party packages (`pm list packages -3`), and reverse localhost ports (`adb reverse tcp:3000 tcp:3000`).
- **Live Screen Capture & `scrcpy` Mirroring**: Grab PNG frames via `adb exec-out screencap -p` or launch a desktop `scrcpy` mirror window.

## How It Works
- Zero external npm dependencies; native Node.js `http` server bound strictly to `127.0.0.1:8153`.
- Exposes `GET /health`, `GET /api/devices`, `POST /api/adb/pair`, `POST /api/adb/connect`, `POST /api/adb/disconnect`, `POST /api/adb/tcpip`, `POST /api/adb/shell`, `POST /api/adb/reverse`, `POST /api/adb/packages`, `POST /api/adb/logcat`, `POST /api/adb/screenshot`, and `POST /api/scrcpy/launch`.

## ZothOS CLI Commands
```bash
zoth-usb-bridge serve                     # Start workstation on http://127.0.0.1:8153
zoth-usb-bridge devices [--json]          # List ADB & USB bus devices
zoth-usb-bridge pair 192.168.1.42:37123 123456
zoth-usb-bridge connect 192.168.1.42:5555
zoth-usb-bridge tcpip <serial> [5555]     # Enable ADB over Wi-Fi
zoth-usb-bridge reverse <serial> 3000 3000
zoth-usb-bridge shell <serial> "getprop ro.product.model"
zoth-usb-bridge --status [--json]
```

Engineered by **Neal Frazier Tech (@1nc0gn30)** • [NullAI Platform](https://nullai.tech) • 100% Free & Open Access.
