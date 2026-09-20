// ---------- THREE.JS CORTICAL PORTRAIT CORE V4 ----------
const coreViewport = $('coreViewport');

if (typeof THREE === 'undefined') {
  coreViewport.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#ff7893;font:12px/1.7 monospace;letter-spacing:.08em">THREE.JS COULD NOT LOAD.<br>CHECK YOUR INTERNET CONNECTION OR OPEN THIS FILE IN CHROME/EDGE.</div>';
  $('coreState').textContent = 'RENDERER OFFLINE';
  $('coreState').style.color = '#ff5f75';
  throw new Error('Three.js failed to load from CDN');
}

const LOGICAL_NEURAL_UNITS = 166500.54;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020102, .032);

const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
camera.position.set(0, .02, 7.7);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
coreViewport.prepend(renderer.domElement);

const coreGroup = new THREE.Group();
coreGroup.rotation.set(.02, -.66, -.015);
scene.add(coreGroup);

scene.add(new THREE.AmbientLight(0x4a0f25, .28));

const keyLight = new THREE.PointLight(0xff4c72, 6.2, 18, 2);
keyLight.position.set(3.2, 2.5, 4.6);
scene.add(keyLight);

const warmLight = new THREE.PointLight(0xffbd74, 4.4, 16, 2);
warmLight.position.set(-2.6, 1.8, 3.4);
scene.add(warmLight);

const rimLight = new THREE.PointLight(0x8b1236, 3.0, 18, 2);
rimLight.position.set(-4.4, -.4, 1.2);
scene.add(rimLight);

function radialTexture(){
  const c=document.createElement('canvas');
  c.width=128;c.height=128;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,1,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.10,'rgba(255,236,205,.96)');
  g.addColorStop(.28,'rgba(255,137,159,.84)');
  g.addColorStop(.58,'rgba(255,42,91,.22)');
  g.addColorStop(1,'rgba(255,0,70,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowTexture=radialTexture();

function gauss(v,c,w){
  const q=(v-c)/w;
  return Math.exp(-q*q);
}

function sculptHead(v, shell=1){
  const y=v.y;
  const front=Math.max(0,v.z);
  const lower=clamp((-y-.12)/.88,0,1);
  const crown=1+Math.max(0,y)*.07;

  v.x*=1.23*crown*(1-lower*.22);
  v.y*=1.64;
  v.z*=1.03*(1-lower*.12);

  if(front>0){
    const center=gauss(v.x,0,.34);
    v.z += shell*center*(
      .07*gauss(y,.62,.20) +
      .16*gauss(y,.34,.18) +
      .52*gauss(y,.08,.15) +
      .13*gauss(y,-.28,.10) +
      .24*gauss(y,-.66,.18)
    );
  }

  if(y<-.48){
    v.x*=.90;
    v.z-=(-y-.48)*.10;
  }

  v.z += Math.max(0,y)*.025;
  return v;
}

const SHELL_NODES=980;
const BRAIN_NODES=520;
const CORE_NODES=180;
const NODE_COUNT=SHELL_NODES+BRAIN_NODES+CORE_NODES;

const baseNodes=[];
const currentNodes=[];
const nodeRadials=[];
const nodeLayer=[];

function addNode(v,layer){
  baseNodes.push(v);
  currentNodes.push(v.clone());
  nodeRadials.push(v.clone().normalize());
  nodeLayer.push(layer);
}

for(let i=0;i<SHELL_NODES;i++){
  const y=1-(i/(SHELL_NODES-1))*2;
  const r=Math.sqrt(Math.max(0,1-y*y));
  const a=Math.PI*(3-Math.sqrt(5))*i;
  const ripple=Math.sin(a*2.3+y*3.7)*.022+Math.sin(a*.81)*.011;
  const v=new THREE.Vector3(
    Math.cos(a)*r*(1+ripple),
    y,
    Math.sin(a)*r*(1-ripple*.25)
  );
  sculptHead(v,1);
  v.multiplyScalar(random(.978,1.022));
  addNode(v,0);
}

for(let i=0;i<BRAIN_NODES;i++){
  const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize();
  const rad=Math.pow(Math.random(),.56)*.78+.08;
  v.multiplyScalar(rad);
  sculptHead(v,.35);
  v.y+=.22;
  v.x*=.93;
  v.z*=.90;
  addNode(v,1);
}

for(let i=0;i<CORE_NODES;i++){
  const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize();
  v.multiplyScalar(Math.pow(Math.random(),.54)*.42+.04);
  v.x*=.9;
  v.y*=1.12;
  v.z*=.82;
  v.y+=.28;
  addNode(v,2);
}

const nodePositions=new Float32Array(NODE_COUNT*3);
const nodeColors=new Float32Array(NODE_COUNT*3);

const shellColor=new THREE.Color(0xb42b50);
const shellWarm=new THREE.Color(0xe96a6d);
const brainColor=new THREE.Color(0xff8c7e);
const brainWarm=new THREE.Color(0xffc879);
const coreColor=new THREE.Color(0xffe1ae);

for(let i=0;i<NODE_COUNT;i++){
  const p=baseNodes[i];
  nodePositions[i*3]=p.x;
  nodePositions[i*3+1]=p.y;
  nodePositions[i*3+2]=p.z;

  let c=shellColor;
  if(nodeLayer[i]===0){
    const frontness=clamp((p.z+.35)/1.8,0,1);
    c=(frontness>.68 && Math.random()<.18)?shellWarm:shellColor;
  }else if(nodeLayer[i]===1){
    c=Math.random()<.36?brainWarm:brainColor;
  }else{
    c=coreColor;
  }
  nodeColors[i*3]=c.r;
  nodeColors[i*3+1]=c.g;
  nodeColors[i*3+2]=c.b;
}

const nodeGeo=new THREE.BufferGeometry();
nodeGeo.setAttribute('position',new THREE.BufferAttribute(nodePositions,3));
nodeGeo.setAttribute('color',new THREE.BufferAttribute(nodeColors,3));

const nodeMat=new THREE.PointsMaterial({
  size:.036,
  map:glowTexture,
  transparent:true,
  opacity:.86,
  vertexColors:true,
  blending:THREE.AdditiveBlending,
  depthWrite:false,
  sizeAttenuation:true
});
const nodeCloud=new THREE.Points(nodeGeo,nodeMat);
coreGroup.add(nodeCloud);

const haloMat=nodeMat.clone();
haloMat.size=.082;
haloMat.opacity=.09;
const haloCloud=new THREE.Points(nodeGeo,haloMat);
coreGroup.add(haloCloud);

const eyeSprite=new THREE.Sprite(new THREE.SpriteMaterial({
  map:glowTexture,
  color:0xffd491,
  transparent:true,
  opacity:.92,
  blending:THREE.AdditiveBlending,
  depthWrite:false
}));
eyeSprite.position.set(.16,.28,1.08);
eyeSprite.scale.set(.22,.22,1);
coreGroup.add(eyeSprite);

const eyeCore=new THREE.Sprite(new THREE.SpriteMaterial({
  map:glowTexture,
  color:0xffffff,
  transparent:true,
  opacity:.94,
  blending:THREE.AdditiveBlending,
  depthWrite:false
}));
eyeCore.position.copy(eyeSprite.position);
eyeCore.scale.set(.075,.075,1);
coreGroup.add(eyeCore);

const profilePts=[
  new THREE.Vector3(0,1.48,.62),
  new THREE.Vector3(0,1.12,.78),
  new THREE.Vector3(0,.70,.90),
  new THREE.Vector3(0,.34,.92),
  new THREE.Vector3(0,.08,1.36),
  new THREE.Vector3(0,-.10,.99),
  new THREE.Vector3(0,-.30,1.08),
  new THREE.Vector3(0,-.51,.96),
  new THREE.Vector3(0,-.76,.88),
  new THREE.Vector3(0,-1.03,.59),
  new THREE.Vector3(0,-1.22,.18)
];
const profileCurve=new THREE.CatmullRomCurve3(profilePts);
const profileGeo=new THREE.BufferGeometry().setFromPoints(profileCurve.getPoints(120));
const profileMat=new THREE.LineBasicMaterial({
  color:0xffc37a,
  transparent:true,
  opacity:.24,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const profileLine=new THREE.Line(profileGeo,profileMat);
profileLine.position.x=.012;
coreGroup.add(profileLine);

const jawPts=[
  new THREE.Vector3(-.03,-1.18,.12),
  new THREE.Vector3(-.40,-1.06,.02),
  new THREE.Vector3(-.72,-.82,-.06),
  new THREE.Vector3(-.89,-.48,-.15)
];
const jawGeo=new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(jawPts).getPoints(64));
const jawLine=new THREE.Line(jawGeo,new THREE.LineBasicMaterial({
  color:0xd44f64,transparent:true,opacity:.11,blending:THREE.AdditiveBlending,depthWrite:false
}));
coreGroup.add(jawLine);

const edges=[];
const edgeSeen=new Set();
function addEdge(a,b){
  if(a===b||a<0||b<0||a>=NODE_COUNT||b>=NODE_COUNT)return;
  const x=Math.min(a,b),y=Math.max(a,b),key=x+'_'+y;
  if(edgeSeen.has(key))return;
  edgeSeen.add(key);
  edges.push([x,y]);
}

function connectLocal(start,count,samples,links,maxDist){
  for(let i=start;i<start+count;i++){
    const picks=[];
    for(let s=0;s<samples;s++){
      const j=start+Math.floor(Math.random()*count);
      if(j===i)continue;
      const d=baseNodes[i].distanceToSquared(baseNodes[j]);
      if(d<=maxDist*maxDist)picks.push({j,d});
    }
    picks.sort((a,b)=>a.d-b.d);
    for(let k=0;k<Math.min(links,picks.length);k++)addEdge(i,picks[k].j);
  }
}
connectLocal(0,SHELL_NODES,30,2,.58);
connectLocal(SHELL_NODES,BRAIN_NODES,34,3,.54);
connectLocal(SHELL_NODES+BRAIN_NODES,CORE_NODES,30,4,.48);

for(let i=0;i<BRAIN_NODES;i+=3){
  addEdge(SHELL_NODES+i,(i*7)%SHELL_NODES);
}
for(let i=0;i<CORE_NODES;i+=2){
  addEdge(SHELL_NODES+BRAIN_NODES+i,SHELL_NODES+(i*5)%BRAIN_NODES);
}
for(let i=0;i<90;i++){
  addEdge(
    SHELL_NODES+Math.floor(Math.random()*BRAIN_NODES),
    Math.floor(Math.random()*SHELL_NODES)
  );
}

const edgePositions=new Float32Array(edges.length*6);
const edgeGeo=new THREE.BufferGeometry();
edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3));
const edgeMat=new THREE.LineBasicMaterial({
  color:0xc93458,
  transparent:true,
  opacity:.075,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const edgeLines=new THREE.LineSegments(edgeGeo,edgeMat);
coreGroup.add(edgeLines);

const warmEdges=[];
for(let i=0;i<150;i++){
  const a=SHELL_NODES+Math.floor(Math.random()*BRAIN_NODES);
  let b=SHELL_NODES+Math.floor(Math.random()*BRAIN_NODES);
  if(a===b)b=SHELL_NODES+((b-SHELL_NODES+13)%BRAIN_NODES);
  warmEdges.push([a,b]);
}
const warmPos=new Float32Array(warmEdges.length*6);
const warmGeo=new THREE.BufferGeometry();
warmGeo.setAttribute('position',new THREE.BufferAttribute(warmPos,3));
const warmMat=new THREE.LineBasicMaterial({
  color:0xffb56c,
  transparent:true,
  opacity:.08,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const warmLines=new THREE.LineSegments(warmGeo,warmMat);
coreGroup.add(warmLines);

const HOT_COUNT=52;
const hotIndices=[];
const hotPositions=new Float32Array(HOT_COUNT*3);
for(let i=0;i<HOT_COUNT;i++){
  const idx=SHELL_NODES+Math.floor(Math.random()*(BRAIN_NODES+CORE_NODES));
  hotIndices.push(idx);
  const p=baseNodes[idx];
  hotPositions[i*3]=p.x;hotPositions[i*3+1]=p.y;hotPositions[i*3+2]=p.z;
}
const hotGeo=new THREE.BufferGeometry();
hotGeo.setAttribute('position',new THREE.BufferAttribute(hotPositions,3));
const hotMat=new THREE.PointsMaterial({
  size:.085,
  map:glowTexture,
  color:0xffc176,
  transparent:true,
  opacity:.66,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const hotCloud=new THREE.Points(hotGeo,hotMat);
coreGroup.add(hotCloud);

const arcGroup=new THREE.Group();
coreGroup.add(arcGroup);
for(let i=0;i<9;i++){
  const a=baseNodes[SHELL_NODES+Math.floor(Math.random()*BRAIN_NODES)].clone();
  const b=baseNodes[SHELL_NODES+Math.floor(Math.random()*BRAIN_NODES)].clone();
  const mid=a.clone().add(b).multiplyScalar(.5);
  mid.z+=random(.42,.92);
  mid.y+=random(-.18,.32);
  const curve=new THREE.CatmullRomCurve3([a,mid,b]);
  const line=new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(54)),
    new THREE.LineBasicMaterial({
      color:i%3===0?0xffbd73:0xa92a4d,
      transparent:true,
      opacity:i%3===0?.10:.045,
      blending:THREE.AdditiveBlending,
      depthWrite:false
    })
  );
  arcGroup.add(line);
}

const DUST_COUNT=330;
const dustPos=new Float32Array(DUST_COUNT*3);
for(let i=0;i<DUST_COUNT;i++){
  const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(2.2,3.3));
  v.y*=.88;
  dustPos[i*3]=v.x;dustPos[i*3+1]=v.y;dustPos[i*3+2]=v.z;
}
const dustGeo=new THREE.BufferGeometry();
dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dustMat=new THREE.PointsMaterial({
  size:.026,
  map:glowTexture,
  color:0x9c2344,
  transparent:true,
  opacity:.18,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const dustCloud=new THREE.Points(dustGeo,dustMat);
coreGroup.add(dustCloud);

const signalGeom=new THREE.SphereGeometry(.026,7,7);
const signalMat=new THREE.MeshBasicMaterial({
  color:0xffd9a6,
  transparent:true,
  opacity:.95,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const neuralSignals=[];
const marketImpulses=[];

function spawnNeuralSignal(edgeIndex,energy=1){
  if(neuralSignals.length>110||!edges.length)return;
  const mesh=new THREE.Mesh(signalGeom,signalMat.clone());
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

const impulseGeom=new THREE.SphereGeometry(.043,8,8);
function spawnMarketImpulse(magnitude,sign){
  const targetIndex=SHELL_NODES+Math.floor(random(0,BRAIN_NODES+CORE_NODES));
  const end=currentNodes[targetIndex].clone();
  const dir=end.clone().normalize();
  const tangent=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(.28,.86));
  const start=dir.multiplyScalar(random(4.4,5.0)).add(tangent);
  const mat=new THREE.MeshBasicMaterial({
    color:sign>=0?0xffcf91:0xff355f,
    transparent:true,
    opacity:.88,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  const mesh=new THREE.Mesh(impulseGeom,mat);
  mesh.position.copy(start);
  coreGroup.add(mesh);
  marketImpulses.push({
    mesh,start,end,targetIndex,t:0,
    speed:random(.025,.041),
    energy:clamp(magnitude*10,.65,2.0)
  });
}

let neuralTension=.27;
let burstEnergy=.06;

function fireNeuralBurst(energy){
  burstEnergy=Math.max(burstEnergy,energy);
  neuralTension=clamp(neuralTension+energy*.082,0,1);
  const count=Math.round(7+energy*18);
  for(let i=0;i<count;i++){
    spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
  }
}

function resizeCore(){
  const r=coreViewport.getBoundingClientRect();
  const w=Math.max(10,r.width),h=Math.max(10,r.height);
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',resizeCore);
resizeCore();
