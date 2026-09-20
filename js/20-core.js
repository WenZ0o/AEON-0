// ---------- THREE.JS NEURAL PORTRAIT CORE V5 ----------
const coreViewport = $('coreViewport');

if (typeof THREE === 'undefined') {
  coreViewport.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#ff7893;font:12px/1.7 monospace;letter-spacing:.08em">THREE.JS COULD NOT LOAD.<br>CHECK YOUR INTERNET CONNECTION OR OPEN THIS FILE IN CHROME/EDGE.</div>';
  $('coreState').textContent = 'RENDERER OFFLINE';
  throw new Error('Three.js failed to load');
}

const LOGICAL_NEURAL_UNITS = 166500.54;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020102,.020);

const camera = new THREE.PerspectiveCamera(39,1,.1,100);
camera.position.set(0,0,7.4);

const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.22;
coreViewport.prepend(renderer.domElement);

const coreGroup=new THREE.Group();
coreGroup.rotation.set(.01,-.10,0);
scene.add(coreGroup);

scene.add(new THREE.AmbientLight(0x3b0b1c,.42));
const keyLight=new THREE.PointLight(0xff6a74,5.4,18,2); keyLight.position.set(-2.6,2.0,4.5); scene.add(keyLight);
const warmLight=new THREE.PointLight(0xffbd72,5.0,15,2); warmLight.position.set(1.6,1.9,3.6); scene.add(warmLight);
const rimLight=new THREE.PointLight(0x8d1738,3.6,18,2); rimLight.position.set(3.4,-.5,1.8); scene.add(rimLight);

function radialTexture(){
  const c=document.createElement('canvas'); c.width=128;c.height=128;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,1,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.12,'rgba(255,232,194,.98)');
  g.addColorStop(.32,'rgba(255,118,137,.82)');
  g.addColorStop(.62,'rgba(255,42,91,.22)');
  g.addColorStop(1,'rgba(255,0,70,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowTexture=radialTexture();

const outline2D=[
  [-.10,1.70],[-.55,1.58],[-.88,1.34],[-1.05,1.00],[-1.08,.70],
  [-.98,.48],[-1.05,.28],[-1.34,.06],[-1.03,-.02],[-.98,-.20],
  [-1.10,-.31],[-.93,-.36],[-.88,-.56],[-.70,-.78],[-.42,-.98],
  [-.18,-1.20],[.18,-1.28],[.52,-1.17],[.72,-.94],[.92,-.66],
  [1.08,-.28],[1.14,.16],[1.12,.58],[1.00,.98],[.78,1.34],[.46,1.58]
];

function pointInPolygon(x,y,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    const hit=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi+1e-9)+xi);
    if(hit)inside=!inside;
  }
  return inside;
}

const FACE_NODES=1180;
const BRAIN_NODES=420;
const CORE_NODES=140;
const NODE_COUNT=FACE_NODES+BRAIN_NODES+CORE_NODES;

const baseNodes=[],currentNodes=[],nodeRadials=[],nodeLayer=[];

function addNode(v,layer){
  baseNodes.push(v);
  currentNodes.push(v.clone());
  nodeRadials.push(v.clone().normalize());
  nodeLayer.push(layer);
}

let guard=0;
while(baseNodes.length<FACE_NODES && guard++<200000){
  const x=random(-1.30,1.14), y=random(-1.25,1.70);
  if(!pointInPolygon(x,y,outline2D))continue;
  const centerBias=1-Math.min(1,Math.sqrt((x*.72)*(x*.72)+(y*.53)*(y*.53))/1.55);
  const z=normalRandom()*(.10+.24*centerBias);
  addNode(new THREE.Vector3(x,y,z),0);
}

for(let i=0;i<BRAIN_NODES;i++){
  const a=Math.random()*Math.PI*2;
  const r=Math.sqrt(Math.random());
  const x=.10+Math.cos(a)*r*.78;
  const y=.58+Math.sin(a)*r*.73;
  if(pointInPolygon(x,y,outline2D)){
    addNode(new THREE.Vector3(x,y,normalRandom()*.34),1);
  }else{
    i--;
  }
}

for(let i=0;i<CORE_NODES;i++){
  const a=Math.random()*Math.PI*2;
  const r=Math.pow(Math.random(),.55);
  addNode(new THREE.Vector3(.06+Math.cos(a)*r*.42,.55+Math.sin(a)*r*.46,normalRandom()*.24),2);
}

const nodePositions=new Float32Array(NODE_COUNT*3);
const nodeColors=new Float32Array(NODE_COUNT*3);
const cFace=new THREE.Color(0xd13d5f);
const cFaceWarm=new THREE.Color(0xf07b6d);
const cBrain=new THREE.Color(0xff9d72);
const cCore=new THREE.Color(0xffddb0);

for(let i=0;i<NODE_COUNT;i++){
  const p=baseNodes[i];
  nodePositions[i*3]=p.x;nodePositions[i*3+1]=p.y;nodePositions[i*3+2]=p.z;
  let c=nodeLayer[i]===2?cCore:nodeLayer[i]===1?cBrain:(Math.random()<.16?cFaceWarm:cFace);
  nodeColors[i*3]=c.r;nodeColors[i*3+1]=c.g;nodeColors[i*3+2]=c.b;
}

const nodeGeo=new THREE.BufferGeometry();
nodeGeo.setAttribute('position',new THREE.BufferAttribute(nodePositions,3));
nodeGeo.setAttribute('color',new THREE.BufferAttribute(nodeColors,3));

const nodeMat=new THREE.PointsMaterial({
  size:.047,map:glowTexture,transparent:true,opacity:.94,vertexColors:true,
  blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
});
const nodeCloud=new THREE.Points(nodeGeo,nodeMat);coreGroup.add(nodeCloud);

const haloMat=nodeMat.clone();haloMat.size=.095;haloMat.opacity=.085;
const haloCloud=new THREE.Points(nodeGeo,haloMat);coreGroup.add(haloCloud);

const edges=[],edgeSeen=new Set();
function addEdge(a,b){
  if(a===b||a<0||b<0||a>=NODE_COUNT||b>=NODE_COUNT)return;
  const x=Math.min(a,b),y=Math.max(a,b),k=x+'_'+y;
  if(edgeSeen.has(k))return;edgeSeen.add(k);edges.push([x,y]);
}
function connectLocal(start,count,samples,links,maxDist){
  for(let i=start;i<start+count;i++){
    const picks=[];
    for(let s=0;s<samples;s++){
      const j=start+Math.floor(Math.random()*count); if(i===j)continue;
      const d=baseNodes[i].distanceToSquared(baseNodes[j]);
      if(d<maxDist*maxDist)picks.push({j,d});
    }
    picks.sort((a,b)=>a.d-b.d);
    for(let k=0;k<Math.min(links,picks.length);k++)addEdge(i,picks[k].j);
  }
}
connectLocal(0,FACE_NODES,28,2,.27);
connectLocal(FACE_NODES,BRAIN_NODES,32,3,.30);
connectLocal(FACE_NODES+BRAIN_NODES,CORE_NODES,26,4,.27);
for(let i=0;i<BRAIN_NODES;i+=3)addEdge(FACE_NODES+i,(i*17)%FACE_NODES);
for(let i=0;i<CORE_NODES;i+=2)addEdge(FACE_NODES+BRAIN_NODES+i,FACE_NODES+(i*5)%BRAIN_NODES);
for(let i=0;i<120;i++)addEdge(FACE_NODES+Math.floor(Math.random()*BRAIN_NODES),Math.floor(Math.random()*FACE_NODES));

const edgePositions=new Float32Array(edges.length*6);
const edgeGeo=new THREE.BufferGeometry();
edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3));
const edgeMat=new THREE.LineBasicMaterial({
  color:0xd94a62,transparent:true,opacity:.17,blending:THREE.AdditiveBlending,depthWrite:false
});
const edgeLines=new THREE.LineSegments(edgeGeo,edgeMat);coreGroup.add(edgeLines);

const warmEdges=[];
for(let i=0;i<190;i++){
  const a=FACE_NODES+Math.floor(Math.random()*(BRAIN_NODES+CORE_NODES));
  const b=FACE_NODES+Math.floor(Math.random()*(BRAIN_NODES+CORE_NODES));
  if(a!==b)warmEdges.push([a,b]);
}
const warmPos=new Float32Array(warmEdges.length*6);
const warmGeo=new THREE.BufferGeometry();
warmGeo.setAttribute('position',new THREE.BufferAttribute(warmPos,3));
const warmMat=new THREE.LineBasicMaterial({
  color:0xffbd72,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false
});
const warmLines=new THREE.LineSegments(warmGeo,warmMat);coreGroup.add(warmLines);

function makeLine(points,color,opacity){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2]||.18)));
  const geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(100));
  const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
  const line=new THREE.Line(geo,mat);coreGroup.add(line);return line;
}

const profileLine=makeLine([
  [-.12,1.68,.12],[-.62,1.50,.15],[-.98,1.10,.18],[-1.02,.66,.19],
  [-.97,.44,.20],[-1.31,.07,.22],[-1.02,-.02,.21],[-.96,-.20,.20],
  [-1.08,-.31,.19],[-.91,-.38,.18],[-.86,-.58,.16],[-.67,-.79,.14],
  [-.40,-.98,.12],[-.18,-1.18,.10]
],0xffc884,.40);

const browLine=makeLine([[-.86,.53,.24],[-.65,.59,.27],[-.42,.55,.27]],0xffb66c,.20);
const eyeLine=makeLine([[-.76,.42,.28],[-.62,.38,.31],[-.48,.41,.29]],0xffd69a,.28);
const lipLine=makeLine([[-1.01,-.18,.23],[-.90,-.20,.24],[-.81,-.18,.22]],0xff7b83,.18);
const jawLine=makeLine([[-.84,-.58,.15],[-.55,-.84,.12],[-.18,-1.10,.10],[.30,-1.17,.06]],0xd94d61,.16);

const eyeSprite=new THREE.Sprite(new THREE.SpriteMaterial({
  map:glowTexture,color:0xffd183,transparent:true,opacity:.90,blending:THREE.AdditiveBlending,depthWrite:false
}));
eyeSprite.position.set(-.61,.40,.34);eyeSprite.scale.set(.16,.16,1);coreGroup.add(eyeSprite);

const eyeCore=new THREE.Sprite(new THREE.SpriteMaterial({
  map:glowTexture,color:0xffffff,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false
}));
eyeCore.position.copy(eyeSprite.position);eyeCore.scale.set(.050,.050,1);coreGroup.add(eyeCore);

const HOT_COUNT=64,hotIndices=[],hotPositions=new Float32Array(HOT_COUNT*3);
for(let i=0;i<HOT_COUNT;i++){
  const idx=FACE_NODES+Math.floor(Math.random()*(BRAIN_NODES+CORE_NODES));
  hotIndices.push(idx);
  const p=baseNodes[idx];
  hotPositions[i*3]=p.x;hotPositions[i*3+1]=p.y;hotPositions[i*3+2]=p.z;
}
const hotGeo=new THREE.BufferGeometry();hotGeo.setAttribute('position',new THREE.BufferAttribute(hotPositions,3));
const hotMat=new THREE.PointsMaterial({
  size:.090,map:glowTexture,color:0xffc678,transparent:true,opacity:.70,
  blending:THREE.AdditiveBlending,depthWrite:false
});
const hotCloud=new THREE.Points(hotGeo,hotMat);coreGroup.add(hotCloud);

const arcGroup=new THREE.Group();coreGroup.add(arcGroup);
for(let i=0;i<8;i++){
  const a=baseNodes[FACE_NODES+Math.floor(Math.random()*BRAIN_NODES)].clone();
  const b=baseNodes[FACE_NODES+Math.floor(Math.random()*BRAIN_NODES)].clone();
  const mid=a.clone().add(b).multiplyScalar(.5);mid.z+=random(.45,.95);mid.y+=random(-.12,.28);
  const line=new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3([a,mid,b]).getPoints(56)),
    new THREE.LineBasicMaterial({color:i%3===0?0xffc777:0xaa2b4b,transparent:true,opacity:i%3===0?.14:.06,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  arcGroup.add(line);
}

const signalGeom=new THREE.SphereGeometry(.026,7,7);
const signalMat=new THREE.MeshBasicMaterial({color:0xffd9a6,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
const neuralSignals=[],marketImpulses=[];

function spawnNeuralSignal(edgeIndex,energy=1){
  if(neuralSignals.length>120||!edges.length)return;
  const mesh=new THREE.Mesh(signalGeom,signalMat.clone());
  mesh.material.color.set(energy>1.2?0xffffff:(energy>.75?0xffcf91:0xff6c83));
  mesh.scale.setScalar(.62+energy*.25);coreGroup.add(mesh);
  neuralSignals.push({mesh,edgeIndex:edgeIndex%edges.length,t:0,speed:random(.012,.026)*(1+energy*.36),reverse:Math.random()>.5});
}

const impulseGeom=new THREE.SphereGeometry(.043,8,8);
function spawnMarketImpulse(magnitude,sign){
  const targetIndex=FACE_NODES+Math.floor(random(0,BRAIN_NODES+CORE_NODES));
  const end=currentNodes[targetIndex].clone();
  const dir=end.clone().normalize();
  const tangent=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(.28,.86));
  const start=dir.multiplyScalar(random(4.2,4.9)).add(tangent);
  const mat=new THREE.MeshBasicMaterial({color:sign>=0?0xffcf91:0xff355f,transparent:true,opacity:.88,blending:THREE.AdditiveBlending,depthWrite:false});
  const mesh=new THREE.Mesh(impulseGeom,mat);mesh.position.copy(start);coreGroup.add(mesh);
  marketImpulses.push({mesh,start,end,targetIndex,t:0,speed:random(.025,.041),energy:clamp(magnitude*10,.65,2.0)});
}

let neuralTension=.34,burstEnergy=.07;
function fireNeuralBurst(energy){
  burstEnergy=Math.max(burstEnergy,energy);
  neuralTension=clamp(neuralTension+energy*.082,0,1);
  const count=Math.round(8+energy*19);
  for(let i=0;i<count;i++)spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
}

function resizeCore(){
  const r=coreViewport.getBoundingClientRect();
  const w=Math.max(10,r.width),h=Math.max(10,r.height);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resizeCore);
resizeCore();
