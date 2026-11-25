// Astrivo Short 2026-11-25-3: "What If Earth Was Hollow?"
// Scenes: A cut-away Earth (thin crust, scoop out the inside, 99% of the mass gone) | sweep |
//         B on the surface (scale counts down to a soda can, 80 m jump) | whiteout |
//         C inside the hollow shell (float, gravity cancels = key hit) -> zoom out: air leaks away,
//           no magnetic shield, then the core pops back in: it's why you can breathe.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, rr, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, earth, sun, streaks, buddy, badge, sweep, whiteout, shake } = FLAT;
  let TL = null, COLD = false;

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      intro: s(1), cut: [s(1) - 0.4, s(1) + 0.5], crust: w('crust', 1), km: w('5', 1),
      scoop: [w('scoop', 2), w('center', 2) + 0.3], center: w('center', 2),
      ring: [s(3) - 0.1, w('99%', 3)], deleted: w('deleted', 3), n99: w('99%', 3), mass: w('mass', 3),
      sweep: [s(4) - 0.25, s(4) + 0.5], grav: w('gravity', 4), n70: w('70', 4), less: w('less', 4), soda: w('soda', 4),
      jump: w('jump', 5), soar: [w('soar', 5), T.e(5) - 0.1], n80: w('80', 5),
      white: [s(6) - 0.4, s(6) + 0.35], cut3: s(6), crack: w('crack', 6), float: w('float', 6),
      shell: w('shell', 6), cancels: w('cancels', 6),
      zoom: [s(7) - 0.1, s(7) + 1.0], air: w('air', 7), leak: w('leak', 7), space: w('space', 7),
      sun: [s(8) - 0.2, s(8) + 0.4], hot: w('hot', 8), shield: w('shield', 8),
      fill: [s(9) - 0.1, w('burning', 9) + 0.2], heavy: w('heavy', 9), burning: w('burning', 9), feet: w('feet', 9),
      breathe: w('breathe', 9), why: w("it's", 9),
      D: T.D,
    };
  }

  // ---------- cut-away Earth: a pie wedge shows the layers; k = how full the inside is (0 = hollow) ----------
  const LAYERS = [ // [outer radius fraction, colours]
    [0.955, ['#ffb070', '#ff7a3c', '#b8361f']],   // mantle
    [0.55, ['#ffe08a', '#ffb23f', '#e0602a']],    // outer core
    [0.2, ['#fffbe0', '#fff0a0', '#ffc23f']],     // inner core
  ];
  function wedge(x, cx, cy, r, a0, span) {
    x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r, a0, a0 + span); x.closePath();
  }
  function cutEarth(x, cx, cy, r, t, o) {
    const k = o.k, span = o.span, a0 = -Math.PI / 2 - span * TAU / 2 + 0.6 * (1 - span) ;
    if (span < 0.999) earth(x, cx, cy, r, { spin: t * 0.25, t, atmo: o.atmo });
    else { glow(x, cx, cy, r * 1.5, '#4fc9ff', 0.25); }
    if (span <= 0) return;
    x.save(); wedge(x, cx, cy, r * 1.002, a0, span * TAU); x.clip();
    // void
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, '#05041a'); g.addColorStop(0.8, '#120d3a'); g.addColorStop(1, '#2a1a5a');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    // crust: a thin brown band (drawn thicker than real so you can see it)
    x.fillStyle = '#8a5a3c'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.arc(cx, cy, r * 0.955, 0, TAU, true); x.fill();
    x.fillStyle = '#3fcf8a'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.arc(cx, cy, r * 0.985, 0, TAU, true); x.fill();
    // layers, shrinking into the centre as k -> 0
    if (k > 0) for (const [f, col] of LAYERS) {
      const rr2 = r * f * k; if (rr2 < 1) continue;
      const lg = x.createRadialGradient(cx - rr2 * 0.3, cy - rr2 * 0.3, 0, cx, cy, rr2);
      lg.addColorStop(0, col[0]); lg.addColorStop(0.6, col[1]); lg.addColorStop(1, col[2]);
      x.fillStyle = lg; x.beginPath(); x.arc(cx, cy, rr2, 0, TAU); x.fill();
    }
    if (k > 0.05 && o.coreGlow) glow(x, cx, cy, r * 0.5 * k, '#fff3b0', o.coreGlow);
    // inner shadow of the hollow
    if (k < 1) { x.strokeStyle = H.rgba('#000010', 0.35 * (1 - k)); x.lineWidth = r * 0.06; x.beginPath(); x.arc(cx, cy, r * 0.925, 0, TAU); x.stroke(); }
    x.restore();
    // cut edges (light lines)
    if (span < 0.999) {
      x.save(); x.strokeStyle = 'rgba(255,240,220,0.55)'; x.lineWidth = 3; x.beginPath();
      x.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); x.lineTo(cx, cy); x.lineTo(cx + Math.cos(a0 + span * TAU) * r, cy + Math.sin(a0 + span * TAU) * r); x.stroke(); x.restore();
    }
  }

  // ================= SCENE A: the cut-away Earth =================
  function exA(x, W, H_, t) {
    const ein = eo(seg(t, TL.cut[0], TL.cut[1]));
    sky(x, W, H_, t, { z: 1 + 0.6 * (1 - ein) + 0.04 * seg(t, TL.intro, TL.sweep[0]), x: t * 10, y: 0 });
    const r = 250 * (0.85 + 0.15 * ein), cx = W / 2, cy = 560;
    const span = lerp(0.25 * eo(seg(t, TL.cut[0] + 0.2, TL.cut[1] + 0.2)), 1, eio(seg(t, TL.ring[0], TL.ring[1])));
    const k = 1 - eio(seg(t, TL.scoop[0], TL.scoop[1]));
    const sh = shake(t, TL.n99, 10);
    x.save(); x.translate(sh, sh * 0.4);
    planet(x, 620 - t * 3, 170, 24, PL.coral, { glowA: 0.2 });
    cutEarth(x, cx, cy, r, t, { k, span, coreGlow: 0.5 });
    // scooped stuff flying out of the wedge
    if (t > TL.scoop[0] && t < TL.scoop[1] + 0.8) {
      const q = H.rng(77);
      for (let i = 0; i < 18; i++) {
        const st = TL.scoop[0] + q.range(0, TL.scoop[1] - TL.scoop[0]), u = seg(t, st, st + 0.8);
        if (u <= 0 || u >= 1) continue;
        const a = -Math.PI / 2 + 0.6 + q.range(-0.6, 0.6), d = lerp(r * 0.4, r * 1.9, eo(u));
        x.save(); x.globalAlpha = 1 - u;
        x.fillStyle = q.pick(['#ff8d3f', '#ffd23f', '#ffb070']); x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, q.range(6, 14) * (1 - u * 0.5), 0, TAU); x.fill();
        x.restore();
      }
    }
    // crust label + thickness
    const cp = back(seg(t, TL.crust, TL.crust + 0.3)) * (1 - seg(t, TL.scoop[0] - 0.2, TL.scoop[0]));
    if (cp > 0) {
      const ax = cx + Math.cos(-Math.PI / 2 + 0.6) * r, ay = cy + Math.sin(-Math.PI / 2 + 0.6) * r;
      arrow(x, [[ax + 150, ay - 120], [ax + 120, ay - 90], [ax + 60, ay - 40], [ax + 12, ay - 8]], eio(seg(t, TL.crust + 0.1, TL.crust + 0.45)), C.yellow, 6, { dots: true });
      pill(x, ax + 150, ay - 150, 'crust', 34, { s: cp, bg: '#ffffff' });
    }
    const kp = back(seg(t, TL.km, TL.km + 0.3), 1.6) * (1 - seg(t, TL.scoop[0] - 0.2, TL.scoop[0]));
    if (kp > 0) { x.save(); x.translate(W / 2, 180); x.scale(kp, kp); text(x, '5–70 km', 0, 0, 76, C.yellow); text(x, 'thin as an apple skin', 0, 64, 32, '#bfe9ff'); x.restore(); }
    // scoop arrow to the center
    const sa = eio(seg(t, TL.center - 0.3, TL.center + 0.1)) * (1 - seg(t, TL.ring[0], TL.ring[0] + 0.3));
    arrow(x, line([cx + 220, cy - 300], [cx + 10, cy - 10]), sa, '#7ff0ff', 9, { dots: true });
    pill(x, cx + 220, cy - 330, 'center', 32, { s: back(seg(t, TL.center, TL.center + 0.3)) * (1 - seg(t, TL.ring[0], TL.ring[0] + 0.3)), bg: C.cyan });
    // 99% gone
    if (t > TL.n99 - 0.1) {
      const hk = Math.max(0, 1 - Math.abs(t - TL.n99 - 0.15) / 0.7);
      flare(x, W / 2, 560, hk * 0.6, t);
      const s = back(seg(t, TL.n99 - 0.05, TL.n99 + 0.25), 1.6) * (1 + 0.2 * Math.sin(seg(t, TL.n99, TL.n99 + 0.35) * Math.PI));
      x.save(); x.translate(W / 2, 545); x.scale(s, s); text(x, '−99%', 0, 0, 120, C.yellow); x.restore();
      const ms = back(seg(t, TL.mass, TL.mass + 0.3));
      x.save(); x.translate(W / 2, 640); x.scale(ms, ms); text(x, "of Earth's mass", 0, 0, 44, '#ffffff'); x.restore();
      burst(x, W / 2, 545, (t - TL.n99) * 1.0, 31, 260);
    }
    x.restore();
  }

  // ================= SCENE B: on the surface of the hollow Earth =================
  function sodaCan(x, cx, cy, s) {
    if (s <= 0) return;
    x.save(); x.translate(cx, cy); x.scale(s * 1.4, s * 1.4);
    glow(x, 0, 0, 90, '#ff5d8f', 0.3);
    const g = x.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, '#ff9aa8'); g.addColorStop(0.45, '#ff3b5c'); g.addColorStop(1, '#9c1638');
    x.fillStyle = g; rr(x, -30, -50, 60, 100, 12); x.fill();
    x.fillStyle = '#e8e6ff'; rr(x, -26, -58, 52, 12, 6); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.moveTo(-30, 8); x.quadraticCurveTo(0, -18, 30, 0); x.lineTo(30, 12); x.quadraticCurveTo(0, -6, -30, 20); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; rr(x, -22, -40, 8, 70, 4); x.fill();
    x.restore();
  }
  function exB(x, W, H_, t) {
    const up = eio(seg(t, TL.soar[0], TL.soar[1]));
    sky(x, W, H_, t, { x: 300 + t * 8, y: 40 - up * 120 });
    glow(x, W / 2, 900, 600, '#6a4cff', 0.3);
    const gy = 830 + up * 260;                                // ground drops as the camera follows the jump
    glow(x, W / 2, gy, 700, '#4fc9ff', 0.25);
    ball(x, W / 2, gy + 1500, 1500, ['#7ff0b0', '#2f9f6e', '#163e52'], { sha: 0.35, la: -1.9 });
    { const q = H.rng(33); for (let i = 0; i < 9; i++) { const hx = q.range(-40, 760), hy = gy + q.range(40, 420); x.fillStyle = 'rgba(20,70,80,0.35)'; x.beginPath(); x.ellipse(hx, hy, q.range(60, 140), q.range(14, 30), 0, 0, TAU); x.fill(); } }
    // scale (platform) + buddy
    const by0 = gy - 30 - 62;
    const crouch = Math.sin(seg(t, TL.jump - 0.1, TL.soar[0]) * Math.PI) * 0.3;
    const by = lerp(by0, 300, up) + crouch * 30;
    x.fillStyle = '#e8e6ff'; rr(x, W / 2 - 230 - 80, gy - 30, 160, 30, 10); x.fill();
    x.fillStyle = '#141846'; rr(x, W / 2 - 230 - 44, gy - 24, 88, 18, 6); x.fill();
    const bx = W / 2 - 230;
    const bin = back(seg(t, TL.sweep[1] - 0.3, TL.sweep[1] + 0.2), 1.3);
    buddy(x, bx, by, 62 * bin, { t, look: up > 0 ? [0, 1] : [0.6, -0.2], worry: t > TL.less && t < TL.jump ? 1 : 0, happy: up > 0.3 ? 1 : 0, armUp: up > 0 ? 1 : 0 });
    // weight counter
    const v = lerp(70, 0.33, eio(seg(t, TL.n70 + 0.2, TL.less + 0.3)));
    const wn = back(seg(t, TL.n70 - 0.2, TL.n70 + 0.15), 1.6) * (1 - seg(t, TL.jump + 0.05, TL.jump + 0.3));
    if (wn > 0) {
      const land = seg(t, TL.less + 0.3, TL.less + 0.6);
      x.save(); x.translate(bx, gy - 230); x.scale(wn * (1 + 0.2 * Math.sin(land * Math.PI)), wn * (1 + 0.2 * Math.sin(land * Math.PI)));
      text(x, (v < 10 ? v.toFixed(2) : Math.round(v)) + ' kg', 0, 0, 64, land > 0 ? C.yellow : '#ffffff'); x.restore();
    }
    // gravity meter at the top
    const gp = back(seg(t, TL.grav, TL.grav + 0.3)) * (1 - seg(t, TL.jump + 0.05, TL.jump + 0.3));
    if (gp > 0) {
      const gv = lerp(100, 0.5, eio(seg(t, TL.grav + 0.1, TL.grav + 0.9)));
      x.save(); x.translate(W / 2, 170); x.scale(gp, gp);
      text(x, 'gravity', 0, -50, 40, '#bfe9ff');
      text(x, (gv < 10 ? gv.toFixed(1) : Math.round(gv)) + '%', 0, 20, 84, gv < 10 ? C.red : '#ffffff');
      x.restore();
    }
    // soda can
    const sp = back(seg(t, TL.soda - 0.1, TL.soda + 0.25), 1.6) * (1 - seg(t, TL.jump + 0.05, TL.jump + 0.3));
    sodaCan(x, W / 2 + 150, gy - 120, sp);
    if (sp > 0) text(x, '=', W / 2 - 40, gy - 130, 80 * sp, '#ffffff');
    // the jump: dotted arrow up + 80 m
    if (t > TL.soar[0] - 0.1) {
      arrow(x, line([bx + 110, gy - 10], [bx + 110, by + 20]), seg(t, TL.soar[0], TL.soar[0] + 0.3) > 0 ? 1 : 0, '#7ff0ff', 9, { dots: true, a: 0.9 });
      bigNumber(x, '80 m', bx + 300, Math.min(520, by + 60), 110, t, TL.n80, { seed: 52, spread: 220 });
      const hp = back(seg(t, TL.n80 + 0.3, TL.n80 + 0.6));
      x.save(); x.translate(bx + 300, Math.min(520, by + 60) + 80); x.scale(hp, hp); text(x, 'high!', 0, 0, 44, '#ffffff'); x.restore();
    }
  }
  const bigNumber = FLAT.bigNumber;

  // ================= SCENE C: inside the shell, then the whole planet =================
  function shellInside(x, W, H_, t, R, cx, cy, a) {
    // rocky crust ring seen from inside, with a crack at the top
    x.save(); x.globalAlpha *= a;
    const gap = 0.16 * seg(t, TL.crack - 0.4, TL.crack);
    const a0 = -Math.PI / 2 + gap, a1 = -Math.PI / 2 - gap + TAU;
    const band = (r0, r1, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r1, a0, a1); x.arc(cx, cy, r0, a1, a0, true); x.closePath(); x.fill(); };
    band(R * 1.0, R * 1.14, '#3fcf8a');
    band(R * 0.99, R * 1.1, '#2f8fe0');
    band(R * 0.9, R * 1.08, '#8a5a3c');
    band(R * 0.9, R * 0.95, '#6a3f2c');
    // rocks on the inner face
    const q = H.rng(19);
    for (let i = 0; i < 26; i++) { const aa = q.range(a0, a1), rr2 = R * q.range(0.92, 1.02); ball(x, cx + Math.cos(aa) * rr2, cy + Math.sin(aa) * rr2, q.range(6, 14), ['#c99b6d', '#8a5a3c', '#4a2a20'], { sha: 0.4 }); }
    if (gap > 0) { const gx = cx, gy = cy - R; glow(x, gx, gy, 90, '#fff2c0', 0.5 * gap / 0.16); }
    x.restore();
  }
  function exC(x, W, H_, t) {
    const zo = eio(seg(t, TL.zoom[0], TL.zoom[1]));
    const cx = W / 2, cy = lerp(560, 600, zo), R = lerp(330, 210, zo);
    sky(x, W, H_, t, { x: 600 + t * 10, y: 0, z: lerp(1.3, 1, zo) });
    const hk = Math.max(0, 1 - Math.abs(t - TL.cancels - 0.15) / 0.7) * (t > TL.cancels - 0.1 ? 1 : 0);
    const sh = shake(t, TL.cancels, 12);
    x.save(); x.translate(sh, sh * 0.5);
    // inside: dark hollow with a faint violet glow
    const ins = 1 - seg(t, TL.zoom[0] + 0.3, TL.zoom[1]);
    if (ins > 0) {
      x.save(); x.globalAlpha = ins;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, '#2a1a6a'); g.addColorStop(0.7, '#120d3a'); g.addColorStop(1, '#0a0826');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 0.92, 0, TAU); x.fill();
      glow(x, cx, cy, R * 0.8, '#8b5cff', 0.25 + 0.4 * hk);
      x.restore();
      shellInside(x, W, H_, t, R, cx, cy, 1);
    }
    // from outside it is a normal-looking Earth (fades in as we zoom out)
    const outA = seg(t, TL.zoom[0] + 0.3, TL.zoom[1]);
    const fillK = eio(seg(t, TL.fill[0], TL.fill[1]));
    const span = 0.25 * eio(seg(t, TL.fill[0] - 0.3, TL.fill[0] + 0.2));
    const airA = 1 - 0.8 * seg(t, TL.leak, TL.space + 0.3) + 0.8 * fillK;
    if (outA > 0) {
      x.save(); x.globalAlpha = outA;
      if (span > 0) cutEarth(x, cx, cy, R, t, { k: fillK, span, atmo: airA, coreGlow: 0.8 * fillK });
      else earth(x, cx, cy, R, { spin: t * 0.25, t, atmo: airA, glowA: 0.3 * airA });
      x.restore();
    }

    // buddy falls in through the crack and floats in the middle
    if (ins > 0) {
      const fall = eio(seg(t, TL.crack, TL.float));
      const byy = lerp(cy - R - 80, cy, fall) + Math.sin(t * 1.6) * 10 * seg(t, TL.float, TL.float + 0.5);
      const bs = 58 * (t > TL.crack - 0.2 ? 1 : 0) * ins;
      buddy(x, cx, byy, bs, { t, rot: Math.sin(t * 0.9) * 0.25, look: [0, 0.4], happy: t > TL.cancels + 0.3 ? 1 : 0, armUp: seg(t, TL.float, TL.float + 0.6) });
      // gravity arrows from every side pulling on you ... then they cancel
      const ap = eio(seg(t, TL.shell - 0.2, TL.shell + 0.4)) * (1 - seg(t, TL.cancels - 0.05, TL.cancels + 0.15));
      if (ap > 0 && !COLD) for (let i = 0; i < 8; i++) {
        const aa = (i / 8) * TAU + 0.2, r0 = 90, r1 = 90 + 120 * ap;
        arrow(x, line([cx + Math.cos(aa) * r0, byy + Math.sin(aa) * r0], [cx + Math.cos(aa) * r1, byy + Math.sin(aa) * r1]), 1, i % 2 ? '#7ff0ff' : C.yellow, 8, { dots: true, a: 0.9 });
      }
      // THE KEY HIT: zero gravity
      if (t > TL.cancels - 0.05 && !COLD) {
        flare(x, cx, cy + 130, hk * 0.8, t);
        bigNumber(x, '0 g', cx, cy + 135, 130, t, TL.cancels, { seed: 88, spread: 320 });
        const zs = back(seg(t, TL.cancels + 0.35, TL.cancels + 0.65));
        x.save(); x.translate(cx, cy + 225); x.scale(zs * ins, zs * ins); text(x, 'you float anywhere', 0, 0, 40, '#ffffff'); x.restore();
      }
    }

    // air leaking away into space
    const lk = seg(t, TL.air - 0.1, TL.space + 0.8) * (1 - fillK);
    if (lk > 0) {
      const q = H.rng(5);
      for (let i = 0; i < 46; i++) {
        const aa = q.range(0, TAU), ph = q(), u = ((t - TL.air) * 0.45 + ph) % 1;
        if (t < TL.air + ph * 0.6) continue;
        const d = R * (1.03 + 1.2 * u);
        x.save(); x.globalAlpha = lk * Math.sin(u * Math.PI) * 0.9;
        x.fillStyle = i % 3 ? '#bff6ff' : '#ffffff'; x.beginPath(); x.arc(cx + Math.cos(aa) * d, cy + Math.sin(aa) * d, 5 + 4 * (1 - u), 0, TAU); x.fill();
        x.restore();
      }
      pill(x, W / 2, cy - R - 90, 'air leaks away', 36, { s: back(seg(t, TL.leak, TL.leak + 0.3)) * (1 - seg(t, TL.sun[0], TL.sun[0] + 0.3)), bg: C.cyan });
    }
    // the Sun blasts the unprotected planet
    const sa = eo(seg(t, TL.sun[0], TL.sun[1])) * (1 - seg(t, TL.fill[0], TL.fill[0] + 0.4));
    if (sa > 0) {
      sun(x, lerp(-120, 80, sa), lerp(60, 170, sa), 90, t);
      streaks(x, [120, 220], [cx - R * 0.6, cy - R * 0.5], t, { n: 30, col: '#ffe28a', a: sa, width: 160, speed: 0.9 });
      const sp = back(seg(t, TL.shield, TL.shield + 0.3));
      if (sp > 0) {
        x.save(); x.globalAlpha = sp; x.strokeStyle = 'rgba(127,240,255,0.6)'; x.lineWidth = 5; x.setLineDash([2, 16]); x.lineCap = 'round';
        x.beginPath(); x.ellipse(cx, cy, R * 1.45, R * 1.25, 0, 0, TAU); x.stroke(); x.setLineDash([]); x.restore();
        badge(x, cx - R * 0.95, cy - R * 0.95, 34, false, sp);
        pill(x, W / 2, cy + R + 70, 'no magnetic shield', 34, { s: sp, bg: C.red, fg: '#ffffff' });
      }
      const hp = back(seg(t, TL.hot, TL.hot + 0.3));
      if (hp > 0) { x.save(); x.setLineDash([10, 12]); x.strokeStyle = H.rgba('#ffb23f', 0.8 * hp); x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, R * 0.55, 0, TAU); x.stroke(); x.setLineDash([]); x.restore(); pill(x, cx, cy, 'no core', 30, { s: hp, bg: '#ffb23f' }); }
    }
    // the core is back: takeaway
    if (t > TL.fill[0]) {
      const cg = back(seg(t, TL.burning, TL.burning + 0.3));
      if (cg > 0) glow(x, cx, cy, R * 0.9, '#ffd23f', 0.35 * cg);
      const bs = back(seg(t, TL.feet, TL.feet + 0.35), 1.4);
      buddy(x, cx + R * 0.05, cy - R - 44 * bs, 44 * bs, { t, happy: t > TL.breathe ? 1 : 0, armUp: seg(t, TL.breathe, TL.breathe + 0.4), look: [0, 0.6] });
      const l1 = back(seg(t, TL.why, TL.why + 0.4)), l2 = back(seg(t, TL.breathe, TL.breathe + 0.4), 1.6);
      x.save(); x.translate(W / 2, 140); x.scale(l1, l1); text(x, 'The core is why', 0, 0, 54, '#ffffff'); x.restore();
      x.save(); x.translate(W / 2, 220); x.scale(l2, l2); text(x, 'you can BREATHE', 0, 0, 62, C.yellow); x.restore();
      if (t > TL.breathe + 0.3) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 660), q.range(90, 300), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.breathe + 0.3, TL.breathe + 0.7)); }
    }
    x.restore();
    const flashA = Math.max(0, 1 - Math.abs(t - (TL.cancels + 0.05)) / 0.25);
    if (flashA > 0 && !COLD) { x.fillStyle = H.rgba('#fff6d0', 0.3 * flashA); x.fillRect(0, 0, W, H_); }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 1000, -1000, sw);
    if (t < TL.sweep[0] || (t < TL.sweep[1] && spx > W / 2)) exA(x, W, H_, t);
    else if (t < TL.cut3) exB(x, W, H_, t);
    else exC(x, W, H_, t);
    sweep(x, W, H_, sw, PL.coral);
    whiteout(x, W, H_, seg(t, TL.white[0], TL.cut3) * (1 - seg(t, TL.cut3, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, whoosh, hit } = S;
    // A: cut-away
    air(TL.cut[0], TL.cut[1] - TL.cut[0] + 0.2, 1200, 0.6, 0, 0.5, true);
    k.play('swish', TL.cut[0] + 0.25, { gain: 0.5 });
    pluck(backPeak(TL.crust, TL.crust + 0.3), 'E4', 0.8, pan(520));
    tocksAlong(TL.crust + 0.1, TL.crust + 0.45, 4, 600, 40, 0.3, pan(500));
    pluck(backPeak(TL.km, TL.km + 0.3, 1.6), 'A3', 1.0, 0); pluck(backPeak(TL.km, TL.km + 0.3, 1.6) + 0.07, 'E4', 0.8, 0);
    // scoop: low suction noise, blobs flying out
    k.noise(TL.scoop[0], { dur: TL.scoop[1] - TL.scoop[0] + 0.3, color: 'brown', filter: 'lowpass', f: [[0, 900], [TL.scoop[1] - TL.scoop[0], 200]], gain: 0.22, a: 0.3, verb: 0.2 });
    { const r = H.rng(78); for (let tt = TL.scoop[0]; tt < TL.scoop[1]; tt += 0.18 + r() * 0.1) boop(tt, 300 + r() * 200, 0.35, (r() - 0.5) * 0.4); }
    tocksAlong(TL.center - 0.3, TL.center + 0.1, 5, 520, 40, 0.3, 0);
    pluck(backPeak(TL.center, TL.center + 0.3), 'G4', 0.6, 0, true);
    k.play('riser', TL.ring[0], { dur: TL.n99 - TL.ring[0], gain: 0.5 });
    k.play('impact', TL.n99, { gain: 0.6 });
    chord(TL.n99, ['C3', 'G3', 'C4', 'Eb4'], 0.9, 1.4);
    pluck(backPeak(TL.mass, TL.mass + 0.3), 'Eb4', 0.7, 0, true);
    // sweep to the surface
    whoosh(TL.sweep[0], 0.8);
    boop(backPeak(TL.sweep[1] - 0.3, TL.sweep[1] + 0.2, 1.3), 380, 0.8, pan(130));
    pluck(backPeak(TL.grav, TL.grav + 0.3), 'E4', 0.8, 0);
    k.tone(TL.grav + 0.1, { f: [[0, 600], [0.8, 140]], type: 'triangle', dur: 0.85, gain: 0.1, a: 0.02 });
    pluck(backPeak(TL.n70 - 0.2, TL.n70 + 0.15, 1.6), 'A3', 0.9, pan(130));
    tocksAlong(TL.n70 + 0.2, TL.less + 0.3, 8, 900, -60, 0.3, pan(130));
    pluck(TL.less + 0.3, 'C5', 0.8, pan(130)); pluck(TL.less + 0.37, 'G4', 0.6, pan(130));
    boop(backPeak(TL.soda - 0.1, TL.soda + 0.25, 1.6), 520, 0.9, pan(510), false);
    // jump
    k.play('swish', TL.jump, { gain: 0.5 });
    air(TL.soar[0], TL.soar[1] - TL.soar[0], 1800, 0.9, pan(130), 0.4);
    pluck(backPeak(TL.n80 - 0.05, TL.n80 + 0.25, 1.6), 'D4', 1.0, 0); pluck(backPeak(TL.n80 - 0.05, TL.n80 + 0.25, 1.6) + 0.07, 'A4', 0.8, 0);
    k.play('sparkle', TL.n80 + 0.1, { gain: 0.6, n: 5 });
    // whiteout inside
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.1, 0, 0.55);
    chord(TL.cut3, ['D3', 'A3', 'F4'], 0.6, 1.4);
    k.play('thud', TL.crack - 0.1, { f: 90, gain: 0.5 });
    { const r = H.rng(66); for (let tt = TL.crack - 0.4; tt < TL.crack; tt += 0.06 + r() * 0.04) k.play('tick', tt, { f: 2400 + r() * 1800, gain: 0.3, minor: true }); }
    air(TL.crack, TL.float - TL.crack + 0.2, 900, 0.7, 0, 0.6, true);
    k.play('sparkle', TL.float + 0.1, { gain: 0.6, n: 4 });
    tocksAlong(TL.shell - 0.2, TL.shell + 0.4, 6, 520, 40, 0.3, 0);
    hit(TL.cancels);
    pluck(backPeak(TL.cancels + 0.35, TL.cancels + 0.65), 'E4', 0.6, 0, true);
    // zoom out, air leaks
    whoosh(TL.zoom[0], 0.9, 0.7);
    k.noise(TL.air, { dur: TL.sun[0] - TL.air, color: 'pink', filter: 'highpass', f: [[0, 1200], [TL.sun[0] - TL.air, 3000]], gain: 0.07, a: 0.4, verb: 0.3 });
    pluck(backPeak(TL.leak, TL.leak + 0.3), 'G4', 0.7, 0);
    // sun + no shield
    k.noise(TL.sun[0], { dur: TL.fill[0] - TL.sun[0], color: 'brown', filter: 'lowpass', f: 300, gain: 0.12, a: 0.4, bus: 'amb' });
    boop(backPeak(TL.hot, TL.hot + 0.3), 300, 0.7, 0);
    k.tone(TL.shield, { f: 'F#3', type: 'triangle', dur: 0.4, gain: 0.18, hold: 0.1, filter: 'lowpass', f2: 900 });
    pluck(backPeak(TL.shield, TL.shield + 0.3), 'C4', 0.8, 0, true);
    // core back + takeaway
    k.play('riser', TL.fill[0], { dur: TL.fill[1] - TL.fill[0], gain: 0.45 });
    chord(TL.burning + 0.1, ['C3', 'G3', 'C4', 'E4'], 0.8, 1.4);
    boop(backPeak(TL.feet, TL.feet + 0.35, 1.4), 400, 0.9, 0, false);
    pluck(backPeak(TL.why, TL.why + 0.4), 'E4', 0.8, 0);
    const l2 = backPeak(TL.breathe, TL.breathe + 0.4, 1.6);
    chord(l2, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.1, 2.4); pluck(l2, 'C4', 1.0, 0);
    k.play('sparkle', l2 + 0.2, { gain: 0.8, n: 6 });
  }

  SCENE({
    init,
    // cold open: the hook plays over you floating inside the empty planet, then rewinds to the start
    cold: () => TL.cancels + 0.4,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
