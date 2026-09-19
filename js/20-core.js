// ---------- THREE.JS INTELLIGENCE CORE ----------
  const coreViewport = $('coreViewport');
  if (typeof THREE === 'undefined') {
    coreViewport.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#ff7893;font:12px/1.7 monospace;letter-spacing:.08em">THREE.JS COULD NOT LOAD.<br>CHECK YOUR INTERNET CONNECTION OR OPEN THIS FILE IN CHROME/EDGE.</div>';
    $('coreState').textContent = 'RENDERER OFFLINE';
    $('coreState').style.color = '#ff5f75';
    throw new Error('Three.js failed to load from CDN');
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0.1, 7.4);
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  coreViewport.prepend(renderer.domElement);

  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const ambient = new THREE.AmbientLight(0x5b1a2f, 0.28);
  scene.add(ambient);
  const keyLight = new THREE.PointLight(0xff315f, 4.2, 18, 2);
  keyLight.position.set(3,2,5);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x6e1530, 2.2, 14, 2);
  rimLight.position.set(-4,-1,2);
  scene.add(rimLight);

  function radialTexture(){
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64,64,1,64,64,64);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(.18,'rgba(255,130,160,.95)');
    g.addColorStop(.52,'rgba(255,48,96,.32)');
    g.addColorStop(1,'rgba(255,0,70,0)');
    x.fillStyle = g; x.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(c);
  }
  const glowTexture = radialTexture();

  const NODE_COUNT = 126;
  const baseNodes = [];
  const currentNodes = [];
  for(let i=0;i<NODE_COUNT;i++){
    const y = 1 - (i/(NODE_COUNT-1))*2;
    const radius = Math.sqrt(Math.max(0,1-y*y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    let x = Math.cos(theta)*radius;
    let z = Math.sin(theta)*radius;
    const hemisphere = x >= 0 ? 1 : -1;
    x = x*1.22 + hemisphere*0.12;
    const yy = y*.86 + Math.sin(theta*2.1)*0.035;
    z = z*.76;
    const n = new THREE.Vector3(x*1.63, yy*1.63, z*1.63);
    n.multiplyScalar(random(.88,1.08));
    baseNodes.push(n);
    currentNodes.push(n.clone());
  }

  const nodePositions = new Float32Array(NODE_COUNT*3);
  for(let i=0;i<NODE_COUNT;i++){
    nodePositions[i*3]=baseNodes[i].x; nodePositions[i*3+1]=baseNodes[i].y; nodePositions[i*3+2]=baseNodes[i].z;
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions,3));
  const nodeMat = new THREE.PointsMaterial({
    size:.105,map:glowTexture,transparent:true,opacity:.94,color:0xff527a,
    blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
  });
  const nodeCloud = new THREE.Points(nodeGeo,nodeMat);
  coreGroup.add(nodeCloud);

  const haloMat = nodeMat.clone(); haloMat.size=.21; haloMat.opacity=.16; haloMat.color.set(0xff184f);
  const haloCloud = new THREE.Points(nodeGeo,haloMat); coreGroup.add(haloCloud);

  const edges = [];
  const edgeSeen = new Set();
  for(let i=0;i<NODE_COUNT;i++){
    const neighbors = [];
    for(let j=0;j<NODE_COUNT;j++){
      if(i===j) continue;
      neighbors.push({j,d:baseNodes[i].distanceToSquared(baseNodes[j])});
    }
    neighbors.sort((a,b)=>a.d-b.d);
    for(let k=0;k<4;k++){
      const j = neighbors[k].j;
      const a = Math.min(i,j), b = Math.max(i,j), key = a+'_'+b;
      if(!edgeSeen.has(key)){edgeSeen.add(key);edges.push([a,b]);}
    }
  }
  const edgePositions = new Float32Array(edges.length*6);
  const edgeGeo = new THREE.BufferGeometry(); edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3));
  const edgeMat = new THREE.LineBasicMaterial({color:0xb92b52,transparent:true,opacity:.31,blending:THREE.AdditiveBlending,depthWrite:false});
  const edgeLines = new THREE.LineSegments(edgeGeo,edgeMat); coreGroup.add(edgeLines);

  const shellGeo = new THREE.IcosahedronGeometry(2.06,2);
  const shellMat = new THREE.MeshBasicMaterial({color:0x6f1732,wireframe:true,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false});
  const shell = new THREE.Mesh(shellGeo,shellMat); coreGroup.add(shell);

  const ringGroup = new THREE.Group(); coreGroup.add(ringGroup);
  for(let i=0;i<3;i++){
    const ringGeo = new THREE.TorusGeometry(2.26 + i*.12, .008, 5, 160);
    const ringMat = new THREE.MeshBasicMaterial({color:i===1?0xff496d:0x78172f,transparent:true,opacity:i===1?.26:.15,blending:THREE.AdditiveBlending});
    const ring = new THREE.Mesh(ringGeo,ringMat);
    ring.rotation.set(i*.7+.2, i*1.04+.15, i*.6);
    ringGroup.add(ring);
  }

  const shardGroup = new THREE.Group(); coreGroup.add(shardGroup);
  for(let i=0;i<16;i++){
    const g = new THREE.TetrahedronGeometry(random(.07,.16),0);
    const m = new THREE.MeshBasicMaterial({color:i%3===0?0xff5a7d:0x8d1c3d,transparent:true,opacity:random(.16,.42),wireframe:Math.random()>.45,blending:THREE.AdditiveBlending,depthWrite:false});
    const s = new THREE.Mesh(g,m);
    const dir = new THREE.Vector3(normalRandom(),normalRandom()*.75,normalRandom()).normalize().multiplyScalar(random(2.15,2.68));
    s.position.copy(dir); s.rotation.set(random(0,3),random(0,3),random(0,3)); s.userData.spin=random(-.012,.012); shardGroup.add(s);
  }

  const signalGeom = new THREE.SphereGeometry(.038,7,7);
  const signalMat = new THREE.MeshBasicMaterial({color:0xffb5c5,transparent:true,opacity:.98,blending:THREE.AdditiveBlending,depthWrite:false});
  const neuralSignals = [];
  const marketImpulses = [];

  function spawnNeuralSignal(edgeIndex, energy=1){
    if(neuralSignals.length > 46) return;
    const mesh = new THREE.Mesh(signalGeom,signalMat.clone());
    mesh.material.color.set(energy>1.35?0xffffff:0xff7692);
    mesh.scale.setScalar(.75 + energy*.28);
    coreGroup.add(mesh);
    neuralSignals.push({mesh,edgeIndex,t:0,speed:random(.012,.026)*(1+energy*.35),reverse:Math.random()>.5});
  }

  const impulseGeom = new THREE.SphereGeometry(.052,8,8);
  function spawnMarketImpulse(magnitude, sign){
    const targetIndex = Math.floor(random(0,NODE_COUNT));
    const end = currentNodes[targetIndex].clone();
    const dir = end.clone().normalize();
    const tangent = new THREE.Vector3(normalRandom(),normalRandom(),normalRandom()).normalize().multiplyScalar(random(.4,1.1));
    const start = dir.multiplyScalar(random(4.4,5.1)).add(tangent);
    const mat = new THREE.MeshBasicMaterial({color:sign>=0?0xffb0c2:0xff234f,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
    const mesh = new THREE.Mesh(impulseGeom,mat); mesh.position.copy(start); coreGroup.add(mesh);
    marketImpulses.push({mesh,start,end,targetIndex,t:0,speed:random(.025,.043),energy:clamp(magnitude*10,.7,2.2)});
  }

  let neuralTension = .28;
  let burstEnergy = 0;
  function fireNeuralBurst(energy){
    burstEnergy = Math.max(burstEnergy,energy);
    neuralTension = clamp(neuralTension + energy*.11,0,1);
    const count = Math.round(3 + energy*8);
    for(let i=0;i<count;i++) spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
    if(energy>.8) playNeuralTick(clamp(energy/2,0,1));
  }

  function resizeCore(){
    const r = coreViewport.getBoundingClientRect();
    const w = Math.max(10,r.width), h = Math.max(10,r.height);
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize',resizeCore);
  resizeCore();
