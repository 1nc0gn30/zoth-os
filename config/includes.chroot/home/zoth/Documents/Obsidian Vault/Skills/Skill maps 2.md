---
title: "maps"
tags: [skill, hermes]
aliases: ["maps"]
---

# maps

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/productivity/maps/SKILL.md`

## Overview
Provides location intelligence, geocoding, point-of-interest discovery, routing, and timezone lookups using free and open data sources without external API keys.

## When to Load
- Geocoding place names or street addresses into coordinates (`search`).
- Reverse geocoding geographic coordinates to detailed postal addresses (`reverse`).
- Discovering nearby establishments across 46 POI categories around coordinates or landmarks (`nearby`).
- Calculating travel distances and durations for driving, walking, or cycling modes (`distance`).
- Generating step-by-step navigation instructions (`directions`).
- Retrieving timezone details and current local times for coordinates (`timezone`).
- Computing bounding boxes for cities or regions (`area`) and filtering POIs within bounding boxes (`bbox`).
- Processing geographic coordinates shared via messaging apps (such as Telegram location pins).

## Core Capabilities
- CLI execution via `maps_client.py` using Python standard library with zero external dependencies.
- Queries OpenStreetMap/Nominatim, Overpass API mirrors, OSRM routing, and TimeAPI.io.

## See also

[[MOC Skills]] · [[Zoth OS]]