// FLAT: the Astrivo "Flat-Vector Science" drawing library. Every function is a pure function of its inputs.
// Logical canvas is 720 x 1280 (vertical Short). Loaded after harness.js (H). Exposes window.FLAT.
(function () {
  const TAU = Math.PI * 2;
  const cl = H.clamp, lerp = H.lerp;
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const eo = H.ease.out, eio = H.ease.inOut;
  const back = (u, s = 1.5) => { if (u <= 0) return 0; if (u >= 1) return 1; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  const FONT = '"Nunito", "Fredoka", sans-serif';
  const F = (w, px) => `${w} ${px}px ${FONT}`;

  const C = {
    sky0: '#090b2c', sky1: '#18134f', sky2: '#3a1a6c',
    ink: '#141846',
    teal: ['#a4fbef', '#3ccbdc', '#1d64b0'],
    orange: ['#ffcc7a', '#ff8d3f', '#d24a2a'],
    yellow: '#ffd23f', pink: '#ff5d8f', red: '#ff3b5c', green: '#38e08e', cyan: '#56e8ff', violet: '#8b5cff',
  };

  // ---------- timeline (shared with scoreSound) ----------
  // ---------- small helpers ----------
  function rr(x, X, Y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
  }
  function glow(x, cx, cy, r, col, a) {
    if (a <= 0 || r <= 0) return;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, H.rgba(col, a)); g.addColorStop(0.35, H.rgba(col, a * 0.4)); g.addColorStop(1, H.rgba(col, 0));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  }
  function spark(x, cx, cy, r, col, a) {
    if (a <= 0 || r <= 0) return;
    x.save(); x.globalAlpha *= a; x.fillStyle = col; x.beginPath();
    x.moveTo(cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r);
    x.quadraticCurveTo(cx, cy, cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.fill(); x.restore();
  }
  function crescent(x, cx, cy, r, dx, dy, fill) {
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
    x.beginPath(); x.rect(cx - r - 2, cy - r - 2, 2 * r + 4, 2 * r + 4); x.arc(cx + dx, cy + dy, r * 1.02, 0, TAU);
    x.fillStyle = fill; x.fill('evenodd'); x.restore();
  }
  function ball(x, cx, cy, r, col, o = {}) {
    if (r <= 0.3) return;
    const la = o.la == null ? -2.25 : o.la, lx = Math.cos(la), ly = Math.sin(la);
    const g = x.createLinearGradient(cx + lx * r, cy + ly * r, cx - lx * r, cy - ly * r);
    g.addColorStop(0, col[0]); g.addColorStop(0.45, col[1]); g.addColorStop(1, H.rgba(H.mix(col[1], col[2], 0.6)));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    if (o.inner) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip(); o.inner(); x.restore(); }
    const sh = o.sh == null ? 0.3 : o.sh;
    crescent(x, cx, cy, r, lx * r * sh, ly * r * sh, H.rgba(col[2], o.sha == null ? 0.5 : o.sha));
    crescent(x, cx, cy, r, lx * r * sh * 2.2, ly * r * sh * 2.2, H.rgba(col[2], (o.sha == null ? 0.5 : o.sha) * 0.45));
    crescent(x, cx, cy, r, -lx * r * 0.075, -ly * r * 0.075, H.rgba(o.rim || '#ffffff', o.rima == null ? 0.42 : o.rima));
  }
  const bez = (P, u) => { const v = 1 - u; return [v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0], v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1]]; };
  function arrow(x, P, prog, col, lw, o = {}) {
    if (prog <= 0) return;
    const n = 48, a = o.a == null ? 1 : o.a;
    x.save(); x.globalAlpha *= a; x.strokeStyle = col; x.fillStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
    if (o.dots) x.setLineDash([0.01, lw * 1.9]);
    x.beginPath(); const p0 = bez(P, o.from || 0); x.moveTo(p0[0], p0[1]);
    for (let i = 1; i <= n; i++) { const u = (o.from || 0) + ((prog - (o.from || 0)) * i) / n; const p = bez(P, u); x.lineTo(p[0], p[1]); }
    x.stroke(); x.setLineDash([]);
    if (o.head !== false && prog > 0.08) {
      const e = bez(P, prog), e0 = bez(P, prog - 0.02), ang = Math.atan2(e[1] - e0[1], e[0] - e0[0]), hs = lw * 1.5 * cl(prog * 5);
      x.translate(e[0], e[1]); x.rotate(ang); x.beginPath(); x.moveTo(hs * 1.1, 0); x.lineTo(-hs * 0.8, hs); x.lineTo(-hs * 0.8, -hs); x.closePath();
      x.lineWidth = lw * 0.7; x.fill(); x.stroke();
    }
    x.restore();
  }
  const line = (a, b) => [a, [lerp(a[0], b[0], 0.33), lerp(a[1], b[1], 0.33)], [lerp(a[0], b[0], 0.66), lerp(a[1], b[1], 0.66)], b];
  function text(x, s, cx, cy, px, col, o = {}) {
    x.save(); x.font = F(o.w || 900, px); x.textAlign = o.align || 'center'; x.textBaseline = 'middle';
    x.globalAlpha *= o.a == null ? 1 : o.a;
    x.fillStyle = o.shadow || 'rgba(10,8,46,0.55)'; x.fillText(s, cx + px * 0.03, cy + px * 0.07);
    x.fillStyle = col; x.fillText(s, cx, cy); x.restore();
  }
  function pill(x, cx, cy, s, px, o = {}) {
    const sc = o.s == null ? 1 : o.s, a = o.a == null ? 1 : o.a;
    if (sc <= 0.01 || a <= 0.01) return;
    x.save(); x.font = F(o.w || 900, px);
    const tw = x.measureText(s).width, w = tw + px * 1.15, h = px * 1.6;
    x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha *= a;
    x.fillStyle = 'rgba(10,8,46,0.4)'; rr(x, -w / 2, -h / 2 + px * 0.2, w, h, h / 2); x.fill();
    x.fillStyle = o.bg || '#ffffff';
    if (o.ptr) { const d = o.ptr === 'up' ? -1 : 1; x.beginPath(); x.moveTo(-px * 0.35, d * (h / 2 - 2)); x.lineTo(0, d * (h / 2 + px * 0.45)); x.lineTo(px * 0.35, d * (h / 2 - 2)); x.fill(); }
    rr(x, -w / 2, -h / 2, w, h, h / 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; rr(x, -w / 2 + h * 0.25, -h / 2 + h * 0.12, w - h * 0.5, h * 0.16, h * 0.08); x.fill();
    x.fillStyle = o.fg || C.ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 0, px * 0.06);
    x.restore();
    return w;
  }
  function flare(x, cx, cy, k, t) {
    if (k <= 0) return;
    glow(x, cx, cy, 380 * (0.6 + 0.4 * k), '#ffcf5a', 0.5 * k);
    glow(x, cx, cy, 150, '#fff6d0', 0.55 * k);
    x.save(); x.translate(cx, cy); x.rotate(t * 0.25); x.globalAlpha *= 0.3 * k; x.fillStyle = '#ffe28a';
    for (let i = 0; i < 12; i++) { x.rotate(TAU / 12); x.beginPath(); x.moveTo(0, -12); x.lineTo(300 + 60 * (i % 2), 0); x.lineTo(0, 12); x.fill(); }
    x.restore();
  }
  function burst(x, cx, cy, age, seed, spread) {
    if (age < 0 || age > 1.4) return;
    const r = H.rng(seed);
    for (let i = 0; i < 18; i++) {
      const a = r.range(0, TAU), d = (spread || 300) * r.range(0.45, 1) * eo(cl(age / 0.9)), sz = r.range(7, 16) * (1 - cl(age / 1.4));
      spark(x, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, sz, r.pick(['#ffffff', '#ffe28a', '#9ff7ff', '#ffb0d0']), 1);
    }
  }

  // ---------- sky (reference, re-centred for any W x H) ----------
  let STARS = null;
  function stars(W, H_) {
    if (STARS) return STARS;
    const r = H.rng(77), a = [], sp = [], SW = W + 400, SH = H_ + 400;
    for (let i = 0; i < 640; i++) a.push({ x: r.range(0, SW), y: r.range(0, SH), d: r.pick([0.15, 0.3, 0.3, 0.55, 1]), s: r.range(0.6, 2.0), ph: r.range(0, TAU), sp: r.range(0.8, 2.6), c: r.pick(['#ffffff', '#cfe4ff', '#ffe9c7', '#dccbff']) });
    for (let i = 0; i < 16; i++) sp.push({ x: r.range(0, SW), y: r.range(0, SH), d: r.range(0.3, 0.9), s: r.range(6, 13), ph: r.range(0, TAU) });
    STARS = { a, sp, SW, SH }; return STARS;
  }
  function sky(x, W, H_, t, cam = {}) {
    const px = cam.x || 0, py = cam.y || 0, lz = Math.log(cam.z || 1);
    const g = x.createLinearGradient(0, 0, W * 0.5, H_);
    g.addColorStop(0, C.sky0); g.addColorStop(0.5, C.sky1); g.addColorStop(1, C.sky2);
    x.fillStyle = g; x.fillRect(0, 0, W, H_);
    glow(x, W * 0.9, H_ * 0.1, 700, '#7b34c6', 0.34);
    glow(x, W * 0.0, H_ * 0.95, 680, '#2448b4', 0.4);
    glow(x, W * 0.5, H_ * 0.55, 560, '#4a2a9c', 0.16);
    const S = stars(W, H_);
    const place = (s) => {
      const k = Math.exp(lz * s.d * 0.6);
      const sx = (((s.x - px * s.d) % S.SW) + S.SW) % S.SW - 200, sy = (((s.y - py * s.d) % S.SH) + S.SH) % S.SH - 200;
      return [(sx - W / 2) * k + W / 2, (sy - H_ / 2) * k + H_ / 2];
    };
    for (const s of S.a) {
      const [sx, sy] = place(s);
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H_ + 4) continue;
      x.globalAlpha = (0.55 + 0.45 * Math.sin(t * s.sp + s.ph)) * (0.45 + s.d * 0.55);
      x.fillStyle = s.c; x.beginPath(); x.arc(sx, sy, s.s * (0.7 + 0.35 * s.d), 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
    for (const s of S.sp) {
      const [sx, sy] = place(s); const tw = 0.6 + 0.4 * Math.sin(t * 1.7 + s.ph);
      glow(x, sx, sy, s.s * 2.2, '#bfa8ff', 0.25 * tw);
      spark(x, sx, sy, s.s * tw, '#ffffff', 0.9);
    }
  }

  // ---------- planets (reference) ----------
  const PL = {
    moon: { c: ['#e8e6ff', '#a7a2d8', '#4a3f8c'], craters: true },
    coral: { c: ['#ffd29a', '#ff7a4a', '#7a1f4f'], glow: '#ff8a50', tilt: 0.1, atmo: [255, 226, 190],
      bands: [[-0.7, -0.5, '#ffe2b8', 0.5], [-0.32, -0.12, '#e8553a', 0.6], [0.05, 0.22, '#ffb27a', 0.5], [0.4, 0.62, '#c43c46', 0.55]] },
  };
  function bands(x, r, B, tilt) {
    x.save(); x.rotate(tilt || 0);
    for (const [v0, v1, col, a] of B) {
      x.beginPath();
      for (let i = 0; i <= 20; i++) { const u = (i / 20) * 2 - 1; x.lineTo(u * r * 1.1, (v0 + 0.13 * (1 - u * u)) * r); }
      for (let i = 20; i >= 0; i--) { const u = (i / 20) * 2 - 1; x.lineTo(u * r * 1.1, (v1 + 0.13 * (1 - u * u)) * r); }
      x.fillStyle = H.rgba(col, a == null ? 1 : a); x.fill();
    }
    x.restore();
  }
  function atmo(x, cx, cy, r, col, atA) {
    x.save(); x.lineCap = 'round'; const ga0 = x.globalAlpha;
    const la = -2.25, ag = x.createLinearGradient(cx + Math.cos(la) * r, cy + Math.sin(la) * r, cx - Math.cos(la) * r, cy - Math.sin(la) * r);
    ag.addColorStop(0, H.rgba(col, 1)); ag.addColorStop(0.55, H.rgba(col, 0.5)); ag.addColorStop(1, H.rgba(col, 0.08));
    x.strokeStyle = ag;
    for (const [lw, a] of [[r * 0.05, 0.08], [r * 0.028, 0.16], [r * 0.014, 0.3], [Math.max(2, r * 0.006), 0.6]]) { x.globalAlpha = ga0 * a * atA; x.lineWidth = lw; x.beginPath(); x.arc(cx, cy, r + lw * 0.15, 0, TAU); x.stroke(); }
    x.restore();
  }
  let planet = function (x, cx, cy, r, pal, o = {}) {
    if (r <= 0.5) return;
    if (pal.glow) glow(x, cx, cy, r * 1.7, pal.glow, o.glowA == null ? 0.32 : o.glowA);
    ball(x, cx, cy, r, pal.c, {
      sh: 0.34, sha: 0.55, rima: 0.35,
      inner: () => {
        x.save(); x.translate(cx, cy);
        if (pal.bands) bands(x, r, pal.bands, pal.tilt);
        if (pal.craters) { const q = H.rng(5); for (let i = 0; i < 5; i++) { const a = q.range(0, TAU), d = q.range(0.1, 0.65) * r, cr = q.range(0.1, 0.2) * r, qx = Math.cos(a) * d, qy = Math.sin(a) * d; x.fillStyle = 'rgba(80,66,150,0.38)'; x.beginPath(); x.arc(qx, qy, cr, 0, TAU); x.fill(); crescent(x, qx, qy, cr, -cr * 0.3, -cr * 0.3, 'rgba(255,255,255,0.3)'); } }
        if (o.inner) o.inner();
        x.restore();
      },
    });
    if (pal.atmo && (o.atmo == null ? 0.7 : o.atmo) > 0) atmo(x, cx, cy, r, pal.atmo, o.atmo == null ? 0.7 : o.atmo);
  }
  const moonGlow = (x, cx, cy, r, a = 0.28) => glow(x, cx, cy, r * 1.8, '#b9a8ff', a);

  // ---------- Earth: the same flat ball, ocean blue, rotating flat continents, ice caps ----------
  const EARTH = { c: ['#9ff3ff', '#2f8fe0', '#1d2f86'], atmo: [190, 245, 255] };
  let CONT = null;
  function continents() {
    if (CONT) return CONT;
    const r = H.rng(2024), out = [];
    // a handful of continents, each a cluster of round blobs (lon, lat in radians, sizes in radii)
    const seeds = [[0.2, 0.55], [0.5, -0.35], [1.9, 0.6], [2.2, 0.05], [2.4, -0.45], [3.9, 0.5], [4.2, -0.3], [5.4, 0.25]];
    for (const [lon, lat] of seeds) {
      const n = r.int(3, 5);
      for (let i = 0; i < n; i++) out.push({ lon: lon + r.range(-0.3, 0.3), lat: cl(lat + r.range(-0.22, 0.22), -1.1, 1.1), s: r.range(0.13, 0.24) });
    }
    CONT = out; return CONT;
  }
  let CRACKS = null;
  function cracks() {
    if (CRACKS) return CRACKS;
    const r = H.rng(611), out = [];
    for (let i = 0; i < 7; i++) {
      let a = r.range(0, TAU), d = r.range(0.05, 0.6), px = Math.cos(a) * d, py = Math.sin(a) * d, ang = r.range(0, TAU);
      const pts = [[px, py]];
      for (let k = 0; k < 5; k++) { ang += r.range(-0.9, 0.9); px += Math.cos(ang) * 0.13; py += Math.sin(ang) * 0.13; pts.push([px, py]); }
      out.push(pts);
    }
    CRACKS = out; return CRACKS;
  }
  function earth(x, cx, cy, r, o = {}) {
    if (r <= 0.5) return;
    const spin = o.spin || 0, quake = o.quake || 0, t = o.t || 0;
    glow(x, cx, cy, r * 1.7, quake > 0 ? H.rgba(H.mix('#4fc9ff', '#ff6a3c', quake * 0.6)) : '#4fc9ff', o.glowA == null ? 0.3 : o.glowA);
    // tidal bulge: the oceans pile up toward (and away from) the Moon
    if (o.bulge > 0) {
      x.save(); x.translate(cx, cy); x.rotate(o.bulgeAng || 0);
      x.fillStyle = H.rgba(C.cyan, 0.22); x.beginPath(); x.ellipse(0, 0, r * (1 + o.bulge * 1.15), r * (1 - o.bulge * 0.1), 0, 0, TAU); x.fill();
      x.fillStyle = H.rgba('#7fdcff', 0.45); x.beginPath(); x.ellipse(0, 0, r * (1 + o.bulge * 0.7), r * 0.995, 0, 0, TAU); x.fill();
      x.restore();
    }
    ball(x, cx, cy, r, EARTH.c, {
      sh: 0.34, sha: 0.55, rima: 0.35,
      inner: () => {
        x.save(); x.translate(cx, cy);
        for (const b of continents()) {
          const a = b.lon - spin, cz = Math.cos(a) * Math.cos(b.lat);
          if (cz < -0.05) continue;
          const px = Math.sin(a) * Math.cos(b.lat) * r, py = -Math.sin(b.lat) * r;
          const sq = Math.max(0.2, Math.cos(a));
          x.fillStyle = '#3fcf8a'; x.beginPath(); x.ellipse(px, py, b.s * r * sq, b.s * r * Math.max(0.35, Math.cos(b.lat)), 0, 0, TAU); x.fill();
          x.fillStyle = 'rgba(160,255,200,0.45)'; x.beginPath(); x.ellipse(px - b.s * r * 0.25 * sq, py - b.s * r * 0.25, b.s * r * 0.45 * sq, b.s * r * 0.35, 0, 0, TAU); x.fill();
        }
        // ice caps
        x.fillStyle = 'rgba(240,252,255,0.92)';
        x.beginPath(); x.ellipse(0, -r * 0.98, r * 0.42, r * 0.12, 0, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(0, r * 0.99, r * 0.38, r * 0.1, 0, 0, TAU); x.fill();
        // glowing quake cracks
        if (quake > 0) {
          x.lineCap = 'round'; x.lineJoin = 'round';
          cracks().forEach((pts, i) => {
            const k = cl(quake * 1.6 - i * 0.08), fl = 0.75 + 0.25 * Math.sin(t * 9 + i * 2);
            if (k <= 0) return;
            const n = Math.max(2, Math.round(pts.length * k));
            for (const [lw, col, al] of [[r * 0.07, '#ff3b1c', 0.25], [r * 0.03, '#ff7a3c', 0.85], [r * 0.012, '#ffe28a', 1]]) {
              x.strokeStyle = H.rgba(col, al * fl * cl(quake * 2)); x.lineWidth = lw; x.beginPath();
              for (let j = 0; j < n; j++) { const [qx, qy] = pts[j]; j ? x.lineTo(qx * r, qy * r) : x.moveTo(qx * r, qy * r); }
              x.stroke();
            }
          });
        }
        x.restore();
      },
    });
    atmo(x, cx, cy, r, EARTH.atmo, o.atmo == null ? 1 : o.atmo);
    // volcano plumes on the limb
    if (quake > 0) {
      const q = H.rng(91);
      for (let i = 0; i < 5; i++) {
        const a = q.range(-2.9, -0.2), bx = cx + Math.cos(a) * r * 0.98, by = cy + Math.sin(a) * r * 0.98;
        const k = cl(quake * 1.5 - i * 0.12), h = r * 0.16 * k * (0.8 + 0.2 * Math.sin(t * 7 + i));
        if (k <= 0) continue;
        glow(x, bx, by, r * 0.22 * k, '#ff7a3c', 0.6 * k);
        x.save(); x.translate(bx, by); x.rotate(a + Math.PI / 2);
        x.fillStyle = '#ff8d3f'; x.beginPath(); x.moveTo(-h * 0.35, 0); x.quadraticCurveTo(-h * 0.25, -h * 0.7, 0, -h * 1.25); x.quadraticCurveTo(h * 0.25, -h * 0.7, h * 0.35, 0); x.fill();
        x.fillStyle = '#ffd94a'; x.beginPath(); x.moveTo(-h * 0.18, 0); x.quadraticCurveTo(-h * 0.1, -h * 0.5, 0, -h * 0.8); x.quadraticCurveTo(h * 0.1, -h * 0.5, h * 0.18, 0); x.fill();
        x.restore();
        for (let s = 0; s < 3; s++) { const u = ((t * 0.9 + s / 3 + i * 0.21) % 1); spark(x, bx + Math.cos(a) * h * 2 * u + Math.sin(a + s) * 8 * u, by + Math.sin(a) * h * 2 * u, 7 * (1 - u) * k, '#ffe28a', 0.9); }
      }
    }
  }

  // ================= SCENE B: the view from the shore =================
  let CITY = null;
  function city(W) {
    if (CITY) return CITY;
    const r = H.rng(303), b = []; let xx = -20;
    while (xx < W + 20) { const w = r.range(46, 92); b.push({ x: xx, w, h: r.range(90, 270), c: r.pick(['#3a2a8c', '#2d2478', '#46309a', '#33287f']), win: r.int(0, 1000) }); xx += w + r.range(4, 14); }
    CITY = b; return CITY;
  }
  function water(x, W, H_, level, amp, t) {
    const layers = [['#2f74c9', 0, 1.0, 0.0], ['#3a9be0', 26, 0.8, 1.3], ['#56c8ff', 56, 0.6, 2.4]];
    for (const [col, off, sc, ph] of layers) {
      const y0 = level + off;
      x.fillStyle = col; x.beginPath(); x.moveTo(0, H_ + 10);
      for (let i = 0; i <= 36; i++) { const px = (i / 36) * W; x.lineTo(px, y0 + Math.sin(px * 0.018 + t * 2.2 + ph) * amp * sc + Math.sin(px * 0.041 - t * 1.4 + ph) * amp * 0.35 * sc); }
      x.lineTo(W, H_ + 10); x.closePath(); x.fill();
      // foam caps
      x.fillStyle = 'rgba(198,248,255,0.55)';
      for (let i = 0; i < 6; i++) { const px = ((i * 137 + t * 30 * (1 + sc) + off * 3) % (W + 80)) - 40; const py = y0 + Math.sin(px * 0.018 + t * 2.2 + ph) * amp * sc; rr(x, px - 22, py - 3, 44, 8, 4); x.fill(); }
    }
  }
  // ================= finish (reference print grain) =================
  let GRAIN = null;
  function grainTex() {
    if (GRAIN) return GRAIN;
    const S = 256, tile = H.layer(S, S), tc = tile.getContext('2d'), img = tc.createImageData(S, S), d = img.data, r = H.rng(4242);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 92; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    tc.putImageData(img, 0, 0);
    const MW = 180, MH = 320, mot = H.layer(MW, MH), mc = mot.getContext('2d'), mi = mc.createImageData(MW, MH), md = mi.data, nz = H.makeNoise(88);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const v = 128 + nz.fbm2(x * 0.035, y * 0.035, 4) * 70 + nz.n2(x * 0.22, y * 0.22) * 14, k = (y * MW + x) * 4; md[k] = md[k + 1] = md[k + 2] = v; md[k + 3] = 255; }
    mc.putImageData(mi, 0, 0);
    GRAIN = { tile, mot };
    return GRAIN;
  }
  function finish(x, W, H_, t) {
    const G = grainTex(), f = Math.floor(t * 24);
    x.save(); x.globalCompositeOperation = 'overlay';
    x.globalAlpha = 0.12; x.imageSmoothingEnabled = true; x.drawImage(G.mot, 0, 0, W, H_);
    const pat = x.createPattern(G.tile, 'repeat'); pat.setTransform(new DOMMatrix().translateSelf((f * 73) % 256, (f * 151) % 256));
    x.globalAlpha = 0.09; x.fillStyle = pat; x.fillRect(0, 0, W, H_);
    x.restore();
  }

  // ---------- more palettes ----------
  Object.assign(PL, {
    magenta: { c: ['#ffa0c4', '#de4b93', '#4e1670'], glow: '#ff5fa8', tilt: -0.18, atmo: [255, 214, 234],
      bands: [[-0.62, -0.48, '#ffc1d8', 0.55], [-0.2, -0.02, '#b5307e', 0.6], [0.06, 0.14, '#ffd0e2', 0.4], [0.36, 0.58, '#9a2775', 0.55]],
      ring: { rx: 1.75, ry: 0.5, tilt: -0.2, bands: [[1.18, 1.32, '#ffd27a', 0.95], [1.34, 1.5, '#ff9f5a', 0.9], [1.53, 1.6, '#ffe7b0', 0.8]] } },
    teal: { c: ['#9ff3ff', '#3a9be0', '#1d2f86'], glow: '#4fc9ff', tilt: -0.12, atmo: [190, 245, 255],
      bands: [[-0.5, -0.36, '#c6f8ff', 0.5], [-0.05, 0.1, '#2f74c9', 0.55], [0.32, 0.5, '#7fdcff', 0.4]] },
    mars: { c: ['#ffb38a', '#e0603a', '#7a1f2f'], glow: '#ff7a50', craters: true, atmo: [255, 200, 170] },
    venus: { c: ['#fff0b8', '#f2c46a', '#a8642a'], glow: '#ffd27a', atmo: [255, 240, 200],
      bands: [[-0.5, -0.3, '#fff6d8', 0.4], [0.1, 0.3, '#e8a850', 0.35]] },
    jupiter: { c: ['#ffe2b8', '#e8a36a', '#7a3f2a'], glow: '#ffb070', tilt: 0.05, atmo: [255, 230, 200],
      bands: [[-0.75, -0.6, '#fff0d8', 0.5], [-0.42, -0.25, '#c4643a', 0.65], [-0.08, 0.06, '#fff0d8', 0.45], [0.2, 0.36, '#b85030', 0.6], [0.5, 0.64, '#f6c890', 0.5]],
      spot: true },
    saturn: { c: ['#fff0c0', '#f0c878', '#8a5a2a'], glow: '#ffd27a', tilt: -0.1, atmo: [255, 240, 200],
      bands: [[-0.5, -0.38, '#fff8dc', 0.5], [-0.1, 0.05, '#d8a058', 0.55], [0.3, 0.45, '#fff0c8', 0.4]],
      ring: { rx: 2.0, ry: 0.46, tilt: -0.22, bands: [[1.22, 1.45, '#ffe7b0', 0.95], [1.48, 1.72, '#e8c080', 0.9], [1.76, 1.9, '#fff3d0', 0.7]] } },
    neptune: { c: ['#a8c8ff', '#3f63c9', '#1a2470'], glow: '#5a8cff', tilt: 0.08, atmo: [200, 220, 255],
      bands: [[-0.4, -0.28, '#c8dcff', 0.4], [0.15, 0.3, '#2c4aa8', 0.5]] },
    ice: { c: ['#ffffff', '#cfe4ff', '#6a7fc0'], craters: true },
    rock: { c: ['#d8c8b8', '#9a8270', '#4a3a40'], craters: true },
  });
  // ringed / banded planet (reference version: back half of the ring, ball, front half)
  function ring(x, cx, cy, R, half, a = 1) {
    if (a <= 0) return;
    x.save(); x.translate(cx, cy); x.rotate(R.tilt); x.globalAlpha *= a;
    const m = Math.max(...R.bands.map((b) => b[1])) * 1.05;
    x.beginPath(); if (half === 'back') x.rect(-R.rx * m, -R.ry * m, R.rx * m * 2, R.ry * m); else x.rect(-R.rx * m, 0, R.rx * m * 2, R.ry * m); x.clip();
    for (const [f0, f1, col, al] of R.bands) {
      x.beginPath(); x.ellipse(0, 0, R.rx * f1, R.ry * f1, 0, 0, TAU); x.ellipse(0, 0, R.rx * f0, R.ry * f0, 0, 0, TAU);
      x.fillStyle = H.rgba(col, (al == null ? 1 : al) * (half === 'back' ? 0.75 : 1)); x.fill('evenodd');
    }
    x.restore();
  }
  const planetBase = planet;
  function planetR(x, cx, cy, r, pal, o = {}) {
    if (r <= 0.5) return;
    const R = pal.ring && { rx: pal.ring.rx * r, ry: pal.ring.ry * r, tilt: pal.ring.tilt, bands: pal.ring.bands };
    if (R) { if (pal.glow) glow(x, cx, cy, r * 1.7, pal.glow, o.glowA == null ? 0.32 : o.glowA); ring(x, cx, cy, R, 'back', o.ringA == null ? 1 : o.ringA); }
    const inner0 = o.inner;
    planetBase(x, cx, cy, r, pal, { ...o, glowA: R ? 0 : o.glowA, inner: () => {
      if (pal.spot) { x.fillStyle = 'rgba(190,70,40,0.75)'; x.beginPath(); x.ellipse(r * 0.28, r * 0.28, r * 0.2, r * 0.11, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,200,160,0.5)'; x.beginPath(); x.ellipse(r * 0.24, r * 0.25, r * 0.08, r * 0.04, 0, 0, TAU); x.fill(); }
      if (inner0) inner0();
    } });
    if (R) ring(x, cx, cy, R, 'front', o.ringA == null ? 1 : o.ringA);
  }
  planet = planetR;

  // ---------- the Sun: layered glow, rotating flat rays, granules ----------
  function sun(x, cx, cy, r, t = 0, o = {}) {
    if (r <= 0.5) return;
    const k = o.k == null ? 1 : o.k;
    glow(x, cx, cy, r * 3.2, '#ff8d3f', 0.35 * k);
    glow(x, cx, cy, r * 1.9, '#ffd23f', 0.5 * k);
    x.save(); x.translate(cx, cy); x.rotate(t * 0.12);
    for (let i = 0; i < 16; i++) { x.rotate(TAU / 16); const L = r * (1.28 + 0.08 * Math.sin(t * 2 + i * 1.7)) ; x.fillStyle = i % 2 ? 'rgba(255,190,70,0.85)' : 'rgba(255,140,60,0.8)'; x.beginPath(); x.moveTo(-r * 0.16, -r * 0.9); x.quadraticCurveTo(0, -L - r * 0.08, r * 0.16, -r * 0.9); x.fill(); }
    x.restore();
    ball(x, cx, cy, r, ['#fff3b0', '#ffc23f', '#e8602a'], { sha: 0.35, rima: 0.5, inner: () => {
      const q = H.rng(12);
      for (let i = 0; i < 14; i++) { const a = q.range(0, TAU), d = q.range(0, 0.8) * r, s = q.range(0.06, 0.13) * r; x.fillStyle = 'rgba(255,240,170,0.35)'; x.beginPath(); x.arc(cx + Math.cos(a + t * 0.05) * d, cy + Math.sin(a + t * 0.05) * d, s * (0.8 + 0.2 * Math.sin(t * 3 + i)), 0, TAU); x.fill(); }
      if (o.spots) for (let i = 0; i < 3; i++) { const a = 0.6 + i * 0.5 + t * 0.03; x.fillStyle = 'rgba(150,50,20,0.55)'; x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.3, r * 0.06, 0, TAU); x.fill(); }
    } });
  }
  // solar-wind / particle streaks flowing along a straight line from A to B
  function streaks(x, A, B, t, o = {}) {
    const n = o.n || 26, col = o.col || '#ffe28a', sp = o.speed || 0.6, a = o.a == null ? 1 : o.a, wid = o.width || 120, r = H.rng(o.seed || 9);
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    x.save(); x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const off = r.range(-1, 1) * wid / 2, ph = r(), len = r.range(30, 80), u = (t * sp + ph) % 1;
      const px = A[0] + ux * L * u + nx * off, py = A[1] + uy * L * u + ny * off;
      x.globalAlpha = a * Math.sin(u * Math.PI); x.strokeStyle = col; x.lineWidth = r.range(3, 7);
      x.beginPath(); x.moveTo(px, py); x.lineTo(px - ux * len, py - uy * len); x.stroke();
    }
    x.restore();
  }
  // ---------- black hole: back half of the disk, shadow, photon ring, front half ----------
  function blackhole(x, cx, cy, r, t = 0, o = {}) {
    const tilt = o.tilt == null ? -0.15 : o.tilt, k = o.k == null ? 1 : o.k;
    glow(x, cx, cy, r * 4, '#ff8d3f', 0.25 * k); glow(x, cx, cy, r * 2.4, '#8b5cff', 0.3 * k);
    const disk = (half) => {
      x.save(); x.translate(cx, cy); x.rotate(tilt);
      x.beginPath(); if (half === 'back') x.rect(-r * 4, -r * 4, r * 8, r * 4); else x.rect(-r * 4, 0, r * 8, r * 4); x.clip();
      const bandsD = [[1.35, 1.65, '#fff3b0', 0.95], [1.65, 2.1, '#ffc23f', 0.9], [2.1, 2.7, '#ff8d3f', 0.8], [2.7, 3.3, '#d24a2a', 0.55]];
      for (const [f0, f1, col, al] of bandsD) { x.beginPath(); x.ellipse(0, 0, r * f1, r * f1 * 0.28, 0, 0, TAU); x.ellipse(0, 0, r * f0, r * f0 * 0.28, 0, 0, TAU); x.fillStyle = H.rgba(col, al * (half === 'back' ? 0.8 : 1) * k); x.fill('evenodd'); }
      x.strokeStyle = 'rgba(255,240,200,0.5)'; x.lineWidth = 3; x.setLineDash([18, 26]); x.lineDashOffset = -t * 120;
      x.beginPath(); x.ellipse(0, 0, r * 2.3, r * 2.3 * 0.28, 0, 0, TAU); x.stroke(); x.setLineDash([]);
      x.restore();
    };
    disk('back');
    // lensed top arc of the disk seen over the hole
    x.save(); x.strokeStyle = H.rgba('#ffd27a', 0.85 * k); x.lineWidth = r * 0.22; x.beginPath(); x.arc(cx, cy, r * 1.3, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); x.restore();
    glow(x, cx, cy, r * 1.45, '#fff3d0', 0.55 * k);
    x.fillStyle = '#04030f'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    x.strokeStyle = H.rgba('#fff3d0', 0.9); x.lineWidth = Math.max(2, r * 0.05); x.beginPath(); x.arc(cx, cy, r * 1.04, 0, TAU); x.stroke();
    disk('front');
  }
  // lumpy asteroid / rock
  function rock(x, cx, cy, r, seed = 1, rot = 0) {
    const q = H.rng(seed), n = 11, pts = [];
    for (let i = 0; i < n; i++) pts.push(r * q.range(0.78, 1.08));
    x.save(); x.translate(cx, cy); x.rotate(rot);
    const path = () => { x.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, d = pts[i % n]; i ? x.lineTo(Math.cos(a) * d, Math.sin(a) * d) : x.moveTo(Math.cos(a) * d, Math.sin(a) * d); } x.closePath(); };
    const g = x.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#d8c8b8'); g.addColorStop(0.5, '#9a8270'); g.addColorStop(1, '#4a3a40');
    path(); x.fillStyle = g; x.fill(); x.save(); path(); x.clip();
    x.fillStyle = 'rgba(40,20,40,0.35)'; x.beginPath(); x.arc(r * 0.35, r * 0.3, r * 0.75, 0, TAU); x.fill();
    for (let i = 0; i < 4; i++) { x.fillStyle = 'rgba(60,40,60,0.4)'; x.beginPath(); x.arc(q.range(-0.5, 0.5) * r, q.range(-0.5, 0.5) * r, q.range(0.1, 0.2) * r, 0, TAU); x.fill(); }
    x.restore(); x.restore();
  }
  // a glowing trail behind something moving (meteor, comet, rocket)
  function trail(x, hx, hy, ang, len, wid, col = '#ffb070', a = 1) {
    x.save(); x.translate(hx, hy); x.rotate(ang); x.globalAlpha *= a;
    const g = x.createLinearGradient(0, 0, -len, 0); g.addColorStop(0, H.rgba(col, 0.95)); g.addColorStop(1, H.rgba(col, 0));
    x.fillStyle = g; x.beginPath(); x.moveTo(0, -wid / 2); x.quadraticCurveTo(-len * 0.4, -wid * 0.3, -len, 0); x.quadraticCurveTo(-len * 0.4, wid * 0.3, 0, wid / 2); x.fill();
    x.restore();
  }

  // ---------- cute round character (big eyes), e.g. "you" or a tiny astronaut ----------
  function eye(x, ex, ey, er, o = {}) {
    const look = o.look || [0, 0];
    if ((o.happy || 0) > 0.5) { x.save(); x.strokeStyle = '#ffffff'; x.lineWidth = er * 0.42; x.lineCap = 'round'; x.beginPath(); x.arc(ex, ey + er * 0.35, er * 0.62, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); x.restore(); return; }
    const bl = 1 - 0.92 * (o.blink || 0);
    x.save(); x.translate(ex, ey); x.scale(1, bl);
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, er, 0, TAU); x.fill();
    const pr = er * (o.worry ? 0.45 : 0.56), px = look[0] * er * 0.36, py = look[1] * er * 0.36;
    x.fillStyle = '#141638'; x.beginPath(); x.arc(px, py, pr, 0, TAU); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.32, 0, TAU); x.fill();
    x.restore();
  }
  const blinkAt = (t, ph) => { const u = (t + ph) % 3.3; return u < 0.14 ? Math.sin((u / 0.14) * Math.PI) : 0; };
  // buddy: round body + visor helmet; o: { col (3-stop palette), look, worry, happy, t, helmet:true }
  function buddy(x, cx, cy, r, o = {}) {
    if (r < 1) return;
    const t = o.t || 0, col = o.col || C.teal;
    x.save(); x.translate(cx, cy); x.rotate(o.rot || 0);
    for (const sd of [-1, 1]) { x.fillStyle = H.rgba(H.mix(col[1], col[2], 0.4)); x.beginPath(); x.ellipse(sd * r * 0.42, r * 0.95, r * 0.24, r * 0.15, 0, 0, TAU); x.fill(); }
    for (const sd of [-1, 1]) { const ang = sd * (0.6 + 0.15 * Math.sin(t * 3 + sd)) - sd * (o.armUp || 0) * 1.7; x.strokeStyle = H.rgba(H.mix(col[1], col[2], 0.3)); x.lineWidth = r * 0.22; x.lineCap = 'round'; x.beginPath(); x.moveTo(sd * r * 0.85, r * 0.15); x.lineTo(sd * r * 0.85 + Math.sin(ang) * r * 0.5, r * 0.15 + Math.cos(ang) * r * 0.5); x.stroke(); }
    ball(x, 0, 0, r, col, { sha: 0.45 });
    const vw = r * 1.3, vh = r * 0.72;
    x.fillStyle = '#0c1145'; rr(x, -vw / 2, -r * 0.5, vw, vh, r * 0.34); x.fill();
    x.fillStyle = 'rgba(160,240,255,0.22)'; rr(x, -vw / 2 + r * 0.14, -r * 0.44, vw * 0.45, r * 0.07, r * 0.035); x.fill();
    for (const sd of [-1, 1]) eye(x, sd * r * 0.28, -r * 0.14, r * 0.18, { look: o.look, blink: blinkAt(t, o.ph || 0), happy: o.happy, worry: o.worry > 0.5 });
    x.strokeStyle = '#9ff7ff'; x.lineWidth = r * 0.06; x.lineCap = 'round'; x.beginPath();
    if ((o.worry || 0) > 0.5) { x.moveTo(-r * 0.12, r * 0.12); x.quadraticCurveTo(0, r * 0.04, r * 0.12, r * 0.12); } else x.arc(0, r * 0.04, r * 0.1, 0.25 * Math.PI, 0.75 * Math.PI);
    x.stroke(); x.restore();
  }
  function badge(x, cx, cy, r, ok, s) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    glow(x, 0, 0, r * 2.4, ok ? C.green : C.red, 0.45);
    ball(x, 0, 0, r, ok ? ['#9fffc8', C.green, '#178a5a'] : ['#ff9aa8', C.red, '#9c1638'], { sha: 0.4 });
    x.strokeStyle = '#ffffff'; x.lineWidth = r * 0.26; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    if (ok) { x.moveTo(-r * 0.42, 0); x.lineTo(-r * 0.1, r * 0.32); x.lineTo(r * 0.45, -r * 0.3); } else { x.moveTo(-r * 0.34, -r * 0.34); x.lineTo(r * 0.34, r * 0.34); x.moveTo(r * 0.34, -r * 0.34); x.lineTo(-r * 0.34, r * 0.34); }
    x.stroke(); x.restore();
  }

  // ---------- numbers ----------
  const fmt = (v, d = 0) => Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  // a big number that pops (overshoot + bump) when it lands at time `land`
  function bigNumber(x, s, cx, cy, px, t, tIn, o = {}) {
    if (t < tIn - 0.05) return;
    const pop = 1 + 0.22 * Math.sin(seg(t, tIn, tIn + 0.35) * Math.PI);
    const sc = back(seg(t, tIn - 0.05, tIn + 0.25), 1.6) * pop;
    x.save(); x.translate(cx, cy); x.scale(sc, sc); text(x, s, 0, 0, px, o.col || C.yellow); x.restore();
    if (o.burst !== false) burst(x, cx, cy, (t - tIn) * 1.0, o.seed || 97, o.spread || 300);
  }
  // pop-in scale for any label: 0 before t0, overshoot to 1, optional pop-out at t1
  const popIn = (t, t0, t1, s = 1.6) => back(seg(t, t0, t0 + 0.3), s) * (t1 == null ? 1 : 1 - seg(t, t1, t1 + 0.2));

  // ---------- camera / transitions ----------
  // shake offset at time t for a hit at t0
  const shake = (t, t0, amp = 10, dur = 0.45) => (t >= t0 ? Math.sin(t * 61) * amp * Math.max(0, 1 - (t - t0) / dur) : 0);
  // wipe: a giant planet sweeps across the frame. u 0..1. Returns true once the sweep has covered the middle.
  function sweep(x, W, H_, u, pal = PL.coral, o = {}) {
    if (u <= 0 || u >= 1) return;
    const dir = o.dir || 1, spx = dir > 0 ? lerp(W + 1000, -1000, u) : lerp(-1000, W + 1000, u);
    const sy = H_ / 2 + (u - 0.5) * 140;
    if (pal === PL.moon) moonGlow(x, spx, sy, 900, 0.4);
    planet(x, spx, sy, 900, pal, { glowA: 0.4 });
  }
  // the wipe has covered the centre once u passes this
  const sweepMid = (u, W = 720) => lerp(W + 1000, -1000, u) < W / 2;
  // whiteout glow (dive transition). a 0..1
  function whiteout(x, W, H_, a) {
    if (a <= 0) return;
    const g = x.createRadialGradient(W / 2, H_ / 2, 0, W / 2, H_ / 2, 900);
    g.addColorStop(0, H.rgba('#fff6d0', a)); g.addColorStop(0.5, H.rgba('#8ff0ff', a * 0.95)); g.addColorStop(1, H.rgba('#6a4cff', a * 0.9));
    x.fillStyle = g; x.fillRect(0, 0, W, H_);
  }
  // radial flash on a hit
  function flash(x, W, H_, a, col = '#fff6d0') { if (a > 0) { x.fillStyle = H.rgba(col, 0.4 * a); x.fillRect(0, 0, W, H_); } }
  // speed lines (for punch-ins and the rewind)
  function speedLines(x, W, H_, a, t, col = '#ffffff') {
    if (a <= 0) return;
    const r = H.rng(3 + Math.floor(t * 30));
    x.save(); x.globalAlpha = a; x.strokeStyle = col; x.lineCap = 'round';
    for (let i = 0; i < 34; i++) { const ang = r.range(0, TAU), r0 = r.range(330, 520), r1 = r0 + r.range(120, 420); x.lineWidth = r.range(2, 6); x.beginPath(); x.moveTo(W / 2 + Math.cos(ang) * r0, H_ / 2 + Math.sin(ang) * r0 * 1.6); x.lineTo(W / 2 + Math.cos(ang) * r1, H_ / 2 + Math.sin(ang) * r1 * 1.6); x.stroke(); }
    x.restore();
  }

  window.FLAT = {
    TAU, cl, lerp, seg, eo, eio, back, F, FONT, C, PL,
    rr, glow, spark, crescent, ball, bez, arrow, line, text, pill, flare, burst,
    sky, bands, atmo, planet, ring, moonGlow, earth, continents, city, water, finish,
    sun, streaks, blackhole, rock, trail, eye, blinkAt, buddy, badge,
    fmt, bigNumber, popIn, shake, sweep, sweepMid, whiteout, flash, speedLines,
  };
})();
