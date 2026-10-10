import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const DURATION = 6;
export const BREAK_TIME = 3.42;
const ease = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export function createPedalModel() {
  const root = new THREE.Group(); root.name = 'Brake_Pedal_Illustration';
  root.userData = { description: 'Generic outward support fracture illustration. Assumed geometry and motion; not a measured simulation.', duration: DURATION, outwardAxis: '+Z (toward driver)' };
  const dynamic = [];
  const mat = {
    bracket: new THREE.MeshStandardMaterial({ color: 0x38403d, roughness: .64, metalness: .13 }),
    inner: new THREE.MeshStandardMaterial({ color: 0x4a554c, roughness: .58, metalness: .27 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xa6b2a9, metalness: .85, roughness: .28 }),
    bright: new THREE.MeshStandardMaterial({ color: 0xb9c8c0, metalness: .86, roughness: .21 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x243029, roughness: .54, metalness: .3 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1b221e, roughness: .91, metalness: 0 }),
    groove: new THREE.MeshStandardMaterial({ color: 0x38453b, roughness: .91 }),
    shoe: new THREE.MeshStandardMaterial({ color: 0xbbb9a6, roughness: .89 }),
    shoePanel: new THREE.MeshStandardMaterial({ color: 0xadb5b3, roughness: .86 }),
    shoeTrim: new THREE.MeshStandardMaterial({ color: 0x4b5e67, roughness: .7 }),
    sole: new THREE.MeshStandardMaterial({ color: 0xbfc6b2, roughness: .85 }),
    lace: new THREE.MeshStandardMaterial({ color: 0xd5d8c6, roughness: .8 }),
    pants: new THREE.MeshStandardMaterial({ color: 0x424a52, roughness: 1 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x3a3e3c, roughness: 1 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x63716c, roughness: .82, transparent: true, opacity: .17, depthWrite: false, side: THREE.DoubleSide }),
    accent: new THREE.MeshStandardMaterial({ color: 0xffb477, emissive: 0xd57235, emissiveIntensity: .35, roughness: .5 }),
  };

  function mesh(geometry, material, parent, name, p = [0, 0, 0]) {
    const m = new THREE.Mesh(geometry, material); m.name = name; m.position.set(...p); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(w, h, d, p, material, parent, name, radius = .015) {
    return mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 3, h / 3, d / 3)), material, parent, name, p);
  }
  function rod(start, end, radius, material, parent, name, sides = 20) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), dir = b.clone().sub(a);
    const m = mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), sides), material, parent, name);
    m.position.copy(a.add(b).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); return m;
  }
  function sphere(w, h, d, p, material, parent, name) {
    const m = mesh(new THREE.SphereGeometry(1, 28, 18), material, parent, name, p); m.scale.set(w, h, d); return m;
  }
  function yzPlate(points, width, x, parent, name, material, hole) {
    const shape = new THREE.Shape(); points.forEach(([z, y], i) => i ? shape.lineTo(-z, y) : shape.moveTo(-z, y)); shape.closePath();
    if (hole) { const path = new THREE.Path(); path.absarc(-hole[0], hole[1], hole[2], 0, Math.PI * 2, true); shape.holes.push(path); }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelThickness: .007, bevelSize: .006, bevelSegments: 2, steps: 1, curveSegments: 32 });
    geo.rotateY(Math.PI / 2); geo.translate(x - width / 2, 0, 0);
    return mesh(geo, material, parent, name);
  }
  function bolt(x, y, z, parent, name) {
    rod([x,y,z-.02],[x,y,z+.02],.049,mat.dark,parent,`${name}_washer`,32);
    rod([x,y,z],[x,y,z+.038],.034,mat.bright,parent,`${name}_hex`,6);
    rod([x,y,z+.038],[x,y,z+.042],.012,mat.dark,parent,`${name}_socket`,6);
  }

  const chassis = new THREE.Group(); chassis.name = 'Cutaway_Footwell'; root.add(chassis);
  box(2.56, .055, 2.42, [0,.015,.38], mat.floor, chassis, 'Footwell_floor', .035);
  const matInset = new THREE.MeshStandardMaterial({color: 0x313835, roughness: 1});
  box(1.99,.019,1.92,[0,.052,.50],matInset,chassis,'Floor_mat',.025);
  for (let i=0;i<30;i++) box(1.78,.004,.011,[0,.064,-.28+i*.049],mat.dark,chassis,`Mat_rib_${i}`,.001);
  const firewall=box(2.35,2.35,.065,[0,1.19,-.69],mat.panel,chassis,'Firewall_cutaway',.04);
  firewall.rotation.x=-.055;
  const edgeMat=new THREE.LineBasicMaterial({color:0x8fa995,transparent:true,opacity:.25});
  const panelEdges=new THREE.LineSegments(new THREE.EdgesGeometry(firewall.geometry,30),edgeMat);panelEdges.name='Firewall_edges';firewall.add(panelEdges);
  box(.08,2.30,.53,[1.16,1.17,-.44],mat.panel,chassis,'Right_footwell_edge',.02);

  const fixed = new THREE.Group(); fixed.name = 'Fixed_Mounting_Base'; root.add(fixed);
  box(1.09,.15,.68,[0,2.38,-.29],mat.bracket,fixed,'Upper_mounting_flange',.035);
  box(.81,.53,.12,[0,2.14,-.54],mat.bracket,fixed,'Mounting_backplate',.025);
  for(const x of [-.40,.40]) { bolt(x,2.38,.066,fixed,`Upper_bolt_${x}`); bolt(x*.76,2.09,-.465,fixed,`Rear_bolt_${x}`); }
  box(.16,.26,.18,[-.40,2.22,-.42],mat.inner,fixed,'Left_mount_rib');
  box(.16,.26,.18,[.40,2.22,-.42],mat.inner,fixed,'Right_mount_rib');
  // Split the driver's side bearing lip; the upper and rear support stay fixed.
  const upperSeam = [[.30,1.93],[.263,1.91],[.25,1.925],[.218,1.884],[.183,1.893],[.161,1.865],[.13,1.872],[.10,1.853]];
  const lowerSeam = [[.10,1.637],[.132,1.619],[.155,1.633],[.192,1.597],[.221,1.608],[.247,1.566],[.28,1.55]];
  const bearingArc = front => Array.from({length:25},(_,i)=>{
    const angle = Math.PI/2 + (front ? -1 : 1)*i*Math.PI/24;
    return [.10+.108*Math.cos(angle),1.745+.108*Math.sin(angle)];
  });
  yzPlate([[-.45,2.35],[.21,2.35],[.30,2.27],...upperSeam,...bearingArc(false).slice(1),...lowerSeam.slice(1),[.10,1.51],[-.28,1.56],[-.42,1.72]], .15,-.24,fixed,'Fixed_rear_bearing_support',mat.bracket);
  yzPlate([[-.48,2.34],[-.27,2.34],[-.30,2.03],[-.43,2.02]], .055,.18,fixed,'Rear_mount_gusset',mat.inner);
  for(let i=0;i<3;i++) rod([-.323,2.08+i*.075,-.37],[-.323,2.11+i*.06,.15],.012,mat.inner,fixed,`Molded_rib_${i}`,8);

  const falling = new THREE.Group(); falling.name = 'Released_Bearing_Carrier'; root.add(falling); dynamic.push(falling);
  yzPlate([...upperSeam,...bearingArc(true).slice(1),...lowerSeam.slice(1),[.36,1.61],[.40,1.73],[.38,1.86]], .15,-.24,falling,'Fractured_outer_bearing_lip',mat.bracket);
  const bearing=rod([-.348,1.745,.10],[-.125,1.745,.10],.109,mat.dark,falling,'Pivot_bearing');
  rod([-.385,1.745,.10],[.31,1.745,.10],.059,mat.metal,falling,'Steel_pivot_axle');
  rod([-.40,1.745,.10],[-.36,1.745,.10],.079,mat.bright,falling,'Pivot_axle_endcap',6);
  rod([.285,1.745,.10],[.315,1.745,.10],.083,mat.dark,falling,'Axle_retaining_ring');

  const pivot = new THREE.Group(); pivot.name = 'Brake_Pedal_Rotation'; pivot.position.set(0,1.745,.10); falling.add(pivot); dynamic.push(pivot);
  yzPlate([[-.065,.095],[.095,.095],[.16,-.25],[.29,-.62],[.60,-1.11],[.58,-1.23],[.40,-1.23],[.19,-.73],[.025,-.30]],.125,.02,pivot,'Intact_pedal_arm',mat.metal);
  yzPlate([[.075,-.16],[.115,-.18],[.215,-.63],[.48,-1.14],[.45,-1.15],[.17,-.66]],.014,-.053,pivot,'Pedal_arm_reinforcement',mat.inner);
  rod([-.10,-.26,.14],[.12,-.26,.14],.052,mat.dark,pivot,'Pushrod_clevis_pin');
  const pedal=new THREE.Group();pedal.name='Brake_Pedal_Pad';pedal.position.set(.025,-1.13,.55);pedal.rotation.x=-.20;pivot.add(pedal);
  box(.79,.40,.092,[0,0,0],mat.bright,pedal,'Pedal_plate',.05);
  box(.727,.339,.050,[0,0,.055],mat.rubber,pedal,'Anti_slip_pad',.037);
  for(let row=0;row<5;row++)for(let col=0;col<3;col++){
    const grip=box(.20,.032,.014,[(col-1)*.232,(row-2)*.058,.086],mat.groove,pedal,`Grip_${row}_${col}`,.006);
    grip.rotation.z=.045;
  }
  for(const x of [-.32,.32])box(.018,.255,.015,[x,0,.085],mat.metal,pedal,`Pedal_side_trim_${x}`,.004);
  const contactAnchor=new THREE.Object3D();contactAnchor.name='Pedal_annotation';contactAnchor.position.set(-.4,.015,.06);pedal.add(contactAnchor);

  const rodRoot=new THREE.Group();rodRoot.name='Pushrod_Movement';root.add(rodRoot);dynamic.push(rodRoot);
  rod([0,-.5,0],[0,.5,0],.025,mat.bright,rodRoot,'Brake_pushrod');
  for(let i=0;i<7;i++)rod([0,1.50,-.43+i*.034],[0,1.50,-.415+i*.034],.059-i*.003,mat.rubber,fixed,`Pushrod_boot_${i}`);
  box(.24,.30,.09,[0,1.50,-.53],mat.dark,fixed,'Pushrod_firewall_plate',.05);

  const accelerator = new THREE.Group(); accelerator.name='Accelerator_Reference';accelerator.position.set(.76,.47,.42);accelerator.rotation.x=-.29;root.add(accelerator);
  rod([0,-.26,-.17],[0,.33,-.25],.025,mat.dark,accelerator,'Accelerator_arm');
  box(.23,.49,.066,[0,0,0],mat.dark,accelerator,'Accelerator_pad',.027);
  for(let i=0;i<8;i++)box(.16,.018,.012,[0,(i-3.5)*.05,.037],mat.groove,accelerator,`Accelerator_grip_${i}`,.003);

  const shoe=new THREE.Group();shoe.name='Illustrative_Driver_Foot';root.add(shoe);dynamic.push(shoe);
  box(.47,.081,.99,[0,0,.075],mat.sole,shoe,'Shoe_midsole',.10);
  box(.45,.034,.96,[0,-.04,.075],mat.shoeTrim,shoe,'Shoe_outsole',.055);
  sphere(.229,.146,.33,[0,.101,-.20],mat.shoe,shoe,'Shoe_toe_box');
  box(.405,.24,.65,[0,.133,.20],mat.shoePanel,shoe,'Shoe_upper',.095);
  sphere(.203,.166,.22,[0,.16,.355],mat.shoeTrim,shoe,'Shoe_heel_counter');
  box(.26,.067,.46,[0,.251,.12],mat.shoe,shoe,'Shoe_tongue',.045);
  for(let i=0;i<6;i++){
    const z=-.12+i*.055;
    rod([-.108,.275,z],[.103,.28,z+.036],.009,mat.lace,shoe,`Lace_a_${i}`,8);
    rod([.108,.273,z],[-.103,.28,z+.036],.009,mat.lace,shoe,`Lace_b_${i}`,8);
    sphere(.017,.006,.017,[-.122,.267,z],mat.shoeTrim,shoe,`Eyelet_l_${i}`);
    sphere(.017,.006,.017,[.122,.267,z],mat.shoeTrim,shoe,`Eyelet_r_${i}`);
  }
  for(const x of [-.22,.22]){
    const stripe=box(.008,.045,.33,[x,.143,.078],mat.shoe,shoe,`Side_overlay_${x}`,.004);stripe.rotation.x=.19;
  }
  for(let i=0;i<12;i++)box(.454,.023,.018,[0,-.048,-.36+i*.077],mat.dark,shoe,`Sole_tread_${i}`,.004);
  const trouser=mesh(new THREE.CylinderGeometry(.184,.152,.59,32),mat.pants,shoe,'Trouser_cuff',[0,.535,.34]);trouser.rotation.x=.12;
  const cuff=mesh(new THREE.CylinderGeometry(.159,.157,.045,32),mat.shoeTrim,shoe,'Cuff_seam',[0,.264,.305]);cuff.rotation.x=.12;
  for(let i=0;i<3;i++){
    const fold=mesh(new THREE.TorusGeometry(.153+i*.008,.005,5,32),mat.shoeTrim,shoe,`Trouser_fold_${i}`,[0,.294+i*.035,.314]);fold.rotation.x=Math.PI/2+.10;
  }

  const fragments=[];
  for(let i=0;i<5;i++){
    const piece=mesh(new THREE.IcosahedronGeometry(.025+(i%3)*.008,0),mat.inner,root,`Illustrative_fracture_fragment_${i}`);
    fragments.push(piece);dynamic.push(piece);
  }
  const highlight=new THREE.Group();highlight.name='Illustrated_Fracture_Highlight';root.add(highlight);
  for(const [i,seam] of [upperSeam,lowerSeam].entries()) {
    const points=seam.map(([z,y])=>new THREE.Vector3(-.326,y,z));
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),28,.006,6,false),mat.accent,highlight,`Outer_lip_fracture_trace_${i}`);
  }
  const halo=mesh(new THREE.TorusGeometry(.248,.0025,5,80),mat.accent,highlight,'Fracture_region_marker',[-.332,1.745,.245]);halo.rotation.y=Math.PI/2;halo.scale.x=.75;
  const pulse=new THREE.PointLight(0xfaa76c,0,.85);pulse.position.set(-.44,1.745,.32);highlight.add(pulse);
  const upperAnchor=new THREE.Object3D();upperAnchor.position.set(-.35,2.28,.19);fixed.add(upperAnchor);
  const crackAnchor=new THREE.Object3D();crackAnchor.position.set(-.34,1.79,.37);root.add(crackAnchor);
  const axleAnchor=new THREE.Object3D();axleAnchor.position.set(.32,1.745,.10);falling.add(axleAnchor);

  const state={exploded:false,foot:true,interior:true,highlight:true};
  const rodStart=new THREE.Vector3(),rodEnd=new THREE.Vector3(),rodDirection=new THREE.Vector3(),rodAxis=new THREE.Vector3(0,1,0);
  function applyTime(time, options={}) {
    const t=THREE.MathUtils.clamp(time,0,DURATION);
    const approach=ease(0,.95,t);
    const press=ease(1.40,3.25,t);
    const opening=ease(3.28,BREAK_TIME,t);
    const outward=ease(BREAK_TIME,3.95,t);
    const drop=ease(3.75,4.55,t);
    const settle=ease(4.32,4.75,t);
    const ex=options.exploded??state.exploded;
    falling.position.set(-outward*.028, -drop*.16, opening*.012+outward*.46);
    falling.rotation.set(0,0,0);
    pivot.rotation.x=press*.225+drop*.12-settle*.025;
    pivot.position.x=ex?.29:0;
    falling.position.x+=ex?-.18:0;
    fixed.position.x=ex?-.41:0;
    rodStart.set(0,1.50,-.46).add(fixed.position);
    rodEnd.set(0,-.26,.14).applyEuler(pivot.rotation).add(pivot.position).add(falling.position);
    rodDirection.copy(rodEnd).sub(rodStart);
    rodRoot.position.copy(rodStart).add(rodEnd).multiplyScalar(.5);
    rodRoot.scale.y=rodDirection.length();
    rodRoot.quaternion.setFromUnitVectors(rodAxis,rodDirection.normalize());
    shoe.position.set(.045+drop*.025,.68+(1-approach)*.14-press*.14-drop*.16,1.31+(1-approach)*.41-press*.25+outward*.36);
    shoe.rotation.set(.15+press*.095+drop*.06,0,-drop*.035);
    shoe.visible=state.foot&&!ex;
    chassis.visible=state.interior&&!ex;
    accelerator.visible=state.interior&&!ex;
    fragments.forEach((p,i)=>{
      const ft=Math.max(0,t-(BREAK_TIME+.09+i*.015));
      const fall=Math.min(ft,1.1);
      p.position.set(-.25-(.04+i*.025)*fall, Math.max(.11,1.745+(i%2?.16:-.13)-.05*fall-1.40*fall*fall), .25+(.48+i*.11)*fall);
      p.rotation.set(fall*(i+1),fall*2.8,fall*(i-2));
      const s=ft>0?Math.min(1,ft*25):0;p.scale.setScalar(s);
    });
    highlight.visible=state.highlight&&!ex;
    mat.accent.emissiveIntensity=.15+opening*.65;
    pulse.intensity=opening*.25*(1-drop*.5);
    return {t,press,opening,outward,drop,phase:t<1.5?0:t<3.3?1:t<4.5?2:3};
  }
  applyTime(0);
  return {root,dynamic,applyTime,state,parts:{fixed,falling,pivot,shoe,chassis,highlight,rodRoot,bearing},anchors:{mount:upperAnchor,crack:crackAnchor,axle:axleAnchor,pedal:contactAnchor}};
}
