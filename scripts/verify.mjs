import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const base = process.env.STUDY_URL || 'http://127.0.0.1:5188';
mkdirSync('artifacts', { recursive: true });
mkdirSync('public/exports', { recursive: true });
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath())) {
  const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(cache)) {
    const versions = readdirSync(cache).filter(n => n.startsWith('chromium_headless_shell-')).sort().reverse();
    for (const version of versions) {
      const candidate = path.join(cache, version, 'chrome-headless-shell-mac-arm64/chrome-headless-shell');
      if (existsSync(candidate)) { executablePath = candidate; break; }
    }
  }
}
const angle = process.env.STUDY_ANGLE || (process.platform === 'darwin' ? 'metal' : 'swiftshader');
const browser = await chromium.launch({ headless: true, executablePath, args: ['--enable-webgl', `--use-angle=${angle}`, '--enable-unsafe-swiftshader'] });
const errors = [], results = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', error => errors.push(error.message));

function pixelStats(buffer) {
  const png = PNG.sync.read(buffer); const colors = new Set(); let min = 255, max = 0;
  for (let y = 0; y < png.height; y += 5) for (let x = 0; x < png.width; x += 5) {
    const i = (y * png.width + x) * 4;
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    colors.add(`${r >> 3},${g >> 3},${b >> 3}`); const l = (r + g + b) / 3; min = Math.min(min, l); max = Math.max(max, l);
  }
  return { colors: colors.size, range: max - min };
}
async function renderCheck(name) {
  await page.waitForTimeout(400);
  const pixels = pixelStats(await page.locator('.viewer canvas').screenshot());
  assert(pixels.colors > 60 && pixels.range > 65, `${name}: scene must be nonblank and contain the lit model`);
  const layout = await page.evaluate(() => {
    const app = document.querySelector('.app').getBoundingClientRect();
    const canvas = document.querySelector('.viewer canvas').getBoundingClientRect();
    const overflow = [...document.querySelectorAll('button, h1, h2')].filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 2).map(el => el.textContent.trim());
    return { width: innerWidth, appWidth: app.width, canvasWidth: canvas.width, canvasHeight: canvas.height, overflow };
  });
  assert(layout.appWidth <= layout.width + 1, `${name}: no horizontal page overflow`);
  assert.equal(layout.overflow.length, 0, `${name}: no overflowing controls: ${layout.overflow.join(', ')}`);
  assert(layout.canvasWidth > 250 && layout.canvasHeight >= 260, `${name}: model viewport must have stable dimensions`);
  await page.screenshot({ path: `artifacts/${name}.png` });
  results.push({ name, ...pixels, ...layout });
}

try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.brakeStudy?.ready, { timeout: 30000 });
  for (const [name, width, height] of [['desktop',1440,900],['wide',1920,1080],['tablet',1024,768],['mobile',390,844],['small-mobile',360,740],['large-mobile',430,932]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => { window.brakeStudy.setCamera('overview',false); window.brakeStudy.seek(.8); });
    await renderCheck(name);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => { window.brakeStudy.setCamera('overview',false); window.brakeStudy.seek(0); });
  const before = await page.locator('.viewer canvas').screenshot();
  await page.locator('#play').click(); await page.waitForTimeout(500);
  let state = await page.evaluate(() => window.brakeStudy.getState());
  assert(state.playing && state.time > 0, 'Play must advance the animation');
  await page.locator('#play').click();
  await page.locator('[data-speed="0.25"]').click();
  assert.equal((await page.evaluate(() => window.brakeStudy.getState())).speed, .25);
  await page.locator('[data-chapter="2"]').click();
  state = await page.evaluate(() => window.brakeStudy.getState());
  assert.equal(state.phase, 2); assert(state.outward > 0 && state.falling[2] > .20, 'Carrier must release outward toward the driver');
  assert(state.falling[1] === 0, 'Outward release must precede downward settling');
  assert.deepEqual(state.fixed, [0,0,0], 'Upper mount and rear support must remain fixed');
  const after = await page.locator('.viewer canvas').screenshot();
  assert(!before.equals(after), 'Animation must change visible canvas pixels');
  await renderCheck('fracture');
  await page.locator('#time-slider').fill('5.2');
  await page.locator('#time-slider').dispatchEvent('input');
  state = await page.evaluate(() => window.brakeStudy.getState());
  assert.equal(state.phase, 3);
  assert(state.falling[2] > Math.abs(state.falling[1]) && state.falling[1] < 0, 'Final motion is primarily outward with downward settling');
  await page.evaluate(() => window.brakeStudy.seek(0));
  state = await page.evaluate(() => window.brakeStudy.getState());
  assert(state.falling.every(value => value === 0), 'Scrubbing back restores the intact assembly');
  await page.evaluate(() => window.brakeStudy.seek(5.2));
  await renderCheck('released');
  await page.evaluate(() => { window.brakeStudy.setCamera('close',false); window.brakeStudy.seek(3.75); });
  await renderCheck('close-up');
  for (const camera of ['side','driver']) {
    await page.evaluate(name => window.brakeStudy.setCamera(name,false), camera);
    await renderCheck(camera);
  }
  await page.evaluate(() => window.brakeStudy.setCamera('overview',false));
  const canvas = page.locator('.viewer canvas'); const bounds = await canvas.boundingBox();
  const orbitBefore = await canvas.screenshot();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 90, bounds.y + bounds.height / 2 + 35, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400);
  assert(!orbitBefore.equals(await canvas.screenshot()), 'Orbit interaction must update the render');
  await page.locator('#explode').click();
  assert((await page.evaluate(() => window.brakeStudy.getState())).exploded);
  await page.waitForTimeout(1100); await renderCheck('exploded'); await page.locator('#explode').click();
  await page.locator('.sidebar [data-toggle="foot"]').click();
  assert.equal(await page.locator('.sidebar [data-toggle="foot"]').getAttribute('aria-checked'),'false');
  await page.locator('.sidebar [data-toggle="foot"]').click();
  await page.locator('.sidebar [data-toggle="labels"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.annotation:not(.hidden)').length === 0);
  await page.locator('.sidebar [data-toggle="labels"]').click();
  await page.locator('#source-button').click(); await page.locator('#close-modal').press('Escape'); assert(await page.locator('#source-modal').isHidden());

  const glbDownload = page.waitForEvent('download', { timeout: 60000 });
  await page.evaluate(() => window.brakeStudy.exportGLB());
  await (await glbDownload).saveAs('public/exports/brake-pedal-animated.glb');
  const glb = readFileSync('public/exports/brake-pedal-animated.glb');
  assert.equal(glb.readUInt32LE(0), 0x46546c67); assert.equal(glb.readUInt32LE(4), 2);
  const jsonLength = glb.readUInt32LE(12); const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
  assert.equal(gltf.animations.length, 1); assert(gltf.animations[0].channels.length >= 12);
  assert(gltf.nodes.some(n => n.name === 'Released_Bearing_Carrier')); assert(gltf.nodes.some(n => n.name === 'Illustrative_Driver_Foot'));
  assert(gltf.nodes.some(n => n.name === 'Fractured_outer_bearing_lip'));
  const carrierIndex = gltf.nodes.findIndex(n => n.name === 'Released_Bearing_Carrier');
  const translation = gltf.animations[0].channels.find(c => c.target.node === carrierIndex && c.target.path === 'translation');
  const accessor = gltf.accessors[gltf.animations[0].samplers[translation.sampler].output];
  assert(accessor.max[2] > .4 && accessor.max[1] <= 0, 'Export must preserve outward motion without upward ejection');
  for (const sampler of gltf.animations[0].samplers) { assert.equal(gltf.accessors[sampler.input].max[0],6); assert.equal(gltf.accessors[sampler.input].count,181); }
  console.log('Animated GLB:', glb.length, 'bytes;', gltf.meshes.length, 'meshes;', gltf.animations[0].channels.length, 'animation channels');

  await page.evaluate(() => { window.brakeStudy.setCamera('overview',false); window.brakeStudy.seek(0); });
  const videoDownload = page.waitForEvent('download', { timeout: 60000 });
  await page.evaluate(() => window.brakeStudy.exportVideo());
  await (await videoDownload).saveAs('public/exports/brake-pedal.webm');
  const videoSize = readFileSync('public/exports/brake-pedal.webm').length;
  assert(videoSize > 10000, 'Recording must contain rendered video');
  await page.evaluate(() => { window.brakeStudy.seek(3.75); window.brakeStudy.setCamera('overview',false); });
  await page.waitForTimeout(300);
  await page.screenshot({path:'public/exports/brake-pedal-preview.png'});
  assert.equal(errors.length,0,`No runtime errors: ${errors.join(', ')}`);
  const report = { results, glbBytes: glb.length, meshes: gltf.meshes.length, animationChannels: gltf.animations[0].channels.length, videoBytes: videoSize, runtimeErrors: errors };
  writeFileSync('artifacts/verification.json', JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  console.log('Verified six viewport sizes, four cameras, animation, orbit, controls, GLB and video export.');
} finally {
  await browser.close();
}
