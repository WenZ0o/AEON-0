// ---------- CANVAS CHART ----------
  const chart = $('chartCanvas');
  const chartCtx = chart.getContext('2d');
  let hoverX = null;
  function resizeChart(){
    const r = chart.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio,2);
    chart.width = Math.max(10,Math.floor(r.width*dpr)); chart.height = Math.max(10,Math.floor(r.height*dpr));
    chartCtx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize',resizeChart); resizeChart();

  $('chartWrap').addEventListener('pointermove',(e)=>{
    const rect = chart.getBoundingClientRect();
    hoverX = clamp(e.clientX-rect.left,0,rect.width);
    const idx = Math.round((hoverX/rect.width)*(market.points.length-1));
    const value = market.points[idx];
    const read = $('hoverReadout');
    read.style.display='block'; read.style.left=(e.clientX-rect.left+10)+'px'; read.style.top=(e.clientY-rect.top+10)+'px';
    read.textContent='INDEX '+String(idx).padStart(3,'0')+' // $'+value.toFixed(2);
  });
  $('chartWrap').addEventListener('pointerleave',()=>{hoverX=null;$('hoverReadout').style.display='none';});

  function drawChart(){
    const r = chart.getBoundingClientRect(), w=r.width, h=r.height;
    const ctx = chartCtx; ctx.clearRect(0,0,w,h);
    const padL=10,padR=8,padT=12,padB=12;
    const pts = market.points;
    let min = Math.min(...pts), max = Math.max(...pts); const span=Math.max(.5,max-min); min-=span*.18; max+=span*.18;

    ctx.lineWidth=1; ctx.strokeStyle='rgba(120,55,72,.20)';
    for(let i=0;i<5;i++){const y=padT+(h-padT-padB)*(i/4);ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();}
    for(let i=0;i<7;i++){const x=padL+(w-padL-padR)*(i/6);ctx.beginPath();ctx.moveTo(x,padT);ctx.lineTo(x,h-padB);ctx.stroke();}

    const coords = pts.map((v,i)=>({x:padL+(w-padL-padR)*(i/(pts.length-1)),y:padT+(h-padT-padB)*(1-(v-min)/(max-min))}));
    const grad=ctx.createLinearGradient(0,padT,0,h-padB);grad.addColorStop(0,'rgba(255,52,99,.22)');grad.addColorStop(1,'rgba(255,52,99,0)');
    ctx.beginPath();ctx.moveTo(coords[0].x,h-padB);coords.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(coords[coords.length-1].x,h-padB);ctx.closePath();ctx.fillStyle=grad;ctx.fill();

    ctx.beginPath();coords.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='rgba(255,74,113,.95)';ctx.lineWidth=1.5;ctx.shadowColor='rgba(255,40,93,.55)';ctx.shadowBlur=9;ctx.stroke();ctx.shadowBlur=0;

    const end=coords[coords.length-1];ctx.beginPath();ctx.arc(end.x,end.y,3.2,0,Math.PI*2);ctx.fillStyle='#ff87a0';ctx.shadowColor='#ff315f';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;

    if(hoverX!==null){
      ctx.strokeStyle='rgba(255,210,220,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(hoverX,padT);ctx.lineTo(hoverX,h-padB);ctx.stroke();
    }
  }
