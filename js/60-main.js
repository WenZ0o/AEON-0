// ---------- MAIN ANIMATION V2 ----------
  const clock=new THREE.Clock();
  function updateCore(t,dt){
    neuralTension=clamp(neuralTension-dt*.010,0,1);
    burstEnergy*=.948;

    const pulse=Math.sin(t*1.9)*.014+Math.sin(t*.67)*.009;
    const deepPulse=(Math.sin(t*3.1)*.5+.5)*burstEnergy*.018;
    const tensionPulse=neuralTension*.048+burstEnergy*.023;

    for(let i=0;i<NODE_COUNT;i++){
      const b=baseNodes[i];
      const radial=b.clone().normalize();
      const layer=nodeLayer[i]||0;
      const layerScale=layer===2?1.8:layer===1?1.25:1;
      const wave=(Math.sin(t*1.55+i*.43)*(.012+neuralTension*.016)+Math.cos(t*.81+i*.17)*.006)*layerScale;
      const lobeBreath=1+pulse+deepPulse+Math.sin(t*1.1+Math.sign(b.x)*.65)*.009;
      currentNodes[i].copy(b)
        .multiplyScalar(lobeBreath+tensionPulse+wave*.12)
        .addScaledVector(radial,wave);
      nodePositions[i*3]=currentNodes[i].x;
      nodePositions[i*3+1]=currentNodes[i].y;
      nodePositions[i*3+2]=currentNodes[i].z;
    }
    nodeGeo.attributes.position.needsUpdate=true;

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
      s.t+=s.speed*(1+neuralTension*.95);
      s.mesh.position.lerpVectors(a,b,s.t);
      const q=Math.sin(Math.min(1,s.t)*Math.PI);
      s.mesh.scale.setScalar(.42+q*(1.05+s.mesh.scale.x*.05));
      if(s.t>=1){
        coreGroup.remove(s.mesh); s.mesh.material.dispose(); neuralSignals.splice(i,1);
      }
    }

    for(let i=marketImpulses.length-1;i>=0;i--){
      const m=marketImpulses[i];
      m.t+=m.speed;
      const target=currentNodes[m.targetIndex];
      m.end.lerp(target,.18);
      const u=clamp(m.t,0,1),curve=Math.sin(u*Math.PI)*.34;
      m.mesh.position.lerpVectors(m.start,m.end,u); m.mesh.position.y+=curve;
      m.mesh.scale.setScalar(.72+Math.sin(u*Math.PI)*.95);
      if(u>=1){
        fireNeuralBurst(m.energy);
        coreGroup.remove(m.mesh); m.mesh.material.dispose(); marketImpulses.splice(i,1);
      }
    }

    coreGroup.rotation.y+=dt*(.075+neuralTension*.095);
    coreGroup.rotation.x=Math.sin(t*.19)*.075;
    coreGroup.rotation.z=Math.sin(t*.11)*.018;

    ringGroup.rotation.z+=dt*.030;
    ringGroup.rotation.y-=dt*.022;
    ringGroup.children.forEach((r,i)=>{r.rotation.x+=dt*(i%2?.007:-.005);});

    shell.rotation.y-=dt*.016;
    shell.rotation.x+=dt*.007;

    nucleusGroup.rotation.y-=dt*.14;
    nucleusGroup.rotation.x=Math.sin(t*.7)*.13;
    const nucleusBreath=1+Math.sin(t*2.4)*.035+burstEnergy*.085;
    nucleusGroup.scale.setScalar(nucleusBreath);
    nucleusMat.opacity=.08+neuralTension*.09+burstEnergy*.055;

    shardGroup.children.forEach((s,i)=>{
      s.rotation.x+=s.userData.spin;
      s.rotation.y-=s.userData.spin*.73;
      const p=1+Math.sin(t*.75+i*.77)*.00018;
      s.position.multiplyScalar(p);
    });

    nodeMat.size=.075+neuralTension*.031+burstEnergy*.007;
    haloMat.opacity=.13+neuralTension*.14+burstEnergy*.035;
    edgeMat.opacity=.20+neuralTension*.30+burstEnergy*.06;
    shellMat.opacity=.025+neuralTension*.055;

    keyLight.intensity=4.2+neuralTension*5.4+burstEnergy*2.4;
    rimLight.intensity=2.6+neuralTension*2.6;
    coreLight.intensity=2.2+neuralTension*4.0+burstEnergy*3.2;

    camera.position.x=Math.sin(t*.105)*.18;
    camera.position.y=.06+Math.cos(t*.14)*.085;
    camera.position.z=7.1+Math.sin(t*.075)*.12;
    camera.lookAt(0,0,0);

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
    updateCore(t,dt); drawChart();
    if(!executing&&performance.now()>nextTradeAt) runDecisionSequence();
    renderer.render(scene,camera);
  }
  animate();

  setInterval(()=>{
    const baseCount=1+(Math.random()<.34?1:0);
    for(let i=0;i<baseCount;i++){
      const energy=.30+market.volatility*.38+Math.random()*.32;
      spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
    }
  },170);

  setInterval(()=>{
    if(!executing&&Math.random()<.58) fireNeuralBurst(random(.28,.62));
  },1900);

  const idleStates=['ANALYZING MARKET...','SCANNING LIQUIDITY...','MAPPING VOLATILITY...','REPLAYING MICROSTRUCTURE...','REINFORCING PATHWAYS...'];
  setInterval(()=>{if(!executing)setCoreState(choose(idleStates));},2600);
