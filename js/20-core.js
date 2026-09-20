// ---------- THREE.JS INTELLIGENCE CORE V2 ----------
  const coreViewport = $('coreViewport');
  if (typeof THREE === 'undefined') {
    coreViewport.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#ff7893;font:12px/1.7 monospace;letter-spacing:.08em">THREE.JS COULD NOT LOAD.<br>CHECK YOUR INTERNET CONNECTION OR OPEN THIS FILE IN CHROME/EDGE.</div>';
    $('coreState').textContent = 'RENDERER OFFLINE';
    $('coreState').style.color = '#ff5f75';
    throw new Error('Three.js failed to load from CDN');
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050305, .045);

  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  camera.position.set(0, 0.05, 7.15);

  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  coreViewport.prepend(renderer.domElement);

  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const ambient = new THREE.AmbientLight(0x5f1530, .44);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff315f, 7.2, 20, 2);
  keyLight.position.set(2.7, 2.3, 4.4);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xa01745, 4.2, 18, 2);
  rimLight.position.set(-3.8, -.8, 1.5);
  scene.add(rimLight);

  const coreLight = new THREE.PointLight(0xff6d91, 3.2, 8, 2);
  coreLight.position.set(0,0,.5);
  scene.add(coreLight);

  function radialTexture(){
    const c=document.createElement('canvas'); c.width=128; c.height=128;
    const x=c.getContext('2d');
    const g=x.createRadialGradient(64,64,1,64,64,64);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(.12,'rgba(255,214,224,1)');
    g.addColorStop(.32,'rgba(255,88,126,.92)');
    g.addColorStop(.62,'rgba(255,30,84,.28)');
    g.addColorStop(1,'rgba(255,0,70,0)');
    x.fillStyle=g; x.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(c);
  }
  const glowTexture=radialTexture();

  const OUTER_NODES = 260;
  const INNER_NODES = 120;
  const NUCLEUS_NODES = 44;
  const NODE_COUNT = OUTER_NODES + INNER_NODES + NUCLEUS_NODES;
  const baseNodes=[];
  const currentNodes=[];
  const nodeLayer=[];

  function addBrainNode(v, layer){
    baseNodes.push(v);
    currentNodes.push(v.clone());
    nodeLayer.push(layer);
  }

  for(let i=0;i<OUTER_NODES;i++){
    const y=1-(i/(OUTER_NODES-1))*2;
    const r=Math.sqrt(Math.max(0,1-y*y));
    const theta=Math.PI*(3-Math.sqrt(5))*i;
    const lobe=Math.sin(theta*1.7)*.085 + Math.sin(theta*3.1+y*2.2)*.045;
    const hemi=Math.cos(theta)>=0?1:-1;
    let x=Math.cos(theta)*r*(1.03+lobe)+hemi*.065;
    let z=Math.sin(theta)*r*(.83+Math.cos(theta*2.3)*.045);
    let yy=y*(.91+Math.sin(theta*.7)*.025)+Math.sin(theta*2.1)*.035;
    const n=new THREE.Vector3(x*1.84,yy*1.7,z*1.68);
    n.multiplyScalar(random(.91,1.08));
    addBrainNode(n,0);
  }

  for(let i=0;i<INNER_NODES;i++){
    const v=new THREE.Vector3(normalRandom(),normalRandom()*.9,normalRandom()*.82).normalize();
    const rad=Math.pow(Math.random(),.46)*1.48 + .16;
    v.multiplyScalar(rad);
    v.x*=1.04; v.y*=.92; v.z*=.9;
    v.x += Math.sign(v.x || 1)*random(-.035,.07);
    addBrainNode(v,1);
  }

  for(let i=0;i<NUCLEUS_NODES;i++){
    const v=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize();
    v.multiplyScalar(random(.08,.7));
    v.x*=1.15; v.y*=.9; v.z*=.85;
    addBrainNode(v,2);
  }

  const nodePositions=new Float32Array(NODE_COUNT*3);
  const nodeColors=new Float32Array(NODE_COUNT*3);
  const cOuter=new THREE.Color(0xff315f), cInner=new THREE.Color(0xff6f91), cCore=new THREE.Color(0xffe5ec);
  for(let i=0;i<NODE_COUNT;i++){
    nodePositions[i*3]=baseNodes[i].x; nodePositions[i*3+1]=baseNodes[i].y; nodePositions[i*3+2]=baseNodes[i].z;
    const c=nodeLayer[i]===2?cCore:nodeLayer[i]===1?cInner:cOuter;
    nodeColors[i*3]=c.r; nodeColors[i*3+1]=c.g; nodeColors[i*3+2]=c.b;
  }

  const nodeGeo=new THREE.BufferGeometry();
  nodeGeo.setAttribute('position',new THREE.BufferAttribute(nodePositions,3));
  nodeGeo.setAttribute('color',new THREE.BufferAttribute(nodeColors,3));

  const nodeMat=new THREE.PointsMaterial({
    size:.082,map:glowTexture,transparent:true,opacity:.98,vertexColors:true,
    blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
  });
  const nodeCloud=new THREE.Points(nodeGeo,nodeMat);
  coreGroup.add(nodeCloud);

  const haloMat=nodeMat.clone();
  haloMat.size=.19; haloMat.opacity=.19; haloMat.vertexColors=true;
  const haloCloud=new THREE.Points(nodeGeo,haloMat);
  coreGroup.add(haloCloud);

  const nucleusGroup=new THREE.Group(); coreGroup.add(nucleusGroup);
  const nucleusMat=new THREE.MeshBasicMaterial({color:0xff315f,transparent:true,opacity:.11,blending:THREE.AdditiveBlending,depthWrite:false});
  const nucleusMesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,3),nucleusMat);
  nucleusGroup.add(nucleusMesh);
  const nucleusWire=new THREE.Mesh(
    new THREE.IcosahedronGeometry(.86,2),
    new THREE.MeshBasicMaterial({color:0xff7897,wireframe:true,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  nucleusGroup.add(nucleusWire);

  const edges=[];
  const edgeSeen=new Set();
  function addEdge(a,b){
    if(a===b) return;
    const x=Math.min(a,b),y=Math.max(a,b),key=x+'_'+y;
    if(!edgeSeen.has(key)){edgeSeen.add(key);edges.push([x,y]);}
  }

  for(let i=0;i<NODE_COUNT;i++){
    const neighbors=[];
    for(let j=0;j<NODE_COUNT;j++){
      if(i===j) continue;
      neighbors.push({j,d:baseNodes[i].distanceToSquared(baseNodes[j])});
    }
    neighbors.sort((a,b)=>a.d-b.d);
    const neighborCount=nodeLayer[i]===2?9:nodeLayer[i]===1?7:6;
    for(let k=0;k<neighborCount;k++) addEdge(i,neighbors[k].j);
  }

  for(let n=0;n<180;n++){
    const a=Math.floor(random(0,NODE_COUNT));
    let b=Math.floor(random(0,NODE_COUNT));
    let guard=0;
    while((b===a || baseNodes[a].distanceTo(baseNodes[b])<1.05) && guard++<12) b=Math.floor(random(0,NODE_COUNT));
    addEdge(a,b);
  }

  const edgePositions=new Float32Array(edges.length*6);
  const edgeGeo=new THREE.BufferGeometry();
  edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3));
  const edgeMat=new THREE.LineBasicMaterial({color:0xdb3762,transparent:true,opacity:.29,blending:THREE.AdditiveBlending,depthWrite:false});
  const edgeLines=new THREE.LineSegments(edgeGeo,edgeMat);
  coreGroup.add(edgeLines);

  const shellGeo=new THREE.IcosahedronGeometry(2.28,3);
  const shellMat=new THREE.MeshBasicMaterial({color:0x8d2140,wireframe:true,transparent:true,opacity:.045,blending:THREE.AdditiveBlending,depthWrite:false});
  const shell=new THREE.Mesh(shellGeo,shellMat);
  shell.scale.set(1.02,.91,.88);
  coreGroup.add(shell);

  const ringGroup=new THREE.Group(); coreGroup.add(ringGroup);
  for(let i=0;i<5;i++){
    const ringGeo=new THREE.TorusGeometry(2.42+i*.085,.007+(i===2?.003:0),5,190);
    const ringMat=new THREE.MeshBasicMaterial({
      color:i===2?0xff6787:(i%2?0x9b2042:0x5e1730),
      transparent:true,opacity:i===2?.29:.11+(i*.012),blending:THREE.AdditiveBlending,depthWrite:false
    });
    const ring=new THREE.Mesh(ringGeo,ringMat);
    ring.rotation.set(.25+i*.52,.15+i*.79,.22+i*.43);
    ring.scale.set(1,1-random(.02,.12),1);
    ringGroup.add(ring);
  }

  const shardGroup=new THREE.Group(); coreGroup.add(shardGroup);
  for(let i=0;i<28;i++){
    const g=new THREE.TetrahedronGeometry(random(.055,.15),0);
    const m=new THREE.MeshBasicMaterial({
      color:i%4===0?0xff7c9a:(i%3===0?0xff315f:0x8f2142),
      transparent:true,opacity:random(.12,.48),wireframe:Math.random()>.36,
      blending:THREE.AdditiveBlending,depthWrite:false
    });
    const s=new THREE.Mesh(g,m);
    const dir=new THREE.Vector3(normalRandom(),normalRandom()*.75,normalRandom()).normalize().multiplyScalar(random(2.25,3.05));
    s.position.copy(dir); s.rotation.set(random(0,3),random(0,3),random(0,3));
    s.userData.spin=random(-.018,.018); s.userData.baseScale=random(.7,1.2);
    shardGroup.add(s);
  }

  const signalGeom=new THREE.SphereGeometry(.034,8,8);
  const signalMat=new THREE.MeshBasicMaterial({color:0xffd6df,transparent:true,opacity:.98,blending:THREE.AdditiveBlending,depthWrite:false});
  const neuralSignals=[];
  const marketImpulses=[];

  function spawnNeuralSignal(edgeIndex,energy=1){
    if(neuralSignals.length>120) return;
    const mesh=new THREE.Mesh(signalGeom,signalMat.clone());
    mesh.material.color.set(energy>1.25?0xffffff:(energy>.8?0xff9db2:0xff527a));
    mesh.scale.setScalar(.7+energy*.3);
    coreGroup.add(mesh);
    neuralSignals.push({mesh,edgeIndex,t:0,speed:random(.010,.024)*(1+energy*.42),reverse:Math.random()>.5});
  }

  const impulseGeom=new THREE.SphereGeometry(.052,9,9);
  function spawnMarketImpulse(magnitude,sign){
    const targetIndex=Math.floor(random(0,NODE_COUNT));
    const end=currentNodes[targetIndex].clone();
    const dir=end.clone().normalize();
    const tangent=new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(.35,1.2));
    const start=dir.multiplyScalar(random(4.5,5.3)).add(tangent);
    const mat=new THREE.MeshBasicMaterial({color:sign>=0?0xffc0ce:0xff274f,transparent:true,opacity:.96,blending:THREE.AdditiveBlending,depthWrite:false});
    const mesh=new THREE.Mesh(impulseGeom,mat); mesh.position.copy(start); coreGroup.add(mesh);
    marketImpulses.push({mesh,start,end,targetIndex,t:0,speed:random(.024,.043),energy:clamp(magnitude*10,.7,2.2)});
  }

  let neuralTension=.31;
  let burstEnergy=.08;
  function fireNeuralBurst(energy){
    burstEnergy=Math.max(burstEnergy,energy);
    neuralTension=clamp(neuralTension+energy*.105,0,1);
    const count=Math.round(8+energy*18);
    for(let i=0;i<count;i++) spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
    if(energy>.72) playNeuralTick(clamp(energy/2,0,1));
  }

  function resizeCore(){
    const r=coreViewport.getBoundingClientRect();
    const w=Math.max(10,r.width),h=Math.max(10,r.height);
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize',resizeCore);
  resizeCore();
