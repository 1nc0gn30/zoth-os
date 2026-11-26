"""Offline tests for Anderson Sentinel pure logic (no camera/radio/network)."""
import argparse, json, math
import numpy as np
import pytest

from engine import config
import run


@pytest.fixture
def tmp_settings(tmp_path, monkeypatch):
    f = tmp_path / "settings.json"
    monkeypatch.setattr(config, "SETTINGS_FILE", str(f))
    return f


def test_defaults_bind_localhost():
    assert config.DEFAULT_SETTINGS["web_host"] == "127.0.0.1"


def test_settings_roundtrip_merges_defaults(tmp_settings):
    config.save_settings({"armed": False})
    s = config.load_settings()
    assert s["armed"] is False
    assert s["web_port"] == 7890  # default filled in
    assert not (tmp_settings.parent / "settings.json.tmp").exists()


def test_corrupt_or_wrong_type_settings_fall_back(tmp_settings):
    tmp_settings.write_text("[1,2,3]")
    assert config.load_settings() == config.DEFAULT_SETTINGS
    tmp_settings.write_text("{not json")
    assert config.load_settings() == config.DEFAULT_SETTINGS


@pytest.mark.parametrize("cli_host,cli_port,saved,expected", [
    (None, None, {}, ("127.0.0.1", 7890)),
    (None, None, {"web_host": "10.0.0.5", "web_port": 9000}, ("10.0.0.5", 9000)),
    ("0.0.0.0", 1234, {"web_host": "10.0.0.5"}, ("0.0.0.0", 1234)),
])
def test_resolve_bind(cli_host, cli_port, saved, expected):
    args = argparse.Namespace(host=cli_host, port=cli_port)
    assert run.resolve_bind(args, saved) == expected


def _xray():
    from engine.wifi_xray import WifiXrayEngine as WifiXRay  # noqa
    obj = object.__new__(WifiXRay)  # skip __init__ (touches radios)
    obj.ref_rssi_1m, obj.path_loss_n = -40.0, 2.6
    return obj


def test_rssi_pct_to_dbm():
    x = _xray()
    assert x._rssi_pct_to_dbm(100) == -50.0
    assert x._rssi_pct_to_dbm(0) == -100.0


def test_distance_model_monotonic_and_clamped():
    x = _xray()
    near, far = x._calculate_distance(-45), x._calculate_distance(-80)
    assert far > near
    assert x._calculate_distance(-10) == 0.4  # clamped minimum
    assert x._calculate_distance(-60, "5GHz") < x._calculate_distance(-60, "2.4GHz")
    assert math.isclose(x._calculate_distance(-66), round(10 ** (26 / 26), 2))


def test_kalman_converges_on_static_target():
    from engine.rf_tomography import KalmanHumanTracker
    k = KalmanHumanTracker()
    for _ in range(30):
        k.update(2.0, 3.0, 0.9)
    assert np.allclose(k.state[:2], [2.0, 3.0], atol=0.1)
    assert 0.0 < k.confidence <= 1.0
    snap = k.get_snapshot()
    assert isinstance(snap, dict)
