"""Gelato Localized Multi-Country Shipping & Routing Engine.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library — Zero External Dependencies.
"""

from __future__ import annotations

from typing import Any, Dict
from .catalog import get_product

# Transparent reference FX rates (value of 1 unit of currency expressed in USD)
FX_TO_USD: Dict[str, float] = {
    "USD": 1.00,
    "EUR": 1.08,
    "GBP": 1.27,
    "CAD": 0.73,
    "AUD": 0.65,
    "JPY": 1.0 / 150.0,
}

# Reference table of 10 bundled Gelato production countries (approximate lead times and local shipping costs)
LOCAL_HUBS: Dict[str, Dict[str, Any]] = {
    "US": {"country": "United States", "iso2": "US", "currency": "USD", "avg_lead_days": 2.2, "local_ship_cost": 4.50, "express_ship_cost": 9.80, "carrier": "USPS / FedEx Ground"},
    "CA": {"country": "Canada", "iso2": "CA", "currency": "CAD", "avg_lead_days": 2.5, "local_ship_cost": 6.80, "express_ship_cost": 12.50, "carrier": "Canada Post / Purolator"},
    "UK": {"country": "United Kingdom", "iso2": "GB", "currency": "GBP", "avg_lead_days": 2.0, "local_ship_cost": 3.90, "express_ship_cost": 7.50, "carrier": "Royal Mail 48 / DPD"},
    "DE": {"country": "Germany", "iso2": "DE", "currency": "EUR", "avg_lead_days": 2.1, "local_ship_cost": 4.20, "express_ship_cost": 8.50, "carrier": "Deutsche Post / DHL"},
    "FR": {"country": "France", "iso2": "FR", "currency": "EUR", "avg_lead_days": 2.4, "local_ship_cost": 4.60, "express_ship_cost": 8.90, "carrier": "Colissimo / Chronopost"},
    "IT": {"country": "Italy", "iso2": "IT", "currency": "EUR", "avg_lead_days": 2.6, "local_ship_cost": 4.90, "express_ship_cost": 9.20, "carrier": "Poste Italiane / BRT"},
    "ES": {"country": "Spain", "iso2": "ES", "currency": "EUR", "avg_lead_days": 2.5, "local_ship_cost": 4.70, "express_ship_cost": 8.90, "carrier": "Correos / SEUR"},
    "NL": {"country": "Netherlands", "iso2": "NL", "currency": "EUR", "avg_lead_days": 2.0, "local_ship_cost": 4.10, "express_ship_cost": 7.90, "carrier": "PostNL / DPD"},
    "AU": {"country": "Australia", "iso2": "AU", "currency": "AUD", "avg_lead_days": 2.3, "local_ship_cost": 7.20, "express_ship_cost": 13.90, "carrier": "Australia Post / StarTrack"},
    "JP": {"country": "Japan", "iso2": "JP", "currency": "JPY", "avg_lead_days": 2.5, "local_ship_cost": 650.0, "express_ship_cost": 1200.0, "carrier": "Japan Post / Yamato"},
}


def normalize_country_code(country: str) -> str:
    """Normalize country code while aliasing ISO-3166 GB to bundled UK hub key."""
    code = str(country or "US").strip().upper()
    if code == "GB":
        return "UK"
    return code


def to_iso2_country_code(country: str) -> str:
    """Convert internal hub code to ISO 3166-1 alpha-2 country code for Gelato Order API v4."""
    code = str(country or "US").strip().upper()
    if code == "UK":
        return "GB"
    return code


def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert monetary amount between supported currencies using FX_TO_USD reference rates."""
    src = str(from_currency or "USD").strip().upper()
    dst = str(to_currency or "USD").strip().upper()
    if src == dst:
        return round(float(amount), 2)
    src_rate = FX_TO_USD.get(src)
    dst_rate = FX_TO_USD.get(dst)
    if src_rate is None:
        raise ValueError(f"Unsupported source currency '{src}'")
    if dst_rate is None:
        raise ValueError(f"Unsupported target currency '{dst}'")
    amount_usd = float(amount) * src_rate
    return round(amount_usd / dst_rate, 2)


def get_shipping_quote(
    product_id: Any,
    destination_country: str = "US",
    is_express: bool = False,
    quantity: int = 1
) -> Dict[str, Any]:
    """Calculate localized shipping rate, delivery time, and FX-converted cross-border savings."""
    product = get_product(product_id)
    if not product:
        raise ValueError(f"Unknown product ID '{product_id}'")
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
        raise ValueError("Quantity must be a positive integer (>= 1)")

    country_code = normalize_country_code(destination_country)
    hub = LOCAL_HUBS.get(country_code)

    is_local_production = bool(hub) and (country_code in product.get("local_production_countries", []))

    if hub and is_local_production:
        first_cost = float(hub["express_ship_cost"] if is_express else hub["local_ship_cost"])
        add_cost = round(first_cost * 0.40, 2)
        total_ship = round(first_cost + (add_cost * max(0, quantity - 1)), 2)
        transit_days = "1-2 business days" if is_express else "2-4 business days"
        customs_delay = "0 days (Domestic Manufacturing)"
        duties_expected = False
        carbon_savings_pct = 67.0
        currency = hub["currency"]
        carrier = hub["carrier"]
        production_hub = f"Domestic {hub['country']} Print Facility"
    else:
        # Cross-border international shipping (quoted in USD)
        currency = "USD"
        first_cost = 18.50 if is_express else 11.80
        add_cost = 4.50
        total_ship = round(first_cost + (add_cost * max(0, quantity - 1)), 2)
        transit_days = "3-5 business days" if is_express else "7-14 business days"
        customs_delay = "2-5 days subject to customs clearance"
        duties_expected = True
        carbon_savings_pct = 0.0
        carrier = "DHL Express / Asendia Cross-Border"
        production_hub = "Nearest Regional Hub (Cross-Border Transit)"

    # Comparative savings vs traditional overseas shipping ($16.50 standard / $28.00 express + $5/addl unit)
    # Converted into the quote currency so non-USD hubs (EUR, GBP, CAD, AUD, JPY) stay currency-accurate.
    traditional_unit_usd = 28.00 if is_express else 16.50
    traditional_total_usd = round(traditional_unit_usd + (5.00 * max(0, quantity - 1)), 2)
    traditional_total_local = convert_currency(traditional_total_usd, "USD", currency)
    freight_savings = max(0.0, round(traditional_total_local - total_ship, 2))
    shipping_cost_usd = convert_currency(total_ship, currency, "USD")

    return {
        "product_id": product["id"],
        "product_title": product["title"],
        "destination_country": country_code,
        "destination_iso2": to_iso2_country_code(country_code),
        "quantity": quantity,
        "is_express": is_express,
        "is_local_production": is_local_production,
        "production_hub": production_hub,
        "carrier": carrier,
        "currency": currency,
        "shipping_cost": total_ship,
        "shipping_cost_usd": shipping_cost_usd,
        "cross_border_benchmark": traditional_total_local,
        "estimated_transit": transit_days,
        "customs_delay": customs_delay,
        "duties_expected": duties_expected,
        "environmental_impact": {
            "carbon_reduction_pct": carbon_savings_pct,
            "reduced_airfreight": is_local_production
        },
        "freight_savings_vs_cross_border": freight_savings
    }
