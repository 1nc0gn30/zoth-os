---
title: "maps"
tags: [skill, hermes]
aliases: ["maps"]
---

# maps

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/productivity/maps/SKILL.md`

## Overview
Provides location intelligence, geocoding, routing, POI search, and timezone resolution powered by OpenStreetMap, Overpass, and OSRM without requiring commercial API keys.

## When to Load
- Translating street addresses or landmark names into latitude/longitude coordinates (`search`).
- Performing reverse geocoding from coordinates to structured address components (`reverse`).
- Searching for local amenities across 46 categories near coordinates or named addresses (`nearby`).
- Calculating travel distances, travel times, and straight-line paths for driving, walking, or cycling (`distance`).
- Fetching turn-by-turn routing and step maneuvers between locations (`directions`).
- Checking local standard time and UTC offsets for specific coordinates (`timezone`).
- Extracting bounding boxes for regions (`area`) and searching POIs within spatial coordinates (`bbox`).
- Handling real-time location pins received from Telegram or chat messages.

## Core Capabilities
- Pure Python standard library implementation via `maps_client.py` without third-party pip packages.
- Integrates OpenStreetMap/Nominatim, Overpass API, OSRM routing, and TimeAPI.io.

## See also

[[MOC Skills]] · [[Zoth OS]]