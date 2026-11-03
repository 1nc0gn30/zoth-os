---
title: "fitness-nutrition"
tags: [skill, hermes]
aliases: ["fitness-nutrition"]
---

# Fitness & Nutrition

A workstation skill from Hermes for workout planning, nutritional lookups, and body metric calculations via open APIs and offline calculators.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/hermes-agent/optional-skills/health/fitness-nutrition/SKILL.md`

## When to load
Load this skill when an agent or user requests fitness, exercise, or dietary guidance:
- Looking up workout routines, exercise technique instructions, or muscle group targets.
- Searching food nutritional data, calorie counts, and macronutrient breakdowns.
- Calculating body metrics: BMI, body fat percentage (US Navy method), and TDEE (Mifflin-St Jeor).
- Estimating one-rep max (1RM) using Epley/Brzycki/Lombardi formulas and planning progressive overload.
- Formulating macro ratios for cutting, bulking, or maintenance diets.

## Key capabilities & workflows
- **Exercise database (wger API):** Queries over 690 exercises and equipment profiles from `wger.de/api/v2` without authentication, filtering by muscle ID and approved status.
- **Nutritional profiling (USDA FoodData Central):** Searches over 380,000 foods via `api.nal.usda.gov` using `USDA_API_KEY` (or the default `DEMO_KEY`) to extract per-100g protein, lipid, and carbohydrate totals.
- **Offline health calculators:** Provides standalone Python utilities (`scripts/body_calc.py`) to compute BMI, TDEE, 1RM, and target macro splits locally without external pip packages.

## See also

[[MOC Skills]] · [[Zoth OS]]