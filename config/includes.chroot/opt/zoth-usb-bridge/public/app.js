const state = {
  adbDevices: [],
  usbDevices: [],
  selectedSerial: null,
};

const el = (id) => document.getElementById(id);

function setWirelessStatus(msg) {
  el('wirelessStatus').textContent = msg;
}

function updateTargetControls() {
  const dev = state.adbDevices.find((d) => d.serial === state.selectedSerial);
  const ready = Boolean(dev && dev.state === 'device');
  el('activeTargetHeading').textContent = dev
    ? `${dev.modelName || dev.model || dev.serial} (${dev.state})`
    : 'No device selected';
  el('tcpipBtn').disabled = !ready || dev.transport === 'tcpip';
  el('reverseBtn').disabled = !ready;
  el('scrcpyBtn').disabled = !ready;
  el('screenshotBtn').disabled = !ready;
}

function renderDevices() {
  const adbWrap = el('adbDevicesList');
  const onlineCount = state.adbDevices.filter((d) => d.state === 'device').length;
  el('adbCountBadge').textContent = `${onlineCount} online / ${state.adbDevices.length} total`;

  if (!state.adbDevices.length) {
    adbWrap.innerHTML =
      '<div class="empty-state">No ADB devices attached. Connect a phone via USB with Developer Mode + USB Debugging enabled, or pair over Wi-Fi below.</div>';
  } else {
    adbWrap.innerHTML = '';
    for (const dev of state.adbDevices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `device-item ${dev.serial === state.selectedSerial ? 'active' : ''}`;
      const title = dev.modelName || dev.model || dev.serial;
      const details = [
        `serial: ${dev.serial}`,
        `state: ${dev.state}`,
        `transport: ${dev.transport.toUpperCase()}`,
        dev.androidVersion ? `Android ${dev.androidVersion} (API ${dev.sdk})` : null,
        dev.battery ? `Batt ${dev.battery}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      btn.innerHTML = `<div class="device-row"><span>${title}</span><span class="pill">${dev.state}</span></div><div class="device-meta">${details}</div>`;
      btn.addEventListener('click', () => {
        state.selectedSerial = dev.serial;
        renderDevices();
        updateTargetControls();
      });
      adbWrap.appendChild(btn);
    }
  }

  const usbWrap = el('usbDevicesList');
  el('usbCountBadge').textContent = `${state.usbDevices.length} USB`;
  if (!state.usbDevices.length) {
    usbWrap.innerHTML = '<div class="empty-state">No USB peripherals reported by lsusb.</div>';
  } else {
    usbWrap.innerHTML = '';
    for (const u of state.usbDevices) {
      const div = document.createElement('div');
      div.className = `usb-item ${u.likely_mobile ? 'mobile' : ''}`;
      div.textContent = u.raw || `Bus ${u.bus} Dev ${u.device} [${u.vid_pid}] ${u.name}`;
      usbWrap.appendChild(div);
    }
  }
  updateTargetControls();
}

async function fetchHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    const active = Object.entries(data.tools || {})
      .filter(([, ok]) => ok)
      .map(([k]) => k)
      .join(' · ');
    el('hostToolsPill').textContent = active ? `Host: ${active}` : 'Host tools missing';
  } catch {
    el('hostToolsPill').textContent = 'Daemon offline';
  }
}

async function refreshDevices() {
  try {
    const res = await fetch('/api/devices');
    const data = await res.json();
    state.adbDevices = data.adb_devices || [];
    state.usbDevices = data.usb_devices || [];
    if (!state.selectedSerial || !state.adbDevices.some((d) => d.serial === state.selectedSerial)) {
      const firstReady = state.adbDevices.find((d) => d.state === 'device') || state.adbDevices[0];
      state.selectedSerial = firstReady ? firstReady.serial : null;
    }
    renderDevices();
  } catch (err) {
    setWirelessStatus(`Refresh error: ${err.message}`);
  }
}

async function postJson(path, payload) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return res.json();
}

async function runShellCommand(cmd) {
  if (!state.selectedSerial) {
    el('shellOutput').textContent = 'Select an authorized device first.';
    return;
  }
  el('shellOutput').textContent = `$ adb -s ${state.selectedSerial} shell ${cmd}\nRunning...`;
  const data = await postJson('/api/adb/shell', { serial: state.selectedSerial, command: cmd });
  el('shellOutput').textContent =
    `$ adb -s ${state.selectedSerial} shell ${cmd}\n` +
    (data.stdout || '') +
    (data.stderr ? `\n[stderr]\n${data.stderr}` : '');
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    el(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

document.querySelectorAll('.chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    el('shellCmdInput').value = btn.dataset.cmd;
    runShellCommand(btn.dataset.cmd);
  });
});

el('runShellBtn').addEventListener('click', () => {
  const cmd = el('shellCmdInput').value.trim();
  if (cmd) runShellCommand(cmd);
});

el('shellCmdInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = el('shellCmdInput').value.trim();
    if (cmd) runShellCommand(cmd);
  }
});

el('refreshBtn').addEventListener('click', refreshDevices);

el('pairBtn').addEventListener('click', async () => {
  const endpoint = el('pairEndpoint').value.trim();
  const code = el('pairCode').value.trim();
  setWirelessStatus(`Pairing ${endpoint}...`);
  const data = await postJson('/api/adb/pair', { endpoint, code });
  setWirelessStatus(data.ok ? data.stdout || 'Paired successfully!' : data.error || data.stderr);
  await refreshDevices();
});

el('connectBtn').addEventListener('click', async () => {
  const endpoint = el('connectEndpoint').value.trim();
  setWirelessStatus(`Connecting to ${endpoint}...`);
  const data = await postJson('/api/adb/connect', { endpoint });
  setWirelessStatus(data.ok ? data.stdout || 'Connected!' : data.error || data.stderr);
  await refreshDevices();
});

el('disconnectBtn').addEventListener('click', async () => {
  const data = await postJson('/api/adb/disconnect', {});
  setWirelessStatus(data.stdout || 'Disconnected wireless ADB sessions.');
  await refreshDevices();
});

el('tcpipBtn').addEventListener('click', async () => {
  if (!state.selectedSerial) return;
  setWirelessStatus('Switching USB device to ADB over Wi-Fi (:5555)...');
  const data = await postJson('/api/adb/tcpip', { serial: state.selectedSerial, port: 5555 });
  if (data.suggested_connect) el('connectEndpoint').value = data.suggested_connect;
  setWirelessStatus(
    data.ok
      ? `tcpip 5555 active. ${data.suggested_connect ? `Connect at ${data.suggested_connect}` : ''}`
      : data.error || data.stderr
  );
  await refreshDevices();
});

el('reverseBtn').addEventListener('click', async () => {
  if (!state.selectedSerial) return;
  const data = await postJson('/api/adb/reverse', { serial: state.selectedSerial, remotePort: 3000, localPort: 3000 });
  el('shellOutput').textContent = data.ok
    ? `Port reverse active: device tcp:3000 -> host 127.0.0.1:3000`
    : data.error || data.stderr;
});

el('scrcpyBtn').addEventListener('click', async () => {
  if (!state.selectedSerial) return;
  const data = await postJson('/api/scrcpy/launch', { serial: state.selectedSerial });
  setWirelessStatus(data.ok ? `scrcpy launched (PID ${data.pid})` : data.error);
});

el('screenshotBtn').addEventListener('click', async () => {
  if (!state.selectedSerial) return;
  document.querySelector('[data-tab="screen"]').click();
  el('screenPreviewWrap').innerHTML = '<div class="empty-state">Capturing device frame...</div>';
  const data = await postJson('/api/adb/screenshot', { serial: state.selectedSerial });
  if (data.ok && data.dataUrl) {
    el('screenPreviewWrap').innerHTML = `<img src="${data.dataUrl}" alt="Live screen capture from ${state.selectedSerial}" />`;
  } else {
    el('screenPreviewWrap').innerHTML = `<div class="empty-state">${data.error || 'Capture failed'}</div>`;
  }
});

el('fetchLogcatBtn').addEventListener('click', async () => {
  if (!state.selectedSerial) return;
  el('logcatOutput').textContent = 'Fetching logcat...';
  const data = await postJson('/api/adb/logcat', { serial: state.selectedSerial, lines: 80 });
  el('logcatOutput').textContent = data.ok ? data.stdout || '(empty logcat)' : data.error || data.stderr;
});

el('fetchPackagesBtn').addEventListener('click', async () => {
  if (!state.selectedSerial) return;
  const wrap = el('packagesOutput');
  wrap.innerHTML = '<div class="empty-state">Listing packages...</div>';
  const data = await postJson('/api/adb/packages', { serial: state.selectedSerial });
  if (!data.ok) {
    wrap.innerHTML = `<div class="empty-state">${data.error || data.stderr}</div>`;
    return;
  }
  wrap.innerHTML = '';
  for (const pkg of data.packages || []) {
    const d = document.createElement('div');
    d.className = 'pkg-pill';
    d.textContent = pkg;
    wrap.appendChild(d);
  }
});

el('webUsbBtn').addEventListener('click', async () => {
  if (!navigator.usb) {
    setWirelessStatus('WebUSB API unavailable in this browser context.');
    return;
  }
  try {
    const dev = await navigator.usb.requestDevice({ filters: [] });
    setWirelessStatus(`WebUSB Selected: ${dev.productName || 'USB Device'} (VID:${dev.vendorId.toString(16)} PID:${dev.productId.toString(16)})`);
  } catch (err) {
    setWirelessStatus(`WebUSB prompt closed: ${err.message}`);
  }
});

el('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

fetchHealth();
refreshDevices();
setInterval(refreshDevices, 5000);
