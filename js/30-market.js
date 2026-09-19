// ---------- SYNTHETIC MARKET ----------
  const market = {
    price:100,
    open:100,
    points:[],
    velocity:0,
    volatility:.18,
    momentum:0,
    regime:'CALM',
    lastShock:0,
    shock:0
  };
  for(let i=0;i<130;i++) market.points.push(100 + Math.sin(i*.11)*.3 + normalRandom()*.06);
  market.price = market.points[market.points.length-1];
  market.open = market.points[0];

  function updateMarket(){
    const now = performance.now();
    if(now-market.lastShock > random(2800,6500) && Math.random()<.035){
      market.shock = normalRandom()*random(.22,.52);
      market.lastShock = now;
    }
    market.shock *= .91;
    const regimeNoise = normalRandom() * (.025 + market.volatility*.042);
    market.velocity = market.velocity*.84 + regimeNoise + market.shock*.055;
    market.velocity = clamp(market.velocity,-.42,.42);
    market.price = Math.max(18, market.price + market.velocity);
    market.points.push(market.price);
    if(market.points.length>150) market.points.shift();

    let mom = 0;
    const p = market.points;
    if(p.length>12) mom = p[p.length-1]-p[p.length-12];
    market.momentum = lerp(market.momentum,mom,.18);
    market.volatility = lerp(market.volatility, clamp(Math.abs(market.velocity)*2.8 + Math.abs(market.shock)*1.2,.08,1.4), .12);
    market.regime = market.volatility>.78?'TURBULENT':market.volatility>.42?'ACTIVE':'CALM';

    const absMove = Math.abs(market.velocity);
    neuralTension = lerp(neuralTension, clamp(.16 + market.volatility*.46 + absMove*.35,0,1), .06);
    if(absMove>.12 && Math.random()<.44){
      spawnMarketImpulse(absMove,Math.sign(market.velocity));
    }

    updateMarketUI();
  }
  setInterval(updateMarket,140);

  function updateMarketUI(){
    const pct = ((market.price-market.open)/market.open)*100;
    $('chartPrice').textContent = '$'+market.price.toFixed(2);
    $('chartChange').textContent = (pct>=0?'+':'')+pct.toFixed(2)+'%';
    $('chartChange').className = 'chart-change '+(pct>=0?'positive':'negative');
    $('marketRegime').textContent = 'REGIME: '+market.regime;
    $('volatilityReadout').textContent = 'VOL '+market.volatility.toFixed(2);
    $('momentumReadout').textContent = 'MOM '+(market.momentum>=0?'+':'')+market.momentum.toFixed(2);
  }
