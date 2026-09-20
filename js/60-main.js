// ---------- MAIN ANIMATION V4 ----------
const clock=new THREE.Clock();

function updateCore(t,dt){
  neuralTension=clamp(neuralTension-dt*.0075,0,1);
  burstEnergy*=.953;

  const breathe=1+Math.sin(t*.78)*.0045+Math.sin(t*.31)*.003;
  const activity=neuralTension*.018+burstEnergy*.010;

  for(let i=0;i<NODE_COUNT;i++){
    const b=baseNodes[i];
    const radial=nodeRadials[i];
    const layer=nodeLayer[i]||0;
    const wave=(Math.sin(t*1.1+i*.097)*(.0035+neuralTension*.0045))*(
      layer===2?1.55:layer===1?1.16:1
    );

    currentNodes[i]
      .copy(b)
      .multiplyScalar(breathe+activity+wave*.06)
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
    s.t+=s.speed*(1+neuralTension*.62);
    s.mesh.position.lerpVectors(a,b,s.t);
    const q=Math.sin(Math.min(1,s.t)*Math.PI);
    s.mesh.scale.setScalar(.38+q*.92);
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
    m.mesh.position.y+=Math.sin(u*Math.PI)*.22;
    m.mesh.scale.setScalar(.66+Math.sin(u*Math.PI)*.74);
    if(u>=1){
      fireNeuralBurst(m.energy);
      coreGroup.remove(m.mesh);
      m.mesh.material.dispose();
      marketImpulses.splice(i,1);
    }
  }

  coreGroup.rotation.y=-.66+Math.sin(t*.085)*.055;
  coreGroup.rotation.x=.02+Math.sin(t*.12)*.018;
  coreGroup.rotation.z=-.015+Math.sin(t*.06)*.006;

  arcGroup.rotation.y=Math.sin(t*.055)*.012;
  dustCloud.rotation.y+=dt*.004;
  dustCloud.rotation.z-=dt*.0015;

  nodeMat.size=.034+neuralTension*.009+burstEnergy*.002;
  haloMat.opacity=.065+neuralTension*.055;
  edgeMat.opacity=.052+neuralTension*.050+burstEnergy*.012;
  warmMat.opacity=.055+neuralTension*.065+burstEnergy*.014;
  hotMat.opacity=.54+neuralTension*.20+Math.sin(t*1.55)*.025;
  dustMat.opacity=.12+neuralTension*.065;

  const eyePulse=.82+Math.sin(t*1.35)*.08+neuralTension*.10;
  eyeSprite.material.opacity=clamp(eyePulse,.65,1);
  eyeCore.material.opacity=.84+Math.sin(t*2.1)*.08;
  const eyeScale=.20+neuralTension*.035+Math.sin(t*1.35)*.008;
  eyeSprite.scale.set(eyeScale,eyeScale,1);

  profileMat.opacity=.18+neuralTension*.08;
  jawLine.material.opacity=.075+neuralTension*.04;

  keyLight.intensity=4.4+neuralTension*3.4+burstEnergy*1.1;
  warmLight.intensity=3.0+neuralTension*2.0+burstEnergy*.7;
  rimLight.intensity=2.2+neuralTension*1.7;

  camera.position.x=Math.sin(t*.05)*.055;
  camera.position.y=.02+Math.cos(t*.08)*.028;
  camera.position.z=7.7+Math.sin(t*.04)*.045;
  camera.lookAt(0,-.04,0);

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
  const count=1+(Math.random()<.28?1:0);
  for(let i=0;i<count;i++){
    const energy=.24+market.volatility*.30+Math.random()*.24;
    spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
  }
},190);

setInterval(()=>{
  if(!executing&&Math.random()<.48)fireNeuralBurst(random(.20,.46));
},1900);

const idleStates=[
  'ANALYZING MARKET...',
  'SCANNING LIQUIDITY...',
  'MAPPING VOLATILITY...',
  'REPLAYING MICROSTRUCTURE...',
  'REINFORCING PATHWAYS...',
  'CORTICAL FIELD STABLE...'
];
setInterval(()=>{if(!executing)setCoreState(choose(idleStates));},2500);
