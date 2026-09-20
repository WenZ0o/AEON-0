// ---------- MAIN ANIMATION V5 ----------
const clock=new THREE.Clock();

function updateCore(t,dt){
  neuralTension=clamp(neuralTension-dt*.007,0,1);
  burstEnergy*=.954;

  const breathe=1+Math.sin(t*.74)*.004+Math.sin(t*.29)*.0025;
  const activity=neuralTension*.014+burstEnergy*.008;

  for(let i=0;i<NODE_COUNT;i++){
    const b=baseNodes[i];
    const radial=nodeRadials[i];
    const layer=nodeLayer[i]||0;
    const wave=Math.sin(t*1.02+i*.091)*(.0028+neuralTension*.0036)*(layer===2?1.5:layer===1?1.14:1);

    currentNodes[i]
      .copy(b)
      .multiplyScalar(breathe+activity+wave*.045)
      .addScaledVector(radial,wave);

    nodePositions[i*3]=currentNodes[i].x;
    nodePositions[i*3+1]=currentNodes[i].y;
    nodePositions[i*3+2]=currentNodes[i].z;
  }
  nodeGeo.attributes.position.needsUpdate=true;

  for(let i=0;i<HOT_COUNT;i++){
    const p=currentNodes[hotIndices[i]];
    hotPositions[i*3]=p.x;hotPositions[i*3+1]=p.y;hotPositions[i*3+2]=p.z;
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
    const a=currentNodes[edge[s.reverse?1:0]],b=currentNodes[edge[s.reverse?0:1]];
    s.t+=s.speed*(1+neuralTension*.58);
    s.mesh.position.lerpVectors(a,b,s.t);
    const q=Math.sin(Math.min(1,s.t)*Math.PI);
    s.mesh.scale.setScalar(.36+q*.88);
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
    m.mesh.position.y+=Math.sin(u*Math.PI)*.20;
    m.mesh.scale.setScalar(.62+Math.sin(u*Math.PI)*.70);
    if(u>=1){
      fireNeuralBurst(m.energy);
      coreGroup.remove(m.mesh);
      m.mesh.material.dispose();
      marketImpulses.splice(i,1);
    }
  }

  coreGroup.rotation.y=-.10+Math.sin(t*.07)*.025;
  coreGroup.rotation.x=.01+Math.sin(t*.11)*.009;
  coreGroup.rotation.z=Math.sin(t*.05)*.004;

  arcGroup.rotation.y=Math.sin(t*.05)*.010;

  nodeMat.size=.044+neuralTension*.010+burstEnergy*.003;
  nodeMat.opacity=.90+neuralTension*.06;
  haloMat.opacity=.07+neuralTension*.06;
  edgeMat.opacity=.145+neuralTension*.075+burstEnergy*.018;
  warmMat.opacity=.105+neuralTension*.085+burstEnergy*.020;
  hotMat.opacity=.62+neuralTension*.20+Math.sin(t*1.5)*.025;

  const eyePulse=.82+Math.sin(t*1.2)*.07+neuralTension*.10;
  eyeSprite.material.opacity=clamp(eyePulse,.72,1);
  eyeCore.material.opacity=.90+Math.sin(t*2.0)*.05;
  const eyeScale=.15+neuralTension*.025+Math.sin(t*1.2)*.006;
  eyeSprite.scale.set(eyeScale,eyeScale,1);

  profileLine.material.opacity=.34+neuralTension*.10;
  browLine.material.opacity=.17+neuralTension*.07;
  eyeLine.material.opacity=.23+neuralTension*.08;
  lipLine.material.opacity=.14+neuralTension*.05;
  jawLine.material.opacity=.13+neuralTension*.05;

  keyLight.intensity=4.8+neuralTension*2.8+burstEnergy*.8;
  warmLight.intensity=4.1+neuralTension*2.4+burstEnergy*.8;
  rimLight.intensity=2.6+neuralTension*1.5;

  camera.position.x=Math.sin(t*.045)*.035;
  camera.position.y=Math.cos(t*.07)*.020;
  camera.position.z=7.4+Math.sin(t*.035)*.035;
  camera.lookAt(-.05,.10,0);

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
  const count=1+(Math.random()<.36?1:0);
  for(let i=0;i<count;i++){
    const energy=.28+market.volatility*.32+Math.random()*.26;
    spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
  }
},160);

setInterval(()=>{
  if(!executing&&Math.random()<.52)fireNeuralBurst(random(.22,.50));
},1800);

const idleStates=[
  'ANALYZING MARKET...',
  'SCANNING LIQUIDITY...',
  'MAPPING VOLATILITY...',
  'REPLAYING MICROSTRUCTURE...',
  'REINFORCING PATHWAYS...',
  'CORTICAL FIELD STABLE...'
];
setInterval(()=>{if(!executing)setCoreState(choose(idleStates));},2500);
