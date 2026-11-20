// "Earth Without Humans" — flat style. Structure copied from flat/examples/moon-closer.
// Scene A: one night city that changes with time (people vanish, lights out, subway floods, animals, trees,
// towers fall, forest swallows it). Scene B (after a whiteout): the Moon with our footprints, Earth in the sky.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, rr, glow, spark, ball, arrow, line, text, pill, flare, burst,
    sky, planet, moonGlow, earth, buddy, badge, water, shake } = FLAT;
  let TL = null, COLD = false;
  const G = 900;          // ground line (world y)
  const ROADB = 1190;     // bottom of the road / top of the dirt (world)
  const TUN = [40, 1290, 640, 200]; // subway tunnel rect (world)

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      s1: s(1), poof: s(1) + 0.15, hours: w('hours', 1), shut: w('shut', 1), out: w('out', 1),
      s2: s(2), days: w('2', 2), fill: w('fill', 2), water: w('water', 2),
      pan: [s(2) - 0.25, s(2) + 0.55], panBack: [s(3) - 0.3, s(3) + 0.45],
      animals: w('animals', 3), streets: w('streets', 3),
      cher: w('chernobyl', 4), wolves: w('wolves', 4), horses: w('horses', 4),
      y20: w('20', 5), trees: w('trees', 5), brk: w('break', 5), roofs: w('rooftops', 5),
      y300: w('300', 6), rusty: w('rusty', 6), crash: w('crash', 6),
      big: w('10,000', 7), gone: w('gone', 7), forest: w('forest', 7),
      white: [s(8) - 0.4, s(8) + 0.35], cutB: s(8),
      millions: w('millions', 8), feet: w('footprints', 9), moon: w('moon', 9), last: w('last', 9), ever: w('ever', 9),
      D: T.D,
    };
  }

  // ---------- city data ----------
  const BLD = [
    { x: -10, w: 150, h: 330, c: ['#5a46c8', '#3a2a8c', '#1d1660'] },
    { x: 150, w: 120, h: 460, c: ['#6a4fd8', '#46309a', '#221a6a'] },
    { x: 280, w: 170, h: 380, c: ['#5040b8', '#33287f', '#1b1558'] },
    { x: 462, w: 112, h: 520, c: ['#7458e0', '#4a34a6', '#241b70'] },
    { x: 586, w: 150, h: 300, c: ['#5a46c8', '#2d2478', '#191450'] },
  ];
  const RUST = '#8a4a3a';
  const PEOPLE = [[60, 1, '#56e8ff'], [170, -1, '#ffd23f'], [255, 1, '#ff5d8f'], [370, -1, '#38e08e'], [450, 1, '#ffb070'], [560, -1, '#b9a8ff'], [655, 1, '#56e8ff']];
  const CARS = [[-120, 70, 1035, '#ff5d8f'], [820, -80, 1125, '#56e8ff'], [300, 45, 1035, '#ffd23f']];
  const pal = (hex) => [H.rgba(H.mix(hex, '#ffffff', 0.45)), hex, H.rgba(H.mix(hex, '#0c0a30', 0.6))];

  // car x: drives until everyone vanishes, then rolls to a stop
  const carX = (c, t) => { const tp = TL.poof; return c[0] + c[1] * (t < tp ? t : tp + (1 - Math.exp(-(t - tp) * 2.2)) / 2.2); };

  function drawCar(x, cx, cy, col, lightsOn, rust, sink) {
    const body = H.rgba(H.mix(col, RUST, rust));
    x.save(); x.translate(cx, cy + sink);
    x.fillStyle = H.rgba(H.mix(body, '#000000', 0.25)); rr(x, -40, -58, 80, 34, 14); x.fill();
    x.fillStyle = 'rgba(160,240,255,0.55)'; rr(x, -32, -52, 30, 22, 8); x.fill(); rr(x, 2, -52, 30, 22, 8); x.fill();
    x.fillStyle = body; rr(x, -64, -32, 128, 38, 16); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.18)'; rr(x, -58, -28, 70, 8, 4); x.fill();
    for (const sd of [-1, 1]) { x.fillStyle = '#0d0b2a'; x.beginPath(); x.arc(sd * 38, 6, 15, 0, TAU); x.fill(); x.fillStyle = '#8a86b8'; x.beginPath(); x.arc(sd * 38, 6, 6, 0, TAU); x.fill(); }
    if (lightsOn > 0) { glow(x, 66, -14, 70, '#fff3b0', 0.5 * lightsOn); glow(x, -66, -14, 30, '#ff3b5c', 0.5 * lightsOn); }
    x.restore();
  }

  // ---------- animals (flat, cute, simple) ----------
  function animal(x, cx, gy, s, kind, t, walk, dir) {
    const P = {
      deer: { c: '#d9935a', d: '#8a4f2a', bw: 54, bh: 28, leg: 46, neck: 34, hr: 15 },
      boar: { c: '#8a5f4a', d: '#4a2f24', bw: 50, bh: 30, leg: 20, neck: 4, hr: 18 },
      wolf: { c: '#aab3c8', d: '#5a627a', bw: 52, bh: 24, leg: 34, neck: 14, hr: 16 },
      horse: { c: '#b8744a', d: '#5e3420', bw: 64, bh: 32, leg: 54, neck: 36, hr: 17 },
    }[kind];
    x.save(); x.translate(cx, gy); x.scale(s * dir, s);
    const bob = walk * Math.abs(Math.sin(t * 9)) * 3, by = -P.leg - P.bh * 0.5 - bob;
    // legs
    x.strokeStyle = P.d; x.lineWidth = 9; x.lineCap = 'round';
    [-0.7, -0.45, 0.45, 0.7].forEach((f, i) => { const sw = walk * Math.sin(t * 9 + i * 1.7) * 0.35; x.beginPath(); x.moveTo(f * P.bw * 0.8, by + 6); x.lineTo(f * P.bw * 0.8 + Math.sin(sw) * P.leg, by + 6 + Math.cos(sw) * (P.leg + P.bh * 0.3)); x.stroke(); });
    // tail
    x.strokeStyle = P.d; x.lineWidth = kind === 'wolf' ? 14 : 7; x.beginPath(); x.moveTo(-P.bw * 0.9, by - 4);
    x.quadraticCurveTo(-P.bw * 1.25, by + (kind === 'wolf' ? 10 : -10), -P.bw * 1.3, by + (kind === 'horse' ? 30 : 16)); x.stroke();
    // body
    const g = x.createLinearGradient(0, by - P.bh, 0, by + P.bh);
    g.addColorStop(0, H.rgba(H.mix(P.c, '#ffffff', 0.3))); g.addColorStop(0.5, P.c); g.addColorStop(1, P.d);
    x.fillStyle = g; x.beginPath(); x.ellipse(0, by, P.bw, P.bh, 0, 0, TAU); x.fill();
    // neck + head
    const hx = P.bw * 0.95, hy = by - P.neck - 6;
    x.strokeStyle = P.c; x.lineWidth = P.hr * 1.1; x.beginPath(); x.moveTo(P.bw * 0.6, by - 4); x.lineTo(hx, hy); x.stroke();
    if (kind === 'horse') { x.strokeStyle = P.d; x.lineWidth = 8; x.beginPath(); x.moveTo(P.bw * 0.55, by - 14); x.lineTo(hx - 6, hy - 10); x.stroke(); }
    x.fillStyle = P.c; x.beginPath(); x.ellipse(hx + P.hr * 0.5, hy, P.hr * 1.35, P.hr, 0.15, 0, TAU); x.fill();
    // ears / antlers / tusk
    x.fillStyle = P.d;
    for (const e of [-0.4, 0.15]) { x.beginPath(); x.moveTo(hx + e * P.hr, hy - P.hr * 0.6); x.lineTo(hx + e * P.hr + 5, hy - P.hr * 1.7); x.lineTo(hx + e * P.hr + 12, hy - P.hr * 0.5); x.fill(); }
    if (kind === 'deer') {
      x.strokeStyle = '#f2dcae'; x.lineWidth = 5;
      for (const e of [-6, 6]) { x.beginPath(); x.moveTo(hx + e, hy - P.hr); x.lineTo(hx + e - 6, hy - P.hr - 34); x.moveTo(hx + e - 3, hy - P.hr - 16); x.lineTo(hx + e + 10, hy - P.hr - 28); x.stroke(); }
    }
    if (kind === 'boar') { x.strokeStyle = '#fff6e0'; x.lineWidth = 4; x.beginPath(); x.moveTo(hx + P.hr * 1.4, hy + 6); x.lineTo(hx + P.hr * 1.6, hy - 6); x.stroke(); }
    // eye + nose
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(hx + P.hr * 0.55, hy - 3, 5, 0, TAU); x.fill();
    x.fillStyle = '#141638'; x.beginPath(); x.arc(hx + P.hr * 0.7, hy - 3, 3, 0, TAU); x.fill();
    x.fillStyle = '#2a1a1a'; x.beginPath(); x.arc(hx + P.hr * 1.75, hy + 2, 4, 0, TAU); x.fill();
    x.restore();
  }

  // tree crown (flat ball) + trunk
  const LEAF = ['#9dffa8', '#2fbf6a', '#0e4f3f'], LEAF2 = ['#c6ff8a', '#5ad15a', '#1a5a2a'];
  function tree(x, bx, by, h, r, k, col) {
    if (k <= 0) return;
    x.fillStyle = '#6a3f2a'; rr(x, bx - 11, by - h * k, 22, h * k + 6, 8); x.fill();
    ball(x, bx, by - h * k, r * k, col || LEAF, { sha: 0.4 });
    ball(x, bx - r * 0.55 * k, by - h * k + r * 0.25 * k, r * 0.6 * k, col || LEAF, { sha: 0.35 });
    ball(x, bx + r * 0.6 * k, by - h * k + r * 0.3 * k, r * 0.55 * k, col || LEAF, { sha: 0.35 });
  }

  // ================= SCENE A: the city =================
  function cityScene(x, W, H_, t) {
    const panK = eio(seg(t, TL.pan[0], TL.pan[1])) * (1 - eio(seg(t, TL.panBack[0], TL.panBack[1])));
    const cam = -560 * panK;
    const intro = eo(seg(t, TL.s1 - 0.4, TL.s1 + 0.6));
    const k5 = eio(seg(t, TL.trees - 0.2, TL.roofs + 0.4));          // overgrowth
    const k6 = eio(seg(t, TL.y300 - 0.1, TL.rusty + 0.6));            // rust
    const fallK = eio(seg(t, TL.crash - 0.15, TL.crash + 0.55));
    const kF = eio(seg(t, TL.gone - 0.35, TL.forest + 0.7));          // forest swallows everything
    const hitS = shake(t, TL.big, 14, 0.5) + shake(t, TL.crash, 10, 0.5);
    const zoom = 1.12 - 0.12 * intro + 0.04 * seg(t, TL.s1, TL.big) + 0.06 * eio(seg(t, TL.big - 0.2, TL.forest + 1));

    sky(x, W, H_, t, { x: t * 8, y: -cam * 0.15, z: zoom });
    glow(x, W / 2, G - 80 + cam, 560, '#6a4cff', 0.3 * (1 - seg(t, TL.out - 0.2, TL.out + 0.4)) + 0.12);
    // the Moon in the sky
    planet(x, 590, 220 + cam * 0.4, 40, PL.moon);

    x.save(); x.translate(W / 2 + hitS, H_ / 2 + cam + hitS * 0.4); x.scale(zoom, zoom); x.translate(-W / 2, -H_ / 2);

    // ---- buildings ----
    BLD.forEach((b, i) => {
      const off = TL.out - 0.55 + i * 0.12;      // lights go out building by building
      let h = b.h * (1 - 0.55 * kF);
      if (i === 1) h *= 1 - 0.5 * eio(seg(t, TL.crash + 0.05, TL.crash + 0.45));
      const col = b.c.map((c) => H.rgba(H.mix(c, RUST, 0.55 * k6)));
      x.save();
      if (i === 3) { x.translate(b.x + b.w, G); x.rotate(fallK * 1.25); x.translate(-(b.x + b.w), -G); x.globalAlpha *= 1 - seg(t, TL.crash + 0.35, TL.crash + 0.7); }
      const top = G - h;
      const g = x.createLinearGradient(b.x, 0, b.x + b.w, 0);
      g.addColorStop(0, col[0]); g.addColorStop(0.35, col[1]); g.addColorStop(1, col[2]);
      x.fillStyle = g; rr(x, b.x, top, b.w, h + 30, 10); x.fill();
      const q = H.rng(50 + i);
      for (let wy = top + 22; wy < G - 26; wy += 34) for (let wx = b.x + 14; wx < b.x + b.w - 20; wx += 24) {
        const lit = q.chance(0.62), warm = q.chance(0.8), dt = q.range(0, 0.25);
        const on = lit && t < off + dt;
        x.fillStyle = on ? (warm ? 'rgba(255,214,90,0.95)' : 'rgba(150,230,255,0.9)') : 'rgba(14,12,48,0.75)';
        rr(x, wx, wy, 11, 16, 3); x.fill();
      }
      // vines creep up the walls
      if (k5 > 0) {
        const r = H.rng(900 + i);
        for (let v = 0; v < 9; v++) {
          const vx = b.x + r.range(8, b.w - 8), vy = G - r.range(0, Math.min(h, 300)), st = r.range(0, 0.7);
          const vk = back(cl((k5 - st) / 0.3), 1.4);
          if (vk > 0) ball(x, vx, vy, r.range(14, 28) * vk, LEAF2, { sha: 0.35 });
        }
      }
      // little trees on the rooftops
      if (i !== 3 && i !== 1) { const rk = back(seg(t, TL.roofs + i * 0.06, TL.roofs + 0.35 + i * 0.06), 1.5); tree(x, b.x + b.w / 2, top + 4, 38, 30, rk, LEAF2); }
      x.restore();
    });
    // dust when the tower falls
    if (t > TL.crash + 0.2) { burst(x, 600, G - 40, (t - TL.crash - 0.2) * 0.9, 61, 260); glow(x, 600, G - 40, 260, '#d9b8a0', 0.45 * Math.max(0, 1 - (t - TL.crash - 0.2) / 1.0)); }

    // ---- street lamps ----
    for (const lx of [110, 360, 620]) {
      x.fillStyle = H.rgba(H.mix('#3b3480', RUST, k6)); rr(x, lx - 5, G - 170, 10, 172, 4); x.fill();
      rr(x, lx - 5, G - 172, 34, 10, 5); x.fill();
      const on = 1 - seg(t, TL.out - 0.15, TL.out + 0.05);
      x.fillStyle = on > 0 ? '#fff6c0' : '#4a4590'; x.beginPath(); x.arc(lx + 26, G - 160, 9, 0, TAU); x.fill();
      if (on > 0) glow(x, lx + 26, G - 150, 120, '#ffe9a0', 0.5 * on);
    }

    // ---- ground: sidewalk + road + underground ----
    x.fillStyle = '#4b3fa0'; x.fillRect(-60, G, W + 120, 34);
    const rg = x.createLinearGradient(0, G + 34, 0, ROADB);
    rg.addColorStop(0, '#231c62'); rg.addColorStop(1, '#17124a');
    x.fillStyle = rg; x.fillRect(-60, G + 34, W + 120, ROADB - G - 34);
    x.fillStyle = 'rgba(255,214,90,0.55)'; for (let lx = -40; lx < W + 40; lx += 110) { rr(x, lx, 1085, 60, 8, 4); x.fill(); }
    const dg = x.createLinearGradient(0, ROADB, 0, 1900);
    dg.addColorStop(0, '#3a2466'); dg.addColorStop(1, '#1a1240');
    x.fillStyle = dg; x.fillRect(-60, ROADB, W + 120, 800);
    // grass along the ground as nature returns
    if (k5 > 0) {
      const r = H.rng(321);
      for (let i = 0; i < 40; i++) { const gx = r.range(-20, W + 20), gh = r.range(12, 34) * k5; x.fillStyle = r.chance(0.5) ? '#38e08e' : '#2fbf5a'; x.beginPath(); x.moveTo(gx - 8, G + 6); x.quadraticCurveTo(gx, G - gh * 1.6, gx + 8, G + 6); x.fill(); }
    }

    // ---- subway tunnel (seen when the camera dips underground) ----
    if (panK > 0.01) {
      const [tx, ty, tw, th] = TUN;
      x.fillStyle = '#0f0c34'; rr(x, tx - 12, ty - 12, tw + 24, th + 24, 40); x.fill();
      x.fillStyle = '#221a5a'; rr(x, tx, ty, tw, th, 32); x.fill();
      // the train
      x.fillStyle = '#3ccbdc'; rr(x, 110, ty + 50, 500, 120, 30); x.fill();
      x.fillStyle = '#1d64b0'; rr(x, 110, ty + 130, 500, 40, 14); x.fill();
      x.fillStyle = 'rgba(12,17,69,0.85)'; for (let wx = 140; wx < 590; wx += 78) { rr(x, wx, ty + 70, 52, 40, 10); x.fill(); }
      // water rises
      const wk = eio(seg(t, TL.fill - 0.2, TL.water + 0.7));
      if (wk > 0) {
        x.save(); rr(x, tx, ty, tw, th, 32); x.clip();
        water(x, W, ty + th + 30, lerp(ty + th + 20, ty + 18, wk), 10, t);
        const r = H.rng(77);
        for (let i = 0; i < 14; i++) { const bx = r.range(tx + 30, tx + tw - 30), sp = r.range(0.6, 1.4), ph = r.range(0, 1); const u = ((t * sp + ph) % 1); const by = lerp(ty + th, lerp(ty + th + 20, ty + 18, wk), u); x.fillStyle = 'rgba(220,250,255,0.6)'; x.beginPath(); x.arc(bx, by, r.range(3, 7), 0, TAU); x.fill(); }
        x.restore();
      }
      pill(x, W / 2, ty - 52, 'subway tunnel', 32, { s: back(seg(t, TL.s2 + 0.2, TL.s2 + 0.5)) * panK, bg: C.cyan });
    }

    // ---- trees break through the road ----
    [[95, 0], [345, 0.12], [610, 0.24]].forEach(([bx, d], i) => {
      const gk = back(seg(t, TL.brk - 0.1 + d, TL.brk + 0.45 + d), 1.3) * (1 - 0.2 * kF);
      if (gk <= 0) return;
      x.strokeStyle = '#0d0a2a'; x.lineWidth = 6; x.lineCap = 'round';
      const r = H.rng(600 + i);
      for (let c = 0; c < 4; c++) { let px = bx, py = 1010; const a0 = r.range(0, TAU); x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 3; s++) { px += Math.cos(a0 + r.range(-0.6, 0.6)) * 28 * cl(gk); py += Math.sin(a0 + r.range(-0.6, 0.6)) * 14 * cl(gk); x.lineTo(px, py); } x.stroke(); }
      tree(x, bx, 1010, 250, 95, gk, LEAF);
    });

    // ---- cars ----
    const lightsOn = 1 - seg(t, TL.out - 0.1, TL.out + 0.1);
    for (const c of CARS) drawCar(x, carX(c, t), c[2], c[3], lightsOn, 0.85 * k6, 30 * k6);

    // ---- people: walking, then POOF ----
    PEOPLE.forEach(([x0, dir, col], i) => {
      const tp = TL.poof + i * 0.05;
      const px = ((x0 + dir * 26 * t) % 760 + 760) % 760 - 20, py = G - 26 - Math.abs(Math.sin(t * 7 + i)) * 4;
      if (t < tp) buddy(x, px, py, 22, { col: pal(col), look: [dir, 0], t, ph: i * 0.4 });
      else if (t < tp + 0.8) { const a = t - tp; glow(x, px, py, 60, '#ffffff', 0.7 * (1 - a / 0.8)); burst(x, px, py, a * 1.6, 30 + i, 70); for (let k = 0; k < 3; k++) spark(x, px + Math.cos(i + k * 2) * 30 * a * 3, py + Math.sin(i + k * 2) * 30 * a * 3, 10 * (1 - a / 0.8), '#ffffff', 1); }
    });

    // ---- animals move in ----
    const walkIn = (t0, from, to) => { const u = eio(seg(t, t0, t0 + 1.4)); return [lerp(from, to, u), u > 0 && u < 1 ? 1 : 0.15]; };
    if (t > TL.animals - 0.1) {
      const [dx, dw] = walkIn(TL.animals - 0.1, 800, 520); animal(x, dx, G + 2, 1.0 * (1 - kF * 0.4), 'deer', t, dw, -1);
      const [bx2, bw2] = walkIn(TL.animals + 0.3, 820, 300); animal(x, bx2, G + 60, 0.95, 'boar', t, bw2, -1);
    }
    if (t > TL.wolves - 0.3) { const [wx, ww] = walkIn(TL.wolves - 0.3, -120, 150); animal(x, wx, G + 4, 1.0, 'wolf', t, ww, 1); }
    if (t > TL.horses - 0.3) { const [hx, hw] = walkIn(TL.horses - 0.3, -160, 330); animal(x, hx, G + 110, 1.05, 'horse', t, hw, 1); }

    // ---- the forest swallows the city ----
    if (kF > 0) {
      const r = H.rng(4040);
      for (let i = 0; i < 12; i++) {
        const fx = -40 + i * 72 + r.range(-20, 20), top = r.range(560, 700), d = r.range(0, 0.35);
        const u = back(seg(t, TL.gone - 0.35 + d, TL.gone + 0.45 + d), 1.3);
        if (u <= 0) continue;
        const cy = lerp(1500, top, u), rad = r.range(100, 140);
        if (cy < 1290) { x.fillStyle = '#5a3a26'; rr(x, fx - 14, cy, 28, 1300 - cy, 10); x.fill(); }
        ball(x, fx, cy, rad, i % 2 ? LEAF : LEAF2, { sha: 0.4 });
      }
      for (let i = 0; i < 10; i++) { const fx = -20 + i * 84, u = eio(seg(t, TL.forest - 0.2 + i * 0.03, TL.forest + 0.6)); if (u > 0) ball(x, fx, lerp(1450, 880, u), 120, LEAF, { sha: 0.45 }); }
    }
    x.restore();

    // ---- labels (screen space) ----
    if (!COLD) {
      // time-jump clock
      const steps = [[TL.hours, '+ a few hours'], [TL.days, '+2 days'], [TL.y20, '+20 years'], [TL.y300, '+300 years']];
      let cur = null; for (const st of steps) if (t >= st[0] - 0.1) cur = st;
      const clockOut = seg(t, TL.big - 0.35, TL.big - 0.1);
      if (cur && clockOut < 1) {
        const sc = back(seg(t, cur[0] - 0.1, cur[0] + 0.2), 1.8) * (1 - clockOut);
        pill(x, W / 2, 140, cur[1], 46, { s: sc, bg: '#ffffff' });
      }
      // power off
      const po = back(seg(t, TL.shut, TL.shut + 0.3)) * (1 - seg(t, TL.pan[0], TL.pan[0] + 0.25));
      pill(x, W / 2, 245, 'power: OFF', 40, { s: po, bg: C.red, fg: '#ffffff' });
      // Chernobyl proof
      const ch = back(seg(t, TL.cher, TL.cher + 0.3)) * (1 - seg(t, TL.y20 - 0.3, TL.y20));
      if (ch > 0) {
        pill(x, W / 2 - 30, 250, 'Chernobyl zone', 40, { s: ch, bg: C.yellow });
        badge(x, W / 2 + 190, 250, 26, true, back(seg(t, TL.cher + 0.25, TL.cher + 0.55), 1.8));
        x.save(); x.globalAlpha = ch; text(x, 'empty since 1986', W / 2, 325, 32, '#ffffff'); x.restore();
      }
      // THE KEY HIT
      if (t > TL.big - 0.05) {
        const fade = 1 - seg(t, TL.white[0] - 0.4, TL.white[0]);
        const hk = Math.max(0, 1 - Math.abs(t - TL.big - 0.15) / 0.75);
        flare(x, W / 2, 300, hk * 0.8, t);
        x.save(); x.globalAlpha = fade;
        FLAT.bigNumber(x, '10,000', W / 2, 290, 140, t, TL.big, { seed: 97, spread: 320 });
        const ys = back(seg(t, TL.big + 0.25, TL.big + 0.55));
        x.save(); x.translate(W / 2, 400); x.scale(ys, ys); text(x, 'YEARS LATER', 0, 0, 54, '#ffffff'); x.restore();
        const gs = back(seg(t, TL.gone, TL.gone + 0.3), 1.6);
        pill(x, W / 2, 490, 'cities: gone', 40, { s: gs, bg: C.green });
        x.restore();
      }
    }
    // flash on the key hit
    const fl = Math.max(0, 1 - Math.abs(t - (TL.big + 0.05)) / 0.25);
    FLAT.flash(x, W, H_, fl);
  }

  // ================= SCENE B: the Moon, our footprints =================
  const PRINTS = (() => { const a = []; for (let i = 0; i < 9; i++) { const u = i / 8; a.push([lerp(110, 600, u) + (i % 2 ? 14 : -14), lerp(905, 815, u) + (i % 2 ? 10 : -10), lerp(1.15, 0.8, u)]); } return a; })();
  function moonScene(x, W, H_, t) {
    const intro = eo(seg(t, TL.cutB - 0.2, TL.cutB + 0.9));
    sky(x, W, H_, t, { x: 900 + t * 10, y: 80, z: 1.25 - 0.25 * intro + 0.05 * seg(t, TL.cutB, TL.D) });
    // Earth hanging in the black sky
    const er = 105 * back(seg(t, TL.cutB - 0.1, TL.cutB + 0.5), 1.3), ey = lerp(480, 455, seg(t, TL.cutB, TL.D));
    glow(x, 500, ey, er * 2.2, '#56c8ff', 0.25);
    if (er > 1) earth(x, 500, ey, er, { spin: t * 0.2, t });
    // the lunar ground
    const gy = lerp(1000, 0, intro);
    moonGlow(x, W / 2, 1700 + gy, 960, 0.25);
    planet(x, W / 2, 1700 + gy, 960, PL.moon);
    // footprints appear one by one
    PRINTS.forEach(([px, py, s], i) => {
      const k = back(seg(t, TL.feet - 0.15 + i * 0.09, TL.feet + 0.15 + i * 0.09), 1.6);
      if (k <= 0) return;
      x.save(); x.translate(px, py + gy); x.rotate(-0.5); x.scale(k * s, k * s);
      x.fillStyle = 'rgba(40,34,100,0.55)'; rr(x, -13, -26, 26, 52, 13); x.fill();
      x.fillStyle = 'rgba(20,16,70,0.35)'; for (let r = -18; r < 22; r += 9) { x.fillRect(-10, r, 20, 3); }
      x.restore();
    });
    if (t > TL.feet) glow(x, 360, 860 + gy, 320, '#fff6d0', 0.25 * Math.max(0, 1 - Math.abs(t - TL.feet - 0.8) / 0.8));
    // labels
    const ml = back(seg(t, TL.millions, TL.millions + 0.3), 1.6) * (1 - seg(t, TL.last - 0.3, TL.last));
    pill(x, W / 2, 650, 'millions of years', 44, { s: ml, bg: C.yellow });
    const l1 = back(seg(t, TL.last, TL.last + 0.4)), l2 = back(seg(t, TL.ever, TL.ever + 0.4));
    x.save(); x.translate(W / 2, 175); x.scale(l1, l1); text(x, 'The last sign', 0, 0, 62, '#ffffff'); x.restore();
    x.save(); x.translate(W / 2, 255); x.scale(l2, l2); text(x, 'we were ever here', 0, 0, 58, C.yellow); x.restore();
    if (t > TL.ever + 0.3) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 660), q.range(100, 380), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.ever + 0.3, TL.ever + 0.7)); }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    if (t < TL.cutB) cityScene(x, W, H_, t); else moonScene(x, W, H_, t);
    FLAT.whiteout(x, W, H_, seg(t, TL.white[0], TL.cutB) * (1 - seg(t, TL.cutB, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // 1 POOF + LIGHTS OUT
    k.play('swish', TL.poof - 0.1, { gain: 0.5 });
    k.play('sparkle', TL.poof, { gain: 0.8, n: 7 });
    PEOPLE.forEach(([x0], i) => { if (i % 2 === 0) boop(TL.poof + i * 0.05, 500 + i * 40, 0.6, (i / 6 - 0.5) * 0.8); });
    k.tone(TL.poof + 0.1, { f: [[0, 180], [1.0, 70]], type: 'triangle', dur: 1.1, gain: 0.06, a: 0.05 });   // cars roll to a stop
    pluck(backPeak(TL.hours - 0.1, TL.hours + 0.2, 1.8), 'E4', 0.8, 0);
    pluck(backPeak(TL.shut, TL.shut + 0.3), 'A3', 0.8, 0, true);
    k.tone(TL.out - 0.55, { f: [[0, 420], [0.7, 50]], type: 'sawtooth', dur: 0.8, gain: 0.05, a: 0.02, filter: 'lowpass', f2: 900 });
    for (let i = 0; i < 5; i++) k.play('tick', TL.out - 0.55 + i * 0.12, { f: 900 - i * 90, gain: 0.45, pan: (i / 4 - 0.5) * 0.8, minor: true });
    k.play('thud', TL.out + 0.05, { f: 70, gain: 0.55 });
    // 2 SUBWAY
    whoosh(TL.pan[0], 0.75, 0.8);
    pluck(backPeak(TL.days - 0.1, TL.days + 0.2, 1.8), 'G4', 0.8, 0);
    k.noise(TL.fill - 0.2, { dur: TL.water - TL.fill + 1.2, color: 'brown', filter: 'lowpass', f: [[0, 250], [1.4, 800]], gain: 0.28, a: 0.8, verb: 0.2 });
    k.noise(TL.fill, { dur: 1.2, color: 'pink', filter: 'bandpass', f: 1800, q: 1.2, gain: 0.05, a: 0.3, minor: true });
    whoosh(TL.panBack[0], 0.7, 0.7);
    // 3 ANIMALS
    boop(TL.animals + 0.2, 380, 0.8, pan(600));
    boop(TL.animals + 0.6, 260, 0.8, pan(560));
    tocksAlong(TL.animals, TL.animals + 1.3, 6, 300, 10, 0.2, 0.3);
    // 4 CHERNOBYL
    pluck(backPeak(TL.cher, TL.cher + 0.3), 'D4', 0.9, 0);
    chord(backPeak(TL.cher + 0.25, TL.cher + 0.55, 1.8), ['C4', 'E4', 'G4'], 0.6, 0.9);
    k.tone(TL.wolves + 0.2, { f: [[0, 480], [0.35, 720], [1.0, 560]], dur: 1.1, gain: 0.05, a: 0.25, verb: 0.5, pan: pan(150) });   // little howl
    boop(TL.horses + 0.3, 300, 0.8, pan(300));
    // 5 TREES
    pluck(backPeak(TL.y20 - 0.1, TL.y20 + 0.2, 1.8), 'E4', 0.8, 0);
    [0, 0.12, 0.24].forEach((d, i) => { const tt = backPeak(TL.brk - 0.1 + d, TL.brk + 0.45 + d, 1.3); k.play('thud', tt, { f: 90 + i * 10, gain: 0.4, minor: true }); boop(tt, 320 + i * 60, 0.7, (i - 1) * 0.5); });
    k.play('sparkle', TL.roofs, { gain: 0.6, n: 5 });
    // 6 TOWERS FALL
    pluck(backPeak(TL.y300 - 0.1, TL.y300 + 0.2, 1.8), 'A4', 0.8, 0, true);
    k.tone(TL.rusty, { f: [[0, 160], [0.6, 120]], type: 'sawtooth', dur: 0.7, gain: 0.03, a: 0.2, filter: 'lowpass', f2: 600, minor: true });   // creak
    k.play('impact', TL.crash + 0.3, { gain: 0.7, pan: pan(600) });
    k.noise(TL.crash + 0.3, { dur: 1.2, color: 'brown', filter: 'lowpass', f: [[0, 900], [1.2, 150]], gain: 0.3, a: 0.01, verb: 0.3 });
    // 7 THE KEY HIT (quiet just before)
    hit(TL.big, 1);
    pluck(backPeak(TL.big + 0.25, TL.big + 0.55), 'E4', 0.6, 0, true);
    pluck(backPeak(TL.gone, TL.gone + 0.3, 1.6), 'C4', 0.8, 0);
    air(TL.gone - 0.3, 1.4, 1200, 0.8, 0, 0.5);
    chord(TL.forest, ['C3', 'G3', 'C4', 'E4'], 0.7, 1.6);
    // 8-9 THE MOON
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.0, 0, 0.55);
    chord(TL.cutB, ['A2', 'E3', 'C4'], 0.6, 1.6);
    pluck(backPeak(TL.millions, TL.millions + 0.3, 1.6), 'E4', 0.9, 0);
    PRINTS.forEach((p, i) => k.play('tock', TL.feet + 0.05 + i * 0.09, { f: 420 + i * 25, gain: 0.3, pan: pan(p[0]), minor: true }));
    pluck(backPeak(TL.last, TL.last + 0.4), 'D4', 0.8, 0);
    const ev = backPeak(TL.ever, TL.ever + 0.4);
    chord(ev, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.0, 2.4); pluck(ev, 'C4', 1.0, 0); k.play('sparkle', ev + 0.1, { gain: 0.7, n: 6 });
  }

  SCENE({
    init,
    // cold open: the forest swallows the city in slow motion while the hook line plays
    cold: () => TL.gone - 0.05,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
