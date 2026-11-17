// "All Planets Fit Between Earth and Moon" — flat style. Built from flat/examples/moon-closer.
// One continuous true-scale scene: Earth at the bottom, the Moon at the top, the gap (397,400 km at apogee,
// surface to surface) is 950 px tall. Planets slam in one by one and stack in the gap. The camera pushes,
// pulls and zooms so something moves every 1-2 s.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, moonGlow, earth } = FLAT;
  let TL = null, COLD = false;

  // ---- true-scale layout (logical px) ----
  const GAP_KM = 397400, TOP = 86, BOT = 1036, K = (BOT - TOP) / GAP_KM;   // px per km
  const MOON = { y: TOP - 15, r: 15 }, EARTH = { y: BOT + 38, r: 38 };
  const URANUS = { c: ['#e6fdff', '#86dfe6', '#2a6a8f'], glow: '#8ff0ff', tilt: 0.0, atmo: [210, 250, 255],
    bands: [[-0.4, -0.25, '#d2fbff', 0.4], [0.2, 0.35, '#5fc0d0', 0.35]] };
  const DEF = [ // order from Earth upward; dir = side it slams in from
    { k: 'jupiter', d: 142984, pal: PL.jupiter, dir: 0 },
    { k: 'saturn', d: 120536, pal: PL.saturn, dir: 1 },
    { k: 'uranus', d: 51118, pal: URANUS, dir: -1 },
    { k: 'neptune', d: 49528, pal: PL.neptune, dir: 1 },
    { k: 'venus', d: 12104, pal: PL.venus, dir: -1 },
    { k: 'mars', d: 6792, pal: PL.mars, dir: 1 },
    { k: 'mercury', d: 4879, pal: PL.rock, dir: -1 },
  ];
  let y = BOT;
  const P = DEF.map((p) => { const r = (p.d * K) / 2; const o = { ...p, r, y: y - r }; y -= 2 * r; return o; });
  const TOPP = y;                       // top of Mercury; the spare gap is TOPP..TOP (~24 px = ~9,400 km)
  const byK = (k) => P.find((p) => p.k === k);

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      intro: s(1), earthW: w('Earth', 1), moonW: w('Moon', 1),
      arr: [s(2), w('farthest', 2)], far: w('farthest', 2), num: w('400,000', 2), count: [w('gap', 2), w('400,000', 2)],
      fill: s(3), jup: w('Jupiter', 3), jupL: w('143,000', 3),
      sat: w('Saturn', 4), satL: w('120,000', 4), ura: w('Uranus', 4), nep: w('Neptune', 4), each: w('50,000', 4),
      zoomIn: [s(5) - 0.3, s(5) + 0.4], ven: w('Venus', 5), mar: w('Mars', 5), mer: w('Mercury', 5), tiny: w('tiny', 5),
      zoomOut: [s(6) - 0.2, s(6) + 0.9], fit: w('fit', 6), every: w('every', 6),
      spareZoom: [s(7) - 0.1, s(7) + 0.7], spare: w('9,000', 7),
      outFar: [s(8), w('Space', 8)], space: w('Space', 8), big: w('big', 8),
      back: [s(9) - 0.2, s(9) + 0.8], here: w('here', 9), D: T.D,
    };
    // arrival time of every planet
    Object.assign(byK('jupiter'), { tA: TL.jup }); Object.assign(byK('saturn'), { tA: TL.sat });
    Object.assign(byK('uranus'), { tA: TL.ura }); Object.assign(byK('neptune'), { tA: TL.nep + 0.25 });
    Object.assign(byK('venus'), { tA: TL.ven }); Object.assign(byK('mars'), { tA: TL.mar }); Object.assign(byK('mercury'), { tA: TL.mer });
  }

  // ---- camera: zoom s around world point (fx, fy) placed at screen (360, sy) ----
  function cam(t) {
    let s = 1, fy = 640;
    // intro: close on Earth, pull out to the full gap
    const a = eio(seg(t, TL.intro - 0.4, TL.moonW + 0.2));
    s = lerp(3.2, 1, a); fy = lerp(EARTH.y - 120, 640, a);
    // seg 5: push in on the top for the small planets
    const zi = eio(seg(t, TL.zoomIn[0], TL.zoomIn[1])) * (1 - eio(seg(t, TL.zoomOut[0], TL.zoomOut[1])));
    s = lerp(s, 2.6, zi); fy = lerp(fy, 300, zi);
    // seg 7: push in on the spare gap
    const sz = eio(seg(t, TL.spareZoom[0], TL.spareZoom[1])) * (1 - eio(seg(t, TL.outFar[0], TL.outFar[0] + 0.9)));
    s = lerp(s, 4.2, sz); fy = lerp(fy, (TOP + TOPP) / 2 + 20, sz);
    // seg 8: pull far out (space is big), seg 9 back
    const of = eio(seg(t, TL.outFar[0], TL.outFar[1] + 0.6)) * (1 - eio(seg(t, TL.back[0], TL.back[1])));
    s = lerp(s, 0.5, of); fy = lerp(fy, 640, of);
    // slow breathing so the frame is never still
    s *= 1 + 0.015 * Math.sin(t * 0.9);
    return { s, fy };
  }
  // landing shake (all landings)
  function shk(t) {
    let v = 0;
    for (const p of P) if (p.tA != null && t >= p.tA + 0.3) v += Math.sin(t * 61) * Math.min(14, p.r * 0.08 + 3) * Math.max(0, 1 - (t - p.tA - 0.3) / 0.35);
    if (t >= TL.fit) v += Math.sin(t * 57) * 14 * Math.max(0, 1 - (t - TL.fit) / 0.5);
    return v;
  }
  // planet position over time: slams in from the side / above, back-eased
  function pos(p, t) {
    const u = seg(t, p.tA - 0.05, p.tA + 0.3);
    if (u <= 0) return null;
    const e = back(u, 1.25);
    if (p.dir === 0) return [360, lerp(-520, p.y, e)];
    return [lerp(360 + p.dir * 820, 360, e), p.y];
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const c = cam(t), sh = shk(t);
    sky(x, W, H_, t, { z: c.s, x: t * 8, y: (c.fy - 640) * 0.2 });
    const S2 = (wx, wy) => [W / 2 + (wx - 360) * c.s + sh, H_ / 2 + (wy - c.fy) * c.s + sh * 0.4];
    x.save(); x.translate(W / 2 + sh, H_ / 2 + sh * 0.4); x.scale(c.s, c.s); x.translate(-360, -c.fy);

    // the gap: dotted guide lines at the edges (fade in with the arrow)
    const ga = eio(seg(t, TL.arr[0], TL.arr[0] + 0.5));
    if (ga > 0) {
      x.save(); x.globalAlpha = 0.35 * ga; x.strokeStyle = '#7ff0ff'; x.lineWidth = 3 / c.s; x.setLineDash([2 / c.s, 10 / c.s]); x.lineCap = 'round';
      for (const yy of [TOP, BOT]) { x.beginPath(); x.moveTo(120, yy); x.lineTo(600, yy); x.stroke(); }
      x.restore();
    }
    // Earth + Moon
    const er = EARTH.r * back(seg(t, TL.intro - 0.4, TL.intro + 0.2), 1.3);
    if (er > 0) earth(x, 360, EARTH.y, er, { spin: t * 0.3, t });
    const ms = back(seg(t, TL.moonW - 0.2, TL.moonW + 0.15), 1.5);
    if (ms > 0) { moonGlow(x, 360, MOON.y, MOON.r * ms, 0.35); planet(x, 360, MOON.y, MOON.r * ms, PL.moon); }

    // big distance arrow (before the planets fill it)
    const arrA = 1 - seg(t, TL.fill, TL.fill + 0.4);
    if (arrA > 0 && t > TL.arr[0]) {
      const da = eio(seg(t, TL.arr[0], TL.arr[1] + 0.3));
      x.save(); x.globalAlpha = arrA;
      arrow(x, line([360, 520], [360, TOP + 12]), da, '#7ff0ff', 9, { dots: true, a: 0.85 });
      arrow(x, line([360, 600], [360, BOT - 12]), da, '#7ff0ff', 9, { dots: true, a: 0.85 });
      x.restore();
    }
    // the planets
    for (const p of P) {
      if (p.tA == null) continue;
      const q = pos(p, t); if (!q) continue;
      const hitK = t >= TL.fit ? Math.max(0, 1 - (t - TL.fit) / 0.9) : 0;
      if (hitK > 0) glow(x, q[0], q[1], p.r * 1.8 + 30, '#fff2c0', 0.35 * hitK);
      planet(x, q[0], q[1], p.r, p.pal, { glowA: 0.25, ringA: 1 });
      // landing puff
      const la = t - p.tA - 0.3;
      if (la > 0 && la < 0.8) burst(x, q[0] - p.dir * p.r * 0.2, q[1] + (p.dir === 0 ? p.r : 0), la * 1.1, 31 + p.d % 50, Math.max(60, p.r * 1.4));
    }
    // seg 9 loop: the full gap glows
    const hg = Math.max(0, 1 - Math.abs(t - TL.here - 0.2) / 0.8);
    if (hg > 0) { glow(x, 360, (TOP + BOT) / 2, 520, '#7ff0ff', 0.22 * hg); }
    x.restore();

    // ---------- screen-space labels ----------
    const lab = !COLD;
    // Earth / Moon names
    if (lab) {
      const [ex, ey] = S2(360, EARTH.y);
      pill(x, Math.min(ex + 150, 560), Math.min(ey, 1120), 'Earth', 32, { s: back(seg(t, TL.earthW, TL.earthW + 0.3)) * (1 - seg(t, TL.arr[0], TL.arr[0] + 0.3)), bg: C.cyan });
      const [mx, my] = S2(360, MOON.y);
      pill(x, mx + 120, Math.max(my, 80), 'Moon', 32, { s: back(seg(t, TL.moonW, TL.moonW + 0.3)) * (1 - seg(t, TL.arr[0], TL.arr[0] + 0.3)), bg: '#ffffff' });
    }
    // distance counter
    if (lab && t > TL.count[0] - 0.2 && arrA > 0) {
      const v = Math.round(lerp(0, 397400, eo(seg(t, TL.count[0], TL.count[1]))) / 100) * 100;
      const ia = back(seg(t, TL.count[0] - 0.2, TL.count[0] + 0.15), 1.6), land = seg(t, TL.num, TL.num + 0.35);
      const pop = 1 + 0.2 * Math.sin(land * Math.PI) * (land > 0 ? 1 : 0);
      x.save(); x.globalAlpha = arrA; x.translate(W / 2, 560); x.scale(ia * pop, ia * pop);
      text(x, (land > 0 ? '~400,000' : v.toLocaleString('en-US')) + ' km', 0, 0, 72, land > 0 ? C.yellow : '#ffffff');
      x.restore();
      if (land > 0) burst(x, W / 2, 560, land * 1.2, 41, 220);
      pill(x, W / 2, 470, 'Moon at its farthest', 30, { s: back(seg(t, TL.far, TL.far + 0.3)) * arrA, bg: '#ffffff' });
    }
    // planet labels (name + size), each lives until the next beat
    const L1 = (str, sub, wx, wy, t0, t1, side, col) => {
      const sc = back(seg(t, t0, t0 + 0.3), 1.6) * (1 - seg(t, t1, t1 + 0.25));
      if (sc <= 0.01 || !lab) return;
      const [sx, sy] = S2(wx, wy);
      const px = cl(sx + side * 0, 170, 560);
      pill(x, px, sy, str, 34, { s: sc, bg: col || C.yellow });
      if (sub) { x.save(); x.translate(px, sy + 52); x.scale(sc, sc); text(x, sub, 0, 0, 30, '#ffffff'); x.restore(); }
    };
    const J = byK('jupiter'), Sa = byK('saturn'), U = byK('uranus'), N = byK('neptune');
    L1('143,000 km', 'Jupiter', 360, J.y - 40, TL.jupL, TL.sat, 0);
    L1('120,000 km', 'Saturn', 360, Sa.y - 30, TL.satL, TL.ura, 0);
    L1('~50,000 km each', null, 360, (U.y + N.y) / 2, TL.each, TL.zoomIn[0], 0, C.cyan);
    // small planets: names beside them while zoomed in
    const smalls = [['venus', 'Venus', TL.ven], ['mars', 'Mars', TL.mar], ['mercury', 'Mercury', TL.mer]];
    smalls.forEach(([k, n, t0], i) => {
      const p = byK(k), sc = back(seg(t, t0 + 0.2, t0 + 0.5), 1.6) * (1 - seg(t, TL.zoomOut[0], TL.zoomOut[0] + 0.25));
      if (sc <= 0.01 || !lab) return;
      const [sx, sy] = S2(360, p.y), side = i % 2 ? 1 : -1;
      pill(x, sx + side * 190, sy, n, 30, { s: sc, bg: '#ffffff' });
    });
    if (lab) {
      const tp = back(seg(t, TL.tiny, TL.tiny + 0.3), 1.6) * (1 - seg(t, TL.zoomOut[0], TL.zoomOut[0] + 0.25));
      if (tp > 0.01) { x.save(); x.translate(W / 2, 760); x.scale(tp, tp); text(x, 'squeeeeze!', 0, 0, 64, C.yellow); x.restore(); }
    }
    // KEY HIT: they all fit
    if (t > TL.fit - 0.05) {
      const hitK = Math.max(0, 1 - Math.abs(t - TL.fit - 0.15) / 0.8);
      flare(x, W / 2, 640, hitK * 0.8, t);
      const out = seg(t, TL.spareZoom[0], TL.spareZoom[0] + 0.3);
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.fit, TL.fit + 0.35) * Math.PI);
      const s = back(seg(t, TL.fit - 0.05, TL.fit + 0.25), 1.6) * pop * (1 - out);
      if (s > 0.01) {
        x.save(); x.translate(W / 2, 620); x.scale(s, s);
        text(x, 'ALL 7', 0, -70, 84, '#ffffff'); text(x, 'FIT!', 0, 40, 150, C.yellow); x.restore();
        burst(x, W / 2, 640, (t - TL.fit) * 1.0, 97, 340);
      }
      const fl = Math.max(0, 1 - Math.abs(t - (TL.fit + 0.05)) / 0.25);
      if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.35 * fl); x.fillRect(0, 0, W, H_); }
    }
    // spare gap bracket
    if (lab && t > TL.spareZoom[0]) {
      const a = 1 - seg(t, TL.outFar[0], TL.outFar[0] + 0.3);
      if (a > 0) {
        const [, y1] = S2(360, TOP), [, y2] = S2(360, TOPP);
        const ap = eio(seg(t, TL.spareZoom[1] - 0.2, TL.spare));
        x.save(); x.globalAlpha = a;
        x.strokeStyle = C.yellow; x.lineWidth = 6; x.lineCap = 'round';
        x.beginPath(); x.moveTo(470, y1 + 4); x.lineTo(470, lerp(y1 + 4, y2 - 4, ap)); x.stroke();
        x.beginPath(); x.moveTo(450, y1 + 4); x.lineTo(490, y1 + 4); x.moveTo(450, y2 - 4); x.lineTo(490, y2 - 4); x.globalAlpha = a * ap; x.stroke();
        x.restore();
        const sc = back(seg(t, TL.spare, TL.spare + 0.3), 1.6) * a;
        x.save(); x.translate(W / 2, 820); x.scale(sc, sc); text(x, '9,000+ km', 0, 0, 96, C.yellow); text(x, 'to spare', 0, 78, 48, '#ffffff'); x.restore();
        if (sc > 0.01) burst(x, W / 2, 820, (t - TL.spare) * 1.1, 13, 200);
      }
    }
    // space is big
    if (lab && t > TL.space - 0.1) {
      const a = 1 - seg(t, TL.back[0], TL.back[0] + 0.3);
      const s1 = back(seg(t, TL.space, TL.space + 0.3)) * a, s2 = back(seg(t, TL.big, TL.big + 0.35), 1.7) * a;
      x.save(); x.translate(W / 2, 200); x.scale(s1, s1); text(x, 'Space is just', 0, 0, 58, '#ffffff'); x.restore();
      x.save(); x.translate(W / 2, 300); x.scale(s2, s2); text(x, 'THAT BIG', 0, 0, 104, C.yellow); x.restore();
      if (s2 > 0.01) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 640), q.range(120, 420), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.big + 0.3, TL.big + 0.7) * a); }
    }
    // loop line
    if (lab && t > TL.here - 0.1) {
      const s = back(seg(t, TL.here, TL.here + 0.35), 1.6);
      x.save(); x.translate(W / 2, 640); x.scale(s, s); text(x, 'right here.', 0, 0, 80, C.yellow); x.restore();
    }
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // intro pull-out
    air(TL.intro - 0.4, TL.moonW - TL.intro + 0.6, 1100, 0.6, 0, 0.5, true);
    boop(backPeak(TL.intro - 0.4, TL.intro + 0.2, 1.3), 300, 0.8, 0);
    pluck(backPeak(TL.earthW, TL.earthW + 0.3), 'E4', 0.6, 0.3, true);
    boop(backPeak(TL.moonW - 0.2, TL.moonW + 0.15, 1.5), 520, 0.9, 0);
    pluck(backPeak(TL.moonW, TL.moonW + 0.3), 'B4', 0.6, 0.3, true);
    // distance arrow + counter
    tocksAlong(TL.arr[0], TL.arr[1] + 0.3, 6, 520, 40, 0.3, 0);
    for (let tt = TL.count[0], lastB = -1, lastT = -1; tt < TL.count[1] - 0.03; tt += 1 / 120) {
      const b = Math.floor(lerp(0, 397400, eo(seg(tt, TL.count[0], TL.count[1]))) / 25000);
      if (b !== lastB && tt - lastT >= 1 / 11) { k.play('tock', tt, { f: 600 + b * 18, gain: 0.4, pan: 0, minor: true }); lastB = b; lastT = tt; }
    }
    pluck(TL.num, 'A3', 1.1, -0.1); pluck(TL.num + 0.07, 'E4', 1.0, 0); pluck(TL.num + 0.14, 'A4', 0.8, 0.1);
    pluck(backPeak(TL.far, TL.far + 0.3), 'C5', 0.5, 0, true);
    // planet slams
    for (const p of P) {
      const big = p.r > 40;
      whoosh(p.tA - 0.2, big ? 0.6 : 0.4, big ? 1 : 0.6);
      if (big) { k.play('impact', p.tA + 0.3, { gain: p.k === 'jupiter' ? 0.75 : 0.5 }); k.play('thud', p.tA + 0.3, { f: 70, gain: 0.5 }); }
      else boop(p.tA + 0.28, 700 - p.r * 6, 0.9, pan(p.dir > 0 ? 500 : 220));
    }
    pluck(backPeak(TL.jupL, TL.jupL + 0.3, 1.6), 'D4', 0.9, 0);
    pluck(backPeak(TL.satL, TL.satL + 0.3, 1.6), 'E4', 0.9, 0);
    pluck(backPeak(TL.each, TL.each + 0.3, 1.6), 'G4', 0.8, 0);
    // zoom in to the top
    air(TL.zoomIn[0], TL.zoomIn[1] - TL.zoomIn[0], 900, 0.6, 0, 0.5, true);
    pluck(backPeak(TL.tiny, TL.tiny + 0.3, 1.6), 'C5', 0.8, 0);
    // KEY HIT (sound gap before: nothing else in the 0.3 s before)
    air(TL.zoomOut[0], 0.6, 1200, 0.5, 0, 0.5);
    hit(TL.fit);
    // spare gap
    air(TL.spareZoom[0], TL.spareZoom[1] - TL.spareZoom[0], 900, 0.6, 0, 0.5, true);
    tocksAlong(TL.spareZoom[1] - 0.2, TL.spare, 4, 700, 40, 0.3, 0.2);
    pluck(backPeak(TL.spare, TL.spare + 0.3, 1.6), 'A3', 1.0, 0); pluck(backPeak(TL.spare, TL.spare + 0.3, 1.6) + 0.08, 'E4', 0.8, 0);
    // pull far out
    whoosh(TL.outFar[0], 0.9, 0.8);
    pluck(backPeak(TL.space, TL.space + 0.3), 'E4', 0.7, 0);
    const bp = backPeak(TL.big, TL.big + 0.35, 1.7);
    chord(bp, ['C3', 'G3', 'C4', 'E4', 'G4'], 1.1, 2.0); k.play('sparkle', bp + 0.05, { gain: 0.9, n: 7 });
    // back + loop
    air(TL.back[0], TL.back[1] - TL.back[0], 1100, 0.6, 0, 0.5, true);
    const hp = backPeak(TL.here, TL.here + 0.35, 1.6);
    chord(hp, ['A2', 'E3', 'A3', 'C#4', 'E4'], 1.0, 2.2); shimmer(hp + 0.05, ['E5', 'A5', 'C#6'], 0.6, 0.2);
  }

  SCENE({
    init,
    // cold open: the hook is spoken over the moment every planet fits, in slow motion
    cold: () => TL.fit - 0.15,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
