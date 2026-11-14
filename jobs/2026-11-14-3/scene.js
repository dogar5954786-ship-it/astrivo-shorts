// "What If Earth Was a Cube?"  Flat-style Short, built on the moon-closer pattern.
// Scenes: A  space: round Earth snaps into an isometric cube; gravity arrows to the centre, each face a bowl,
//            the oceans drain into one round sea per face, the air slides to the middle.
//         -> planet sweep -> B  "felt" landscape: a little buddy walks from the shore up a slope that gets
//            steeper and steeper to the edge ridge (45 degrees), the ridge pokes out of the thin air.
//         -> whiteout -> C  the cube again: corners glow, 3,700 km key hit, life rings, cube squeezes back to a ball.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, rr, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, earth, buddy, sweep, sweepMid, whiteout } = FLAT;
  let TL = null, COLD = false;

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      snap: [s(1) - 0.15, s(1) + 0.3], gravity: w('gravity', 1), center: w('center', 1), bowl: w('bowl', 1),
      rush: [w('oceans', 2), w('middle', 2) + 0.35], downhill: w('downhill', 2), middle2: w('middle', 2),
      round: w('round', 3), one: w('one', 3), side: w('side', 3),
      air: w('air', 4), airSlide: [w('air', 4), w('middle', 4) + 0.5],
      sweep: [s(5) - 0.35, s(5) + 0.4], cutB: s(5),
      walk: [s(5), s(6) + 0.6], edge: w('edge', 5), tilts: w('tilts', 5), steeper: w('steeper', 5),
      pull: [s(6) - 0.1, s(6) + 0.9], climb: w('climbing', 6), slope: w('slope', 6),
      white: [s(7) - 0.25, s(7) + 0.35], cutC: s(7),
      corners: w('corners', 7), thousand: w('thousands', 7), space: w('space', 7), noair: w('air', 7),
      life: w('life', 8), ring: w('ring', 8), sea: w('sea', 8),
      lucky: w('luckily', 9), squeeze: w('squeezes', 9), ball: w('ball', 9),
      D: T.D,
    };
    TL.morphBack = [TL.squeeze + 0.25, w('back', 9) + 0.15];
  }

  // ================= cube geometry (isometric) =================
  const hexP = (cx, cy, R, deg) => [cx + R * Math.cos(deg * Math.PI / 180), cy + R * Math.sin(deg * Math.PI / 180)];
  function faces(cx, cy, R) {
    const Cc = [cx, cy], p = (d) => hexP(cx, cy, R, d), sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
    return [
      { name: 'top', O: Cc, A: sub(p(-30), Cc), B: sub(p(-150), Cc), dark: 0, seed: 11 },
      { name: 'right', O: Cc, A: sub(p(-30), Cc), B: sub(p(90), Cc), dark: 0.2, seed: 23 },
      { name: 'left', O: Cc, A: sub(p(90), Cc), B: sub(p(-150), Cc), dark: 0.36, seed: 37 },
    ];
  }
  const fpt = (f, u, v) => [f.O[0] + f.A[0] * u + f.B[0] * v, f.O[1] + f.A[1] * u + f.B[1] * v];

  // what is drawn on one face, in unit coords (0..1). k: {rush, air, bowl, life, a}
  function faceArt(x, f, t, k) {
    x.save();
    x.transform(f.A[0], f.A[1], f.B[0], f.B[1], f.O[0], f.O[1]);
    x.beginPath(); x.rect(0, 0, 1, 1); x.clip();
    // land: green in the middle -> sand -> bare grey rock at the edges
    const g = x.createRadialGradient(0.5, 0.5, 0.05, 0.5, 0.5, 0.72);
    g.addColorStop(0, '#5fd38a'); g.addColorStop(0.45, '#3fb070'); g.addColorStop(0.62, '#e6c27a');
    g.addColorStop(0.8, lerp(0, 1, k.air) > 0.5 ? '#9a8aa8' : '#c9a46a'); g.addColorStop(1, '#6d5a80');
    x.fillStyle = g; x.fillRect(0, 0, 1, 1);
    // bowl contour lines
    if (k.bowl > 0) {
      x.save(); x.strokeStyle = H.rgba('#ffffff', 0.55 * k.bowl); x.lineWidth = 0.012; x.setLineDash([0.001, 0.03]); x.lineCap = 'round';
      for (const r of [0.14, 0.27, 0.4]) { x.beginPath(); x.arc(0.5, 0.5, r * eo(k.bowl), 0, TAU); x.stroke(); }
      x.restore();
    }
    // water: covers almost the whole face, then drains into one round sea
    const ru = eio(k.rush), hs = lerp(0.47, 0.27, ru), cr = lerp(0.06, 0.27, ru);
    const wob = (1 - ru) * 0.012 * Math.sin(t * 3 + f.seed);
    const wg = x.createRadialGradient(0.5, 0.5, 0.02, 0.5, 0.5, hs * 1.3);
    wg.addColorStop(0, '#56c8ff'); wg.addColorStop(0.6, '#2f8fe0'); wg.addColorStop(1, '#1d4fb0');
    x.fillStyle = wg; rr(x, 0.5 - hs - wob, 0.5 - hs + wob, 2 * hs, 2 * hs, cr); x.fill();
    // ripples in the sea
    x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 0.01; x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const yy = 0.5 - hs * 0.5 + i * hs * 0.5, ph = (t * 0.08 + i * 0.3) % 1; x.beginPath(); x.moveTo(0.5 - hs * 0.4 + ph * 0.05, yy); x.lineTo(0.5 - hs * 0.1 + ph * 0.05, yy); x.stroke(); }
    // islands before the drain (they become the dry land)
    const ia = 1 - seg(k.rush, 0, 0.6);
    if (ia > 0) {
      const q = H.rng(f.seed);
      x.fillStyle = H.rgba('#4cc27a', ia);
      for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(q.range(0.18, 0.82), q.range(0.18, 0.82), q.range(0.06, 0.12), q.range(0.04, 0.09), q.range(0, 3), 0, TAU); x.fill(); }
    }
    // air haze: spread over the face, then pooled over the middle
    const au = eio(k.air), ar = lerp(0.95, 0.46, au);
    const ag = x.createRadialGradient(0.5, 0.5, 0, 0.5, 0.5, ar);
    ag.addColorStop(0, H.rgba('#bff6ff', 0.3 + 0.12 * au)); ag.addColorStop(0.7, H.rgba('#8fe8ff', 0.16 + 0.1 * au)); ag.addColorStop(1, H.rgba('#8fe8ff', 0));
    x.fillStyle = ag; x.fillRect(0, 0, 1, 1);
    // airless edges darken once the air has left them
    if (au > 0) {
      const eg = x.createRadialGradient(0.5, 0.5, 0.42, 0.5, 0.5, 0.75);
      eg.addColorStop(0, 'rgba(40,20,70,0)'); eg.addColorStop(1, H.rgba('#2a1850', 0.55 * au));
      x.fillStyle = eg; x.fillRect(0, 0, 1, 1);
    }
    // life ring around the sea
    if (k.life > 0) {
      const lu = eo(k.life);
      x.strokeStyle = H.rgba('#7dffb0', 0.9 * lu); x.lineWidth = 0.05 * lu; x.beginPath(); x.arc(0.5, 0.5, 0.345, 0, TAU * lu); x.stroke();
      x.strokeStyle = H.rgba('#ffffff', 0.6 * lu); x.lineWidth = 0.012; x.beginPath(); x.arc(0.5, 0.5, 0.345, 0, TAU * lu); x.stroke();
    }
    // face shading (top light, sides darker)
    if (f.dark > 0) { x.fillStyle = H.rgba('#120c3a', f.dark); x.fillRect(0, 0, 1, 1); }
    x.restore();
  }

  function cube(x, cx, cy, R, t, k) {
    const F = faces(cx, cy, R);
    glow(x, cx, cy, R * 1.6, '#6a4cff', 0.35);
    x.save(); x.globalAlpha *= k.a == null ? 1 : k.a;
    for (const f of F) faceArt(x, f, t, k);
    // rim light on the outline + inner edges
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 5; x.beginPath();
    for (let i = 0; i <= 6; i++) { const p = hexP(cx, cy, R, -90 + i * 60); i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }
    x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 4; x.beginPath();
    for (const d of [-30, 90, -150]) { const p = hexP(cx, cy, R, d); x.moveTo(cx, cy); x.lineTo(p[0], p[1]); }
    x.stroke();
    x.restore();
    return F;
  }

  // round Earth <-> cube. m: 0 sphere, 1 cube (snaps at 0.5)
  function body(x, cx, cy, R, t, m, k) {
    if (m < 0.5) {
      const sq = 1 - 0.18 * seg(m, 0.2, 0.5);
      earth(x, cx, cy, R * 0.82 * sq, { spin: t * 0.3, t });
      return null;
    }
    const s = back(seg(m, 0.5, 1), 2.2);
    return cube(x, cx, cy, R * lerp(0.75, 1, s), t, k);
  }

  // ================= SCENE A: the cube forms, oceans and air pool =================
  function exA(x, W, H_, t) {
    const sn = seg(t, TL.snap[0], TL.snap[1]);
    const intro = eo(seg(t, TL.snap[0] - 0.4, TL.snap[0] + 0.6));
    sky(x, W, H_, t, { z: 1.25 - 0.2 * intro + 0.05 * seg(t, TL.snap[1], TL.cutB), x: t * 9, y: -t * 4 });
    const cx = W / 2, cy = 600 + Math.sin(t * 1.1) * 6, R = lerp(290, 315, seg(t, TL.snap[1], TL.cutB));
    // x-ray while gravity is explained
    const xr = seg(t, TL.gravity - 0.1, TL.gravity + 0.3) * (1 - seg(t, TL.bowl, TL.bowl + 0.4));
    const k = {
      rush: seg(t, TL.rush[0], TL.rush[1]), air: seg(t, TL.airSlide[0], TL.airSlide[1]),
      bowl: seg(t, TL.bowl - 0.1, TL.bowl + 0.4) * (1 - seg(t, TL.rush[1], TL.rush[1] + 0.6)), life: 0, a: 1 - 0.45 * xr,
    };
    const F = body(x, cx, cy, R, t, sn, k);
    if (sn > 0.45 && sn < 1) burst(x, cx, cy, (t - lerp(TL.snap[0], TL.snap[1], 0.5)) * 1.2, 7, 380);
    if (!F) return;

    // gravity arrows: face centres -> planet centre
    const ga = eio(seg(t, TL.gravity, TL.gravity + 0.5)) * (1 - seg(t, TL.bowl + 0.2, TL.bowl + 0.5));
    if (ga > 0) {
      for (const f of F) { const c = fpt(f, 0.5, 0.5); arrow(x, line(c, [lerp(c[0], cx, 0.82), lerp(c[1], cy, 0.82)]), ga, C.yellow, 9, { dots: true }); }
      const ca = back(seg(t, TL.center, TL.center + 0.3), 1.8) * (1 - seg(t, TL.bowl + 0.2, TL.bowl + 0.5));
      glow(x, cx, cy, 90 * ca, C.yellow, 0.7 * ca); spark(x, cx, cy, 22 * ca, '#ffffff', ca);
      pill(x, W / 2, 180, 'gravity', 40, { s: back(seg(t, TL.gravity, TL.gravity + 0.3)) * (1 - seg(t, TL.bowl, TL.bowl + 0.2)), bg: C.yellow });
    }
    // "giant bowl"
    pill(x, W / 2, 180, 'each side = a bowl', 38, { s: back(seg(t, TL.bowl, TL.bowl + 0.3)) * (1 - seg(t, TL.rush[0], TL.rush[0] + 0.2)), bg: C.cyan });

    // downhill arrows on the top face: corners -> middle
    const da = eio(seg(t, TL.downhill, TL.downhill + 0.5)) * (1 - seg(t, TL.middle2 + 0.3, TL.middle2 + 0.7));
    if (da > 0) {
      const top = F[0];
      for (const [u, v] of [[0.06, 0.06], [0.94, 0.06], [0.06, 0.94], [0.94, 0.94]]) {
        const a = fpt(top, u, v), b = fpt(top, lerp(u, 0.5, 0.62), lerp(v, 0.5, 0.62));
        arrow(x, line(a, b), da, '#ffffff', 8, { dots: true });
      }
      pill(x, W / 2, 180, 'downhill', 40, { s: back(seg(t, TL.downhill, TL.downhill + 0.3)) * (1 - seg(t, TL.middle2 + 0.3, TL.middle2 + 0.5)), bg: '#ffffff' });
    }
    // 6 round seas: big number, each visible sea pulses on its word
    const sx = back(seg(t, TL.round - 0.1, TL.round + 0.25), 1.6) * (1 - seg(t, TL.air - 0.2, TL.air));
    if (sx > 0) {
      x.save(); x.translate(W / 2, 180); x.scale(sx, sx); text(x, '6 SEAS', 0, 0, 116, C.yellow); x.restore();
      burst(x, W / 2, 180, (t - TL.round) * 1.0, 61, 280);
    }
    [TL.round, TL.one, TL.side].forEach((tt, i) => {
      const f = F[i], c = fpt(f, 0.5, 0.5), u = seg(t, tt, tt + 0.6);
      if (u > 0 && u < 1) { x.save(); x.strokeStyle = H.rgba('#ffffff', 1 - u); x.lineWidth = 6; x.beginPath(); x.ellipse(c[0], c[1], 60 + 120 * u, (60 + 120 * u) * 0.58, 0, 0, TAU); x.stroke(); x.restore(); }
    });
    // the air slides in
    const ap = back(seg(t, TL.air, TL.air + 0.3)) * (1 - seg(t, TL.sweep[0] - 0.2, TL.sweep[0]));
    pill(x, W / 2, 180, 'air pools in the middle', 36, { s: ap, bg: '#bff6ff' });
    if (ap > 0) for (const f of F) { const c = fpt(f, 0.5, 0.5); for (let i = 0; i < 3; i++) { const q = H.rng(f.seed + i); spark(x, c[0] + q.range(-50, 50), c[1] + q.range(-30, 30), q.range(6, 11) * (0.6 + 0.4 * Math.sin(t * 4 + i)), '#e8fdff', ap * 0.8); } }
  }

  // ================= SCENE B: the felt landscape, walking up to the edge =================
  const EDGE = 500, K = 0.001;
  const hgt = (wx) => (wx <= 0 ? -0.0008 * wx * wx : wx <= EDGE ? K * wx * wx : wx <= 2 * EDGE ? K * (2 * EDGE - wx) * (2 * EDGE - wx) : 0);
  const slopeAt = (wx) => (wx <= 0 ? 0 : wx <= EDGE ? 2 * K * wx : 0);
  const walkX = (t) => lerp(-40, 300, eio(seg(t, TL.walk[0] + 0.2, TL.steeper + 0.6))) + lerp(0, 110, eio(seg(t, TL.climb - 0.2, TL.slope + 0.4)));
  function exB(x, W, H_, t) {
    const bx = walkX(t), by = -hgt(bx);
    const pu = eio(seg(t, TL.pull[0], TL.pull[1]));
    const z = lerp(1.55, 1.0, pu) * (1 + 0.05 * seg(t, TL.cutB, TL.pull[0]));
    const camX = lerp(bx + 70, 470, pu), camY = lerp(by - 70, -150, pu);
    const S = (wx, wy) => [W / 2 + (wx - camX) * z, 640 + (wy - camY) * z];
    sky(x, W, H_, t, { x: camX * 0.3, y: camY * 0.3, z: 1 + 0.1 * pu });
    // thin air band: thick at sea level, gone by height 150
    { const [, y0] = S(0, -150), [, y1] = S(0, 30);
      const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(108,196,255,0)'); g.addColorStop(0.6, 'rgba(108,196,255,0.55)'); g.addColorStop(1, 'rgba(170,230,255,0.85)');
      x.fillStyle = g; x.fillRect(0, y0, W, H_ - y0); }
    // ground: the ridge at the cube edge, then down to the next face
    x.beginPath(); let p = S(-400, 128); x.moveTo(p[0], H_ + 10); x.lineTo(p[0], p[1]);
    for (let wx = -400; wx <= 2 * EDGE + 60; wx += 8) { p = S(wx, -hgt(wx)); x.lineTo(p[0], p[1]); }
    x.lineTo(p[0], H_ + 10); x.closePath();
    { const [, yTop] = S(0, -250), [, yBot] = S(0, 0);
      const g = x.createLinearGradient(0, yTop, 0, yBot); g.addColorStop(0, '#8d7aa8'); g.addColorStop(0.35, '#a88f78'); g.addColorStop(0.7, '#d8b46a'); g.addColorStop(1, '#3fb070');
      x.fillStyle = g; x.fill(); }
    // crescent-ish shadow on the far side of the ridge
    x.save(); x.clip(); { const a = S(EDGE, -260), b = S(EDGE, 60); const g = x.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, 'rgba(20,12,60,0.38)'); g.addColorStop(1, 'rgba(20,12,60,0)'); x.fillStyle = g; x.fillRect(a[0], 0, W, b[1]); } x.restore();
    // sea
    { const [sx0, sy] = S(-900, 0), [sx1] = S(0, 0);
      const g = x.createLinearGradient(0, sy, 0, sy + 300 * z); g.addColorStop(0, '#56c8ff'); g.addColorStop(1, '#1d4fb0');
      x.save(); x.globalAlpha = 0.86; x.fillStyle = g; x.fillRect(sx0, sy, sx1 - sx0, H_); x.restore();
      x.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 5; i++) { const xx = -500 + i * 110 + Math.sin(t * 2 + i) * 10; const [a, b] = S(xx, 14); rr(x, a, b, 40 * z, 5 * z, 3 * z); x.fill(); } }
    // little grass tufts low on the slope
    { const q = H.rng(5); for (let i = 0; i < 9; i++) { const wx = q.range(10, 200), [a, b] = S(wx, -hgt(wx)); x.fillStyle = '#2f9a5e'; x.beginPath(); x.ellipse(a, b, 9 * z, 5 * z, 0, Math.PI, TAU); x.fill(); } }

    // buddy walks up, leaning harder as it gets steeper
    const sl = slopeAt(bx), step = Math.abs(Math.sin(t * 7));
    const [qx, qy] = S(bx, by - 38 - step * 4);
    buddy(x, qx, qy, 38 * z, { t, rot: -0.45 * Math.atan(sl), look: [0.8, -0.5], worry: sl > 0.45 ? 1 : 0, col: C.orange, armUp: sl > 0.6 ? 0.4 : 0 });
    if (sl > 0.5) { const q = H.rng(Math.floor(t * 3)); for (let i = 0; i < 2; i++) spark(x, qx - 40 * z + q.range(-10, 10), qy - 40 * z + q.range(-10, 10), 7 * z, '#bff6ff', 0.8); }

    // labels
    const ep = back(seg(t, TL.edge, TL.edge + 0.3)) * (1 - seg(t, TL.pull[0], TL.pull[0] + 0.3));
    { const [a, b] = S(EDGE, -hgt(EDGE)); pill(x, Math.min(a, 600), Math.max(b - 70, 150), 'edge', 34, { s: ep, bg: '#ffffff', ptr: true }); }
    const tp = back(seg(t, TL.tilts, TL.tilts + 0.3)) * (1 - seg(t, TL.pull[0], TL.pull[0] + 0.3));
    pill(x, W / 2, 190, 'steeper and steeper', 38, { s: tp, bg: C.orange[0] });
    // 45 degree marker at the ridge
    const m = eio(seg(t, TL.climb, TL.climb + 0.6));
    if (m > 0) {
      const P = S(EDGE, -hgt(EDGE)), L = 150 * z;
      x.save(); x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.lineCap = 'round'; x.setLineDash([0.01, 14]);
      x.beginPath(); x.moveTo(P[0], P[1]); x.lineTo(P[0] - L * m, P[1]); x.stroke();
      x.strokeStyle = C.yellow; x.beginPath(); x.moveTo(P[0], P[1]); x.lineTo(P[0] - L * 0.707 * m * 1.4, P[1] + L * 0.707 * m * 1.4); x.stroke();
      x.setLineDash([]); x.lineWidth = 7; x.beginPath(); x.arc(P[0], P[1], 70 * z, Math.PI, Math.PI - Math.PI / 4 * m, true); x.stroke();
      x.restore();
      const ns = back(seg(t, TL.slope - 0.15, TL.slope + 0.2), 1.6);
      if (ns > 0) {
        x.save(); x.translate(W / 2 - 40, 230); x.scale(ns, ns); text(x, '45°', 0, 0, 104, C.yellow); x.restore();
        burst(x, W / 2 - 40, 230, (t - TL.slope) * 1.0, 33, 240);
      }
      const nt = back(seg(t, TL.slope + 0.15, TL.slope + 0.45));
      { const [a, b] = S(EDGE, -hgt(EDGE)); pill(x, Math.min(a, 590), b - 60, 'no air up here', 28, { s: nt, bg: '#ffffff' }); }
    }
  }

  // ================= SCENE C: corners in space, life rings, back to a ball =================
  function exC(x, W, H_, t) {
    const hitK = Math.max(0, 1 - Math.abs(t - TL.thousand - 0.15) / 0.75) * (t > TL.thousand ? 1 : 0);
    const shk = t > TL.thousand ? Math.sin(t * 61) * 10 * Math.max(0, 1 - (t - TL.thousand) / 0.45) : 0;
    x.save(); x.translate(shk, shk * 0.4);
    const zIn = eio(seg(t, TL.cutC - 0.1, TL.cutC + 0.9));
    sky(x, W, H_, t, { z: lerp(1.4, 1, zIn) + 0.06 * seg(t, TL.cutC, TL.D), x: 300 + t * 10, y: 40 });
    const cx = W / 2, cy = 620 + Math.sin(t * 1.1) * 5, R = lerp(380, 290, zIn) * (1 + 0.04 * seg(t, TL.life, TL.squeeze));
    const mb = seg(t, TL.morphBack[0], TL.morphBack[1]);
    const k = { rush: 1, air: 1, bowl: 0, life: seg(t, TL.ring - 0.1, TL.ring + 0.6), a: 1 };
    // squeeze: the cube is pressed from all sides, then pops back into a sphere
    const sq = seg(t, TL.squeeze - 0.1, TL.morphBack[0]);
    x.save(); x.translate(cx, cy); x.scale(1 - 0.08 * sq + 0.03 * Math.sin(sq * 30) * sq, 1 - 0.08 * sq); x.translate(-cx, -cy);
    const F = body(x, cx, cy, R, t, 1 - mb, k);
    x.restore();
    if (mb > 0.45 && mb < 1) burst(x, cx, cy, (t - lerp(TL.morphBack[0], TL.morphBack[1], 0.5)) * 1.2, 9, 380);
    if (sq > 0 && mb < 0.5) {
      for (const [ax, ay] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const d0 = R * 1.45, d1 = R * 1.08;
        arrow(x, line([cx + ax * d0, cy + ay * d0 * 0.85], [cx + ax * d1, cy + ay * d1 * 0.85]), eio(sq), C.yellow, 10, { dots: true });
      }
    }
    if (F) {
      // corners glow (the 6 outline corners)
      const cg = seg(t, TL.corners - 0.05, TL.corners + 0.3) * (1 - seg(t, TL.life, TL.life + 0.4));
      for (let i = 0; i < 6; i++) {
        const p = hexP(cx, cy, R, -90 + i * 60), pul = 0.7 + 0.3 * Math.sin(t * 6 + i);
        glow(x, p[0], p[1], 70 * cg * pul, '#ff8fb8', 0.7 * cg); spark(x, p[0], p[1], 16 * cg * pul, '#ffffff', cg);
      }
      // dotted arrow: sea middle -> top corner
      const top = F[0], c = fpt(top, 0.5, 0.5), tc = hexP(cx, cy, R, -90);
      const aa = eio(seg(t, TL.thousand - 0.6, TL.thousand - 0.2)) * (1 - seg(t, TL.life, TL.life + 0.3));
      arrow(x, line(c, [tc[0], tc[1] + 18]), aa, '#ffffff', 8, { dots: true });
      // "no air" + "space" tags at the corners
      const sp = back(seg(t, TL.space, TL.space + 0.3)) * (1 - seg(t, TL.ring - 0.3, TL.ring)) * (COLD ? 0 : 1);
      const rc = hexP(cx, cy, R, -30), lc = hexP(cx, cy, R, -150);
      pill(x, Math.min(rc[0], 590), rc[1] - 50, 'space', 30, { s: sp, bg: '#ffffff' });
      pill(x, Math.max(lc[0], 110), lc[1] - 50, 'no air', 30, { s: back(seg(t, TL.noair, TL.noair + 0.3)) * (1 - seg(t, TL.ring - 0.3, TL.ring)) * (COLD ? 0 : 1), bg: C.red, fg: '#ffffff' });
      if (sp > 0) for (let i = 0; i < 8; i++) { const q = H.rng(500 + i), p = hexP(cx, cy, R * q.range(1.05, 1.3), q.range(-120, 30)); spark(x, p[0], p[1], q.range(5, 10) * (0.5 + 0.5 * Math.sin(t * 4 + i)), '#ffffff', sp); }
      // life zone
      pill(x, W / 2, 180, 'life zone', 40, { s: back(seg(t, TL.ring, TL.ring + 0.3)) * (1 - seg(t, TL.squeeze - 0.2, TL.squeeze)), bg: '#7dffb0' });
      if (k.life > 0.5) for (const f of F) { const q = H.rng(f.seed + 3); for (let i = 0; i < 4; i++) { const a = q.range(0, TAU), p = fpt(f, 0.5 + Math.cos(a) * 0.345, 0.5 + Math.sin(a) * 0.345); spark(x, p[0], p[1], 7 * (0.6 + 0.4 * Math.sin(t * 5 + i)), '#e8fff0', seg(k.life, 0.5, 1)); } }
    }
    // the key hit: 3,700 km
    if (t > TL.thousand - 0.05 && t < TL.life + 0.3) {
      const out = seg(t, TL.life - 0.1, TL.life + 0.25);
      flare(x, W / 2, 170, hitK * 0.8, t);
      x.save(); x.globalAlpha *= 1 - out;
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.thousand, TL.thousand + 0.35) * Math.PI);
      const s = back(seg(t, TL.thousand - 0.05, TL.thousand + 0.25), 1.6) * pop;
      x.save(); x.translate(W / 2, 160); x.scale(s, s); text(x, '3,700 km', 0, 0, 120, C.yellow); x.restore();
      const ws = back(seg(t, TL.thousand + 0.35, TL.thousand + 0.65));
      x.save(); x.translate(W / 2, 250); x.scale(ws, ws); text(x, 'higher than the seas', 0, 0, 40, '#ffffff'); x.restore();
      x.restore();
      burst(x, W / 2, 160, (t - TL.thousand) * 1.0, 97, 320);
    }
    // ending: back into a ball
    const bp = back(seg(t, TL.ball, TL.ball + 0.35), 1.6);
    if (bp > 0) {
      x.save(); x.translate(W / 2, 180); x.scale(bp, bp); text(x, 'back into a BALL', 0, 0, 60, C.yellow); x.restore();
      if (t > TL.ball + 0.4) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 660), q.range(120, 330), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.ball + 0.4, TL.ball + 0.8)); }
    }
    x.restore();
    const fl = Math.max(0, 1 - Math.abs(t - (TL.thousand + 0.05)) / 0.25);
    if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.35 * fl); x.fillRect(0, 0, W, H_); }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1]));
    if (t < TL.sweep[0] || (t < TL.sweep[1] && !sweepMid(sw, W))) exA(x, W, H_, t);
    else if (t < TL.cutC) exB(x, W, H_, t);
    else exC(x, W, H_, t);
    sweep(x, W, H_, sw, PL.teal);
    whiteout(x, W, H_, seg(t, TL.white[0], TL.cutC) * (1 - seg(t, TL.cutC, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, whoosh, hit } = S;
    // 1 SNAP into a cube + gravity
    k.play('impact', lerp(TL.snap[0], TL.snap[1], 0.5), { gain: 0.6 });
    k.play('stamp', lerp(TL.snap[0], TL.snap[1], 0.5) + 0.02, { gain: 0.5 });
    tocksAlong(TL.gravity, TL.gravity + 0.5, 5, 700, -60, 0.3, 0);
    pluck(backPeak(TL.gravity, TL.gravity + 0.3), 'E4', 0.8, 0);
    boop(backPeak(TL.center, TL.center + 0.3, 1.8), 330, 0.8, 0);
    pluck(backPeak(TL.bowl, TL.bowl + 0.3), 'G4', 0.8, 0, true);
    // 2 OCEANS drain
    k.noise(TL.rush[0], { dur: TL.rush[1] - TL.rush[0] + 0.4, color: 'brown', filter: 'lowpass', f: [[0, 300], [1.2, 900]], gain: 0.26, a: 0.4, verb: 0.2 });
    tocksAlong(TL.downhill, TL.downhill + 0.5, 4, 800, -70, 0.3, 0);
    pluck(backPeak(TL.middle2, TL.middle2 + 0.3), 'C5', 0.6, 0, true);
    // 3 SIX SEAS
    pluck(backPeak(TL.round - 0.1, TL.round + 0.25, 1.6), 'A3', 1.0, 0); pluck(backPeak(TL.round - 0.1, TL.round + 0.25, 1.6) + 0.07, 'E4', 0.8, 0);
    boop(TL.one, 440, 0.6, pan(560)); boop(TL.side, 520, 0.6, pan(160));
    // 4 AIR slides
    air(TL.airSlide[0], TL.airSlide[1] - TL.airSlide[0], 1500, 0.6, 0, 0.5);
    pluck(backPeak(TL.air, TL.air + 0.3), 'D5', 0.6, 0, true);
    // sweep to the slope
    if (whoosh) whoosh(TL.sweep[0] + 0.1); else air(TL.sweep[0], TL.sweep[1] - TL.sweep[0], 1300, 1.3, 0, 0.5);
    // 5 WALKING UP
    { for (let tt = TL.walk[0] + 0.2; tt < TL.climb + 0.6; tt += 0.32) k.play('tick', tt, { f: 900 + (tt - TL.walk[0]) * 40, gain: 0.3, minor: true }); }
    pluck(backPeak(TL.edge, TL.edge + 0.3), 'E4', 0.7, 0);
    pluck(backPeak(TL.tilts, TL.tilts + 0.3), 'F4', 0.8, 0);
    k.play('riser', TL.tilts, { dur: TL.slope - TL.tilts, gain: 0.45 });
    // 6 45 DEGREES
    air(TL.pull[0], TL.pull[1] - TL.pull[0], 900, 0.5, 0, 0.5, true);
    tocksAlong(TL.climb, TL.climb + 0.6, 5, 500, 50, 0.3, 0);
    pluck(backPeak(TL.slope - 0.15, TL.slope + 0.2, 1.6), 'A3', 1.0, 0); pluck(backPeak(TL.slope - 0.15, TL.slope + 0.2, 1.6) + 0.08, 'E4', 0.8, 0);
    // whiteout back to space
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.2, 0, 0.55);
    chord(TL.cutC, ['C3', 'G3', 'E4'], 0.6, 1.4);
    // 7 CORNERS + KEY HIT (quiet 0.3 s before)
    k.play('sparkle', TL.corners, { gain: 0.7, n: 5 });
    hit(TL.thousand);
    k.play('sparkle', TL.space, { gain: 0.6, n: 6 });
    pluck(backPeak(TL.noair, TL.noair + 0.3), 'D4', 0.7, pan(140), true);
    // 8 LIFE RINGS
    shimmer(TL.ring, ['E5', 'G5', 'B5', 'E6'], 0.7, 0.2);
    pluck(backPeak(TL.ring, TL.ring + 0.3), 'G4', 0.7, 0);
    // 9 BACK TO A BALL
    tocksAlong(TL.squeeze - 0.1, TL.morphBack[0], 5, 600, 60, 0.3, 0);
    k.play('impact', lerp(TL.morphBack[0], TL.morphBack[1], 0.5), { gain: 0.55 });
    const bp = backPeak(TL.ball, TL.ball + 0.35, 1.6);
    chord(bp, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.1, 2.4); pluck(bp, 'C4', 1.0, 0);
  }

  SCENE({
    init,
    // cold open: the hook line plays over the corners poking into space (3,700 km key hit), then rewinds
    cold: () => TL.thousand - 0.1,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
