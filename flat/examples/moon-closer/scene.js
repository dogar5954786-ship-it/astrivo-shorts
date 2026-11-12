// Example flat-style Short: "What if the Moon came 10x closer?"  Copy this pattern for new jobs.
// SCENE({ init, cold, draw, sound }), see PIPELINE.md section 4. Every time comes from the voice timing T,
// so each picture lands on the word that names it.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, rr, glow, spark, crescent, ball, arrow, line, text, pill, flare, burst,
    sky, planet, atmo, moonGlow, earth, city, water } = FLAT;
  let TL = null, COLD = false;   // COLD: true while the cold open is showing (hide labels that come later)

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    const brk = w('apart', 6), s7 = s(7), s8 = s(8);
    TL = {
      intro: s(1), distArrow: [s(1) + 0.1, s(1) + 0.6], distNum: w('384,400', 1), awayPill: T.wordEnd('away', 1),
      approach: [s(2), w('half', 2) + 0.35], half: w('half', 2) + 0.35, tides8: w('eight', 2),
      sweep: [s(3) - 0.2, s(3) + 0.55], rise: [s(3) + 0.45, s(3) + 1.5], todayPill: s(3) + 1.1, ten: w('fill', 3), tenOut: [s(4) - 0.25, s(4)],
      pull: [s(4), s(4) + 0.5], pullPill: s(4) + 0.45, flood: [w('oceans', 4), w('thousand', 4)], thousand: w('thousand', 4), word: w('thousand', 4) + 0.3,
      white: [s(5) - 0.4, s(5) + 0.35], cut2: s(5),
      quake: [s(5) + 0.3, w('volcanoes', 5)], quakePill: w('crack', 5), quakeOut: [s(6) - 0.3, s(6)],
      zoomC: [s(6) - 0.1, s(6) + 0.8], roche: [s(6), w('18,000', 6)], rochePill: w('18,000', 6) - 0.2, rocheNum: w('18,000', 6),
      fall: [s(6), brk], cross: w('gravity', 6), stretch: [w('gravity', 6), brk], crack: w('tears', 6), brk,
      spread: [brk, brk + 1.6], tilt: [s7, s7 + 1.1], ringIn: [s7 + 0.1, s7 + 1.2], rings: w('rings', 7),
      take: [s8 - 0.15, s8 + 0.6], reform: s8 + 0.4, line1: w('luckily', 8), line2: w('drifting', 8),
      awayArrow: [w('away', 8), w('away', 8) + 0.5], cmPill: w('centimeters', 8) - 0.2,
      D: T.D,
    };
  }

  // ================= SCENE A: Earth and Moon, the Moon creeps closer =================
  // Earth fills the bottom, Moon high above. A two-way dotted arrow + counter shows the distance.
  function exA(x, W, H_, t) {
    const pull = 1 + 1.6 * (1 - eo(seg(t, TL.intro - 0.4, TL.intro + 1.2)));
    const ap = eio(seg(t, TL.approach[0], TL.approach[1]));
    sky(x, W, H_, t, { z: pull * (1 + 0.15 * ap), x: t * 10, y: -ap * 60 });
    const ein = eo(seg(t, TL.intro - 0.4, TL.intro + 0.8));
    const ER = 230 * (0.86 + 0.14 * ein), EX = W / 2, EY = lerp(1260, 1030, ein) + ap * 20;
    const my = lerp(lerp(-60, 250, eo(seg(t, TL.intro - 0.3, TL.intro + 0.7))), 470, ap), mr = lerp(44, 72, ap) * back(seg(t, TL.intro - 0.3, TL.intro + 0.5), 1.2);
    const mx = W / 2 + Math.sin(t * 0.7) * 6;
    // background planet drifting for depth
    planet(x, 640 - t * 3, 330 + ap * 30, 26, PL.coral, { glowA: 0.22 });
    moonGlow(x, mx, my, mr, 0.3 + 0.15 * ap);
    planet(x, mx, my, mr, PL.moon);
    const bulge = 0.015 + 0.13 * ap;
    earth(x, EX, EY, ER, { spin: t * 0.25, bulge, bulgeAng: -Math.PI / 2, t });

    // distance arrows (split around the number), counter
    const top = my + mr + 18, bot = EY - ER - 22 - bulge * ER * 1.1, mid = (top + bot) / 2;
    const da = eio(seg(t, TL.distArrow[0], TL.distArrow[1]));
    const gap = 48;
    arrow(x, line([W / 2, mid - gap], [W / 2, top]), da, '#7ff0ff', 9, { dots: true, a: 0.85 });
    arrow(x, line([W / 2, mid + gap], [W / 2, bot]), da, '#7ff0ff', 9, { dots: true, a: 0.85 });
    if (t > TL.distNum - 0.2) {
      const v = Math.round(lerp(384400, 192200, H.ease.inOut(seg(t, TL.approach[0], TL.approach[1]))) / 100) * 100;
      const land = seg(t, TL.half, TL.half + 0.35), pop = 1 + 0.2 * Math.sin(land * Math.PI) * (land > 0 ? 1 : 0);
      const ia = back(seg(t, TL.distNum - 0.2, TL.distNum + 0.15), 1.6);
      x.save(); x.translate(W / 2, mid); x.scale(ia * pop, ia * pop);
      text(x, v.toLocaleString('en-US') + ' km', 0, 0, 68, land > 0 ? C.yellow : '#ffffff');
      x.restore();
      if (land > 0) burst(x, W / 2, mid, land * 1.2, 41, 220);
    }
    // "away" pill on the Moon, then "half the distance" replaces it
    const aw = back(seg(t, TL.awayPill, TL.awayPill + 0.3)) * (1 - seg(t, TL.approach[0], TL.approach[0] + 0.25));
    pill(x, mx + mr + 120, my, 'Moon today', 30, { s: aw, bg: '#ffffff' });
    const hf = back(seg(t, TL.half + 0.1, TL.half + 0.4));
    pill(x, W / 2, mid - 92, 'half the distance', 30, { s: hf, bg: C.cyan });
    // "Tides x8" lands on the bulge
    const t8 = back(seg(t, TL.tides8, TL.tides8 + 0.3), 1.8);
    if (t8 > 0) {
      const px = W / 2 + 175, py = EY - ER - 40;
      glow(x, px, py, 110, C.yellow, 0.35 * t8);
      pill(x, px, py, 'tides ×8', 36, { s: t8, bg: C.yellow, ptr: true });
      arrow(x, [[px - 90, py + 20], [px - 120, py + 40], [px - 150, py + 50], [W / 2 + 40, EY - ER - bulge * ER * 0.9]], eio(seg(t, TL.tides8 + 0.1, TL.tides8 + 0.4)), C.yellow, 6, { dots: true });
    }

  }

  function exB(x, W, H_, t) {
    const fl = seg(t, TL.flood[0], TL.flood[1]), fe = eio(fl);
    const hitK = Math.max(0, 1 - Math.abs(t - TL.thousand - 0.15) / 0.75) * (t > TL.thousand ? 1 : 0);
    const shake = t > TL.thousand ? Math.sin(t * 61) * 10 * Math.max(0, 1 - (t - TL.thousand) / 0.45) : 0;
    x.save(); x.translate(shake, shake * 0.4);
    sky(x, W, H_, t, { x: 200 + t * 8, y: 40 });
    // horizon glow
    glow(x, W / 2, 1080, 620, '#6a4cff', 0.35);
    // "today" Moon: tiny, upper left
    const tm = back(seg(t, TL.todayPill - 0.3, TL.todayPill));
    planet(x, 112, 240, 22 * tm, PL.moon);
    pill(x, 112, 300, 'today', 28, { s: back(seg(t, TL.todayPill, TL.todayPill + 0.3)), ptr: 'up' });
    // the giant Moon rises
    const ri = back(seg(t, TL.rise[0], TL.rise[1]), 1.1);
    const MX = 420, MY = lerp(1150, 440, ri), MR = 240;
    moonGlow(x, MX, MY, MR, 0.32 + 0.25 * hitK);
    planet(x, MX, MY, MR, PL.moon);
    // city on the shore
    const G = 1085;
    for (const b of city(W)) {
      const top = G - b.h;
      x.fillStyle = b.c; rr(x, b.x, top, b.w, b.h + 40, 8); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.08)'; rr(x, b.x + 4, top + 4, b.w * 0.3, b.h, 6); x.fill();
      const q = H.rng(b.win);
      for (let wy = top + 18; wy < G - 20; wy += 30) for (let wx = b.x + 10; wx < b.x + b.w - 16; wx += 20) {
        if (!q.chance(0.55)) continue;
        x.fillStyle = q.chance(0.8) ? 'rgba(255,214,90,0.9)' : 'rgba(150,230,255,0.8)'; rr(x, wx, wy, 9, 13, 3); x.fill();
      }
    }
    // the sea rises with the Moon's pull
    const level = lerp(1125, 905, fe), amp = lerp(8, 26, fe) + 10 * hitK;
    water(x, W, H_, level, amp, t);

    // "10x bigger" label
    const tin = back(seg(t, TL.ten, TL.ten + 0.35), 1.6), tout = eio(seg(t, TL.tenOut[0], TL.tenOut[1]));
    if (tin > 0 && tout < 1) {
      x.save(); x.globalAlpha = 1 - tout; x.translate(W / 2, 790 - tout * 60); x.scale(tin, tin);
      text(x, '10× bigger', 0, 0, 92, C.yellow); text(x, 'if it were 10× closer', 0, 78, 36, '#bfe9ff', { w: 800 }); x.restore();
    }
    // pull arrow, Moon -> sea
    const pa = eio(seg(t, TL.pull[0], TL.pull[1]));
    arrow(x, line([MX, MY + MR + 16], [MX, level - 30]), pa, '#7ff0ff', 10, { dots: true, a: 0.9 * (1 - seg(t, TL.thousand - 0.3, TL.thousand)) });
    pill(x, MX + 110, (MY + MR + level) / 2, 'pull', 30, { s: back(seg(t, TL.pullPill, TL.pullPill + 0.3)) * (1 - seg(t, TL.thousand - 0.3, TL.thousand)), bg: C.cyan });
    // the key number
    if (t > TL.thousand - 0.05) {
      flare(x, W / 2, 770, hitK * 0.8, t);
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.thousand, TL.thousand + 0.35) * Math.PI);
      const s = back(seg(t, TL.thousand - 0.05, TL.thousand + 0.25), 1.6) * pop;
      x.save(); x.translate(W / 2, 760); x.scale(s, s); text(x, '×1,000', 0, 0, 132, C.yellow); x.restore();
      const ws = back(seg(t, TL.word, TL.word + 0.3));
      x.save(); x.translate(W / 2, 852); x.scale(ws, ws); text(x, 'stronger tides', 0, 0, 48, '#ffffff'); x.restore();
      burst(x, W / 2, 760, (t - TL.thousand) * 1.0, 97, 320);
    }
    x.restore();
    const flash = Math.max(0, 1 - Math.abs(t - (TL.thousand + 0.05)) / 0.25);
    if (flash > 0) { x.fillStyle = H.rgba('#fff6d0', 0.35 * flash); x.fillRect(0, 0, W, H_); }
  }

  // ================= SCENE C: quakes, the Roche limit, rings =================
  const EC = [360, 600], ER = 110, ROCHE = 2.9; // Roche limit ~2.9 Earth radii (~18,000 km)
  let PIECES = null;
  function pieces() {
    if (PIECES) return PIECES;
    const r = H.rng(808); PIECES = [];
    for (let i = 0; i < 64; i++) PIECES.push({ da: r.range(-0.18, 0.18), dr: r.range(-0.6, 0.6), spread: r.range(-Math.PI, Math.PI), ring: r.range(1.5, 2.3), s: r.range(4, 11), c: r.pick([PL.moon.c, PL.moon.c, ['#ffffff', '#cfc9f5', '#6a5fb0']]) });
    return PIECES;
  }
  const moonTh = (t) => -2.2 + (t - TL.cut2) * 0.12 + 0.45 * eio(seg(t, TL.fall[0], TL.fall[1]));
  const moonD = (t) => lerp(470, 300, eio(seg(t, TL.fall[0], TL.fall[1])));
  function exC(x, W, H_, t) {
    const zIn = eio(seg(t, TL.zoomC[0], TL.zoomC[1]));
    const tl = eio(seg(t, TL.tilt[0], TL.tilt[1])), yf = lerp(1, 0.24, tl), rot = -0.18 * tl;
    const tk = eio(seg(t, TL.take[0], TL.take[1]));
    const s = lerp(1.8, 1, zIn) * lerp(1, 1.35, eio(seg(t, TL.tilt[0], TL.ringIn[1])));
    sky(x, W, H_, t, { x: 500 + t * 12, y: 60 - tk * 240, z: s });
    const cx = EC[0], cy = lerp(EC[1], 1290, tk), Er = lerp(ER * s, 520, tk);
    const quake = seg(t, TL.quake[0], TL.quake[1]) * (1 - seg(t, TL.quakeOut[0], TL.quakeOut[1] + 0.6));
    const W2S = (wx, wy) => { // world (Earth-centred, face-on) -> screen, with camera tilt
      const yy = wy * yf; const c = Math.cos(rot), sn = Math.sin(rot);
      return [cx + (wx * c - yy * sn) * s, cy + (wx * sn + yy * c) * s];
    };

    // ring + debris setup
    const brk = t >= TL.brk, ringA = seg(t, TL.ringIn[0], TL.ringIn[1]) * (1 - seg(t, TL.take[0], TL.take[0] + 0.5));
    const thB = moonTh(TL.brk), dB = moonD(TL.brk);
    const sp = eio(seg(t, TL.spread[0], TL.spread[1])), rad = eio(seg(t, TL.spread[0] + 0.2, TL.spread[1] - 0.2));
    const pieceA = (1 - seg(t, TL.ringIn[1] - 0.2, TL.ringIn[1] + 0.6) * 0.65) * (1 - seg(t, TL.take[0], TL.take[0] + 0.5));
    const P = brk ? pieces().map((p) => {
      const a = thB + lerp(p.da, p.spread, sp) + (t - TL.brk) * 0.3, d = lerp(dB + p.dr * 34, p.ring * ER, rad);
      const wx = Math.cos(a) * d, wy = Math.sin(a) * d, [sx, sy] = W2S(wx, wy);
      return { sx, sy, back: Math.sin(a) < 0 && tl > 0.3, p };
    }) : [];
    const ringBands = (half) => {
      if (ringA <= 0) return;
      x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s * yf); x.globalAlpha *= ringA;
      x.beginPath(); if (half === 'back') x.rect(-400, -400, 800, 400); else x.rect(-400, 0, 800, 400); x.clip();
      for (const [f0, f1, col, al] of [[1.48, 1.64, '#cfc9f5', 0.75], [1.68, 1.96, '#a7a2d8', 0.85], [2.0, 2.1, '#e8e6ff', 0.7], [2.14, 2.34, '#8f86cc', 0.6]]) {
        x.beginPath(); x.arc(0, 0, ER * f1, 0, TAU); x.arc(0, 0, ER * f0, 0, TAU, true);
        x.fillStyle = H.rgba(col, al * (half === 'back' ? 0.75 : 1)); x.fill();
      }
      x.restore();
    };
    const drawPieces = (bk) => { if (pieceA <= 0) return; x.save(); x.globalAlpha *= pieceA; for (const q of P) if (q.back === bk) ball(x, q.sx, q.sy, q.p.s * Math.min(s, 1.4), q.p.c, { sha: 0.45 }); x.restore(); };

    // Roche limit circle
    const ro = eio(seg(t, TL.roche[0], TL.roche[1])), roA = (1 - seg(t, TL.tilt[0], TL.tilt[0] + 0.5));
    if (ro > 0 && roA > 0) {
      const crossK = Math.max(0, 1 - Math.abs(t - TL.cross) / 0.5);
      x.save(); x.globalAlpha *= roA; x.translate(cx, cy); x.rotate(rot); x.scale(1, yf);
      x.strokeStyle = H.rgba(H.mix('#ff8fb8', '#ff3b5c', crossK)); x.lineWidth = 8; x.lineCap = 'round'; x.setLineDash([0.01, 16]);
      x.beginPath(); x.arc(0, 0, ROCHE * ER * s, -Math.PI / 2, -Math.PI / 2 + TAU * ro); x.stroke(); x.setLineDash([]);
      x.restore();
      if (crossK > 0) glow(x, cx, cy, ROCHE * ER * s * 1.2, C.red, 0.18 * crossK);
    }

    ringBands('back'); drawPieces(true);
    earth(x, cx, cy, Er, { spin: t * 0.25, quake, t, bulge: (1 - tk) * lerp(0.05, 0.2, seg(t, TL.fall[0], TL.brk)) * (brk ? 1 - seg(t, TL.brk, TL.brk + 1) : 1), bulgeAng: moonTh(Math.min(t, TL.brk)) + rot });
    ringBands('front'); drawPieces(false);

    // the Moon: orbits, falls inward, stretches, cracks, breaks
    if (!brk) {
      const th = moonTh(t), d = moonD(t), [mx, my] = W2S(Math.cos(th) * d, Math.sin(th) * d), mr = 30 * s;
      const st = eio(seg(t, TL.stretch[0], TL.stretch[1]));
      moonGlow(x, mx, my, mr, 0.3);
      x.save(); x.translate(mx, my); x.rotate(th); x.scale(1 + 0.6 * st, 1 - 0.18 * st); x.rotate(-th);
      planet(x, 0, 0, mr, PL.moon, { inner: () => {
        const ck = seg(t, TL.crack, TL.brk);
        if (ck <= 0) return;
        x.lineCap = 'round'; x.lineJoin = 'round';
        const q = H.rng(17);
        for (let i = 0; i < 4; i++) {
          let px = q.range(-0.4, 0.4) * mr, py = q.range(-0.6, 0.6) * mr, a = th + Math.PI / 2 + q.range(-0.4, 0.4);
          x.strokeStyle = H.rgba('#fff6d0', ck); x.lineWidth = mr * 0.07; x.beginPath(); x.moveTo(px, py);
          for (let k = 0; k < 3; k++) { a += q.range(-0.7, 0.7); px += Math.cos(a) * mr * 0.35 * ck; py += Math.sin(a) * mr * 0.35 * ck; x.lineTo(px, py); }
          x.stroke();
        }
      } });
      x.restore();
      if (t > TL.crack) glow(x, mx, my, mr * 2.4, '#fff2c0', 0.4 * seg(t, TL.crack, TL.brk));
    } else {
      const [bx, by] = W2S(Math.cos(thB) * dB, Math.sin(thB) * dB);
      burst(x, bx, by, (t - TL.brk) * 1.1, 55, 150);
      const fk = Math.max(0, 1 - (t - TL.brk) / 0.45);
      glow(x, bx, by, 160, '#fff6d0', 0.8 * fk);
    }

    // labels
    const qp = back(seg(t, TL.quakePill, TL.quakePill + 0.3)) * (1 - seg(t, TL.quakeOut[0], TL.quakeOut[1]));
    pill(x, W / 2, 300, 'quakes & volcanoes', 36, { s: qp, bg: C.orange[0] });
    const rp = back(seg(t, TL.rochePill, TL.rochePill + 0.3)) * roA * (COLD ? 0 : 1);
    pill(x, W / 2, 232, 'Roche limit', 34, { s: rp, bg: '#ff8fb8', fg: '#ffffff' });
    const rn = back(seg(t, TL.rocheNum, TL.rocheNum + 0.3), 1.6) * roA * (COLD ? 0 : 1);
    x.save(); x.translate(W / 2, 150); x.scale(rn, rn); text(x, '18,000 km', 0, 0, 76, '#ffffff'); x.restore();
    // rings reveal
    const rg = back(seg(t, TL.rings, TL.rings + 0.35), 1.6) * (1 - seg(t, TL.take[0], TL.take[0] + 0.35));
    if (rg > 0) {
      flare(x, W / 2, 300, Math.max(0, 1 - Math.abs(t - TL.rings - 0.2) / 0.8) * 0.6, t);
      x.save(); x.translate(W / 2, 290); x.scale(rg, rg); text(x, 'Earth gets', 0, -46, 64, '#ffffff'); text(x, 'RINGS!', 0, 40, 100, C.yellow); x.restore();
      burst(x, W / 2, 300, (t - TL.rings) * 1.1, 23, 300);
    }

    // takeaway: the real Moon pops back and drifts away
    if (t > TL.take[0]) {
      const ms = back(seg(t, TL.reform, TL.reform + 0.4), 1.4), my2 = lerp(560, 520, seg(t, TL.reform, TL.D));
      moonGlow(x, W / 2, my2, 46 * ms, 0.35);
      planet(x, W / 2, my2, 46 * ms, PL.moon);
      arrow(x, line([W / 2, my2 - 66], [W / 2, 340]), eio(seg(t, TL.awayArrow[0], TL.awayArrow[1])), '#7ff0ff', 10, { dots: true });
      pill(x, W / 2, 660, '+3.8 cm every year', 32, { s: back(seg(t, TL.cmPill, TL.cmPill + 0.3)), bg: C.cyan });
      const l1 = back(seg(t, TL.line1, TL.line1 + 0.4)), l2 = back(seg(t, TL.line2, TL.line2 + 0.4));
      x.save(); x.translate(W / 2, 175); x.scale(l1, l1); text(x, 'Luckily, the Moon', 0, 0, 58, '#ffffff'); x.restore();
      x.save(); x.translate(W / 2, 252); x.scale(l2, l2); text(x, 'is drifting AWAY', 0, 0, 58, C.yellow); x.restore();
      if (t > TL.line2 + 0.4) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 660), q.range(120, 420), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.line2 + 0.4, TL.line2 + 0.8)); }
    }
  }


  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 1000, -1000, sw);
    if (t < TL.sweep[0] || (t < TL.sweep[1] && spx > W / 2)) exA(x, W, H_, t);
    else if (t < TL.cut2) exB(x, W, H_, t);
    else exC(x, W, H_, t);
    if (sw > 0 && sw < 1) { moonGlow(x, spx, 640, 900, 0.4); planet(x, spx, 640 + (sw - 0.5) * 140, 900, PL.moon); }
    FLAT.whiteout(x, W, H_, seg(t, TL.white[0], TL.cut2) * (1 - seg(t, TL.cut2, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const hz = k.hz, { when, backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong } = S;
    

    // 2 DISTANCE
    tocksAlong(TL.distArrow[0], TL.distArrow[1], 5, 520, 40, 0.35, 0);
    pluck(backPeak(TL.distNum - 0.2, TL.distNum + 0.15, 1.6), 'E4', 1.0, 0);
    pluck(backPeak(TL.awayPill, TL.awayPill + 0.3), 'C5', 0.6, pan(560), true);

    // 3 HALFWAY: the counter runs down, the Moon slides in
    air(TL.approach[0], TL.approach[1] - TL.approach[0], 1600, 0.8, 0, 0.5);
    for (let tt = TL.approach[0], lastB = 38, lastT = -1; tt < TL.approach[1] - 0.03; tt += 1 / 120) {
      const v = lerp(384400, 192200, eio(seg(tt, TL.approach[0], TL.approach[1]))), b = Math.floor(v / 10000);
      if (b !== lastB && tt - lastT >= 1 / 11) { k.play('tock', tt, { f: 900 - (b - 19) * 12, gain: 0.45, pan: 0, minor: true }); lastB = b; lastT = tt; }
    }
    pluck(TL.half, 'A3', 1.2, -0.1); pluck(TL.half + 0.07, 'E4', 1.0, 0); pluck(TL.half + 0.14, 'A4', 0.8, 0.1);
    pluck(backPeak(TL.half + 0.1, TL.half + 0.4), 'C5', 0.55, 0, true);
    boop(backPeak(TL.tides8, TL.tides8 + 0.3, 1.8), 520, 1.0, pan(535), false);
    tocksAlong(TL.tides8 + 0.1, TL.tides8 + 0.4, 3, 700, -60, 0.25, pan(480));

    // sweep: the Moon rushes past the camera
    air(TL.sweep[0], TL.sweep[1] - TL.sweep[0], 1300, 1.3, 0, 0.5);
    k.noise(TL.sweep[0] + 0.1, { dur: 0.8, color: 'brown', filter: 'lowpass', f: 260, gain: 0.32, a: 0.35, verb: 0.2 });
    k.tone(TL.sweep[0] + 0.1, { f: [[0, 70], [0.4, 58], [0.8, 46]], dur: 0.8, gain: 0.16, a: 0.3 });

    // 4 SHORE: sea ambience, the giant Moon rises
    k.noise(TL.sweep[1] - 0.1, { dur: TL.white[1] - TL.sweep[1], color: 'brown', filter: 'lowpass', f: 420, gain: 0.07, a: 0.5, hold: TL.white[1] - TL.sweep[1] - 1.2, bus: 'amb' });
    k.noise(TL.sweep[1] - 0.1, { dur: TL.white[1] - TL.sweep[1], color: 'pink', filter: 'bandpass', f: 900, q: 0.4, gain: 0.025, a: 0.5, hold: TL.white[1] - TL.sweep[1] - 1.2, bus: 'amb' });
    air(TL.rise[0], 1.1, 900, 0.5, pan(420), 0.7, true);
    boop(backPeak(TL.todayPill - 0.3, TL.todayPill), 340, 0.8, pan(112));
    pluck(backPeak(TL.todayPill, TL.todayPill + 0.3), 'G4', 0.5, pan(112), true);
    pluck(backPeak(TL.ten, TL.ten + 0.35, 1.6), 'C4', 1.0, 0); pluck(backPeak(TL.ten, TL.ten + 0.35, 1.6) + 0.07, 'G4', 0.8, 0.05);

    // 5 TIDES x1,000
    k.play('swish', TL.tenOut[0], { gain: 0.5, minor: true });
    tocksAlong(TL.pull[0], TL.pull[1], 5, 760, -50, 0.35, pan(420));
    pluck(backPeak(TL.pullPill, TL.pullPill + 0.3), 'D4', 0.7, pan(530), true);
    // water swells up, then a riser into the hit
    k.noise(TL.flood[0], { dur: TL.flood[1] - TL.flood[0] + 0.3, color: 'brown', filter: 'lowpass', f: [[0, 260], [1.4, 900]], gain: 0.3, a: 1.2, verb: 0.2 });
    k.noise(TL.thousand - 0.8, { dur: 0.85, color: 'pink', filter: 'bandpass', f: [[0, 250], [0.8, 1800]], q: 0.8, gain: 0.24, a: 0.78, verb: 0.3 });
    k.tone(TL.thousand - 0.8, { f: [[0, 110], [0.8, 220]], type: 'triangle', dur: 0.82, gain: 0.08, a: 0.75 });
    k.play('impact', TL.thousand, { gain: 0.85 });
    chord(TL.thousand, ['A2', 'E3', 'A3', 'C4', 'E4', 'B4'], 1.6, 2.2);
    shimmer(TL.thousand + 0.08, ['E5', 'A5', 'C6', 'E5', 'B5'], 0.8, 0.2);
    pluck(backPeak(TL.word, TL.word + 0.3), 'E4', 0.7, 0, true);

    // whiteout back to space
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.2, 0, 0.55);
    k.tone(TL.white[0], { f: [[0, 110], [0.4, 330]], type: 'triangle', dur: 0.45, gain: 0.07, a: 0.38 });
    chord(TL.cut2, ['C3', 'G3', 'E4'], 0.6, 1.4);

    // 6 QUAKES & VOLCANOES
    k.play('thud', TL.quake[0] + 0.05, { f: 80, gain: 0.55 });
    k.noise(TL.quake[0] + 0.05, { dur: 1.4, color: 'brown', filter: 'lowpass', f: 180, gain: 0.22, a: 0.1, hold: 0.6 });
    { const r = H.rng(66); for (let tt = TL.quake[0] + 0.1; tt < 17.0; tt += 0.09 + r() * 0.07) k.play('tick', tt, { f: 1400 + r() * 1600, gain: 0.35 * (1 - (tt - 15.8) / 1.6), pan: (r() - 0.5) * 0.5, minor: true }); }
    for (let i = 0; i < 5; i++) k.noise(TL.quake[0] + 0.12 + i * 0.13, { dur: 0.3, color: 'brown', filter: 'bandpass', f: 500, q: 1, gain: 0.14, a: 0.02, pan: (i - 2) * 0.15, minor: true });
    pluck(backPeak(TL.quakePill, TL.quakePill + 0.3), 'D4', 0.9, 0);
    k.play('swish', TL.quakeOut[0], { gain: 0.4, minor: true });

    // 7 ROCHE LIMIT
    air(TL.zoomC[0], TL.zoomC[1] - TL.zoomC[0], 900, 0.6, 0, 0.5, true);
    tocksAlong(TL.roche[0], TL.roche[1], 6, 520, 35, 0.3, 0);
    pluck(backPeak(TL.rochePill, TL.rochePill + 0.3), 'E4', 0.9, 0);
    pluck(backPeak(TL.rocheNum, TL.rocheNum + 0.3, 1.6), 'A3', 1.0, 0); pluck(backPeak(TL.rocheNum, TL.rocheNum + 0.3, 1.6) + 0.08, 'E4', 0.8, 0);
    for (let tt = 19.5; tt < TL.cross; tt += 0.4) k.tone(tt, { f: 'E2', type: 'triangle', dur: 0.3, gain: 0.12, a: 0.02, filter: 'lowpass', f2: 500 });

    // 8 TORN APART
    k.play('riser', TL.stretch[0], { dur: TL.brk - TL.stretch[0], gain: 0.8 });
    k.tone(TL.cross, { f: 'F#3', type: 'triangle', dur: 0.3, gain: 0.18, hold: 0.1, filter: 'lowpass', f2: 900 });
    { const r = H.rng(70); for (let tt = TL.crack; tt < TL.brk - 0.02; tt += 0.05 + r() * 0.04) k.play('tick', tt, { f: 2500 + r() * 2000, gain: 0.4, pan: pan(390), minor: true }); }
    k.play('impact', TL.brk, { gain: 0.8, pan: pan(390) });
    k.noise(TL.brk, { dur: 0.5, filter: 'highpass', f: [[0, 3000], [0.5, 900]], gain: 0.12, a: 0.005, verb: 0.3 });

    // 9 RINGS
    air(TL.spread[0] + 0.2, 1.6, 1800, 0.7, 0.2, 0.5);
    air(TL.tilt[0], TL.tilt[1] - TL.tilt[0], 1100, 0.5, -0.2, 0.5, true);
    k.play('sparkle', TL.ringIn[0] + 0.2, { gain: 0.8, n: 5 });
    k.play('sparkle', TL.ringIn[0] + 0.8, { gain: 0.8, n: 5 });
    const rp = backPeak(TL.rings, TL.rings + 0.35, 1.6);
    chord(rp, ['C3', 'G3', 'C4', 'E4', 'G4'], 1.3, 2.0);
    pluck(rp, 'C5', 0.9, 0); pluck(rp + 0.09, 'G5', 0.7, 0.1);
    k.play('sparkle', rp + 0.05, { gain: 1, n: 8 });
    pluck(backPeak(TL.rings + 0.3, TL.rings + 0.6), 'E4', 0.6, 0, true);

    // 10 TAKEAWAY
    air(TL.take[0], TL.take[1] - TL.take[0], 1000, 0.6, 0, 0.5, true);
    boop(backPeak(TL.reform, TL.reform + 0.4, 1.4), 400, 1.0, 0, false);
    pluck(backPeak(TL.line1, TL.line1 + 0.4), 'E4', 0.85, 0);
    const l2 = backPeak(TL.line2, TL.line2 + 0.4);
    chord(l2, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.1, 2.4); pluck(l2, 'C4', 1.0, 0);
    tocksAlong(TL.awayArrow[0], TL.awayArrow[1], 5, 600, 70, 0.3, 0);
    pluck(backPeak(TL.cmPill, TL.cmPill + 0.3), 'G4', 0.7, 0, true);
  }

  SCENE({
    init,
    // cold open: the hook line plays over the Moon being torn apart, in slow motion, then rewinds to the start
    cold: () => TL.brk - 0.2,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
