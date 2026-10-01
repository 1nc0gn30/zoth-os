const { ipcRenderer } = require('electron');

let tools = [];
let bundles = {};
let currentTab = 'all';
let searchQuery = '';

const grid = document.getElementById('tools-grid');
const mainContent = document.getElementById('main-content');
const searchInput = document.getElementById('search-input');
const logDrawer = document.getElementById('log-drawer');
const logBody = document.getElementById('log-body');
const logTitle = document.getElementById('log-title');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// Init
window.addEventListener('DOMContentLoaded', () => {
  refreshTools();
  ipcRenderer.send('get-bundles');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
  });
});

function refreshTools() {
  ipcRenderer.send('get-tools');
  ipcRenderer.send('get-bundles');
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcRenderer.on('tools-list', (_event, data) => {
  tools = data;
  updateTelemetry();
  render();
});

ipcRenderer.on('bundles-list', (_event, data) => {
  bundles = data;
  if (currentTab === 'bundles') render();
});

ipcRenderer.on('install-start', (_event, d) => {
  showDrawer(`✦ PROVISIONING: ${d.label.toUpperCase()} (${d.total} TOOLS)...`);
  progressFill.style.width = '0%';
  progressText.textContent = `0% (0/${d.total})`;
  appendLog(`\n=======================================================\n[+] Initiating non-interactive unattended installation for: ${d.label}\n=======================================================\n`);
});

ipcRenderer.on('install-log', (_event, d) => {
  const text = d.text;
  
  // Parse PROGRESS:curr:total:pct:pkg
  const match = text.match(/PROGRESS:(\d+):(\d+):(\d+):([\w\-.]+)/);
  if (match) {
    const [, curr, total, pct, pkg] = match;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${pct}% (${curr}/${total})`;
    logTitle.textContent = `PROVISIONING [${curr}/${total}]: ${pkg}`;
  }

  const finalMatch = text.match(/PROGRESS_FINAL:(\d+):(\d+):(\d+)/);
  if (finalMatch) {
    const [, success, skipped, total] = finalMatch;
    progressFill.style.width = '100%';
    progressText.textContent = `100% (${total}/${total})`;
    logTitle.textContent = `COMPLETE: ${success} INSTALLED, ${skipped} SKIPPED`;
  }

  appendLog(text);
});

ipcRenderer.on('install-done', (_event, _d) => {
  appendLog(`\n[✓] Finished batch task. Refreshing tool status...\n`);
  refreshTools();
});

ipcRenderer.on('fix-complete', (_event, d) => {
  appendLog(`\n[✓] Permissions & symlink repairs finished: ${d.success ? 'Success' : 'Check logs'}\n`);
  refreshTools();
});

// ── Telemetry Updates ────────────────────────────────────────────────────────
function updateTelemetry() {
  const total = tools.length;
  const ready = tools.filter(t => t.installed).length;
  const missing = total - ready;
  const pct = total > 0 ? Math.round((ready / total) * 100) : 0;

  document.getElementById('tele-total').textContent = total;
  document.getElementById('tele-ready').textContent = ready;
  document.getElementById('tele-missing').textContent = missing;
  document.getElementById('tele-health').textContent = `${pct}%`;

  const btnAll = document.getElementById('btn-install-all');
  if (btnAll) {
    btnAll.innerHTML = `<span>⚡ ONE-CLICK: INSTALL ALL (${missing} MISSING)</span>`;
    btnAll.style.opacity = missing === 0 ? '0.6' : '1.0';
  }
}

// ── Tab Navigation ───────────────────────────────────────────────────────────
window.switchTab = function(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', 
      (tabName === 'all' && btn.textContent === 'ALL TOOLS') ||
      (tabName === 'bundles' && btn.textContent.includes('BUNDLES')) ||
      btn.getAttribute('onclick')?.includes(`'${tabName}'`)
    );
  });
  render();
};

// ── Rendering View ───────────────────────────────────────────────────────────
function render() {
  if (currentTab === 'bundles') {
    renderBundlesView();
  } else {
    renderToolsView();
  }
}

function renderToolsView() {
  const filtered = tools.filter(t => {
    const matchesDomain = (currentTab === 'all') || (t.domain === currentTab);
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery) ||
      t.desc.toLowerCase().includes(searchQuery) ||
      t.cmd.toLowerCase().includes(searchQuery) ||
      t.domain.toLowerCase().includes(searchQuery);
    return matchesDomain && matchesSearch;
  });

  mainContent.innerHTML = `<div class="matrix-grid" id="tools-grid"></div>`;
  const container = document.getElementById('tools-grid');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-dim);">
        <div style="font-size: 24px; color: var(--gold); margin-bottom: 8px;">✦ NO MATCHING TOOLS FOUND ✦</div>
        <div>No tools match your query: "<strong>${searchQuery}</strong>"</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="tool-card" id="card-${t.id}">
      <div class="card-top">
        <div class="tool-name">${t.name}</div>
        <div class="domain-tag ${t.domain}">${t.domain}</div>
      </div>
      <div class="tool-desc">${t.desc}</div>
      <div class="tool-recipe">
        <span style="color:var(--gold); font-size:8px;">📦</span>
        <span>${t.pkg || t.cmd}</span>
      </div>
      <div class="card-bottom">
        <div class="status-badge ${t.installed ? 'ready' : 'missing'}">
          ${t.installed ? 'READY' : 'AVAILABLE'}
        </div>
        <div>
          ${t.installed
            ? `<button class="btn-tool btn-launch" onclick="launchTool('${t.cmd}')">LAUNCH 🚀</button>`
            : `<button class="btn-tool btn-install" onclick="installSingleTool('${t.id}')">INSTALL ⬇</button>`
          }
        </div>
      </div>
    </div>
  `).join('');
}

function renderBundlesView() {
  const bundleList = Object.values(bundles);
  mainContent.innerHTML = `<div class="bundle-grid" id="bundle-grid"></div>`;
  const container = document.getElementById('bundle-grid');

  container.innerHTML = bundleList.map(b => {
    const isReady = b.installed;
    return `
      <div class="bundle-card">
        <div class="b-header">
          <div class="b-tag">${b.tag}</div>
          <div class="b-count">${b.installedCount} / ${b.count} READY</div>
        </div>
        <div class="b-title">
          <span>${b.icon}</span>
          <span>${b.label}</span>
        </div>
        <div class="b-desc">${b.desc}</div>
        <div class="b-chips">
          ${b.tools.slice(0, 10).map(name => `<span class="b-chip">${name}</span>`).join('')}
          ${b.tools.length > 10 ? `<span class="b-chip" style="color:var(--gold)">+${b.tools.length - 10} more</span>` : ''}
        </div>
        <div class="b-footer">
          <div class="status-badge ${isReady ? 'ready' : 'missing'}">
            ${isReady ? '✦ 100% OPERATIONAL' : `${b.count - b.installedCount} TO PROVISION`}
          </div>
          <button class="btn-action ${isReady ? '' : 'btn-master'}" onclick="installBundle('${b.id}')">
            ${isReady ? 'RE-SYNC BUNDLE' : 'INSTALL BUNDLE'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Action Handlers ──────────────────────────────────────────────────────────
window.launchTool = function(cmd) {
  ipcRenderer.send('launch-tool', cmd);
};

window.installSingleTool = function(toolId) {
  ipcRenderer.send('install-tool', toolId);
};

window.installBundle = function(bundleId) {
  ipcRenderer.send('install-all', `bundle:${bundleId}`);
};

window.installAllMissing = function() {
  if (currentTab !== 'all' && currentTab !== 'bundles') {
    ipcRenderer.send('install-all', `domain:${currentTab}`);
  } else {
    ipcRenderer.send('install-all', 'all');
  }
};

window.fixPermissions = function() {
  showDrawer('✦ REPAIRING ZOTHOS ENVIRONMENT & PERMISSIONS...');
  ipcRenderer.send('fix-permissions');
};

window.openTerminalTUI = function() {
  ipcRenderer.send('launch-tool', 'zoth-tool-nexus --tui');
};

// ── Drawer & Log Controls ────────────────────────────────────────────────────
function showDrawer(title) {
  logTitle.textContent = title;
  logDrawer.classList.add('active');
}

window.toggleDrawer = function() {
  logDrawer.classList.toggle('active');
};

window.clearLogs = function() {
  logBody.textContent = '';
};

function appendLog(text) {
  logBody.textContent += text;
  logBody.scrollTop = logBody.scrollHeight;
}
