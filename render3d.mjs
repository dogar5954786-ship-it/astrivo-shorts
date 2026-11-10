// usage: node render3d.mjs scene.json out_silent.mp4 [--frames t1,t2,...] [--dur seconds]
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { createRequire } from 'module';
const { chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright');
const root = path.dirname(new URL(import.meta.url).pathname);
const [sceneFile, outFile, ...rest] = process.argv.slice(2);
const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8'));
const FPS = 30, dur = parseFloat(opt('--dur') || scene.duration);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((q, r) => {
  const p = path.join(root, decodeURIComponent(q.url.split('?')[0] === '/' ? ('/'+(process.env.PAGE||'real3d.html')) : q.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(`http://localhost:${port}/`); await page.waitForFunction('window.loaded === true');
await page.evaluate((s) => window.loadScene(s), scene);
const grab = async (t) => { const d = await page.evaluate((t) => { window.renderFrame(t); return document.getElementById('out').toDataURL('image/jpeg', 0.93); }, t); return Buffer.from(d.split(',')[1], 'base64'); };
const frames = opt('--frames');
if (frames) { let i = 0; for (const t of frames.split(',')) { fs.writeFileSync(`${outFile.replace(/\.\w+$/, '')}_f${i++}.jpg`, await grab(parseFloat(t))); } }
else {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-vf', 'scale=1080:1920:flags=lanczos', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) { const b = await grab(i / FPS); if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); if (i % 30 === 0) process.stderr.write(`\r${i}/${n}`); }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
}
await browser.close(); server.close();
