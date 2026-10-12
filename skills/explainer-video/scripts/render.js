// Render a seekable explainer page to MP4.
// Run from the project dir:
//   node render.js stills 2.5 30 61.2      -> build/still_<t>.png (fast visual QA)
//   node render.js sheet 2.5 30 61.2 ...   -> stills + build/sheet.png contact sheet (needs python+PIL)
//   node render.js video [workers=6]       -> build/part*.mp4 (silent)
//   node render.js final [out.mp4]         -> concat parts + build/mix.wav -> out.mp4 (loudnorm -14 LUFS)
// Env: CHROME_PATH to override browser; FPS (default 30).
const fs = require('fs'), path = require('path'), { spawn, spawnSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { ({ chromium } = require('playwright')); }

const ROOT = process.cwd();
const BUILD = path.join(ROOT, 'build');
const FPS = +(process.env.FPS || 30);
fs.mkdirSync(BUILD, { recursive: true });

function findChrome() {
  const c = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return c.find(p => p && fs.existsSync(p));
}

function writeTimelineJs() {
  fs.writeFileSync(path.join(ROOT, 'timeline.js'), 'window.TL = ' + fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8') + ';');
}

async function openPage(browser, size) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text()); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.READY === true', null, { timeout: 60000 });
  return page;
}

async function renderRange(browser, size, f0, f1, out) {
  const page = await openPage(browser, size);
  const cdp = await page.context().newCDPSession(page);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), out]);
  ff.stderr.on('data', d => process.stderr.write(d));
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.seek(t), f / FPS);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`${path.basename(out)}: ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await page.close();
}

function final(out) {
  const parts = path.join(BUILD, 'parts.txt'), mix = path.join(BUILD, 'mix.wav');
  if (!fs.existsSync(parts)) throw new Error('run `node render.js video` first');
  const args = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', parts];
  if (fs.existsSync(mix)) args.push('-i', mix, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-shortest');
  args.push('-c:v', 'copy', '-movflags', '+faststart', out);
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status);
  console.log('wrote', out);
}

(async () => {
  const [mode = 'video', ...args] = process.argv.slice(2);
  if (mode === 'final') return final(path.resolve(args[0] || path.join(ROOT, 'output.mp4')));
  writeTimelineJs();
  const size = (() => { const m = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/viewBox="0 0 (\d+) (\d+)"/); return m ? { width: +m[1], height: +m[2] } : { width: 1080, height: 1920 }; })();
  const exe = findChrome();
  const browser = await chromium.launch(Object.assign({ args: ['--force-color-profile=srgb', '--hide-scrollbars'] }, exe ? { executablePath: exe } : {}));
  if (mode === 'stills' || mode === 'sheet') {
    const page = await openPage(browser, size);
    const files = [];
    for (const a of args) {
      await page.evaluate(t => window.seek(t), +a);
      const f = path.join(BUILD, `still_${(+a).toFixed(2).padStart(7, '0')}.png`);
      await page.screenshot({ path: f }); files.push(f);
    }
    if (mode === 'sheet') {
      const py = `from PIL import Image
import sys
fs=sys.argv[2:]; W=360; H=round(W*${size.height}/${size.width}); cols=min(5,len(fs)); rows=(len(fs)+cols-1)//cols
s=Image.new('RGB',(W*cols,H*rows),'white')
for i,f in enumerate(fs): s.paste(Image.open(f).resize((W,H)),((i%cols)*W,(i//cols)*H))
s.save(sys.argv[1])`;
      spawnSync('python', ['-c', py, path.join(BUILD, 'sheet.png'), ...files], { stdio: 'inherit' });
      console.log('wrote build/sheet.png');
    }
    console.log('done stills');
  } else if (mode === 'video') {
    const total = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'))).total;
    const frames = Math.ceil(total * FPS), W = +(args[0] || 6), per = Math.ceil(frames / W);
    const parts = [...Array(W)].map((_, i) => path.join(BUILD, `part${i}.mp4`));
    const t0 = Date.now();
    await Promise.all(parts.map((out, i) => renderRange(browser, size, i * per, Math.min(frames, (i + 1) * per), out)));
    fs.writeFileSync(path.join(BUILD, 'parts.txt'), parts.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
    console.log(`rendered ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  // browser.close() can hang on Windows; don't wait on it forever
  await Promise.race([browser.close(), new Promise(r => setTimeout(r, 3000))]);
  process.exit(0);
})();
