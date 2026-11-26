// Astrivo Short 2026-11-26-2: "How Many Earths Fit in Each Planet?"
// Scenes: A Earth + the small planets (lineup, 18 Mercurys and 7 Mars pour into Earth) | sweep |
//         B the giants: Neptune 57 + Uranus 63 fill with Earths, Saturn 764, Jupiter 1,321 (key hit) | whiteout |
//         C the Sun next to a tiny Jupiter: 1,300,000 Earths, ~1,000 Jupiters, tiny Earth at the end.
// Cold open: the hook plays over Jupiter filling up with Earths as the counter slams to 1,321.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, earth, sun, badge, sweep, whiteout, shake, fmt } = FLAT;
  let TL = null, COLD = false;
  const URANUS = { c: ['#d8fbff', '#7fdce8', '#2a6f9a'], glow: '#7fe8ff', tilt: 0.0, atmo: [210, 250, 255],
    bands: [[-0.35, -0.25, '#eafdff', 0.35], [0.2, 0.3, '#5ab8d0', 0.3]] };
  const EARTHC = ['#9ff3ff', '#2f8fe0', '#1d2f86'];

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      intro: s(1), fill: w('fill', 1), small: w('smallest', 1), big: w('biggest', 1),
      merc: w('mercury', 2), one: w('one', 2), swallow: w('swallow', 2), n18: w('18', 2),
      mars: w('mars', 3), tooSmall: w('small', 3), n7: w('7', 3),
      sweep: [s(4) - 0.25, s(4) + 0.5], giants: w('giants', 4), nep: w('neptune', 4), n57: w('57', 4), ura: w('uranus', 4), n63: w('63', 4),
      sat: [s(5) - 0.3, s(5) + 0.5], rings: w('rings', 5), n764: w('764', 5),
      jup: [s(6) - 0.25, s(6) + 0.6], king: w('king', 6), n1321: w('1,321', 6), packed: w('packed', 6),
      white: [s(7) - 0.4, s(7) + 0.35], cut3: s(7), tiny: w('tiny', 7), sunW: w('sun', 7),
      nSun: w('1.3', 8), nJ: w('1,000', 9), jupiters: w('jupiters', 9), earthW: w('earth', 9), bigW: w('big', 9),
      D: T.D,
    };
  }

  // ---------- packing: hex grid of small balls inside a circle, bottom row first (they pour in) ----------
  const PACK = {};
  function packed(R, er) {
    const key = R.toFixed(1) + ':' + er.toFixed(2);
    if (PACK[key]) return PACK[key];
    const pts = [], dy = er * 1.74, dx = er * 2.02;
    for (let row = 0, y = R - er; y > -R; row++, y -= dy) {
      for (let xx = -R + er + (row % 2 ? dx / 2 : 0); xx < R; xx += dx) if (Math.hypot(xx, y) <= R - er * 0.85) pts.push([xx, y]);
    }
    pts.sort((a, b) => b[1] - a[1] || Math.abs(a[0]) - Math.abs(b[0]));
    return (PACK[key] = pts);
  }
  function mini(x, px, py, r, kind, pal) {
    if (r < 11) {   // fast flat version for tiny balls (hundreds per frame)
      const c = kind === 'earth' ? EARTHC : pal.c;
      x.fillStyle = c[1]; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
      x.fillStyle = H.rgba(c[2], 0.55); x.beginPath(); x.arc(px + r * 0.25, py + r * 0.25, r * 0.75, 0, TAU); x.fill();
      x.fillStyle = kind === 'earth' ? '#3fcf8a' : H.rgba(c[0], 0.8); x.beginPath(); x.arc(px - r * 0.25, py - r * 0.2, r * 0.42, 0, TAU); x.fill();
      return;
    }
    if (kind === 'earth') {
      ball(x, px, py, r, EARTHC, { sha: 0.4, rima: 0.4 });
      if (r > 5) { x.fillStyle = '#3fcf8a'; x.beginPath(); x.arc(px - r * 0.2, py - r * 0.1, r * 0.38, 0, TAU); x.arc(px + r * 0.3, py + r * 0.35, r * 0.22, 0, TAU); x.fill(); }
    } else planet(x, px, py, r, pal, { glowA: 0, atmo: 0 });
  }
  // fill a circle (centre cx,cy radius R) with n of the first `count` balls; u 0..1 = progress
  function pour(x, cx, cy, R, er, count, u, kind, pal, o = {}) {
    const P = packed(R, er), N = Math.min(count, P.length);
    if (u <= 0) return;
    const nf = u * N, drop = Math.max(2.5, N * 0.07);
    // dark "see-through" inside
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fillStyle = H.rgba('#0a082e', 0.55 * cl(u * 6)); x.fill(); x.restore();
    for (let i = 0; i < N && i < nf + 0.001; i++) {
      const p = eo(cl((nf - i) / drop)), [qx, qy] = P[i];
      const sx = cx + qx, sy = lerp(cy - R - (o.fall == null ? 160 : o.fall) - (i % 5) * 18, cy + qy, p);
      mini(x, sx, sy, er * (0.85 + 0.15 * p), kind, pal);
    }
    if (o.rim) { // keep the host planet recognisable: a thick rim in its colour
      x.save(); x.globalAlpha *= cl(u * 4) * (o.rimA == null ? 1 : o.rimA); x.strokeStyle = o.rim; x.lineWidth = Math.max(6, R * 0.06);
      x.beginPath(); x.arc(cx, cy, R - x.lineWidth / 2, 0, TAU); x.stroke(); x.restore();
    }
  }
  function counter(x, cx, cy, v, px, t, land, col) {
    const L = t >= land, pop = L ? 1 + 0.22 * Math.sin(seg(t, land, land + 0.35) * Math.PI) : 1;
    x.save(); x.translate(cx, cy); x.scale(pop, pop); text(x, fmt(v), 0, 0, px, L ? (col || C.yellow) : '#ffffff'); x.restore();
    if (L) burst(x, cx, cy, (t - land) * 1.1, 31 + Math.round(cx), 200);
  }

  // ================= SCENE A: Earth + Mercury + Mars =================
  const EX = 360, EY = 600, ER = 175;
  function exA(x, W, H_, t) {
    const pull = 1 + 1.4 * (1 - eo(seg(t, TL.intro - 0.4, TL.intro + 1.0)));
    sky(x, W, H_, t, { z: pull, x: t * 10, y: t * 4 });
    const ein = back(seg(t, TL.intro - 0.4, TL.intro + 0.4), 1.3);
    // lineup: smallest to biggest, slides in along the top, then flies away when Mercury arrives
    const lo = eio(seg(t, TL.merc - 0.3, TL.merc + 0.2));
    const LINE = [[PL.rock, 9], [PL.mars, 13], [PL.neptune, 26], [URANUS, 27], [PL.saturn, 34], [PL.jupiter, 42]];
    let lx = 70;
    LINE.forEach(([pal, r], i) => {
      const a = back(seg(t, TL.fill - 0.1 + i * 0.12, TL.fill + 0.25 + i * 0.12), 1.8);
      const cx = lx + r, cy = 250 - lo * 420;
      if (a > 0) planet(x, cx, cy, r * a, pal, { glowA: 0.25, ringA: 1 });
      lx += 2 * r + (pal === PL.saturn ? 40 : 18);
    });
    arrow(x, line([70, 330 - lo * 420], [640, 330 - lo * 420]), eio(seg(t, TL.small, TL.big + 0.3)), C.yellow, 8, { dots: true });
    pill(x, 130, 380 - lo * 420, 'small', 28, { s: back(seg(t, TL.small, TL.small + 0.3)) });
    pill(x, 570, 380 - lo * 420, 'BIG', 28, { s: back(seg(t, TL.big, TL.big + 0.3)), bg: C.yellow });

    // Earth
    earth(x, EX, EY + (1 - ein) * 500, ER * Math.max(ein, 0.01), { spin: t * 0.25, t });
    pill(x, EX, EY + ER + 50, 'Earth', 30, { s: back(seg(t, TL.intro + 0.2, TL.intro + 0.5)) * (1 - seg(t, TL.merc - 0.2, TL.merc)), bg: C.cyan });

    // Mercury: pops at top-left, red X, then 18 Mercurys pour into Earth
    const mIn = back(seg(t, TL.merc - 0.1, TL.merc + 0.3), 1.6), mOut = eio(seg(t, TL.mars - 0.35, TL.mars));
    const mr = ER * 0.383;
    if (mIn > 0 && mOut < 1) {
      const mx = lerp(150, -120, mOut), my = 260;
      planet(x, mx, my, mr * mIn, PL.rock, { glowA: 0.3 });
      pill(x, mx, my + mr + 40, 'Mercury', 30, { s: mIn });
      badge(x, mx + mr * 0.8, my - mr * 0.8, 26, false, back(seg(t, TL.one, TL.one + 0.3), 1.8));
    }
    const mu = eio(seg(t, TL.swallow, TL.n18)) * (1 - seg(t, TL.mars - 0.3, TL.mars));
    if (mu > 0) pour(x, EX, EY, ER, mr * 0.42 * 0.98, 18, mu < 1 ? mu : 1, 'pal', PL.rock);
    if (t > TL.swallow && t < TL.mars) {
      const v = Math.round(18 * eio(seg(t, TL.swallow, TL.n18)));
      x.save(); x.globalAlpha = 1 - seg(t, TL.mars - 0.3, TL.mars);
      counter(x, 480, 260, v, 110, t, TL.n18); text(x, 'Mercurys', 480, 340, 40, '#ffffff'); x.restore();
    }

    // Mars: pops top-right, red X, 7 Mars pour in
    const aIn = back(seg(t, TL.mars - 0.1, TL.mars + 0.3), 1.6), ar = ER * 0.532;
    if (aIn > 0) {
      const ax = 560, ay = 270;
      planet(x, ax, ay, ar * aIn, PL.mars, { glowA: 0.3 });
      pill(x, ax, ay + ar + 40, 'Mars', 30, { s: aIn });
      badge(x, ax - ar * 0.85, ay - ar * 0.8, 26, false, back(seg(t, TL.tooSmall, TL.tooSmall + 0.3), 1.8));
    }
    const au = eio(seg(t, TL.tooSmall + 0.3, TL.n7));
    if (au > 0) pour(x, EX, EY, ER, ER * 0.31, 7, au, 'pal', PL.mars);
    if (t > TL.tooSmall + 0.3) {
      counter(x, 190, 250, Math.round(7 * au), 120, t, TL.n7); text(x, 'Mars', 190, 335, 40, '#ffffff');
    }
  }

  // ================= SCENE B: the giants =================
  function exB(x, W, H_, t) {
    const satK = eio(seg(t, TL.sat[0], TL.sat[1])), jupK = eio(seg(t, TL.jup[0], TL.jup[1]));
    const hitK = t > TL.n1321 ? Math.max(0, 1 - (t - TL.n1321) / 0.9) : 0;
    const sh = shake(t, TL.n1321, 12);
    x.save(); x.translate(sh, sh * 0.5);
    sky(x, W, H_, t, { x: 300 + t * 12, y: 30 + satK * 80 + jupK * 80, z: 1 + 0.1 * satK + 0.1 * jupK });

    // Neptune + Uranus
    const nIn = back(seg(t, TL.nep - 0.15, TL.nep + 0.25), 1.5), uIn = back(seg(t, TL.ura - 0.15, TL.ura + 0.25), 1.5);
    const NR = 135, ny = 560;
    if (satK < 1) {
      const nx = lerp(185, -260, satK), ux = lerp(535, 980, satK);
      const show0 = t < TL.nep - 0.15 ? 1 : 0;   // both visible as faint silhouettes on "giants"
      const gi = back(seg(t, TL.giants - 0.1, TL.giants + 0.3), 1.4);
      planet(x, nx, ny, NR * Math.max(nIn, 0.45 * gi), PL.neptune, { glowA: 0.3 });
      planet(x, ux, ny, NR * 1.03 * Math.max(uIn, 0.45 * gi), URANUS, { glowA: 0.3 });
      pour(x, nx, ny, NR, 15, 57, eio(seg(t, TL.nep + 0.2, TL.n57)), 'earth', null, { rim: '#3f63c9' });
      pour(x, ux, ny, NR * 1.03, 15, 63, eio(seg(t, TL.ura + 0.15, TL.n63)), 'earth', null, { rim: '#7fdce8' });
      pill(x, nx, ny + NR + 46, 'Neptune', 30, { s: nIn });
      pill(x, ux, ny + NR + 46, 'Uranus', 30, { s: uIn });
      if (t > TL.nep + 0.2) counter(x, nx, 330, Math.round(57 * eio(seg(t, TL.nep + 0.2, TL.n57))), 96, t, TL.n57);
      if (t > TL.ura + 0.15) counter(x, ux, 330, Math.round(63 * eio(seg(t, TL.ura + 0.15, TL.n63))), 96, t, TL.n63);
      void show0;
    }

    // Saturn
    if (satK > 0) {
      const SR = 165, sx = lerp(900, 360, satK) + lerp(0, -330, jupK), sy = lerp(560, 600, satK) + lerp(0, 260, jupK);
      const ss = 1 - 0.55 * jupK;
      planet(x, sx, sy, SR * ss, PL.saturn, { glowA: 0.3 });
      pour(x, sx, sy, SR * ss, 7.5 * ss, 764, eio(seg(t, TL.rings + 0.1, TL.n764)), 'earth', null, { rim: '#f0c878' });
      // front half of the ring again on top of the Earths
      if (PL.saturn.ring) {
        const R = PL.saturn.ring, r = SR * ss;
        FLAT.ring(x, sx, sy, { rx: R.rx * r, ry: R.ry * r, tilt: R.tilt, bands: R.bands }, 'front', 1);
      }
      const ca = 1 - jupK;
      if (t > TL.rings + 0.1 && ca > 0) {
        x.save(); x.globalAlpha = ca;
        counter(x, 360, 200, Math.round(764 * eio(seg(t, TL.rings + 0.1, TL.n764))), 120, t, TL.n764);
        x.restore();
      }
      pill(x, sx, sy + SR * ss + 70, 'Saturn', 30 * ss, { s: back(seg(t, TL.sat[0] + 0.3, TL.sat[1] + 0.2)) * (1 - jupK) });
    }

    // Jupiter: rises from below, the king, fills to 1,321
    if (jupK > 0) {
      const JR = 240, jx = 360, jy = lerp(1300, 580, back(seg(t, TL.jup[0], TL.jup[1]), 1.1));
      planet(x, jx, jy, JR, PL.jupiter, { glowA: 0.35 + 0.3 * hitK });
      const ju = eio(seg(t, TL.king + 0.15, TL.n1321));
      pour(x, jx, jy, JR, 7.6, 1321, ju, 'earth', null, { rim: '#e8a36a' });
      // crown
      const kc = back(seg(t, TL.king, TL.king + 0.35), 1.8) * (COLD ? 0 : 1);
      if (kc > 0) crown(x, jx, jy - JR - 40, 70 * kc, t);
      if (t > TL.king + 0.15) {
        flare(x, 360, 190, hitK * 0.8, t);
        const v = Math.round(1321 * ju);
        const L = t >= TL.n1321;
        const s = L ? back(seg(t, TL.n1321 - 0.05, TL.n1321 + 0.25), 1.6) * (1 + 0.22 * Math.sin(seg(t, TL.n1321, TL.n1321 + 0.35) * Math.PI)) : 1;
        x.save(); x.translate(360, 190); x.scale(L ? Math.max(s, 0.6) * 1.0 : 0.8, L ? Math.max(s, 0.6) : 0.8);
        text(x, fmt(v), 0, 0, 132, L ? C.yellow : '#ffffff'); x.restore();
        if (L) burst(x, 360, 190, (t - TL.n1321) * 1.0, 97, 340);
        pill(x, 360, 290, 'Earths inside Jupiter', 30, { s: back(seg(t, TL.packed, TL.packed + 0.3)) * (COLD ? 0 : 1), bg: C.cyan });
      }
    }
    x.restore();
    const fl = Math.max(0, 1 - Math.abs(t - (TL.n1321 + 0.05)) / 0.25);
    if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.35 * fl); x.fillRect(0, 0, W, H_); }
  }
  function crown(x, cx, cy, s, t) {
    x.save(); x.translate(cx, cy + Math.sin(t * 3) * 4);
    glow(x, 0, 0, s * 1.8, C.yellow, 0.4);
    const g = x.createLinearGradient(0, -s * 0.6, 0, s * 0.5); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#e0902a');
    x.fillStyle = g; x.beginPath();
    x.moveTo(-s, s * 0.45); x.lineTo(-s, -s * 0.35); x.lineTo(-s * 0.5, s * 0.05); x.lineTo(0, -s * 0.6); x.lineTo(s * 0.5, s * 0.05); x.lineTo(s, -s * 0.35); x.lineTo(s, s * 0.45); x.closePath(); x.fill();
    x.fillStyle = 'rgba(160,80,20,0.35)'; x.fillRect(-s, s * 0.22, s * 2, s * 0.23);
    for (const [px, py, c] of [[-s * 0.5, s * 0.32, C.red], [0, s * 0.32, C.cyan], [s * 0.5, s * 0.32, C.green]]) { x.fillStyle = c; x.beginPath(); x.arc(px, py, s * 0.1, 0, TAU); x.fill(); }
    x.restore();
  }

  // ================= SCENE C: the Sun =================
  function exC(x, W, H_, t) {
    const zo = eio(seg(t, TL.cut3 - 0.1, TL.sunW + 0.4));
    sky(x, W, H_, t, { x: 700 + t * 8, y: 40, z: lerp(1.4, 1, zo) });
    // Jupiter shrinks from big to tiny, moving to the top-left
    const jr = lerp(240, 30, zo), jx = lerp(360, 105, zo), jy = lerp(580, 250, zo);
    // Sun rises in
    const sIn = eio(seg(t, TL.cut3 + 0.2, TL.sunW + 0.3)), SR = 285, sy = lerp(1500, 610, sIn);
    sun(x, 360, sy, SR, t);
    // Earths sparkle across the Sun on 1,300,000
    if (t > TL.nSun - 0.1) {
      const k = eio(seg(t, TL.nSun - 0.1, TL.nSun + 0.9)) * (1 - seg(t, TL.nJ - 0.3, TL.nJ));
      const r = H.rng(2626);
      x.save(); x.beginPath(); x.arc(360, sy, SR, 0, TAU); x.clip();
      for (let i = 0; i < 420; i++) { const a = r.range(0, TAU), d = Math.sqrt(r()) * SR, ph = r(); if (ph > k) continue; mini(x, 360 + Math.cos(a) * d, sy + Math.sin(a) * d, 5, 'earth'); }
      x.restore();
    }
    // ~1,000 Jupiters pour into the Sun
    const ju = eio(seg(t, TL.nJ - 0.2, TL.jupiters + 0.3)), jfade = 1 - 0.75 * eio(seg(t, TL.earthW - 0.2, TL.earthW + 0.4));
    if (ju > 0) { x.save(); x.globalAlpha = jfade; pour(x, 360, sy, SR, 9.2, 1000, ju, 'pal', PL.jupiter, { fall: 40, rim: '#ffc23f' }); x.restore(); }
    planet(x, jx, jy, jr, PL.jupiter, { glowA: 0.3 });
    pill(x, jx, jy + jr + 34, 'Jupiter', 28, { s: back(seg(t, TL.tiny, TL.tiny + 0.3)) * (1 - seg(t, TL.earthW - 0.3, TL.earthW)) });
    // tiny Earth (true scale: Sun 109x wider)
    const ex = 190, ey = 250, ea = seg(t, TL.tiny, TL.tiny + 0.3);
    if (ea > 0) { glow(x, ex, ey, 16 + 14 * seg(t, TL.earthW, TL.earthW + 0.4), '#4fc9ff', 0.6 * ea); ball(x, ex, ey, 3.2, EARTHC); }
    const ep = back(seg(t, TL.earthW, TL.earthW + 0.3), 1.6);
    if (ep > 0) {
      pill(x, ex + 10, ey + 52, 'Earth', 30, { s: ep, bg: C.cyan, ptr: 'up' });
      for (let i = 0; i < 5; i++) { const q = H.rng(90 + i); spark(x, ex + q.range(-40, 40), ey + q.range(-36, 30), q.range(5, 10) * (0.5 + 0.5 * Math.sin(t * 4 + i)), '#ffffff', seg(t, TL.bigW, TL.bigW + 0.3)); }
    }
    // numbers
    const nOut = eio(seg(t, TL.nJ - 0.3, TL.nJ));
    if (t > TL.nSun - 0.05 && nOut < 1) {
      x.save(); x.globalAlpha = 1 - nOut;
      flare(x, 380, 130, Math.max(0, 1 - Math.abs(t - TL.nSun - 0.2) / 0.8) * 0.6, t);
      FLAT.bigNumber(x, '1,300,000', 400, 125, 96, t, TL.nSun, { seed: 51 });
      text(x, 'Earths', 400, 200, 42, '#ffffff', { a: back(seg(t, TL.nSun + 0.3, TL.nSun + 0.6)) });
      x.restore();
    }
    if (t > TL.nJ - 0.05) {
      FLAT.bigNumber(x, '≈ 1,000', 400, 125, 100, t, TL.nJ, { seed: 52 });
      text(x, 'Jupiters', 400, 200, 44, '#ffffff', { a: cl(seg(t, TL.jupiters - 0.1, TL.jupiters + 0.2)) });
    }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1]));
    if (t < TL.sweep[0] || (t < TL.sweep[1] && !FLAT.sweepMid(sw, W))) exA(x, W, H_, t);
    else if (t < TL.cut3) exB(x, W, H_, t);
    else exC(x, W, H_, t);
    sweep(x, W, H_, sw, PL.neptune);
    whiteout(x, W, H_, seg(t, TL.white[0], TL.cut3) * (1 - seg(t, TL.cut3, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, whoosh, hit } = S;
    // A: Earth + lineup
    air(TL.intro - 0.4, 0.9, 1200, 0.6, 0, 0.5, true);
    boop(backPeak(TL.intro - 0.4, TL.intro + 0.4, 1.3), 360, 0.9, 0, false);
    ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'].forEach((n, i) => pluck(backPeak(TL.fill - 0.1 + i * 0.12, TL.fill + 0.25 + i * 0.12, 1.8), n, 0.55, pan(70 + i * 100)));
    tocksAlong(TL.small, TL.big + 0.3, 6, 520, 50, 0.25, 0);
    pluck(backPeak(TL.big, TL.big + 0.3), 'E5', 0.6, pan(570), true);
    // Mercury
    k.play('swish', TL.merc - 0.3, { gain: 0.45 });
    boop(backPeak(TL.merc - 0.1, TL.merc + 0.3, 1.6), 520, 0.8, pan(150));
    k.play('error', backPeak(TL.one, TL.one + 0.3, 1.8), { gain: 0.6, pan: pan(180) });
    { const n = 18, a = TL.swallow, b = TL.n18; for (let i = 0; i < n; i++) k.play('tock', a + (b - a) * eio(i / n), { f: 600 + i * 18, gain: 0.3, minor: true }); }
    pluck(TL.n18, 'A3', 1.0, pan(480)); pluck(TL.n18 + 0.07, 'E4', 0.8, pan(480));
    // Mars
    boop(backPeak(TL.mars - 0.1, TL.mars + 0.3, 1.6), 440, 0.8, pan(560));
    k.play('error', backPeak(TL.tooSmall, TL.tooSmall + 0.3, 1.8), { gain: 0.5, pan: pan(500) });
    tocksAlong(TL.tooSmall + 0.3, TL.n7, 7, 560, 40, 0.35, 0);
    pluck(TL.n7, 'D4', 1.0, pan(190)); pluck(TL.n7 + 0.07, 'A4', 0.8, pan(190));
    // sweep to the giants
    whoosh(TL.sweep[0], 0.8);
    chord(TL.giants, ['D3', 'A3', 'D4'], 0.6, 1.2);
    boop(backPeak(TL.nep - 0.15, TL.nep + 0.25, 1.5), 300, 0.8, pan(185));
    { const r = H.rng(57); for (let tt = TL.nep + 0.2; tt < TL.n57 - 0.05; tt += 0.07 + r() * 0.03) k.play('tick', tt, { f: 2400 + r() * 1500, gain: 0.25, pan: pan(185), minor: true }); }
    pluck(TL.n57, 'E4', 0.9, pan(185));
    boop(backPeak(TL.ura - 0.15, TL.ura + 0.25, 1.5), 340, 0.8, pan(535));
    { const r = H.rng(63); for (let tt = TL.ura + 0.15; tt < TL.n63 - 0.05; tt += 0.07 + r() * 0.03) k.play('tick', tt, { f: 2400 + r() * 1500, gain: 0.25, pan: pan(535), minor: true }); }
    pluck(TL.n63, 'G4', 0.9, pan(535));
    // Saturn
    whoosh(TL.sat[0], 0.6, 0.6);
    k.play('sparkle', TL.rings, { gain: 0.6, n: 5 });
    { const r = H.rng(764); for (let tt = TL.rings + 0.1; tt < TL.n764 - 0.05; tt += 0.05 + r() * 0.02) k.play('tick', tt, { f: 3000 + r() * 1800, gain: 0.22, minor: true }); }
    pluck(TL.n764, 'A3', 1.0, 0); pluck(TL.n764 + 0.07, 'E4', 0.8, 0); pluck(TL.n764 + 0.14, 'A4', 0.6, 0);
    // Jupiter: rises, crown, pour, KEY HIT on 1,321 (quiet 0.3 s before it)
    air(TL.jup[0], TL.jup[1] - TL.jup[0] + 0.2, 900, 0.7, 0, 0.6, true);
    k.play('thud', TL.jup[1] - 0.2, { f: 70, gain: 0.5 });
    chord(backPeak(TL.king, TL.king + 0.35, 1.8), ['C4', 'E4', 'G4'], 0.7, 1.0);
    k.play('riser', TL.king + 0.15, { dur: Math.max(0.3, TL.n1321 - 0.3 - TL.king - 0.15), gain: 0.6 });
    { const r = H.rng(1321); for (let tt = TL.king + 0.2; tt < TL.n1321 - 0.32; tt += 0.045 + r() * 0.02) k.play('tick', tt, { f: 3200 + r() * 2000, gain: 0.2, minor: true }); }
    hit(TL.n1321);
    pluck(backPeak(TL.packed, TL.packed + 0.3), 'E4', 0.6, 0, true);
    // whiteout to the Sun
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.1, 0, 0.55);
    chord(TL.cut3, ['F3', 'C4', 'A4'], 0.6, 1.4);
    k.noise(TL.cut3, { dur: T.D - TL.cut3, color: 'brown', filter: 'lowpass', f: 260, gain: 0.08, a: 0.8, bus: 'amb' });
    pluck(backPeak(TL.tiny, TL.tiny + 0.3), 'C5', 0.6, pan(105), true);
    k.play('riser', TL.nSun - 0.7, { dur: 0.6, gain: 0.4 });
    chord(TL.nSun, ['F3', 'C4', 'F4', 'A4', 'C5'], 1.0, 1.8);
    k.play('sparkle', TL.nSun + 0.1, { gain: 0.8, n: 8 });
    { const r = H.rng(1000); for (let tt = TL.nJ - 0.2; tt < TL.jupiters + 0.3; tt += 0.05 + r() * 0.02) k.play('tick', tt, { f: 2000 + r() * 1500, gain: 0.2, minor: true }); }
    pluck(TL.nJ, 'G3', 1.0, 0); pluck(TL.nJ + 0.07, 'D4', 0.8, 0);
    boop(backPeak(TL.earthW, TL.earthW + 0.3, 1.6), 600, 0.8, pan(190), false);
    const lb = TL.bigW;
    chord(lb, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.0, 2.2);
    k.play('sparkle', lb + 0.1, { gain: 0.7, n: 6 });
  }

  SCENE({
    init,
    cold: () => TL.n1321 - 0.55,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
