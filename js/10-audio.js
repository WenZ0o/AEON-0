// ---------- AUDIO ----------
  function armAudio(){
    if(audioArmed) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();
    audioArmed = true;
    $('audioHint').textContent = 'AUDIO ARMED // SYNTH BUS ONLINE';
    $('audioHint').style.color = '#8ff0ad';
    playBootTone();
  }
  document.addEventListener('pointerdown', armAudio, {once:true});

  function tone(freq, start, duration, gain, type='sine', endFreq=null){
    if(!audioArmed || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const t0 = audioCtx.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if(endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq), t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t0 + duration + 0.03);
  }
  function playBootTone(){
    tone(92,0,.22,.05,'sine',138);
    tone(280,.08,.18,.025,'triangle',420);
    tone(740,.19,.08,.018,'square',920);
  }
  function playNeuralTick(intensity=1){
    if(!audioArmed) return;
    const base = 820 + intensity*480;
    tone(base,0,.035,.008 + intensity*.005,'square',base*1.18);
  }
  function playTradeSound(win){
    if(!audioArmed) return;
    tone(72,0,.16,.055,'square',58);
    tone(980,.04,.045,.018,'square',730);
    tone(win?420:340,.11,.18,.036,'sine',win?690:220);
    tone(win?790:190,.22,.22,.022,'triangle',win?1060:120);
  }
