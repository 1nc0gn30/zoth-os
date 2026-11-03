---
title: "zoth-thermal"
tags: [os, cli]
aliases: ["zoth-thermal"]
---

# zoth-thermal

`file`: Bourne-Again shell script.

`zoth-thermal` is a hardware thermal and CPU power management utility for controlling Intel frequency scaling and fan profiles in ZothOS.

## What it does

The script modifies kernel sysfs power interfaces and inspects sensor telemetry:

- **Cool / Quiet profile (`cool` or `quiet`):**
  - Disables Intel Turbo Boost by writing `1` to `/sys/devices/system/cpu/intel_pstate/no_turbo`.
  - Sets CPU energy performance preference (`energy_performance_preference`) across all cores to `balance_power`.
- **Turbo / Performance profile (`turbo` or `performance`):**
  - Re-enables Intel Turbo Boost by writing `0` to `/sys/devices/system/cpu/intel_pstate/no_turbo`.
  - Sets CPU energy performance preference across all cores to `balance_performance`.
- **Hardware status (`status` or default):**
  - Reads Turbo Boost state and CPU0 energy preference.
  - Formats temperature and fan readings from `sensors` (`package`, `fan1:`, `fan2:`, `temp1:`).

## Usage

```bash
zoth-thermal status   # Display temperatures, fans, and governor state
zoth-thermal cool     # Pin CPU to power-saving frequencies
zoth-thermal turbo    # Unrestrict clock speed for intensive compilation
```

## See also

[[Zoth OS]] · [[MOC CLIs]]