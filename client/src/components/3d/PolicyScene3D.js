import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const M = (color, opts = {}) => new THREE.MeshStandardMaterial({
  color, roughness: opts.rough ?? 0.65, metalness: opts.metal ?? 0.1,
  emissive: opts.emissive ?? 0x000000,
  emissiveIntensity: opts.ei ?? 0,
  transparent: opts.alpha !== undefined,
  opacity: opts.alpha ?? 1,
  ...opts
});
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r, s = 8) => new THREE.SphereGeometry(r, s, s);
const cone = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
const torus = (r, t, rs = 8, ts = 40) => new THREE.TorusGeometry(r, t, rs, ts);

function addMesh(scene, geo, mat, pos, rot, objs) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); objs.push(m); return m;
}

// ─── SCENE BUILDER REGISTRY ───────────────────────────────────────────────────
// Maps sceneType → builder function
// Each builder receives (scene, objs, phase, t) and returns animatable objects

const BUILDERS = {};

// ── 1. WIFI SCHOOL ────────────────────────────────────────────────────────────
BUILDERS.wifi_school = BUILDERS.default = (scene, objs) => {
  const state = { routers:[], rings:[], students:[], packets:[], clock:0 };

  // Ground
  addMesh(scene, box(60,0.1,60), M(0x0a0f18), [0,0,0], null, objs);

  // School main body
  addMesh(scene, box(12,5,7), M(0x1e3a5f,{rough:0.6}), [0,2.5,0], null, objs);
  addMesh(scene, box(12.4,0.4,7.4), M(0x1e3799), [0,5.2,0], null, objs);

  // Windows with emissive
  const winMat = M(0x93c5fd, {emissive:0x1d4ed8, ei:0.3, rough:0.2});
  for (let r=0;r<2;r++) for (let c=0;c<5;c++) {
    const w = addMesh(scene, box(0.9,0.75,0.08), winMat.clone(), [-4+c*2, 1.5+r*1.8, 3.56], null, objs);
    w.userData.isWindow = true;
  }

  // Entrance pillars
  [-1.2,1.2].forEach(x => addMesh(scene, cyl(0.22,0.28,4,8), M(0x2563eb), [x,2,3.9], null, objs));
  addMesh(scene, box(2.8,0.6,0.1), M(0xfbbf24,{emissive:0xf59e0b,ei:0.4}), [0,4.5,3.96], null, objs);

  // Side wing
  addMesh(scene, box(4,3.5,5), M(0x1e3a5f,{rough:0.6}), [8,1.75,0], null, objs);
  addMesh(scene, box(4.4,0.3,5.4), M(0x1e3799), [8,3.65,0], null, objs);

  // Flagpole & flag
  addMesh(scene, cyl(0.06,0.08,8,6), M(0xd1d5db), [-8,4,-4], null, objs);
  const flag = addMesh(scene, box(2,1,0.05), M(0xf97316,{emissive:0xf97316,ei:0.3}), [-7,7.5,-4], null, objs);
  state.flag = flag;

  // Trees
  [[-12,4],[-12,-2],[-11,-7],[12,-6],[13,-2]].forEach(([x,z])=>{
    addMesh(scene, cyl(0.15,0.2,1.5,6), M(0x44403c), [x,0.75,z], null, objs);
    addMesh(scene, sph(1.2,7), M(0x166534,{rough:0.9}), [x,2.5,z], null, objs);
  });

  // Fence
  for(let i=0;i<18;i++) addMesh(scene, box(0.1,1.4,0.1), M(0x1e40af), [-8+i*1,0.7,7.1], null, objs);

  // WiFi routers (yellow boxes on building)
  [[0,5.6,3.7],[0,5.6,-3.7],[-4,3.6,0],[8,3.9,0],[0,0.6,8]].forEach(([x,y,z],i)=>{
    const r = addMesh(scene, box(0.3,0.15,0.15), M(0xeab308,{emissive:0xca8a04,ei:0.6}), [x,y,z], null, objs);
    addMesh(scene, cyl(0.02,0.02,0.3,4), M(0x9ca3af), [x,y+0.22,z], null, objs);
    state.routers.push({ mesh:r, pos:new THREE.Vector3(x,y,z), idx:i });
  });

  // WiFi rings (3 per router)
  state.routers.forEach(r=>{
    [1.2,2.2,3.2].forEach((rad,j)=>{
      const ring = new THREE.Mesh(torus(rad,0.03,8,40), M(0x3b82f6,{emissive:0x1d4ed8,ei:0.9,alpha:0}));
      ring.rotation.x = Math.PI/2;
      ring.position.copy(r.pos).y += 0.2;
      ring.userData = { delay: j*0.4+r.idx*0.2, active:false };
      scene.add(ring); objs.push(ring); state.rings.push(ring);
    });
  });

  // Students (24 simple people)
  const sColors = [0x3b82f6,0x8b5cf6,0xec4899,0x10b981,0xf59e0b];
  for(let i=0;i<24;i++){
    const g = new THREE.Group();
    addMesh(scene, cyl(0.18,0.22,0.7,7), M(sColors[i%5]), [0,0.35,0], null, []);
    g.children.push(new THREE.Mesh(cyl(0.18,0.22,0.7,7), M(sColors[i%5])));
    g.children[0].position.y = 0.35;
    g.add(new THREE.Mesh(sph(0.22,8), M(0xfde68a)));
    g.children[1].position.y = 0.9;
    const ang = (i/24)*Math.PI*2;
    const rad = 8+Math.random()*4;
    g.position.set(Math.cos(ang)*rad, 0, Math.sin(ang)*rad);
    g.userData = { baseAngle:ang, rad, speed:0.005+Math.random()*0.01, idx:i };
    scene.add(g); objs.push(g); state.students.push(g);
  }

  // Crane for phase 0
  const craneGroup = new THREE.Group();
  addMesh(scene, cyl(0.1,0.12,10,6), M(0x78716c), [12,5,-5], null, []);
  craneGroup.add(new THREE.Mesh(cyl(0.1,0.12,10,6), M(0x78716c)));
  craneGroup.children[0].position.set(12,5,-5);
  craneGroup.add(new THREE.Mesh(box(6,0.15,0.15), M(0x78716c)));
  craneGroup.children[1].position.set(9,9.5,-5);
  scene.add(craneGroup); objs.push(craneGroup); state.crane = craneGroup;

  // Negative impact nodes (red spheres for phase 2)
  state.negNodes = [];
  [[-3,6,-4],[5,5,-6],[-6,7,4],[9,4,-2],[-1,7,6]].forEach(([x,y,z])=>{
    const n = new THREE.Mesh(sph(0.3,10), M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z);
    scene.add(n); objs.push(n); state.negNodes.push(n);
  });

  // Positive nodes (green spheres for phase 1/3)
  state.posNodes = [];
  [[-5,6,2],[4,7,-3],[8,5,3],[-8,5,-2],[2,8,-5]].forEach(([x,y,z])=>{
    const n = new THREE.Mesh(sph(0.25,10), M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);
    scene.add(n); objs.push(n); state.posNodes.push(n);
  });

  return state;
};

// ── 2. MIDDAY MEAL ────────────────────────────────────────────────────────────
BUILDERS.midday_meal = (scene, objs) => {
  const state = { clock:0, students:[], steam:[] };
  addMesh(scene, box(60,0.1,60), M(0x0a0f18), [0,0,0], null, objs);
  addMesh(scene, box(12,5,7), M(0x1e3a5f), [0,2.5,-2], null, objs);
  addMesh(scene, box(12.4,0.4,7.4), M(0x1e3799), [0,5.2,-2], null, objs);

  // Kitchen building
  addMesh(scene, box(6,3,5), M(0x92400e,{rough:0.7}), [10,1.5,3], null, objs);
  addMesh(scene, cone(4,2,4), M(0xb45309), [10,4,3], [0,Math.PI/4,0], objs);
  // Kitchen chimney
  addMesh(scene, cyl(0.3,0.35,3,8), M(0x78350f), [11.5,3,3], null, objs);

  // Lunch queue (students)
  for(let i=0;i<20;i++){
    const g = new THREE.Group();
    const body = new THREE.Mesh(cyl(0.15,0.18,0.65,7), M([0x3b82f6,0xec4899,0xf59e0b,0x10b981][i%4]));
    body.position.y = 0.32;
    g.add(body);
    const head = new THREE.Mesh(sph(0.2,8), M(0xfde68a));
    head.position.y = 0.82;
    g.add(head);
    // Plate in hand
    const plate = new THREE.Mesh(cyl(0.18,0.18,0.04,12), M(0xe5e7eb));
    plate.position.set(0.22,0.5,0);
    g.add(plate);
    g.position.set(4.5, 0, -3+i*0.5);
    g.userData = { idx:i, baseZ:-3+i*0.5 };
    scene.add(g); objs.push(g); state.students.push(g);
  }

  // Trees
  [[-10,4],[-10,-3],[13,5],[12,-4]].forEach(([x,z])=>{
    addMesh(scene, cyl(0.15,0.2,1.5,6), M(0x44403c), [x,0.75,z], null, objs);
    addMesh(scene, sph(1.3,7), M(0x15803d), [x,2.6,z], null, objs);
  });

  // Steam particles (animated upward)
  for(let i=0;i<12;i++){
    const s = new THREE.Mesh(sph(0.08+Math.random()*0.1,6), M(0xd1d5db,{alpha:0.3}));
    s.position.set(10+Math.random()*2-1, 2+Math.random()*2, 3+Math.random()-0.5);
    s.userData = { startY: s.position.y };
    scene.add(s); objs.push(s); state.steam.push(s);
  }

  // Impact nodes
  state.posNodes = [];
  [[-4,5,2],[2,6,-5],[7,5,5]].forEach(([x,y,z])=>{
    const n = new THREE.Mesh(sph(0.25,8), M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z); scene.add(n); objs.push(n); state.posNodes.push(n);
  });
  state.negNodes = [];
  [[-2,6,-4],[8,5,-3]].forEach(([x,y,z])=>{
    const n = new THREE.Mesh(sph(0.3,8), M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z); scene.add(n); objs.push(n); state.negNodes.push(n);
  });
  return state;
};

// ── 3. DIGITAL CLASSROOM ──────────────────────────────────────────────────────
BUILDERS.digital_classroom = BUILDERS.coding_school = BUILDERS.girls_education = (scene, objs) => {
  const state = { clock:0, screens:[], students:[] };
  addMesh(scene, box(60,0.1,60), M(0x0a0f18), [0,0,0], null, objs);
  addMesh(scene, box(14,6,10), M(0x1e2a40,{rough:0.6}), [0,3,-1], null, objs);
  addMesh(scene, box(14.4,0.4,10.4), M(0x1a2a60), [0,6.2,-1], null, objs);
  // Columns
  [-6,6].forEach(x=> addMesh(scene, cyl(0.3,0.35,6,8), M(0x2563eb,{rough:0.5}), [x,3,4], null, objs));
  // Smart boards (glowing screens)
  for(let i=0;i<3;i++){
    const screen = addMesh(scene, box(3,2,0.1), M(0x0284c7,{emissive:0x0ea5e9,ei:0.7,rough:0.2}), [-4+i*4, 4, 3.96], null, objs);
    state.screens.push(screen);
  }
  // Desks rows
  for(let r=0;r<4;r++) for(let c=0;c<5;c++){
    addMesh(scene, box(1.2,0.08,0.8), M(0x92400e), [-4+c*2, 1.0, -1+r*1.5], null, objs);
    // Tablet on desk
    const tab = addMesh(scene, box(0.6,0.04,0.4), M(0x1e40af,{emissive:0x3b82f6,ei:0.4}), [-4+c*2, 1.07, -1+r*1.5], null, objs);
    // Student
    const head = new THREE.Mesh(sph(0.2,8), M(0xfde68a));
    head.position.set(-4+c*2, 1.5, -1+r*1.5);
    scene.add(head); objs.push(head);
  }
  // Data beam (code particles) — will be animated
  state.codeParticles = [];
  for(let i=0;i<30;i++){
    const p = new THREE.Mesh(box(0.06,0.06,0.06), M(0x22d3ee,{emissive:0x06b6d4,ei:1}));
    p.position.set(-6+Math.random()*12, 0.5+Math.random()*5, 4+Math.random()*0.5);
    p.userData = { speed: 0.02+Math.random()*0.02, dir: Math.random() > 0.5 ? 1:-1 };
    scene.add(p); objs.push(p); state.codeParticles.push(p);
  }
  [[-10,4],[-10,-3],[12,-4],[12,4]].forEach(([x,z])=>{
    addMesh(scene, cyl(0.15,0.2,1.5,6), M(0x44403c), [x,0.75,z], null, objs);
    addMesh(scene, sph(1.2,7), M(0x166534), [x,2.5,z], null, objs);
  });
  state.posNodes=[]; state.negNodes=[];
  [[-5,6,3],[4,7,-3],[8,5,4]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.25,8),M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.posNodes.push(n);
  });
  [[-3,6,-4],[7,5,-4]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.3,8),M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.negNodes.push(n);
  });
  return state;
};

// ── 4. UNIVERSAL HEALTH / HEALTH INSURANCE ────────────────────────────────────
BUILDERS.universal_health = BUILDERS.health_insurance = BUILDERS.vaccination = BUILDERS.mental_health = BUILDERS.sanitation = (scene, objs) => {
  const state = { clock:0, healingRings:[], patients:[] };
  addMesh(scene, box(60,0.1,60), M(0x08100a), [0,0,0], null, objs);
  // Main hospital
  addMesh(scene, box(12,7,9), M(0x1e3a5f,{rough:0.6}), [0,3.5,0], null, objs);
  addMesh(scene, box(12.4,0.4,9.4), M(0x172554), [0,7.2,0], null, objs);
  // Red cross on facade
  addMesh(scene, box(0.5,2.5,0.1), M(0xef4444,{emissive:0xef4444,ei:0.6}), [0,5.5,4.56], null, objs);
  addMesh(scene, box(1.8,0.5,0.1), M(0xef4444,{emissive:0xef4444,ei:0.6}), [0,5.5,4.56], null, objs);
  // Windows
  for(let r=0;r<3;r++) for(let c=0;c<5;c++)
    addMesh(scene, box(0.9,0.75,0.08), M(0x93c5fd,{emissive:0x1d4ed8,ei:0.3}), [-4+c*2,1.2+r*1.9,4.56], null, objs);
  // Side clinics
  [[-8,2],[8,2],[-8,-2],[8,-2]].forEach(([x,z])=>{
    addMesh(scene, box(3,2.5,3), M(0x1e3a5f,{rough:0.7}), [x,1.25,z-4], null, objs);
  });
  // DNA helix decoration
  for(let i=0;i<30;i++){
    const t=i/30; const ang=t*Math.PI*6; const y=t*8-1;
    [1,-1].forEach(s=>{
      const sp = new THREE.Mesh(sph(0.15,8), M(s>0?0xf43f5e:0x34d399,{emissive:s>0?0xbe123c:0x065f46,ei:0.5}));
      sp.position.set(13+Math.cos(ang)*1.2*s, y, Math.sin(ang)*1.2);
      scene.add(sp); objs.push(sp);
    });
  }
  // Pulse rings around hospital
  [1.5,2.5,3.5].forEach((r,i)=>{
    const ring = new THREE.Mesh(torus(r,0.04,8,40), M(0xf43f5e,{emissive:0xbe123c,ei:0.6,alpha:0.7}));
    ring.rotation.x=Math.PI/2; ring.position.set(0,0.1,0);
    ring.userData={idx:i,phase:0};
    scene.add(ring); objs.push(ring); state.healingRings.push(ring);
  });
  // Patient flow (small spheres)
  for(let i=0;i<20;i++){
    const ang=(i/20)*Math.PI*2;
    const p = new THREE.Mesh(sph(0.2,6), M(0xfde68a,{emissive:0xfbbf24,ei:0.2}));
    const baseRadius = 10;
    p.position.set(Math.cos(ang)*baseRadius,0.2,Math.sin(ang)*baseRadius);
    p.userData={ang,speed:0.008,phase:i,rad:baseRadius};
    scene.add(p); objs.push(p); state.patients.push(p);
  }
  [[-12,4],[-12,-3],[12,-4],[12,4],[-8,6],[8,6]].forEach(([x,z])=>{
    addMesh(scene, cyl(0.15,0.2,1.5,6), M(0x44403c), [x,0.75,z], null, objs);
    addMesh(scene, sph(1.1,7), M(0x166534), [x,2.5,z], null, objs);
  });
  state.posNodes=[]; state.negNodes=[];
  [[-5,7,3],[3,8,-4],[9,6,3]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.25,8),M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.posNodes.push(n);
  });
  [[-3,7,-4],[8,5,-4],[-8,6,4]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.3,8),M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.negNodes.push(n);
  });
  return state;
};

// ── 5. ENVIRONMENT / SOLAR / EV / AFFORESTATION / WATER ───────────────────────
BUILDERS.solar_rooftop = BUILDERS.plastic_ban = BUILDERS.ev_mission = BUILDERS.afforestation = BUILDERS.water_mission = (scene, objs) => {
  const state = { clock:0, turbines:[], bubbles:[], evCars:[], trees:[] };
  addMesh(scene, box(60,0.1,60), M(0x060e08), [0,0,0], null, objs);

  // Grid of houses with solar panels
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const x=-7+c*4.5, z=-7+r*4.5;
    addMesh(scene, box(2.5,2,2.5), M(0xfef3c7,{rough:0.8}), [x,1,z], null, objs);
    addMesh(scene, cone(2,1,4), M(0xc2410c,{rough:0.7}), [x,2.5,z], [0,Math.PI/4,0], objs);
    // Solar panel on roof
    const panel = addMesh(scene, box(1.5,0.05,1), M(0x1e3a5f,{emissive:0x1d4ed8,ei:0.2,rough:0.3}), [x,2.15+0.05,z+0.3], [-0.4,0,0], objs);
    panel.userData.isSolar = true;
  }

  // Wind turbines
  [[0,0],[5,-5],[-5,5]].forEach(([x,z],i)=>{
    addMesh(scene, cyl(0.08,0.15,9,6), M(0xd1d5db), [x,4.5,z], null, objs);
    for(let b=0;b<3;b++){
      const blade = addMesh(scene, box(0.15,3.2,0.05), M(0xf1f5f9,{rough:0.3}), [x,9,z], [0,0,(b/3)*Math.PI*2], objs);
      blade.userData={turbineIdx:i, bladeIdx:b};
      state.turbines.push(blade);
    }
  });

  // Trees (growing)
  [[-12,4],[-12,-2],[-11,-7],[-13,0],[12,-6],[13,-2],[14,4],[11,5],[-9,7],[9,7],[-7,-8],[7,-8]].forEach(([x,z],i)=>{
    addMesh(scene, cyl(0.15,0.2,1.5,6), M(0x44403c), [x,0.75,z], null, objs);
    const trunk = addMesh(scene, cyl(0.15,0.2,1.5,6), M(0x44403c), [x,0.75,z], null, objs);
    const crown = addMesh(scene, sph(1.3,7), M(0x15803d,{rough:0.9}), [x,2.5,z], null, objs);
    crown.userData={treeIdx:i}; state.trees.push(crown);
  });

  // EV cars (moving along roads)
  const roadColors = [0x60a5fa, 0x34d399, 0xfbbf24];
  for(let i=0;i<8;i++){
    const car = new THREE.Group();
    car.add(new THREE.Mesh(box(0.9,0.35,0.55), M(roadColors[i%3])));
    car.children[0].position.y=0.175;
    car.add(new THREE.Mesh(box(0.55,0.25,0.5), M(roadColors[i%3])));
    car.children[1].position.set(0,0.42,0);
    car.position.set(-10+i*2.5, 0.2, i%2===0?-3:3);
    car.userData={road:i%2, speed:0.04+Math.random()*0.02};
    scene.add(car); objs.push(car); state.evCars.push(car);
  }

  // CO2 / pollution bubbles (fade out over time)
  for(let i=0;i<20;i++){
    const b = new THREE.Mesh(sph(0.1+Math.random()*0.12,6), M(0x6b7280,{alpha:0.4}));
    b.position.set(-10+Math.random()*20, Math.random()*8, -10+Math.random()*20);
    b.userData={startY:b.position.y};
    scene.add(b); objs.push(b); state.bubbles.push(b);
  }

  state.posNodes=[]; state.negNodes=[];
  [[-6,7,3],[3,8,-4],[8,6,4]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.25,8),M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.posNodes.push(n);
  });
  [[-3,7,-5],[7,5,-5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.3,8),M(0xf97316,{emissive:0xf97316,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.negNodes.push(n);
  });
  return state;
};

// ── 6. ECONOMIC / STARTUP / GST / MGNREGA / PLI / JAN DHAN ───────────────────
BUILDERS.gst_reform = BUILDERS.startup_india = BUILDERS.mgnrega = BUILDERS.pli_scheme = BUILDERS.jan_dhan = (scene, objs) => {
  const state = { clock:0, buildings:[], coins:[] };
  addMesh(scene, box(60,0.1,60), M(0x0a080c), [0,0,0], null, objs);

  // Rising bar chart cityscape
  const barData = [
    {x:-7,h:2,c:0xf97316},{x:-5,h:3.5,c:0xea580c},{x:-3,h:3,c:0xf97316},
    {x:-1,h:5,c:0xfbbf24},{x:1,h:4.2,c:0xf97316},{x:3,h:6.5,c:0xea580c},
    {x:5,h:8,c:0xfbbf24},{x:7,h:9.5,c:0xf97316}
  ];
  barData.forEach((b,i)=>{
    const bar = addMesh(scene, box(1.4,b.h,1.4), M(b.c,{emissive:b.c,ei:0.15,rough:0.5}), [b.x,b.h/2,0], null, objs);
    bar.userData={baseH:b.h, idx:i};
    // Top glow disk
    addMesh(scene, cyl(0.75,0.75,0.12,16), M(b.c,{emissive:b.c,ei:0.9,rough:0.2}), [b.x,b.h+0.06,0], null, objs);
    state.buildings.push(bar);
  });

  // Central obelisk (economy monument)
  addMesh(scene, cyl(0.3,0.6,10,8), M(0xfbbf24,{emissive:0xf59e0b,ei:0.3,rough:0.2}), [0,5,-6], null, objs);

  // Factory buildings (PLI)
  [[-10,2],[-10,-3],[11,2],[11,-3]].forEach(([x,z])=>{
    addMesh(scene, box(3,3,3), M(0x4b5563,{rough:0.8}), [x,1.5,z], null, objs);
    addMesh(scene, cyl(0.25,0.3,3,6), M(0x6b7280), [x+1,3,z], null, objs);
  });

  // Coin particles (money flow)
  for(let i=0;i<25;i++){
    const coin = new THREE.Mesh(cyl(0.18,0.18,0.05,12), M(0xfbbf24,{emissive:0xf59e0b,ei:0.7}));
    coin.position.set(-8+Math.random()*16, 0.5+Math.random()*8, -8+Math.random()*8);
    coin.userData={floatY:coin.position.y, speed:0.01+Math.random()*0.02};
    scene.add(coin); objs.push(coin); state.coins.push(coin);
  }

  // Stock ticker ring
  for(let i=0;i<50;i++){
    const ang=(i/50)*Math.PI*2; const r=12;
    const h=0.5+Math.sin(ang*5)*1.5+1.5;
    addMesh(scene, box(0.28,h,0.28), M(0xf97316,{emissive:0xea580c,ei:0.3}), [Math.cos(ang)*r,h/2,Math.sin(ang)*r], null, objs);
  }

  state.posNodes=[]; state.negNodes=[];
  [[-5,7,3],[4,8,-3],[8,6,5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.25,8),M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.posNodes.push(n);
  });
  [[-3,6,-4],[6,5,-5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.3,8),M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.negNodes.push(n);
  });
  return state;
};

// ── 7. INFRASTRUCTURE ─────────────────────────────────────────────────────────
BUILDERS.infrastructure_network = BUILDERS.five_g = BUILDERS.smart_city = BUILDERS.metro_expansion = BUILDERS.housing_scheme = (scene, objs) => {
  const state = { clock:0, vehicles:[], signals:[] };
  addMesh(scene, box(60,0.1,60), M(0x080a0c), [0,0,0], null, objs);

  // Road grid
  [-4,0,4].forEach(x=> addMesh(scene, box(0.7,0.06,26), M(0x1f2937,{rough:0.9}), [x,0.04,0], null, objs));
  [-4,0,4].forEach(z=> addMesh(scene, box(26,0.06,0.7), M(0x1f2937,{rough:0.9}), [0,0.04,z], null, objs));

  // Buildings at grid intersections
  const hts = [3,5,4,2,7,4,3,6,2];
  let bi=0;
  [-4,0,4].forEach(x=>[-4,0,4].forEach(z=>{
    const h=hts[bi++];
    addMesh(scene, box(2.8,h,2.8), M(0xea580c,{emissive:0xc2410c,ei:0.1,rough:0.6}), [x,h/2,z], null, objs);
    // Roof antennas
    if(Math.random()>0.5) addMesh(scene, cyl(0.04,0.04,1.5,4), M(0x9ca3af), [x,h+0.75,z], null, objs);
  }));

  // Bridge over center
  addMesh(scene, box(14,0.35,2.2), M(0xc2410c,{rough:0.5}), [0,3,0], null, objs);
  [-5,5].forEach(x=> addMesh(scene, cyl(0.3,0.4,3.1,8), M(0xd1d5db), [x,1.55,0], null, objs));

  // Power towers
  [[7,7],[7,-7],[-7,7],[-7,-7],[0,9],[0,-9]].forEach(([x,z])=>{
    addMesh(scene, cyl(0.05,0.18,7,4), M(0x9ca3af), [x,3.5,z], null, objs);
    addMesh(scene, box(2.5,0.1,0.1), M(0x9ca3af), [x,6.5,z], null, objs);
    // Power line glow
    addMesh(scene, cyl(0.02,0.02,14,4), M(0x60a5fa,{emissive:0x3b82f6,ei:0.4}), [x,6.5,0], [0,0,Math.PI/2], objs);
  });

  // Metro track
  addMesh(scene, box(0.1,0.12,26), M(0x6b7280), [-0.3,0.12,0], null, objs);
  addMesh(scene, box(0.1,0.12,26), M(0x6b7280), [0.3,0.12,0], null, objs);
  // Metro train
  const train = new THREE.Group();
  [0,2.2,-2.2].forEach(dx=>{
    const car = new THREE.Mesh(box(1.8,0.9,0.7), M(0xb91c1c,{emissive:0x991b1b,ei:0.1}));
    car.position.set(dx,0.6,0);
    train.add(car);
  });
  train.position.set(-10,0,0);
  train.userData={speed:0.08};
  scene.add(train); objs.push(train); state.train=train;

  // Vehicles on roads
  for(let i=0;i<12;i++){
    const v = new THREE.Mesh(box(0.6,0.25,0.35), M([0x60a5fa,0xfbbf24,0x34d399][i%3]));
    v.position.set(-12+i*2, 0.17, i%3===0?-4:i%3===1?0:4);
    v.userData={road:i%3, speed:0.05+Math.random()*0.03};
    scene.add(v); objs.push(v); state.vehicles.push(v);
  }

  // 5G towers
  [[-10,0],[10,0],[0,-10],[0,10]].forEach(([x,z])=>{
    addMesh(scene, cyl(0.08,0.15,8,6), M(0xfbbf24,{emissive:0xf59e0b,ei:0.4}), [x,4,z], null, objs);
    const ring = new THREE.Mesh(torus(2,0.04,8,32), M(0x3b82f6,{emissive:0x1d4ed8,ei:0.8,alpha:0.6}));
    ring.rotation.x=Math.PI/2; ring.position.set(x,8,z);
    scene.add(ring); objs.push(ring); state.signals.push(ring);
  });

  state.posNodes=[]; state.negNodes=[];
  [[-6,8,4],[4,9,-4],[9,7,5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.25,8),M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.posNodes.push(n);
  });
  [[-4,7,-5],[7,6,-5],[-7,7,5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.3,8),M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.negNodes.push(n);
  });
  return state;
};

// ── 8. SOCIAL / PENSION / BETI / UJJWALA / GIG / PDS ─────────────────────────
BUILDERS.pension_scheme = BUILDERS.beti_bachao = BUILDERS.ujjwala = BUILDERS.gig_workers = BUILDERS.pds_reform = (scene, objs) => {
  const state = { clock:0, people:[], connections:[] };
  addMesh(scene, box(60,0.1,60), M(0x0c060e), [0,0,0], null, objs);

  // Central community hall
  addMesh(scene, cyl(1.5,2,3,8), M(0x9f1239,{rough:0.6}), [0,1.5,0], null, objs);
  addMesh(scene, cone(2.8,2.2,8), M(0xb91c1c,{rough:0.5}), [0,4.1,0], [0,Math.PI/8,0], objs);
  // Hall glow top
  addMesh(scene, cyl(0.3,0.3,0.5,8), M(0xfbbf24,{emissive:0xf59e0b,ei:1}), [0,5.5,0], null, objs);

  // Houses in 2 rings
  [[5,8],[9,14]].forEach(([r,count])=>{
    for(let i=0;i<count;i++){
      const ang=(i/count)*Math.PI*2;
      const x=Math.cos(ang)*r, z=Math.sin(ang)*r;
      addMesh(scene, box(1.4,1.4,1.4), M(0xfce7f3,{rough:0.8}), [x,0.7,z], null, objs);
      addMesh(scene, cone(1.1,0.8,4), M(0xc2410c,{rough:0.6}), [x,1.8,z], [0,Math.PI/4,0], objs);
      // Lamp
      addMesh(scene, cyl(0.04,0.04,1.5,4), M(0xd1d5db), [x+0.8,0.75,z+0.8], null, objs);
      addMesh(scene, sph(0.12,6), M(0xfbbf24,{emissive:0xfbbf24,ei:1}), [x+0.8,1.55,z+0.8], null, objs);
    }
  });

  // Connecting lines from center to ring 1 houses
  for(let i=0;i<8;i++){
    const ang=(i/8)*Math.PI*2;
    const x=Math.cos(ang)*5, z=Math.sin(ang)*5;
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0.1,0), new THREE.Vector3(x,0.1,z)]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color:0xf43f5e,transparent:true,opacity:0.4}));
    scene.add(line); objs.push(line); state.connections.push(line);
  }

  // People figures (40 dots)
  for(let i=0;i<40;i++){
    const ang=Math.random()*Math.PI*2, r=Math.random()*12;
    const p = new THREE.Mesh(sph(0.18,6), M(0xfda4af,{emissive:0xf43f5e,ei:0.3}));
    p.position.set(Math.cos(ang)*r,0.18,Math.sin(ang)*r);
    p.userData={ang,r,speed:0.005+Math.random()*0.01};
    scene.add(p); objs.push(p); state.people.push(p);
  }

  // LPG flames for ujjwala-like policies
  for(let i=0;i<6;i++){
    const ang=(i/6)*Math.PI*2;
    const flame = new THREE.Mesh(cone(0.12,0.4,6), M(0xf97316,{emissive:0xf97316,ei:0.9,alpha:0.8}));
    flame.position.set(Math.cos(ang)*5,0.4,Math.sin(ang)*5);
    flame.userData={floatY:0.4,idx:i};
    scene.add(flame); objs.push(flame); state.flames=state.flames||[]; state.flames.push(flame);
  }

  [[-12,4],[-12,-3],[12,-4],[12,4]].forEach(([x,z])=>{
    addMesh(scene, cyl(0.15,0.2,1.5,6), M(0x44403c), [x,0.75,z], null, objs);
    addMesh(scene, sph(1.1,7), M(0x166534), [x,2.5,z], null, objs);
  });

  state.posNodes=[]; state.negNodes=[];
  [[-5,7,3],[4,8,-4],[9,6,3],[-9,6,-3]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.25,8),M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.posNodes.push(n);
  });
  [[-3,7,-5],[8,5,-5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.3,8),M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.negNodes.push(n);
  });
  return state;
};

// ── 9. AGRICULTURE ────────────────────────────────────────────────────────────
BUILDERS.pm_kisan = BUILDERS.crop_insurance = BUILDERS.drip_irrigation = BUILDERS.organic_farming = BUILDERS.e_nam = (scene, objs) => {
  const state = { clock:0, crops:[], tractors:[], waterDrops:[] };
  addMesh(scene, box(60,0.1,60), M(0x080e06), [0,0,0], null, objs);

  // Farm plots (green fields)
  const fieldColors = [0x166534,0x15803d,0x14532d,0x166534];
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    addMesh(scene, box(4.5,0.15,4.5), M(fieldColors[(r+c)%4],{rough:0.95}), [-7+c*5, 0.08, -7+r*5], null, objs);
  }

  // Crop rows (animated growth)
  for(let r=0;r<5;r++) for(let c=0;c<8;c++){
    const crop = addMesh(scene, cyl(0.08,0.08,0.4+Math.random()*0.3,6), M(0x4ade80,{emissive:0x16a34a,ei:0.2}), [-8+c*2.2,-0.05,-5+r*2.5], null, objs);
    crop.userData={baseH:0.4+Math.random()*0.3, idx:r*8+c};
    state.crops.push(crop);
  }

  // Irrigation channels
  for(let i=0;i<5;i++)
    addMesh(scene, box(0.2,0.08,20), M(0x0284c7,{emissive:0x0ea5e9,ei:0.3}), [-8+i*4,0.1,0], null, objs);

  // Drip pipe system
  for(let i=0;i<8;i++)
    addMesh(scene, cyl(0.04,0.04,20,4), M(0x0284c7,{rough:0.8}), [-7+i*2,0.08,0], [Math.PI/2,0,0], objs);

  // Farmhouse
  addMesh(scene, box(5,3,4), M(0x92400e,{rough:0.8}), [10,1.5,0], null, objs);
  addMesh(scene, cone(3.5,1.5,4), M(0xb45309), [10,3.75,0], [0,Math.PI/4,0], objs);

  // Water tank
  addMesh(scene, cyl(1,1,3,12), M(0x0284c7,{emissive:0x0284c7,ei:0.15}), [10,1.5,-6], null, objs);
  addMesh(scene, cyl(0.2,0.2,4,6), M(0x9ca3af), [10,2,-6], null, objs);

  // Tractors
  for(let i=0;i<3;i++){
    const tractor = new THREE.Group();
    tractor.add(new THREE.Mesh(box(1.2,0.7,0.8), M(0xef4444)));
    tractor.children[0].position.y=0.5;
    tractor.add(new THREE.Mesh(box(0.7,0.5,0.75), M(0xdc2626)));
    tractor.children[1].position.set(0.3,0.85,0);
    // Wheels
    [[-0.5,0.25,-0.45],[0.5,0.25,-0.45],[-0.5,0.25,0.45],[0.5,0.25,0.45]].forEach(([wx,wy,wz])=>{
      const w=new THREE.Mesh(cyl(0.28,0.28,0.15,10),M(0x111827));
      w.rotation.x=Math.PI/2; w.position.set(wx,wy,wz); tractor.add(w);
    });
    tractor.position.set(-10+i*3, 0, -8+i*4);
    tractor.userData={speed:0.03, dir:1};
    scene.add(tractor); objs.push(tractor); state.tractors.push(tractor);
  }

  // Water drops (drip irrigation)
  for(let i=0;i<30;i++){
    const drop = new THREE.Mesh(sph(0.06,6), M(0x38bdf8,{emissive:0x0ea5e9,ei:0.5,alpha:0.8}));
    drop.position.set(-7+Math.random()*14, 0.5+Math.random()*0.8, -8+Math.random()*16);
    drop.userData={startY:drop.position.y+Math.random()*2};
    scene.add(drop); objs.push(drop); state.waterDrops.push(drop);
  }

  // mNAM market building
  addMesh(scene, box(6,4,5), M(0x065f46,{rough:0.6}), [-10,2,0], null, objs);
  addMesh(scene, box(6.4,0.3,5.4), M(0x064e3b), [-10,4.15,0], null, objs);
  // Market sign
  addMesh(scene, box(3,0.5,0.1), M(0xfbbf24,{emissive:0xf59e0b,ei:0.5}), [-10,3.8,-2.56], null, objs);

  state.posNodes=[]; state.negNodes=[];
  [[-5,7,4],[3,8,-4],[9,6,5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.25,8),M(0x22c55e,{emissive:0x22c55e,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.posNodes.push(n);
  });
  [[-3,7,-5],[8,5,-5]].forEach(([x,y,z])=>{
    const n=new THREE.Mesh(sph(0.3,8),M(0xef4444,{emissive:0xef4444,ei:0.8,alpha:0}));
    n.position.set(x,y,z);scene.add(n);objs.push(n);state.negNodes.push(n);
  });
  return state;
};

// ─── SCENE ANIMATOR ───────────────────────────────────────────────────────────
function animateState(state, phase, t, clock) {
  state.clock = clock;
  const wifiOn = phase >= 1;

  // Wifi rings
  if (state.rings) {
    state.rings.forEach(ring => {
      if (!wifiOn) { ring.material.opacity = Math.max(0, ring.material.opacity - 0.05); return; }
      ring.userData.delay -= 0.016;
      if (ring.userData.delay <= 0) {
        const prog = Math.min(1, Math.abs(ring.userData.delay) / 2.5);
        ring.material.opacity = Math.max(0, 0.6*(1-prog));
        ring.scale.setScalar(1 + prog * 0.4);
        if (prog >= 1) { ring.userData.delay = 1.2 + Math.random() * 0.6; ring.scale.setScalar(1); }
      }
    });
  }

  // WiFi school students
  if (state.students && state.routers) {
    state.students.forEach((s,i) => {
      if (phase === 0) {
        s.position.x += (s.userData.baseAngle > Math.PI ? -1 : 1) * 0.005;
      } else if (phase === 1) {
        s.userData.angle = (s.userData.angle || 0) + s.userData.speed;
        const r = s.userData.rad || 8;
        s.position.x = Math.cos(s.userData.angle) * r;
        s.position.z = Math.sin(s.userData.angle) * r;
      } else if (phase === 2) {
        const cx = [4,-4,4,-4][i%4], cz = [4,4,-4,-4][i%4];
        s.position.x += (cx + Math.sin(clock+i)*1.5 - s.position.x) * 0.02;
        s.position.z += (cz + Math.cos(clock+i)*1.5 - s.position.z) * 0.02;
      } else {
        const ang = (i/24)*Math.PI*2 + clock*0.08;
        s.position.x += (Math.cos(ang)*9 - s.position.x) * 0.01;
        s.position.z += (Math.sin(ang)*9 - s.position.z) * 0.01;
      }
    });
  }

  // Crane (phase 0 only)
  if (state.crane) state.crane.visible = phase === 0;

  // Turbine blades spin
  if (state.turbines) state.turbines.forEach(b => { b.rotation.z += 0.04 * (0.5 + t); });

  // Flag wave
  if (state.flag) state.flag.rotation.z = Math.sin(clock * 2) * 0.15;

  // Steam rising
  if (state.steam) {
    state.steam.forEach(s => {
      s.position.y += 0.015;
      if (s.position.y > 6) s.position.y = s.userData.startY;
      s.material.opacity = 0.2 + Math.sin(clock + s.position.x) * 0.15;
    });
  }

  // Code particles
  if (state.codeParticles) {
    state.codeParticles.forEach(p => {
      p.position.x += p.userData.dir * p.userData.speed;
      if (p.position.x > 7 || p.position.x < -7) p.userData.dir *= -1;
      p.material.emissiveIntensity = 0.5 + Math.sin(clock * 3) * 0.5;
    });
  }

  // EV cars move
  if (state.evCars) {
    state.evCars.forEach(car => {
      car.position.x += car.userData.speed;
      if (car.position.x > 12) car.position.x = -12;
      // Fade CO2 (bubbles) as EVs increase
      if (state.bubbles) state.bubbles.forEach(b => {
        b.material.opacity = Math.max(0, 0.4 - t * 0.35);
        b.position.y += 0.008;
        if (b.position.y > 10) b.position.y = b.userData.startY;
      });
    });
  }

  // Economic bars grow
  if (state.buildings) {
    state.buildings.forEach(b => {
      const target = b.userData.baseH * (0.4 + t * 0.9);
      b.scale.y += (target/b.userData.baseH - b.scale.y) * 0.02;
      b.position.y = (b.userData.baseH * b.scale.y) / 2;
    });
  }

  // Coin floats
  if (state.coins) {
    state.coins.forEach(coin => {
      coin.position.y = coin.userData.floatY + Math.sin(clock * coin.userData.speed * 20) * 0.3;
      coin.rotation.y += coin.userData.speed;
      coin.material.emissiveIntensity = 0.5 + Math.sin(clock*2 + coin.position.x) * 0.4;
    });
  }

  // Vehicles move
  if (state.vehicles) {
    state.vehicles.forEach(v => {
      v.position.x += v.userData.speed;
      if (v.position.x > 13) v.position.x = -13;
    });
  }

  // Metro train
  if (state.train) {
    state.train.position.z += state.train.userData.speed;
    if (state.train.position.z > 14) state.train.position.z = -14;
  }

  // 5G signal rings pulse
  if (state.signals) {
    state.signals.forEach((ring, i) => {
      const pulse = 1 + Math.sin(clock * 2 + i) * 0.08;
      ring.scale.setScalar(pulse);
      ring.material.emissiveIntensity = 0.5 + Math.sin(clock * 3 + i) * 0.4;
    });
  }

  // Social people move
  if (state.people) {
    state.people.forEach(p => {
      p.userData.ang += p.userData.speed;
      const target_r = phase >= 1 ? p.userData.r * (0.5 + t * 0.8) : p.userData.r * 0.3;
      p.position.x = Math.cos(p.userData.ang) * target_r;
      p.position.z = Math.sin(p.userData.ang) * target_r;
    });
  }

  // Flames flicker
  if (state.flames) {
    state.flames.forEach((f,i) => {
      f.position.y = f.userData.floatY + Math.abs(Math.sin(clock * 3 + i)) * 0.15;
      f.scale.x = 0.8 + Math.sin(clock * 5 + i) * 0.2;
      f.material.emissiveIntensity = 0.6 + Math.sin(clock * 4) * 0.3;
    });
  }

  // Crop growth
  if (state.crops) {
    state.crops.forEach(crop => {
      const targetH = crop.userData.baseH * (0.3 + t * 1.1);
      crop.scale.y += (targetH/crop.userData.baseH - crop.scale.y) * 0.01;
      crop.position.y = (crop.userData.baseH * crop.scale.y) / 2 - 0.05;
    });
  }

  // Water drops
  if (state.waterDrops) {
    state.waterDrops.forEach(drop => {
      drop.position.y -= 0.02;
      if (drop.position.y < 0) drop.position.y = drop.userData.startY;
      drop.material.opacity = Math.max(0, 0.8 - t * 0.4);
    });
  }

  // Tractors move
  if (state.tractors) {
    state.tractors.forEach(tr => {
      tr.position.z += tr.userData.speed * tr.userData.dir;
      if (tr.position.z > 8 || tr.position.z < -8) tr.userData.dir *= -1;
    });
  }

  // Healing rings pulse for healthcare
  if (state.healingRings) {
    state.healingRings.forEach((ring, i) => {
      const pulse = 1 + Math.sin(clock * 1.5 + i * 1.2) * 0.1;
      ring.scale.set(pulse, pulse, pulse);
      ring.material.emissiveIntensity = 0.3 + Math.sin(clock * 2 + i) * 0.3;
    });
  }

  // Patients move toward hospital (phase 1) or away (phase 2)
  if (state.patients) {
    state.patients.forEach(p => {
      p.userData.ang += p.userData.speed;
      const r = phase >= 1 ? Math.max(1, p.userData.rad * (1 - t * 0.5)) : 10;
      p.position.x = Math.cos(p.userData.ang) * r;
      p.position.z = Math.sin(p.userData.ang) * r;
    });
  }

  // Impact nodes — show/hide by phase
  if (state.posNodes) {
    state.posNodes.forEach(n => {
      const target = phase >= 1 ? 0.85 : 0;
      n.material.opacity += (target - n.material.opacity) * 0.05;
      n.position.y += Math.sin(clock * 1.5 + n.position.x) * 0.003;
    });
  }
  if (state.negNodes) {
    state.negNodes.forEach(n => {
      const target = phase >= 2 && phase < 3 ? 0.85 : phase === 3 ? 0.25 : 0;
      n.material.opacity += (target - n.material.opacity) * 0.05;
      n.position.y += Math.sin(clock * 2 + n.position.z) * 0.003;
    });
  }
}

// ─── REACT COMPONENT ──────────────────────────────────────────────────────────
export default function PolicyScene3D({ policy, month, activePhase }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const stateRef = useRef(null);
  const objsRef = useRef([]);
  const clockRef = useRef(0);
  const rafRef = useRef(null);

  const buildScene = useCallback(() => {
    if (!sceneRef.current || !policy) return;
    // Clear
    objsRef.current.forEach(obj => {
      sceneRef.current.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    objsRef.current = [];

    const sceneType = policy.sceneType || 'default';
    const builder = BUILDERS[sceneType] || BUILDERS.default;
    stateRef.current = builder(sceneRef.current, objsRef.current);
  }, [policy]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0x07090f, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090f, 0.02);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(52, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.set(20, 15, 22);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0x0a1020, 1.0));
    const sun = new THREE.DirectionalLight(0xadd8ff, 1.3);
    sun.position.set(15, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -25; sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25;
    scene.add(sun);
    const fill = new THREE.PointLight(0x1e3a8a, 1.2, 60);
    fill.position.set(-12, 8, -12);
    scene.add(fill);
    const accent = new THREE.PointLight(0xf97316, 0.5, 40);
    accent.position.set(8, 4, 8);
    scene.add(accent);

    // Grid
    const grid = new THREE.GridHelper(60, 30, 0x1a2235, 0x111827);
    grid.position.y = 0.02;
    scene.add(grid);

    // Resize
    const onResize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  // Build scene when policy changes
  useEffect(() => { buildScene(); }, [buildScene]);

  // Animation loop
  useEffect(() => {
    let camAngle = 0.4;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      clockRef.current += 0.016;
      camAngle += 0.0012;

      const camera = cameraRef.current;
      const R = 26;
      camera.position.x = Math.cos(camAngle) * R;
      camera.position.z = Math.sin(camAngle) * R;
      camera.position.y = 15 + Math.sin(clockRef.current * 0.2) * 1.5;
      camera.lookAt(0, 3, 0);

      if (stateRef.current) {
        const t = month / (policy?.phases?.at(-1)?.monthEnd || 60);
        animateState(stateRef.current, activePhase, t, clockRef.current);
      }

      rendererRef.current?.render(sceneRef.current, cameraRef.current);
    };
    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [month, activePhase, policy]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
  );
}
