'use strict';
/* Pin image studio: draws a 1000x1500 (2:3) pin on a canvas from the user's OWN photo. Nothing is uploaded anywhere. */
const Studio = (() => {
  const W = 1000, H = 1500;
  const THEMES = {
    rose: {name: 'Rose', bg: '#fbe3ea', fg: '#3b1624', accent: '#e0426f', onAccent: '#ffffff'},
    cream: {name: 'Cream', bg: '#fff4e6', fg: '#2f2418', accent: '#c9792b', onAccent: '#ffffff'},
    forest: {name: 'Forest', bg: '#e3efe6', fg: '#14301f', accent: '#2f7d4f', onAccent: '#ffffff'},
    ink: {name: 'Ink', bg: '#1d1a2b', fg: '#f6f1ff', accent: '#ffb84d', onAccent: '#1d1a2b'},
    lilac: {name: 'Lilac', bg: '#ece6fb', fg: '#251a4a', accent: '#6a4fe0', onAccent: '#ffffff'},
  };
  const TEMPLATES = {band: 'Bottom band', frame: 'Framed photo', badge: 'Top badge', split: 'Split', minimal: 'Minimal'};
  const SANS = '"Helvetica Neue", Arial, system-ui, sans-serif', SERIF = 'Georgia, "Times New Roman", serif';

  function wrap(ctx, text, maxW, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); let last = keep[maxLines - 1]; while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1); keep[maxLines - 1] = last.replace(/[\s,.;:]+$/, '') + '…'; return keep; }
    return lines;
  }
  // fit text: shrink font until it fits in maxLines
  function fitText(ctx, text, font, maxW, maxLines, start, min) {
    for (let s = start; s >= min; s -= 4) { ctx.font = font(s); const l = wrap(ctx, text, maxW, 99); if (l.length <= maxLines) return {size: s, lines: l}; }
    ctx.font = font(min); return {size: min, lines: wrap(ctx, text, maxW, maxLines)};
  }
  function cover(ctx, img, x, y, w, h, r) {
    ctx.save(); if (r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip(); } else { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
    if (img) { const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s; ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
    else { const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#d9d2e9'); g.addColorStop(1, '#f1d6df'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(60,40,70,.55)'; ctx.font = `600 44px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Upload your photo', x + w / 2, y + h / 2); ctx.textAlign = 'left'; }
    ctx.restore();
  }
  function draw(canvas, o) {
    const c = canvas.getContext('2d'), th = THEMES[o.theme] || THEMES.rose, img = o.img || null;
    canvas.width = W; canvas.height = H; c.clearRect(0, 0, W, H); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const head = String(o.headline || '').trim(), small = String(o.small || '').trim(), cta = String(o.cta || '').trim();
    const heavy = s => `800 ${s}px ${SANS}`, serif = s => `700 ${s}px ${SERIF}`;
    const pill = (x, y, text, bg, fg, size) => { c.font = `800 ${size}px ${SANS}`; const w = c.measureText(text).width + size * 1.4, h = size * 1.9; c.fillStyle = bg; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill(); c.fillStyle = fg; c.fillText(text, x + size * .7, y + h * .66); return w; };
    if (o.template === 'frame') {
      c.fillStyle = th.bg; c.fillRect(0, 0, W, H); cover(c, img, 70, 70, 860, 1000, 36);
      const t = fitText(c, head, serif, 820, 3, 86, 46); c.font = serif(t.size); c.fillStyle = th.fg;
      t.lines.forEach((l, i) => c.fillText(l, 90, 1180 + i * t.size * 1.18));
      if (small) pill(90, 1180 + t.lines.length * t.size * 1.18 + 10, small, th.accent, th.onAccent, 40);
      if (cta) { c.font = `700 34px ${SANS}`; c.fillStyle = th.fg; c.globalAlpha = .75; c.fillText(cta.toUpperCase(), 90, 1440); c.globalAlpha = 1; }
    } else if (o.template === 'badge') {
      cover(c, img, 0, 0, W, H, 0);
      const g = c.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.78)'); c.fillStyle = g; c.fillRect(0, H * .45, W, H * .55);
      if (small) pill(60, 60, small, th.accent, th.onAccent, 44);
      const t = fitText(c, head, heavy, 860, 4, 100, 52); c.font = heavy(t.size); c.fillStyle = '#fff';
      const top = H - 150 - t.lines.length * t.size * 1.12; t.lines.forEach((l, i) => c.fillText(l, 70, top + i * t.size * 1.12));
      if (cta) { c.font = `700 38px ${SANS}`; c.fillStyle = '#fff'; c.globalAlpha = .9; c.fillText(cta + '  →', 70, H - 70); c.globalAlpha = 1; }
    } else if (o.template === 'split') {
      c.fillStyle = th.bg; c.fillRect(0, 0, W, H); cover(c, img, 0, 0, W, 1030, 0);
      c.fillStyle = th.accent; c.fillRect(0, 1030, W, 14);
      const t = fitText(c, head, heavy, 860, 3, 84, 44); c.font = heavy(t.size); c.fillStyle = th.fg;
      t.lines.forEach((l, i) => c.fillText(l, 70, 1160 + i * t.size * 1.15));
      if (small) { const r = 120, cx = W - 160, cy = 1030; c.fillStyle = th.accent; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.fillStyle = th.onAccent; c.textAlign = 'center'; const s = fitText(c, small, heavy, 190, 3, 36, 20); c.font = heavy(s.size); s.lines.forEach((l, i) => c.fillText(l, cx, cy - (s.lines.length - 1) * s.size * .55 + i * s.size * 1.1 + s.size * .35)); c.textAlign = 'left'; }
      if (cta) { c.font = `700 36px ${SANS}`; c.fillStyle = th.fg; c.globalAlpha = .8; c.fillText(cta.toUpperCase(), 70, 1440); c.globalAlpha = 1; }
    } else if (o.template === 'minimal') {
      c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); cover(c, img, 40, 40, 920, 1420, 0);
      c.strokeStyle = th.accent; c.lineWidth = 10; c.strokeRect(40, 40, 920, 1420);
      c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(150, 1190, 700, 220);
      const t = fitText(c, head, serif, 640, 2, 60, 34); c.font = serif(t.size); c.fillStyle = th.fg === '#f6f1ff' ? '#1d1a2b' : th.fg; c.textAlign = 'center';
      t.lines.forEach((l, i) => c.fillText(l, 500, 1262 + i * t.size * 1.2));
      if (small || cta) { c.font = `700 30px ${SANS}`; c.fillStyle = th.accent; c.fillText([small, cta].filter(Boolean).join('  ·  ').toUpperCase(), 500, 1385); } c.textAlign = 'left';
    } else { // band
      cover(c, img, 0, 0, W, H, 0);
      const t = fitText(c, head, heavy, 860, 3, 92, 48), bandH = 150 + t.lines.length * t.size * 1.15 + (cta ? 90 : 20);
      c.fillStyle = th.bg; c.fillRect(0, H - bandH, W, bandH); c.fillStyle = th.accent; c.fillRect(0, H - bandH, W, 12);
      c.font = heavy(t.size); c.fillStyle = th.fg; t.lines.forEach((l, i) => c.fillText(l, 70, H - bandH + 100 + i * t.size * 1.15));
      if (cta) { c.font = `700 36px ${SANS}`; c.fillStyle = th.fg; c.globalAlpha = .8; c.fillText(cta.toUpperCase(), 70, H - 50); c.globalAlpha = 1; }
      if (small) pill(60, 60, small, th.accent, th.onAccent, 44);
    }
    return canvas;
  }
  async function loadImage(file) {
    if (!file || !/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(file.type)) throw new Error('Please choose a PNG, JPG or WebP photo.');
    if (file.size > 20 * 1024 * 1024) throw new Error('That photo is larger than 20 MB. Please choose a smaller one.');
    if (window.createImageBitmap) { try { return await createImageBitmap(file, {imageOrientation: 'from-image'}); } catch (e) { /* fall through */ } }
    return new Promise((res, rej) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => { URL.revokeObjectURL(u); rej(new Error('That file could not be read as a photo.')); }; i.src = u; });
  }
  return {W, H, THEMES, TEMPLATES, draw, loadImage};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Studio;
