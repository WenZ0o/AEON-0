// ---------- THREE.JS HIPPOCAMPAL BRAIN CORE V6 ----------
const coreViewport = $('coreViewport');

if (typeof THREE === 'undefined') {
  coreViewport.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#ff7893;font:12px/1.7 monospace;letter-spacing:.08em">THREE.JS COULD NOT LOAD.<br>CHECK YOUR INTERNET CONNECTION OR OPEN THIS FILE IN CHROME/EDGE.</div>';
  $('coreState').textContent = 'RENDERER OFFLINE';
  throw new Error('Three.js failed to load');
}

const LOGICAL_NEURAL_UNITS = 166500.54;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020102, .022);

const camera = new THREE.PerspectiveCamera(39, 1, .1, 100);
camera.position.set(0, -.04, 7.4);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.20;
coreViewport.prepend(renderer.domElement);

const coreGroup = new THREE.Group();
coreGroup.rotation.set(.18, -.18, -.06);
scene.add(coreGroup);

scene.add(new THREE.AmbientLight(0x3f0b1e, .45));
const keyLight = new THREE.PointLight(0xff6c7f, 5.0, 18, 2);
keyLight.position.set(-2.9, 2.1, 4.8);
scene.add(keyLight);
const warmLight = new THREE.PointLight(0xffc177, 4.8, 16, 2);
warmLight.position.set(2.4, 1.9, 3.7);
scene.add(warmLight);
const rimLight = new THREE.PointLight(0x8f1738, 3.7, 18, 2);
rimLight.position.set(3.3, -.6, 2.2);
scene.add(rimLight);

function radialTexture(){
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64,64,1,64,64,64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(.12, 'rgba(255,233,198,.98)');
  g.addColorStop(.34, 'rgba(255,124,146,.84)');
  g.addColorStop(.62, 'rgba(255,42,91,.24)');
  g.addColorStop(1, 'rgba(255,0,70,0)');
  x.fillStyle = g;
  x.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowTexture = radialTexture();

function brainWarp(v, shell = 1){
  const x0 = v.x, y0 = v.y, z0 = v.z;
  const signX = Math.sign(x0 || (Math.random() - .5));
  const mid = Math.exp(-Math.pow(x0 / .24, 2)) * Math.exp(-Math.pow((y0 - .02) / .95, 2));
  const crown = Math.max(0, y0);
  const lower = clamp((-y0 - .24) / .72, 0, 1);

  v.x *= 1.56 * (1 - lower * .18);
  v.y *= 1.18;
  v.z *= 1.26;

  v.x += signX * (.24 + .06 * crown) * mid * shell;
  v.z += (0.18 + 0.05 * crown) * (1 - Math.abs(x0) * .45) * shell;
  v.z -= mid * .10 * shell;
  v.y += crown * .15;

  const temporal = Math.exp(-Math.pow((Math.abs(v.x) - .92) / .44, 2)) * Math.exp(-Math.pow((v.y + .14) / .62, 2));
  v.z += temporal * .18 * shell;

  const occipital = Math.exp(-Math.pow((v.y - .12) / .90, 2)) * Math.exp(-Math.pow((Math.abs(v.x) - .46) / .90, 2));
  v.z += occipital * .08 * shell;

  if (v.y < -.36) {
    v.x *= 1 - lower * .24;
    v.z *= 1 - lower * .14;
    v.y -= lower * .12;
  }
  return v;
}

const SURFACE_NODES = 1160;
const INNER_NODES = 520;
const CORE_NODES = 180;
const NODE_COUNT = SURFACE_NODES + INNER_NODES + CORE_NODES;

const baseNodes = [];
const currentNodes = [];
const nodeRadials = [];
const nodeLayer = [];

function addNode(v, layer){
  baseNodes.push(v);
  currentNodes.push(v.clone());
  nodeRadials.push(v.clone().normalize());
  nodeLayer.push(layer);
}

for(let i=0;i<SURFACE_NODES;i++){
  const y = 1 - (i / (SURFACE_NODES - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const a = Math.PI * (3 - Math.sqrt(5)) * i;
  const ripple = Math.sin(a * 5.7 + y * 4.3) * .026 + Math.cos(a * 2.8) * .014;
  const v = new THREE.Vector3(
    Math.cos(a) * r * (1 + ripple),
    y,
    Math.sin(a) * r * (1 - ripple * .45)
  );
  brainWarp(v, 1);
  v.multiplyScalar(random(.98, 1.02));
  addNode(v, 0);
}

for(let i=0;i<INNER_NODES;i++){
  const v = new THREE.Vector3(normalRandom(), normalRandom(), normalRandom()).normalize();
  v.multiplyScalar(Math.pow(Math.random(), .60) * .86 + .08);
  brainWarp(v, .45);
  v.multiplyScalar(.86);
  addNode(v, 1);
}

for(let i=0;i<CORE_NODES;i++){
  const hemisphere = Math.random() < .5 ? -1 : 1;
  const v = new THREE.Vector3(normalRandom() * .56 + hemisphere * .18, normalRandom() * .48 + .02, normalRandom() * .44).normalize();
  v.multiplyScalar(Math.pow(Math.random(), .55) * .50 + .05);
  brainWarp(v, .18);
  v.multiplyScalar(.64);
  addNode(v, 2);
}

const nodePositions = new Float32Array(NODE_COUNT * 3);
const nodeColors = new Float32Array(NODE_COUNT * 3);
const cOuter = new THREE.Color(0xd54363);
const cOuterWarm = new THREE.Color(0xff8a76);
const cInner = new THREE.Color(0xffa26d);
const cCore = new THREE.Color(0xffe1aa);

for(let i=0;i<NODE_COUNT;i++){
  const p = baseNodes[i];
  nodePositions[i*3] = p.x;
  nodePositions[i*3+1] = p.y;
  nodePositions[i*3+2] = p.z;
  const c = nodeLayer[i] === 2 ? cCore : nodeLayer[i] === 1 ? cInner : (Math.random() < .16 ? cOuterWarm : cOuter);
  nodeColors[i*3] = c.r;
  nodeColors[i*3+1] = c.g;
  nodeColors[i*3+2] = c.b;
}

const nodeGeo = new THREE.BufferGeometry();
nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));

const nodeMat = new THREE.PointsMaterial({
  size:.046,
  map:glowTexture,
  transparent:true,
  opacity:.94,
  vertexColors:true,
  blending:THREE.AdditiveBlending,
  depthWrite:false,
  sizeAttenuation:true
});
const nodeCloud = new THREE.Points(nodeGeo, nodeMat);
coreGroup.add(nodeCloud);

const haloMat = nodeMat.clone();
haloMat.size = .10;
haloMat.opacity = .08;
const haloCloud = new THREE.Points(nodeGeo, haloMat);
coreGroup.add(haloCloud);

const edges = [];
const edgeSeen = new Set();

function addEdge(a,b){
  if(a===b || a<0 || b<0 || a>=NODE_COUNT || b>=NODE_COUNT) return;
  const x = Math.min(a,b), y = Math.max(a,b), key = x+'_'+y;
  if(edgeSeen.has(key)) return;
  edgeSeen.add(key);
  edges.push([x,y]);
}

function connectLocal(start,count,samples,links,maxDist){
  for(let i=start;i<start+count;i++){
    const picks=[];
    for(let s=0;s<samples;s++){
      const j = start + Math.floor(Math.random()*count);
      if(i===j) continue;
      const d = baseNodes[i].distanceToSquared(baseNodes[j]);
      if(d < maxDist*maxDist) picks.push({j,d});
    }
    picks.sort((a,b)=>a.d-b.d);
    for(let k=0;k<Math.min(links,picks.length);k++) addEdge(i,picks[k].j);
  }
}

connectLocal(0,SURFACE_NODES,28,2,.42);
connectLocal(SURFACE_NODES,INNER_NODES,34,3,.46);
connectLocal(SURFACE_NODES+INNER_NODES,CORE_NODES,26,4,.38);

for(let i=0;i<INNER_NODES;i+=3) addEdge(SURFACE_NODES+i,(i*9)%SURFACE_NODES);
for(let i=0;i<CORE_NODES;i+=2) addEdge(SURFACE_NODES+INNER_NODES+i,SURFACE_NODES+(i*5)%INNER_NODES);
for(let i=0;i<180;i++) addEdge(SURFACE_NODES+Math.floor(Math.random()*INNER_NODES), SURFACE_NODES+Math.floor(Math.random()*INNER_NODES));
for(let i=0;i<80;i++){
  const a = Math.floor(Math.random()*SURFACE_NODES);
  const b = Math.floor(Math.random()*SURFACE_NODES);
  if(Math.sign(baseNodes[a].x)!==Math.sign(baseNodes[b].x) && Math.abs(baseNodes[a].y-baseNodes[b].y)<.45) addEdge(a,b);
}

const edgePositions = new Float32Array(edges.length * 6);
const edgeGeo = new THREE.BufferGeometry();
edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
const edgeMat = new THREE.LineBasicMaterial({
  color:0xd04863,
  transparent:true,
  opacity:.14,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
coreGroup.add(edgeLines);

const warmEdges = [];
for(let i=0;i<220;i++){
  const a = SURFACE_NODES + Math.floor(Math.random()*(INNER_NODES+CORE_NODES));
  const b = SURFACE_NODES + Math.floor(Math.random()*(INNER_NODES+CORE_NODES));
  if(a!==b) warmEdges.push([a,b]);
}

const warmPos = new Float32Array(warmEdges.length*6);
const warmGeo = new THREE.BufferGeometry();
warmGeo.setAttribute('position', new THREE.BufferAttribute(warmPos,3));
const warmMat = new THREE.LineBasicMaterial({
  color:0xffc479,
  transparent:true,
  opacity:.12,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const warmLines = new THREE.LineSegments(warmGeo,warmMat);
coreGroup.add(warmLines);

const HOT_COUNT = 86;
const hotIndices = [];
const hotPositions = new Float32Array(HOT_COUNT*3);

for(let i=0;i<HOT_COUNT;i++){
  const idx = SURFACE_NODES + Math.floor(Math.random()*(INNER_NODES+CORE_NODES));
  hotIndices.push(idx);
  const p = baseNodes[idx];
  hotPositions[i*3]=p.x;
  hotPositions[i*3+1]=p.y;
  hotPositions[i*3+2]=p.z;
}

const hotGeo = new THREE.BufferGeometry();
hotGeo.setAttribute('position', new THREE.BufferAttribute(hotPositions,3));
const hotMat = new THREE.PointsMaterial({
  size:.088,
  map:glowTexture,
  color:0xffcd7f,
  transparent:true,
  opacity:.70,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const hotCloud = new THREE.Points(hotGeo,hotMat);
coreGroup.add(hotCloud);

const fissurePoints = [];
for(let i=0;i<=36;i++){
  const t = i/36;
  const y = 1.20 - t*2.15;
  const z = .52 + Math.sin(t*Math.PI)*.16;
  fissurePoints.push(new THREE.Vector3(0, y, z));
}
const fissureGeo = new THREE.BufferGeometry().setFromPoints(fissurePoints);
const fissureMat = new THREE.LineBasicMaterial({
  color:0xffb96f,
  transparent:true,
  opacity:.16,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const fissureLine = new THREE.Line(fissureGeo,fissureMat);
coreGroup.add(fissureLine);

const arcGroup = new THREE.Group();
coreGroup.add(arcGroup);

for(let i=0;i<9;i++){
  const sign = i%2===0 ? -1 : 1;
  const a = new THREE.Vector3(sign*random(.45,.95), random(.15,.85), random(.65,1.05));
  const b = new THREE.Vector3(sign*random(.35,.85), random(-.65,.25), random(.45,.95));
  const mid = a.clone().add(b).multiplyScalar(.5);
  mid.z += random(.45,.85);
  mid.x += sign*random(.14,.34);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3([a,mid,b]).getPoints(48)),
    new THREE.LineBasicMaterial({
      color:i%3===0?0xffc67d:0xa92a4c,
      transparent:true,
      opacity:i%3===0?.12:.055,
      blending:THREE.AdditiveBlending,
      depthWrite:false
    })
  );
  arcGroup.add(line);
}

const dustCount = 280;
const dustPos = new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){
  const v = new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(2.1,3.1));
  v.y *= .82;
  dustPos[i*3]=v.x;
  dustPos[i*3+1]=v.y;
  dustPos[i*3+2]=v.z;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos,3));
const dustMat = new THREE.PointsMaterial({
  size:.024,
  map:glowTexture,
  color:0x9d2346,
  transparent:true,
  opacity:.14,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const dustCloud = new THREE.Points(dustGeo,dustMat);
coreGroup.add(dustCloud);

const signalGeom = new THREE.SphereGeometry(.026,7,7);
const signalMat = new THREE.MeshBasicMaterial({
  color:0xffd9a6,
  transparent:true,
  opacity:.95,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const neuralSignals = [];
const marketImpulses = [];

function spawnNeuralSignal(edgeIndex, energy = 1){
  if(neuralSignals.length>150 || !edges.length) return;
  const mesh = new THREE.Mesh(signalGeom, signalMat.clone());
  mesh.material.color.set(energy>1.2?0xffffff:(energy>.75?0xffcf91:0xff6c83));
  mesh.scale.setScalar(.62+energy*.25);
  coreGroup.add(mesh);
  neuralSignals.push({
    mesh,
    edgeIndex:edgeIndex%edges.length,
    t:0,
    speed:random(.012,.026)*(1+energy*.36),
    reverse:Math.random()>.5
  });
}

const impulseGeom = new THREE.SphereGeometry(.043,8,8);

function spawnMarketImpulse(magnitude, sign){
  const targetIndex = SURFACE_NODES + Math.floor(random(0,INNER_NODES+CORE_NODES));
  const end = currentNodes[targetIndex].clone();
  const dir = end.clone().normalize();
  const tangent = new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(.28,.86));
  const start = dir.multiplyScalar(random(4.2,4.9)).add(tangent);
  const mat = new THREE.MeshBasicMaterial({
    color:sign>=0?0xffcf91:0xff355f,
    transparent:true,
    opacity:.88,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  const mesh = new THREE.Mesh(impulseGeom,mat);
  mesh.position.copy(start);
  coreGroup.add(mesh);
  marketImpulses.push({
    mesh,start,end,targetIndex,t:0,
    speed:random(.025,.041),
    energy:clamp(magnitude*10,.65,2.0)
  });
}

let neuralTension = .34;
let burstEnergy = .07;

function fireNeuralBurst(energy){
  burstEnergy = Math.max(burstEnergy, energy);
  neuralTension = clamp(neuralTension + energy*.082, 0, 1);
  const count = Math.round(8 + energy*19);
  for(let i=0;i<count;i++) spawnNeuralSignal(Math.floor(random(0,edges.length)), energy);
}

function resizeCore(){
  const r = coreViewport.getBoundingClientRect();
  const w = Math.max(10,r.width), h = Math.max(10,r.height);
  renderer.setSize(w,h,false);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resizeCore);
resizeCore();
