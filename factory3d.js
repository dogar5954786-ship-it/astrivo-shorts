// Builds the 3D characters, textures and background for the Shorts renderer.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function rngFrom(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t) => Math.pow(clamp(t), 3);
export const easeOutBack = (t, s = 1.70158) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };

const OUTLINE = 0x1e1646;

// ---------------------------------------------------------------- textures
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping;
  return t;
}
function blob(ctx, cx, cy, r, rng, w) {
  const n = 22; let rs = Array.from({ length: n }, () => r * (0.65 + rng() * 0.6));
  for (let k = 0; k < 3; k++) rs = rs.map((_, i) => (rs[(i + n - 1) % n] + rs[i] * 2 + rs[(i + 1) % n]) / 4);
  for (const dx of [-w, 0, w]) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const x = cx + dx + Math.cos(a) * rs[i] * 1.3, y = cy + Math.sin(a) * rs[i] * 0.8; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill();
  }
}
const TEX = {};
export function planetTexture(kind) {
  if (TEX[kind]) return TEX[kind];
  const rng = rngFrom(hash(kind));
  const W = 1024, H = 512;
  TEX[kind] = canvasTex(W, H, (ctx) => {
    const fillAll = (c) => { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); };
    const speckle = (col, n, rmin, rmax) => { ctx.fillStyle = col; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.ellipse(rng() * W, rng() * H, rmin + rng() * (rmax - rmin), (rmin + rng() * (rmax - rmin)) * 0.8, 0, 0, 7); ctx.fill(); } };
    if (kind === 'moon') {
      fillAll('#f1ead2');
      for (let i = 0; i < 46; i++) {
        const x = rng() * W, y = 50 + rng() * (H - 100), r = 10 + rng() * 38;
        for (const dx of [-W, 0, W]) {
          const g = ctx.createRadialGradient(x + dx - r * 0.2, y - r * 0.2, r * 0.1, x + dx, y, r);
          g.addColorStop(0, '#cfc6a8'); g.addColorStop(0.8, '#d8d0b4'); g.addColorStop(1, '#e8e0c6');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x + dx, y, r, r * 0.85, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = '#bdb396'; ctx.lineWidth = 3; ctx.stroke();
        }
      }
    } else if (kind === 'earth') {
      fillAll('#2f86e8');
      ctx.fillStyle = '#58c464'; for (let i = 0; i < 9; i++) blob(ctx, rng() * W, 110 + rng() * 290, 45 + rng() * 55, rng, W);
      ctx.fillStyle = '#e8f6ff'; ctx.fillRect(0, 0, W, 34); ctx.fillRect(0, H - 34, W, 34);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.ellipse(rng() * W, 60 + rng() * 390, 30 + rng() * 80, 7 + rng() * 12, 0, 0, 7); ctx.fill(); }
    } else if (kind === 'sun') {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffb62e'); g.addColorStop(0.5, '#ffd84a'); g.addColorStop(1, '#ffa628'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      speckle('rgba(255,140,30,0.55)', 90, 8, 34); speckle('rgba(255,236,150,0.5)', 60, 6, 24);
    } else if (kind === 'mars') {
      fillAll('#d8623c'); speckle('rgba(160,60,36,0.6)', 70, 14, 60); speckle('rgba(240,150,110,0.35)', 40, 10, 40);
      ctx.fillStyle = '#fbf7f2'; ctx.fillRect(0, 0, W, 30); ctx.fillRect(0, H - 22, W, 22);
    } else if (kind === 'saturn' || kind === 'jupiter') {
      const cols = kind === 'saturn' ? ['#ecc886', '#d6aa69', '#f5deaf', '#c89a5f'] : ['#e4b282', '#be7850', '#f0dcbe', '#b06c48'];
      let y = 0; let i = 0; while (y < H) { const h = 18 + rng() * 44; ctx.fillStyle = cols[i++ % cols.length]; ctx.fillRect(0, y, W, h); y += h; }
      if (kind === 'jupiter') { ctx.fillStyle = '#c4543c'; ctx.beginPath(); ctx.ellipse(W * 0.28, H * 0.62, 70, 36, 0, 0, 7); ctx.fill(); }
    } else { // venus
      fillAll('#f4cc7c'); for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#e2a85c' : '#f8dc98'; ctx.fillRect(0, i * 42 + rng() * 10, W, 14 + rng() * 16); }
    }
  });
  return TEX[kind];
}

export function gradientTex(stops) {
  return canvasTex(8, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => g.addColorStop(p, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
}
export function glowTex(color) {
  const t = canvasTex(256, 256, (ctx, w, h) => { const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  t.wrapS = THREE.ClampToEdgeWrapping; return t;
}

// -------------------------------------------------------------------- face
const EX = {
  shock: { es: 1.0, pr: 0.12, pd: [0.03, 0.02], ba: 0.0, arch: 0.07, lift: 0.10, left: 0, m: ['ell', 0.17, 0.23] },
  scared: { es: 1.0, pr: 0.085, pd: [0.05, -0.04], ba: 0.5, arch: 0.0, lift: 0.07, left: 0, m: ['ell', 0.2, 0.12] },
  gasp: { es: 1.12, pr: 0.065, pd: [0.0, -0.01], ba: 0.0, arch: 0.09, lift: 0.18, left: 0, m: ['ell', 0.23, 0.31] },
  happy: { es: 0.92, pr: 0.13, pd: [0.0, 0.0], ba: -0.15, arch: 0.05, lift: 0.05, left: 0, m: ['half', 0.27, 0.18] },
  curious: { es: 1.0, pr: 0.11, pd: [0.06, 0.04], ba: 0.0, arch: 0.0, lift: 0.1, left: 0.08, m: ['ell', 0.09, 0.11] },
  sad: { es: 1.0, pr: 0.1, pd: [0.0, -0.05], ba: 0.5, arch: 0.0, lift: 0.04, left: 0, m: ['frown', 0.22, 0.12] },
};
export function exprParams(name) { return EX[name] || EX.shock; }

const matWhite = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15 });
const surf = (nx, ny) => new THREE.Vector3(nx, ny, Math.sqrt(Math.max(0.0001, 1 - nx * nx - ny * ny)));
const zQ = (n) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize());

export function makeFace(browColor = 0x1c1440) {
  const root = new THREE.Group();
  const eyes = [];
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x15102a, roughness: 0.2, clearcoat: 1 });
  const hl = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sclGeo = new THREE.SphereGeometry(0.27, 32, 24);
  const pupGeo = new THREE.SphereGeometry(1, 20, 16);
  const hlGeo = new THREE.SphereGeometry(1, 10, 8);
  for (const s of [-1, 1]) {
    const n = surf(s * 0.34, 0.12);
    const g = new THREE.Group(); g.position.copy(n.clone().multiplyScalar(0.96)); g.quaternion.copy(zQ(n)); root.add(g);
    const scl = new THREE.Mesh(sclGeo, matWhite()); scl.scale.set(1, 1.18, 0.5); g.add(scl);
    const pup = new THREE.Mesh(pupGeo, dark); g.add(pup);
    const h1 = new THREE.Mesh(hlGeo, hl); g.add(h1);
    const brow = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhysicalMaterial({ color: browColor, roughness: 0.4 })); root.add(brow);
    eyes.push({ s, g, scl, pup, h1, brow, key: '' });
  }
  // mouth
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x46122a, side: THREE.DoubleSide });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff6a80, side: THREE.DoubleSide });
  const ellShape = new THREE.Shape(); ellShape.absellipse(0, 0, 1, 1, 0, Math.PI * 2, false, 0);
  const halfShape = new THREE.Shape(); halfShape.moveTo(-1, 0); halfShape.absellipse(0, 0, 1, 1, Math.PI, Math.PI * 2, false, 0); halfShape.lineTo(-1, 0);
  const mouth = {
    ell: new THREE.Mesh(new THREE.ShapeGeometry(ellShape, 28), mouthMat),
    half: new THREE.Mesh(new THREE.ShapeGeometry(halfShape, 28), mouthMat),
    tongue: new THREE.Mesh(new THREE.ShapeGeometry(ellShape, 20), tongueMat),
  };
  const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14; pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.6, 0)); }
  mouth.frown = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.12, 8), new THREE.MeshBasicMaterial({ color: 0x2a1030 }));
  const mq = zQ(surf(0, -0.4));
  const mp = surf(0, -0.4).multiplyScalar(1.012);
  for (const k of Object.keys(mouth)) { mouth[k].position.copy(mp); mouth[k].quaternion.copy(mq); root.add(mouth[k]); mouth[k].visible = false; }
  // cheeks
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xffa4ac, transparent: true, opacity: 0.8 });
  for (const s of [-1, 1]) {
    const n = surf(s * 0.62, -0.18); const c = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), cheekMat);
    c.position.copy(n.clone().multiplyScalar(1.006)); c.quaternion.copy(zQ(n)); c.scale.set(1.3, 0.8, 1); root.add(c);
  }
  const lastKey = {};
  root.userData.set = (A, B, k) => { // blend params of two expressions (A -> B by k)
    const m = (a, b) => lerp(a, b, k);
    const es = m(A.es, B.es), pr = m(A.pr, B.pr), pdx = m(A.pd[0], B.pd[0]), pdy = m(A.pd[1], B.pd[1]);
    const ba = m(A.ba, B.ba), arch = m(A.arch, B.arch), lift = m(A.lift, B.lift), left = m(A.left, B.left);
    for (const e of eyes) {
      e.scl.scale.set(es, 1.18 * es, 0.5);
      const sx = pdx / 0.27, sy = pdy / (0.27 * 1.18);
      const dz = 0.135 * es * Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy));
      e.pup.position.set(pdx * es, pdy * es, dz); e.pup.scale.set(pr, pr, pr * 0.55);
      e.h1.position.set(pdx * es - pr * 0.35, pdy * es + pr * 0.4, dz + pr * 0.35); e.h1.scale.setScalar(pr * 0.3);
      // brow
      const yb = 0.12 + 0.27 * 1.18 * es + 0.06 + lift + (e.s === -1 ? left : 0);
      const n = surf(e.s * 0.34, Math.min(0.85, yb));
      e.brow.position.copy(n.clone().multiplyScalar(1.0)); e.brow.quaternion.copy(zQ(n));
      e.brow.rotateZ(-e.s * ba);
      const a = Math.round((arch + (e.s === -1 ? left * 0.4 : 0)) * 100) / 100;
      if (e.key !== String(a)) {
        e.key = String(a); e.brow.geometry.dispose();
        e.brow.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.15, 0, 0), new THREE.Vector3(0, a * 2, 0), new THREE.Vector3(0.15, 0, 0)), 10, 0.042, 6);
      }
    }
    // mouth: blend sizes, pick type by nearest
    const pick = k < 0.5 ? A.m : B.m;
    const mw = m(A.m[1], B.m[1]), mh = m(A.m[2], B.m[2]);
    for (const key of Object.keys(mouth)) mouth[key].visible = false;
    const t = pick[0];
    const mm = mouth[t]; mm.visible = true;
    if (t === 'frown') { mm.scale.set(mw, mh * 1.0, 1); mm.position.copy(mp).add(new THREE.Vector3(0, -0.02, 0)); }
    else { mm.scale.set(mw, mh, 1); mm.position.copy(mp); }
    if (t === 'ell' || t === 'half') {
      mouth.tongue.visible = mh > 0.1;
      mouth.tongue.scale.set(mw * 0.6, mh * 0.42, 1);
      mouth.tongue.position.copy(mp).add(new THREE.Vector3(0, t === 'half' ? -mh * 0.5 : -mh * 0.45, 0.004));
    }
  };
  return root;
}

// ----------------------------------------------------------------- planets
const PL = {
  moon: { glow: 0xffeebe }, earth: { glow: 0x78d2ff }, sun: { glow: 0xffaf32, emissive: true }, mars: { glow: 0xff9670 },
  saturn: { glow: 0xffe1a0, ring: true }, jupiter: { glow: 0xffd7aa }, venus: { glow: 0xffe196 },
};
const SPHERE = new THREE.SphereGeometry(1, 96, 64);
function hullOf(geo, scale, color = OUTLINE) { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, side: THREE.BackSide })); m.scale.multiplyScalar(scale); return m; }

export function makePlanet(kind) {
  const st = PL[kind];
  const root = new THREE.Group();
  const spin = new THREE.Group(); root.add(spin);
  const mat = st.emissive ? new THREE.MeshBasicMaterial({ map: planetTexture(kind) })
    : new THREE.MeshPhysicalMaterial({ map: planetTexture(kind), roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.3 });
  const body = new THREE.Mesh(SPHERE, mat); spin.add(body);
  root.add(hullOf(SPHERE, 1.045));
  const face = makeFace(); root.add(face);
  if (st.ring) {
    const rg = new THREE.RingGeometry(1.35, 2.15, 96, 1); const uv = rg.attributes.uv; const pos = rg.attributes.position;
    for (let i = 0; i < uv.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (r - 1.35) / 0.8, 0.5); }
    const tex = canvasTex(256, 4, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, 0); [['0', '#d6b078'], ['0.3', '#f0d6a0'], ['0.5', '#c89c64'], ['0.75', '#ecd09a'], ['1', '#d2aa72']].forEach(([p, c]) => g.addColorStop(+p, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
    tex.wrapS = THREE.ClampToEdgeWrapping;
    const ring = new THREE.Mesh(rg, new THREE.MeshPhysicalMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.6 }));
    const rh = new THREE.Mesh(new THREE.RingGeometry(1.3, 2.2, 96, 1), new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.DoubleSide })); rh.position.z = -0.01;
    const rgrp = new THREE.Group(); rgrp.add(ring, rh); rgrp.rotation.x = -Math.PI / 2 + 0.38; rgrp.rotation.y = 0.0; rgrp.rotation.z = -0.28;
    root.add(rgrp);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('#' + st.glow.toString(16).padStart(6, '0')), blending: THREE.AdditiveBlending, transparent: true, opacity: st.emissive ? 0.9 : 0.35, depthWrite: false }));
  glow.scale.setScalar(st.emissive ? 4.6 : 3.4); glow.position.z = -0.3; root.add(glow);
  root.userData = { kind, face, spin, radius: 2.7, setExpr: (A, B, k) => face.userData.set(A, B, k) };
  return root;
}

// --------------------------------------------------------------- astronaut
export function makeAstro() {
  const root = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf6f9fd, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const gray = new THREE.MeshPhysicalMaterial({ color: 0x9aa8c4, roughness: 0.45, clearcoat: 0.4 });
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x5a6ea0, roughness: 0.4, clearcoat: 0.4 });
  const glove = new THREE.MeshPhysicalMaterial({ color: 0x7c93bd, roughness: 0.4, clearcoat: 0.4 });
  const add = (parent, mesh, hull = 1.07) => { parent.add(mesh); if (hull) { const h = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.BackSide })); h.position.copy(mesh.position); h.rotation.copy(mesh.rotation); h.scale.copy(mesh.scale).multiplyScalar(hull); parent.add(h); } return mesh; };
  // helmet + head
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(1.4, 48, 32), white); helmet.position.set(0, 2.45, -0.15); add(root, helmet, 1.045);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), gray); ear.scale.set(0.6, 1.1, 0.9); ear.position.set(s * 1.42, 2.45, 0); add(root, ear, 1.12); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.12, 40, 28), new THREE.MeshPhysicalMaterial({ color: 0xf7c9a0, roughness: 0.55 })); head.position.set(0, 2.4, 0.5); root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(1.15, 40, 20, 0, Math.PI * 2, 0, 1.05), new THREE.MeshPhysicalMaterial({ color: 0x5b3a29, roughness: 0.6 })); hair.position.copy(head.position); hair.rotation.x = -0.25; root.add(hair);
  const face = makeFace(0x4a2c1c); face.scale.setScalar(1.12); face.position.copy(head.position); root.add(face);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(1.3, 40, 28, 0, Math.PI * 2, 0, 2.2), new THREE.MeshPhysicalMaterial({ color: 0xb4e4ff, transparent: true, opacity: 0.28, roughness: 0.05, clearcoat: 1, depthWrite: false }));
  visor.position.set(0, 2.4, 0.52); root.add(visor);
  // torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 1.3, 8, 20), white); torso.position.set(0, 0.05, 0); add(root, torso, 1.05);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.17, 12, 32), blue); belt.rotation.x = Math.PI / 2; belt.position.set(0, -0.55, 0); root.add(belt);
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.6, 0.18, 3, 0.06), gray); panel.position.set(0, 0.25, 0.93); root.add(panel);
  [[-0.26, 0xff5a5a], [0.0, 0x4fa3ff], [0.26, 0xffc93c]].forEach(([x, c]) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: c })); l.position.set(x, 0.25, 1.05); root.add(l); });
  const patch = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.26, 0.08, 2, 0.03), new THREE.MeshBasicMaterial({ color: 0xffc93c })); patch.position.set(-0.7, 0.7, 0.72); patch.rotation.y = -0.6; root.add(patch);
  const pack = new THREE.Mesh(new RoundedBoxGeometry(2.1, 2.4, 0.9, 4, 0.25), gray); pack.position.set(0, 0.2, -1.15); add(root, pack, 1.04);
  // limbs
  const arms = [], legs = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 1.1, 0.75, 0); root.add(piv);
    const ua = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 6, 14), white); ua.position.set(0, -0.75, 0); add(piv, ua, 1.08);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), glove); gl.position.set(0, -1.55, 0); add(piv, gl, 1.1);
    arms.push({ s, piv });
    const lp = new THREE.Group(); lp.position.set(s * 0.48, -1.2, 0); root.add(lp);
    const lg = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.9, 6, 14), white); lg.position.set(0, -0.85, 0); add(lp, lg, 1.07);
    const bt = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), blue); bt.scale.set(1, 0.75, 1.35); bt.position.set(0, -1.75, 0.18); add(lp, bt, 1.07);
    legs.push({ s, piv: lp });
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('#50d8ff'), blending: THREE.AdditiveBlending, transparent: true, opacity: 0.35, depthWrite: false }));
  glow.scale.setScalar(9); glow.position.set(0, 0.5, -1.6); root.add(glow);
  root.position.y = 0;
  const wrap = new THREE.Group(); wrap.add(root); root.position.y = -0.2;
  wrap.userData = { kind: 'astronaut', face, arms, legs, inner: root, setExpr: (A, B, k) => face.userData.set(A, B, k) };
  return wrap;
}

// pose: set arm/leg angles at time t
export function poseAstro(a, pose, t) {
  const { arms, legs } = a.userData;
  const sw = Math.sin(t * 2.2), sw2 = Math.sin(t * 2.2 + 1.7);
  const P = {
    float: [[0.35 + 0.15 * sw, 0], [-0.35 - 0.15 * sw2, 0], 0.2 * sw, -0.2 * sw],
    point: [[2.5, 0.2], [-0.25, 0], 0.15 * sw, -0.15 * sw],
    wave: [[-0.2, 0], [-2.5 + 0.4 * Math.sin(t * 9), 0], 0.1 * sw, -0.1 * sw],
    panic: [[2.7 + 0.35 * Math.sin(t * 14), 0], [-2.7 - 0.35 * Math.sin(t * 14 + 1), 0], 0.5 * Math.sin(t * 11), -0.5 * Math.sin(t * 11)],
    cheer: [[2.8 + 0.15 * sw, 0], [-2.8 - 0.15 * sw2, 0], 0.3 * sw, -0.3 * sw],
  }[pose] || null;
  const p = P || [[0.35, 0], [-0.35, 0], 0, 0];
  arms[0].piv.rotation.set(p[0][1], 0, p[0][0]);       // left arm (x<0): +z swings it outward/up
  arms[1].piv.rotation.set(p[1][1], 0, p[1][0]);
  legs[0].piv.rotation.set(p[2], 0, 0.06); legs[1].piv.rotation.set(p[3], 0, -0.06);
}

// -------------------------------------------------------------- background
export const PAL = {
  purple: { top: '#0a0726', mid: '#1e1158', bot: '#081648', neb: ['#aa32be', '#288ce6', '#783cdc', '#dc4696'], amb: 0x7a6cff, rim: 0x6ad0ff },
  blue: { top: '#040a28', mid: '#0a286e', bot: '#061850', neb: ['#28a0f0', '#5a5ae6', '#1ec8c8'], amb: 0x5aa8ff, rim: 0x7ae0ff },
  red: { top: '#180410', mid: '#500e28', bot: '#220828', neb: ['#e6463c', '#c83282', '#fa8c32'], amb: 0xff7a6a, rim: 0xffa06a },
  dark: { top: '#03030e', mid: '#0c0a28', bot: '#040618', neb: ['#4632a0', '#1e50a0'], amb: 0x6a6aa0, rim: 0x8aa0ff },
};
let _dot; function dotTex() { return _dot ||= glowTex('rgba(255,255,255,1)'); }
export function makeStars() {
  const rng = rngFrom(99);
  const mk = (n, size, spread) => {
    const g = new THREE.BufferGeometry(); const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = (rng() - 0.5) * spread[0]; a[i * 3 + 1] = (rng() - 0.5) * spread[1]; a[i * 3 + 2] = -spread[2] * (0.15 + rng() * 0.85); }
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ map: dotTex(), alphaTest: 0.05, color: 0xffffff, size, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
  };
  const g = new THREE.Group(); g.add(mk(900, 0.22, [190, 260, 160]), mk(160, 0.6, [150, 210, 110])); return g;
}
export function makeNebulae(colors) {
  const g = new THREE.Group(); const rng = rngFrom(7);
  colors.forEach((c, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: glowTex(c), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set((rng() - 0.5) * 60, (rng() - 0.5) * 80, -50 - i * 12); m.userData.ph = rng() * 6; g.add(m);
  });
  return g;
}
