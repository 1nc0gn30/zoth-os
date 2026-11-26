/**
 * Anderson Sentinel // Autonomous Standalone In-Browser Tactical Ops Cockpit
 * Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
 */

(function () {
  'use strict';

  // --- Toast Notification Helper ---
  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3500);
  }
  window.showToast = showToast;

  // --- Optics & Video Processing ---
  let opticsMode = 'optical'; // 'optical', 'thermal', 'predator'
  let isArmed = true;
  let hudEnabled = true;
  let enrolledFaces = parseInt(localStorage.getItem('anderson_enrolled_faces') || '0', 10);

  const videoEl = document.createElement('video');
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.muted = true;

  const videoCanvas = document.getElementById('videoCanvas');
  const videoCtx = videoCanvas ? videoCanvas.getContext('2d') : null;
  let cameraStream = null;
  let simTime = 0;

  async function initCamera() {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      videoEl.srcObject = cameraStream;
      videoEl.play();
    } catch (err) {
      console.warn('[AndersonSentinel] Camera access unavailable or permission denied. Falling back to synthetic optics simulator.', err);
    }
  }

  // Color mapper for Thermal Ironbow
  function getIronbowColor(lum) {
    // lum: 0 to 255
    const t = lum / 255;
    let r = 0, g = 0, b = 0;
    if (t < 0.2) {
      b = Math.floor(t * 5 * 255);
    } else if (t < 0.4) {
      b = 255;
      r = Math.floor((t - 0.2) * 5 * 255);
    } else if (t < 0.7) {
      r = 255;
      b = Math.floor((1 - (t - 0.4) / 0.3) * 255);
      g = Math.floor(((t - 0.4) / 0.3) * 180);
    } else if (t < 0.9) {
      r = 255;
      g = 180 + Math.floor(((t - 0.7) / 0.2) * 75);
      b = 0;
    } else {
      r = 255;
      g = 255;
      b = Math.floor(((t - 0.9) / 0.1) * 255);
    }
    return [r, g, b];
  }

  function renderVideoFrame() {
    if (!videoCtx || !videoCanvas) return;
    simTime += 0.03;

    const w = videoCanvas.width;
    const h = videoCanvas.height;

    if (cameraStream && videoEl.readyState >= 2) {
      videoCtx.drawImage(videoEl, 0, 0, w, h);
      if (opticsMode !== 'optical') {
        const imgData = videoCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (opticsMode === 'thermal') {
            const [r, g, b] = getIronbowColor(lum);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          } else if (opticsMode === 'predator') {
            data[i] = 0;
            data[i + 1] = Math.min(255, lum * 1.4);
            data[i + 2] = Math.floor(lum * 0.3);
          }
        }
        videoCtx.putImageData(imgData, 0, 0);
      }
    } else {
      // Procedural synthetic thermal simulator
      videoCtx.fillStyle = opticsMode === 'predator' ? '#041008' : '#05080f';
      videoCtx.fillRect(0, 0, w, h);

      // Draw subtle thermal body silhouette
      const cx = w / 2 + Math.sin(simTime * 0.5) * 20;
      const cy = h / 2 + Math.cos(simTime * 0.7) * 15;

      const grad = videoCtx.createRadialGradient(cx, cy - 20, 10, cx, cy, 140);
      if (opticsMode === 'thermal') {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffcc00');
        grad.addColorStop(0.6, '#ff0055');
        grad.addColorStop(0.85, '#4400aa');
        grad.addColorStop(1, '#05080f');
      } else if (opticsMode === 'predator') {
        grad.addColorStop(0, '#88ffaa');
        grad.addColorStop(0.4, '#00ff88');
        grad.addColorStop(0.8, '#004422');
        grad.addColorStop(1, '#041008');
      } else {
        grad.addColorStop(0, '#102838');
        grad.addColorStop(0.6, '#081420');
        grad.addColorStop(1, '#05080f');
      }
      videoCtx.fillStyle = grad;
      videoCtx.beginPath();
      videoCtx.arc(cx, cy - 30, 45, 0, Math.PI * 2);
      videoCtx.arc(cx, cy + 80, 85, 0, Math.PI * 2);
      videoCtx.fill();
    }

    // Overlay Tactical HUD Reticle
    if (hudEnabled) {
      const cx = w / 2;
      const cy = h / 2;

      videoCtx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
      videoCtx.lineWidth = 1;

      // Center crosshairs
      videoCtx.beginPath();
      videoCtx.moveTo(cx - 20, cy);
      videoCtx.lineTo(cx + 20, cy);
      videoCtx.moveTo(cx, cy - 20);
      videoCtx.lineTo(cx, cy + 20);
      videoCtx.stroke();

      // Bounding box for detected operator
      const boxW = 160 + Math.sin(simTime) * 4;
      const boxH = 200 + Math.cos(simTime) * 4;
      videoCtx.strokeStyle = isArmed ? '#00ff88' : '#64748b';
      videoCtx.lineWidth = 1.5;
      videoCtx.strokeRect(cx - boxW / 2, cy - boxH / 2 - 20, boxW, boxH);

      // Corner brackets
      const len = 15;
      const left = cx - boxW / 2;
      const right = cx + boxW / 2;
      const top = cy - boxH / 2 - 20;
      const bottom = cy + boxH / 2 - 20;

      videoCtx.strokeStyle = '#00e5ff';
      videoCtx.beginPath();
      // TL
      videoCtx.moveTo(left, top + len); videoCtx.lineTo(left, top); videoCtx.lineTo(left + len, top);
      // TR
      videoCtx.moveTo(right - len, top); videoCtx.lineTo(right, top); videoCtx.lineTo(right, top + len);
      // BL
      videoCtx.moveTo(left, bottom - len); videoCtx.lineTo(left, bottom); videoCtx.lineTo(left + len, bottom);
      // BR
      videoCtx.moveTo(right - len, bottom); videoCtx.lineTo(right, bottom); videoCtx.lineTo(right, bottom - len);
      videoCtx.stroke();

      // HUD text
      videoCtx.fillStyle = '#00ff88';
      videoCtx.font = "11px 'JetBrains Mono', monospace";
      videoCtx.fillText(`TRACK ID: ANDERSON-01 [${enrolledFaces > 0 ? 'ENROLLED' : 'SYNTHETIC'}]`, left, top - 8);
      videoCtx.fillText(`CONF: ${(94.2 + Math.sin(simTime * 2) * 3.8).toFixed(1)}% | MODE: ${opticsMode.toUpperCase()}`, left, bottom + 16);
    }

    requestAnimationFrame(renderVideoFrame);
  }

  // --- Biometric Waveform Radar ---
  const waveformCanvas = document.getElementById('waveformCanvas');
  const waveCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
  let waveOffset = 0;

  function renderWaveform() {
    if (!waveCtx || !waveformCanvas) return;
    waveOffset += 0.08;

    const w = waveformCanvas.width;
    const h = waveformCanvas.height;

    waveCtx.fillStyle = 'rgba(5, 8, 12, 0.25)';
    waveCtx.fillRect(0, 0, w, h);

    waveCtx.strokeStyle = '#00e5ff';
    waveCtx.lineWidth = 1.5;
    waveCtx.beginPath();

    for (let x = 0; x < w; x += 3) {
      const t = x * 0.04 + waveOffset;
      // Synthetic cardiac & micro-Doppler pulse shape
      const y = h / 2 + Math.sin(t) * 8 + Math.sin(t * 3.5) * 4 + (Math.sin(t * 0.5) > 0.85 ? Math.sin(t * 12) * 12 : 0);
      if (x === 0) waveCtx.moveTo(x, y);
      else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();

    requestAnimationFrame(renderWaveform);
  }

  // --- Initialize Synthetic RF Radar ---
  let wifiRadar = null;

  function initRadarEngine() {
    if (typeof WifiXrayRadar !== 'undefined') {
      wifiRadar = new WifiXrayRadar('wifiRadarCanvas');

      // Populate realistic ambient RF beacons
      const syntheticNodes = [
        { ssid: 'NullAI-Net-5G', bssid: '24:A4:3C:9B:41:10', rssi: -42, freq: 5200, dist: 2.1, angle: 0.85, isCamera: false },
        { ssid: 'Anderson-Vault-2.4', bssid: '70:85:C2:55:12:AA', rssi: -58, freq: 2437, dist: 4.8, angle: 2.4, isCamera: false },
        { ssid: 'Wyze-Cam-V3-Demising', bssid: '2C:AA:8E:11:F2:04', rssi: -66, freq: 2412, dist: 6.2, angle: 4.1, isCamera: true },
        { ssid: 'Ring-Floodlight-West', bssid: '9C:76:13:8A:BC:31', rssi: -74, freq: 2462, dist: 9.5, angle: 5.3, isCamera: true },
        { ssid: 'Nest-Cam-EastHall', bssid: '18:B4:30:44:88:19', rssi: -69, freq: 5745, dist: 7.4, angle: 1.6, isCamera: true },
        { ssid: 'Adjacent-Tenant-AP', bssid: 'E0:63:DA:33:91:80', rssi: -82, freq: 5180, dist: 13.8, angle: 3.7, isCamera: false },
      ];

      syntheticNodes.forEach(node => {
        const x_m = Math.cos(node.angle) * node.dist;
        const y_m = Math.sin(node.angle) * node.dist;
        const signal_pct = Math.max(10, Math.min(100, Math.round((node.rssi + 100) * 1.6)));
        wifiRadar.nodes.push({
          ...node,
          x: x_m * 12,
          y: y_m * 12,
          x_m,
          y_m,
          distance_m: node.dist,
          rssi_dbm: node.rssi,
          signal_pct,
          band: node.freq >= 5000 ? '5GHz' : '2.4GHz',
          is_camera: node.isCamera,
        });
      });

      // Update counters
      const camCount = syntheticNodes.filter(n => n.isCamera).length;
      const camTagBadge = document.getElementById('camCountVal');
      const camTabCount = document.getElementById('camTabCount');
      const camSummaryCount = document.getElementById('camSummaryCount');
      if (camTagBadge) camTagBadge.textContent = camCount;
      if (camTabCount) camTabCount.textContent = camCount;
      if (camSummaryCount) camSummaryCount.textContent = `${camCount} DETECTED`;

      const rfNodeCount = document.getElementById('rfNodeCount');
      if (rfNodeCount) rfNodeCount.textContent = `${syntheticNodes.length} BEACONS`;

      const rfNearestNode = document.getElementById('rfNearestNode');
      if (rfNearestNode) rfNearestNode.textContent = `${syntheticNodes[0].ssid} (-42 dBm)`;

      const rfRoomDim = document.getElementById('rfRoomDim');
      if (rfRoomDim) rfRoomDim.textContent = '14.2m × 9.8m';

      const bldgFootprintArea = document.getElementById('bldgFootprintArea');
      if (bldgFootprintArea) bldgFootprintArea.textContent = '139.1 m² (1,497 SQ FT)';

      const bldgDimensions = document.getElementById('bldgDimensions');
      if (bldgDimensions) bldgDimensions.textContent = '14.2m × 9.8m';

      const bldgWallCount = document.getElementById('bldgWallCount');
      if (bldgWallCount) bldgWallCount.textContent = '3 DEMISING WALLS';

      const bldgConfidence = document.getElementById('bldgConfidence');
      if (bldgConfidence) bldgConfidence.textContent = '96.4%';

      // Populate Cameras List Grid (DOM-safe, zero innerHTML)
      const camerasListGrid = document.getElementById('camerasListGrid');
      if (camerasListGrid) {
        camerasListGrid.textContent = '';
        syntheticNodes.filter(n => n.isCamera).forEach(cam => {
          const card = document.createElement('div');
          card.className = 'cam-device-card';

          const hdr = document.createElement('div');
          hdr.className = 'cam-card-header';
          const brandSpan = document.createElement('span');
          brandSpan.className = 'cam-brand-badge';
          brandSpan.textContent = `CAM // ${cam.ssid}`;
          const bssidSpan = document.createElement('span');
          bssidSpan.className = 'cam-threat-badge';
          bssidSpan.textContent = cam.bssid;
          hdr.appendChild(brandSpan);
          hdr.appendChild(bssidSpan);
          card.appendChild(hdr);

          const row1 = document.createElement('div');
          row1.className = 'cam-metrics-row';
          const dSpan = document.createElement('span');
          dSpan.textContent = `Distance: ${cam.dist}m · Signal: ${cam.rssi} dBm`;
          row1.appendChild(dSpan);
          card.appendChild(row1);

          const row2 = document.createElement('div');
          row2.className = 'cam-metrics-row';
          const fSpan = document.createElement('span');
          fSpan.textContent = `Freq: ${cam.freq} MHz · Wall Attenuation: +4.2 dB`;
          row2.appendChild(fSpan);
          card.appendChild(row2);

          camerasListGrid.appendChild(card);
        });
      }

      // Micro-Doppler updates
      setInterval(() => {
        const speed = (Math.random() * 0.08).toFixed(2);
        const distEl = document.getElementById('rfDisturbanceVal');
        const distBar = document.getElementById('rfDisturbanceBar');
        const speedEl = document.getElementById('rfDopplerSpeed');
        const respEl = document.getElementById('rfRespirationBpm');

        const distPct = (Math.random() * 8 + 2).toFixed(1);
        if (distEl) distEl.textContent = `${distPct}%`;
        if (distBar) distBar.style.width = `${distPct}%`;
        if (speedEl) speedEl.textContent = `${speed} m/s [STATIC]`;
        if (respEl) respEl.textContent = `${Math.floor(14 + Math.random() * 3)} BPM`;
      }, 2000);
    }
  }

  // --- UI Handlers & Interceptors ---
  function setupEventHandlers() {
    // Mode buttons
    const btnOpticsNormal = document.getElementById('btnOpticsNormal');
    const btnOpticsThermal = document.getElementById('btnOpticsThermal');
    const btnOpticsPredator = document.getElementById('btnOpticsPredator');

    function setActiveOptics(mode, activeBtn) {
      opticsMode = mode;
      [btnOpticsNormal, btnOpticsThermal, btnOpticsPredator].forEach(b => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    }

    if (btnOpticsNormal) btnOpticsNormal.addEventListener('click', () => setActiveOptics('optical', btnOpticsNormal));
    if (btnOpticsThermal) btnOpticsThermal.addEventListener('click', () => setActiveOptics('thermal', btnOpticsThermal));
    if (btnOpticsPredator) btnOpticsPredator.addEventListener('click', () => setActiveOptics('predator', btnOpticsPredator));

    const btnToggleHud = document.getElementById('btnToggleHud');
    if (btnToggleHud) {
      btnToggleHud.addEventListener('click', () => {
        hudEnabled = !hudEnabled;
        btnToggleHud.textContent = `HUD: ${hudEnabled ? 'ON' : 'OFF'}`;
      });
    }

    const btnToggleArm = document.getElementById('btnToggleArm');
    const systemStateBadge = document.getElementById('systemStateBadge');
    if (btnToggleArm) {
      btnToggleArm.addEventListener('click', () => {
        isArmed = !isArmed;
        btnToggleArm.textContent = isArmed ? 'ARMED' : 'DISARMED';
        btnToggleArm.className = `btn-arm ${isArmed ? 'armed' : 'disarmed'}`;
        if (systemStateBadge) {
          systemStateBadge.textContent = isArmed ? 'ARMED' : 'STANDBY';
          systemStateBadge.className = `badge-status ${isArmed ? 'armed' : 'standby'}`;
        }
      });
    }

    const btnEnroll = document.getElementById('btnEnroll');
    const enrolledCount = document.getElementById('enrolledCount');
    if (btnEnroll) {
      btnEnroll.addEventListener('click', () => {
        enrolledFaces++;
        localStorage.setItem('anderson_enrolled_faces', String(enrolledFaces));
        if (enrolledCount) enrolledCount.textContent = String(enrolledFaces);
        showToast(`Face template enrolled successfully. Baseline vectors updated for Mr. Anderson.`);
      });
    }

    const btnClearFaces = document.getElementById('btnClearFaces');
    if (btnClearFaces) {
      btnClearFaces.addEventListener('click', () => {
        enrolledFaces = 0;
        localStorage.removeItem('anderson_enrolled_faces');
        if (enrolledCount) enrolledCount.textContent = '0';
        showToast('All biometric face templates cleared.');
      });
    }

    // Radar mode switches
    const btnRadarTopDown = document.getElementById('btnRadarTopDown');
    const btnRadarIso = document.getElementById('btnRadarIso');
    const btnRadar3D = document.getElementById('btnRadar3D');
    const btnRadarBuilding = document.getElementById('btnRadarBuilding');
    const btnRadarHeatmap = document.getElementById('btnRadarHeatmap');

    const radarBtns = [btnRadarTopDown, btnRadarIso, btnRadar3D, btnRadarBuilding, btnRadarHeatmap];

    function setRadarMode(mode, activeBtn) {
      if (!wifiRadar) return;
      wifiRadar.mode = mode;
      radarBtns.forEach(b => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    }

    if (btnRadarTopDown) btnRadarTopDown.addEventListener('click', () => setRadarMode('radar', btnRadarTopDown));
    if (btnRadarIso) btnRadarIso.addEventListener('click', () => setRadarMode('isometric', btnRadarIso));
    if (btnRadar3D) btnRadar3D.addEventListener('click', () => setRadarMode('3d_orbit', btnRadar3D));
    if (btnRadarBuilding) btnRadarBuilding.addEventListener('click', () => setRadarMode('building', btnRadarBuilding));
    if (btnRadarHeatmap) btnRadarHeatmap.addEventListener('click', () => setRadarMode('heatmap', btnRadarHeatmap));

    // Inspector Tabs
    const btnTabCameras = document.getElementById('btnTabCameras');
    const btnTabBuilding = document.getElementById('btnTabBuilding');
    const btnTabRfFacts = document.getElementById('btnTabRfFacts');

    const panelCameras = document.getElementById('panelCameras');
    const panelBuilding = document.getElementById('panelBuilding');
    const panelRfFacts = document.getElementById('panelRfFacts');

    function setTab(tab) {
      [btnTabCameras, btnTabBuilding, btnTabRfFacts].forEach(b => b && b.classList.remove('active'));
      [panelCameras, panelBuilding, panelRfFacts].forEach(p => p && (p.style.display = 'none'));

      if (tab === 'cameras') {
        if (btnTabCameras) btnTabCameras.classList.add('active');
        if (panelCameras) panelCameras.style.display = 'block';
      } else if (tab === 'building') {
        if (btnTabBuilding) btnTabBuilding.classList.add('active');
        if (panelBuilding) panelBuilding.style.display = 'block';
      } else if (tab === 'rf') {
        if (btnTabRfFacts) btnTabRfFacts.classList.add('active');
        if (panelRfFacts) panelRfFacts.style.display = 'block';
      }
    }

    if (btnTabCameras) btnTabCameras.addEventListener('click', () => setTab('cameras'));
    if (btnTabBuilding) btnTabBuilding.addEventListener('click', () => setTab('building'));
    if (btnTabRfFacts) btnTabRfFacts.addEventListener('click', () => setTab('rf'));

    // Forensic Dossier Export (100% Open Access)
    const btnExportReport = document.getElementById('btnExportReport');

    function handleExportClick(e) {
      if (e && e.preventDefault) e.preventDefault();

      // Export forensic dossier
      const report = {
        system: 'Anderson Security Sentinel v2.6.0',
        timestamp: new Date().toISOString(),
        operator: 'Mr. Anderson',
        enrolledFaces: enrolledFaces,
        status: isArmed ? 'ARMED' : 'DISARMED',
        rfSpectrum: {
          detectedNodes: 6,
          surveillanceCameras: 3,
          buildingEnvelope: '14.2m × 9.8m',
          demisingWalls: 3,
          structuralConfidence: '96.4%'
        },
        telemetry: {
          respiration: '15 BPM',
          microDopplerSpeed: '0.00 m/s',
          defcon: '5 [CLEAR]'
        }
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anderson_forensic_report_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    window.handleExportClick = handleExportClick;
    window.exportForensicReport = handleExportClick;

    if (btnExportReport) {
      btnExportReport.addEventListener('click', handleExportClick);
    }
  }

  // --- Document Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initCamera();
    renderVideoFrame();
    renderWaveform();
    initRadarEngine();
    setupEventHandlers();

    // FPS loop
    let lastTime = performance.now();
    let frames = 0;
    const fpsCounter = document.getElementById('fpsCounter');

    function updateFps() {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        if (fpsCounter) fpsCounter.textContent = `${frames} FPS`;
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(updateFps);
    }
    updateFps();
  });
})();
