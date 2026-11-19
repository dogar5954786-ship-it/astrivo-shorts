// "Why Is Earth Tilted?" — flat style. Built from flat/examples/moon-closer.
// Scene A: big Earth leaning 23.5°, then back in time: baby Earth, rocks rain in, a giant planet crashes and tips it over.
// Scene B (planet sweep): the Sun and Earth's orbit: summer side, winter side, January = closest (key hit), tilt wins.
// Scene C (whiteout): back to the big tilted Earth (loops into the crash cold open).
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, earth, trail, shake, sun, streaks, badge, rock } = FLAT;
  let TL = null, COLD = false;
  const DEG = Math.PI / 180, TILT = 23.5 * DEG;

  // ---- scene A world ----
  const EX = 360, EY = 600, R = 210;
  const IA = -2.25, IDX = Math.cos(IA), IDY = Math.sin(IA);   // the giant impactor comes from the upper left
  const IR = 100, IDC = R + IR * 0.55;
  const ICP = [EX + IDX * R * 0.98, EY + IDY * R * 0.98];

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      intro: s(1), tipped: w('tipped', 1), num: w('23.5', 1),
      why: s(2), long: w('long', 2), baby: w('baby', 2), rocks: [w('hit', 2), w('huge', 2) + 0.1, w('rocks', 2)],
      giant: w('giant', 3), crash: w('crash', 3) + 0.05, side: w('sideways', 3), never: w('never', 3),
      sweep: [s(4) - 0.25, s(4) + 0.5], cutB: s(4) + 0.12, seasons: w('seasons', 4),
      tips: w('tips', 5), toward: w('toward', 5), straight: w('straight', 5), summer: w('summer', 5),
      move: [s(6) - 0.2, w('away', 6) + 0.2], thin: w('thin', 6), winter: w('winter', 6),
      push: [s(7), s(7) + 0.9], jan: w('january', 7), big: w('5,000,000', 7), closer: w('closer', 7), july: w('july', 7),
      north: w('winter', 8), dist: w('distance', 8), tilt: w('tilt', 8),
      white: [s(9) - 0.4, s(9) + 0.35], cutC: s(9), one: w('one', 9), you: w('summer', 9),
      D: T.D,
    };
  }

  // tilt of Earth in scene A at time t (radians, + = top leans right)
  function tiltA(t) {
    if (t < TL.why) return TILT;
    const up = 1 - eio(seg(t, TL.why, TL.why + 0.6));
    if (t < TL.crash) return TILT * up;
    const u = seg(t, TL.crash, TL.side + 0.25);
    const wob = Math.sin((t - TL.crash) * 9) * 6 * DEG * Math.max(0, 1 - (t - TL.crash) / 1.6);
    return TILT * back(u, 2.2) + wob;
  }

  // Earth drawn tilted: rotate the canvas around its centre, then the axis line + poles follow
  function tiltedEarth(x, cx, cy, r, ang, t, o = {}) {
    x.save(); x.translate(cx, cy); x.rotate(ang);
    earth(x, 0, 0, r, { spin: t * 0.3, t, quake: o.quake || 0, glowA: o.glowA });
    if (o.hot > 0) {
      x.save(); x.beginPath(); x.arc(0, 0, r, 0, TAU); x.clip();
      const g = x.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.3);
      g.addColorStop(0, H.rgba('#ffd27a', 0.9 * o.hot)); g.addColorStop(0.45, H.rgba('#ff8d3f', 0.85 * o.hot)); g.addColorStop(1, H.rgba('#a8242a', 0.92 * o.hot));
      x.fillStyle = g; x.fillRect(-r, -r, 2 * r, 2 * r);
      const q = H.rng(31);
      for (let i = 0; i < 12; i++) { const a = q.range(0, TAU) + t * 0.2, d = q.range(0.1, 0.85) * r, r2 = q.range(0.08, 0.2) * r; x.fillStyle = H.rgba('#6a1420', 0.3 * o.hot); x.beginPath(); x.ellipse(Math.cos(a) * d, Math.sin(a) * d, r2 * 1.4, r2, a, 0, TAU); x.fill(); }
      x.restore();
      FLAT.atmo(x, 0, 0, r, [255, 170, 110], 0.9 * o.hot);
    }
    const ax = o.axis == null ? 1 : o.axis;
    if (ax > 0) {
      const ext = r * 0.42;
      x.save(); x.globalAlpha *= ax; x.lineCap = 'round';
      glow(x, 0, -r - ext * 0.5, r * 0.3, o.axisCol || '#ffffff', 0.25 * (o.axisGlow || 0));
      x.strokeStyle = o.axisCol || '#ffffff'; x.lineWidth = Math.max(4, r * 0.035);
      x.beginPath(); x.moveTo(0, -r - ext * ax); x.lineTo(0, -r + 2); x.stroke();
      x.beginPath(); x.moveTo(0, r - 2); x.lineTo(0, r + ext * ax); x.stroke();
      x.fillStyle = o.axisCol || '#ffffff'; x.beginPath(); x.arc(0, -r - ext * ax, Math.max(5, r * 0.045), 0, TAU); x.fill();
      x.restore();
    }
    x.restore();
  }

  // angle marker: dashed vertical + arc from vertical to the axis
  function angleMark(x, cx, cy, r, ang, k, col = C.yellow) {
    if (k <= 0) return;
    x.save(); x.globalAlpha *= k; x.lineCap = 'round';
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 5; x.setLineDash([0.01, 14]);
    x.beginPath(); x.moveTo(cx, cy - r * 0.2); x.lineTo(cx, cy - r * 1.45); x.stroke(); x.setLineDash([]);
    x.strokeStyle = col; x.lineWidth = 8;
    x.beginPath(); x.arc(cx, cy, r * 1.25, -Math.PI / 2, -Math.PI / 2 + ang * k); x.stroke();
    x.restore();
  }

  // ---- the small rocks (segment 2) ----
  const ROCKS = [[-0.6, 1], [-2.6, 2], [0.5, 3]];  // approach angle, seed
  function rockAt(i, t) {
    const tHit = TL.rocks[i], u = seg(t, tHit - 0.7, tHit), a = ROCKS[i][0];
    const d = lerp(R + 520, R + 10, Math.pow(u, 1.8));
    return [EX + Math.cos(a) * d, EY + Math.sin(a) * d, a, u];
  }
  // ---- the giant impactor (segment 3) ----
  function impAt(t) {
    const u = seg(t, TL.giant - 0.5, TL.crash), e = Math.pow(u, 2);
    const d = lerp(820, IDC, e), side = (1 - e) * 80;
    return [EX + IDX * d - IDY * side, EY + IDY * d + IDX * side];
  }

  // ================= SCENE A =================
  function exA(x, W, H_, t) {
    const zin = 1 + 0.5 * (1 - eo(seg(t, TL.intro - 0.4, TL.intro + 0.8)));
    const z = zin * (1 + 0.04 * seg(t, TL.intro, TL.sweep[0])) + 0.01 * Math.sin(t * 0.9);
    const sh = shake(t, TL.crash, 22, 0.6) + TL.rocks.reduce((a, r) => a + shake(t, r, 7, 0.3), 0);
    sky(x, W, H_, t, { z, x: t * 9, y: 0 });
    x.save(); x.translate(EX + sh, EY + sh * 0.5); x.scale(z, z); x.translate(-EX, -EY);

    const hot = eio(seg(t, TL.why + 0.1, TL.baby + 0.3)) * (1 - 0.65 * seg(t, TL.crash + 0.6, TL.sweep[0]));
    const ang = tiltA(t);
    const axisK = t < TL.why ? eo(seg(t, TL.intro - 0.3, TL.intro + 0.4)) : (t < TL.crash ? 1 - seg(t, TL.why, TL.why + 0.4) * 0.6 : 0.4 + 0.6 * seg(t, TL.crash + 0.2, TL.side));
    const neverK = seg(t, TL.never, TL.never + 0.3);

    // giant impactor behind Earth? no: in front, coming from upper left
    tiltedEarth(x, EX, EY, R, ang, t, { hot, axis: axisK, axisGlow: neverK, axisCol: neverK > 0 ? H.rgba(H.mix('#ffffff', C.yellow, neverK)) : '#ffffff', quake: cl(seg(t, TL.crash, TL.crash + 0.5) * (1 - seg(t, TL.crash + 1, TL.crash + 2.5))) });

    // angle marker in segment 1 and again after the crash
    const am1 = eo(seg(t, TL.tipped, TL.tipped + 0.5)) * (1 - seg(t, TL.why, TL.why + 0.3));
    const am2 = COLD ? 0 : eo(seg(t, TL.never, TL.never + 0.5));
    angleMark(x, EX, EY, R, ang, Math.max(am1, am2));

    // small rocks
    for (let i = 0; i < 3; i++) {
      const tHit = TL.rocks[i];
      if (t > tHit - 0.7 && t < tHit) {
        const [px, py, a] = rockAt(i, t);
        trail(x, px, py, a + Math.PI, 160, 40, '#ffb070', 0.9);
        glow(x, px, py, 50, '#ff8d3f', 0.4);
        rock(x, px, py, 26, ROCKS[i][1], t * 3);
      } else if (t >= tHit && t < tHit + 0.9) {
        const bx = EX + Math.cos(ROCKS[i][0]) * R, by = EY + Math.sin(ROCKS[i][0]) * R, fk = 1 - (t - tHit) / 0.9;
        glow(x, bx, by, 120, '#ffd27a', 0.8 * fk);
        burst(x, bx, by, (t - tHit) * 1.2, 30 + i, 140);
      }
    }

    // giant impactor
    if (t > TL.giant - 0.5 && t < TL.crash) {
      const [px, py] = impAt(t);
      trail(x, px, py, Math.atan2(EY - py, EX - px), 260 + 200 * seg(t, TL.giant - 0.5, TL.crash), IR * 1.5, '#ffb070', 0.85);
      planet(x, px, py, IR, PL.mars, { glowA: 0.35 });
    } else if (t >= TL.crash) {
      const u = eo(seg(t, TL.crash, TL.crash + 0.9));
      if (u < 1) {
        const d = lerp(IDC, R * 0.75, u), r = IR * (1 - u);
        x.save(); x.translate(EX + IDX * d, EY + IDY * d); x.rotate(IA); x.scale(1 - 0.45 * u, 1 + 0.25 * u);
        planet(x, 0, 0, r, PL.mars, { glowA: 0.2 }); x.restore();
      }
      const fk = Math.max(0, 1 - (t - TL.crash) / 1.4);
      glow(x, ICP[0], ICP[1], 420 * (0.5 + 0.5 * eo(seg(t, TL.crash, TL.crash + 0.5))), '#ff8d3f', 0.75 * fk);
      glow(x, ICP[0], ICP[1], 170, '#fff6d0', 0.95 * fk);
      flare(x, ICP[0], ICP[1], fk * 0.9, t);
      burst(x, ICP[0], ICP[1], (t - TL.crash) * 0.9, 77, 380);
      burst(x, ICP[0], ICP[1], (t - TL.crash) * 0.9 - 0.15, 78, 260);
      // tipping arrow around the top
      const ta = eio(seg(t, TL.crash + 0.1, TL.side + 0.2)) * (1 - seg(t, TL.never, TL.never + 0.3));
      if (!COLD && ta > 0) {
        const P = [[EX - 40, EY - R - 120], [EX + 30, EY - R - 150], [EX + 110, EY - R - 130], [EX + 160, EY - R - 70]];
        arrow(x, P, ta, C.yellow, 10, { dots: true });
      }
    }
    x.restore();

    // labels (screen space)
    if (t > TL.num - 0.05 && t < TL.why + 0.3) {
      const out = seg(t, TL.why, TL.why + 0.25);
      x.save(); x.globalAlpha = 1 - out;
      FLAT.bigNumber(x, '23.5°', 560, 250, 92, t, TL.num, { seed: 11, spread: 200 });
      x.restore();
    }
    pill(x, 230, 230, 'tilted', 34, { s: back(seg(t, TL.tipped, TL.tipped + 0.3)) * (1 - seg(t, TL.why, TL.why + 0.25)), bg: '#ffffff' });
    const lp = back(seg(t, TL.long, TL.long + 0.3)) * (1 - seg(t, TL.giant - 0.4, TL.giant - 0.1));
    pill(x, W / 2, 200, '4.5 billion years ago', 36, { s: lp, bg: C.orange[0], fg: '#ffffff' });
    const bp = back(seg(t, TL.baby, TL.baby + 0.3)) * (1 - seg(t, TL.giant - 0.4, TL.giant - 0.1));
    pill(x, W / 2, 870, 'baby Earth', 34, { s: bp, bg: '#ffffff', ptr: 'up' });
    if (!COLD && t > TL.never - 0.05) {
      x.save(); x.globalAlpha = 1 - seg(t, TL.sweep[0], TL.sweep[0] + 0.2);
      FLAT.bigNumber(x, '23.5°', 560, 250, 92, t, TL.never, { seed: 12, spread: 200 });
      x.restore();
      pill(x, 220, 240, 'stuck!', 36, { s: back(seg(t, TL.never + 0.3, TL.never + 0.6)), bg: C.yellow });
    }
  }

  // ================= SCENE B: the Sun and the orbit =================
  const SX = 345, SY = 580, ORX = 205, ORY = 150;
  function earthTh(t) {   // orbit angle: PI = left (summer for the north), 0 = right (winter for the north)
    const m = eio(seg(t, TL.move[0], TL.move[1]));
    return lerp(Math.PI, 2 * Math.PI, m);   // moves along the front (bottom) of the orbit
  }
  function exB(x, W, H_, t) {
    const pk = eio(seg(t, TL.push[0], TL.push[1])) * (1 - eio(seg(t, TL.north + 0.6, TL.white[0])));
    const zin = 1 + 0.4 * (1 - eo(seg(t, TL.cutB - 0.2, TL.cutB + 0.8)));
    const z = zin * (1 + 0.08 * pk), fx = lerp(SX, 385, pk);
    const sh = shake(t, TL.big, 16, 0.5);
    sky(x, W, H_, t, { z, x: 300 + t * 10, y: 40 });
    x.save(); x.translate(SX + sh, SY + sh * 0.4); x.scale(z, z); x.translate(-fx, -SY);

    const th = earthTh(t), ER = 78;
    const ex = SX + Math.cos(th) * ORX, ey = SY - Math.sin(th) * ORY;  // th in PI..2PI -> bottom half (sin<0 -> ey > SY)
    // orbit ring (dotted), draws on after the cut
    const od = eio(seg(t, TL.cutB, TL.seasons + 0.4));
    x.save(); x.strokeStyle = 'rgba(200,220,255,0.55)'; x.lineWidth = 5; x.lineCap = 'round'; x.setLineDash([0.01, 16]);
    x.beginPath(); x.ellipse(SX, SY, ORX, ORY, 0, Math.PI, Math.PI + TAU * od); x.stroke(); x.setLineDash([]); x.restore();

    // July ghost (left) during the key hit
    const jg = seg(t, TL.push[0], TL.push[1]) * (1 - seg(t, TL.north + 0.6, TL.white[0]));
    if (jg > 0) {
      x.save(); x.globalAlpha = 0.45 * jg; tiltedEarth(x, SX - ORX, SY, ER, TILT, t, { glowA: 0.1, axis: 0.8 }); x.restore();
    }

    // the Sun
    const sIn = back(seg(t, TL.cutB - 0.1, TL.cutB + 0.4), 1.4);
    sun(x, SX, SY, 92 * sIn, t);

    // sunlight onto Earth
    const ray = seg(t, TL.toward, TL.toward + 0.4) * (1 - seg(t, TL.move[0], TL.move[0] + 0.3)) + seg(t, TL.thin - 0.3, TL.thin) * (1 - seg(t, TL.push[0], TL.push[0] + 0.3));
    if (ray > 0) {
      const thin = t > TL.move[0];
      const A = [SX + Math.sign(ex - SX) * 100, SY], B = [ex - Math.sign(ex - SX) * ER * 0.6, ey];
      streaks(x, A, B, t, { n: thin ? 14 : 26, width: thin ? 150 : 90, col: thin ? '#ffe9b0' : '#ffd23f', a: ray * (thin ? 0.55 : 1), speed: 0.9, seed: thin ? 21 : 20 });
    }

    // Earth
    const eIn = back(seg(t, TL.cutB, TL.cutB + 0.45), 1.6);
    const sumK = seg(t, TL.straight, TL.straight + 0.4) * (1 - seg(t, TL.move[0], TL.move[0] + 0.3));
    const winK = seg(t, TL.thin, TL.thin + 0.4) * (1 - seg(t, TL.white[0] - 0.3, TL.white[0]));
    if (sumK > 0) glow(x, ex + Math.sin(TILT) * ER * 0.5, ey - ER * 0.5, ER * 1.4, C.yellow, 0.6 * sumK);
    const tipAx = seg(t, TL.tips, TL.tips + 0.3) * (1 - seg(t, TL.move[0], TL.move[0] + 0.2)) + seg(t, TL.move[1] - 0.2, TL.move[1]) * (1 - seg(t, TL.push[0], TL.push[0] + 0.3)) + seg(t, TL.tilt, TL.tilt + 0.3);
    tiltedEarth(x, ex, ey, ER * eIn, TILT, t, { axis: eIn, axisCol: tipAx > 0 ? H.rgba(H.mix('#ffffff', C.yellow, cl(tipAx))) : '#ffffff', axisGlow: cl(tipAx) });
    if (winK > 0) { // frosty north
      x.save(); x.globalAlpha = 0.75 * winK; x.translate(ex, ey); x.rotate(TILT);
      x.fillStyle = 'rgba(235,250,255,0.9)'; x.beginPath(); x.ellipse(0, -ER * 0.82, ER * 0.7, ER * 0.3, 0, 0, TAU); x.fill(); x.restore();
    }

    // distance arrow Sun -> January Earth, and Sun -> July ghost
    const da = eio(seg(t, TL.jan + 0.1, TL.big));
    if (da > 0 && jg > 0) {
      x.save(); x.globalAlpha = jg;
      arrow(x, line([SX + 104, SY], [ex - ER - 12, ey]), da, C.yellow, 9, { dots: true });
      arrow(x, line([SX - 104, SY], [SX - ORX + ER + 12, SY]), da, 'rgba(200,220,255,0.8)', 7, { dots: true });
      x.restore();
    }
    x.restore();

    // ---- labels (screen space) ----
    const sp = back(seg(t, TL.seasons, TL.seasons + 0.35), 1.6) * (1 - seg(t, TL.tips - 0.2, TL.tips + 0.05));
    if (sp > 0) { x.save(); x.translate(W / 2, 250); x.scale(sp, sp); text(x, 'SEASONS', 0, 0, 96, C.yellow); x.restore(); }
    const su = back(seg(t, TL.summer, TL.summer + 0.35), 1.6) * (1 - seg(t, TL.move[0], TL.move[0] + 0.25));
    if (su > 0) { x.save(); x.translate(W / 2, 250); x.scale(su, su); text(x, 'SUMMER', 0, 0, 100, C.yellow); x.restore(); }
    pill(x, 160, 400, 'tips toward', 30, { s: back(seg(t, TL.toward, TL.toward + 0.3)) * (1 - seg(t, TL.move[0], TL.move[0] + 0.25)), bg: C.yellow, ptr: true });
    const wi = back(seg(t, TL.winter, TL.winter + 0.35), 1.6) * (1 - seg(t, TL.push[0] - 0.1, TL.push[0] + 0.15));
    if (wi > 0) { x.save(); x.translate(W / 2, 250); x.scale(wi, wi); text(x, 'WINTER', 0, 0, 100, '#9fe8ff'); x.restore(); }
    pill(x, 545, 400, 'tips away', 30, { s: back(seg(t, TL.move[1] - 0.2, TL.move[1] + 0.1)) * (1 - seg(t, TL.push[0] - 0.1, TL.push[0] + 0.15)), bg: C.cyan, ptr: true });

    // key hit
    const kOut = seg(t, TL.north - 0.2, TL.north + 0.1);
    const jp = back(seg(t, TL.jan, TL.jan + 0.3)) * (1 - kOut);
    pill(x, 560, 712, 'January', 34, { s: jp, bg: C.yellow, ptr: 'up' });
    pill(x, 110, 712, 'July', 30, { s: back(seg(t, TL.july, TL.july + 0.3)) * (1 - kOut), bg: '#ffffff', ptr: 'up' });
    if (t > TL.big - 0.05 && kOut < 1) {
      const hk = Math.max(0, 1 - Math.abs(t - TL.big - 0.15) / 0.75);
      x.save(); x.globalAlpha = 1 - kOut;
      flare(x, W / 2, 240, hk * 0.8, t);
      FLAT.bigNumber(x, '5,000,000', W / 2, 220, 124, t, TL.big, { seed: 97, spread: 320 });
      const ks = back(seg(t, TL.big + 0.15, TL.big + 0.45));
      x.save(); x.translate(W / 2, 312); x.scale(ks, ks); text(x, 'km', 0, 0, 54, '#ffffff'); x.restore();
      const cs = back(seg(t, TL.closer, TL.closer + 0.3));
      x.save(); x.translate(W / 2, 372); x.scale(cs, cs); text(x, 'CLOSER to the Sun', 0, 0, 48, C.yellow); x.restore();
      x.restore();
      const fl = Math.max(0, 1 - Math.abs(t - (TL.big + 0.05)) / 0.25);
      if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.35 * fl); x.fillRect(0, 0, W, H_); }
    }
    // segment 8: winter up north, distance ✗, tilt ✓
    const nOut = seg(t, TL.white[0] + 0.1, TL.white[0] + 0.35);
    const np = back(seg(t, TL.north, TL.north + 0.35), 1.6) * (1 - nOut);
    if (np > 0) { x.save(); x.translate(W / 2, 230); x.scale(np, np); text(x, 'Still WINTER', 0, 0, 76, '#9fe8ff'); text(x, 'up north', 0, 74, 48, '#ffffff'); x.restore(); }
    const dp = back(seg(t, TL.dist, TL.dist + 0.3)) * (1 - nOut);
    pill(x, 210, 870, 'distance', 36, { s: dp, bg: '#ffffff' }); badge(x, 210, 795, 30, false, back(seg(t, TL.dist + 0.2, TL.dist + 0.5), 1.8) * (1 - nOut));
    const tp = back(seg(t, TL.tilt, TL.tilt + 0.3)) * (1 - nOut);
    pill(x, 500, 870, 'tilt', 40, { s: tp, bg: C.yellow }); badge(x, 500, 795, 30, true, back(seg(t, TL.tilt + 0.15, TL.tilt + 0.45), 1.8) * (1 - nOut));
  }

  // ================= SCENE C: back to the big tilted Earth =================
  function exC(x, W, H_, t) {
    const z = 1 + 0.25 * (1 - eo(seg(t, TL.cutC - 0.1, TL.cutC + 0.8))) + 0.015 * seg(t, TL.cutC, TL.D);
    sky(x, W, H_, t, { z, x: t * 9 });
    x.save(); x.translate(EX, EY); x.scale(z, z); x.translate(-EX, -EY);
    // warm sunlight from the left on the northern half
    const sl = seg(t, TL.you - 0.2, TL.you + 0.4);
    glow(x, -80, 420, 520, C.yellow, 0.35 * sl);
    tiltedEarth(x, EX, EY, R, TILT, t, { axis: 1, axisCol: C.yellow, axisGlow: 0.6 });
    angleMark(x, EX, EY, R, TILT, eo(seg(t, TL.cutC, TL.cutC + 0.5)));
    x.restore();
    const l1 = back(seg(t, TL.one, TL.one + 0.35), 1.6), l2 = back(seg(t, TL.you, TL.you + 0.35), 1.6);
    x.save(); x.translate(W / 2, 170); x.scale(l1, l1); text(x, '1 crash', 0, 0, 72, '#ffffff'); x.restore();
    x.save(); x.translate(W / 2, 252); x.scale(l2, l2); text(x, '= your summer', 0, 0, 64, C.yellow); x.restore();
    if (t > TL.you + 0.4) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 660), q.range(110, 330), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.you + 0.4, TL.you + 0.8)); }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 1000, -1000, sw);
    if (t < TL.sweep[0] || (t < TL.sweep[1] && spx > W / 2)) exA(x, W, H_, t);
    else if (t < TL.cutC) exB(x, W, H_, t);
    else exC(x, W, H_, t);
    FLAT.sweep(x, W, H_, sw, PL.jupiter);
    FLAT.whiteout(x, W, H_, seg(t, TL.white[0], TL.cutC) * (1 - seg(t, TL.cutC, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // 1 TILTED
    air(TL.intro - 0.3, 0.8, 1200, 0.6, 0, 0.5, true);
    tocksAlong(TL.tipped, TL.tipped + 0.5, 4, 560, 40, 0.3, 0);
    pluck(backPeak(TL.tipped, TL.tipped + 0.3), 'C5', 0.6, pan(230), true);
    pluck(backPeak(TL.num - 0.05, TL.num + 0.25, 1.6), 'E4', 1.0, pan(560)); pluck(backPeak(TL.num - 0.05, TL.num + 0.25, 1.6) + 0.07, 'B4', 0.7, pan(560));
    // 2 BACK IN TIME: baby Earth, rocks
    k.tone(TL.why, { f: [[0, 520], [0.5, 180]], type: 'triangle', dur: 0.55, gain: 0.08, a: 0.05 });
    air(TL.why, 0.6, 1600, 0.6, 0, 0.3, true);
    pluck(backPeak(TL.long, TL.long + 0.3), 'D4', 0.8, 0);
    boop(backPeak(TL.baby, TL.baby + 0.3), 360, 0.8, 0);
    TL.rocks.forEach((tr, i) => { air(tr - 0.6, 0.6, 2200, 0.5, (i - 1) * 0.4, 0.9, true); k.play('impact', tr, { gain: 0.35, pan: (i - 1) * 0.4 }); k.play('thud', tr, { f: 90, gain: 0.35, minor: true }); });
    // 3 THE GIANT CRASH
    k.play('riser', TL.giant - 0.5, { dur: TL.crash - TL.giant + 0.5, gain: 0.7 });
    k.play('impact', TL.crash, { gain: 0.9 });
    k.play('thud', TL.crash + 0.02, { f: 60, gain: 0.6 });
    k.noise(TL.crash, { dur: 1.4, color: 'brown', filter: 'lowpass', f: [[0, 900], [1.4, 160]], gain: 0.3, a: 0.01, verb: 0.3 });
    chord(TL.crash, ['D2', 'A2', 'D3', 'F3', 'A3'], 1.0, 1.8);
    tocksAlong(TL.crash + 0.1, TL.side + 0.2, 5, 500, 60, 0.3, 0.2);
    pluck(backPeak(TL.never, TL.never + 0.25, 1.6), 'A3', 1.0, pan(560)); pluck(backPeak(TL.never, TL.never + 0.25, 1.6) + 0.08, 'E4', 0.8, pan(560));
    pluck(backPeak(TL.never + 0.3, TL.never + 0.6), 'C5', 0.6, pan(220), true);
    // sweep into the orbit scene
    whoosh(TL.sweep[0], 0.8, 1);
    chord(TL.cutB + 0.1, ['C3', 'G3', 'E4'], 0.6, 1.4);
    boop(backPeak(TL.cutB - 0.1, TL.cutB + 0.4, 1.4), 300, 0.9, 0, false);
    tocksAlong(TL.cutB, TL.seasons + 0.4, 6, 520, 30, 0.25, 0);
    pluck(backPeak(TL.seasons, TL.seasons + 0.35, 1.6), 'C4', 1.0, 0); pluck(backPeak(TL.seasons, TL.seasons + 0.35, 1.6) + 0.07, 'G4', 0.8, 0);
    // 5 SUMMER
    pluck(backPeak(TL.toward, TL.toward + 0.3), 'E4', 0.7, pan(170), true);
    air(TL.toward, 1.2, 2400, 0.4, -0.2, 0.5, true);
    const sm = backPeak(TL.summer, TL.summer + 0.35, 1.6);
    chord(sm, ['C3', 'G3', 'C4', 'E4', 'G4'], 0.9, 1.6); k.play('sparkle', sm + 0.05, { gain: 0.8, n: 6 });
    // 6 WINTER
    air(TL.move[0], TL.move[1] - TL.move[0], 1100, 0.6, 0, 0.5, true);
    pluck(backPeak(TL.move[1] - 0.2, TL.move[1] + 0.1), 'A4', 0.6, pan(520), true);
    const wn = backPeak(TL.winter, TL.winter + 0.35, 1.6);
    pluck(wn, 'A3', 0.9, 0); pluck(wn + 0.08, 'E4', 0.8, 0); k.play('sparkle', wn + 0.05, { gain: 0.5, n: 4 });
    // 7 JANUARY: the key hit (quiet 0.3 s before it)
    air(TL.push[0], TL.push[1] - TL.push[0], 900, 0.5, 0, 0.5, true);
    pluck(backPeak(TL.jan, TL.jan + 0.3), 'G4', 0.7, pan(560), true);
    hit(TL.big, 1);
    pluck(backPeak(TL.closer, TL.closer + 0.3), 'E4', 0.6, 0, true);
    pluck(backPeak(TL.july, TL.july + 0.3), 'C4', 0.6, pan(150), true);
    // 8 THE TILT WINS
    pluck(backPeak(TL.north, TL.north + 0.35, 1.6), 'D4', 0.9, 0);
    k.play('tick', TL.dist + 0.35, { f: 300, gain: 0.5 }); boop(backPeak(TL.dist + 0.2, TL.dist + 0.5, 1.8), 220, 0.8, pan(210));
    const tw = backPeak(TL.tilt + 0.15, TL.tilt + 0.45, 1.8);
    chord(tw, ['C3', 'G3', 'C4', 'E4'], 0.7, 1.2); pluck(tw, 'C5', 0.8, pan(500));
    // 9 LOOP
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.0, 0, 0.55);
    chord(TL.cutC, ['C3', 'G3', 'E4'], 0.6, 1.4);
    pluck(backPeak(TL.one, TL.one + 0.35, 1.6), 'E4', 0.85, 0);
    const yu = backPeak(TL.you, TL.you + 0.35, 1.6);
    chord(yu, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.0, 2.4); pluck(yu, 'C4', 1.0, 0); k.play('sparkle', yu + 0.1, { gain: 0.7, n: 6 });
  }

  SCENE({
    init,
    cold: () => TL.crash - 0.3,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
