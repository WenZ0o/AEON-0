// ---------- DECISION + TRADING SIMULATION ----------
  const steps=[$('step0'),$('step1'),$('step2'),$('step3')];
  function resetSteps(){steps.forEach(s=>s.className='step');currentDecisionStage=-1;}
  function setStep(index){
    currentDecisionStage=index;
    steps.forEach((s,i)=>s.className='step '+(i<index?'complete':i===index?'active':''));
  }
  function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

  async function runDecisionSequence(){
    if(executing)return;
    executing=true;
    const id=tradeId+1;
    const signalStrength=clamp(market.volatility*.68+Math.abs(market.momentum)*.11+random(.05,.28),.12,.98);
    const risk=clamp(.18+market.volatility*.33+random(-.05,.16),.12,.82);
    const biasScore=market.momentum+normalRandom()*.45;
    const side=biasScore>=0?'LONG':'SHORT';
    const confidence=clamp(.51+Math.abs(biasScore)*.08+signalStrength*.25+random(-.06,.08),.50,.94);
    const asset=choose(['BTC','ETH','SOL']);

    $('decisionId').textContent='TRACE // A0-'+String(id).padStart(4,'0');
    $('dSignal').textContent=signalStrength>.72?'SPIKE':signalStrength>.44?'ELEVATED':'WEAK';
    $('dRisk').textContent=risk.toFixed(2);
    $('dBias').textContent=side;
    $('dConf').textContent=(confidence*100).toFixed(0)+'%';

    const states=['SIGNAL CAPTURE...','RISK REVIEW...','POSITION SIZING...','EXECUTING...'];
    for(let i=0;i<4;i++){
      setStep(i); setCoreState(states[i]);
      fireNeuralBurst(.72+signalStrength*(i+1)*.21);
      await sleep(360+Math.random()*210);
    }

    executeTrade({asset,side,confidence,risk,signalStrength});
    await sleep(520);
    steps.forEach(s=>s.className='step complete');
    setCoreState('SETTLING SYNAPSES...');
    await sleep(720);
    resetSteps();
    $('decisionId').textContent='TRACE // IDLE';
    setCoreState('ANALYZING MARKET...');
    executing=false;
    nextTradeAt=performance.now()+random(4300,8500);
  }

  function executeTrade({asset,side,confidence,risk,signalStrength}){
    tradeId++;
    const leverage=Math.max(1,Math.min(5,Math.round(1+risk*4+random(-.5,.8))));
    const capitalFraction=clamp(.055+risk*.085+random(-.012,.024),.045,.16);
    const capital=Math.max(6,equity*capitalFraction);

    const aligned=(side==='LONG'&&market.momentum>=0)||(side==='SHORT'&&market.momentum<0);
    const winProbability=clamp(.48+(aligned?.09:-.035)+(confidence-.5)*.18-Math.max(0,market.volatility-.85)*.08,.35,.72);
    const win=Math.random()<winProbability;
    const magnitude=random(.016,.061)*leverage*(.72+signalStrength*.58);
    let pnl=capital*magnitude*(win?1:-random(.70,1.12));
    pnl=clamp(pnl,-equity*.14,equity*.20);
    equity=Math.max(18,equity+pnl);
    win?wins++:losses++;
    lastTradeFlash=performance.now();

    addLedgerRow({id:tradeId,asset,side,capital,leverage,win,pnl});
    updateKPIs();
    fireNeuralBurst(win?1.62:1.38);
  }

  function addLedgerRow(t){
    const body=$('ledgerBody');
    const row=document.createElement('tr');
    row.innerHTML=`<td class="trade-id">#${String(t.id).padStart(3,'0')}</td><td>${t.asset}/USD</td><td class="${t.side==='LONG'?'side-long':'side-short'}">${t.side}</td><td>${money(t.capital)}</td><td>${t.leverage.toFixed(1)}×</td><td class="${t.win?'status-win':'status-loss'}">${t.win?'WIN':'LOSS'}</td>`;
    body.prepend(row);
    while(body.children.length>5)body.lastElementChild.remove();
  }

  function updateKPIs(){
    const profit=equity-STARTING_CAPITAL,pct=(profit/STARTING_CAPITAL)*100,total=wins+losses;
    $('equityValue').textContent=money(equity);
    $('equityValue').className='kpi-value '+(profit>=0?'positive':'negative');
    $('equityFoot').textContent='MARK-TO-MODEL // '+total+' SETTLEMENT'+(total===1?'':'S');
    $('profitValue').textContent=(profit>=0?'+':'-')+money(profit);
    $('profitValue').className='kpi-value '+(profit>=0?'positive':'negative');
    $('profitFoot').textContent=(pct>=0?'+':'')+pct.toFixed(2)+'% SESSION RETURN';
    $('winRateValue').textContent=wins+'/'+total;
    $('winRateFoot').textContent=total?((wins/total)*100).toFixed(1)+'% REALIZED HIT RATE':'AWAITING EXECUTION DATA';
  }

  function setCoreState(text){$('coreState').textContent=text;$('statusFlicker').textContent=text;}
