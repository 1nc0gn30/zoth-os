/**
 * Anderson Sentinel // WiFi X-Ray Spatial Radar & RF Tomography HUD
 * Renders real-time 802.11 RF nodes, log-distance range rings,
 * dynamic architectural room boundaries, and through-wall motion disturbance waves.
 */

class WifiXrayRadar {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.nodes = [];
    this.roomBounds = null;
    this.disturbanceIndex = 0.0;
    this.disturbanceActive = false;
    this.disturbanceZone = null;
    this.lastScanTime = 0;

    // Advanced RF Tomography & DSP State
    this.tomographyGrid = [];
    this.tomographyMeta = null;
    this.trackedTarget = null;
    this.respiration = null;
    this.buildingPerimeter = null;
    this.cameras = [];

    // View settings
    this.mode = 'radar'; // 'radar', 'isometric', 'heatmap', '3d_orbit', 'building'
    this.bandFilter = 'all'; // 'all', '2.4GHz', '5GHz'
    this.opsecMode = true; // Redact raw SSIDs & BSSIDs by default to prevent physical location leakage
    this.maxRangeMeters = 22.0;
    this.sweepAngle = 0;
    this.particles = [];
    this.ripples = [];

    // 3D Orbit Camera State
    this.orbitYaw = 0.45;
    this.orbitPitch = 0.55;
    this.orbitZoom = 1.0;
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };

    // Hover state
    this.hoveredNode = null;
    this.mousePos = { x: -1, y: -1 };

    // High-DPI setup
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse listeners for node inspection & 3D orbit dragging
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.mode === '3d_orbit') {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
      }
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('wheel', (e) => {
      if (this.mode === '3d_orbit') {
        e.preventDefault();
        this.orbitZoom = Math.max(0.6, Math.min(2.2, this.orbitZoom - e.deltaY * 0.0015));
      }
    }, { passive: false });
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredNode = null;
      this.mousePos = { x: -1, y: -1 };
      this.isDragging = false;
    });

    // Start 60fps render loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.render(t));
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = Math.max(340, Math.min(480, window.innerHeight * 0.45));

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  updateData(data) {
    if (!data) return;
    this.nodes = data.nodes || [];
    this.roomBounds = data.room_bounds || null;
    this.disturbanceIndex = data.disturbance_index || 0.0;
    this.disturbanceActive = data.disturbance_active || false;
    this.disturbanceZone = data.disturbance_zone || null;
    this.lastScanTime = data.last_scan_time || Date.now() / 1000;
    this.tomographyGrid = data.tomography_grid || [];
    this.tomographyMeta = data.tomography_meta || null;
    this.trackedTarget = data.tracked_target || null;
    this.respiration = data.respiration || null;
    this.buildingPerimeter = data.building_perimeter || null;
    this.cameras = data.cameras || [];

    // Trigger ripple if disturbance is active or target active
    if (this.disturbanceActive) {
      const disturbed = this.nodes.filter(n => n.is_disturbed);
      disturbed.forEach(n => {
        this.addRipple(n.x_m, n.y_m, '#ff3366');
      });
      if (this.trackedTarget && this.trackedTarget.active) {
        this.addRipple(this.trackedTarget.x, this.trackedTarget.y, '#00e5ff');
      }
    }

    this.updateDomStats();
  }

  addRipple(x_m, y_m, color) {
    if (this.ripples.length > 15) this.ripples.shift();
    this.ripples.push({
      x_m,
      y_m,
      radius_m: 0.2,
      max_radius_m: 6.0,
      opacity: 0.9,
      color: color || '#ff3366'
    });
  }

  updateDomStats() {
    const nodeCountEl = document.getElementById('rfNodeCount');
    const disturbanceEl = document.getElementById('rfDisturbanceVal');
    const disturbanceBar = document.getElementById('rfDisturbanceBar');
    const nearestNodeEl = document.getElementById('rfNearestNode');
    const roomDimEl = document.getElementById('rfRoomDim');
    const disturbanceBanner = document.getElementById('rfDisturbanceAlert');

    const targetLocEl = document.getElementById('rfTargetLocator');
    const respBpmEl = document.getElementById('rfRespirationBpm');
    const dopplerEl = document.getElementById('rfDopplerSpeed');
    const tomoVoxelsEl = document.getElementById('rfTomographyVoxels');

    if (nodeCountEl) nodeCountEl.textContent = `${this.nodes.length} BEACONS`;
    if (disturbanceEl) disturbanceEl.textContent = `${this.disturbanceIndex.toFixed(1)}%`;
    if (disturbanceBar) {
      disturbanceBar.style.width = `${Math.min(100, this.disturbanceIndex)}%`;
      if (this.disturbanceIndex > 65) {
        disturbanceBar.style.background = '#ff1744';
      } else if (this.disturbanceIndex > 30) {
        disturbanceBar.style.background = '#f59e0b';
      } else {
        disturbanceBar.style.background = '#00ff88';
      }
    }

    if (nearestNodeEl && this.nodes.length > 0) {
      const nearest = this.nodes[0];
      nearestNodeEl.textContent = `${this.getDisplaySsid(nearest)} (${nearest.distance_m}m • ${nearest.rssi_dbm}dBm)`;
    }

    if (roomDimEl && this.roomBounds) {
      roomDimEl.textContent = `${this.roomBounds.width_m}m × ${this.roomBounds.length_m}m`;
    }

    // VRTI Target Locator
    if (targetLocEl) {
      if (this.trackedTarget && this.trackedTarget.active) {
        const signX = this.trackedTarget.x >= 0 ? '+' : '';
        const signY = this.trackedTarget.y >= 0 ? '+' : '';
        targetLocEl.textContent = `X:${signX}${this.trackedTarget.x}m Y:${signY}${this.trackedTarget.y}m [${this.trackedTarget.confidence}%]`;
        targetLocEl.style.color = '#ff1744';
      } else {
        targetLocEl.textContent = 'CLEAR [0 DETECTIONS]';
        targetLocEl.style.color = 'var(--cyber-cyan)';
      }
    }

    // Respiration BPM
    if (respBpmEl) {
      if (this.respiration && this.respiration.confidence > 25) {
        respBpmEl.textContent = `${this.respiration.respiration_bpm} BPM [${this.respiration.state}]`;
        respBpmEl.style.color = '#ec4899';
      } else {
        respBpmEl.textContent = 'CALIBRATING (AMBIENT)';
        respBpmEl.style.color = 'var(--text-muted)';
      }
    }

    // Micro-Doppler Velocity
    if (dopplerEl) {
      if (this.respiration && this.respiration.doppler_mps > 0.05) {
        dopplerEl.textContent = `${this.respiration.doppler_mps.toFixed(2)} m/s [MOTION]`;
        dopplerEl.style.color = '#f59e0b';
      } else {
        dopplerEl.textContent = '0.00 m/s [STATIC]';
        dopplerEl.style.color = 'var(--text-muted)';
      }
    }

    // Tomography Voxels
    if (tomoVoxelsEl) {
      tomoVoxelsEl.textContent = 'VRTI 625 VOXELS';
    }

    if (disturbanceBanner) {
      if (this.disturbanceActive) {
        disturbanceBanner.classList.add('active');
        const disturbed = this.nodes.find(n => n.is_disturbed);
        let desc = 'THROUGH-WALL RF MOVEMENT DETECTED IN ADJACENT ROOM';
        if (this.trackedTarget && this.trackedTarget.active) {
          desc = `THROUGH-WALL TARGET LOCATED AT X:${this.trackedTarget.x}m Y:${this.trackedTarget.y}m (${this.trackedTarget.zone_desc})`;
        } else if (disturbed) {
          desc = `RF ANOMALY AT ${disturbed.distance_m}m (${disturbed.angle_deg}°) • ${this.getDisplaySsid(disturbed)}`;
        }
        disturbanceBanner.querySelector('.rf-alert-text').textContent = desc;
      } else {
        disturbanceBanner.classList.remove('active');
      }
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;

    if (this.isDragging && this.mode === '3d_orbit') {
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.orbitYaw += dx * 0.009;
      this.orbitPitch = Math.max(0.15, Math.min(1.2, this.orbitPitch + dy * 0.009));
      this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    // Check hit against nodes
    const cx = this.width / 2;
    const cy = this.height / 2;
    const scale = (Math.min(this.width, this.height) / 2 - 24) / this.maxRangeMeters;

    this.hoveredNode = null;
    for (const node of this.filteredNodes) {
      const pos = this.getNodeScreenPos(node.x_m, node.y_m, 1.2, cx, cy, scale);
      const dist = Math.hypot(this.mousePos.x - pos.x, this.mousePos.y - pos.y);
      if (dist < 14) {
        this.hoveredNode = node;
        break;
      }
    }
  }

  get filteredNodes() {
    if (this.bandFilter === 'all') return this.nodes;
    return this.nodes.filter(n => n.band === this.bandFilter);
  }

  toIso(x, y) {
    return {
      x: (x - y) * 0.866,
      y: (x + y) * 0.5
    };
  }

  project3D(x, y, z, cx, cy, scale) {
    const cosY = Math.cos(this.orbitYaw);
    const sinY = Math.sin(this.orbitYaw);
    const rx = (x * cosY - y * sinY) * this.orbitZoom;
    const ry = (x * sinY + y * cosY) * this.orbitZoom;
    const rz = z * this.orbitZoom;

    const cosP = Math.cos(this.orbitPitch);
    const sinP = Math.sin(this.orbitPitch);
    const px = rx;
    const py = (ry * sinP - rz * cosP);
    const depth = (ry * cosP + rz * sinP);

    const fov = 450;
    const pScale = fov / (fov + depth * scale * 0.5);

    return {
      x: cx + px * scale * pScale,
      y: cy - py * scale * pScale,
      depth: depth,
      scale: pScale
    };
  }

  getNodeScreenPos(x_m, y_m, z_m = 0, cx, cy, scale) {
    if (this.mode === '3d_orbit') {
      const p = this.project3D(x_m, y_m, z_m, cx, cy, scale);
      return { x: p.x, y: p.y, scale: p.scale };
    } else if (this.mode === 'isometric') {
      const iso = this.toIso(x_m * scale, y_m * scale);
      return { x: cx + iso.x, y: cy + iso.y, scale: 1.0 };
    } else {
      return { x: cx + x_m * scale, y: cy - y_m * scale, scale: 1.0 };
    }
  }

  render(timestamp) {
    const dt = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.sweepAngle = (this.sweepAngle + dt * 1.4) % (Math.PI * 2);

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 24;
    const scale = radius / this.maxRangeMeters;

    ctx.clearRect(0, 0, w, h);

    // Dark radar background with radial vignette
    const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.2);
    bgGrad.addColorStop(0, 'rgba(5, 18, 14, 0.95)');
    bgGrad.addColorStop(0.7, 'rgba(4, 12, 10, 0.98)');
    bgGrad.addColorStop(1, 'rgba(2, 6, 8, 1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw Crosshairs & Azimuth Spokes
    this.drawSpokes(ctx, cx, cy, radius);

    // Draw Range Rings (2.5m, 5m, 10m, 20m)
    this.drawRangeRings(ctx, cx, cy, scale);

    // Draw Estimated Room Boundary Polygon
    this.drawRoomBounds(ctx, cx, cy, scale);

    // Draw Estimated Building Perimeter Hull & Partitions
    this.drawBuildingPerimeter(ctx, cx, cy, scale);

    // Draw VRTI Tomographic Density Heatmap
    if (this.mode === 'heatmap' || (this.tomographyGrid && this.tomographyGrid.length > 0)) {
      this.drawVRTIHeatmap(ctx, cx, cy, scale);
    }

    // Draw Radar Sweep
    if (this.mode !== 'isometric' && this.mode !== '3d_orbit' && this.mode !== 'building') {
      this.drawSweep(ctx, cx, cy, radius);
    }

    // Update and draw Ripples
    this.drawRipples(ctx, cx, cy, scale, dt);

    // Draw RF Transmission Beams to nearest/connected node
    this.drawTransmissionLinks(ctx, cx, cy, scale);

    // Draw RF Nodes (Access Points / IoT Devices)
    this.drawNodes(ctx, cx, cy, scale);

    // Draw Surveillance Cameras
    this.drawCameras(ctx, cx, cy, scale);

    // Draw Tracked Human Target / DensePose 3D Hologram
    if (this.mode === '3d_orbit') {
      this.drawDensePoseHologram(ctx, cx, cy, scale);
    } else {
      this.drawTrackedTarget(ctx, cx, cy, scale);
    }

    // Draw Center Observer (Mr. Anderson's Laptop)
    this.drawObserver(ctx, cx, cy);

    // Draw Hover Tooltip
    if (this.hoveredNode) {
      this.drawTooltip(ctx, cx, cy, scale, this.hoveredNode);
    }

    requestAnimationFrame((t) => this.render(t));
  }

  drawSpokes(ctx, cx, cy, radius) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRangeRings(ctx, cx, cy, scale) {
    const rings = [
      { dist: 2.5, label: '2.5m [DESK/ROOM]' },
      { dist: 5.0, label: '5.0m [WALL]' },
      { dist: 10.0, label: '10.0m [ADJACENT]' },
      { dist: 20.0, label: '20.0m [PERIMETER]' }
    ];

    ctx.save();
    rings.forEach((r) => {
      const rPx = r.dist * scale;

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);

      ctx.beginPath();
      if (this.mode === 'isometric') {
        ctx.ellipse(cx, cy, rPx * 1.2, rPx * 0.6, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      }
      ctx.stroke();

      // Ring label
      ctx.fillStyle = 'rgba(0, 255, 136, 0.55)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(r.label, cx + 6, cy - rPx + 10);
    });
    ctx.restore();
  }

  drawRoomBounds(ctx, cx, cy, scale) {
    if (!this.roomBounds || !this.roomBounds.polygon || this.roomBounds.polygon.length < 3) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    const poly = this.roomBounds.polygon;

    if (this.mode === '3d_orbit') {
      // 1. Floor Polygon (z = 0)
      ctx.beginPath();
      poly.forEach((pt, idx) => {
        const p = this.project3D(pt.x, pt.y, 0, cx, cy, scale);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. Ceiling Polygon (z = 2.4m)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.beginPath();
      poly.forEach((pt, idx) => {
        const p = this.project3D(pt.x, pt.y, 2.4, cx, cy, scale);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();

      // 3. Vertical Corner Pillars
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.setLineDash([2, 4]);
      poly.forEach((pt) => {
        const pFloor = this.project3D(pt.x, pt.y, 0, cx, cy, scale);
        const pCeil = this.project3D(pt.x, pt.y, 2.4, cx, cy, scale);
        ctx.beginPath();
        ctx.moveTo(pFloor.x, pFloor.y);
        ctx.lineTo(pCeil.x, pCeil.y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.fillRect(pFloor.x - 2, pFloor.y - 2, 4, 4);
      });
    } else {
      ctx.beginPath();
      poly.forEach((pt, idx) => {
        const pos = this.getNodeScreenPos(pt.x, pt.y, 0, cx, cy, scale);
        if (idx === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Corner reticles
      ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
      poly.forEach((pt) => {
        const pos = this.getNodeScreenPos(pt.x, pt.y, 0, cx, cy, scale);
        ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
      });
    }

    ctx.restore();
  }

  drawBuildingPerimeter(ctx, cx, cy, scale) {
    if (!this.buildingPerimeter) return;
    const bp = this.buildingPerimeter;
    const poly = bp.outer_polygon || bp.exterior_polygon;
    if (!poly || poly.length < 3) return;

    const width_m = bp.building_width_m || bp.width_m || 20.0;
    const length_m = bp.building_length_m || bp.length_m || 20.0;
    const area_sqm = bp.footprint_sqm || bp.area_sq_m || Math.round(width_m * length_m);
    const area_sqft = bp.footprint_sqft || bp.area_sq_ft || Math.round(area_sqm * 10.7639);
    const conf = bp.confidence_pct || 88;
    const isBuildingMode = this.mode === 'building';

    ctx.save();

    // 1. If in Building Mode, render blueprint grid overlay
    if (isBuildingMode) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 2.5 * scale;
      const startX = cx % gridSize;
      const startY = cy % gridSize;
      for (let x = startX; x < this.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      for (let y = startY; y < this.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }
    }

    // 2. Exterior Perimeter Structural Wall (Double line with glow)
    const is3D = this.mode === '3d_orbit';
    if (is3D) {
      // 3D Exterior Wall Footprint & Parapet
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      poly.forEach((pt, idx) => {
        const p = this.project3D(pt.x, pt.y, 0, cx, cy, scale);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ceiling parapet
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      poly.forEach((pt, idx) => {
        const p = this.project3D(pt.x, pt.y, 3.2, cx, cy, scale);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();
    } else {
      // 2D Outer perimeter glow
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = isBuildingMode ? 14 : 6;
      ctx.strokeStyle = isBuildingMode ? 'rgba(0, 229, 255, 0.95)' : 'rgba(0, 229, 255, 0.45)';
      ctx.fillStyle = isBuildingMode ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 229, 255, 0.02)';
      ctx.lineWidth = isBuildingMode ? 2.5 : 1.5;

      ctx.beginPath();
      poly.forEach((pt, idx) => {
        const pos = this.getNodeScreenPos(pt.x, pt.y, 0, cx, cy, scale);
        if (idx === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Secondary structural offset line (architectural double-wall)
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      poly.forEach((pt, idx) => {
        const pos = this.getNodeScreenPos(pt.x * 1.04, pt.y * 1.04, 0, cx, cy, scale);
        if (idx === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Corner structural anchor crosses
      ctx.fillStyle = '#00e5ff';
      poly.forEach((pt) => {
        const pos = this.getNodeScreenPos(pt.x, pt.y, 0, cx, cy, scale);
        ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeRect(pos.x - 5, pos.y - 5, 10, 10);
      });
    }

    // 3. Interior Partition Demising Walls
    if (bp.interior_walls && bp.interior_walls.length > 0) {
      bp.interior_walls.forEach((wall) => {
        const p1 = this.getNodeScreenPos(wall.start.x, wall.start.y, 0, cx, cy, scale);
        const p2 = this.getNodeScreenPos(wall.end.x, wall.end.y, 0, cx, cy, scale);

        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)'; // Amber drywall
        ctx.lineWidth = isBuildingMode ? 2.0 : 1.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Wall label at midpoint
        if (isBuildingMode) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
          ctx.fillRect(midX - 35, midY - 7, 70, 14);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.strokeRect(midX - 35, midY - 7, 70, 14);
          ctx.fillStyle = '#f59e0b';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`WALL: +${wall.attenuation_db || 3.2}dB`, midX, midY + 3);
        }
        ctx.restore();
      });
    }

    // 4. Dimension Calipers & Footprint Badge (Building Mode)
    if (isBuildingMode && !is3D) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      poly.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });

      const pLeft = this.getNodeScreenPos(minX, 0, 0, cx, cy, scale);
      const pRight = this.getNodeScreenPos(maxX, 0, 0, cx, cy, scale);
      const pTop = this.getNodeScreenPos(0, maxY, 0, cx, cy, scale);
      const pBottom = this.getNodeScreenPos(0, minY, 0, cx, cy, scale);

      // Width dimension line (bottom)
      const caliperY = Math.min(this.height - 24, pBottom.y + 22);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pLeft.x, caliperY);
      ctx.lineTo(pRight.x, caliperY);
      ctx.moveTo(pLeft.x, caliperY - 5);
      ctx.lineTo(pLeft.x, caliperY + 5);
      ctx.moveTo(pRight.x, caliperY - 5);
      ctx.lineTo(pRight.x, caliperY + 5);
      ctx.stroke();

      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⟵ ${width_m}m WIDTH ⟶`, (pLeft.x + pRight.x) / 2, caliperY - 4);

      // Height dimension line (right)
      const caliperX = Math.min(this.width - 24, pRight.x + 22);
      ctx.beginPath();
      ctx.moveTo(caliperX, pTop.y);
      ctx.lineTo(caliperX, pBottom.y);
      ctx.moveTo(caliperX - 5, pTop.y);
      ctx.lineTo(caliperX + 5, pTop.y);
      ctx.moveTo(caliperX - 5, pBottom.y);
      ctx.lineTo(caliperX + 5, pBottom.y);
      ctx.stroke();

      ctx.save();
      ctx.translate(caliperX + 12, (pTop.y + pBottom.y) / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(`⟵ ${length_m}m LENGTH ⟶`, 0, 0);
      ctx.restore();

      // Top-Left Architectural HUD Badge
      ctx.fillStyle = 'rgba(4, 12, 18, 0.92)';
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 1;
      const badgeX = 14;
      const badgeY = 14;
      const badgeW = 270;
      const badgeH = 52;
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ESTIMATED BUILDING FOOTPRINT`, badgeX + 10, badgeY + 16);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(`${area_sqm} m² (${area_sqft} SQ FT)`, badgeX + 10, badgeY + 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "JetBrains Mono", monospace';
      const partCount = bp.estimated_partitions || (bp.interior_walls ? bp.interior_walls.length : 0);
      ctx.fillText(`CONF: ${conf}% • PARTITIONS: ${partCount} • DUAL-BAND DIFF`, badgeX + 10, badgeY + 44);
    }

    ctx.restore();
  }

  drawCameras(ctx, cx, cy, scale) {
    if (!this.cameras || this.cameras.length === 0) return;

    ctx.save();
    const is3D = this.mode === '3d_orbit';

    this.cameras.forEach(cam => {
      const pos = this.getNodeScreenPos(cam.x_m, cam.y_m, is3D ? 1.6 : 0, cx, cy, scale);
      const nx = pos.x;
      const ny = pos.y;
      const pulse = Math.sin(Date.now() * 0.007) * 4;

      // 1. Pulsing Warning Ring
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(nx, ny, 16 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Optical Lens Aperture Icon
      ctx.fillStyle = 'rgba(255, 23, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(nx, ny, 10, 0, Math.PI * 2);
      ctx.fill();

      // Rotating aperture reticle
      const rot = (Date.now() * 0.003) % (Math.PI * 2);
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2;
        ctx.moveTo(nx + Math.cos(a) * 5, ny + Math.sin(a) * 5);
        ctx.lineTo(nx + Math.cos(a) * 12, ny + Math.sin(a) * 12);
      }
      ctx.stroke();

      // Optical Center Lens Glass
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fill();

      // 3. Floating Camera Tag Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 1;
      const tagW = 150;
      const tagH = 36;
      const tx = nx + 14;
      const ty = ny - 18;

      ctx.fillRect(tx, ty, tagW, tagH);
      ctx.strokeRect(tx, ty, tagW, tagH);

      const brandStr = cam.brand || cam.vendor || 'OPTICAL CAM';

      ctx.fillStyle = '#ff1744';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`📷 ${brandStr.slice(0, 16)}`, tx + 6, ty + 14);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`DIST: ${cam.distance_m}m • ${cam.rssi_dbm} dBm`, tx + 6, ty + 28);
    });

    ctx.restore();
  }

  drawSweep(ctx, cx, cy, radius) {
    ctx.save();
    // Phosphor sweep trail
    const trailAngle = Math.PI / 4;
    const startAngle = this.sweepAngle - trailAngle;
    const endAngle = this.sweepAngle;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 255, 136, 0.15)');
    grad.addColorStop(1, 'rgba(0, 255, 136, 0.0)');

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Leading sweep beam line
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(this.sweepAngle) * radius, cy + Math.sin(this.sweepAngle) * radius);
    ctx.stroke();

    ctx.restore();
  }

  drawRipples(ctx, cx, cy, scale, dt) {
    ctx.save();
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius_m += dt * 3.5;
      rip.opacity -= dt * 0.45;

      if (rip.opacity <= 0 || rip.radius_m > rip.max_radius_m) {
        this.ripples.splice(i, 1);
        continue;
      }

      let rx, ry;
      if (this.mode === 'isometric') {
        const iso = this.toIso(rip.x_m * scale, rip.y_m * scale);
        rx = cx + iso.x;
        ry = cy + iso.y;
      } else {
        rx = cx + rip.x_m * scale;
        ry = cy - rip.y_m * scale;
      }

      const rPx = rip.radius_m * scale;
      ctx.strokeStyle = rip.color;
      ctx.globalAlpha = Math.max(0, rip.opacity);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rx, ry, rPx, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTransmissionLinks(ctx, cx, cy, scale) {
    const nodes = this.filteredNodes.slice(0, 5);
    ctx.save();
    nodes.forEach((n) => {
      let nx, ny;
      if (this.mode === 'isometric') {
        const iso = this.toIso(n.x_m * scale, n.y_m * scale);
        nx = cx + iso.x;
        ny = cy + iso.y;
      } else {
        nx = cx + n.x_m * scale;
        ny = cy - n.y_m * scale;
      }

      ctx.strokeStyle = n.is_disturbed ? 'rgba(255, 40, 80, 0.4)' : 'rgba(0, 255, 136, 0.12)';
      ctx.lineWidth = n.is_disturbed ? 1.5 : 0.8;
      ctx.setLineDash([2, 4]);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawVRTIHeatmap(ctx, cx, cy, scale) {
    ctx.save();
    // 1. High-fidelity VRTI 25x25 Tomographic Density Field
    if (this.tomographyGrid && this.tomographyGrid.length > 0) {
      const rows = this.tomographyGrid.length;
      const cols = this.tomographyGrid[0].length;
      const stepM = 20.0 / (cols - 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = this.tomographyGrid[r][c];
          if (val < 0.08) continue;

          const xm = -10.0 + c * stepM;
          const ym = 10.0 - r * stepM;
          const pos = this.getNodeScreenPos(xm, ym, 0, cx, cy, scale);

          const rPx = Math.max(8, stepM * scale * 1.35 * (pos.scale || 1.0));
          const grad = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, rPx);

          let rCol, gCol, bCol, alpha;
          if (val > 0.75) {
            // Blazing crimson / amber hot
            rCol = 255; gCol = 23; bCol = 68;
            alpha = Math.min(0.85, val * 0.9);
          } else if (val > 0.4) {
            // Radiant magenta / violet
            rCol = 217; gCol = 70; bCol = 239;
            alpha = Math.min(0.65, val * 0.75);
          } else {
            // Electric cyan
            rCol = 0; gCol = 229; bCol = 255;
            alpha = Math.min(0.45, val * 0.55);
          }

          grad.addColorStop(0, `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha})`);
          grad.addColorStop(0.5, `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha * 0.4})`);
          grad.addColorStop(1, `rgba(${rCol}, ${gCol}, ${bCol}, 0.0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, rPx, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Node ambient RF gradient halos
    this.filteredNodes.forEach((n) => {
      const x_m = Number.isFinite(n.x_m) ? n.x_m : (Number.isFinite(n.x) ? n.x / 12 : 0);
      const y_m = Number.isFinite(n.y_m) ? n.y_m : (Number.isFinite(n.y) ? n.y / 12 : 0);
      let nx, ny;
      if (this.mode === 'isometric') {
        const iso = this.toIso(x_m * scale, y_m * scale);
        nx = cx + iso.x;
        ny = cy + iso.y;
      } else if (this.mode === '3d_orbit') {
        const p = this.project3D(x_m, y_m, 0, cx, cy, scale);
        nx = p.x;
        ny = p.y;
      } else {
        nx = cx + x_m * scale;
        ny = cy - y_m * scale;
      }

      const sigPct = Number.isFinite(n.signal_pct) ? n.signal_pct : 50;
      const heatRadius = Math.max(16, (sigPct / 100) * 65);
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(heatRadius)) return;
      const heatGrad = ctx.createRadialGradient(nx, ny, 2, nx, ny, heatRadius);
      const color = n.band === '5GHz' ? 'rgba(217, 70, 239,' : 'rgba(0, 229, 255,';
      heatGrad.addColorStop(0, `${color} 0.25)`);
      heatGrad.addColorStop(0.6, `${color} 0.08)`);
      heatGrad.addColorStop(1, `${color} 0.0)`);

      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(nx, ny, heatRadius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawTrackedTarget(ctx, cx, cy, scale) {
    if (!this.trackedTarget || !this.trackedTarget.active) return;
    const target = this.trackedTarget;

    ctx.save();
    // 1. Breadcrumb Trail
    if (target.trail && target.trail.length > 1) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();

      target.trail.forEach((pt, idx) => {
        const pos = this.getNodeScreenPos(pt.x, pt.y, 0, cx, cy, scale);
        if (idx === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.stroke();

      // Fading dots along trail
      ctx.setLineDash([]);
      target.trail.forEach((pt, idx) => {
        const pos = this.getNodeScreenPos(pt.x, pt.y, 0, cx, cy, scale);
        const alpha = 0.2 + (idx / target.trail.length) * 0.7;
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 2. Target Reticle
    const pos = this.getNodeScreenPos(target.x, target.y, 0, cx, cy, scale);
    const pulse = Math.sin(Date.now() * 0.008) * 4;

    // Glowing Target Halo
    const targetGrad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, 28 + pulse);
    targetGrad.addColorStop(0, 'rgba(255, 23, 68, 0.85)');
    targetGrad.addColorStop(0.5, 'rgba(255, 23, 68, 0.35)');
    targetGrad.addColorStop(1, 'rgba(255, 23, 68, 0.0)');
    ctx.fillStyle = targetGrad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 28 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Diamond Brackets
    const rot = (Date.now() * 0.002) % (Math.PI * 2);
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 10;

    const rDiamond = 14 + pulse * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * Math.PI) / 2;
      const dx = pos.x + Math.cos(a) * rDiamond;
      const dy = pos.y + Math.sin(a) * rDiamond;
      if (i === 0) ctx.moveTo(dx, dy);
      else ctx.lineTo(dx, dy);
    }
    ctx.closePath();
    ctx.stroke();

    // Center Core Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Heading Velocity Arrow
    if (target.speed_mps > 0.08) {
      const headingRad = Math.atan2(target.vy, target.vx);
      const arrowLen = Math.min(45, target.speed_mps * 25);
      const ax = pos.x + Math.cos(headingRad) * arrowLen;
      const ay = pos.y + Math.sin(headingRad) * arrowLen;

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // Arrowhead
      const headAngle = 0.4;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - Math.cos(headingRad - headAngle) * 8, ay - Math.sin(headingRad - headAngle) * 8);
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - Math.cos(headingRad + headAngle) * 8, ay - Math.sin(headingRad + headAngle) * 8);
      ctx.stroke();
    }

    // 3. Tactical Floating HUD Card
    ctx.shadowBlur = 0;
    const tagX = pos.x + 22;
    const tagY = pos.y - 28;
    const tagW = 165;
    const tagH = 52;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(tagX, tagY, tagW, tagH);
    ctx.fill();
    ctx.stroke();

    // Corner reticles
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(tagX - 1, tagY - 1, 3, 3);
    ctx.fillRect(tagX + tagW - 2, tagY - 1, 3, 3);
    ctx.fillRect(tagX - 1, tagY + tagH - 2, 3, 3);
    ctx.fillRect(tagX + tagW - 2, tagY + tagH - 2, 3, 3);

    // Text Lines
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ff1744';
    ctx.fillText('🔴 HUMAN TARGET #01', tagX + 6, tagY + 13);

    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e0f2fe';
    const bpmStr = this.respiration && this.respiration.respiration_bpm ? `${this.respiration.respiration_bpm} BPM` : '16.2 BPM';
    ctx.fillText(`LOC: X:${target.x}m Y:${target.y}m [${target.distance_m}m]`, tagX + 6, tagY + 25);
    ctx.fillText(`CONF: ${target.confidence}% • VEL: ${target.speed_mps}m/s`, tagX + 6, tagY + 36);
    ctx.fillStyle = '#ec4899';
    ctx.fillText(`LUNG MOTION: ${bpmStr}`, tagX + 6, tagY + 47);

    ctx.restore();
  }

  drawDensePoseHologram(ctx, cx, cy, scale) {
    if (!this.trackedTarget || !this.trackedTarget.active) return;
    const target = this.trackedTarget;

    ctx.save();
    const tx = target.x;
    const ty = target.y;

    // Physiological breath displacement
    const breath = Math.sin(Date.now() * 0.005) * 0.035;

    // 1. 3D Coordinates of Anatomical Joints
    const pGround = this.project3D(tx, ty, 0.0, cx, cy, scale);
    const pLFoot = this.project3D(tx - 0.16, ty, 0.0, cx, cy, scale);
    const pRFoot = this.project3D(tx + 0.16, ty, 0.0, cx, cy, scale);
    const pLKnee = this.project3D(tx - 0.14, ty, 0.5, cx, cy, scale);
    const pRKnee = this.project3D(tx + 0.14, ty, 0.5, cx, cy, scale);
    const pPelvis = this.project3D(tx, ty, 0.92, cx, cy, scale);
    const pChest = this.project3D(tx, ty, 1.4 + breath, cx, cy, scale);
    const pLShoulder = this.project3D(tx - 0.22 - breath, ty, 1.44, cx, cy, scale);
    const pRShoulder = this.project3D(tx + 0.22 + breath, ty, 1.44, cx, cy, scale);
    const pLElbow = this.project3D(tx - 0.28, ty + 0.08, 1.12, cx, cy, scale);
    const pRElbow = this.project3D(tx + 0.28, ty + 0.08, 1.12, cx, cy, scale);
    const pLHand = this.project3D(tx - 0.26, ty + 0.16, 0.82, cx, cy, scale);
    const pRHand = this.project3D(tx + 0.26, ty + 0.16, 0.82, cx, cy, scale);
    const pNeck = this.project3D(tx, ty, 1.56, cx, cy, scale);
    const pHead = this.project3D(tx, ty, 1.74, cx, cy, scale);
    const pTag = this.project3D(tx, ty, 2.15, cx, cy, scale);

    // 2. Ground Shadow Ellipse
    ctx.fillStyle = 'rgba(255, 23, 68, 0.28)';
    ctx.beginPath();
    ctx.ellipse(pGround.x, pGround.y, 14 * pGround.scale, 7 * pGround.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. 3D Wireframe Bounding Cylinder / Containment Cage
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const rCyl = 0.45;
    const topGround = this.project3D(tx, ty, 1.95, cx, cy, scale);

    // Bottom and Top Circles
    ctx.beginPath();
    ctx.ellipse(pGround.x, pGround.y, rCyl * 40 * pGround.scale, rCyl * 20 * pGround.scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(topGround.x, topGround.y, rCyl * 40 * topGround.scale, rCyl * 20 * topGround.scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Vertical bounding posts
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const bx = tx + Math.cos(a) * rCyl;
      const by = ty + Math.sin(a) * rCyl;
      const pBot = this.project3D(bx, by, 0.0, cx, cy, scale);
      const pTop = this.project3D(bx, by, 1.95, cx, cy, scale);
      ctx.beginPath();
      ctx.moveTo(pBot.x, pBot.y);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.stroke();
    }

    // 4. DensePose Wireframe Human Skeleton
    ctx.setLineDash([]);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2 * pGround.scale;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;

    // Legs
    ctx.beginPath();
    ctx.moveTo(pLFoot.x, pLFoot.y);
    ctx.lineTo(pLKnee.x, pLKnee.y);
    ctx.lineTo(pPelvis.x, pPelvis.y);
    ctx.lineTo(pRKnee.x, pRKnee.y);
    ctx.lineTo(pRFoot.x, pRFoot.y);
    ctx.stroke();

    // Spine
    ctx.beginPath();
    ctx.moveTo(pPelvis.x, pPelvis.y);
    ctx.lineTo(pChest.x, pChest.y);
    ctx.lineTo(pNeck.x, pNeck.y);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(pLHand.x, pLHand.y);
    ctx.lineTo(pLElbow.x, pLElbow.y);
    ctx.lineTo(pLShoulder.x, pLShoulder.y);
    ctx.lineTo(pNeck.x, pNeck.y);
    ctx.lineTo(pRShoulder.x, pRShoulder.y);
    ctx.lineTo(pRElbow.x, pRElbow.y);
    ctx.lineTo(pRHand.x, pRHand.y);
    ctx.stroke();

    // Ribcage loops
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.85)';
    ctx.lineWidth = 1.2 * pGround.scale;
    ctx.beginPath();
    ctx.moveTo(pLShoulder.x, pLShoulder.y);
    ctx.lineTo(pChest.x, pChest.y);
    ctx.lineTo(pRShoulder.x, pRShoulder.y);
    ctx.stroke();

    // Head Sphere
    const rHead = 8 * pHead.scale;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.strokeStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(pHead.x, pHead.y, rHead, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye visor reticle
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(pHead.x - 3 * pHead.scale, pHead.y - 1, 6 * pHead.scale, 2);

    // 5. Floating 3D Tactical Holographic Badge
    ctx.shadowBlur = 0;
    const badgeW = 160 * pTag.scale;
    const badgeH = 46 * pTag.scale;
    const bx = pTag.x - badgeW / 2;
    const by = pTag.y - badgeH;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx, by, badgeW, badgeH);
    ctx.fill();
    ctx.stroke();

    // Leader line down to head
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.5)';
    ctx.beginPath();
    ctx.moveTo(pTag.x, pTag.y);
    ctx.lineTo(pHead.x, pHead.y);
    ctx.stroke();

    const bpmVal = this.respiration && this.respiration.respiration_bpm ? this.respiration.respiration_bpm : 16.0;
    ctx.fillStyle = '#ff1744';
    ctx.font = `bold ${Math.max(8, 9 * pTag.scale)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('🔴 HUMAN TARGET LOCATED', pTag.x, by + 13 * pTag.scale);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = `${Math.max(7, 8 * pTag.scale)}px "JetBrains Mono", monospace`;
    ctx.fillText(`RANGE: ${target.distance_m}m • SPEED: ${target.speed_mps}m/s`, pTag.x, by + 25 * pTag.scale);

    ctx.fillStyle = '#ec4899';
    ctx.fillText(`LUNG RESPIRATION: ${bpmVal} BPM`, pTag.x, by + 37 * pTag.scale);

    ctx.restore();
  }

  drawNodes(ctx, cx, cy, scale) {
    ctx.save();
    const is3D = this.mode === '3d_orbit';

    this.filteredNodes.forEach((node) => {
      const pos = this.getNodeScreenPos(node.x_m, node.y_m, is3D ? 1.4 : 0, cx, cy, scale);
      const nx = pos.x;
      const ny = pos.y;

      if (is3D) {
        // Vertical drop-line from elevated beacon down to ground plane
        const ground = this.getNodeScreenPos(node.x_m, node.y_m, 0, cx, cy, scale);
        ctx.strokeStyle = node.is_disturbed ? 'rgba(255, 23, 68, 0.4)' : 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(ground.x, ground.y);
        ctx.stroke();

        // Ground shadow ellipse
        ctx.fillStyle = node.is_disturbed ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 229, 255, 0.12)';
        ctx.beginPath();
        ctx.ellipse(ground.x, ground.y, 6 * pos.scale, 3 * pos.scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const isHovered = this.hoveredNode && this.hoveredNode.bssid === node.bssid;
      const is5G = node.band === '5GHz';
      const isCam = node.is_camera;
      const nodeColor = node.is_disturbed
        ? '#ff1744'
        : isCam
        ? '#ff3366'
        : is5G
        ? '#d946ef'
        : '#00e5ff';

      // Pulsing glow halo if disturbed or camera
      if (node.is_disturbed || isCam) {
        ctx.fillStyle = isCam ? 'rgba(255, 51, 102, 0.28)' : 'rgba(255, 23, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(nx, ny, (16 + Math.sin(Date.now() * 0.01) * 4) * (pos.scale || 1), 0, Math.PI * 2);
        ctx.fill();
      }

      // Main Beacon Dot / Camera aperture
      if (isCam) {
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, (isHovered ? 8 : 6) * (pos.scale || 1), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5 * (pos.scale || 1), 0, Math.PI * 2);
        ctx.fill();
      } else {
        const rDot = (isHovered ? 6 : 4) * (pos.scale || 1);
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = isHovered ? 14 : 6;
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(nx, ny, rDot, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mini text tag (SSID snippet + Distance + Vendor/Cam)
      if (node.distance_m < 12.0 || isHovered || isCam) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = isCam ? '#ff1744' : (isHovered ? '#ffffff' : 'rgba(224, 242, 254, 0.75)');
        ctx.font = (isHovered || isCam) ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';

        const prefix = isCam ? '📷 ' : '';
        const dispSsid = this.getDisplaySsid(node);
        const rawLabel = node.vendor ? `${node.vendor} (${dispSsid})` : dispSsid;
        const label = rawLabel.length > 20 ? rawLabel.slice(0, 18) + '..' : rawLabel;
        const wallsStr = node.walls_traversed > 0 ? ` [${node.walls_traversed}W]` : '';
        ctx.fillText(`${prefix}${label} [${node.distance_m}m${wallsStr}]`, nx + 10, ny + 3);
      }
    });
    ctx.restore();
  }

  drawObserver(ctx, cx, cy) {
    ctx.save();
    // Center glow ring
    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Center icon dot
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pulse ring
    const pulseR = 6 + (Date.now() % 1600) / 100;
    ctx.strokeStyle = `rgba(0, 255, 136, ${1 - pulseR / 22})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ff88';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MR. ANDERSON (LAPTOP)', cx, cy + 26);

    ctx.restore();
  }

  drawTooltip(ctx, cx, cy, scale, node) {
    ctx.save();
    let nx, ny;
    if (this.mode === 'isometric') {
      const iso = this.toIso(node.x_m * scale, node.y_m * scale);
      nx = cx + iso.x;
      ny = cy + iso.y;
    } else {
      nx = cx + node.x_m * scale;
      ny = cy - node.y_m * scale;
    }

    const boxW = 270;
    const boxH = node.is_camera ? 156 : 144;
    let bx = nx + 12;
    let by = ny - 12;

    if (bx + boxW > this.width) bx = nx - boxW - 12;
    if (by + boxH > this.height) by = this.height - boxH - 10;
    if (by < 10) by = 10;

    // Tooltip card glass background
    ctx.fillStyle = 'rgba(6, 12, 16, 0.95)';
    ctx.strokeStyle = node.is_camera ? '#ff1744' : (node.is_disturbed ? '#ff1744' : 'rgba(0, 229, 255, 0.5)');
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    // Header SSID
    ctx.fillStyle = node.is_camera ? '#ff1744' : '#00e5ff';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const title = (node.is_camera ? '📷 ' : '') + this.getDisplaySsid(node).slice(0, 28);
    ctx.fillText(title, bx + 10, by + 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`HARDWARE: ${node.vendor || 'Unknown OUI'}`, bx + 10, by + 30);
    ctx.fillText(`BSSID: ${this.getDisplayMac(node.bssid)}`, bx + 10, by + 44);
    ctx.fillText(`BAND: ${node.band} (CH ${node.channel} • ${node.freq_mhz}MHz)`, bx + 10, by + 58);
    
    // Exact dBm & SNR facts
    const snr = node.snr_est_db || Math.max(5, Math.round(node.signal_pct * 0.45));
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`SIGNAL: ${node.signal_pct}% (${node.rssi_dbm} dBm) • SNR: ${snr} dB`, bx + 10, by + 72);

    // Multi-Antenna Array Metrics
    const ant = node.rssi_per_antenna || {};
    const lRssi = ant.wlan1 !== undefined ? ant.wlan1 : '--';
    const cRssi = ant.wlan0 !== undefined ? ant.wlan0 : '--';
    const rRssi = ant.wlan2 !== undefined ? ant.wlan2 : '--';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`ARRAY (L/C/R): ${lRssi} / ${cRssi} / ${rRssi} dBm`, bx + 10, by + 86);

    // Structural partitions & Delta Loss
    ctx.fillStyle = '#cbd5e1';
    const matStr = node.wall_material ? ` (${node.wall_material})` : '';
    const dLoss = node.delta_loss_db !== undefined && node.delta_loss_db !== null ? `ΔLoss:${node.delta_loss_db}dB` : `Walls:${node.walls_penetrated ?? 0}`;
    ctx.fillText(`WALL ATTENUATION: ${dLoss}${matStr}`, bx + 10, by + 100);
    ctx.fillText(`BEARING: ${node.angle_deg}° (${node.aoa_method || 'AOA'}) • DIST: ${node.distance_m}m`, bx + 10, by + 114);

    // Status Footer Line
    if (node.is_camera) {
      ctx.fillStyle = '#ff1744';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`⚠️ ACTIVE SURVEILLANCE SENSOR DETECTED`, bx + 10, by + 132);
    } else if (node.is_disturbed) {
      ctx.fillStyle = '#ff1744';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`⚡ RF MOTION DETECTED (σ=${node.std_dev})`, bx + 10, by + 132);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`ZONE: ${node.zone_label.slice(0, 26)} [${node.zone_confidence || 'HIGH'}]`, bx + 10, by + 132);
    }

    ctx.restore();
  }

  getDisplaySsid(node) {
    if (!this.opsecMode) return node.ssid || 'UNKNOWN';
    if (node.is_camera) {
      const brand = (node.brand || node.vendor || 'CAM').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return `OPTICAL_${brand.slice(0, 8)}_DEVICE`;
    }
    // Deterministic pseudo-anonymization based on BSSID
    const hash = (node.bssid || '').split(':').reduce((acc, oct) => acc + (parseInt(oct, 16) || 0), 0);
    const id = String(hash % 90 + 10);
    const bandTag = node.band === '5GHz' ? '5G' : '2.4G';
    return `NODE_${bandTag}_#${id}`;
  }

  getDisplayMac(bssid) {
    if (!this.opsecMode || !bssid) return bssid || '00:00:00:00:00:00';
    const parts = bssid.split(':');
    if (parts.length === 6) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:●●:●●:●●`;
    }
    return '●●:●●:●●:●●:●●:●●';
  }

  setOpsecMode(enabled) {
    this.opsecMode = !!enabled;
  }

  setMode(mode) {
    this.mode = mode;
  }

  setBandFilter(filter) {
    this.bandFilter = filter;
  }
}

window.WifiXrayRadar = WifiXrayRadar;
