// Anderson Security Sentinel v2.6.0 — Client Controller (XSS-Safe DOM Builders & Dual-Theme)

let isArmed = true;
let hudEnabled = true;

const systemStateBadge = document.getElementById('systemStateBadge');
const headerPulse = document.getElementById('headerPulse');
const btnToggleArm = document.getElementById('btnToggleArm');
const btnEnroll = document.getElementById('btnEnroll');
const btnClearFaces = document.getElementById('btnClearFaces');
const btnTestWelcome = document.getElementById('btnTestWelcome');
const btnTestIntruder = document.getElementById('btnTestIntruder');
const btnToggleHud = document.getElementById('btnToggleHud');
const btnRefreshSnaps = document.getElementById('btnRefreshSnaps');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const btnSolanaTip = document.getElementById('btnSolanaTip');

const consoleBox = document.getElementById('consoleBox');
const snapsGrid = document.getElementById('snapsGrid');
const intruderAlertBanner = document.getElementById('intruderAlertBanner');
const enrolledCount = document.getElementById('enrolledCount');
const fpsCounter = document.getElementById('fpsCounter');
const logCount = document.getElementById('logCount');

const similarityThreshold = document.getElementById('similarityThreshold');
const threshVal = document.getElementById('threshVal');
const welcomeCooldown = document.getElementById('welcomeCooldown');
const welcomeCdVal = document.getElementById('welcomeCdVal');
const intruderCooldown = document.getElementById('intruderCooldown');
const intruderCdVal = document.getElementById('intruderCdVal');
const ttsEngine = document.getElementById('ttsEngine');

const btnRadarTopDown = document.getElementById('btnRadarTopDown');
const btnRadarIso = document.getElementById('btnRadarIso');
const btnRadarHeatmap = document.getElementById('btnRadarHeatmap');
const btnFilterAll = document.getElementById('btnFilterAll');
const btnFilter24 = document.getElementById('btnFilter24');
const btnFilter5 = document.getElementById('btnFilter5');
const btnForceScan = document.getElementById('btnForceScan');

const wifiXrayEnabled = document.getElementById('wifiXrayEnabled');
const rfPresenceAlerts = document.getElementById('rfPresenceAlerts');
const wifiScanInterval = document.getElementById('wifiScanInterval');
const wifiScanIntervalVal = document.getElementById('wifiScanIntervalVal');
const rfAudioPing = document.getElementById('rfAudioPing');

function postJson(url, bodyObj) {
  const opts = {
    method: 'POST',
    headers: { 'X-Sentinel-Action': '1' },
  };
  if (bodyObj !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(bodyObj);
  }
  return fetch(url, opts);
}

// Remove top ribbon & footer from DOM when embedded inside Studio iframe (?embed=1)
if (document.documentElement.getAttribute('data-embed') === '1') {
  const topBar = document.getElementById('sovereignTopBar');
  const foot = document.getElementById('sovereignFooter');
  if (topBar) topBar.remove();
  if (foot) foot.remove();
}

// Theme Toggle Sync
function syncThemeButton() {
  if (!btnThemeToggle) return;
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  btnThemeToggle.textContent = cur === 'light' ? '☾ DARK' : '☀ LIGHT';
}
syncThemeButton();
if (btnThemeToggle) {
  btnThemeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('anderson-theme', next); } catch (e) {}
    syncThemeButton();
  });
}

if (btnSolanaTip) {
  btnSolanaTip.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK').catch(() => {});
      btnSolanaTip.textContent = '✓ Copied GG2eQb...dXoK!';
      setTimeout(() => { btnSolanaTip.textContent = '◎ Solana Tip: GG2e...dXoK'; }, 2200);
    }
  });
}

// Initialize WiFi X-Ray Radar
let wifiRadar = null;
if (typeof WifiXrayRadar !== 'undefined') {
  wifiRadar = new WifiXrayRadar('wifiRadarCanvas');
}

function setActiveButton(group, activeBtn) {
  group.forEach(btn => btn && btn.classList.remove('active'));
  if (activeBtn) activeBtn.classList.add('active');
}

const btnRadar3D = document.getElementById('btnRadar3D');
const btnRadarBuilding = document.getElementById('btnRadarBuilding');
const btnOpticsNormal = document.getElementById('btnOpticsNormal');
const btnOpticsThermal = document.getElementById('btnOpticsThermal');
const btnOpticsPredator = document.getElementById('btnOpticsPredator');
const usbGuardVal = document.getElementById('usbGuardVal');
const bleGuardVal = document.getElementById('bleGuardVal');
const bleStatusBadge = document.getElementById('bleStatusBadge');
const btnRecalibrateUsb = document.getElementById('btnRecalibrateUsb');

const radarButtons = [btnRadarTopDown, btnRadarIso, btnRadar3D, btnRadarBuilding, btnRadarHeatmap];
const opticsButtons = [btnOpticsNormal, btnOpticsThermal, btnOpticsPredator];

if (btnRadarTopDown) {
  btnRadarTopDown.addEventListener('click', () => {
    setActiveButton(radarButtons, btnRadarTopDown);
    if (wifiRadar) wifiRadar.setMode('radar');
  });
}
if (btnRadarIso) {
  btnRadarIso.addEventListener('click', () => {
    setActiveButton(radarButtons, btnRadarIso);
    if (wifiRadar) wifiRadar.setMode('isometric');
  });
}
if (btnRadar3D) {
  btnRadar3D.addEventListener('click', () => {
    setActiveButton(radarButtons, btnRadar3D);
    if (wifiRadar) wifiRadar.setMode('3d_orbit');
  });
}
if (btnRadarBuilding) {
  btnRadarBuilding.addEventListener('click', () => {
    setActiveButton(radarButtons, btnRadarBuilding);
    if (wifiRadar) wifiRadar.setMode('building');
  });
}
if (btnRadarHeatmap) {
  btnRadarHeatmap.addEventListener('click', () => {
    setActiveButton(radarButtons, btnRadarHeatmap);
    if (wifiRadar) wifiRadar.setMode('heatmap');
  });
}

// Inspector Deck Tab Switcher
const btnTabCameras = document.getElementById('btnTabCameras');
const btnTabBuilding = document.getElementById('btnTabBuilding');
const btnTabRfFacts = document.getElementById('btnTabRfFacts');
const panelCameras = document.getElementById('panelCameras');
const panelBuilding = document.getElementById('panelBuilding');
const panelRfFacts = document.getElementById('panelRfFacts');
const inspectorTabs = [btnTabCameras, btnTabBuilding, btnTabRfFacts];
const inspectorPanels = [panelCameras, panelBuilding, panelRfFacts];

function setInspectorTab(activeBtn, activePanel) {
  inspectorTabs.forEach(b => b && b.classList.remove('active'));
  inspectorPanels.forEach(p => { if (p) p.style.display = 'none'; });
  if (activeBtn) activeBtn.classList.add('active');
  if (activePanel) activePanel.style.display = 'block';
}

if (btnTabCameras) btnTabCameras.addEventListener('click', () => setInspectorTab(btnTabCameras, panelCameras));
if (btnTabBuilding) btnTabBuilding.addEventListener('click', () => setInspectorTab(btnTabBuilding, panelBuilding));
if (btnTabRfFacts) btnTabRfFacts.addEventListener('click', () => setInspectorTab(btnTabRfFacts, panelRfFacts));

// OPSEC Privacy Redaction State
let opsecMode = localStorage.getItem('sentinel_opsec_mode') !== 'false';
const btnToggleOpsec = document.getElementById('btnToggleOpsec');

function getOpsecSsid(node) {
  const rawSsid = String(node.ssid || node.model_or_ssid || 'UNKNOWN');
  if (!opsecMode) return rawSsid;
  if (node.is_camera) {
    const brand = String(node.brand || node.vendor || 'CAM').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `OPTICAL_${brand.slice(0, 8)}_DEVICE`;
  }
  const hash = String(node.bssid || '').split(':').reduce((acc, oct) => acc + (parseInt(oct, 16) || 0), 0);
  const id = String(hash % 90 + 10);
  const bandTag = node.band === '5GHz' ? '5G' : '2.4G';
  return `NODE_${bandTag}_#${id}`;
}

function getOpsecMac(mac) {
  if (!opsecMode || !mac) return String(mac || '00:00:00:00:00:00');
  const parts = String(mac).split(':');
  if (parts.length === 6) {
    return `${parts[0]}:${parts[1]}:${parts[2]}:●●:●●:●●`;
  }
  return '●●:●●:●●:●●:●●:●●';
}

if (btnToggleOpsec) {
  btnToggleOpsec.textContent = `OPSEC: ${opsecMode ? 'ON' : 'OFF'}`;
  btnToggleOpsec.classList.toggle('active', opsecMode);
  if (wifiRadar) wifiRadar.setOpsecMode(opsecMode);

  btnToggleOpsec.addEventListener('click', () => {
    opsecMode = !opsecMode;
    localStorage.setItem('sentinel_opsec_mode', opsecMode);
    btnToggleOpsec.textContent = `OPSEC: ${opsecMode ? 'ON' : 'OFF'}`;
    btnToggleOpsec.classList.toggle('active', opsecMode);
    if (wifiRadar) wifiRadar.setOpsecMode(opsecMode);
    if (currentWifiData) updateWifiTelemetry(currentWifiData);
  });
}

let currentWifiData = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function updateBleDisplay(bleStatus) {
  if (!bleGuardVal || !bleStatus) return;
  const ownerNear = Boolean(bleStatus.owner_present);
  const ownerDev = bleStatus.owner_device;
  const total = Number(bleStatus.total_devices || 0);
  const trusted = Number(bleStatus.trusted_macs_count || 0);
  if (ownerNear && ownerDev) {
    bleGuardVal.textContent = `${ownerDev.name || 'TRUSTED BEACON'} [~${ownerDev.distance_m}m]`;
  } else if (ownerNear) {
    bleGuardVal.textContent = 'TRUSTED OPERATOR BEACON VERIFIED';
  } else if (trusted === 0) {
    bleGuardVal.textContent = `MONITORING ${total} BLE BEACON(S) [NO TRUSTED MAC]`;
  } else {
    bleGuardVal.textContent = `NO TRUSTED BEACON IN RANGE (${total} SCAN)`;
  }
  if (bleStatusBadge) {
    bleStatusBadge.textContent = ownerNear ? 'VERIFIED' : (trusted > 0 ? 'AWAY' : 'PASSIVE');
  }
}

function updateWifiTelemetry(data) {
  if (!data) return;
  currentWifiData = data;
  if (wifiRadar) {
    wifiRadar.setOpsecMode(opsecMode);
    wifiRadar.updateData(data);
  }

  // 1. Update Camera Deck & Badge (strictly DOM-built, zero innerHTML)
  const cameras = Array.isArray(data.cameras) ? data.cameras : [];
  const camCountVal = document.getElementById('camCountVal');
  const camTabCount = document.getElementById('camTabCount');
  const camSummaryCount = document.getElementById('camSummaryCount');
  const camNearestVal = document.getElementById('camNearestVal');
  const camThreatLevel = document.getElementById('camThreatLevel');
  const camerasListGrid = document.getElementById('camerasListGrid');

  if (camCountVal) camCountVal.textContent = String(cameras.length);
  if (camTabCount) camTabCount.textContent = String(cameras.length);
  if (camSummaryCount) camSummaryCount.textContent = `${cameras.length} DETECTED`;

  if (cameras.length > 0) {
    const sorted = [...cameras].sort((a, b) => (a.distance_m || 0) - (b.distance_m || 0));
    const nearest = sorted[0];
    if (camNearestVal) camNearestVal.textContent = `${nearest.vendor || nearest.brand || 'Sensor'} (${nearest.distance_m}m)`;
    if (camThreatLevel) {
      camThreatLevel.textContent = 'ELEVATED [OPTICAL SENSOR IN RANGE]';
      camThreatLevel.className = 'cam-stat-val text-red';
    }
    if (camerasListGrid) {
      camerasListGrid.textContent = '';
      sorted.forEach(c => {
        const card = el('div', 'cam-device-card');
        const hdr = el('div', 'cam-card-header');
        hdr.appendChild(el('span', 'cam-brand-badge', `CAM // ${c.vendor || c.brand || 'Unknown'}`));
        const lvl = String(c.threat_level || 'elevated').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        hdr.appendChild(el('span', `cam-threat-badge ${lvl}`, String(c.threat_level || 'ELEVATED')));
        card.appendChild(hdr);
        card.appendChild(el('div', 'cam-ssid', getOpsecSsid(c)));
        const row1 = el('div', 'cam-metrics-row');
        row1.appendChild(el('span', '', `BSSID: ${getOpsecMac(c.bssid)}`));
        row1.appendChild(el('span', 'highlight', `${c.distance_m}m (${c.rssi_dbm} dBm)`));
        card.appendChild(row1);
        const row2 = el('div', 'cam-metrics-row');
        row2.appendChild(el('span', '', `CH ${c.channel} • ${c.band}`));
        row2.appendChild(el('span', '', c.threat || 'OPTICAL'));
        card.appendChild(row2);
        camerasListGrid.appendChild(card);
      });
    }
  } else {
    if (camNearestVal) camNearestVal.textContent = 'NONE';
    if (camThreatLevel) {
      camThreatLevel.textContent = 'LOW [CLEAR]';
      camThreatLevel.className = 'cam-stat-val';
    }
    if (camerasListGrid) {
      camerasListGrid.textContent = '';
      camerasListGrid.appendChild(el('div', 'empty-state', 'No surveillance cameras or optical devices detected in ambient RF spectrum.'));
    }
  }

  // 2. Update Building Perimeter Deck
  const bp = data.building_perimeter;
  if (bp) {
    const bldgFootprintArea = document.getElementById('bldgFootprintArea');
    const bldgDimensions = document.getElementById('bldgDimensions');
    const bldgWallCount = document.getElementById('bldgWallCount');
    const bldgConfidence = document.getElementById('bldgConfidence');

    const width_m = bp.building_width_m || bp.width_m || 20.0;
    const length_m = bp.building_length_m || bp.length_m || 20.0;
    const area_sqm = bp.footprint_sqm || bp.area_sq_m || Math.round(width_m * length_m);
    const area_sqft = bp.footprint_sqft || bp.area_sq_ft || Math.round(area_sqm * 10.7639);
    const pCount = bp.estimated_partitions || (bp.interior_walls ? bp.interior_walls.length : 0);
    const conf = bp.confidence_pct || 88;

    if (bldgFootprintArea) bldgFootprintArea.textContent = `${area_sqm} m² (${area_sqft} SQ FT)`;
    if (bldgDimensions) bldgDimensions.textContent = `${width_m}m × ${length_m}m`;
    if (bldgWallCount) bldgWallCount.textContent = `${pCount} DEMISING WALLS`;
    if (bldgConfidence) bldgConfidence.textContent = `${conf}% CONFIDENCE`;
  }

  renderRfFactsTable();
}

function renderRfFactsTable() {
  if (!currentWifiData || !Array.isArray(currentWifiData.nodes)) return;
  const tbody = document.getElementById('rfFactsTableBody');
  const countEl = document.getElementById('rfTableCount');
  const searchInput = document.getElementById('rfFactsSearch');
  if (!tbody) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filtered = currentWifiData.nodes.filter(n => {
    if (!query) return true;
    return (n.ssid && String(n.ssid).toLowerCase().includes(query)) ||
           (n.vendor && String(n.vendor).toLowerCase().includes(query)) ||
           (n.bssid && String(n.bssid).toLowerCase().includes(query));
  });

  if (countEl) countEl.textContent = `${filtered.length} OF ${currentWifiData.nodes.length} NODES`;
  tbody.textContent = '';

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = el('td', 'text-center', 'No nodes match filter criteria.');
    td.colSpan = 9;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach(n => {
    const isCam = Boolean(n.is_camera);
    const tr = el('tr', isCam ? 'camera-row' : '');
    const snr = n.snr_est_db || Math.max(5, Math.round((n.signal_pct || 0) * 0.45));
    const excess = n.excess_path_loss_db || 0;
    const walls = n.walls_traversed || 0;

    const tdSsid = document.createElement('td');
    tdSsid.appendChild(el('strong', '', getOpsecSsid(n)));
    tr.appendChild(tdSsid);

    const tdVendor = document.createElement('td');
    tdVendor.appendChild(el('span', 'vendor-badge', n.vendor || 'Unknown OUI'));
    tr.appendChild(tdVendor);

    const tdBssid = document.createElement('td');
    tdBssid.appendChild(el('code', '', getOpsecMac(n.bssid)));
    tr.appendChild(tdBssid);

    tr.appendChild(el('td', '', `${n.rssi_dbm} dBm (${n.signal_pct}%)`));
    tr.appendChild(el('td', '', `${snr} dB`));
    tr.appendChild(el('td', '', `${n.band} / CH ${n.channel}`));
    tr.appendChild(el('td', '', `${walls} (${excess} dB)`));
    tr.appendChild(el('td', '', `${n.distance_m}m`));

    const tdTag = document.createElement('td');
    if (isCam) tdTag.appendChild(el('span', 'badge-tag-cam', 'CAMERA'));
    else if (n.is_disturbed) tdTag.appendChild(el('span', 'badge-tag-cam', 'MOTION'));
    else tdTag.appendChild(el('span', 'badge-tag-ap', 'AP'));
    tr.appendChild(tdTag);

    tbody.appendChild(tr);
  });
}

const rfFactsSearch = document.getElementById('rfFactsSearch');
if (rfFactsSearch) {
  rfFactsSearch.addEventListener('input', renderRfFactsTable);
}

function setOpticsMode(mode, targetBtn) {
  setActiveButton(opticsButtons, targetBtn);
  postJson('/api/vision_mode', { mode });
}

if (btnOpticsNormal) btnOpticsNormal.addEventListener('click', () => setOpticsMode('normal', btnOpticsNormal));
if (btnOpticsThermal) btnOpticsThermal.addEventListener('click', () => setOpticsMode('thermal', btnOpticsThermal));
if (btnOpticsPredator) btnOpticsPredator.addEventListener('click', () => setOpticsMode('predator', btnOpticsPredator));

if (btnRecalibrateUsb) {
  btnRecalibrateUsb.addEventListener('click', async () => {
    btnRecalibrateUsb.textContent = 'RE-INDEXING...';
    try {
      const res = await postJson('/api/usb/baseline');
      const data = await res.json();
      btnRecalibrateUsb.textContent = 'CALIBRATED!';
      if (usbGuardVal && data.status) {
        usbGuardVal.textContent = `${data.status.trusted_count} TRUSTED NODES [DEFCON 5 SECURE]`;
      }
      setTimeout(() => { btnRecalibrateUsb.textContent = 'RE-BASELINE'; }, 1500);
    } catch (e) {
      btnRecalibrateUsb.textContent = 'RE-BASELINE';
    }
  });
}

if (btnFilterAll) {
  btnFilterAll.addEventListener('click', () => {
    setActiveButton([btnFilterAll, btnFilter24, btnFilter5], btnFilterAll);
    if (wifiRadar) wifiRadar.setBandFilter('all');
  });
}
if (btnFilter24) {
  btnFilter24.addEventListener('click', () => {
    setActiveButton([btnFilterAll, btnFilter24, btnFilter5], btnFilter24);
    if (wifiRadar) wifiRadar.setBandFilter('2.4GHz');
  });
}
if (btnFilter5) {
  btnFilter5.addEventListener('click', () => {
    setActiveButton([btnFilterAll, btnFilter24, btnFilter5], btnFilter5);
    if (wifiRadar) wifiRadar.setBandFilter('5GHz');
  });
}

if (btnForceScan) {
  btnForceScan.addEventListener('click', async () => {
    btnForceScan.textContent = 'SCANNING...';
    try {
      await postJson('/api/wifi_xray/scan');
      setTimeout(() => { btnForceScan.textContent = 'SCAN NOW'; }, 1500);
    } catch (e) {
      btnForceScan.textContent = 'SCAN NOW';
    }
  });
}

if (similarityThreshold) similarityThreshold.addEventListener('input', (e) => { threshVal.textContent = e.target.value; });
if (welcomeCooldown) welcomeCooldown.addEventListener('input', (e) => { welcomeCdVal.textContent = e.target.value + 's'; });
if (intruderCooldown) intruderCooldown.addEventListener('input', (e) => { intruderCdVal.textContent = e.target.value + 's'; });
if (wifiScanInterval) {
  wifiScanInterval.addEventListener('input', (e) => {
    wifiScanIntervalVal.textContent = parseFloat(e.target.value).toFixed(1) + 's';
  });
}

function appendLog(evt) {
  if (!consoleBox || !evt) return;
  const catSafe = String(evt.category || 'SYSTEM').replace(/[^A-Za-z0-9_-]/g, '');
  const div = el('div', `log-entry ${catSafe}`);
  const tsParts = String(evt.timestamp || '').split(' ');
  const timeStr = tsParts[1] || tsParts[0] || '--:--:--';
  div.appendChild(el('span', 'time', `[${timeStr}]`));
  div.appendChild(el('span', 'msg', String(evt.message || '')));
  consoleBox.insertBefore(div, consoleBox.firstChild);

  const count = consoleBox.querySelectorAll('.log-entry').length;
  if (logCount) logCount.textContent = `${count} EVENTS`;
}

// WebSocket Connection
let ws;
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'init') {
        updateArmState(msg.data.armed);
        if (enrolledCount && msg.data.enrolled_count !== undefined) {
          enrolledCount.textContent = String(msg.data.enrolled_count);
        }
        if (msg.data.events && consoleBox) {
          consoleBox.textContent = '';
          msg.data.events.forEach(appendLog);
        }
        if (msg.data.wifi_xray) {
          updateWifiTelemetry(msg.data.wifi_xray);
        }
        if (msg.data.usb_status && usbGuardVal) {
          usbGuardVal.textContent = `${msg.data.usb_status.trusted_count} TRUSTED NODES [DEFCON 5 SECURE]`;
        }
        if (msg.data.ble_status) {
          updateBleDisplay(msg.data.ble_status);
        }
        if (msg.data.vision_mode) {
          if (msg.data.vision_mode === 'thermal' && btnOpticsThermal) setActiveButton(opticsButtons, btnOpticsThermal);
          else if (msg.data.vision_mode === 'predator' && btnOpticsPredator) setActiveButton(opticsButtons, btnOpticsPredator);
          else if (btnOpticsNormal) setActiveButton(opticsButtons, btnOpticsNormal);
        }
      } else if (msg.type === 'status') {
        updateArmState(msg.data.armed);
      } else if (msg.type === 'log') {
        appendLog(msg.data);
      } else if (msg.type === 'alert') {
        handleSecurityAlert(msg.data);
      } else if (msg.type === 'wifi_xray') {
        updateWifiTelemetry(msg.data);
      } else if (msg.type === 'rf_disturbance') {
        if (wifiRadar && msg.data.node) {
          wifiRadar.addRipple(msg.data.node.x_m, msg.data.node.y_m, '#ff1744');
        }
      } else if (msg.type === 'usb_event') {
        if (usbGuardVal) {
          const prod = (msg.data && msg.data.device && msg.data.device.product) ? msg.data.device.product : 'UNKNOWN USB';
          usbGuardVal.textContent = `HARDWARE BREACH: ${prod}`;
          usbGuardVal.style.color = 'var(--alert-red)';
        }
      } else if (msg.type === 'bluetooth_update') {
        updateBleDisplay(msg.data);
      } else if (msg.type === 'vision_mode') {
        if (msg.data.mode === 'thermal' && btnOpticsThermal) setActiveButton(opticsButtons, btnOpticsThermal);
        else if (msg.data.mode === 'predator' && btnOpticsPredator) setActiveButton(opticsButtons, btnOpticsPredator);
        else if (btnOpticsNormal) setActiveButton(opticsButtons, btnOpticsNormal);
      }
    } catch (e) {
      console.error('[WS] Parse error:', e);
    }
  };

  ws.onclose = () => {
    setTimeout(connectWebSocket, 2500);
  };
}

function updateArmState(armed) {
  isArmed = Boolean(armed);
  if (isArmed) {
    systemStateBadge.className = 'badge-status armed';
    systemStateBadge.textContent = 'ARMED';
    headerPulse.className = 'status-pulse active';
    btnToggleArm.className = 'btn-arm armed';
    btnToggleArm.textContent = 'ARMED';
  } else {
    systemStateBadge.className = 'badge-status disarmed';
    systemStateBadge.textContent = 'DISARMED';
    headerPulse.className = 'status-pulse disarmed';
    btnToggleArm.className = 'btn-arm disarmed';
    btnToggleArm.textContent = 'DISARMED';
  }
}

let alertTimeout;
function handleSecurityAlert(alertData) {
  if (!intruderAlertBanner) return;
  const textEl = intruderAlertBanner.querySelector('.alert-text');
  if (!textEl) return;
  textEl.textContent = '';

  if (alertData.type === 'intruder') {
    intruderAlertBanner.style.background = 'linear-gradient(90deg, #990000, #d91c3c, #990000)';
    textEl.appendChild(el('strong', '', 'SECURITY BREACH DETECTED: '));
    textEl.appendChild(document.createTextNode('UNAUTHORIZED TARGET SPOTTED AT CONSOLE. DISPATCHING VOCAL WARNING...'));
  } else if (alertData.type === 'shoulder') {
    intruderAlertBanner.style.background = 'linear-gradient(90deg, #92400e, #d97706, #92400e)';
    textEl.appendChild(el('strong', '', 'SHOULDER SURFER DETECTED: '));
    textEl.appendChild(document.createTextNode('SECONDARY FACE SPOTTED BEHIND OPERATOR.'));
  } else {
    return;
  }
  intruderAlertBanner.classList.add('active');
  clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    intruderAlertBanner.classList.remove('active');
  }, 6000);
  loadIntruders();
}

// Button actions
if (btnToggleArm) {
  btnToggleArm.addEventListener('click', async () => {
    const endpoint = isArmed ? '/api/disarm' : '/api/arm';
    const res = await postJson(endpoint);
    const data = await res.json();
    updateArmState(data.status === 'ARMED');
  });
}

if (btnEnroll) {
  btnEnroll.addEventListener('click', async () => {
    btnEnroll.disabled = true;
    btnEnroll.textContent = 'CAPTURING BIOMETRICS...';
    try {
      const res = await postJson('/api/enroll');
      const data = await res.json();
      if (data.enrolled_count !== undefined && enrolledCount) {
        enrolledCount.textContent = String(data.enrolled_count);
      }
      appendLog({ timestamp: new Date().toTimeString().slice(0, 8), category: 'ENROLL', message: data.message || 'Enrollment complete.' });
    } catch (e) {
      appendLog({ timestamp: new Date().toTimeString().slice(0, 8), category: 'BREACH', message: 'Enrollment failed: ' + e });
    } finally {
      btnEnroll.disabled = false;
      btnEnroll.textContent = '✦ ENROLL OPERATOR FACE';
    }
  });
}

if (btnClearFaces) {
  btnClearFaces.addEventListener('click', async () => {
    const res = await postJson('/api/clear_faces');
    const data = await res.json();
    if (enrolledCount) enrolledCount.textContent = '0';
    appendLog({ timestamp: new Date().toTimeString().slice(0, 8), category: 'ENROLL', message: data.message || 'Templates cleared.' });
  });
}

if (btnTestWelcome) btnTestWelcome.addEventListener('click', () => postJson('/api/test_voice/welcome'));
if (btnTestIntruder) btnTestIntruder.addEventListener('click', () => postJson('/api/test_voice/intruder'));
const btnTestShoulder = document.getElementById('btnTestShoulder');
if (btnTestShoulder) btnTestShoulder.addEventListener('click', () => postJson('/api/test_voice/shoulder'));

if (btnToggleHud) {
  btnToggleHud.addEventListener('click', async () => {
    hudEnabled = !hudEnabled;
    btnToggleHud.textContent = `HUD: ${hudEnabled ? 'ON' : 'OFF'}`;
    await postJson('/api/settings', { draw_hud_on_stream: hudEnabled });
  });
}

async function loadIntruders() {
  if (!snapsGrid) return;
  try {
    const res = await fetch('/api/intruders');
    const snaps = await res.json();
    snapsGrid.textContent = '';
    if (!Array.isArray(snaps) || snaps.length === 0) {
      snapsGrid.appendChild(el('div', 'empty-state', 'No breach snapshots recorded. Perimeter secure.'));
      return;
    }
    snaps.forEach(s => {
      const safeUrl = typeof s.url === 'string' && s.url.startsWith('/api/intruders/') ? s.url : '';
      if (!safeUrl) return;
      const card = el('div', 'snap-card');
      card.addEventListener('click', () => window.open(safeUrl, '_blank', 'noopener,noreferrer'));
      const img = document.createElement('img');
      img.src = safeUrl;
      img.alt = `Forensic breach snapshot ${String(s.filename || '')}`;
      card.appendChild(img);
      card.appendChild(el('div', 'snap-badge', 'BREACH'));
      snapsGrid.appendChild(card);
    });
  } catch (e) {
    console.error('Error loading intruder snaps:', e);
  }
}

if (btnRefreshSnaps) btnRefreshSnaps.addEventListener('click', loadIntruders);

const autoLockdown = document.getElementById('autoLockdown');
const desktopNotify = document.getElementById('desktopNotify');
const shoulderSurferAlert = document.getElementById('shoulderSurferAlert');
const playSoundEffects = document.getElementById('playSoundEffects');
const walkAwayLock = document.getElementById('walkAwayLock');
const walkAwayCdVal = document.getElementById('walkAwayCdVal');
const webhookUrl = document.getElementById('webhookUrl');
const btnExportAudit = document.getElementById('btnExportAudit');

if (btnExportAudit) {
  btnExportAudit.addEventListener('click', () => {
    window.location.href = '/api/export_audit';
  });
}

if (walkAwayLock) {
  walkAwayLock.addEventListener('input', (e) => {
    const v = parseInt(e.target.value, 10);
    walkAwayCdVal.textContent = v === 0 ? 'Off' : `${v}s`;
  });
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const cfg = await res.json();
    similarityThreshold.value = cfg.similarity_threshold;
    threshVal.textContent = cfg.similarity_threshold;

    welcomeCooldown.value = cfg.welcome_cooldown_sec;
    welcomeCdVal.textContent = cfg.welcome_cooldown_sec + 's';

    intruderCooldown.value = cfg.intruder_cooldown_sec;
    intruderCdVal.textContent = cfg.intruder_cooldown_sec + 's';

    ttsEngine.value = cfg.tts_engine;
    hudEnabled = cfg.draw_hud_on_stream !== false;
    btnToggleHud.textContent = `HUD: ${hudEnabled ? 'ON' : 'OFF'}`;

    if (autoLockdown) autoLockdown.checked = !!cfg.auto_lockdown_on_breach;
    if (desktopNotify) desktopNotify.checked = cfg.desktop_notifications !== false;
    if (shoulderSurferAlert) shoulderSurferAlert.checked = cfg.shoulder_surfer_alert !== false;
    if (playSoundEffects) playSoundEffects.checked = cfg.play_sound_effects !== false;
    if (wifiXrayEnabled) wifiXrayEnabled.checked = cfg.wifi_xray_enabled !== false;
    if (rfPresenceAlerts) rfPresenceAlerts.checked = cfg.rf_presence_alerts !== false;
    if (rfAudioPing) rfAudioPing.checked = cfg.rf_audio_ping !== false;
    if (wifiScanInterval) {
      const interval = cfg.wifi_scan_interval_sec || 3.0;
      wifiScanInterval.value = interval;
      if (wifiScanIntervalVal) wifiScanIntervalVal.textContent = parseFloat(interval).toFixed(1) + 's';
    }
    if (walkAwayLock) {
      const v = cfg.walk_away_lock_sec || 0;
      walkAwayLock.value = v;
      walkAwayCdVal.textContent = v === 0 ? 'Off' : `${v}s`;
    }
    if (webhookUrl) webhookUrl.value = cfg.webhook_url || '';
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

if (btnSaveSettings) {
  btnSaveSettings.addEventListener('click', async () => {
    btnSaveSettings.textContent = 'SAVING...';
    const payload = {
      similarity_threshold: parseFloat(similarityThreshold.value),
      welcome_cooldown_sec: parseFloat(welcomeCooldown.value),
      intruder_cooldown_sec: parseFloat(intruderCooldown.value),
      tts_engine: ttsEngine.value,
      auto_lockdown_on_breach: autoLockdown ? autoLockdown.checked : false,
      desktop_notifications: desktopNotify ? desktopNotify.checked : true,
      shoulder_surfer_alert: shoulderSurferAlert ? shoulderSurferAlert.checked : true,
      play_sound_effects: playSoundEffects ? playSoundEffects.checked : true,
      wifi_xray_enabled: wifiXrayEnabled ? wifiXrayEnabled.checked : true,
      rf_presence_alerts: rfPresenceAlerts ? rfPresenceAlerts.checked : true,
      rf_audio_ping: rfAudioPing ? rfAudioPing.checked : true,
      wifi_scan_interval_sec: wifiScanInterval ? parseFloat(wifiScanInterval.value) : 3.0,
      walk_away_lock_sec: walkAwayLock ? parseFloat(walkAwayLock.value) : 0,
      webhook_url: webhookUrl ? webhookUrl.value.trim() : ''
    };
    const res = await postJson('/api/settings', payload);
    btnSaveSettings.textContent = res.ok ? 'CONFIGURATION SAVED!' : 'VALIDATION ERROR (CHECK INPUTS)';
    setTimeout(() => { btnSaveSettings.textContent = 'SAVE CONFIGURATION'; }, 1800);
  });
}

async function pollMetrics() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (fpsCounter) fpsCounter.textContent = data.fps || '--';
    if (enrolledCount && data.enrolled_count !== undefined) enrolledCount.textContent = String(data.enrolled_count);
  } catch (e) {
    if (fpsCounter) fpsCounter.textContent = '--';
  }
}

async function loadInitialWifiXray() {
  try {
    const res = await fetch('/api/wifi_xray');
    const data = await res.json();
    if (data && data.nodes) {
      updateWifiTelemetry(data);
    }
  } catch (e) {
    console.warn('Initial WiFi X-Ray load:', e);
  }
}

// Initial bootstrap
connectWebSocket();
loadSettings();
loadIntruders();
loadInitialWifiXray();
setInterval(pollMetrics, 3000);

// Biometric Oscilloscope Waveform Visualizer
function initWaveformVisualizer() {
  const canvas = document.getElementById('waveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let phase = 0;

  function renderWaveform() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#00ff88';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';

    ctx.beginPath();
    const midY = canvas.height / 2;
    for (let x = 0; x < canvas.width; x++) {
      const freq = 0.035;
      const noise = Math.sin(x * 0.1 + phase) * 1.5;
      const y = midY + Math.sin(x * freq + phase) * 7 + Math.cos(x * 0.018 - phase) * 4 + noise;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    phase += 0.08;
    requestAnimationFrame(renderWaveform);
  }
  requestAnimationFrame(renderWaveform);
}
initWaveformVisualizer();
