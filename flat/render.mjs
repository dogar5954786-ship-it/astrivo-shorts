// Render a flat-style Short.
//   node flat/render.mjs --job jobs/<id> --timing build/<id>/timing.json --voice build/<id>/voice.mp3 --out out/<id>.mp4
//   node flat/render.mjs --job jobs/<id> --timing build/<id>/timing.json --sheet build/<id>/sheet.png [--frames 0.2,1.5,...]
// Frames are drawn by flat/page.html in headless Chrome; sound effects + music are rendered offline with the SOUND kit,
// then ffmpeg ducks the music under the voice and mixes everything to -14 LUFS.
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn, spawnSync } from 'child_process';
import { createRequire } from 'module';
const req = createRequire(import.meta.url);
let chromium; try { ({ chromium } = req('playwright-core')); } catch { try { ({ chromium } = req('playwright')); } catch { ({ chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright')); } }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const a = process.argv.slice(2), opt = (k, d = null) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const job = opt('--job'), timing = opt('--timing'), out = opt('--out'), voice = opt('--voice'), sheet = opt('--sheet');
const FPS = 30, SCALE = parseFloat(opt('--scale', '1.5'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => {
  const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
}).listen(0);
const port = server.address().port;
const exe = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
const errors = [];
page.on('pageerror', (e) => { errors.push(e.message); console.error('PAGEERR', e.message); });
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(`http://localhost:${port}/flat/page.html?job=${encodeURIComponent(job)}&timing=${encodeURIComponent(timing)}`);
await page.waitForFunction('window.READY === true || window.BOOT_ERROR', null, { timeout: 60000 });
const bootErr = await page.evaluate(() => window.BOOT_ERROR || null);
if (bootErr) { console.error('BOOT ERROR', bootErr); process.exit(2); }
const D = await page.evaluate(() => window.DURATION);
const done = async (code = 0) => { await browser.close(); server.close(); process.exit(code); };

if (sheet) {
  // contact sheet: default = 3 hook frames + the middle of every segment + the last second
  let ts = opt('--frames');
  ts = ts ? ts.split(',').map(Number) : await page.evaluate(() => { const T = []; return T; });
  if (!ts.length) {
    const tm = JSON.parse(fs.readFileSync(path.join(root, timing), 'utf8'));
    ts = [0.05, 0.6, Math.max(0.1, tm.segs[1] ? tm.segs[1].t0 - 0.15 : 1.5)];
    tm.segs.forEach((s) => ts.push(+(s.t0 + (s.t1 - s.t0) * 0.6).toFixed(2)));
    ts.push(+(tm.D - 0.3).toFixed(2));
  }
  const png = await page.evaluate(async (ts) => {
    const cols = Math.min(6, ts.length), rows = Math.ceil(ts.length / cols), w = 240, h = 427;
    const sh = document.createElement('canvas'); sh.width = cols * w; sh.height = rows * (h + 26); const sx = sh.getContext('2d');
    sx.fillStyle = '#111'; sx.fillRect(0, 0, sh.width, sh.height);
    setRenderScale(1);
    ts.forEach((t, i) => { seek(t); const cx = (i % cols) * w, cy = Math.floor(i / cols) * (h + 26); sx.drawImage(document.getElementById('cv'), cx, cy, w, h); sx.fillStyle = '#fff'; sx.font = '700 16px sans-serif'; sx.fillText(t.toFixed(2) + ' s', cx + 8, cy + h + 19); });
    return sh.toDataURL('image/png');
  }, ts);
  fs.writeFileSync(sheet, Buffer.from(png.split(',')[1], 'base64'));
  console.log('sheet', sheet, 'frames', ts.join(','), 'errors', errors.length);
  await done(errors.length ? 3 : 0);
}

// ---- full render ----
const work = path.dirname(path.resolve(out.replace(/\.mp4$/, '') + '.x'));
const tmp = path.join(root, 'build', path.basename(job)); fs.mkdirSync(tmp, { recursive: true });
await page.evaluate((s) => setRenderScale(s), SCALE);
const silent = path.join(tmp, 'silent.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
const N = Math.round(D * FPS); let slow = 0;
for (let i = 0; i < N; i++) {
  const r = await page.evaluate((t) => { const t0 = performance.now(); seek(t); const ms = performance.now() - t0; return { d: document.getElementById('cv').toDataURL('image/jpeg', 0.93), ms }; }, i / FPS);
  slow = Math.max(slow, r.ms);
  if (!ff.stdin.write(Buffer.from(r.d.split(',')[1], 'base64'))) await new Promise((res) => ff.stdin.once('drain', res));
  if (i % 60 === 0) process.stderr.write(`\rframe ${i}/${N}`);
}
ff.stdin.end(); await new Promise((res) => ff.on('close', res));
console.log(`\nframes ${N}, slowest draw ${slow.toFixed(1)} ms`);
// sound stems
for (const stem of ['music', 'sfx']) {
  const b64 = await page.evaluate(async (stem) => {
    const r = await SOUND.renderOffline((k) => scoreStem(k, stem), DURATION, 48000, { voiceover: false });
    const u = new Uint8Array(r.inter.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s);
  }, stem);
  fs.writeFileSync(path.join(tmp, stem + '.f32'), Buffer.from(b64, 'base64'));
}
await browser.close(); server.close();
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const raw = (f) => ['-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', path.join(tmp, f)];
const vin = voice ? ['-i', voice] : ['-f', 'lavfi', '-t', String(D), '-i', 'anullsrc=r=48000:cl=stereo'];
const fc = '[1:a]aresample=48000,aformat=channel_layouts=stereo,apad,asplit=2[v][vsc];' +
  '[2:a][vsc]sidechaincompress=threshold=0.02:ratio=10:attack=10:release=350:makeup=1[m];' +
  '[m]volume=0.75[m2];[3:a]volume=0.9[s];[v]volume=1.0[v2];' +
  '[v2][m2][s]amix=inputs=3:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]';
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, ...vin, ...raw('music.f32'), ...raw('sfx.f32'),
  '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-t', D.toFixed(3), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status || 1);
console.log('DONE', out, D.toFixed(2), 's', 'page errors', errors.length);
process.exit(errors.length ? 3 : 0);
