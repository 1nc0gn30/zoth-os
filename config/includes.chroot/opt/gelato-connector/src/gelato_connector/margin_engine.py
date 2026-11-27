"""Gelato Multi-Currency Margin & Profit Calculator Engine.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library — Zero External Dependencies.
"""

from __future__ import annotations

import math
from typing import Any, Dict
from .catalog import get_product
from .shipping_engine import FX_TO_USD, convert_currency, get_shipping_quote, normalize_country_code


def _base_cost_in_currency(product: Dict[str, Any], curr: str) -> float:
    """Resolve bundled product base cost in the requested currency."""
    if curr == "USD":
        return float(product["base_cost_usd"])
    if curr == "EUR":
        return float(product["base_cost_eur"])
    if curr == "GBP":
        return float(product["base_cost_gbp"])
    return convert_currency(float(product["base_cost_usd"]), "USD", curr)


def calculate_margins(
    product_id: Any,
    retail_price: float,
    currency: str = "USD",
    channel: str = "etsy",
    destination_country: str = "US",
    quantity: int = 1
) -> Dict[str, Any]:
    """Calculate FX-safe costs, platform fees, net profit, and margins across currencies."""
    product = get_product(product_id)
    if not product:
        raise ValueError(f"Unknown product ID '{product_id}'")
    if isinstance(retail_price, bool) or not isinstance(retail_price, (int, float)) or not math.isfinite(retail_price) or retail_price < 0:
        raise ValueError("retail_price must be a non-negative finite number")
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
        raise ValueError("quantity must be a positive integer (>= 1)")

    curr = str(currency or "USD").strip().upper()
    if curr not in FX_TO_USD:
        raise ValueError(f"Unsupported currency '{curr}'. Supported: {', '.join(FX_TO_USD.keys())}")

    dest_norm = normalize_country_code(destination_country)
    base_cost = _base_cost_in_currency(product, curr)

    # Production cost in requested currency
    total_production = round(base_cost * quantity, 2)

    # Shipping cost converted from destination hub native currency into requested margin currency
    ship_data = get_shipping_quote(product["id"], dest_norm, is_express=False, quantity=quantity)
    ship_native_cost = float(ship_data["shipping_cost"])
    ship_native_currency = ship_data["currency"]
    shipping_cost = convert_currency(ship_native_cost, ship_native_currency, curr)
    freight_savings_converted = convert_currency(
        float(ship_data.get("freight_savings_vs_cross_border", 0.0)),
        ship_native_currency,
        curr,
    )

    # Cost of Goods Sold (COGS) — both components in `curr`
    total_cogs = round(total_production + shipping_cost, 2)

    # Platform Fees (converted fixed fee component from USD reference when needed)
    total_revenue = round(float(retail_price) * quantity, 2)
    ch = str(channel or "etsy").strip().lower()

    if ch == "etsy":
        # Etsy: 6.5% transaction + 3.0% payment processing + $0.25 payment fixed + $0.20 listing fee
        fixed_fee = convert_currency(0.45, "USD", curr)
        total_fees = round((total_revenue * 0.095) + fixed_fee, 2)
        keep_factor = 0.905
    elif ch == "shopify":
        # Shopify Payments: 2.9% + $0.30 card processing
        fixed_fee = convert_currency(0.30, "USD", curr)
        total_fees = round((total_revenue * 0.029) + fixed_fee, 2)
        keep_factor = 0.971
    else:
        # Direct Checkout (Stripe standard card processing): 2.9% + $0.30
        fixed_fee = convert_currency(0.30, "USD", curr)
        total_fees = round((total_revenue * 0.029) + fixed_fee, 2)
        keep_factor = 0.971

    total_expenses = round(total_cogs + total_fees, 2)
    net_profit = round(total_revenue - total_expenses, 2)
    margin_pct = round((net_profit / total_revenue) * 100, 1) if total_revenue > 0 else 0.0

    # Break-even price
    break_even_total = (total_cogs + fixed_fee) / keep_factor
    break_even_unit = round(break_even_total / quantity, 2)

    # Recommended Pricing Tiers
    rec_30 = round(break_even_unit / 0.70, 2)
    rec_50 = round(break_even_unit / 0.50, 2)
    rec_65 = round(break_even_unit / 0.35, 2)

    return {
        "product_id": product["id"],
        "product_uid": product["product_uid"],
        "product_title": product["title"],
        "category": product["category"],
        "currency": curr,
        "channel": ch.upper(),
        "destination_country": dest_norm,
        "quantity": quantity,
        "retail_price_unit": float(retail_price),
        "total_revenue": total_revenue,
        "base_production_cost": total_production,
        "shipping_cost": shipping_cost,
        "shipping_cost_native": ship_native_cost,
        "shipping_currency_native": ship_native_currency,
        "is_local_production": ship_data["is_local_production"],
        "production_hub": ship_data["production_hub"],
        "carrier": ship_data["carrier"],
        "total_cogs": total_cogs,
        "platform_fees": total_fees,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "profit_margin_pct": margin_pct,
        "break_even_price": break_even_unit,
        "freight_savings": freight_savings_converted,
        "recommended_pricing": {
            "tier_30_pct": rec_30,
            "tier_50_pct": rec_50,
            "tier_65_pct": rec_65
        }
    }


def calculate_multi_channel_margins(
    product_id: Any,
    retail_price: float,
    currency: str = "USD",
    destination_country: str = "US",
    quantity: int = 1
) -> Dict[str, Any]:
    """Compare Etsy, Shopify, and Direct channels for a Gelato product."""
    product = get_product(product_id)
    if not product:
        raise ValueError(f"Unknown product ID '{product_id}'")

    channels = ["etsy", "shopify", "direct"]
    results = {}

    for ch in channels:
        results[ch] = calculate_margins(
            product_id=product["id"],
            retail_price=retail_price,
            currency=currency,
            channel=ch,
            destination_country=destination_country,
            quantity=quantity,
        )

    dest_norm = normalize_country_code(destination_country)
    return {
        "product": {
            "id": product["id"],
            "product_uid": product["product_uid"],
            "title": product["title"],
            "category": product["category"],
            "base_cost_usd": product["base_cost_usd"],
            "base_cost_eur": product["base_cost_eur"],
            "base_cost_gbp": product["base_cost_gbp"]
        },
        "retail_price": float(retail_price),
        "currency": str(currency or "USD").strip().upper(),
        "destination_country": dest_norm,
        "quantity": quantity,
        "channels": results
    }
