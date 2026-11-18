// "What If Two Planets Collided?" (Theia + Earth -> the Moon) — flat style. Built from flat/examples/moon-closer.
// Scene A/B: one space world. Theia slams into Earth, the surface melts, debris blasts out, swirls into a ring,
// clumps into the Moon (key hit). Scene C (moon sweep): the young Moon hanging 15x closer.
// Scene D (whiteout dive): Earth cut open, Theia pieces deep inside. Scene E: back out, Theia comes again (loop).
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, moonGlow, earth, trail, shake } = FLAT;
  let TL = null, COLD = false;

  // ---- world ----
  const EX = 340, EY = 560, R = 200, RT = 106;       // Earth, Theia (Mars-size, about half of Earth)
  const A = -0.85, DX = Math.cos(A), DY = Math.sin(A); // Theia comes from the upper right
  const DC = R + RT * 0.55;                            // centre distance at contact
  const CP = [EX + DX * R, EY + DY * R];               // contact point on Earth's surface
  const RO = 430, RY = 0.42;                            // debris ring radius + ellipse squash

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      intro: s(1), num: w('four', 1), mars: w('Mars', 1), impact: w('smashed', 1) + 0.15,
      theia: w('Theia', 2), melt: w('melted', 2),
      vapor: w('vapor', 3), cloud: w('cloud', 3), blast: w('blasted', 3),
      swirl: s(4), ring: w('ring', 4),
      clump: s(5), moon: w('Moon', 5),
      clock: w('hours', 6) - 0.35, hours: w('hours', 6),
      sweep: [s(7) - 0.25, s(7) + 0.5], cutC: s(7) + 0.12, fifteen: w('15', 7), today: w('today', 7),
      dive: [s(8) - 0.35, s(8) + 0.3], cutD: s(8), pieces: w('pieces', 8), buried: w('buried', 8), deep: w('deep', 8),
      out: [s(9) - 0.3, s(9) + 0.3], cutE: s(9), see: w('see', 9), seeing: w('seeing', 9), two: w('two', 9), collide: w('collide', 9),
      D: T.D,
    };
    TL.arrow = [TL.cutC + 0.2, TL.fifteen];
  }

  // ---- Theia position before impact (accelerating, slight curve) ----
  function theiaAt(t) {
    const u = seg(t, TL.intro - 0.4, TL.impact), e = Math.pow(u, 2.1);
    const d = lerp(640, DC, e), side = (1 - e) * 90;
    return [EX + DX * d - DY * side, EY + DY * d + DX * side];
  }
  function drawTheia(x, t, px, py, r, a = 1) {
    x.save(); x.globalAlpha *= a;
    trail(x, px, py, Math.atan2(EY - py, EX - px), 260 + 200 * seg(t, TL.intro, TL.impact), r * 1.5, '#ffb070', 0.85);
    planet(x, px, py, r, PL.mars, { glowA: 0.35 });
    x.restore();
  }

  // ---- debris: launched from the crash, then orbiting as a ring, then clumping into the Moon ----
  let DEB = null;
  function debris() {
    if (DEB) return DEB;
    const r = H.rng(4518); DEB = [];
    for (let i = 0; i < 80; i++) DEB.push({
      ea: A + r.range(-1.1, 1.1), ed: R * r.range(1.25, 2.5), dl: r.range(0, 0.5),
      oa: r.range(0, TAU), orr: RO * r.range(0.82, 1.18), s: r.range(4, 12), cd: r.range(0, 0.6),
      c: r.pick([['#fff3b0', '#ffc23f', '#d24a2a'], ['#ffd29a', '#ff8d3f', '#7a1f2f'], ['#e8e6ff', '#a7a2d8', '#4a3f8c']]),
    });
    return DEB;
  }
  const moonAng = (t) => -1.25 + (t - TL.moon) * 0.18;
  const orbitPos = (a, rr) => [EX + Math.cos(a) * rr, EY + Math.sin(a) * rr * RY];

  // ================= SCENE A/B: crash, melt, debris, ring, Moon =================
  function exAB(x, W, H_, t) {
    const zOut = eio(seg(t, TL.blast - 0.2, TL.swirl + 0.8));
    const zMoon = eio(seg(t, TL.moon - 0.1, TL.moon + 0.6)) * 0.12;
    const z = lerp(lerp(1.1, 1, eo(seg(t, TL.intro - 0.4, TL.impact))), 0.6, zOut) + zMoon + 0.012 * Math.sin(t * 0.9);
    const cx = lerp(EX, 360, zOut), cy = lerp(EY, 600, zOut);
    const sh = shake(t, TL.impact, 20, 0.6) + shake(t, TL.moon, 12, 0.45);
    sky(x, W, H_, t, { z, x: t * 9, y: -zOut * 40 });
    x.save(); x.translate(360 + sh, 560 + sh * 0.5 + zOut * 40); x.scale(z, z); x.translate(-cx, -cy);

    const melt = seg(t, TL.impact, TL.melt + 0.4), hot = Math.max(seg(t, TL.impact, TL.impact + 0.3) * 0.6, melt) * (1 - 0.5 * seg(t, TL.moon, TL.moon + 2));
    const ringA = seg(t, TL.swirl - 0.2, TL.ring + 0.3) * (1 - seg(t, TL.clump, TL.moon));
    const ringBand = (half) => {
      if (ringA <= 0) return;
      x.save(); x.translate(EX, EY); x.scale(1, RY); x.globalAlpha *= ringA;
      x.beginPath(); if (half === 'back') x.rect(-700, -700, 1400, 700); else x.rect(-700, 0, 1400, 700); x.clip();
      for (const [f0, f1, col, al] of [[0.8, 0.92, '#ffb070', 0.45], [0.95, 1.08, '#ff8d3f', 0.6], [1.1, 1.2, '#ffe28a', 0.4]]) {
        x.beginPath(); x.arc(0, 0, RO * f1, 0, TAU); x.arc(0, 0, RO * f0, 0, TAU, true); x.fillStyle = H.rgba(col, al); x.fill();
      }
      x.restore();
    };
    // debris positions
    const P = [];
    if (t > TL.impact) for (const p of debris()) {
      const l = eo(seg(t, TL.vapor - 0.2 + p.dl * 0.6, TL.blast + 0.5 + p.dl));
      if (l <= 0 && t < TL.blast) continue;
      const ep = [CP[0] + Math.cos(p.ea) * (p.ed - R * 0.9) * l, CP[1] + Math.sin(p.ea) * (p.ed - R * 0.9) * l];
      const oa = p.oa + (t - TL.swirl) * 0.55, op = orbitPos(oa, p.orr);
      const k = eio(seg(t, TL.swirl - 0.4, TL.swirl + 1.3));
      let px = lerp(ep[0], op[0], k), py = lerp(ep[1], op[1], k);
      const mp = orbitPos(moonAng(t), RO), ck = eio(seg(t, TL.clump + p.cd * 0.5, TL.moon - 0.05));
      px = lerp(px, mp[0], ck); py = lerp(py, mp[1], ck);
      const bk = k > 0.5 && Math.sin(oa) < 0;
      if (t < TL.moon + 0.05) P.push({ px, py, bk, p, a: l > 0 ? 1 : 0 });
    }
    const drawP = (bk) => { for (const q of P) if (q.bk === bk && q.a > 0) { glow(x, q.px, q.py, q.p.s * 2.6, '#ff8d3f', 0.35); ball(x, q.px, q.py, q.p.s, q.p.c, { sha: 0.4 }); } };

    ringBand('back'); drawP(true);
    // the Moon (behind Earth only if on the back half of the orbit: we keep it in front)
    // Earth
    glow(x, EX, EY, R * 1.9, '#ff6a3c', 0.45 * hot);
    earth(x, EX, EY, R, { spin: t * 0.22, quake: cl(melt * 1.1) * (1 - 0.6 * seg(t, TL.swirl, TL.swirl + 1.5)), t });
    if (hot > 0) { // molten overlay
      x.save(); x.beginPath(); x.arc(EX, EY, R, 0, TAU); x.clip();
      const g = x.createRadialGradient(CP[0], CP[1], 0, CP[0], CP[1], R * 2.2);
      g.addColorStop(0, H.rgba('#fff3b0', 0.95 * hot)); g.addColorStop(0.25, H.rgba('#ff8d3f', 0.85 * hot)); g.addColorStop(1, H.rgba('#c0302a', 0.9 * hot));
      x.fillStyle = g; x.fillRect(EX - R, EY - R, 2 * R, 2 * R);
      const q = H.rng(31);
      for (let i = 0; i < 12; i++) { const a = q.range(0, TAU) + t * 0.15, d = q.range(0.1, 0.85) * R, r2 = q.range(0.08, 0.2) * R; x.fillStyle = H.rgba('#7a1a20', 0.22 * melt); x.beginPath(); x.ellipse(EX + Math.cos(a) * d, EY + Math.sin(a) * d, r2 * 1.4, r2, a, 0, TAU); x.fill(); }
      x.restore();
      FLAT.atmo(x, EX, EY, R, [255, 180, 120], 0.9 * hot);
    }
    // vapor haze
    const vp = seg(t, TL.vapor - 0.2, TL.cloud) * (1 - seg(t, TL.swirl, TL.swirl + 1.2));
    if (vp > 0) { glow(x, CP[0], CP[1], R * 2.2 * (0.6 + 0.4 * vp), '#ffb070', 0.5 * vp); glow(x, EX, EY, R * 1.6, '#ff8d3f', 0.35 * vp); }

    // Theia
    if (t < TL.impact) { const [px, py] = theiaAt(t); drawTheia(x, t, px, py, RT); }
    else {
      const u = eo(seg(t, TL.impact, TL.impact + 0.9));
      if (u < 1) {
        const d = lerp(DC, R * 0.75, u), r = RT * (1 - u);
        x.save(); x.translate(EX + DX * d, EY + DY * d); x.rotate(A); x.scale(1 - 0.45 * u, 1 + 0.25 * u);
        planet(x, 0, 0, r, PL.mars, { glowA: 0.2 }); x.restore();
      }
      // fireball
      const fk = Math.max(0, 1 - (t - TL.impact) / 1.4);
      glow(x, CP[0], CP[1], 420 * (0.5 + 0.5 * eo(seg(t, TL.impact, TL.impact + 0.5))), '#ff8d3f', 0.75 * fk);
      glow(x, CP[0], CP[1], 170, '#fff6d0', 0.95 * fk);
      flare(x, CP[0], CP[1], fk * 0.9, t);
      burst(x, CP[0], CP[1], (t - TL.impact) * 0.9, 77, 380);
      burst(x, CP[0], CP[1], (t - TL.impact) * 0.9 - 0.15, 78, 260);
    }
    ringBand('front'); drawP(false);

    // the Moon forms
    if (t > TL.moon - 0.05) {
      const [mx, my] = orbitPos(moonAng(t), RO), ms = back(seg(t, TL.moon - 0.05, TL.moon + 0.3), 1.8);
      const fk = Math.max(0, 1 - (t - TL.moon) / 0.9);
      moonGlow(x, mx, my, 85 * ms, 0.4 + 0.3 * fk);
      glow(x, mx, my, 220, '#fff6d0', 0.6 * fk);
      planet(x, mx, my, 85 * ms, PL.moon);
      burst(x, mx, my, (t - TL.moon) * 1.0, 23, 300);
    } else if (t > TL.clump) { // glowing clump growing
      const [mx, my] = orbitPos(moonAng(t), RO), g = seg(t, TL.clump, TL.moon);
      glow(x, mx, my, 60 + 120 * g, '#ffe28a', 0.5 * g);
    }
    x.restore();

    // ---- labels (screen space) ----
    if (!COLD) {
      const nA = 1 - seg(t, TL.mars - 0.1, TL.mars + 0.2);
      if (nA > 0 && t > TL.num - 0.05) {
        x.save(); x.globalAlpha = nA;
        FLAT.bigNumber(x, '4.5 billion', 300, 170, 76, t, TL.num, { col: C.yellow, spread: 220 });
        const ys = back(seg(t, TL.num + 0.25, TL.num + 0.55));
        x.save(); x.translate(300, 245); x.scale(ys, ys); text(x, 'years ago', 0, 0, 44, '#ffffff'); x.restore();
        x.restore();
      }
      const [tx, ty] = theiaAt(t);
      const mp = back(seg(t, TL.mars, TL.mars + 0.3)) * (1 - seg(t, TL.impact - 0.25, TL.impact - 0.05));
      pill(x, cl(tx - 40, 140, 520), cl(ty - RT - 50, 120, 700), 'size of Mars', 34, { s: mp, bg: C.orange[0], fg: '#ffffff' });
    }
    const th = back(seg(t, TL.theia, TL.theia + 0.3)) * (1 - seg(t, TL.vapor - 0.3, TL.vapor));
    pill(x, 470, 150, 'Theia', 44, { s: th, bg: C.orange[0], fg: '#ffffff', ptr: true });
    const ml = back(seg(t, TL.melt, TL.melt + 0.3)) * (1 - seg(t, TL.vapor - 0.3, TL.vapor));
    pill(x, 360, 860, 'whole surface melts', 34, { s: ml, bg: C.yellow });
    // key hit text
    const mk = back(seg(t, TL.moon, TL.moon + 0.3), 1.7) * (1 - seg(t, TL.clock - 0.2, TL.clock));
    if (mk > 0) {
      flare(x, 360, 190, Math.max(0, 1 - Math.abs(t - TL.moon - 0.2) / 0.8) * 0.7, t);
      const pop = 1 + 0.2 * Math.sin(seg(t, TL.moon, TL.moon + 0.35) * Math.PI);
      x.save(); x.translate(360, 190); x.scale(mk * pop, mk * pop); text(x, 'OUR MOON!', 0, 0, 112, C.yellow); x.restore();
      burst(x, 360, 190, (t - TL.moon) * 1.0, 97, 320);
    }
    // clock: just a few hours
    const ck = back(seg(t, TL.clock, TL.clock + 0.3), 1.6);
    if (ck > 0) {
      x.save(); x.translate(250, 190); x.scale(ck, ck);
      glow(x, 0, 0, 120, '#56e8ff', 0.3);
      ball(x, 0, 0, 62, ['#ffffff', '#dfe6ff', '#7a86c8'], { sha: 0.35 });
      x.strokeStyle = '#141846'; x.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; x.lineWidth = 5; x.beginPath(); x.moveTo(Math.cos(a) * 46, Math.sin(a) * 46); x.lineTo(Math.cos(a) * 54, Math.sin(a) * 54); x.stroke(); }
      const hm = (t - TL.clock) * 9, hh = hm / 12;
      x.lineWidth = 8; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(hh) * 28, -Math.cos(hh) * 28); x.stroke();
      x.lineWidth = 5; x.strokeStyle = C.red; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(hm) * 44, -Math.cos(hm) * 44); x.stroke();
      x.restore();
      const hs = back(seg(t, TL.hours, TL.hours + 0.3), 1.6);
      x.save(); x.translate(470, 160); x.scale(hs, hs); text(x, 'just', 0, 0, 46, '#ffffff'); x.restore();
      x.save(); x.translate(470, 228); x.scale(hs, hs); text(x, 'HOURS!', 0, 0, 72, C.yellow); x.restore();
    }
    // flash on impact
    const fl = Math.max(0, 1 - Math.abs(t - (TL.impact + 0.03)) / 0.3);
    if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.55 * fl); x.fillRect(0, 0, W, H_); }
  }

  // ================= SCENE C: the young Moon, 15x closer =================
  function exC(x, W, H_, t) {
    const u = eio(seg(t, TL.cutC - 0.2, TL.cutC + 1.2));
    sky(x, W, H_, t, { z: lerp(1.4, 1, u), x: 300 + t * 10, y: 20 });
    const MY = lerp(560, 470, u), MR = 100 + 6 * Math.sin(t * 0.8);
    moonGlow(x, 380, MY, MR, 0.45);
    planet(x, 380, MY, MR, PL.moon, { inner: () => { x.fillStyle = 'rgba(255,140,70,0.18)'; x.fillRect(-MR, -MR, 2 * MR, 2 * MR); } });
    earth(x, 360, lerp(1330, 1250, u), 300, { spin: t * 0.5, t, bulge: 0.08, bulgeAng: -Math.PI / 2 });
    const da = eio(seg(t, TL.arrow[0], TL.arrow[1]));
    arrow(x, line([380, MY + MR + 20], [380, 900]), da, '#7ff0ff', 9, { dots: true, a: 0.85 });
    FLAT.bigNumber(x, '15×', 360, 205, 128, t, TL.fifteen, { col: C.yellow, spread: 260 });
    const cs = back(seg(t, TL.fifteen + 0.2, TL.fifteen + 0.5));
    x.save(); x.translate(360, 295); x.scale(cs, cs); text(x, 'closer', 0, 0, 54, '#ffffff'); x.restore();
    pill(x, 560, 760, 'today: 384,400 km', 28, { s: back(seg(t, TL.today, TL.today + 0.3)), bg: '#ffffff' });
  }

  // ================= SCENE D: inside Earth, pieces of Theia =================
  function exD(x, W, H_, t) {
    const z = lerp(1.25, 1, eo(seg(t, TL.cutD, TL.cutD + 0.9))) * (1 + 0.04 * seg(t, TL.cutD, TL.cutE));
    sky(x, W, H_, t, { z, x: 600 + t * 6 });
    x.save(); x.translate(360, 560); x.scale(z, z);
    const RR = 300;
    glow(x, 0, 0, RR * 1.5, '#4fc9ff', 0.3);
    // crust + mantle + cores (flat radial layers)
    x.fillStyle = '#2f8fe0'; x.beginPath(); x.arc(0, 0, RR, 0, TAU); x.fill();
    x.fillStyle = '#3fcf8a'; x.beginPath(); x.arc(0, 0, RR, Math.PI * 1.1, Math.PI * 1.55); x.lineTo(0, 0); x.fill();
    let g = x.createRadialGradient(0, 0, 150, 0, 0, RR - 16);
    g.addColorStop(0, '#ff6a2a'); g.addColorStop(0.6, '#e8452a'); g.addColorStop(1, '#a8242a');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, RR - 16, 0, TAU); x.fill();
    g = x.createRadialGradient(0, 0, 40, 0, 0, 150); g.addColorStop(0, '#ffe28a'); g.addColorStop(1, '#ff9d3a');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 150, 0, TAU); x.fill();
    glow(x, 0, 0, 120, '#fff6d0', 0.7);
    ball(x, 0, 0, 72, ['#ffffff', '#fff3b0', '#ffc23f'], { sha: 0.25 });
    // mantle swirls
    x.save(); x.globalAlpha = 0.25; x.strokeStyle = '#ffb070'; x.lineWidth = 6; x.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + t * 0.08; x.beginPath(); x.arc(0, 0, 220 + (i % 2) * 30, a, a + 0.6); x.stroke(); }
    x.restore();
    // Theia blobs on the core-mantle boundary
    const bl = [[Math.PI * 0.97, 1], [-0.1, 0.85]];
    bl.forEach(([a, sz], i) => {
      const s = back(seg(t, TL.pieces + i * 0.18, TL.pieces + i * 0.18 + 0.35), 1.7);
      if (s <= 0) return;
      const pul = 1 + 0.08 * Math.sin(seg(t, TL.buried, TL.buried + 0.6) * Math.PI * 2);
      const bx = Math.cos(a) * 185, by = Math.sin(a) * 185;
      glow(x, bx, by, 110 * s * sz, '#ff5d8f', 0.45);
      x.save(); x.translate(bx, by); x.rotate(a + Math.PI / 2); x.scale(s * sz * pul, s * sz * pul);
      x.fillStyle = '#7a1f8f'; x.beginPath();
      for (let k = 0; k <= 14; k++) { const q = (k / 14) * TAU, rr = (1 + 0.18 * Math.sin(q * 3 + i)) ; const px = Math.cos(q) * 70 * rr, py = Math.sin(q) * 36 * rr - 10; k ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,140,220,0.45)'; x.beginPath(); x.ellipse(-18, -22, 30, 10, 0, 0, TAU); x.fill();
      x.restore();
    });
    x.restore();
    const ps = back(seg(t, TL.pieces + 0.3, TL.pieces + 0.6));
    pill(x, 360, 165, 'pieces of Theia?', 40, { s: ps, bg: C.pink, fg: '#ffffff' });
    const aa = eio(seg(t, TL.buried, TL.buried + 0.5));
    arrow(x, [[260, 200], [180, 250], [150, 340], [190 + 0, 540]], aa, '#ffffff', 7, { dots: true });
    arrow(x, [[460, 200], [560, 260], [580, 380], [540, 520]], aa, '#ffffff', 7, { dots: true });
    const dp = back(seg(t, TL.deep, TL.deep + 0.3));
    pill(x, 360, 900, '2,900 km down', 32, { s: dp, bg: C.yellow });
  }

  // ================= SCENE E: the Moon, and Theia coming again (loop) =================
  function exE(x, W, H_, t) {
    const z = lerp(0.85, 1, eio(seg(t, TL.cutE - 0.3, TL.D)));
    sky(x, W, H_, t, { z, x: t * 9 });
    x.save(); x.translate(360, 560); x.scale(z, z); x.translate(-360, -560);
    const ms = 1 + 0.12 * Math.sin(seg(t, TL.see, TL.see + 0.4) * Math.PI);
    moonGlow(x, 130, 250, 50 * ms, 0.4);
    planet(x, 130, 250, 50 * ms, PL.moon);
    earth(x, EX, EY, R, { spin: t * 0.22, t });
    // Theia rushes in again: replay the approach, ending just before the crash (loops into the cold open)
    if (t > TL.two - 0.3) {
      const tv = lerp(TL.intro - 0.4, TL.impact - 0.12, eio(seg(t, TL.two - 0.3, TL.D)));
      const [px, py] = theiaAt(tv); drawTheia(x, tv, px, py, RT);
    }
    x.restore();
    pill(x, 175, 335, 'made by a crash', 30, { s: back(seg(t, TL.seeing, TL.seeing + 0.3)) * (1 - seg(t, TL.two - 0.2, TL.two)), bg: C.yellow, ptr: 'up' });
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 1000, -1000, sw);
    if (t < TL.cutC && (t < TL.sweep[0] || spx > W / 2)) exAB(x, W, H_, t);
    else if (t < TL.cutD) exC(x, W, H_, t);
    else if (t < TL.cutE) exD(x, W, H_, t);
    else exE(x, W, H_, t);
    if (sw > 0 && sw < 1) { moonGlow(x, spx, 640, 900, 0.4); planet(x, spx, 640 + (sw - 0.5) * 140, 900, PL.moon); }
    FLAT.whiteout(x, W, H_, seg(t, TL.dive[0], TL.cutD) * (1 - seg(t, TL.cutD, TL.dive[1])));
    FLAT.whiteout(x, W, H_, seg(t, TL.out[0], TL.cutE) * (1 - seg(t, TL.cutE, TL.out[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // 1 Theia approaches, the crash
    pluck(backPeak(TL.num - 0.05, TL.num + 0.25, 1.6), 'E4', 1.0, 0); pluck(TL.num + 0.08, 'B4', 0.6, 0);
    pluck(backPeak(TL.mars, TL.mars + 0.3), 'G4', 0.7, 0.2, true);
    k.play('riser', TL.intro, { dur: TL.impact - TL.intro, gain: 0.6 });
    k.play('impact', TL.impact, { gain: 1.0 });
    k.play('thud', TL.impact + 0.02, { f: 55, gain: 0.8 });
    k.noise(TL.impact, { dur: 2.2, color: 'brown', filter: 'lowpass', f: [[0, 900], [2.2, 150]], gain: 0.4, a: 0.02, verb: 0.35 });
    // 2 Theia, melting
    pluck(backPeak(TL.theia, TL.theia + 0.3), 'D4', 0.9, 0.3);
    k.noise(TL.melt - 0.3, { dur: 1.6, color: 'brown', filter: 'lowpass', f: 220, gain: 0.22, a: 0.3, hold: 0.6 });
    pluck(backPeak(TL.melt, TL.melt + 0.3), 'A3', 0.8, 0, true);
    // 3 vapor + blast
    air(TL.vapor - 0.2, 1.0, 1500, 0.8, 0.2, 0.6);
    whoosh(TL.blast - 0.2, 0.9, 1.1);
    k.play('sparkle', TL.blast + 0.1, { gain: 0.6, n: 6 });
    // 4 ring
    air(TL.swirl - 0.3, 1.6, 1100, 0.7, -0.2, 0.5, true);
    k.play('sparkle', TL.ring, { gain: 0.8, n: 6 });
    pluck(TL.ring + 0.05, 'C5', 0.6, 0, true);
    // 5 KEY HIT: the Moon (quiet 0.3 s before)
    air(TL.clump, Math.max(0.3, TL.moon - TL.clump - 0.35), 900, 0.5, 0, 0.8, true);
    hit(TL.moon, 1.0);
    k.play('sparkle', TL.moon + 0.1, { gain: 1, n: 8 });
    // 6 hours
    boop(backPeak(TL.clock, TL.clock + 0.3, 1.6), 420, 1.0, pan(250));
    for (let i = 0; i < 8; i++) k.play('tick', TL.clock + 0.2 + i * 0.12, { f: i % 2 ? 2600 : 3400, gain: 0.35, minor: true });
    pluck(backPeak(TL.hours, TL.hours + 0.3, 1.6), 'E4', 0.9, pan(470));
    // 7 sweep, 15x closer
    whoosh(TL.sweep[0], 0.8, 1.0);
    tocksAlong(TL.arrow[0], TL.arrow[1], 5, 520, 40, 0.3, 0);
    const f15 = backPeak(TL.fifteen - 0.05, TL.fifteen + 0.25, 1.6);
    pluck(f15, 'A3', 1.1, 0); pluck(f15 + 0.07, 'E4', 0.9, 0); pluck(f15 + 0.14, 'A4', 0.7, 0);
    pluck(backPeak(TL.today, TL.today + 0.3), 'G4', 0.5, pan(560), true);
    // 8 dive inside Earth
    air(TL.dive[0], TL.dive[1] - TL.dive[0] + 0.1, 2200, 1.1, 0, 0.55);
    chord(TL.cutD, ['D3', 'A3', 'F4'], 0.6, 1.6);
    boop(backPeak(TL.pieces, TL.pieces + 0.35, 1.7), 300, 1.0, -0.3); boop(backPeak(TL.pieces + 0.18, TL.pieces + 0.53, 1.7), 360, 1.0, 0.3);
    tocksAlong(TL.buried, TL.buried + 0.5, 4, 600, -40, 0.3, 0);
    pluck(backPeak(TL.deep, TL.deep + 0.3), 'D4', 0.7, 0, true);
    // 9 back out, Theia comes again
    air(TL.out[0], TL.out[1] - TL.out[0] + 0.1, 2000, 1.0, 0, 0.5);
    pluck(backPeak(TL.seeing, TL.seeing + 0.3), 'C5', 0.7, pan(175));
    k.play('riser', TL.two - 0.3, { dur: Math.max(0.5, TL.D - TL.two + 0.2), gain: 0.55 });
    chord(TL.collide, ['A2', 'E3', 'A3', 'E4'], 0.8, 1.6);
  }

  SCENE({
    init,
    // cold open: the hook line plays over the crash in slow motion, then rewinds to the start
    cold: () => TL.impact - 0.12,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
