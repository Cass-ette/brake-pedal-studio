import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createIcons, Box, Download, ChevronDown, ScanLine, PanelLeft, Scan, Eye, Tags, Focus, Footprints, Layers2, ArrowUpRight, Component, RotateCcw, Maximize, Info, Play, Pause, Repeat2, Video, Image, X, SlidersHorizontal } from 'lucide';
import { gsap } from 'gsap';
import { createPedalModel, DURATION } from './model.js';
import './style.css';

const icons = { Box, Download, ChevronDown, ScanLine, PanelLeft, Scan, Eye, Tags, Focus, Footprints, Layers2, ArrowUpRight, Component, RotateCcw, Maximize, Info, Play, Pause, Repeat2, Video, Image, X, SlidersHorizontal };
const icon = (name, extra='') => `<i data-lucide="${name}" class="icon ${extra}" aria-hidden="true"></i>`;
const $ = s => document.querySelector(s);
$('#app').innerHTML = `
<main class="app">
  <header class="topbar">
    <div class="brand"><div class="brand-icon">${icon('box')}</div>机械观察室<span>MECHANISM STUDIO</span></div>
    <div class="top-meta"><span class="session"><span class="dot"></span>交互式三维研究</span><span class="mono session">STUDY — 001</span><button id="export-menu" class="outline-button" aria-expanded="false" aria-controls="export-popover">${icon('download')}导出作品${icon('chevron-down')}</button></div>
  </header>
  <aside class="sidebar">
    <div class="project-title"><div class="eyebrow mono">BRAKE PEDAL / MOTION STUDY</div><h1>制动踏板</h1><h2>转轴支架 · 向外断裂</h2><p class="intro">转轴外侧支撑边缘崩开，<br>踏板组件向驾驶员方向移出。</p><span class="tag">${icon('scan-line')}机构运动示意</span></div>
    <section class="side-section views-section"><div class="section-label">观察视角<span class="mono">CAMERA</span></div><div class="views">
      <button class="view-button active" data-view="overview" aria-pressed="true">${icon('box')}整体结构</button><button class="view-button" data-view="side" aria-pressed="false">${icon('panel-left')}侧面观察</button><button class="view-button" data-view="close" aria-pressed="false">${icon('scan')}断口特写</button><button class="view-button" data-view="driver" aria-pressed="false">${icon('eye')}驾驶视角</button>
    </div></section>
    <section class="side-section options-section"><div class="section-label">显示选项<span class="mono">DISPLAY</span></div>
      <div class="toggle-row"><span class="toggle-label" id="label-labels">${icon('tags')}部件标注</span><button class="switch" role="switch" aria-labelledby="label-labels" aria-checked="true" data-toggle="labels"></button></div>
      <div class="toggle-row"><span class="toggle-label" id="label-highlight">${icon('focus')}断裂区域</span><button class="switch" role="switch" aria-labelledby="label-highlight" aria-checked="true" data-toggle="highlight"></button></div>
      <div class="toggle-row"><span class="toggle-label" id="label-foot">${icon('footprints')}踩踏动作</span><button class="switch" role="switch" aria-labelledby="label-foot" aria-checked="true" data-toggle="foot"></button></div>
      <div class="toggle-row"><span class="toggle-label" id="label-interior">${icon('layers-2')}座舱参照</span><button class="switch" role="switch" aria-labelledby="label-interior" aria-checked="true" data-toggle="interior"></button></div>
      <div class="legend"><span class="legend-dot"></span>橙色为位置提示，不代表应力值</div>
    </section>
    <section class="side-section facts-section"><div class="section-label">模型信息<span class="mono">DETAILS</span></div><div class="facts"><div class="fact"><small>观察对象</small><span>踏板转轴支架</span></div><div class="fact"><small>动画时长</small><b>06.00 <span>s</span></b></div><div class="fact"><small>几何来源</small><span>程序化示意建模</span></div><div class="fact"><small>动画阶段</small><b>04 <span>个阶段</span></b></div></div></section>
    <div class="reference-box"><p>尺寸、断口及运动节奏为示意设定。<br>非实测力学仿真。</p><button class="text-button" id="source-button">模型与受力说明${icon('arrow-up-right')}</button></div>
  </aside>
  <section class="viewer" aria-label="制动踏板交互式三维模型">
    <div class="viewer-top"><div><div class="view-heading"><span class="dot"></span><span id="view-name">整体结构</span><span class="mono" style="color:#708275;font-size:9px"> / PERSPECTIVE</span></div><p class="view-sub mono">BRAKE PEDAL ASSEMBLY</p></div><div class="viewer-tools"><button id="explode" class="square-button" title="结构展开" aria-label="结构展开" aria-pressed="false">${icon('component')}</button><button id="reset-camera" class="square-button" title="重置视角" aria-label="重置视角">${icon('rotate-ccw')}</button><button id="fullscreen" class="square-button" title="全屏查看" aria-label="全屏查看">${icon('maximize')}</button></div></div>
    <div class="stage-badge"><span class="dot"></span><span id="stage-name">结构完好</span><span class="mono" id="stage-index">01 / 04</span></div>
    <div id="annotation-layer" class="annotation-layer">
      <div class="annotation left" data-anchor="mount"><span class="annotation-line"></span><span class="annotation-box"><span class="annotation-title"><span class="annotation-index mono">01</span>固定底座</span><span class="annotation-sub mono">MOUNTING BASE</span></span></div>
      <div class="annotation left hot" data-anchor="crack"><span class="annotation-line"></span><span class="annotation-box"><span class="annotation-title"><span class="annotation-index mono">02</span>外侧支撑断口</span><span class="annotation-sub mono">OUTER BEARING LIP</span></span></div>
      <div class="annotation" data-anchor="axle"><span class="annotation-line"></span><span class="annotation-box"><span class="annotation-title"><span class="annotation-index mono">03</span>踏板转轴</span><span class="annotation-sub mono">PIVOT AXLE</span></span></div>
      <div class="annotation left" data-anchor="pedal"><span class="annotation-line"></span><span class="annotation-box"><span class="annotation-title"><span class="annotation-index mono">04</span>制动踏板</span><span class="annotation-sub mono">BRAKE PEDAL</span></span></div>
    </div>
    <div class="axis" aria-hidden="true"><svg width="57" height="55" viewBox="0 0 57 55"><path d="M25 33V5" stroke="#a3bb9e"/><path d="M25 33L49 43" stroke="#c49b7d"/><path d="M25 33L7 46" stroke="#7b9dae"/><circle cx="25" cy="33" r="2" fill="#adbead"/><g font-family="monospace" font-size="7"><text x="22" y="0" fill="#a3bb9e">Y</text><text x="51" y="47" fill="#c49b7d">X</text><text x="0" y="52" fill="#7b9dae">Z</text></g></svg></div>
    <div class="watermark mono">BRAKE PEDAL / MOTION STUDY<br>机构示意 · 非实测仿真</div>
    <div class="recording-indicator" hidden><span class="dot"></span>正在录制完整动画…</div>
    <div class="loading"><div class="loader"></div><span>正在构建三维场景</span></div>
  </section>
  <footer class="timeline">
    <div class="playback"><div class="playback-main"><button id="play" class="play-button" title="播放 / 暂停（空格）" aria-label="播放动画">${icon('play')}</button><button id="replay" class="reset-button" title="从头重播" aria-label="从头重播">${icon('rotate-ccw')}</button><div class="clock mono"><b id="current-time" style="font-weight:400">00.00</b><span> / 06.00 s</span></div></div><div class="playback-extra"><div class="speed-switch" aria-label="播放速度"><button class="speed-button" data-speed="0.25" aria-pressed="false">0.25×</button><button class="speed-button active" data-speed="0.5" aria-pressed="true">0.5×</button><button class="speed-button" data-speed="1" aria-pressed="false">1×</button></div><button id="loop" class="loop-button" aria-pressed="false">${icon('repeat-2')}循环</button></div></div>
    <div class="track"><div class="chapters"><button class="chapter active" data-chapter="0"><span class="number">01</span>结构完好</button><button class="chapter" data-chapter="1"><span class="number">02</span>踏板受压</button><button class="chapter" data-chapter="2"><span class="number">03</span>支架断裂</button><button class="chapter" data-chapter="3"><span class="number">04</span>失去支撑</button></div><div class="range-wrap"><div class="range-bg"><div class="range-progress"></div></div><div class="range-marks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><input id="time-slider" type="range" min="0" max="6" value="0" step="0.01" aria-label="动画时间轴（秒）"></div><div class="track-times"><span>0.0 s</span><span>1.5 s</span><span>3.0 s</span><span>4.5 s</span><span>6.0 s</span></div><p class="track-caption">${icon('info')}<span id="phase-description">转轴由支架固定，踏板处于初始位置。</span></p></div>
    <div class="statusbar"><div class="status-left"><span class="mono">STUDY / 001</span><span>机构示意 · 非实测仿真</span><button id="mobile-source" class="text-button" aria-label="模型与受力说明">${icon('info')}</button></div><div class="status-right"><span class="mono">3D / LIVE</span><span><span class="dot"></span><span id="render-status">场景加载中</span></span></div></div>
  </footer>
</main>
<div class="popover" id="export-popover" hidden><button class="export-option" id="export-glb">${icon('box')}<span><strong>下载 3D 动画模型</strong><small>GLB · 含完整动作 · 可导入 Blender</small></span></button><a class="export-option" href="/exports/brake-pedal.blend" download>${icon('component')}<span><strong>下载 Blender 工程</strong><small>BLEND · 动画、灯光与相机</small></span></a><a class="export-option" href="/exports/brake-pedal.mp4" download>${icon('video')}<span><strong>下载动画视频</strong><small>MP4 · 1440 × 810 · 24 fps</small></span></a><button class="export-option" id="export-video">${icon('video')}<span><strong>录制当前视角</strong><small>WebM · 完整 6 秒动画</small></span></button><button class="export-option" id="export-image">${icon('image')}<span><strong>保存当前画面</strong><small>PNG · 当前视角与动画时刻</small></span></button></div>
<div class="modal-backdrop" hidden id="source-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">模型与受力</h2><button class="square-button" id="close-modal" aria-label="关闭说明">${icon('x')}</button></div><p>模型中，推杆连接点位于转轴和脚部施力点之间。脚向前压踏板，推杆产生反向作用力；推杆力臂较短，其反力可大于脚部作用力，使转轴对支座产生向外的载荷。</p><p>动画呈现转轴外侧支撑边缘崩开，转轴和踏板向驾驶员方向移出，再向下沉降。上部安装座与后侧支撑保持固定。</p><p class="tiny">几何、断口、位移与六秒节奏为示意设定，不表示实测载荷、材料性能或真实失效原因。橙色仅标示断口位置。</p></section></div>
<div class="toast" role="status" aria-live="polite"></div>`;
$('.viewer-tools').insertAdjacentHTML('afterbegin',`<button class="square-button mobile-display" id="mobile-display" title="显示选项" aria-label="显示选项" aria-expanded="false">${icon('sliders-horizontal')}</button>`);
$('.viewer').insertAdjacentHTML('beforeend',`<div class="display-popover" id="display-popover" hidden>${['labels','highlight','foot','interior'].map((setting,i)=>`<div class="toggle-row"><span class="toggle-label">${['部件标注','断裂区域','踩踏动作','座舱参照'][i]}</span><button class="switch" role="switch" aria-label="${['部件标注','断裂区域','踩踏动作','座舱参照'][i]}" aria-checked="true" data-toggle="${setting}"></button></div>`).join('')}</div>`);
createIcons({icons});

const viewer=$('.viewer');
const model=createPedalModel();
const scene=new THREE.Scene();scene.background=new THREE.Color(0x252a28);scene.fog=new THREE.FogExp2(0x252a28,.043);
const camera=new THREE.PerspectiveCamera(35,1,.05,60);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
renderer.domElement.setAttribute('aria-label','可拖动旋转的制动踏板 3D 模型');renderer.domElement.setAttribute('role','img');viewer.prepend(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.53;room.dispose();pmrem.dispose();
scene.add(model.root);
scene.add(new THREE.HemisphereLight(0xe7ebe4,0x4c514d,1.4));
const key=new THREE.DirectionalLight(0xf6f2e7,2.2);key.position.set(-3.5,6,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-3;key.shadow.normalBias=.03;key.shadow.bias=-.00015;key.shadow.radius=4;scene.add(key);
const rim=new THREE.DirectionalLight(0xdae5ed,1.5);rim.position.set(3,3,-3);scene.add(rim);
const fill=new THREE.DirectionalLight(0xead9c2,1.25);fill.position.set(-4,1,-1);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x333936,roughness:.98}));ground.name='Studio_ground';ground.rotation.x=-Math.PI/2;ground.position.y=-.063;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(24,96,0x6c8972,0x6c8972);grid.position.y=-.06;grid.material.transparent=true;grid.material.opacity=.095;scene.add(grid);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=1.10;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.08;controls.target.set(0,1.19,.12);
const cameras={
  overview:{position:[-3.35,2.67,4.5],target:[0,1.20,.17],name:'整体结构'},
  side:{position:[-5.0,2.02,.45],target:[0,1.35,.10],name:'侧面观察'},
  close:{position:[-1.88,2.10,1.92],target:[-.16,1.78,.30],name:'断口特写'},
  driver:{position:[.38,2.85,3.12],target:[0,1.15,.18],name:'驾驶视角'},
};
const state={time:0,playing:false,speed:.5,loop:false,view:'overview',labels:true,recording:false};
let modelFrame=model.applyTime(0), lastTime=performance.now(), toastTimer, exportBusy=false, modalFocus=null, recordingStop=null;
const descriptions=['转轴由支架固定，踏板处于初始位置。','脚部向前压下踏板，推杆反力传至转轴支座。','外侧支撑崩开，转轴与踏板向驾驶员方向移出。','上部安装座保持固定，踏板组件向外移出后下沉。'];
const phaseNames=['结构完好','踏板受压','支架断裂','失去支撑'];
function notify(message){$('.toast').textContent=message;$('.toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('visible'),3300);}
function setPlay(playing){state.playing=playing;$('#play').innerHTML=icon(playing?'pause':'play');$('#play').setAttribute('aria-label',playing?'暂停动画':'播放动画');createIcons({icons});}
function seek(time){state.time=THREE.MathUtils.clamp(time,0,DURATION);modelFrame=model.applyTime(state.time);updateUI();}
function setCamera(name,animate=true){
  const preset=cameras[name];state.view=name;
  let pos=[...preset.position];if(viewer.clientWidth/viewer.clientHeight<.9&&name==='overview')pos=[-4.2,3.0,5.65];
  gsap.killTweensOf(camera.position);gsap.killTweensOf(controls.target);
  if(animate){gsap.to(camera.position,{x:pos[0],y:pos[1],z:pos[2],duration:1.05,ease:'power2.inOut'});gsap.to(controls.target,{x:preset.target[0],y:preset.target[1],z:preset.target[2],duration:1.05,ease:'power2.inOut'});}
  else{camera.position.set(...pos);controls.target.set(...preset.target);controls.update();}
  $('.view-heading #view-name').textContent=preset.name;
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);b.setAttribute('aria-pressed',String(b.dataset.view===name));});
}
function updateUI(){
  $('#current-time').textContent=state.time.toFixed(2).padStart(5,'0');$('#time-slider').value=state.time;$('#time-slider').setAttribute('aria-valuetext',`${state.time.toFixed(2)} 秒，${phaseNames[modelFrame.phase]}`);
  $('.range-progress').style.width=`${state.time/DURATION*100}%`;
  $('#stage-name').textContent=model.state.exploded?'结构展开':phaseNames[modelFrame.phase];$('#stage-index').textContent=`0${modelFrame.phase+1} / 04`;
  $('.stage-badge').classList.toggle('fractured',modelFrame.phase>=2&&!model.state.exploded);
  $('#phase-description').textContent=model.state.exploded?'分离支架与踏板组件，便于观察各部件；展开距离为示意。':descriptions[modelFrame.phase];
  document.querySelectorAll('[data-chapter]').forEach(b=>b.classList.toggle('active',Number(b.dataset.chapter)===modelFrame.phase));
}
function resize(){const w=viewer.clientWidth,h=viewer.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(viewer);resize();setCamera('overview',false);
const projected=new THREE.Vector3();const labelElements=[...document.querySelectorAll('[data-anchor]')];
function updateLabels(){
  model.root.updateMatrixWorld(true);
  labelElements.forEach(el=>{
    const name=el.dataset.anchor;
    const hide=!state.labels||model.state.exploded||(state.view==='close'&&(name==='pedal'||name==='mount'))||(state.view==='driver'&&name==='mount');
    model.anchors[name].getWorldPosition(projected);projected.project(camera);
    const x=(projected.x*.5+.5)*viewer.clientWidth,y=(-projected.y*.5+.5)*viewer.clientHeight;
    const offscreen=projected.z>1||projected.z<0||x<12||x>viewer.clientWidth-12||y<24||y>viewer.clientHeight-40;
    el.classList.toggle('hidden',hide||offscreen);
    el.style.left=`${x}px`;el.style.top=`${y+(name==='mount'?-20:name==='crack'?4:0)}px`;
  });
}
function frame(now){
  const delta=Math.max(0,(now-lastTime)/1000);lastTime=now;
  if(state.playing){state.time=Math.min(DURATION,state.time+delta*state.speed);if(state.time>=DURATION){if(state.recording){setPlay(false);recordingStop?.();}else if(state.loop){state.time=0;}else{setPlay(false);}}}
  modelFrame=model.applyTime(state.time);updateUI();controls.update();renderer.render(scene,camera);updateLabels();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
$('.loading').classList.add('ready');$('#render-status').textContent='实时渲染';
controls.addEventListener('start',()=>{gsap.killTweensOf(camera.position);gsap.killTweensOf(controls.target);});
$('#play').addEventListener('click',()=>{if(state.recording)return;if(state.time>=DURATION)seek(0);setPlay(!state.playing);});
$('#replay').addEventListener('click',()=>{if(state.recording)return;seek(0);setPlay(true);});
$('#time-slider').addEventListener('input',e=>{if(state.recording)return;setPlay(false);seek(Number(e.target.value));});
document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{if(state.recording)return;state.speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(other=>{other.classList.toggle('active',other===b);other.setAttribute('aria-pressed',String(other===b));});}));
$('#loop').addEventListener('click',()=>{state.loop=!state.loop;$('#loop').classList.toggle('active',state.loop);$('#loop').setAttribute('aria-pressed',String(state.loop));});
document.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{if(state.recording)return;setPlay(false);seek([0,2.3,3.75,5.15][Number(b.dataset.chapter)]);}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setCamera(b.dataset.view)));
document.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{const setting=b.dataset.toggle;const on=b.getAttribute('aria-checked')!=='true';document.querySelectorAll(`[data-toggle="${setting}"]`).forEach(other=>other.setAttribute('aria-checked',String(on)));if(setting==='labels')state.labels=on;else model.state[setting]=on;updateLabels();}));
$('#mobile-display').addEventListener('click',()=>{const open=$('#display-popover').hidden;$('#display-popover').hidden=!open;$('#mobile-display').setAttribute('aria-expanded',String(open));});
$('#reset-camera').addEventListener('click',()=>setCamera('overview'));
$('#explode').addEventListener('click',()=>{
  if(state.recording)return;
  model.state.exploded=!model.state.exploded;$('#explode').classList.toggle('active',model.state.exploded);$('#explode').setAttribute('aria-pressed',String(model.state.exploded));
  if(model.state.exploded){setPlay(false);seek(0);setCamera('overview');notify('结构已展开，可拖动查看支架与转轴');}
});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await viewer.requestFullscreen();}catch{notify('当前浏览器不支持全屏，可使用浏览器的全屏功能');}});
function openModal(){modalFocus=document.activeElement;$('#source-modal').hidden=false;$('#close-modal').focus();}
function closeModal(){$('#source-modal').hidden=true;modalFocus?.focus();}
$('#source-button').addEventListener('click',openModal);$('#mobile-source').addEventListener('click',openModal);$('#close-modal').addEventListener('click',closeModal);$('#source-modal').addEventListener('click',e=>{if(e.target===$('#source-modal'))closeModal();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(!$('#source-modal').hidden)closeModal();closeExport();return;}
  if(!$('#source-modal').hidden){if(e.key==='Tab'){const focus=[...$('#source-modal').querySelectorAll('button,a')];const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}return;}
  if(e.code==='Space'&&!['INPUT','BUTTON','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();$('#play').click();}
});
function closeExport(){$('#export-popover').hidden=true;$('#export-menu').setAttribute('aria-expanded','false');}
$('#export-menu').addEventListener('click',()=>{const open=$('#export-popover').hidden;$('#export-popover').hidden=!open;$('#export-menu').setAttribute('aria-expanded',String(open));});
document.addEventListener('click',e=>{if(!e.target.closest('#export-menu')&&!e.target.closest('#export-popover'))closeExport();if(!e.target.closest('#mobile-display')&&!e.target.closest('#display-popover')){$('#display-popover').hidden=true;$('#mobile-display').setAttribute('aria-expanded','false');}});
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function makeAnimatedModel(){
  const exported=createPedalModel();exported.root.remove(exported.parts.highlight);
  const times=[];const data=exported.dynamic.map(object=>({object,position:[],quaternion:[],scale:[]}));
  for(let i=0;i<=180;i++){const t=i/30;times.push(t);exported.applyTime(t,{exploded:false});data.forEach(d=>{d.position.push(...d.object.position.toArray());d.quaternion.push(...d.object.quaternion.toArray());d.scale.push(...d.object.scale.toArray());});}
  exported.applyTime(0);
  const tracks=[];for(const d of data){tracks.push(new THREE.VectorKeyframeTrack(`${d.object.name}.position`,times,d.position));tracks.push(new THREE.QuaternionKeyframeTrack(`${d.object.name}.quaternion`,times,d.quaternion));tracks.push(new THREE.VectorKeyframeTrack(`${d.object.name}.scale`,times,d.scale));}
  const clip=new THREE.AnimationClip('Illustrative_Bracket_Fracture_6s',DURATION,tracks);
  return {exported,clip};
}
async function exportGLB(){
  if(exportBusy)return;exportBusy=true;closeExport();notify('正在生成带动画的 GLB 模型…');
  try{const {exported,clip}=makeAnimatedModel();const buffer=await new GLTFExporter().parseAsync(exported.root,{binary:true,animations:[clip],onlyVisible:false});download(new Blob([buffer],{type:'model/gltf-binary'}),'brake-pedal-animated.glb');notify('GLB 已导出，包含完整 6 秒动画');exported.root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
  catch(error){console.error(error);notify('模型导出失败，请重试');}finally{exportBusy=false;}
}
$('#export-glb').addEventListener('click',exportGLB);

// Composite the scene with labels so exported media stays identifiable as an illustration.
function drawExport(context,w,h){
  context.drawImage(renderer.domElement,0,0,w,h);
  const scale=w/1440;context.save();context.scale(scale,scale);const logicalH=h/scale;
  const gradient=context.createLinearGradient(0,0,0,170);gradient.addColorStop(0,'#101a14bf');gradient.addColorStop(1,'#101a1400');context.fillStyle=gradient;context.fillRect(0,0,1440,170);
  context.fillStyle='#d2e8d9';context.font='500 26px sans-serif';context.fillText('制动踏板 · 转轴支架向外断裂',42,58);
  context.fillStyle='#96b39f';context.font='14px sans-serif';context.fillText('机构示意 · 非实测仿真 · 几何与运动为视觉设定',43,89);
  context.fillStyle='#122219bd';context.fillRect(0,logicalH-67,1440,67);
  context.fillStyle=modelFrame.phase>=2?'#f5bc91':'#c1e4cd';context.font='17px sans-serif';context.fillText(`0${modelFrame.phase+1}  ${phaseNames[modelFrame.phase]}`,42,logicalH-27);
  context.fillStyle='#a8bfae';context.font='14px monospace';context.textAlign='right';context.fillText(`${state.time.toFixed(2)} / 6.00 s`,1398,logicalH-27);context.textAlign='left';context.restore();
}
$('#export-image').addEventListener('click',()=>{closeExport();renderer.render(scene,camera);const c=document.createElement('canvas');c.width=renderer.domElement.width;c.height=renderer.domElement.height;drawExport(c.getContext('2d'),c.width,c.height);c.toBlob(b=>{if(b){download(b,'brake-pedal.png');notify('当前画面已保存');}},'image/png');});
async function exportVideo(){
  closeExport();if(state.recording)return;
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){notify('当前浏览器不支持录制，请使用 Chrome 或 Edge');return;}
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime){notify('当前浏览器不支持 WebM 录制，请使用 Chrome 或 Edge');return;}
  const restore={time:state.time,playing:state.playing,speed:state.speed,exploded:model.state.exploded};
  const out=document.createElement('canvas');out.width=1440;out.height=Math.round(1440*viewer.clientHeight/viewer.clientWidth/2)*2;const ctx=out.getContext('2d');
  const stream=out.captureStream(30);let recorder,raf,stopping=false;
  const finish=()=>{cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());recordingStop=null;state.recording=false;state.speed=restore.speed;model.state.exploded=restore.exploded;$('.recording-indicator').hidden=true;document.querySelectorAll('#play,#replay,#time-slider,[data-speed],[data-chapter],#explode').forEach(el=>el.disabled=false);seek(restore.time);setPlay(restore.playing);};
  try{
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:9_000_000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'});finish();download(blob,'brake-pedal.webm');notify('动画视频已保存');};
    recorder.onerror=()=>{finish();notify('录制失败，请重试');};
    state.recording=true;model.state.exploded=false;state.speed=1;setPlay(false);seek(0);renderer.render(scene,camera);
    document.querySelectorAll('#play,#replay,#time-slider,[data-speed],[data-chapter],#explode').forEach(el=>el.disabled=true);$('.recording-indicator').hidden=false;
    const draw=()=>{drawExport(ctx,out.width,out.height);raf=requestAnimationFrame(draw);};draw();
    recordingStop=()=>{if(stopping)return;stopping=true;drawExport(ctx,out.width,out.height);setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},160);};
    recorder.start();setPlay(true);
  }catch(error){console.error(error);finish();notify('录制失败，请使用 Chrome 或 Edge 重试');}
}
$('#export-video').addEventListener('click',exportVideo);
// Small inspection surface for deterministic rendering checks and offline artifact generation.
window.brakeStudy={seek,setPlay,setCamera,exportGLB,exportVideo,captureFrame:(time)=>{seek(time);controls.update();renderer.render(scene,camera);const out=document.createElement('canvas');out.width=1440;out.height=Math.round(1440*viewer.clientHeight/viewer.clientWidth);drawExport(out.getContext('2d'),out.width,out.height);return out.toDataURL('image/png');},getState:()=>({...state,phase:modelFrame.phase,outward:modelFrame.outward,drop:modelFrame.drop,exploded:model.state.exploded,fixed:model.parts.fixed.position.toArray(),falling:model.parts.falling.position.toArray(),pedalRotation:model.parts.pivot.rotation.x}),getStats:()=>({meshes:renderer.info.render.calls,triangles:renderer.info.render.triangles}),ready:true};
window.addEventListener('pagehide',()=>{renderer.dispose();environment.dispose();});
