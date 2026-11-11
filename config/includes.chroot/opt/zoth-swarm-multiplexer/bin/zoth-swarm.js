#!/usr/bin/env node
/**
 * Zoth Swarm Multiplexer — Unified CLI & Desktop Workstation Launcher
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

// Check if user requested web mode, desktop app, or CLI
const isWeb = args[0] === 'web' || args.includes('--web');
const isAppRequest = !isWeb && (args.length === 0 || args.includes('--gui') || args.includes('--app') || args.includes('--desktop') || args[0] === 'app' || args[0] === 'desktop' || args[0] === 'gui');

if (isWeb) {
  console.log('⚡ Launching Zoth Swarm Multiplexer Web UI on http://127.0.0.1:8989 ...');
  const pyChild = spawn('python3', ['swarm_daemon.py', '--port', '8989'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ZOTH_ZERO_EGRESS: 'true',
    },
  });
  pyChild.on('error', (pyErr) => {
    console.error('[ZothSwarm] Failed to start web daemon:', pyErr);
  });
} else if (isAppRequest) {
  console.log('⚡ Launching Zoth Swarm Multiplexer Desktop Workstation...');
  
  // Find Electron in local node_modules, sibling micro-repos, or system PATH
  const candidateElectronPaths = [
    path.join(rootDir, 'node_modules', '.bin', 'electron'),
    '/opt/NullAI-HexStrike-AI-Terminal/node_modules/.bin/electron',
    '/opt/promptmaster-studio/node_modules/.bin/electron',
    '/opt/jwt-inspector-guard/node_modules/.bin/electron',
    '/opt/envguard-secrets-vault/node_modules/.bin/electron',
    '/opt/cron-rhythm-studio/node_modules/.bin/electron',
    '/opt/regex-droid-builder/node_modules/.bin/electron',
    '/opt/schema-illustrator-studio/node_modules/.bin/electron',
    '/opt/payload-entropy-studio/node_modules/.bin/electron',
    '/opt/audiocipher-stego-engine/node_modules/.bin/electron',
    '/opt/pwa-manifest-builder/node_modules/.bin/electron',
    '/opt/certpath-roadmap-studio/node_modules/.bin/electron',
    '/opt/subsweep-lead-scanner/node_modules/.bin/electron',
    '/opt/web-security-guard/node_modules/.bin/electron',
    '/opt/cwv-speed-engine/node_modules/.bin/electron',
    '/opt/vector-search-engine/node_modules/.bin/electron',
    '/opt/neuro-memory-daemon/node_modules/.bin/electron',
    '/opt/aeo-graph-engine/node_modules/.bin/electron',
    '/opt/polyglot-framework-exporter/node_modules/.bin/electron',
    '/opt/zoth-webgen/node_modules/.bin/electron',
    '/opt/deepsearch-research-agent/node_modules/.bin/electron',
    '/opt/omnipost-social-engine/node_modules/.bin/electron',
    '/opt/nexus-3d-scene-studio/node_modules/.bin/electron',
    '/opt/datamosh-glitch-studio/node_modules/.bin/electron',
    '/opt/cyber-turtle-studio/node_modules/.bin/electron',
    '/opt/badge3d-coin-generator/node_modules/.bin/electron',
    '/opt/ufo-sacred-geometry/node_modules/.bin/electron',
    '/opt/vision-gesture-control/node_modules/.bin/electron',
    '/opt/sovereign-agent-bridge/node_modules/.bin/electron',
  ];

  let electronCmd = 'electron';
  for (const p of candidateElectronPaths) {
    if (fs.existsSync(p)) {
      electronCmd = p;
      break;
    }
  }

  const child = spawn(electronCmd, ['.'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
      ZOTH_ZERO_EGRESS: 'true',
    },
  });

  child.on('error', (err) => {
    console.warn(`[ZothSwarm] Electron notice: ${err.message}. Starting web UI on port 8989...`);
    const pyChild = spawn('python3', ['swarm_daemon.py', '--port', '8989'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        ZOTH_ZERO_EGRESS: 'true',
      },
    });
    pyChild.on('error', (pyErr) => {
      console.error('[ZothSwarm] Failed to start backend:', pyErr);
    });
  });
} else {
  // Delegate to Python CLI / Swarm CLI engine
  const child = spawn('python3', ['swarm_cli.py', ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ZOTH_ZERO_EGRESS: 'true',
    },
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
