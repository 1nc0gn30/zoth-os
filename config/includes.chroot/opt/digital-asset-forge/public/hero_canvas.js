/**
 * Digital Asset Forge - Nested 5-Ratio Frame Diagram Canvas
 * Theme-aware (Light & Dark), zero text overlap, reduced-motion safe.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 400;
  let height = 240;

  const FRAMES = [
    { id: "2:3", ratio: 2 / 3, scale: 0.86, dark: "#F5D061", light: "#7A5808" },
    { id: "3:4", ratio: 3 / 4, scale: 0.74, dark: "#38BDF8", light: "#0369A1" },
    { id: "4:5", ratio: 4 / 5, scale: 0.62, dark: "#34D399", light: "#047857" },
    { id: "11:14", ratio: 11 / 14, scale: 0.50, dark: "#FBBF24", light: "#92400E" },
    { id: "ISO", ratio: 1 / 1.4142, scale: 0.38, dark: "#C084FC", light: "#6D28D9" }
  ];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(260, Math.round(rect.width));
    height = Math.max(180, Math.round(rect.height || 240));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function isLightTheme() {
    return document.documentElement.getAttribute("data-theme") === "light";
  }

  function draw() {
    const light = isLightTheme();
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = light ? "#F5F2EA" : "#0B0F18";
    ctx.fillRect(0, 0, width, height);

    // Subtle calibration grid
    ctx.strokeStyle = light ? "rgba(15, 23, 42, 0.06)" : "rgba(248, 250, 252, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 24; x < width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 24; y < height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Left zone: nested frames; Right zone: crisp non-overlapping legend
    const showLegendRight = width >= 340;
    const centerX = showLegendRight ? width * 0.36 : width * 0.5;
    const centerY = height * 0.5;
    const baseH = Math.min(height * 0.84, 196);

    for (let i = 0; i < FRAMES.length; i++) {
      const f = FRAMES[i];
      const col = light ? f.light : f.dark;
      const h = baseH * f.scale;
      const w = h * f.ratio;
      const x = centerX - w / 2;
      const y = centerY - h / 2;

      ctx.strokeStyle = col;
      ctx.lineWidth = i === 0 ? 2 : 1.5;
      ctx.strokeRect(x, y, w, h);
    }

    // Center 300 DPI crosshair
    ctx.save();
    ctx.strokeStyle = light ? "rgba(122, 88, 8, 0.45)" : "rgba(245, 208, 97, 0.5)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX - 24, centerY);
    ctx.lineTo(centerX + 24, centerY);
    ctx.moveTo(centerX, centerY - 24);
    ctx.lineTo(centerX, centerY + 24);
    ctx.stroke();
    ctx.restore();

    if (showLegendRight) {
      const legendX = width * 0.62;
      let legendY = Math.max(36, (height - FRAMES.length * 30) / 2 + 14);
      ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = "left";
      for (let i = 0; i < FRAMES.length; i++) {
        const f = FRAMES[i];
        const col = light ? f.light : f.dark;
        ctx.fillStyle = col;
        ctx.fillRect(legendX, legendY - 9, 10, 10);
        ctx.fillStyle = light ? "#0F172A" : "#F8FAFC";
        ctx.fillText(`${f.id} Ratio · 300 DPI`, legendX + 16, legendY);
        legendY += 30;
      }
    }
  }

  window.addEventListener("resize", () => {
    resize();
    draw();
  });

  window.addEventListener("daf-theme-change", draw);
  resize();
  draw();
})();
