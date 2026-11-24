// "The Moon Is Running Away" — the v3 reference Short.
// Read FORMAT-V3.md before changing anything here. The rules this file demonstrates:
//   frame 0 is mid-action · the scene owns the camera · 1 hard cut · characters with faces
//   that react · a counter that escalates · climax at ~86% · last frame loops into the first.
(function () {
  const L = window.FLAT;
  const { cl, lerp, seg, eo, eio, back, C, PL, sky, earth, planet, sun, face,
          text, glow, flare, burst, shake, popIn, flash, speedLines, moonGlow } = L;

  let TL = null;

  // Drifting debris. The references never show a static frame; a cheap moving particle layer
  // keeps every second alive even when the two characters are holding a pose.
  function dust(x, W, H, t, n = 46) {
    x.save();
    for (let i = 0; i < n; i++) {
      const sp = 26 + (i % 7) * 15;
      const px = ((i * 137.5 + t * sp) % (W + 160)) - 80;
      const py = ((i * 229.1 + t * (9 + (i % 5) * 4)) % (H + 160)) - 80;
      const r = 1.1 + (i % 4) * 0.9;
      x.globalAlpha = 0.16 + 0.26 * Math.abs(Math.sin(i * 1.7 + t * 1.3));
      x.fillStyle = i % 5 === 0 ? '#9fd8ff' : '#ffffff';
      x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }

  // the rope between Earth and Moon, drawn with a sag that straightens as it is pulled tight
  function rope(x, ax, ay, bx, by, tight, a = 1) {
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + (1 - tight) * 90;
    x.save(); x.globalAlpha *= a; x.lineCap = 'round';
    x.strokeStyle = 'rgba(9,10,34,0.65)'; x.lineWidth = 13;
    x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(mx, my, bx, by); x.stroke();
    x.strokeStyle = '#cfd6ff'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(mx, my, bx, by); x.stroke();
    x.restore();
  }

  // the ring of fire: the Sun's disc peeking out all around a too-small Moon
  // drawn as an annulus (even-odd), so it does not punch a hole in the background
  function ringOfFire(x, cx, cy, sunR, moonR, k) {
    if (k <= 0) return;
    x.save(); x.globalAlpha = k;
    glow(x, cx, cy, sunR * 2.8, '#ff9a3c', 0.55 * k);
    x.beginPath();
    x.arc(cx, cy, sunR, 0, Math.PI * 2);
    x.arc(cx, cy, moonR, 0, Math.PI * 2, true);
    x.fillStyle = '#ffd36a'; x.fill('evenodd');
    x.beginPath();
    x.arc(cx, cy, sunR * 0.97, 0, Math.PI * 2);
    x.arc(cx, cy, moonR * 1.02, 0, Math.PI * 2, true);
    x.fillStyle = '#ffb02e'; x.fill('evenodd');
    x.restore();
  }

  SCENE({
    init(T) {
      TL = {
        b1: T.b(0), b2: T.b(1), b3: T.b(2), b4: T.b(3),
        b5: T.b(4), b6: T.b(5), b7: T.b(6), D: T.D,
        // the Moon never stops tugging — a still second is a swiped-away second
        yank1: 0.0, yank2: 0.62, yank3: T.b(1) + 0.5, yank4: T.b(1) + 1.9,
        tugs: [T.b(2) + 0.6, T.b(2) + 1.8, T.b(3) + 0.5, T.b(3) + 1.5,
               T.b(4) + 0.4, T.b(5) + 0.5, T.b(5) + 1.5],
        cut: T.b(6) + 1.0,          // the single hard cut, into the payoff
        climax: T.b(6),             // 15.4 s = 86 %
      };
    },

    draw(x, W, H, t, T, Lb, o) {
      const cx = W / 2;
      const afterCut = t >= TL.cut;

      // ---------- world layout ----------
      // Earth sits at world origin, the Moon runs away along +x. The camera frames whatever
      // matters right now, so nothing ever drifts off the edge as the gap grows.
      // The gap grows, but only enough to read as "running away" — a literal huge distance
      // would shrink the hero to nothing, which is exactly what the references never do.
      const gap = 330
        + 28 * eo(seg(t, TL.yank1, TL.yank1 + 0.4))
        + 28 * eo(seg(t, TL.yank2, TL.yank2 + 0.4))
        + 36 * eo(seg(t, TL.yank3, TL.yank3 + 0.5))
        + 40 * eo(seg(t, TL.yank4, TL.yank4 + 0.5))
        + 120 * eio(seg(t, TL.b3, TL.b4))
        + 110 * eio(seg(t, TL.b5, TL.b7))
        + 90 * eio(seg(t, TL.cut, TL.D));

      const eR = 250, mR = 96;   // heroes fill the frame — small subjects on black read as a still image
      const eWx = 0, eWy = 0;
      // the Moon strains against the rope the whole time — never parked
      const mWx = gap + 26 * Math.sin(t * 2.6) + 9 * Math.sin(t * 5.1 + 0.7);
      const mWy = -110 - 40 * eio(seg(t, TL.b3, TL.b6)) + 24 * Math.sin(t * 1.9 + 0.8);

      // ---------- camera ----------
      // Frame 0 is already tight on the struggle, pushes in harder over beat 1, then the
      // frame opens out only as fast as the gap forces it. One continuous move, no cut.
      const eclipseU = eio(seg(t, TL.b5 - 0.4, TL.b5 + 0.9)) * (1 - eio(seg(t, TL.cut - 0.3, TL.cut + 0.4)));
      const payoffU = eo(seg(t, TL.cut, TL.cut + 0.5));

      // Keep the hero LARGE. The Moon is allowed to run past the right edge — that reads as
      // "running away" better than shrinking everything to fit.
      const span = gap + eR + mR + 120;
      // The camera TRAVELS the whole time, following the escaping Moon — this is the reference
      // channel's main trick: a continuous pan across the subject instead of a locked-off frame.
      const travel = eio(cl(t / TL.D, 0, 1));
      let focusX = lerp(lerp(eWx + gap * 0.18, mWx - 30, travel), mWx - 10, eclipseU);
      let focusY = lerp(lerp(eWy - 10, mWy + 30, travel), mWy + 10, eclipseU);
      let z = cl((W * 1.30) / span, 1.05, 1.7);
      z = lerp(z, 1.5, eclipseU);                                      // push in on the eclipse
      z *= 1 + 0.15 * (1 - eo(seg(t, 0, 1.0)));                        // the opening push-in
      z *= 1 + 0.10 * Math.sin(Math.PI * cl(seg(t, TL.climax, TL.climax + 0.5), 0, 1));  // climax punch
      // constant breathing + drift, so no second of the Short is ever static.
      // Check with tools/check_v3.py: no second below 1.5 mean frame-diff.
      z *= 1 + 0.045 * Math.sin(t * 1.15);
      focusX += 70 * Math.sin(t * 0.52) + 26 * Math.sin(t * 1.3 + 1.1);
      focusY += 38 * Math.sin(t * 0.73 + 0.4);
      if (payoffU > 0) {                                               // payoff: both bodies in frame
        focusX = lerp(focusX, (eWx + mWx) / 2, payoffU);
        focusY = lerp(focusY, (eWy + mWy) / 2, payoffU);
        z = lerp(z, cl((W * 0.80) / span, 0.5, 1.1), payoffU);
      }

      let sh = shake(t, TL.yank1, 14, 0.5) + shake(t, TL.yank2, 11, 0.4)
             + shake(t, TL.yank3, 10, 0.4) + shake(t, TL.yank4, 10, 0.4)
             + shake(t, TL.climax, 20, 0.7);
      for (const tg of TL.tugs) sh += shake(t, tg, 7, 0.35);

      sky(x, W, H, t, { x: focusX * 0.25 + t * 26, y: 0, z: 1 + (z - 1) * 0.3, dark: true });
      dust(x, W, H, t);

      x.save();
      x.translate(cx + sh, H * 0.47);
      x.scale(z, z);
      x.translate(-focusX, -focusY);

      // screen-space positions of the two bodies
      const eX = eWx, eY = eWy, mX = mWx, mY = mWy;

      // Earth squashes on every yank and springs back
      let squash = Math.max(
        Math.sin(Math.PI * seg(t, TL.yank1, TL.yank1 + 0.3)),
        Math.sin(Math.PI * seg(t, TL.yank2, TL.yank2 + 0.3)),
        Math.sin(Math.PI * seg(t, TL.yank3, TL.yank3 + 0.32)),
        Math.sin(Math.PI * seg(t, TL.yank4, TL.yank4 + 0.32)),
      ) * 0.17;
      for (const tg of TL.tugs) squash = Math.max(squash, Math.sin(Math.PI * seg(t, tg, tg + 0.3)) * 0.085);
      squash += 0.012 * Math.sin(t * 2.6);     // always breathing

      // ---------- the eclipse Sun (slides in for beat 5) ----------
      const sunIn = eio(seg(t, TL.b5 - 0.5, TL.b5 + 0.8));
      const sunX = lerp(mX + 620, mX, sunIn), sunY = mY;   // slides in from behind the Moon
      const covered = seg(t, TL.b5 + 0.6, TL.b5 + 1.1) * (1 - seg(t, TL.b6 - 0.3, TL.b6 + 0.4));
      // the ring cracks open at beat 6, then BLAZES at the climax — that is the payoff moment
      const ringK = eo(seg(t, TL.b6 + 0.4, TL.b6 + 1.0));
      const blaze = eo(seg(t, TL.climax, TL.climax + 0.45));
      const moonDraw = mR * (1 - 0.08 * ringK - 0.08 * blaze);   // appears smaller as it recedes
      // a real ring of fire is a THIN bright annulus — thickness, not a filled disc.
      // the climax gets its size from the camera push and the flare, not from a fatter ring.
      const sunR = moonDraw * (1.04 + 0.13 * ringK + 0.16 * blaze);

      if (sunIn > 0.01 && ringK < 0.99) {
        x.save(); x.globalAlpha = sunIn * (1 - ringK * 0.25);
        sun(x, sunX, sunY, mR * 1.02, t, {});
        x.restore();
      }
      if (covered > 0.02 && ringK < 0.02) {       // corona of the total eclipse
        x.save(); x.globalAlpha = covered;
        glow(x, sunX, sunY, mR * 2.6, '#fff0c0', 0.55);
        x.restore();
      }
      ringOfFire(x, mX, mY, sunR * (1 + 0.04 * Math.sin(t * 7)), moonDraw, ringK);
      if (blaze > 0.01) flare(x, mX, mY, blaze * 1.1, t);   // the climax gets its size from here

      // ---------- the rope ----------
      // fade the rope out once the Moon has run past the frame edge, or its end flares into a stub
      const [mScrX] = [cx + (mWx - focusX) * z];
      const ropeA = (1 - seg(t, TL.b5, TL.b5 + 0.7)) * (1 - cl((mScrX - W * 0.98) / 180, 0, 1));
      if (ropeA > 0.01) {
        const tight = cl(seg(t, 0, 0.25) + 0.7, 0, 1);
        rope(x, eX + eR * 0.78, eY - 20, mX - mR * 0.7, mY + 10, tight, ropeA);
      }

      // ---------- Earth ----------
      x.save();
      x.translate(eX, eY); x.scale(1 + squash, 1 - squash * 0.85); x.translate(-eX, -eY);
      earth(x, eX, eY, eR, { spin: t * 0.95, t, quake: squash * 1.4 });
      let eMood = 'strain';
      if (t >= TL.b3 && t < TL.b4) eMood = 'angry';
      else if (t >= TL.b5 && t < TL.b6) eMood = 'happy';
      else if (t >= TL.b6) eMood = 'scared';
      face(x, eX, eY - 8, eR, { mood: eMood, t, look: [0.55, -0.15] });
      x.restore();

      // ---------- Moon (always drawn; during the ring it is the dark disc in the middle) ----------
      if (ringK < 0.5) moonGlow(x, mX, mY, mR, 0.22);
      planet(x, mX, mY, moonDraw, PL.moon, {});
      if (ringK < 0.5) {
        const mMood = t < TL.b3 ? 'strain' : (t < TL.b5 ? 'smug' : 'calm');
        face(x, mX, mY, moonDraw, { mood: mMood, t, look: [-0.5, 0.1], scale: 0.95 });
      }

      // screen-space positions of the bodies, for the label leader lines
      const toScreen = (wx, wy) => [cx + sh + (wx - focusX) * z, H * 0.47 + (wy - focusY) * z];
      const [eSx, eSy] = toScreen(eX, eY);
      const [mSx, mSy] = toScreen(mX, mY);

      // ---------- counter (green, y 780-900 in this 720x1280 space) ----------
      const NUMS = [
        { s: '3.8 CM / YEAR',     t0: TL.b2 + 0.35, px: 62 },
        { s: '1 MILLION YEARS',   t0: TL.b3 + 0.4,  px: 60 },
        { s: '600 MILLION YEARS', t0: TL.b6 + 0.25, px: 70 },
      ];
      x.restore();   // counters and labels sit outside the camera transform

      let cur = null;
      for (const n of NUMS) if (t >= n.t0 - 0.05) cur = n;
      if (cur) {
        const isLast = cur.s.startsWith('600');
        x.save();
        x.lineJoin = 'round'; x.textAlign = 'center'; x.textBaseline = 'middle';
        // fit to width: the pop scale can push a long number past the frame edge
        const scPop = back(seg(t, cur.t0 - 0.05, cur.t0 + 0.25), 1.7) * (1 + 0.2 * Math.sin(Math.PI * seg(t, cur.t0, cur.t0 + 0.35)));
        let px = isLast ? 78 : cur.px;
        const maxW = W * 0.88 / Math.max(1, scPop);
        x.font = `italic 900 ${px}px ${L.FONT}`;
        const wNow = x.measureText(cur.s).width;
        if (wNow > maxW) px = Math.max(26, px * maxW / wNow);
        x.translate(cx, 846); x.scale(scPop, scPop);
        x.font = `italic 900 ${px}px ${L.FONT}`;
        x.lineWidth = px * 0.26; x.strokeStyle = '#000000'; x.strokeText(cur.s, 0, 0);
        x.fillStyle = L.C.vgreen; x.fillText(cur.s, 0, 0);
        x.restore();
        if (t < cur.t0 + 0.6) burst(x, cx, 846, (t - cur.t0) * 1.0, 31, 260);
      }

      // ---------- white labels with a leader line, typing in ----------
      const LABELS = [
        { s: 'LONGER DAYS',   t0: TL.b4 + 0.3, t1: TL.b5 + 0.1, lx: 200, ly: 360, tx: eSx, ty: eSy - eR * z * 0.8 },
        { s: 'TOTAL ECLIPSE', t0: TL.b5 + 1.0, t1: TL.b6 + 0.1, lx: 470, ly: 330, tx: mSx, ty: mSy - 70 },
      ];
      for (const lb of LABELS) {
        const a = seg(t, lb.t0, lb.t0 + 0.2) * (1 - seg(t, lb.t1, lb.t1 + 0.25));
        if (a <= 0.01) continue;
        const n = Math.max(1, Math.round(lb.s.length * cl(seg(t, lb.t0, lb.t0 + 0.35), 0, 1)));
        const shown = lb.s.slice(0, n);
        // keep the label inside the frame whatever the camera is doing
        x.save(); x.globalAlpha = a;
        x.font = `italic 900 40px ${L.FONT}`;
        const halfW = x.measureText(lb.s).width / 2 + 18;
        const lx = cl(lb.lx, halfW, W - halfW), ly = lb.ly;
        x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 3; x.lineCap = 'round';
        x.beginPath(); x.moveTo(lx, ly + 26); x.lineTo(lx + (lb.tx > lx ? 30 : -30), ly + 70); x.lineTo(lb.tx, lb.ty); x.stroke();
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
        x.lineWidth = 11; x.strokeStyle = '#000000'; x.strokeText(shown, lx, ly);
        x.fillStyle = '#ffffff'; x.fillText(shown, lx, ly);
        x.restore();
      }

      // ---------- climax flash + the single hard cut ----------
      // short, punchy flashes — a long white-out hides the very moment it is meant to sell
      if (t >= TL.climax && t < TL.climax + 0.22) flash(x, W, H, (1 - seg(t, TL.climax, TL.climax + 0.22)) * 0.6);
      if (t >= TL.cut && t < TL.cut + 0.14) flash(x, W, H, (1 - seg(t, TL.cut, TL.cut + 0.14)) * 0.8);
      if (t >= TL.climax && t < TL.climax + 0.6) speedLines(x, W, H, 0.42 * (1 - seg(t, TL.climax, TL.climax + 0.6)), t);
    },

    sound(k, T, Lb, S) {
      const Y = [TL.yank1, TL.yank2, TL.yank3, TL.yank4];
      // every yank: a rope-creak whoosh plus an impact
      Y.forEach((ty, i) => {
        S.whoosh(ty - 0.12, 0.34, 0.9);
        k.play('impact', ty, { gain: i === 0 ? 0.85 : 0.6 });
        k.play('thud', ty + 0.03, { f: 90 + i * 8, gain: 0.4 });
      });
      // the smaller tugs that keep the middle alive
      TL.tugs.forEach((tg, i) => { S.whoosh(tg - 0.08, 0.26, 0.5); k.play('thud', tg, { f: 100 + i * 6, gain: 0.26 }); });
      // counters land with a click + pluck
      [TL.b2 + 0.35, TL.b3 + 0.4].forEach((tn, i) => { k.play('tick', tn, { gain: 0.6 }); S.pluck(tn, i ? 'B4' : 'E4', 0.9); });
      // labels
      [TL.b4 + 0.3, TL.b5 + 0.9].forEach((tl) => { k.play('sparkle', tl, { gain: 0.45 }); S.boop(tl, 520, 0.8); });
      // the spin-down drag
      S.tocksAlong(TL.b4, TL.b5 - 0.2, 7, 300, -22, 0.3);
      // the eclipse lands: soft shimmer
      S.shimmer(TL.b5 + 1.0, ['E5', 'A5', 'C6', 'E6'], 0.8);
      S.air(TL.b5 + 0.4, 1.1, 1200, 0.8);
      // CLIMAX: one big hit, with a clear gap before it
      S.hit(TL.climax, 1.0);
      k.play('tick', TL.b6 + 0.25, { gain: 0.7 }); S.pluck(TL.b6 + 0.25, 'A4', 1.1);
      // the cut
      S.whoosh(TL.cut - 0.1, 0.5, 1.0);
      k.play('swish', TL.cut, { gain: 0.7 });
      // the payoff settles
      S.chord(TL.cut + 0.2, ['A2', 'E3', 'A3', 'C4'], 0.9, 2.4);
    },
  });
})();
