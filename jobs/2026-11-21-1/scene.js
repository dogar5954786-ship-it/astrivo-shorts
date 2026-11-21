// "Sand Grain Hits Earth at Light Speed" - flat style. Structure copied from flat/examples/moon-closer.
// Scenes: A grain + window (seg 1-2) -> sweep -> B space, grain races at Earth, KEY HIT (seg 3-5)
//         -> whiteout -> C city at night, flash high in the sky (seg 6) -> sweep -> D speed limit, infinity (seg 7-8)
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, rr, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, earth, city, badge, speedLines, popIn, shake, trail } = FLAT;
  let TL = null, COLD = false;
  const SAND = ['#fff1c4', '#e9b65c', '#8a5626'];

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      in1: s(1), mg: w('milligram', 1), toss: w('toss', 1), win: w('window', 1), nothing: w('nothing', 1),
      fire: w('fire', 2), g1: [w('fire', 2) + 0.1, w('light', 2) + 0.2], kg: w('kilogram', 2),
      sw1: [s(3) - 0.25, s(3) + 0.5], s3: s(3), g99: [s(3) + 0.1, w('light', 3) + 0.2], tons: w('tons', 3),
      s4: s(4), g300: [s(4) + 0.2, w('slower', 4) + 0.3], slower: w('slower', 4),
      boom: w('boom', 5), tons2: w('tons', 5), atomic: w('atomic', 5),
      white: [s(6) - 0.4, s(6) + 0.35], c6: s(6), sky: w('sky', 6), flash: w('flash', 6),
      sw2: [s(7) - 0.25, s(7) + 0.5], s7: s(7), exact: w('exactly', 7), inf: w('infinite', 7),
      s8: s(8), mass: w('mass', 8), sand: w('sand', 8),
      D: T.D,
    };
  }

  // ---------- helpers ----------
  // a lumpy sand grain: gradient ball + a few facets + sparkle
  function grain(x, cx, cy, r, t, hot = 0) {
    if (r < 0.5) return;
    glow(x, cx, cy, r * 2.6, hot > 0 ? '#fff2c0' : '#ffcf7a', 0.25 + 0.5 * hot);
    x.save(); x.translate(cx, cy); x.rotate(t * 0.6);
    ball(x, 0, 0, r, SAND, { sha: 0.45, inner: () => {
      const q = H.rng(9);
      for (let i = 0; i < 6; i++) {
        const a = q.range(0, TAU), d = q.range(0.2, 0.7) * r;
        x.fillStyle = q.chance(0.5) ? 'rgba(255,255,255,0.22)' : 'rgba(122,70,30,0.25)';
        x.beginPath(); x.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * q.range(0.12, 0.26), r * q.range(0.08, 0.16), a, 0, TAU); x.fill();
      }
    } });
    x.restore();
    if (hot > 0) glow(x, cx, cy, r * 1.4, '#ffffff', 0.7 * hot);
    spark(x, cx - r * 0.35, cy - r * 0.4, r * 0.28 * (0.6 + 0.4 * Math.sin(t * 4)), '#ffffff', 0.9);
  }
  // speed gauge: rounded bar 0 -> c. f = visual fill 0..1
  function gauge(x, cx, cy, w, f, label, a = 1, t = 0) {
    if (a <= 0.01) return;
    x.save(); x.globalAlpha *= a;
    const h = 34, x0 = cx - w / 2;
    x.fillStyle = 'rgba(10,8,46,0.55)'; rr(x, x0 - 6, cy - h / 2 - 6, w + 12, h + 12, (h + 12) / 2); x.fill();
    if (f > 0.005) {
      const g = x.createLinearGradient(x0, 0, x0 + w, 0);
      g.addColorStop(0, '#56e8ff'); g.addColorStop(0.6, '#ffd23f'); g.addColorStop(1, '#ff3b5c');
      x.fillStyle = g; rr(x, x0, cy - h / 2, Math.max(h, w * f), h, h / 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.35)'; rr(x, x0 + 10, cy - h / 2 + 5, Math.max(4, w * f - 20), 6, 3); x.fill();
      glow(x, x0 + w * f, cy, 60, '#fff2c0', 0.5);
    }
    // the light-speed wall
    x.fillStyle = '#ffffff'; rr(x, x0 + w + 2, cy - h, 8, h * 2, 4); x.fill();
    text(x, 'c', x0 + w + 6, cy - h - 26, 38, C.yellow);
    text(x, 'light speed', x0 + w - 60, cy + h + 22, 24, '#bfe9ff', { w: 800 });
    if (label) pill(x, cl(x0 + w * f, x0 + 150, x0 + w - 110), cy + h + 66, label, 34, { s: 1, bg: '#ffffff', ptr: 'up' });
    x.restore();
  }
  // display mapping for the gauge
  const G1 = 0.07, G99 = 0.84, G300 = 0.975;

  // ================= SCENE A: the grain, the window =================
  const WX = 560, WY = 640, WW = 170, WH = 250;
  function exA(x, W, H_, t) {
    const pull = 1 + 1.4 * (1 - eo(seg(t, TL.in1 - 0.4, TL.in1 + 1.0)));
    sky(x, W, H_, t, { z: pull, x: t * 12, y: t * 4 });
    planet(x, 96 - t * 2, 840, 34, PL.teal, { glowA: 0.25 });
    // window (frame + glass), slides in on "toss"
    const wi = back(seg(t, TL.toss - 0.2, TL.toss + 0.25), 1.3);
    const smash = t > TL.kg;
    if (wi > 0) {
      const wx = lerp(W + 140, WX, wi);
      x.fillStyle = '#4a3a9e'; rr(x, wx - WW / 2 - 14, WY - WH / 2 - 14, WW + 28, WH + 28, 16); x.fill();
      if (!smash) {
        const g = x.createLinearGradient(wx - WW / 2, WY - WH / 2, wx + WW / 2, WY + WH / 2);
        g.addColorStop(0, '#bff6ff'); g.addColorStop(1, '#4fb6e6');
        x.fillStyle = g; rr(x, wx - WW / 2, WY - WH / 2, WW, WH, 8); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.moveTo(wx - WW / 2 + 20, WY + 40); x.lineTo(wx - WW / 2 + 70, WY - WH / 2 + 10); x.lineTo(wx - WW / 2 + 100, WY - WH / 2 + 10); x.lineTo(wx - WW / 2 + 50, WY + 40); x.fill();
        x.fillStyle = '#4a3a9e'; x.fillRect(wx - 6, WY - WH / 2, 12, WH); x.fillRect(wx - WW / 2, WY - 6, WW, 12);
      } else {
        // shards fly out
        const age = t - TL.kg, q = H.rng(5);
        for (let i = 0; i < 22; i++) {
          const a = q.range(-Math.PI, Math.PI), sp = q.range(160, 520), sx = wx + q.range(-60, 60) + Math.cos(a) * sp * age, sy = WY + q.range(-90, 90) + Math.sin(a) * sp * age + 300 * age * age;
          x.save(); x.translate(sx, sy); x.rotate(age * q.range(-6, 6)); x.globalAlpha *= cl(1 - age / 1.6);
          x.fillStyle = q.chance(0.5) ? '#bff6ff' : '#6fd0f5'; x.beginPath(); const z = q.range(10, 26); x.moveTo(0, -z); x.lineTo(z * 0.7, z * 0.5); x.lineTo(-z * 0.6, z * 0.4); x.fill(); x.restore();
        }
      }
    }
    // the grain: pops in big, then shrinks and is tossed at the window
    const gi = back(seg(t, TL.in1 - 0.4, TL.in1 + 0.15), 1.4);
    const ts = eio(seg(t, TL.toss, TL.win + 0.2));
    let gx = lerp(W / 2 - 40, WX - WW / 2 - 30, ts), gy = lerp(600, WY, ts) - Math.sin(ts * Math.PI) * 120;
    let gr = lerp(130, 22, eio(seg(t, TL.toss - 0.1, TL.toss + 0.4))) * gi;
    // bounce off gently on "nothing"
    const bo = seg(t, TL.win + 0.2, TL.win + 0.9);
    if (bo > 0) { gx -= bo * 140; gy += Math.sin(bo * Math.PI) * -60 + bo * bo * 200; }
    // "fire it": grain resets to the left and shoots at the window
    const fr = seg(t, TL.fire, TL.fire + 0.3);
    if (fr > 0) { gx = lerp(-40, 120, eo(fr)); gy = WY; gr = 22; }
    const shot = seg(t, TL.kg - 0.35, TL.kg);
    if (shot > 0) { gx = lerp(120, WX - WW / 2, shot * shot); }
    if (t < TL.kg) {
      if (shot > 0) trail(x, gx, gy, 0, 260 * shot, 18, '#ffcf7a', 1);
      grain(x, gx, gy, gr, t, shot);
    }
    // labels
    const mg = popIn(t, TL.mg, TL.toss);
    if (mg > 0) { pill(x, W / 2 - 40, 380, '1 milligram', 44, { s: mg, bg: C.yellow, ptr: true }); }
    const ok = popIn(t, TL.nothing, TL.fire - 0.1);
    badge(x, WX, WY - WH / 2 - 70, 36, true, ok);
    pill(x, 230, 470, 'no damage', 34, { s: ok, bg: C.green });
    // gauge (1%)
    const ga = eio(seg(t, TL.fire - 0.2, TL.fire + 0.2));
    gauge(x, W / 2 - 20, 190, 540, G1 * eio(seg(t, TL.g1[0], TL.g1[1])), t > TL.g1[0] + 0.2 ? '1% of light speed' : null, ga, t);
    // explosion: 1 kg of TNT
    if (t > TL.kg) {
      const age = t - TL.kg, k = Math.max(0, 1 - age / 0.6);
      glow(x, WX, WY, 320, '#ffcf5a', 0.8 * k); glow(x, WX, WY, 140, '#ffffff', 0.9 * k);
      burst(x, WX, WY, age, 31, 260);
      const p = popIn(t, TL.kg + 0.1);
      x.save(); x.translate(W / 2 - 20, 400); x.scale(p, p); text(x, '= 1 kg of TNT', 0, 0, 72, C.yellow); x.restore();
    }
  }

  // ================= SCENE B: space, the grain races at Earth =================
  const EX = 360, EY = 1360, ERR = 480, IMP = [380, EY - ERR - 18];
  function grainPos(t) {
    const u = 0.5 * eio(seg(t, TL.s3 - 0.3, TL.s4)) + 0.5 * Math.pow(seg(t, TL.s4, TL.boom), 2.2);
    return [lerp(60, IMP[0], u), lerp(330, IMP[1], u), u];
  }
  function exB(x, W, H_, t) {
    const hitK = t > TL.boom ? Math.max(0, 1 - (t - TL.boom) / 0.9) : 0;
    const sk = shake(t, TL.boom, 16, 0.6);
    x.save(); x.translate(sk, sk * 0.5);
    const fast = seg(t, TL.s4, TL.boom);
    sky(x, W, H_, t, { z: 1 + 0.25 * fast + 0.1 * seg(t, TL.s3, TL.s4), x: 300 + t * 14, y: -t * 20 * (1 + 4 * fast) });
    planet(x, 620, 360, 30, PL.mars, { glowA: 0.2 });
    earth(x, EX, EY, ERR, { spin: t * 0.2, t });
    // the grain + trail
    if (t < TL.boom) {
      const [gx, gy] = grainPos(t), ang = Math.atan2(IMP[1] - 330, IMP[0] - 60);
      const hot = 0.3 + 0.7 * fast;
      trail(x, gx, gy, ang, lerp(160, 620, fast), lerp(16, 30, fast), '#ffd88a', 1);
      trail(x, gx, gy, ang, lerp(80, 320, fast), lerp(6, 12, fast), '#ffffff', 0.9);
      grain(x, gx, gy, lerp(18, 24, fast), t, hot);
    }
    if (fast > 0.3 && t < TL.boom) speedLines(x, W, H_, 0.35 * fast, t);
    // impact on the atmosphere
    if (t > TL.boom) {
      const age = t - TL.boom;
      glow(x, IMP[0], IMP[1], 600 * eo(cl(age / 0.6)), '#ffcf5a', 0.7 * Math.max(0.25, hitK));
      glow(x, IMP[0], IMP[1], 220, '#ffffff', 0.9 * Math.max(0.3, hitK));
      flare(x, IMP[0], IMP[1], Math.max(0.35, hitK), t);
      // shock ring
      x.save(); x.strokeStyle = H.rgba('#fff2c0', cl(1 - age / 1.5)); x.lineWidth = 12; x.beginPath(); x.ellipse(IMP[0], IMP[1], 60 + 520 * eo(cl(age / 1.5)), (60 + 520 * eo(cl(age / 1.5))) * 0.35, 0, 0, TAU); x.stroke(); x.restore();
      burst(x, IMP[0], IMP[1] - 40, age * 0.9, 77, 360);
    }
    // gauge: 99% then c - 300 m/s
    const gf = lerp(G1, G99, eio(seg(t, TL.g99[0], TL.g99[1]))) + (G300 - G99) * eio(seg(t, TL.g300[0], TL.g300[1]));
    const lab = t > TL.g300[0] + 0.2 ? '300 m/s short!' : (t > TL.g99[0] + 0.2 ? '99%' : '1%');
    const gA = 1 - seg(t, TL.boom + 1.2, TL.boom + 1.6);
    gauge(x, W / 2 - 20, 170, 540, gf, COLD ? null : lab, gA, t);
    // 130 tons
    const tp = popIn(t, TL.tons, TL.s4 + 0.3);
    if (tp > 0) { x.save(); x.translate(W / 2, 470); x.scale(tp, tp); text(x, '130 tons', 0, 0, 96, C.yellow); text(x, 'of TNT', 0, 74, 44, '#ffffff'); x.restore(); burst(x, W / 2, 470, (t - TL.tons) * 1.1, 12, 240); }
    // the key hit number
    if (!COLD && t > TL.boom - 0.05) {
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.boom, TL.boom + 0.35) * Math.PI), sc = back(seg(t, TL.boom - 0.05, TL.boom + 0.25), 1.6) * pop;
      x.save(); x.translate(W / 2, 500); x.scale(sc, sc); text(x, '15,000', 0, 0, 132, C.yellow); text(x, 'tons of TNT', 0, 90, 50, '#ffffff'); x.restore();
      burst(x, W / 2, 500, (t - TL.boom) * 1.0, 97, 320);
      pill(x, W / 2, 700, '= an atomic bomb', 40, { s: popIn(t, TL.atomic), bg: C.red, fg: '#ffffff' });
    }
    x.restore();
    const fl = t > TL.boom ? Math.max(0, 1 - (t - TL.boom) / 0.3) : 0;
    if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.55 * fl); x.fillRect(0, 0, W, H_); }
  }

  // ================= SCENE C: city at night, flash high in the sky =================
  function exC(x, W, H_, t) {
    const fa = t - TL.flash, fk = t > TL.flash ? Math.max(0, 1 - fa / 1.2) : 0;
    const sk = shake(t, TL.flash, 8, 0.5);
    x.save(); x.translate(sk, 0);
    sky(x, W, H_, t, { x: 100 + t * 8, y: 30, z: 1 + 0.08 * seg(t, TL.c6, TL.s7) });
    // the falling streak high up, then the airburst
    const BX = 360, BY = 300;
    const st = seg(t, TL.c6 - 0.2, TL.flash);
    if (t < TL.flash) {
      const hx = lerp(80, BX, st), hy = lerp(80, BY, st);
      trail(x, hx, hy, Math.atan2(BY - 80, BX - 80), 300, 20, '#ffd88a', 1); grain(x, hx, hy, 12, t, 1);
      glow(x, BX, BY, 200, '#ffcf7a', 0.15 + 0.3 * st);
    } else {
      glow(x, BX, BY, 700, '#fff2c0', 0.35 + 0.6 * fk); glow(x, BX, BY, 240, '#ffffff', 0.5 + 0.5 * fk);
      flare(x, BX, BY, 0.4 + 0.6 * fk, t); burst(x, BX, BY, fa, 61, 300);
    }
    const lit = t > TL.flash ? 0.45 + 0.55 * fk : 0;
    // city, lit by the flash
    const G = 1180;
    for (const b of city(W)) {
      const top = G - b.h * 1.25;
      x.fillStyle = H.rgba(H.mix(b.c, '#ffe2a8', lit * 0.55)); rr(x, b.x, top, b.w, G - top + 120, 8); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.08)'; rr(x, b.x + 4, top + 4, b.w * 0.3, G - top, 6); x.fill();
      const q = H.rng(b.win);
      for (let wy = top + 18; wy < G - 20; wy += 30) for (let wx = b.x + 10; wx < b.x + b.w - 16; wx += 20) {
        if (!q.chance(0.5)) continue;
        x.fillStyle = q.chance(0.8) ? 'rgba(255,214,90,0.9)' : 'rgba(150,230,255,0.8)'; rr(x, wx, wy, 9, 13, 3); x.fill();
      }
    }
    x.fillStyle = '#1b1650'; x.fillRect(0, G, W, H_ - G);
    const sp = popIn(t, TL.sky, TL.s7 - 0.3);
    pill(x, BX, BY + 150, 'explodes in the sky', 36, { s: sp, bg: '#ffffff', ptr: 'up' });
    x.restore();
    if (fk > 0) { x.fillStyle = H.rgba('#fff6d0', 0.6 * Math.max(0, 1 - fa / 0.35)); x.fillRect(0, 0, W, H_); }
  }

  // ================= SCENE D: the speed limit =================
  function exD(x, W, H_, t) {
    sky(x, W, H_, t, { x: 600 + t * 10, y: 80, z: 1.1 + 0.15 * seg(t, TL.s7, TL.D) });
    planet(x, 600, 1120, 60, PL.coral, { glowA: 0.25 });
    // gauge pushes at the wall but never reaches it
    const push = eio(seg(t, TL.s7, TL.exact + 0.4));
    const f = lerp(0.9, 0.992, push) - 0.006 * Math.abs(Math.sin(t * 9)) * push;
    gauge(x, W / 2 - 20, 250, 560, f, null, eo(seg(t, TL.sw2[0] + 0.3, TL.s7 + 0.4)), t);
    if (t < TL.s8 + 0.25) { const gx = W / 2 - 20 - 280 + 560 * f; trail(x, gx, 250, 0, 220, 22, '#ffd88a', 0.9); grain(x, gx, 250, 20 * eo(seg(t, TL.sw2[0] + 0.3, TL.s7 + 0.4)) * (1 - seg(t, TL.s8, TL.s8 + 0.25)), t, 0.6); }
    // infinity
    const ip = popIn(t, TL.inf, TL.s8 + 0.1);
    if (ip > 0) {
      flare(x, W / 2, 560, 0.5 * Math.max(0, 1 - Math.abs(t - TL.inf - 0.2) / 0.9), t);
      x.save(); x.translate(W / 2, 540); x.scale(ip, ip); text(x, '∞', 0, 0, 230, C.yellow); text(x, 'energy needed', 0, 140, 46, '#ffffff'); x.restore();
      burst(x, W / 2, 540, (t - TL.inf) * 1.1, 44, 300);
    }
    // ending: speed limit sign + the grain (loops to the hook)
    const sg = popIn(t, TL.s8 + 0.25);
    if (sg > 0) {
      x.save(); x.translate(W / 2, 560); x.scale(sg, sg);
      x.fillStyle = 'rgba(10,8,46,0.45)'; rr(x, -150, -170, 300, 360, 30); x.fill();
      x.fillStyle = '#ffffff'; rr(x, -150, -180, 300, 360, 30); x.fill();
      x.strokeStyle = C.ink; x.lineWidth = 10; rr(x, -130, -160, 260, 320, 22); x.stroke();
      text(x, 'SPEED', 0, -110, 50, C.ink, { shadow: 'rgba(0,0,0,0)' }); text(x, 'LIMIT', 0, -55, 50, C.ink, { shadow: 'rgba(0,0,0,0)' });
      text(x, 'c', 0, 60, 170, '#e2302f', { shadow: 'rgba(0,0,0,0)' });
      x.restore();
      const gy = 820 + Math.sin(t * 2) * 6;
      grain(x, W / 2 - 170, gy, 34 * popIn(t, TL.mass - 0.1), t);
      badge(x, W / 2 - 110, gy - 40, 26, false, popIn(t, TL.mass + 0.2));
      pill(x, W / 2 + 90, 830, 'not even sand', 32, { s: popIn(t, TL.sand), bg: C.yellow });
    }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const s1 = eio(seg(t, TL.sw1[0], TL.sw1[1])), s1x = lerp(W + 1000, -1000, s1);
    const s2 = eio(seg(t, TL.sw2[0], TL.sw2[1])), s2x = lerp(W + 1000, -1000, s2);
    if (t < TL.sw1[0] || (t < TL.sw1[1] && s1x > W / 2)) exA(x, W, H_, t);
    else if (t < TL.c6) exB(x, W, H_, t);
    else if (t < TL.sw2[0] || (t < TL.sw2[1] && s2x > W / 2)) exC(x, W, H_, t);
    else exD(x, W, H_, t);
    if (s1 > 0 && s1 < 1) planet(x, s1x, 640 + (s1 - 0.5) * 140, 900, PL.teal, { glowA: 0.4 });
    if (s2 > 0 && s2 < 1) planet(x, s2x, 640 + (s2 - 0.5) * 140, 900, PL.coral, { glowA: 0.4 });
    FLAT.whiteout(x, W, H_, seg(t, TL.white[0], TL.c6) * (1 - seg(t, TL.c6, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // A: grain + window
    boop(backPeak(TL.in1 - 0.4, TL.in1 + 0.15, 1.4), 380, 1.0, 0);
    pluck(backPeak(TL.mg, TL.mg + 0.3), 'E4', 0.9, 0);
    k.play('swish', TL.toss - 0.1, { gain: 0.5, minor: true });
    k.play('tick', TL.win + 0.2, { f: 2400, gain: 0.6, pan: pan(WX) });
    pluck(backPeak(TL.nothing, TL.nothing + 0.3), 'C5', 0.7, pan(WX), true);
    tocksAlong(TL.g1[0], TL.g1[1], 4, 500, 40, 0.3, 0);
    air(TL.kg - 0.35, 0.4, 2000, 0.8, pan(WX), 0.5);
    k.play('impact', TL.kg, { gain: 0.6, pan: pan(WX) });
    k.noise(TL.kg, { dur: 0.6, filter: 'highpass', f: [[0, 4000], [0.6, 1500]], gain: 0.14, a: 0.005, verb: 0.3 });
    pluck(backPeak(TL.kg + 0.1, TL.kg + 0.4), 'G4', 0.7, 0, true);
    // B: sweep to space, race at Earth
    whoosh(TL.sw1[0], 0.8);
    tocksAlong(TL.g99[0], TL.g99[1], 7, 520, 45, 0.3, 0);
    pluck(backPeak(TL.tons, TL.tons + 0.3, 1.6), 'A3', 1.0, 0); pluck(backPeak(TL.tons, TL.tons + 0.3, 1.6) + 0.08, 'E4', 0.8, 0);
    tocksAlong(TL.g300[0], TL.g300[1], 8, 600, 60, 0.3, 0);
    k.play('riser', TL.s4, { dur: Math.max(0.5, TL.boom - 0.35 - TL.s4), gain: 0.7 });
    // KEY HIT (0.3 s gap before it)
    hit(TL.boom);
    k.play('thud', TL.boom + 0.05, { f: 60, gain: 0.6 });
    pluck(backPeak(TL.atomic, TL.atomic + 0.3), 'D4', 0.8, 0, true);
    // C: whiteout to the city, airburst
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.0, 0, 0.55);
    air(TL.c6 - 0.1, Math.max(0.3, TL.flash - TL.c6), 1500, 0.6, 0, 0.5, true);
    k.play('impact', TL.flash, { gain: 0.55 });
    k.noise(TL.flash + 0.1, { dur: 1.4, color: 'brown', filter: 'lowpass', f: 200, gain: 0.25, a: 0.05, hold: 0.4 });
    pluck(backPeak(TL.sky, TL.sky + 0.3), 'E4', 0.7, 0, true);
    // D: speed limit, infinity
    whoosh(TL.sw2[0], 0.8);
    { for (let tt = TL.s7 + 0.3; tt < TL.inf - 0.1; tt += 0.11) k.play('tick', tt, { f: 1800, gain: 0.25, minor: true }); }
    const ip = backPeak(TL.inf, TL.inf + 0.3, 1.6);
    chord(ip, ['C3', 'G3', 'C4', 'E4', 'G4'], 1.2, 2.0); shimmer(ip + 0.05, ['G5', 'C6', 'E6'], 0.6, 0.2);
    boop(backPeak(TL.s8 + 0.25, TL.s8 + 0.55, 1.6), 420, 1.0, 0);
    pluck(backPeak(TL.mass + 0.2, TL.mass + 0.5), 'A3', 0.8, 0);
    const sd = backPeak(TL.sand, TL.sand + 0.3);
    chord(sd, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.0, 2.2); pluck(sd, 'C5', 0.8, 0);
  }

  SCENE({
    init,
    // cold open: the hook line plays over the grain hitting the sky in slow motion
    cold: () => TL.boom - 0.15,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
