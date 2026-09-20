// ---------- THREE.JS CORTICAL INTELLIGENCE CORE V3 ----------
  const coreViewport = $('coreViewport');
  if (typeof THREE === 'undefined') {
    coreViewport.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#ff7893;font:12px/1.7 monospace;letter-spacing:.08em">THREE.JS COULD NOT LOAD.<br>CHECK YOUR INTERNET CONNECTION OR OPEN THIS FILE IN CHROME/EDGE.</div>';
    $('coreState').textContent = 'RENDERER OFFLINE';
    $('coreState').style.color = '#ff5f75';
    throw new Error('Three.js failed to load from CDN');
  }

  const LOGICAL_NEURAL_UNITS = 166500.54;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030203, .037);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, -.02, 7.45);

  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  coreViewport.prepend(renderer.domElement);

  const coreGroup = new THREE.Group();
  coreGroup.rotation.y = -.30;
  scene.add(coreGroup);

  const ambient = new THREE.AmbientLight(0x64172d, .42);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff3d67, 9.2, 22, 2);
  keyLight.position.set(2.8, 2.8, 4.2);
  scene.add(keyLight);

  const warmLight = new THREE.PointLight(0xffc27a, 5.2, 15, 2);
  warmLight.position.set(-2.4, 1.6, 3.0);
  scene.add(warmLight);

  const rimLight = new THREE.PointLight(0x8d1035, 5.4, 18, 2);
  rimLight.position.set(-4.2, -.6, 1.1);
  scene.add(rimLight);

  const coreLight = new THREE.PointLight(0xffe0b0, 4.0, 8, 2);
  coreLight.position.set(.15,.15,.4);
  scene.add(coreLight);

  function radialTexture(){
    const c=document.createElement('canvas'); c.width=128; c.height=128;
    const x=c.getContext('2d');
    const g=x.createRadialGradient(64,64,1,64,64,64);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(.10,'rgba(255,239,213,1)');
    g.addColorStop(.30,'rgba(255,113,143,.92)');
    g.addColorStop(.58,'rgba(255,38,86,.30)');
    g.addColorStop(1,'rgba(255,0,70,0)');
    x.fillStyle=g; x.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(c);
  }
  const glowTexture=radialTexture();

  const OUTER_NODES = 920;
  const INNER_NODES = 650;
  const NUCLEUS_NODES = 230;
  const NODE_COUNT = OUTER_NODES + INNER_NODES + NUCLEUS_NODES;
  const baseNodes=[];
  const currentNodes=[];
  const nodeRadials=[];
  const nodeLayer=[];

  function cranialWarp(v, shell=1){
    const ny=clamp(v.y,-1,1);
    const lower=clamp((-ny-.18)/.82,0,1);
    const crown=1 + Math.max(0,ny)*.10;
    const temple=1 - Math.exp(-Math.pow((ny-.02)*3.2,2))*.055;
    v.x*=1.60*crown*temple*(1-lower*.28);
    v.y*=2.08;
    v.z*=1.34*(1-lower*.18);
    v.x += Math.sin(v.y*1.65)*.055*shell;
    v.z += Math.exp(-Math.pow((v.y-.38)*1.65,2))*.12*shell;
    if(v.y<-.85) v.z-=(-v.y-.85)*.16;
    return v;
  }

  function addBrainNode(v, layer){
    baseNodes.push(v);
    currentNodes.push(v.clone());
    nodeRadials.push(v.clone().normalize());
    nodeLayer.push(layer);
  }

  for(let i=0;i<OUTER_NODES;i++){
    const y=1-(i/(OUTER_NODES-1))*2;
    const r=Math.sqrt(Math.max(0,1-y*y));
    const theta=Math.PI*(3-Math.sqrt(5))*i;
    const ripple=Math.sin(theta*2.7+y*4.1)*.032 + Math.sin(theta*.73)*.018;
    const v=new THREE.Vector3(
      Math.cos(theta)*r*(1+ripple),
      y,
      Math.sin(theta)*r*(.96-ripple*.4)
    );
    cranialWarp(v,1);
    v.multiplyScalar(random(.965,1.035));
    addBrainNode(v,0);
  }

  for(let i=0;i<INNER_NODES;i++){
    const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize();
    const rad=Math.pow(Math.random(),.60)*.88 + .06;
    v.multiplyScalar(rad);
    cranialWarp(v,.55);
    v.multiplyScalar(.86);
    addBrainNode(v,1);
  }

  for(let i=0;i<NUCLEUS_NODES;i++){
    const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize();
    v.multiplyScalar(Math.pow(Math.random(),.52)*.58+.04);
    v.x*=1.15; v.y*=1.12; v.z*=.95;
    addBrainNode(v,2);
  }

  const nodePositions=new Float32Array(NODE_COUNT*3);
  const nodeColors=new Float32Array(NODE_COUNT*3);
  const cOuter=new THREE.Color(0xe92f5e);
  const cInner=new THREE.Color(0xff7190);
  const cCore=new THREE.Color(0xffddb0);
  for(let i=0;i<NODE_COUNT;i++){
    nodePositions[i*3]=baseNodes[i].x; nodePositions[i*3+1]=baseNodes[i].y; nodePositions[i*3+2]=baseNodes[i].z;
    const c=nodeLayer[i]===2?cCore:nodeLayer[i]===1?cInner:cOuter;
    nodeColors[i*3]=c.r; nodeColors[i*3+1]=c.g; nodeColors[i*3+2]=c.b;
  }

  const nodeGeo=new THREE.BufferGeometry();
  nodeGeo.setAttribute('position',new THREE.BufferAttribute(nodePositions,3));
  nodeGeo.setAttribute('color',new THREE.BufferAttribute(nodeColors,3));

  const nodeMat=new THREE.PointsMaterial({
    size:.050,map:glowTexture,transparent:true,opacity:.94,vertexColors:true,
    blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
  });
  const nodeCloud=new THREE.Points(nodeGeo,nodeMat);
  coreGroup.add(nodeCloud);

  const haloMat=nodeMat.clone();
  haloMat.size=.128; haloMat.opacity=.16;
  const haloCloud=new THREE.Points(nodeGeo,haloMat);
  coreGroup.add(haloCloud);

  const HOT_COUNT=150;
  const hotPositions=new Float32Array(HOT_COUNT*3);
  const hotIndices=[];
  for(let i=0;i<HOT_COUNT;i++){
    const idx=Math.floor((i/HOT_COUNT)*NODE_COUNT + random(0,Math.max(1,NODE_COUNT/HOT_COUNT)))%NODE_COUNT;
    hotIndices.push(idx);
    hotPositions[i*3]=baseNodes[idx].x; hotPositions[i*3+1]=baseNodes[idx].y; hotPositions[i*3+2]=baseNodes[idx].z;
  }
  const hotGeo=new THREE.BufferGeometry();
  hotGeo.setAttribute('position',new THREE.BufferAttribute(hotPositions,3));
  const hotMat=new THREE.PointsMaterial({size:.11,map:glowTexture,color:0xffd49a,transparent:true,opacity:.80,blending:THREE.AdditiveBlending,depthWrite:false});
  const hotCloud=new THREE.Points(hotGeo,hotMat);
  coreGroup.add(hotCloud);

  const nucleusGroup=new THREE.Group(); coreGroup.add(nucleusGroup);
  const nucleusMat=new THREE.MeshBasicMaterial({color:0xff315f,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false});
  const nucleusMesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.66,4),nucleusMat);
  nucleusMesh.scale.set(1.28,1.0,.9);
  nucleusGroup.add(nucleusMesh);
  const nucleusWire=new THREE.Mesh(
    new THREE.IcosahedronGeometry(.82,3),
    new THREE.MeshBasicMaterial({color:0xffc18a,wireframe:true,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  nucleusWire.scale.set(1.22,1.0,.9);
  nucleusGroup.add(nucleusWire);

  const coreGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xff355f,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));
  coreGlow.scale.set(2.8,2.8,1); coreGlow.position.set(.05,.05,.12);
  nucleusGroup.add(coreGlow);

  const edges=[];
  const edgeSeen=new Set();
  function addEdge(a,b){
    if(a===b || a<0 || b<0 || a>=NODE_COUNT || b>=NODE_COUNT) return;
    const x=Math.min(a,b),y=Math.max(a,b),key=x+'_'+y;
    if(!edgeSeen.has(key)){edgeSeen.add(key);edges.push([x,y]);}
  }

  const shellOffsets=[1,2,13,34];
  for(let i=0;i<OUTER_NODES;i++){
    shellOffsets.forEach(o=>addEdge(i,(i+o)%OUTER_NODES));
    if(i%3===0) addEdge(i,(i+89)%OUTER_NODES);
  }
  for(let i=0;i<INNER_NODES;i++){
    const idx=OUTER_NODES+i;
    addEdge(idx,OUTER_NODES+((i+1)%INNER_NODES));
    addEdge(idx,OUTER_NODES+((i+17)%INNER_NODES));
    addEdge(idx,OUTER_NODES+((i+53)%INNER_NODES));
    addEdge(idx,(i*7)%OUTER_NODES);
    if(i%2===0) addEdge(idx,(i*13+71)%OUTER_NODES);
  }
  for(let i=0;i<NUCLEUS_NODES;i++){
    const idx=OUTER_NODES+INNER_NODES+i;
    addEdge(idx,OUTER_NODES+INNER_NODES+((i+1)%NUCLEUS_NODES));
    addEdge(idx,OUTER_NODES+INNER_NODES+((i+11)%NUCLEUS_NODES));
    addEdge(idx,OUTER_NODES+(i*3)%INNER_NODES);
    addEdge(idx,(i*19)%OUTER_NODES);
  }
  for(let n=0;n<620;n++){
    const a=Math.floor(random(0,NODE_COUNT));
    const b=Math.floor(random(0,NODE_COUNT));
    addEdge(a,b);
  }

  const edgePositions=new Float32Array(edges.length*6);
  const edgeGeo=new THREE.BufferGeometry();
  edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3));
  const edgeMat=new THREE.LineBasicMaterial({color:0xd63b61,transparent:true,opacity:.19,blending:THREE.AdditiveBlending,depthWrite:false});
  const edgeLines=new THREE.LineSegments(edgeGeo,edgeMat);
  coreGroup.add(edgeLines);

  const arcGroup=new THREE.Group(); coreGroup.add(arcGroup);
  for(let i=0;i<18;i++){
    const a=baseNodes[Math.floor(random(0,OUTER_NODES))].clone();
    const b=baseNodes[Math.floor(random(0,OUTER_NODES))].clone();
    const mid=a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(random(2.25,3.05));
    mid.y+=random(-.35,.55);
    const curve=new THREE.CatmullRomCurve3([a,mid,b]);
    const pts=curve.getPoints(42);
    const geo=new THREE.BufferGeometry().setFromPoints(pts);
    const mat=new THREE.LineBasicMaterial({color:i%4===0?0xffbd83:0xb5264c,transparent:true,opacity:i%4===0?.18:.08,blending:THREE.AdditiveBlending,depthWrite:false});
    const line=new THREE.Line(geo,mat);
    arcGroup.add(line);
  }

  const AURA_COUNT=720;
  const auraPos=new Float32Array(AURA_COUNT*3);
  for(let i=0;i<AURA_COUNT;i++){
    const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(2.2,3.7));
    v.y*=.85;
    auraPos[i*3]=v.x; auraPos[i*3+1]=v.y; auraPos[i*3+2]=v.z;
  }
  const auraGeo=new THREE.BufferGeometry(); auraGeo.setAttribute('position',new THREE.BufferAttribute(auraPos,3));
  const auraMat=new THREE.PointsMaterial({size:.035,map:glowTexture,color:0xb72752,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false});
  const auraCloud=new THREE.Points(auraGeo,auraMat); coreGroup.add(auraCloud);

  const ringGroup=new THREE.Group(); coreGroup.add(ringGroup);
  for(let i=0;i<3;i++){
    const ringGeo=new THREE.TorusGeometry(2.50+i*.10,.005,4,220);
    const ringMat=new THREE.MeshBasicMaterial({color:i===1?0xff815f:0x6c1630,transparent:true,opacity:i===1?.13:.065,blending:THREE.AdditiveBlending,depthWrite:false});
    const ring=new THREE.Mesh(ringGeo,ringMat);
    ring.rotation.set(.55+i*.69,.25+i*.82,.32+i*.57);
    ring.scale.set(1,1-random(.06,.16),1);
    ringGroup.add(ring);
  }

  const shardGroup=new THREE.Group(); coreGroup.add(shardGroup);
  for(let i=0;i<34;i++){
    const g=new THREE.TetrahedronGeometry(random(.035,.11),0);
    const m=new THREE.MeshBasicMaterial({color:i%5===0?0xffbd83:(i%3===0?0xff315f:0x8f2142),transparent:true,opacity:random(.10,.38),wireframe:true,blending:THREE.AdditiveBlending,depthWrite:false});
    const s=new THREE.Mesh(g,m);
    const dir=new THREE.Vector3(normalRandom(),normalRandom()*.78,normalRandom()).normalize().multiplyScalar(random(2.35,3.35));
    s.position.copy(dir); s.rotation.set(random(0,3),random(0,3),random(0,3));
    s.userData.spin=random(-.012,.012);
    shardGroup.add(s);
  }

  const signalGeom=new THREE.SphereGeometry(.028,7,7);
  const signalMat=new THREE.MeshBasicMaterial({color:0xffdfc0,transparent:true,opacity:.98,blending:THREE.AdditiveBlending,depthWrite:false});
  const neuralSignals=[];
  const marketImpulses=[];

  function spawnNeuralSignal(edgeIndex,energy=1){
    if(neuralSignals.length>210 || !edges.length) return;
    const mesh=new THREE.Mesh(signalGeom,signalMat.clone());
    mesh.material.color.set(energy>1.25?0xffffff:(energy>.8?0xffd0a0:0xff5c7c));
    mesh.scale.setScalar(.65+energy*.32);
    coreGroup.add(mesh);
    neuralSignals.push({mesh,edgeIndex:edgeIndex%edges.length,t:0,speed:random(.011,.028)*(1+energy*.42),reverse:Math.random()>.5});
  }

  const impulseGeom=new THREE.SphereGeometry(.046,8,8);
  function spawnMarketImpulse(magnitude,sign){
    const targetIndex=Math.floor(random(0,NODE_COUNT));
    const end=currentNodes[targetIndex].clone();
    const dir=end.clone().normalize();
    const tangent=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(.35,1.15));
    const start=dir.multiplyScalar(random(4.5,5.25)).add(tangent);
    const mat=new THREE.MeshBasicMaterial({color:sign>=0?0xffd4a0:0xff274f,transparent:true,opacity:.96,blending:THREE.AdditiveBlending,depthWrite:false});
    const mesh=new THREE.Mesh(impulseGeom,mat); mesh.position.copy(start); coreGroup.add(mesh);
    marketImpulses.push({mesh,start,end,targetIndex,t:0,speed:random(.025,.045),energy:clamp(magnitude*10,.7,2.2)});
  }

  let neuralTension=.34;
  let burstEnergy=.10;
  function fireNeuralBurst(energy){
    burstEnergy=Math.max(burstEnergy,energy);
    neuralTension=clamp(neuralTension+energy*.095,0,1);
    const count=Math.round(12+energy*26);
    for(let i=0;i<count;i++) spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
  }

  function resizeCore(){
    const r=coreViewport.getBoundingClientRect();
    const w=Math.max(10,r.width),h=Math.max(10,r.height);
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize',resizeCore);
  resizeCore();
