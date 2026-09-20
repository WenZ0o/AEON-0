// ---------- MAIN ANIMATION V3 ----------
  const clock=new THREE.Clock();
  function updateCore(t,dt){
    neuralTension=clamp(neuralTension-dt*.0085,0,1);
    burstEnergy*=.951;

    const pulse=Math.sin(t*1.45)*.010+Math.sin(t*.53)*.006;
    const deepPulse=(Math.sin(t*2.35)*.5+.5)*burstEnergy*.014;
    const tensionPulse=neuralTension*.030+burstEnergy*.017;

    for(let i=0;i<NODE_COUNT;i++){
      const b=baseNodes[i];
      const radial=nodeRadials[i];
      const layer=nodeLayer[i]||0;
      const layerScale=layer===2?1.65:layer===1?1.18:1;
      const wave=(Math.sin(t*1.28+i*.173)*(.008+neuralTension*.010)+Math.cos(t*.67+i*.091)*.004)*layerScale;
      const breathe=1+pulse+deepPulse+Math.sin(t*.82+Math.sign(b.x)*.48)*.006;
      currentNodes[i].copy(b)
        .multiplyScalar(breathe+tensionPulse+wave*.10)
        .addScaledVector(radial,wave);
      nodePositions[i*3]=currentNodes[i].x;
      nodePositions[i*3+1]=currentNodes[i].y;
      nodePositions[i*3+2]=currentNodes[i].z;
    }
    nodeGeo.attributes.position.needsUpdate=true;

    for(let i=0;i<HOT_COUNT;i++){
      const n=currentNodes[hotIndices[i]];
      hotPositions[i*3]=n.x; hotPositions[i*3+1]=n.y; hotPositions[i*3+2]=n.z;
    }
    hotGeo.attributes.position.needsUpdate=true;

    const ep=edgeGeo.attributes.position.array;
    for(let e=0;e<edges.length;e++){
      const [a,b]=edges[e],A=currentNodes[a],B=currentNodes[b],o=e*6;
      ep[o]=A.x; ep[o+1]=A.y; ep[o+2]=A.z;
      ep[o+3]=B.x; ep[o+4]=B.y; ep[o+5]=B.z;
    }
    edgeGeo.attributes.position.needsUpdate=true;

    for(let i=neuralSignals.length-1;i>=0;i--){
      const s=neuralSignals[i],edge=edges[s.edgeIndex];
      const a=currentNodes[edge[s.reverse?1:0]],b=currentNodes[edge[s.reverse?0:1]];
      s.t+=s.speed*(1+neuralTension*.88);
      s.mesh.position.lerpVectors(a,b,s.t);
      const q=Math.sin(Math.min(1,s.t)*Math.PI);
      s.mesh.scale.setScalar(.42+q*1.05);
      if(s.t>=1){coreGroup.remove(s.mesh);s.mesh.material.dispose();neuralSignals.splice(i,1);}
    }

    for(let i=marketImpulses.length-1;i>=0;i--){
      const m=marketImpulses[i];
      m.t+=m.speed;
      const target=currentNodes[m.targetIndex];
      m.end.lerp(target,.18);
      const u=clamp(m.t,0,1),curve=Math.sin(u*Math.PI)*.30;
      m.mesh.position.lerpVectors(m.start,m.end,u);m.mesh.position.y+=curve;
      m.mesh.scale.setScalar(.70+Math.sin(u*Math.PI)*.92);
      if(u>=1){fireNeuralBurst(m.energy);coreGroup.remove(m.mesh);m.mesh.material.dispose();marketImpulses.splice(i,1);}
    }

    coreGroup.rotation.y=-.30+Math.sin(t*.105)*.10;
    coreGroup.rotation.x=Math.sin(t*.155)*.045;
    coreGroup.rotation.z=Math.sin(t*.085)*.012;

    ringGroup.rotation.z+=dt*.012;
    ringGroup.rotation.y-=dt*.010;
    arcGroup.rotation.y=Math.sin(t*.07)*.025;
    auraCloud.rotation.y+=dt*.006;
    auraCloud.rotation.z-=dt*.002;

    nucleusGroup.rotation.y-=dt*.085;
    nucleusGroup.rotation.x=Math.sin(t*.55)*.09;
    const nucleusBreath=1+Math.sin(t*2.05)*.028+burstEnergy*.065;
    nucleusGroup.scale.setScalar(nucleusBreath);
    nucleusMat.opacity=.055+neuralTension*.075+burstEnergy*.045;
    coreGlow.material.opacity=.16+neuralTension*.11+burstEnergy*.06;

    shardGroup.children.forEach((s,i)=>{
      s.rotation.x+=s.userData.spin;
      s.rotation.y-=s.userData.spin*.72;
      const drift=1+Math.sin(t*.52+i*.67)*.00009;
      s.position.multiplyScalar(drift);
    });

    nodeMat.size=.046+neuralTension*.018+burstEnergy*.005;
    haloMat.opacity=.12+neuralTension*.11+burstEnergy*.025;
    hotMat.opacity=.62+neuralTension*.22+Math.sin(t*1.8)*.04;
    edgeMat.opacity=.14+neuralTension*.16+burstEnergy*.035;
    auraMat.opacity=.22+neuralTension*.11;

    keyLight.intensity=6.2+neuralTension*5.8+burstEnergy*2.2;
    warmLight.intensity=3.4+neuralTension*3.0+burstEnergy*1.4;
    rimLight.intensity=3.3+neuralTension*2.7;
    coreLight.intensity=2.7+neuralTension*4.2+burstEnergy*3.0;

    camera.position.x=Math.sin(t*.071)*.10;
    camera.position.y=-.02+Math.cos(t*.11)*.055;
    camera.position.z=7.45+Math.sin(t*.053)*.08;
    camera.lookAt(0,-.08,0);

    $('neuralFill').style.width=(neuralTension*100).toFixed(0)+'%';
    $('neuralValue').textContent=(neuralTension*100).toFixed(0)+'%';
  }

  function updateClock(){
    const elapsed=Math.floor((performance.now()-sessionStart)/1000),h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
    $('sessionClock').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
    $('latency').textContent=Math.round(11+Math.sin(elapsed*.37)*2+Math.random()*5)+' ms';
  }
  setInterval(updateClock,1000);

  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
    updateCore(t,dt);drawChart();
    if(!executing&&performance.now()>nextTradeAt)runDecisionSequence();
    renderer.render(scene,camera);
  }
  animate();

  setInterval(()=>{
    const baseCount=2+(Math.random()<.42?1:0);
    for(let i=0;i<baseCount;i++){
      const energy=.28+market.volatility*.36+Math.random()*.34;
      spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
    }
  },120);

  setInterval(()=>{
    if(!executing&&Math.random()<.66)fireNeuralBurst(random(.24,.58));
  },1650);

  const idleStates=['ANALYZING MARKET...','SCANNING LIQUIDITY...','MAPPING VOLATILITY...','REPLAYING MICROSTRUCTURE...','REINFORCING PATHWAYS...','SYNAPTIC FIELD STABLE...'];
  setInterval(()=>{if(!executing)setCoreState(choose(idleStates));},2500);
