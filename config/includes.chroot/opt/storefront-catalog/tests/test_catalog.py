"""Guards the launch catalog against Etsy/Printify rejections and money math drift.
Run: python3 -m pytest -q tests/   (reads committed files only; no network)"""
import json
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = json.loads((ROOT / "catalog_manifest.json").read_text())
LISTINGS = MANIFEST["listings"]
IDS = [l["id"] for l in LISTINGS]


def test_listing_count_matches():
    assert MANIFEST["total_listings"] == len(LISTINGS) == 10
    assert len(set(IDS)) == len(IDS)


@pytest.mark.parametrize("item", LISTINGS, ids=IDS)
def test_etsy_listing_limits(item):
    assert 0 < len(item["title"]) <= 140, "Etsy titles max 140 chars"
    assert len(item["tags"]) <= 13, "Etsy allows 13 tags"
    for t in item["tags"]:
        assert 0 < len(t) <= 20, f"Etsy tag over 20 chars: {t!r}"
    assert len({t.lower() for t in item["tags"]}) == len(item["tags"]), "duplicate tags"


@pytest.mark.parametrize("item", LISTINGS, ids=IDS)
def test_financials_add_up(item):
    f = item["financials"]
    assert f["net_profit"] == pytest.approx(f["retail_price"] - f["production_cost"] - f["marketplace_fees"], abs=0.01)
    assert f["net_profit"] > 0, "listing loses money"
    assert f["margin_percent"] == pytest.approx(100 * f["net_profit"] / f["retail_price"], abs=0.15)


def test_portfolio_totals():
    pf = MANIFEST["portfolio_financials"]
    tot = lambda k: sum(l["financials"][k] for l in LISTINGS)
    assert pf["total_retail_value"] == pytest.approx(tot("retail_price"), abs=0.02)
    assert pf["total_net_profit"] == pytest.approx(tot("net_profit"), abs=0.02)


@pytest.mark.parametrize("item", LISTINGS, ids=IDS)
def test_assets_and_payload_exist(item):
    assert (ROOT / item["canvas_file"]).is_file()
    assert (ROOT / item["mockup_file"]).is_file()
    payload = json.loads((ROOT / item["pod_payload_file"]).read_text())
    for k in ("title", "description", "blueprint_id", "print_provider_id", "variants", "print_areas"):
        assert k in payload
    assert payload["variants"], "no variants"
    retail_cents = round(item["financials"]["retail_price"] * 100)
    assert all(v["price"] == retail_cents for v in payload["variants"] if "price" in v)
    assert len(payload["tags"]) <= 13


def test_no_orphan_payloads():
    files = {p.name for p in (ROOT / "payloads").glob("*.json")}
    assert files == {Path(l["pod_payload_file"]).name for l in LISTINGS}


def test_build_script_has_no_hardcoded_home():
    assert "/root" not in (ROOT / "build_catalog.py").read_text()
