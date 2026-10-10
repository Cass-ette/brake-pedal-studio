import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath())) {
  const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
  const version = readdirSync(cache).filter(n => n.startsWith('chromium_headless_shell-')).sort().reverse()[0];
  executablePath = path.join(cache, version, 'chrome-headless-shell-mac-arm64/chrome-headless-shell');
}
const angle=process.env.STUDY_ANGLE||(process.platform==='darwin'?'metal':'swiftshader');
const browser = await chromium.launch({headless:true,executablePath,args:['--enable-webgl',`--use-angle=${angle}`,'--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1572,height:935},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
mkdirSync('artifacts/frames',{recursive:true});
try {
  await page.goto(process.env.STUDY_URL||'http://127.0.0.1:5188',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.brakeStudy?.ready,{timeout:30000});
  await page.evaluate(()=>{window.brakeStudy.setPlay(false);window.brakeStudy.setCamera('overview',false);});
  for(let frame=0;frame<144;frame++) {
    const data=await page.evaluate(t=>window.brakeStudy.captureFrame(t),frame/24);
    writeFileSync(`artifacts/frames/${String(frame).padStart(4,'0')}.png`,Buffer.from(data.split(',')[1],'base64'));
    if(frame%24===0)console.log(`Rendered ${frame}/144 frames`);
  }
  if(errors.length)throw new Error(errors.join('\n'));
  // Also check that live recording follows the six-second time span.
  const download=page.waitForEvent('download',{timeout:30000});
  const started=Date.now();await page.evaluate(()=>window.brakeStudy.exportVideo());
  await(await download).saveAs('public/exports/brake-pedal.webm');
  const elapsed=Date.now()-started;
  if(elapsed>15000)throw new Error(`Recording was too slow: ${elapsed} ms`);
  console.log(`Live video export completed in ${elapsed} ms`);
  console.log('Rendered all 144 frames for a six-second 24 fps video.');
} finally { await browser.close(); }
