// ---------- AUDIO V2: DEEP WORKSTATION SOUND DESIGN ----------
  let audioMaster=null;
  let audioComp=null;
  let ambientBus=null;
  let fxBus=null;
  let droneStarted=false;

  function armAudio(){
    if(audioArmed) return;
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    audioCtx.resume();

    audioMaster=audioCtx.createGain();
    audioMaster.gain.value=.7;

    audioComp=audioCtx.createDynamicsCompressor();
    audioComp.threshold.value=-22;
    audioComp.knee.value=18;
    audioComp.ratio.value=3;
    audioComp.attack.value=.012;
    audioComp.release.value=.28;

    ambientBus=audioCtx.createGain();
    ambientBus.gain.value=.16;
    fxBus=audioCtx.createGain();
    fxBus.gain.value=.86;

    ambientBus.connect(audioComp);
    fxBus.connect(audioComp);
    audioComp.connect(audioMaster);
    audioMaster.connect(audioCtx.destination);

    audioArmed=true;
    $('audioHint').textContent='AUDIO ARMED // AEON SONIC BUS ONLINE';
    $('audioHint').style.color='#8ff0ad';

    startAmbientDrone();
    playBootTone();
  }
  document.addEventListener('pointerdown',armAudio,{once:true});

  function tone(freq,start,duration,gain,type='sine',endFreq=null,destination=null){
    if(!audioArmed||!audioCtx) return;
    const osc=audioCtx.createOscillator();
    const g=audioCtx.createGain();
    const filter=audioCtx.createBiquadFilter();
    const t0=audioCtx.currentTime+start;

    osc.type=type;
    osc.frequency.setValueAtTime(freq,t0);
    if(endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq),t0+duration);

    filter.type='lowpass';
    filter.frequency.setValueAtTime(Math.max(500,Math.min(6000,freq*5)),t0);
    filter.Q.value=.35;

    g.gain.setValueAtTime(.0001,t0);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t0+.012);
    g.gain.exponentialRampToValueAtTime(.0001,t0+duration);

    osc.connect(filter); filter.connect(g); g.connect(destination||fxBus||audioCtx.destination);
    osc.start(t0); osc.stop(t0+duration+.05);
  }

  function noiseBurst(start,duration,gain,center=900,q=.7){
    if(!audioArmed||!audioCtx) return;
    const length=Math.max(1,Math.floor(audioCtx.sampleRate*duration));
    const buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<length;i++){
      const env=1-i/length;
      data[i]=(Math.random()*2-1)*env;
    }
    const src=audioCtx.createBufferSource(); src.buffer=buffer;
    const filter=audioCtx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=center; filter.Q.value=q;
    const g=audioCtx.createGain();
    const t0=audioCtx.currentTime+start;
    g.gain.setValueAtTime(.0001,t0);
    g.gain.exponentialRampToValueAtTime(gain,t0+.006);
    g.gain.exponentialRampToValueAtTime(.0001,t0+duration);
    src.connect(filter); filter.connect(g); g.connect(fxBus||audioCtx.destination);
    src.start(t0); src.stop(t0+duration+.02);
  }

  function startAmbientDrone(){
    if(droneStarted||!audioArmed||!audioCtx) return;
    droneStarted=true;

    const lows=[42,55,82.5];
    lows.forEach((freq,i)=>{
      const osc=audioCtx.createOscillator();
      const filter=audioCtx.createBiquadFilter();
      const g=audioCtx.createGain();
      osc.type=i===2?'triangle':'sine';
      osc.frequency.value=freq;
      filter.type='lowpass'; filter.frequency.value=190+i*85; filter.Q.value=.7;
      g.gain.value=i===0?.045:i===1?.026:.012;
      osc.connect(filter); filter.connect(g); g.connect(ambientBus);
      osc.start();
    });

    const lfo=audioCtx.createOscillator();
    const lfoGain=audioCtx.createGain();
    lfo.type='sine'; lfo.frequency.value=.09; lfoGain.gain.value=.035;
    lfo.connect(lfoGain); lfoGain.connect(ambientBus.gain); lfo.start();
  }

  function playBootTone(){
    tone(48,0,.52,.07,'sine',68);
    tone(96,.06,.42,.034,'triangle',142);
    tone(210,.18,.28,.018,'sine',310);
    noiseBurst(.12,.16,.009,520,.65);
  }

  function playNeuralTick(intensity=1){
    if(!audioArmed) return;
    const i=clamp(intensity,0,1);
    const base=250+i*210+random(-22,22);
    tone(base,0,.055,.006+i*.005,'sine',base*1.28);
    if(Math.random()<.42) noiseBurst(0,.035,.0025+i*.002,1200+i*900,1.5);
  }

  function playDecisionPulse(stage=0){
    if(!audioArmed) return;
    const roots=[92,116,138,174];
    const f=roots[Math.max(0,Math.min(3,stage))];
    tone(f,0,.18,.025,'sine',f*.9);
    tone(f*2,.025,.11,.009,'triangle',f*2.16);
    noiseBurst(.01,.07,.0035,700+stage*260,.9);
  }

  function playTradeSound(win){
    if(!audioArmed) return;
    tone(54,0,.24,.065,'sine',42);
    noiseBurst(0,.085,.012,360,1.05);
    tone(112,.035,.16,.022,'triangle',94);

    if(win){
      tone(196,.12,.24,.022,'sine',247);
      tone(294,.22,.26,.018,'sine',392);
      tone(494,.31,.20,.010,'triangle',587);
    }else{
      tone(164,.12,.28,.024,'sine',116);
      tone(98,.23,.30,.022,'triangle',66);
      noiseBurst(.16,.12,.006,250,.8);
    }
  }
