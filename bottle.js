/* ===== Animated water bottle drawn on a <canvas> (no libraries) ===== */
const Bottle = (() => {
  let canvas, ctx, raf, level = 0, target = 0, ripple = 0, t = 0, bubbles = [], color = '#35d6ff';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function path(c, w, h) { // bottle outline
    const x = w * 0.22, r = 36, nw = w * 0.14, top = h * 0.07, shoulder = h * 0.24, bottom = h * 0.96;
    c.beginPath();
    c.moveTo(w / 2 - nw, top);
    c.lineTo(w / 2 + nw, top);
    c.lineTo(w / 2 + nw, shoulder * 0.7);
    c.bezierCurveTo(w / 2 + nw, shoulder, w - x, shoulder * 0.9, w - x, shoulder + 30);
    c.lineTo(w - x, bottom - r);
    c.quadraticCurveTo(w - x, bottom, w - x - r, bottom);
    c.lineTo(x + r, bottom);
    c.quadraticCurveTo(x, bottom, x, bottom - r);
    c.lineTo(x, shoulder + 30);
    c.bezierCurveTo(x, shoulder * 0.9, w / 2 - nw, shoulder, w / 2 - nw, shoulder * 0.7);
    c.closePath();
  }
  function frame() {
    const w = canvas.width, h = canvas.height;
    t += 0.03; level += (target - level) * 0.06; ripple *= 0.96;
    ctx.clearRect(0, 0, w, h);
    ctx.save(); path(ctx, w, h);
    ctx.fillStyle = 'rgba(160,220,255,0.07)'; ctx.fill(); ctx.clip();
    const top = h * 0.96, floor = h * 0.26, y0 = top - (top - floor) * Math.min(1, level);
    const amp = reduce ? 0 : 4 + ripple * 14;
    for (let layer = 0; layer < 2; layer++) {
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y0 + Math.sin(x * 0.03 + t * (1.4 + layer * 0.6) + layer * 2) * amp * (layer ? 0.7 : 1));
      ctx.lineTo(w, h); ctx.closePath();
      ctx.fillStyle = layer ? 'rgba(53,214,255,0.55)' : color; ctx.globalAlpha = layer ? 0.7 : 0.85; ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduce && level > 0.03) { // bubbles
      if (bubbles.length < 14 && Math.random() < 0.08) bubbles.push({ x: w * (0.3 + Math.random() * 0.4), y: top - 6, r: 2 + Math.random() * 4, s: 0.6 + Math.random() });
      bubbles = bubbles.filter((b) => b.y > y0 + 6);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      bubbles.forEach((b) => { b.y -= b.s; b.x += Math.sin(b.y * 0.1) * 0.4; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); });
    }
    ctx.restore();
    path(ctx, w, h); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(200,235,255,0.85)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(w * 0.3, h * 0.34, 10, h * 0.5); // glass highlight
    ctx.fillStyle = '#e8f4fb'; ctx.font = '700 46px Outfit, Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(Math.round(target * 100) + '%', w / 2, h * 0.62);
    raf = requestAnimationFrame(frame);
  }
  return {
    start(el) { canvas = el; ctx = canvas.getContext('2d'); cancelAnimationFrame(raf); frame(); },
    stop() { cancelAnimationFrame(raf); },
    set(frac, col) { target = Math.max(0, frac); if (col) color = col; },
    splash() { ripple = 1; },
  };
})();
