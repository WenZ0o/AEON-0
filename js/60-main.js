// ---------- MAIN ANIMATION ----------
  const clock = new THREE.Clock();
  function updateCore(t,dt){
    neuralTension = clamp(neuralTension - dt*.014,0,1);
    burstEnergy *= .95;
    const pulse = Math.sin(t*2.1)*.018 + Math.sin(t*.73)*.012;
    const tensionPulse = neuralTension*.065 + burstEnergy*.028;

    for(let i=0;i<NODE_COUNT;i++){
      const b=baseNodes[i];
      const radial=b.clone().normalize();
      const wave=Math.sin(t*1.7+i*.51)*(.016+neuralTension*.018)+Math.cos(t*.92+i*.13)*.008;
      const lobeBreath=1 + pulse + Math.sin(t*1.28 + Math.sign(b.x)*.6)*.012;
      currentNodes[i].copy(b).multiplyScalar(lobeBreath + tensionPulse + wave*.15).addScaledVector(radial,wave);
      nodePositions[i*3]=currentNodes[i].x;nodePositions[i*3+1]=currentNodes[i].y;nodePositions[i*3+2]=currentNodes[i].z;
    }
    nodeGeo.attributes.position.needsUpdate=true;

    const ep=edgeGeo.attributes.position.array;
    for(let e=0;e<edges.length;e++){
      const [a,b]=edges[e], A=currentNodes[a],B=currentNodes[b],o=e*6;
      ep[o]=A.x;ep[o+1]=A.y;ep[o+2]=A.z;ep[o+3]=B.x;ep[o+4]=B.y;ep[o+5]=B.z;
    }
    edgeGeo.attributes.position.needsUpdate=true;

    for(let i=neuralSignals.length-1;i>=0;i--){
      const s=neuralSignals[i],edge=edges[s.edgeIndex],a=currentNodes[edge[s.reverse?1:0]],b=currentNodes[edge[s.reverse?0:1]];
      s.t+=s.speed*(1+neuralTension*.8);s.mesh.position.lerpVectors(a,b,s.t);
      const q=Math.sin(Math.min(1,s.t)*Math.PI);s.mesh.scale.setScalar(.45+q*.95);
      if(s.t>=1){coreGroup.remove(s.mesh);s.mesh.material.dispose();neuralSignals.splice(i,1);}
    }

    for(let i=marketImpulses.length-1;i>=0;i--){
      const m=marketImpulses[i];m.t+=m.speed;
      const target=currentNodes[m.targetIndex];m.end.lerp(target,.18);
      const u=clamp(m.t,0,1),curve=Math.sin(u*Math.PI)*.34;
      m.mesh.position.lerpVectors(m.start,m.end,u);m.mesh.position.y+=curve;
      m.mesh.scale.setScalar(.75+Math.sin(u*Math.PI)*.8);
      if(u>=1){fireNeuralBurst(m.energy);coreGroup.remove(m.mesh);m.mesh.material.dispose();marketImpulses.splice(i,1);}
    }

    coreGroup.rotation.y += dt*(.09 + neuralTension*.12);
    coreGroup.rotation.x = Math.sin(t*.22)*.09;
    ringGroup.rotation.z += dt*.035;ringGroup.rotation.y -= dt*.026;
    shell.rotation.y -= dt*.018;shell.rotation.x += dt*.009;
    shardGroup.children.forEach((s,i)=>{s.rotation.x+=s.userData.spin;s.rotation.y-=s.userData.spin*.7;s.position.multiplyScalar(1+Math.sin(t*.9+i)*.00025);});
    nodeMat.size=.095+neuralTension*.05;haloMat.opacity=.10+neuralTension*.16;edgeMat.opacity=.19+neuralTension*.28;shellMat.opacity=.045+neuralTension*.07;
    keyLight.intensity=2.4+neuralTension*4.8+burstEnergy*1.5;
    camera.position.x=Math.sin(t*.12)*.22;camera.position.y=.08+Math.cos(t*.16)*.11;camera.lookAt(0,0,0);

    $('neuralFill').style.width=(neuralTension*100).toFixed(0)+'%';
    $('neuralValue').textContent=(neuralTension*100).toFixed(0)+'%';
  }

  function updateClock(){
    const elapsed=Math.floor((performance.now()-sessionStart)/1000),h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
    $('sessionClock').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
    $('latency').textContent=Math.round(13+Math.sin(elapsed*.37)*3+Math.random()*6)+' ms';
  }
  setInterval(updateClock,1000);

  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
    updateCore(t,dt); drawChart();
    if(!executing && performance.now()>nextTradeAt) runDecisionSequence();
    renderer.render(scene,camera);
  }
  animate();

  // ambient autonomous micro-bursts keep AEON-0 visibly alive even in calm markets
  setInterval(()=>{
    if(Math.random()<.62){
      const energy=.28+market.volatility*.35+Math.random()*.28;
      spawnNeuralSignal(Math.floor(random(0,edges.length)),energy);
    }
  },380);

  // subtle status drift between trades
  const idleStates=['ANALYZING MARKET...','SCANNING LIQUIDITY...','MAPPING VOLATILITY...','REPLAYING MICROSTRUCTURE...'];
  setInterval(()=>{if(!executing) setCoreState(choose(idleStates));},2600);
