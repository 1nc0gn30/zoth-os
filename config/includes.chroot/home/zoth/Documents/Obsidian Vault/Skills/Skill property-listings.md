---
title: "property-listings"
tags: [skill, hermes]
aliases: ["property-listings"]
---

# property-listings

- **Origin:** Hermes (Workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/productivity/property-listings/SKILL.md`
- **Category:** Productivity / Real Estate

## Overview
`property-listings` formats researched real estate and rental listings as browsable, interactive visual cards inside the Hermes desktop transcript. It functions strictly as a presentation layer rather than an automated listing search service or valuation engine.

## When to Load
Load when presenting property or rental search findings, evaluating shortlists, or comparing real estate options in Hermes desktop sessions. Outside desktop environments, standard Markdown with source links is used instead.

## Card Architecture & Schema
- **Listing Fence**: Uses a fenced code block with the `listing` language identifier containing valid JSON.
- **Data Properties**: Declares `address` (required), `price`, `beds`, `baths`, `size`, `note`, `facts` (key specs/amenities), `catches` (open questions or lease caveats), `images` (direct HTTPS image URLs for gallery mosaics), and canonical `links`.
- **Deduplication**: Reconciles portal mirrors into unified property cards with verified facts while omitting unverified guesses.

## See also

[[MOC Skills]] · [[Zoth OS]]