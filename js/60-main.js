// ---------- MAIN ANIMATION V9 ----------
const clock=new THREE.Clock();

function updateCore(t,dt){
  neuralTension=clamp(neuralTension-dt*.0068,0,1);
  burstEnergy*=.955;

  const breathe=1+Math.sin(t*.70)*.0035+Math.sin(t*.28)*.0021;
  const activity=neuralTension*.013+burstEnergy*.0065;

  for(let i=0;i<NODE_COUNT;i++){
    const b=baseNodes[i];
    const radial=nodeRadials[i];
    const layer=nodeLayer[i]||0;
    const wave=Math.sin(t*.94+i*.086)*(.0025+neuralTension*.0032)*
      (layer===1?1.16:layer===2?1.08:1);

    currentNodes[i]
      .copy(b)
      .multiplyScalar(breathe+activity+wave*.038)
      .addScaledVector(radial,wave);

    nodePositions[i*3]=currentNodes[i].x;
    nodePositions[i*3+1]=currentNodes[i].y;
    nodePositions[i*3+2]=currentNodes[i].z;
  }
  nodeGeo.attributes.position.needsUpdate=true;

  for(let i=0;i<HOT_COUNT;i++){
    const p=currentNodes[hotIndices[i]];
    hotPositions[i*3]=p.x;
    hotPositions[i*3+1]=p.y;
    hotPositions[i*3+2]=p.z;
  }
  hotGeo.attributes.position.needsUpdate=true;

  const ep=edgeGeo.attributes.position.array;
  for(let e=0;e<edges.length;e++){
    const [a,b]=edges[e],A=currentNodes[a],B=currentNodes[b],o=e*6;
    ep[o]=A.x;ep[o+1]=A.y;ep[o+2]=A.z;
    ep[o+3]=B.x;ep[o+4]=B.y;ep[o+5]=B.z;
  }
  edgeGeo.attributes.position.needsUpdate=true;

  const wp=warmGeo.attributes.position.array;
  for(let e=0;e<warmEdges.length;e++){
    const [a,b]=warmEdges[e],A=currentNodes[a],B=currentNodes[b],o=e*6;
    wp[o]=A.x;wp[o+1]=A.y;wp[o+2]=A.z;
    wp[o+3]=B.x;wp[o+4]=B.y;wp[o+5]=B.z;
  }
  warmGeo.attributes.position.needsUpdate=true;

  for(let i=neuralSignals.length-1;i>=0;i--){
    const s=neuralSignals[i],edge=edges[s.edgeIndex];
    const a=currentNodes[edge[s.reverse?1:0]];
    const b=currentNodes[edge[s.reverse?0:1]];
    s.t+=s.speed*(1+neuralTension*.56);
    s.mesh.position.lerpVectors(a,b,s.t);
    const q=Math.sin(Math.min(1,s.t)*Math.PI);
    s.mesh.scale.setScalar(.34+q*.82);
    if(s.t>=1){
      coreGroup.remove(s.mesh);
      s.mesh.material.dispose();
      neuralSignals.splice(i,1);
    }
  }

  for(let i=marketImpulses.length-1;i>=0;i--){
    const m=marketImpulses[i];
    m.t+=m.speed;
    const target=currentNodes[m.targetIndex];
    m.end.lerp(target,.16);
    const u=clamp(m.t,0,1);
    m.mesh.position.lerpVectors(m.start,m.end,u);
    m.mesh.position.y+=Math.sin(u*Math.PI)*.18;
    m.mesh.scale.setScalar(.60+Math.sin(u*Math.PI)*.67);
    if(u>=1){
      fireNeuralBurst(m.energy);
      coreGroup.remove(m.mesh);
      m.mesh.material.dispose();
      marketImpulses.splice(i,1);
    }
  }

  // Only subtle movement. It should read as anatomy, not a spinning orb.
  coreGroup.rotation.y=-.36+Math.sin(t*.055)*.020;
  coreGroup.rotation.x=.22+Math.sin(t*.085)*.010;
  coreGroup.rotation.z=-.03+Math.sin(t*.045)*.004;

  dustCloud.rotation.y+=dt*.0025;
  foldGroup.rotation.y=Math.sin(t*.030)*.006;
  fissureGroup.rotation.y=Math.sin(t*.028)*.004;

  nodeMat.size=.043+neuralTension*.008+burstEnergy*.002;
  nodeMat.opacity=.90+neuralTension*.05;
  haloMat.opacity=.055+neuralTension*.045;
  edgeMat.opacity=.105+neuralTension*.065+burstEnergy*.012;
  warmMat.opacity=.090+neuralTension*.075+burstEnergy*.016;
  hotMat.opacity=.58+neuralTension*.18+Math.sin(t*1.35)*.02;
  dustMat.opacity=.07+neuralTension*.035;
  fissureGroup.children.forEach(line=>line.material.opacity=.22+neuralTension*.06);
  cereOutline.material.opacity=.13+neuralTension*.05;

  keyLight.intensity=4.8+neuralTension*2.3+burstEnergy*.6;
  warmLight.intensity=4.0+neuralTension*2.0+burstEnergy*.6;
  rimLight.intensity=2.6+neuralTension*1.2;

  camera.position.x=Math.sin(t*.040)*.025;
  camera.position.y=.03+Math.cos(t*.060)*.014;
  camera.position.z=7.9+Math.sin(t*.032)*.025;
  camera.lookAt(0,-.04,.05);

  $('neuralFill').style.width=(neuralTension*100).toFixed(0)+'%';
  $('neuralValue').textContent=(neuralTension*100).toFixed(0)+'%';
}

function updateClock(){
  const elapsed=Math.floor((performance.now()-sessionStart)/1000);
  const h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
  $('sessionClock').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
  $('latency').textContent=Math.round(11+Math.sin(elapsed*.37)*2+Math.random()*5)+' ms';
}
setInterval(updateClock,1000);

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
  updateCore(t,dt);
  drawChart();
  if(!executing&&performance.now()>nextTradeAt)runDecisionSequence();
  renderer.render(scene,camera);
}
animate();

setInterval(()=>{
  const count=1+(Math.random()<.30?1:0);
  for(let i=0;i<count;i++){
    const energy=.27+market.volatility*.30+Math.random()*.23;
    spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
  }
},190);

setInterval(()=>{
  if(!executing&&Math.random()<.48)fireNeuralBurst(random(.20,.46));
},1850);

const idleStates=[
  'ANALYZING MARKET...',
  'SCANNING LIQUIDITY...',
  'MAPPING VOLATILITY...',
  'REPLAYING MICROSTRUCTURE...',
  'REINFORCING PATHWAYS...',
  'HIPPO BRAIN FIELD STABLE...'
];
setInterval(()=>{if(!executing)setCoreState(choose(idleStates));},2500);
