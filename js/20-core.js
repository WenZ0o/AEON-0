// ---------- THREE.JS HIPPOPOTAMUS BRAIN CORE V9 ----------
const coreViewport = $('coreViewport');

if (typeof THREE === 'undefined') {
  coreViewport.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#ff7893;font:12px monospace">THREE.JS COULD NOT LOAD</div>';
  $('coreState').textContent = 'RENDERER OFFLINE';
  throw new Error('Three.js failed to load');
}

const LOGICAL_NEURAL_UNITS = 166500.54;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020102, .016);

const camera = new THREE.PerspectiveCamera(39, 1, .1, 100);
camera.position.set(0, .03, 7.9);

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
coreViewport.prepend(renderer.domElement);

const coreGroup = new THREE.Group();
coreGroup.rotation.set(.22, -.36, -.03);
scene.add(coreGroup);

scene.add(new THREE.AmbientLight(0x3b0a1c, .46));
const keyLight = new THREE.PointLight(0xff5b76, 5.4, 20, 2);
keyLight.position.set(-3.1, 2.2, 4.8);
scene.add(keyLight);
const warmLight = new THREE.PointLight(0xffc37a, 4.9, 18, 2);
warmLight.position.set(2.7, 1.8, 4.1);
scene.add(warmLight);
const rimLight = new THREE.PointLight(0x8d1737, 3.3, 20, 2);
rimLight.position.set(3.8, -.7, 1.5);
scene.add(rimLight);

function radialTexture(){
  const c=document.createElement('canvas');
  c.width=128;c.height=128;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,1,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.13,'rgba(255,239,207,.98)');
  g.addColorStop(.34,'rgba(255,126,147,.84)');
  g.addColorStop(.62,'rgba(255,42,91,.22)');
  g.addColorStop(1,'rgba(255,0,70,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowTexture=radialTexture();

const HEMI_SURFACE=900;
const INNER_NODES=520;
const CEREBELLUM_NODES=260;
const NODE_COUNT=HEMI_SURFACE*2+INNER_NODES+CEREBELLUM_NODES;

const baseNodes=[],currentNodes=[],nodeRadials=[],nodeLayer=[];

function addNode(v,layer){
  baseNodes.push(v);
  currentNodes.push(v.clone());
  nodeRadials.push(v.clone().normalize());
  nodeLayer.push(layer);
}

function brainPoint(i,count,side,innerScale=1){
  const t=(i+.5)/count;
  const y=1-2*t;
  const radius=Math.sqrt(Math.max(0,1-y*y));
  const phi=i*2.399963229728653;

  let x=Math.cos(phi)*radius;
  let z=Math.sin(phi)*radius;

  // Hippopotamus-brain-inspired broad cerebral hemisphere.
  x*=.94;
  let yy=y*.76;
  z*=1.14;

  // Gyri-like relief: many small folds, not a smooth sphere.
  const folds=
    Math.sin(phi*5.4+y*4.8)*.050 +
    Math.sin(phi*9.2-y*5.1)*.026 +
    Math.cos(phi*13.0+y*2.4)*.015;
  const radial=1+folds;

  x*=radial;
  yy*=1+Math.sin(phi*6.0+y*3.0)*.020;
  z*=1+Math.cos(phi*5.2-y*4.3)*.025;

  // Shift hemispheres apart so a real longitudinal fissure reads clearly.
  x=x*.93 + side*.78;

  // Crown and temporal lobes.
  yy+=Math.max(0,yy)*.12;
  const temporal=Math.exp(-Math.pow((Math.abs(x)-1.03)/.38,2))*Math.exp(-Math.pow((yy+.16)/.46,2));
  z+=temporal*.16;

  // Frontal bulge and posterior taper.
  z+=Math.exp(-Math.pow((z-.20)/1.08,2))*.09;
  z-=Math.exp(-Math.pow((z+1.05)/.55,2))*.13;

  // Medial indentation beside the central fissure.
  const medial=Math.exp(-Math.pow((Math.abs(x)-.34)/.20,2))*Math.exp(-Math.pow((yy-.10)/.90,2));
  x+=side*medial*.13;
  z-=medial*.06;

  // Lower brain narrows slightly.
  const lower=clamp((-yy-.26)/.58,0,1);
  x*=1-lower*.12;
  z*=1-lower*.08;

  return new THREE.Vector3(x,yy,z).multiplyScalar(innerScale);
}

for(let side of [-1,1]){
  for(let i=0;i<HEMI_SURFACE;i++){
    addNode(brainPoint(i,HEMI_SURFACE,side,random(.985,1.015)),0);
  }
}

for(let i=0;i<INNER_NODES;i++){
  const side=Math.random()<.5?-1:1;
  const surface=brainPoint(i,INNER_NODES,side,1);
  surface.multiplyScalar(Math.pow(Math.random(),.58)*.72+.12);
  surface.x+=side*.16;
  addNode(surface,1);
}

for(let i=0;i<CEREBELLUM_NODES;i++){
  const a=Math.random()*Math.PI*2;
  const b=(Math.random()-.5)*Math.PI;
  const r=Math.pow(Math.random(),.56);
  let x=Math.cos(a)*Math.cos(b)*.72*r;
  let y=Math.sin(b)*.43*r-.86;
  let z=Math.sin(a)*Math.cos(b)*.48*r-.82;
  x*=1.16;
  const folds=Math.sin(a*9.0+b*5.0)*.055;
  x*=1+folds;
  z*=1+Math.cos(a*8.0-b*4.0)*.045;
  addNode(new THREE.Vector3(x,y,z),2);
}

const nodePositions=new Float32Array(NODE_COUNT*3);
const nodeColors=new Float32Array(NODE_COUNT*3);
const cOuter=new THREE.Color(0xd74966);
const cWarm=new THREE.Color(0xff9179);
const cInner=new THREE.Color(0xffad75);
const cCere=new THREE.Color(0xf28b70);

for(let i=0;i<NODE_COUNT;i++){
  const p=baseNodes[i];
  nodePositions[i*3]=p.x;nodePositions[i*3+1]=p.y;nodePositions[i*3+2]=p.z;
  let c=nodeLayer[i]===1?cInner:nodeLayer[i]===2?cCere:(Math.random()<.16?cWarm:cOuter);
  nodeColors[i*3]=c.r;nodeColors[i*3+1]=c.g;nodeColors[i*3+2]=c.b;
}

const nodeGeo=new THREE.BufferGeometry();
nodeGeo.setAttribute('position',new THREE.BufferAttribute(nodePositions,3));
nodeGeo.setAttribute('color',new THREE.BufferAttribute(nodeColors,3));

const nodeMat=new THREE.PointsMaterial({
  size:.044,map:glowTexture,transparent:true,opacity:.94,vertexColors:true,
  blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
});
const nodeCloud=new THREE.Points(nodeGeo,nodeMat);
coreGroup.add(nodeCloud);

const haloMat=nodeMat.clone();
haloMat.size=.095;haloMat.opacity=.065;
const haloCloud=new THREE.Points(nodeGeo,haloMat);
coreGroup.add(haloCloud);

// Dense but local neural graph keeps the brain readable instead of becoming a ball of lines.
const edges=[],edgeSeen=new Set();
function addEdge(a,b){
  if(a===b||a<0||b<0||a>=NODE_COUNT||b>=NODE_COUNT)return;
  const x=Math.min(a,b),y=Math.max(a,b),key=x+'_'+y;
  if(edgeSeen.has(key))return;
  edgeSeen.add(key);edges.push([x,y]);
}
function connectLocal(start,count,samples,links,maxDist){
  for(let i=start;i<start+count;i++){
    const picks=[];
    for(let s=0;s<samples;s++){
      const j=start+Math.floor(Math.random()*count);
      if(j===i)continue;
      const d=baseNodes[i].distanceToSquared(baseNodes[j]);
      if(d<maxDist*maxDist)picks.push({j,d});
    }
    picks.sort((a,b)=>a.d-b.d);
    for(let k=0;k<Math.min(links,picks.length);k++)addEdge(i,picks[k].j);
  }
}
connectLocal(0,HEMI_SURFACE,24,2,.40);
connectLocal(HEMI_SURFACE,HEMI_SURFACE,24,2,.40);
connectLocal(HEMI_SURFACE*2,INNER_NODES,30,3,.43);
connectLocal(HEMI_SURFACE*2+INNER_NODES,CEREBELLUM_NODES,26,3,.34);

// Cortex -> inner network.
for(let i=0;i<INNER_NODES;i+=2){
  const inner=HEMI_SURFACE*2+i;
  const side=baseNodes[inner].x<0?0:HEMI_SURFACE;
  addEdge(inner,side+(i*7)%HEMI_SURFACE);
}
// Corpus-callosum-like cross hemisphere fibers.
for(let i=0;i<105;i++){
  const a=Math.floor(Math.random()*HEMI_SURFACE);
  let best=HEMI_SURFACE+Math.floor(Math.random()*HEMI_SURFACE);
  for(let k=0;k<12;k++){
    const b=HEMI_SURFACE+Math.floor(Math.random()*HEMI_SURFACE);
    if(Math.abs(baseNodes[a].y-baseNodes[b].y)<Math.abs(baseNodes[a].y-baseNodes[best].y))best=b;
  }
  addEdge(a,best);
}
// Cerebellar links.
for(let i=0;i<95;i++){
  addEdge(
    HEMI_SURFACE*2+INNER_NODES+Math.floor(Math.random()*CEREBELLUM_NODES),
    HEMI_SURFACE*2+Math.floor(Math.random()*INNER_NODES)
  );
}

const edgePositions=new Float32Array(edges.length*6);
const edgeGeo=new THREE.BufferGeometry();
edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3));
const edgeMat=new THREE.LineBasicMaterial({
  color:0xcf4661,transparent:true,opacity:.13,
  blending:THREE.AdditiveBlending,depthWrite:false
});
const edgeLines=new THREE.LineSegments(edgeGeo,edgeMat);
coreGroup.add(edgeLines);

const warmEdges=[];
for(let i=0;i<260;i++){
  const a=HEMI_SURFACE*2+Math.floor(Math.random()*INNER_NODES);
  const b=HEMI_SURFACE*2+Math.floor(Math.random()*INNER_NODES);
  if(a!==b)warmEdges.push([a,b]);
}
const warmPos=new Float32Array(warmEdges.length*6);
const warmGeo=new THREE.BufferGeometry();
warmGeo.setAttribute('position',new THREE.BufferAttribute(warmPos,3));
const warmMat=new THREE.LineBasicMaterial({
  color:0xffc47b,transparent:true,opacity:.11,
  blending:THREE.AdditiveBlending,depthWrite:false
});
const warmLines=new THREE.LineSegments(warmGeo,warmMat);
coreGroup.add(warmLines);

const HOT_COUNT=86;
const hotIndices=[],hotPositions=new Float32Array(HOT_COUNT*3);
for(let i=0;i<HOT_COUNT;i++){
  const idx=HEMI_SURFACE*2+Math.floor(Math.random()*(INNER_NODES+CEREBELLUM_NODES));
  hotIndices.push(idx);
  const p=baseNodes[idx];
  hotPositions[i*3]=p.x;hotPositions[i*3+1]=p.y;hotPositions[i*3+2]=p.z;
}
const hotGeo=new THREE.BufferGeometry();
hotGeo.setAttribute('position',new THREE.BufferAttribute(hotPositions,3));
const hotMat=new THREE.PointsMaterial({
  size:.088,map:glowTexture,color:0xffcf83,transparent:true,opacity:.70,
  blending:THREE.AdditiveBlending,depthWrite:false
});
const hotCloud=new THREE.Points(hotGeo,hotMat);
coreGroup.add(hotCloud);

// Dark central fissure: two subtle edge lines, never white.
function fissureCurve(side){
  const pts=[];
  for(let i=0;i<=45;i++){
    const t=i/45;
    pts.push(new THREE.Vector3(side*.31,1.00-t*1.67,.42+Math.sin(t*Math.PI)*.16));
  }
  return new THREE.CatmullRomCurve3(pts);
}
const fissureGroup=new THREE.Group();
for(let side of [-1,1]){
  fissureGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(fissureCurve(side).getPoints(70)),
    new THREE.LineBasicMaterial({color:0x7f1a35,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false})
  ));
}
coreGroup.add(fissureGroup);

// Cerebellum lower contour.
const cereOutline=new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.80,-.66,-.75),
    new THREE.Vector3(-.42,-.98,-.96),
    new THREE.Vector3(0,-1.05,-1.00),
    new THREE.Vector3(.42,-.98,-.96),
    new THREE.Vector3(.80,-.66,-.75)
  ]).getPoints(64)),
  new THREE.LineBasicMaterial({color:0xa92f49,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false})
);
coreGroup.add(cereOutline);

// Surface fold accents: short curved tracts on each hemisphere.
const foldGroup=new THREE.Group();
for(let side of [-1,1]){
  for(let j=0;j<7;j++){
    const y=.72-j*.23+random(-.04,.04);
    const pts=[];
    for(let k=0;k<7;k++){
      const q=k/6;
      const x=side*(.50+q*.82);
      const z=.52+Math.sin(q*Math.PI)*.42+Math.sin(q*Math.PI*3+j)*.07;
      pts.push(new THREE.Vector3(x,y+Math.sin(q*Math.PI*2+j)*.06,z));
    }
    foldGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(pts).getPoints(36)),
      new THREE.LineBasicMaterial({color:j%3===0?0xff8a72:0x8e2440,transparent:true,opacity:j%3===0?.09:.07,blending:THREE.AdditiveBlending,depthWrite:false})
    ));
  }
}
coreGroup.add(foldGroup);

const dustCount=200,dustPos=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){
  const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(2.3,3.1));
  v.y*=.80;
  dustPos[i*3]=v.x;dustPos[i*3+1]=v.y;dustPos[i*3+2]=v.z;
}
const dustGeo=new THREE.BufferGeometry();
dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dustMat=new THREE.PointsMaterial({
  size:.022,map:glowTexture,color:0x8c1e3b,transparent:true,opacity:.10,
  blending:THREE.AdditiveBlending,depthWrite:false
});
const dustCloud=new THREE.Points(dustGeo,dustMat);
coreGroup.add(dustCloud);

const signalGeom=new THREE.SphereGeometry(.026,7,7);
const signalMat=new THREE.MeshBasicMaterial({
  color:0xffd9a6,transparent:true,opacity:.95,
  blending:THREE.AdditiveBlending,depthWrite:false
});
const neuralSignals=[],marketImpulses=[];

function spawnNeuralSignal(edgeIndex,energy=1){
  if(neuralSignals.length>145||!edges.length)return;
  const mesh=new THREE.Mesh(signalGeom,signalMat.clone());
  mesh.material.color.set(energy>1.2?0xffffff:(energy>.75?0xffcf91:0xff6c83));
  mesh.scale.setScalar(.60+energy*.24);
  coreGroup.add(mesh);
  neuralSignals.push({mesh,edgeIndex:edgeIndex%edges.length,t:0,speed:random(.012,.026)*(1+energy*.36),reverse:Math.random()>.5});
}

const impulseGeom=new THREE.SphereGeometry(.043,8,8);
function spawnMarketImpulse(magnitude,sign){
  const targetIndex=HEMI_SURFACE*2+Math.floor(random(0,INNER_NODES+CEREBELLUM_NODES));
  const end=currentNodes[targetIndex].clone();
  const dir=end.clone().normalize();
  const tangent=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(.28,.82));
  const start=dir.multiplyScalar(random(4.3,4.9)).add(tangent);
  const mat=new THREE.MeshBasicMaterial({
    color:sign>=0?0xffcf91:0xff355f,transparent:true,opacity:.88,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
  const mesh=new THREE.Mesh(impulseGeom,mat);
  mesh.position.copy(start);
  coreGroup.add(mesh);
  marketImpulses.push({mesh,start,end,targetIndex,t:0,speed:random(.025,.041),energy:clamp(magnitude*10,.65,2)});
}

let neuralTension=.34;
let burstEnergy=.07;
function fireNeuralBurst(energy){
  burstEnergy=Math.max(burstEnergy,energy);
  neuralTension=clamp(neuralTension+energy*.082,0,1);
  const count=Math.round(8+energy*18);
  for(let i=0;i<count;i++)spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
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
