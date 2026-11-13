// "What If Earth Lost Air for 5 Seconds?"  Flat-style Short, built on the moon-closer pattern.
// Scenes: A ground view (sky snaps black, silence, plane drops) -> whiteout -> B close-up of "you" (lungs, ears, raw UV)
// -> planet sweep -> C ocean shore (oceans boil = key hit, air crashes back) -> whiteout -> D Earth from space (thunderclap ring, 5 s).
// A countdown timer (5..0) in the top-left ties the whole story to the 5 seconds.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, rr, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, earth, sun, buddy, badge, city, water, sweep, whiteout, flash, speedLines, shake } = FLAT;
  let TL = null, COLD = false;

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      intro: s(1), black: w('black', 1), noon: w('noon', 1),
      silent: w('silent', 2), wavesIn: s(2) - 0.3, noSound: w('sound', 2),
      plane: [s(3) - 0.4, s(3) + 0.6], lift: w('lift', 3), drop: w('drop', 3),
      white1: [s(4) - 0.4, s(4) + 0.35], cutB: s(4),
      lungs: w('lungs', 4), rushes: w('rushes', 4), pop: w('pop', 4),
      sunlight: w('sunlight', 5), raw: w('raw', 5), ozone: w('ozone', 5),
      sweep: [s(6) - 0.35, s(6) + 0.4], cutC: s(6),
      oceans: w('oceans', 6), pressing: w('pressing', 6), boil: w('boil', 6),
      crash: w('crashes', 7), num: w('5,000', 7), tons: w('tons', 7), once: w('once', 7),
      white2: [s(8) - 0.35, s(8) + 0.3], cutD: s(8),
      clap: w('thunderclap', 8), planet: w('planet', 8),
      all: w('all', 9), five: w('5', 9), secs: w('seconds', 9),
      D: T.D,
    };
    // timer steps: [time, value]
    TL.steps = [[s(1), 5], [s(3), 4], [s(4), 3], [s(5), 2], [s(6), 1], [TL.crash, 0]];
  }
  const timerVal = (t) => { let v = 5; for (const [tt, vv] of TL.steps) if (t >= tt) v = vv; return v; };

  // ---------- shared bits ----------
  // daytime blue sky laid over the night sky with alpha a
  function blueSky(x, W, H_, a) {
    if (a <= 0) return;
    x.save(); x.globalAlpha = a;
    const g = x.createLinearGradient(0, 0, 0, H_);
    g.addColorStop(0, '#2f7fe0'); g.addColorStop(0.55, '#6cc4ff'); g.addColorStop(1, '#bfeaff');
    x.fillStyle = g; x.fillRect(0, 0, W, H_);
    // flat clouds
    for (const [cx, cy, s] of [[150, 360, 1], [560, 470, 0.8], [330, 590, 0.6]]) {
      x.fillStyle = 'rgba(255,255,255,0.85)';
      for (const [dx, dy, r] of [[-50, 8, 34], [-10, -12, 46], [38, 2, 36], [70, 14, 24]]) { x.beginPath(); x.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); x.fill(); }
      rr(x, cx - 84 * s, cy + 8 * s, 178 * s, 34 * s, 17 * s); x.fill();
    }
    x.restore();
  }
  // the 5-second countdown, top-left
  function timer(x, t, a = 1) {
    if (t < TL.intro - 0.3 || a <= 0) return;
    const v = timerVal(t), cx = 96, cy = 118, r = 58;
    const sIn = back(seg(t, TL.intro - 0.3, TL.intro + 0.1), 1.6);
    // last step time
    let lt = TL.intro; for (const [tt] of TL.steps) if (t >= tt) lt = tt;
    const pop = 1 + 0.25 * Math.sin(seg(t, lt, lt + 0.3) * Math.PI);
    x.save(); x.globalAlpha *= a; x.translate(cx, cy); x.scale(sIn * pop, sIn * pop);
    glow(x, 0, 0, r * 1.8, v <= 1 ? C.red : C.cyan, 0.35);
    x.fillStyle = 'rgba(10,8,46,0.78)'; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    const prev = Math.min(5, v + 1), fr = lerp(prev, v, eio(seg(t, lt, lt + 0.4))) / 5;
    x.strokeStyle = v <= 1 ? C.red : C.yellow; x.lineWidth = 10; x.lineCap = 'round';
    x.beginPath(); x.arc(0, 0, r - 9, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.001, fr)); x.stroke();
    text(x, String(v), 0, 2, 62, v <= 1 ? '#ffd0d8' : '#ffffff');
    x.restore();
  }
  // flat airliner pointing left
  function plane(x, cx, cy, s, rot) {
    x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s);
    x.fillStyle = '#9fb7e8'; x.beginPath(); x.moveTo(10, 4); x.lineTo(70, 46); x.lineTo(96, 46); x.lineTo(50, 4); x.fill(); // far wing
    const g = x.createLinearGradient(0, -22, 0, 22); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b8c8ee');
    x.fillStyle = g; rr(x, -110, -20, 220, 40, 20); x.fill();
    x.beginPath(); x.moveTo(70, -14); x.lineTo(118, -62); x.lineTo(134, -62); x.lineTo(112, -10); x.fill(); // tail
    x.fillStyle = '#ff5d8f'; x.beginPath(); x.moveTo(104, -42); x.lineTo(118, -62); x.lineTo(134, -62); x.lineTo(120, -40); x.fill();
    x.fillStyle = '#dfe8ff'; x.beginPath(); x.moveTo(0, 6); x.lineTo(56, 50); x.lineTo(84, 50); x.lineTo(40, 6); x.fill(); // near wing
    x.fillStyle = '#2a3a8a'; for (let i = 0; i < 7; i++) { rr(x, -78 + i * 22, -8, 12, 10, 4); x.fill(); }
    x.fillStyle = '#1c2a6a'; rr(x, -104, -10, 18, 10, 4); x.fill();
    x.restore();
  }
  function ground(x, W, H_, G, dark) {
    // city silhouette + ground
    for (const b of city(W)) {
      const h = b.h * 0.7, top = G - h;
      x.fillStyle = H.rgba(H.mix(b.c, '#7d8fd8', 0.35 * (1 - dark))); rr(x, b.x, top, b.w, h + 40, 8); x.fill();
      const q = H.rng(b.win);
      for (let wy = top + 16; wy < G - 16; wy += 28) for (let wx = b.x + 10; wx < b.x + b.w - 16; wx += 20) {
        if (!q.chance(0.5)) continue;
        x.fillStyle = H.rgba('#ffd65a', 0.25 + 0.65 * dark); rr(x, wx, wy, 9, 12, 3); x.fill();
      }
    }
    const g = x.createLinearGradient(0, G, 0, H_);
    g.addColorStop(0, H.rgba(H.mix('#3fcf8a', '#1f6a6a', dark))); g.addColorStop(1, H.rgba(H.mix('#1d8a6a', '#0e2a4a', dark)));
    x.fillStyle = g; x.beginPath(); x.moveTo(0, G + 10);
    for (let i = 0; i <= 24; i++) { const px = (i / 24) * W; x.lineTo(px, G + 6 + Math.sin(px * 0.012) * 10); }
    x.lineTo(W, H_); x.lineTo(0, H_); x.closePath(); x.fill();
  }

  // ================= SCENE A: ground view =================
  function exA(x, W, H_, t) {
    const z = 1 + 0.25 * (1 - eo(seg(t, TL.intro - 0.4, TL.intro + 0.9))) + 0.04 * seg(t, TL.intro, TL.cutB);
    const shk = shake(t, TL.black, 9, 0.4);
    x.save(); x.translate(W / 2 + shk, H_ / 2 + shk * 0.5); x.scale(z, z); x.translate(-W / 2, -H_ / 2);
    const bk = eio(seg(t, TL.black - 0.05, TL.black + 0.2)), dark = bk;
    sky(x, W, H_, t, { x: t * 6, y: 0, z: 1 + 0.05 * t * 0.1 });
    blueSky(x, W, H_, 1 - bk);
    // the Sun stays: a bright disk in a black sky
    sun(x, 545, 250, 62, t, { k: 0.8 + 0.2 * bk });
    if (bk > 0) pill(x, 545, 360, 'black sky at noon', 30, { s: back(seg(t, TL.noon, TL.noon + 0.3)) * (1 - seg(t, TL.plane[0], TL.plane[0] + 0.3)), bg: '#ffffff', ptr: 'up' });
    const G = 880;
    ground(x, W, H_, G, dark);
    // "you"
    const bx = 220, by = 805, br = 70;
    const surprised = t > TL.black;
    buddy(x, bx, by, br, { t, look: surprised ? [0.5, -0.8] : [0.6, 0], worry: surprised ? 1 : 0, armUp: surprised ? 0.6 + 0.2 * Math.sin(t * 9) : 0 });
    // sound waves from the buddy, they stop dead on "silent"
    const wa = seg(t, TL.wavesIn, TL.wavesIn + 0.3) * (1 - seg(t, TL.silent, TL.silent + 0.25));
    if (wa > 0) {
      x.save(); x.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const u = ((t * 1.2 + i / 4) % 1), R = 60 + u * 190;
        x.strokeStyle = H.rgba(C.cyan, wa * (1 - u)); x.lineWidth = 10;
        x.beginPath(); x.arc(bx + 40, by - 20, R, -0.6, 0.6); x.stroke();
      }
      x.restore();
      const nq = H.rng(5);
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.7 + i / 3) % 1, nx = bx + 90 + u * 220 + nq.range(-10, 10), ny = by - 60 - u * 120;
        x.fillStyle = H.rgba('#ffffff', wa * (1 - u)); x.strokeStyle = x.fillStyle; x.lineWidth = 5;
        x.beginPath(); x.ellipse(nx, ny, 11, 8, -0.4, 0, TAU); x.fill();
        x.beginPath(); x.moveTo(nx + 9, ny - 2); x.lineTo(nx + 9, ny - 38); x.lineTo(nx + 22, ny - 30); x.stroke();
      }
    }
    // mute badge + "no sound"
    const ms = back(seg(t, TL.silent + 0.1, TL.silent + 0.4), 1.6) * (1 - seg(t, TL.plane[0], TL.plane[0] + 0.3));
    if (ms > 0) {
      x.save(); x.translate(470, 640); x.scale(ms, ms);
      glow(x, 0, 0, 150, C.red, 0.3);
      x.fillStyle = '#ffffff'; rr(x, -58, -26, 34, 52, 8); x.fill();
      x.beginPath(); x.moveTo(-28, -26); x.lineTo(16, -62); x.lineTo(16, 62); x.lineTo(-28, 26); x.closePath(); x.fill();
      x.restore();
      badge(x, 540, 690, 34, false, ms);
      pill(x, 470, 760, 'no air = no sound', 30, { s: back(seg(t, TL.noSound, TL.noSound + 0.3)) * (1 - seg(t, TL.plane[0], TL.plane[0] + 0.3)), bg: C.cyan });
    }
    // plane: flies in, loses lift, noses down and drops
    if (t > TL.plane[0]) {
      const fin = eo(seg(t, TL.plane[0], TL.plane[1]));
      const dr = seg(t, TL.drop - 0.3, TL.cutB + 0.3), de = dr * dr;
      const px = lerp(W + 180, 430, fin) - dr * 120, py = 470 + de * 420 + Math.sin(t * 2) * 4, rot = -0.55 * eio(seg(t, TL.lift, TL.drop + 0.4));
      plane(x, px, py, 1, rot);
      if (dr > 0) for (let i = 0; i < 6; i++) { const q = H.rng(60 + i); x.strokeStyle = H.rgba('#ffffff', 0.5 * dr); x.lineWidth = 4; x.beginPath(); const lx = px + q.range(-80, 80), ly = py - 70 - q.range(0, 60); x.moveTo(lx, ly); x.lineTo(lx, ly - 70); x.stroke(); }
      const lp = back(seg(t, TL.lift, TL.lift + 0.3)) * (1 - seg(t, TL.drop + 0.6, TL.drop + 0.9));
      pill(x, 430, 380, 'no air = no lift', 32, { s: lp, bg: C.yellow });
      arrow(x, line([620, 470], [620, 720]), eio(seg(t, TL.drop, TL.drop + 0.4)), C.red, 10, { dots: true });
      if (t > TL.lift) badge(x, 560, 300, 30, false, back(seg(t, TL.lift + 0.1, TL.lift + 0.4)) * (1 - seg(t, TL.drop + 0.6, TL.drop + 0.9)));
    }
    x.restore();
    // the snap: one bright frame on "black"
    flash(x, W, H_, Math.max(0, 1 - Math.abs(t - TL.black) / 0.12));
  }

  // ================= SCENE B: close-up of you =================
  function exB(x, W, H_, t) {
    const zin = eo(seg(t, TL.cutB - 0.1, TL.cutB + 0.8));
    sky(x, W, H_, t, { x: 300 + t * 8, y: 20, z: 1.1 });
    const SX = 130, SY = 190;
    sun(x, SX, SY, 70, t);
    const bx = 380, by = 640, br = lerp(150, 185, zin) + Math.sin(t * 1.3) * 3;
    const popK = shake(t, TL.pop, 12, 0.4);
    // UV rays from the Sun
    const uv = eio(seg(t, TL.raw - 0.1, TL.raw + 0.5));
    if (t > TL.sunlight - 0.2) {
      const bm = seg(t, TL.sunlight - 0.2, TL.sunlight + 0.3);
      x.save(); x.globalAlpha = 0.28 * bm; x.fillStyle = '#fff2a0';
      x.beginPath(); x.moveTo(SX, SY); x.lineTo(bx - br * 0.9, by - br * 0.4); x.lineTo(bx + br * 0.2, by - br * 0.95); x.closePath(); x.fill(); x.restore();
    }
    if (uv > 0) {
      x.save(); x.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const ex = bx - br * 0.55 + i * br * 0.35, ey = by - br * 0.75 + i * 10;
        const dx = ex - SX, dy = ey - SY, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        x.strokeStyle = '#c47bff'; x.lineWidth = 8; x.beginPath();
        const n = Math.floor(40 * uv);
        for (let k = 0; k <= n; k++) { const u = k / 40, px = SX + dx * u - uy * Math.sin(u * 30 - t * 14) * 12, py = SY + dy * u + ux * Math.sin(u * 30 - t * 14) * 12; k ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.stroke();
        if (uv >= 1) glow(x, ex, ey, 40, '#c47bff', 0.6 + 0.2 * Math.sin(t * 10 + i));
      }
      x.restore();
      pill(x, 330, 330, 'raw UV', 34, { s: back(seg(t, TL.raw, TL.raw + 0.3), 1.6), bg: '#c47bff', fg: '#ffffff' });
    }
    // ozone shield: a dashed arc that shatters on "ozone"
    if (t > TL.raw) {
      const oz = seg(t, TL.raw, TL.raw + 0.3), brk = seg(t, TL.ozone, TL.ozone + 0.5);
      const q = H.rng(31);
      x.save(); x.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const a0 = -2.6 + i * 0.16, dd = brk * q.range(30, 120), fa = (1 - brk);
        x.strokeStyle = H.rgba('#7ff0ff', 0.9 * oz * (fa * 0.8 + 0.2)); x.lineWidth = 12;
        x.beginPath(); x.arc(SX + Math.cos(a0 + 0.08) * dd, SY + Math.sin(a0 + 0.08) * dd + brk * 80, 150, a0 + 2.6 + 0.0, a0 + 2.6 + 0.12); x.stroke();
      }
      x.restore();
      if (brk > 0) { badge(x, 300, 250, 30, false, back(seg(t, TL.ozone + 0.1, TL.ozone + 0.4))); pill(x, 470, 250, 'no ozone', 32, { s: back(seg(t, TL.ozone + 0.1, TL.ozone + 0.4)), bg: '#ffffff' }); }
    }
    // air rushing out of the lungs
    if (t > TL.lungs - 0.1) {
      const k = seg(t, TL.lungs - 0.1, TL.lungs + 0.2) * (1 - seg(t, TL.pop + 1.2, TL.pop + 1.8));
      const q = H.rng(12);
      for (let i = 0; i < 16; i++) {
        const ph = q(), sp = q.range(0.8, 1.4), u = ((t - TL.lungs) * sp * 0.9 + ph) % 1, a = q.range(-0.7, 0.7);
        const r0 = br * 0.25, r1 = br * 1.9;
        const px = bx + Math.sin(a) * lerp(r0, r1, u) * 0.9, py = by + br * 0.15 + Math.cos(a) * lerp(r0, r1, u) * 0.5 + u * 40;
        x.fillStyle = H.rgba('#bff6ff', k * (1 - u) * 0.85); x.beginPath(); x.arc(px, py, q.range(7, 16) * (1 - u * 0.5), 0, TAU); x.fill();
      }
      pill(x, bx, by + br + 70, 'air rushes out', 32, { s: back(seg(t, TL.rushes, TL.rushes + 0.3)) * (1 - seg(t, TL.sunlight - 0.3, TL.sunlight)), bg: C.cyan });
    }
    x.save(); x.translate(popK, popK * 0.4);
    buddy(x, bx, by, br, { t, look: t > TL.sunlight ? [-0.7, -0.6] : [0, 0.2], worry: 1, col: C.teal });
    // ear pops
    for (const sd of [-1, 1]) {
      const ex = bx + sd * br * 1.02, ey = by - br * 0.12;
      if (t > TL.pop - 0.05) {
        burst(x, ex, ey, (t - TL.pop) * 1.3, 70 + sd, 90);
        const ps = back(seg(t, TL.pop, TL.pop + 0.25), 1.8) * (1 - seg(t, TL.sunlight - 0.3, TL.sunlight));
        x.save(); x.translate(ex + sd * 20, ey - 95); x.rotate(sd * 0.2); x.scale(ps, ps); text(x, 'POP!', 0, 0, 58, C.yellow); x.restore();
      }
    }
    x.restore();
  }

  // ================= SCENE C: the ocean boils, then the air crashes back =================
  function exC(x, W, H_, t) {
    const hitK = Math.max(0, 1 - Math.abs(t - TL.boil - 0.15) / 0.8) * (t > TL.boil ? 1 : 0);
    const shk = shake(t, TL.boil, 12, 0.5) + shake(t, TL.crash + 0.25, 14, 0.6);
    x.save(); x.translate(shk, shk * 0.4);
    const z = 1.15 - 0.15 * eo(seg(t, TL.cutC - 0.2, TL.cutC + 1.2));
    x.translate(W / 2, H_ / 2); x.scale(z, z); x.translate(-W / 2, -H_ / 2);
    sky(x, W, H_, t, { x: 600 + t * 10, y: 40 });
    // air comes back: a blue wall slams down from the top
    const cr = seg(t, TL.crash, TL.crash + 0.35), crE = cr * cr;
    const wallY = lerp(-60, H_ + 200, crE);
    if (cr > 0) {
      x.save(); x.beginPath(); x.rect(0, 0, W, wallY); x.clip(); blueSky(x, W, H_, 1); x.restore();
      x.fillStyle = 'rgba(255,255,255,0.8)'; rr(x, -20, wallY - 14, W + 40, 28, 14); x.fill();
      glow(x, W / 2, wallY, 500, '#ffffff', 0.4 * (1 - cr));
    }
    sun(x, 610, 150, 48, t, { k: 1 });
    const boilK = seg(t, TL.pressing, TL.boil) * 0.4 + 0.6 * seg(t, TL.boil - 0.05, TL.boil + 0.3), calm = seg(t, TL.crash + 0.2, TL.crash + 0.9);
    const bk = boilK * (1 - calm);
    // shore rocks
    x.fillStyle = '#2d2478'; x.beginPath(); x.moveTo(0, 720); x.quadraticCurveTo(90, 640, 170, 700); x.lineTo(200, 760); x.lineTo(0, 780); x.fill();
    const level = 760 - bk * 25, amp = 10 + bk * 22 + hitK * 10;
    // steam above the water
    if (bk > 0) {
      const q = H.rng(44);
      for (let i = 0; i < 18; i++) {
        const sx = q.range(20, 700), sp = q.range(0.5, 0.9), u = ((t * sp + q()) % 1), r = q.range(26, 50) * (0.6 + u);
        x.fillStyle = H.rgba('#e8f6ff', bk * 0.28 * Math.sin(u * Math.PI)); x.beginPath(); x.arc(sx + Math.sin(t + i) * 14, level - 20 - u * 300, r, 0, TAU); x.fill();
      }
    }
    water(x, W, H_, level, amp, t);
    x.fillStyle = H.rgba('#0a082e', 0.4 * (1 - cr)); x.fillRect(0, level - amp - 10, W, H_);
    // bubbles inside the water
    if (bk > 0) {
      const q = H.rng(19);
      for (let i = 0; i < 46; i++) {
        const bx = q.range(10, 710), sp = q.range(0.6, 1.4), u = (t * sp + q()) % 1, by = lerp(1260, level + 10, u);
        x.strokeStyle = H.rgba('#ffffff', bk * 0.8); x.lineWidth = 3; x.fillStyle = H.rgba('#bff6ff', bk * 0.35);
        x.beginPath(); x.arc(bx + Math.sin(u * 9 + i) * 8, by, q.range(5, 14), 0, TAU); x.fill(); x.stroke();
      }
    }
    // "0 air pressure" pill
    const pp = back(seg(t, TL.pressing, TL.pressing + 0.3)) * (1 - seg(t, TL.boil - 0.3, TL.boil)) * (COLD ? 0 : 1);
    pill(x, W / 2, 420, 'air pressure: 0', 36, { s: pp, bg: '#ffffff' });
    // KEY HIT: BOILING!
    if (t > TL.boil - 0.05) {
      const out = seg(t, TL.crash - 0.25, TL.crash);
      flare(x, W / 2, 380, hitK * 0.8, t);
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.boil, TL.boil + 0.35) * Math.PI);
      const s = back(seg(t, TL.boil - 0.05, TL.boil + 0.25), 1.6) * pop * (1 - out);
      x.save(); x.translate(W / 2, 370); x.scale(s, s); text(x, 'BOILING!', 0, 0, 124, C.yellow); x.restore();
      const ws = back(seg(t, TL.boil + 0.3, TL.boil + 0.6)) * (1 - out);
      x.save(); x.translate(W / 2, 470); x.scale(ws, ws); text(x, 'at ocean temperature', 0, 0, 40, '#ffffff'); x.restore();
      if (out < 1) burst(x, W / 2, 370, (t - TL.boil) * 1.0, 97, 320);
    }
    // the air's weight
    if (t > TL.num - 0.1) {
      const s = back(seg(t, TL.num - 0.1, TL.num + 0.2), 1.6) * (1 + 0.2 * Math.sin(seg(t, TL.num, TL.num + 0.35) * Math.PI));
      x.save(); x.translate(W / 2, 320); x.scale(s, s); text(x, '5,000', 0, 0, 120, C.yellow); x.restore();
      const ts = back(seg(t, TL.tons, TL.tons + 0.3));
      x.save(); x.translate(W / 2, 415); x.scale(ts, ts); text(x, 'trillion tons of air', 0, 0, 46, '#ffffff'); x.restore();
      // down arrows
      for (const ax of [140, 580]) arrow(x, line([ax, 220], [ax, 600]), eio(seg(t, TL.once, TL.once + 0.4)), '#ffffff', 10, { dots: true });
    }
    x.restore();
    speedLines(x, W, H_, 0.7 * seg(t, TL.crash, TL.crash + 0.15) * (1 - seg(t, TL.crash + 0.3, TL.crash + 0.7)), t);
    flash(x, W, H_, Math.max(0, 1 - Math.abs(t - (TL.boil + 0.05)) / 0.25));
    flash(x, W, H_, Math.max(0, 1 - Math.abs(t - (TL.crash + 0.3)) / 0.2), '#ffffff');
  }

  // ================= SCENE D: Earth from space, the thunderclap, 5 seconds =================
  function exD(x, W, H_, t) {
    const zo = eo(seg(t, TL.cutD - 0.1, TL.cutD + 1.0));
    const shk = shake(t, TL.clap, 12, 0.5);
    x.save(); x.translate(shk, shk * 0.4);
    sky(x, W, H_, t, { x: 900 + t * 12, y: 80, z: lerp(1.6, 1, zo) });
    const EX = W / 2, EY = 640, ER = lerp(330, 190, zo);
    earth(x, EX, EY, ER, { spin: t * 0.3, t });
    // thunderclap shock rings
    if (t > TL.clap - 0.05) {
      for (let i = 0; i < 3; i++) {
        const u = seg(t, TL.clap + i * 0.25, TL.clap + i * 0.25 + 1.4);
        if (u <= 0 || u >= 1) continue;
        x.strokeStyle = H.rgba('#ffffff', 0.9 * (1 - u)); x.lineWidth = 16 * (1 - u) + 3;
        x.beginPath(); x.arc(EX, EY, ER * (1.02 + u * 0.9), 0, TAU); x.stroke();
      }
      glow(x, EX, EY, ER * 1.6, '#bfeaff', 0.5 * Math.max(0, 1 - (t - TL.clap) / 0.8));
      const bs = back(seg(t, TL.clap, TL.clap + 0.3), 1.8) * (1 - seg(t, TL.all - 0.3, TL.all));
      x.save(); x.translate(W / 2, 230); x.scale(bs, bs); text(x, 'BOOM!', 0, 0, 110, C.yellow); x.restore();
      burst(x, W / 2, 230, (t - TL.clap) * 1.1, 33, 260);
    }
    const ap = back(seg(t, TL.planet, TL.planet + 0.3)) * (1 - seg(t, TL.all - 0.3, TL.all));
    pill(x, W / 2, 330, 'heard all around the planet', 30, { s: ap, bg: C.cyan });
    // takeaway
    const l1 = back(seg(t, TL.all, TL.all + 0.35)), l2 = back(seg(t, TL.five, TL.five + 0.35), 1.6);
    if (l1 > 0) { x.save(); x.translate(W / 2, 170); x.scale(l1, l1); text(x, 'All of that in…', 0, 0, 56, '#ffffff'); x.restore(); }
    if (l2 > 0) {
      x.save(); x.translate(W / 2, 285); x.scale(l2, l2); text(x, '5 SECONDS', 0, 0, 110, C.yellow); x.restore();
      if (t > TL.secs + 0.3) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 640), q.range(110, 380), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.secs + 0.3, TL.secs + 0.7)); }
    }
    x.restore();
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = seg(t, TL.sweep[0], TL.sweep[1]), swMid = FLAT.sweepMid(eio(sw), W);
    if (t < TL.cutB) exA(x, W, H_, t);
    else if (t < TL.sweep[0] || (t < TL.sweep[1] && !swMid)) exB(x, W, H_, t);
    else if (t < TL.cutD) exC(x, W, H_, t);
    else exD(x, W, H_, t);
    if (sw > 0 && sw < 1) sweep(x, W, H_, eio(sw), PL.teal);
    whiteout(x, W, H_, seg(t, TL.white1[0], TL.cutB) * (1 - seg(t, TL.cutB, TL.white1[1])));
    whiteout(x, W, H_, seg(t, TL.white2[0], TL.cutD) * (1 - seg(t, TL.cutD, TL.white2[1])));
    timer(x, t, 1 - seg(t, TL.cutD - 0.3, TL.cutD));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // countdown ticks
    TL.steps.forEach(([tt, v], i) => { if (i < 5) { k.play('tick', tt, { f: 1500 - i * 80, gain: 0.5, pan: pan(96) }); pluck(tt + 0.02, ['C5', 'B4', 'A4', 'G4', 'E4'][i], 0.5, pan(96), true); } });
    // 1 the sky snaps black
    k.play('impact', TL.black, { gain: 0.55 });
    k.tone(TL.black, { f: [[0, 220], [0.5, 90]], type: 'triangle', dur: 0.6, gain: 0.1, a: 0.01 });
    pluck(backPeak(TL.noon, TL.noon + 0.3), 'E4', 0.7, pan(545), true);
    // 2 silence: a soft hum that cuts out
    k.tone(TL.wavesIn, { f: 'A4', type: 'triangle', dur: TL.silent - TL.wavesIn + 0.05, gain: 0.05, a: 0.1, hold: TL.silent - TL.wavesIn - 0.2 });
    k.play('stamp', TL.silent + 0.25, { gain: 0.5 });
    pluck(backPeak(TL.noSound, TL.noSound + 0.3), 'D4', 0.7, pan(470), true);
    // 3 the plane
    air(TL.plane[0], TL.plane[1] - TL.plane[0] + 0.3, 1100, 0.7, pan(500), 0.5, true);
    pluck(backPeak(TL.lift, TL.lift + 0.3), 'G4', 0.8, pan(430), true);
    k.tone(TL.drop, { f: [[0, 700], [0.9, 180]], type: 'triangle', dur: 1.0, gain: 0.09, a: 0.02, pan: pan(600) });
    tocksAlong(TL.drop, TL.drop + 0.4, 4, 700, -80, 0.3, pan(620));
    // whiteout into the close-up
    air(TL.white1[0], TL.white1[1] - TL.white1[0] + 0.1, 2200, 1.1, 0, 0.55);
    // 4 lungs + ears
    k.noise(TL.lungs, { dur: 0.9, color: 'pink', filter: 'highpass', f: [[0, 1200], [0.9, 3000]], gain: 0.12, a: 0.05, verb: 0.2 });
    pluck(backPeak(TL.rushes, TL.rushes + 0.3), 'E4', 0.7, 0, true);
    boop(TL.pop, 520, 1.1, -0.4); boop(TL.pop + 0.06, 600, 1.1, 0.4);
    k.play('thud', TL.pop, { f: 120, gain: 0.4 });
    // 5 sun + UV + ozone
    shimmer(TL.sunlight, ['E5', 'B5', 'E6'], 0.5, -0.3);
    k.tone(TL.raw, { f: [[0, 900], [0.6, 1300]], type: 'sine', dur: 0.7, gain: 0.04, a: 0.05 });
    pluck(backPeak(TL.raw, TL.raw + 0.3, 1.6), 'A4', 0.8, pan(330), true);
    for (let i = 0; i < 6; i++) k.play('tick', TL.ozone + i * 0.05, { f: 2600 + i * 300, gain: 0.35, pan: pan(150), minor: true });
    pluck(backPeak(TL.ozone + 0.1, TL.ozone + 0.4), 'D4', 0.7, pan(470), true);
    // planet sweep into the ocean
    whoosh(TL.sweep[0], 0.8, 0.9);
    // 6 the ocean: rumble that builds, then a gap, then THE hit
    k.noise(TL.cutC, { dur: TL.boil - TL.cutC - 0.3, color: 'brown', filter: 'lowpass', f: [[0, 300], [1.5, 700]], gain: 0.15, a: 0.6, bus: 'amb' });
    pluck(backPeak(TL.pressing, TL.pressing + 0.3), 'E4', 0.7, 0, true);
    hit(TL.boil);
    { const r = H.rng(88); for (let tt = TL.boil + 0.2; tt < TL.crash - 0.2; tt += 0.07 + r() * 0.08) k.play('tick', tt, { f: 500 + r() * 700, gain: 0.22, pan: (r() - 0.5) * 0.8, minor: true }); }
    k.noise(TL.boil + 0.1, { dur: TL.crash - TL.boil, color: 'pink', filter: 'bandpass', f: 1800, q: 0.5, gain: 0.06, a: 0.3, bus: 'amb' });
    // 7 the air crashes back
    k.play('riser', TL.crash - 0.5, { dur: 0.5, gain: 0.6 });
    whoosh(TL.crash, 0.6, 1.1);
    k.play('impact', TL.crash + 0.3, { gain: 0.75 });
    pluck(backPeak(TL.num - 0.1, TL.num + 0.2, 1.6), 'A3', 1.0, 0); pluck(backPeak(TL.num - 0.1, TL.num + 0.2, 1.6) + 0.08, 'E4', 0.8, 0);
    pluck(backPeak(TL.tons, TL.tons + 0.3), 'C5', 0.6, 0, true);
    tocksAlong(TL.once, TL.once + 0.4, 4, 600, -60, 0.3, 0);
    // whiteout to space
    air(TL.white2[0], TL.white2[1] - TL.white2[0] + 0.1, 2000, 1.0, 0, 0.55);
    // 8 thunderclap
    k.play('impact', TL.clap, { gain: 0.7 });
    k.noise(TL.clap, { dur: 1.6, color: 'brown', filter: 'lowpass', f: [[0, 600], [1.6, 120]], gain: 0.35, a: 0.01, verb: 0.4 });
    pluck(backPeak(TL.planet, TL.planet + 0.3), 'G4', 0.6, 0, true);
    // 9 takeaway
    pluck(backPeak(TL.all, TL.all + 0.35), 'E4', 0.85, 0);
    const l2 = backPeak(TL.five, TL.five + 0.35, 1.6);
    chord(l2, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.1, 2.4); pluck(l2, 'C4', 1.0, 0);
    k.play('sparkle', TL.secs + 0.3, { gain: 0.8, n: 6 });
  }

  SCENE({
    init,
    // cold open: the hook plays over the oceans starting to boil, in slow motion, then rewinds to the start
    cold: () => TL.boil - 0.2,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
