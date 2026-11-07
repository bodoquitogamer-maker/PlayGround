(() => {
  'use strict';
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const mapCanvas = document.getElementById('minimap');
  const mapCtx = mapCanvas.getContext('2d');
  const W = 100, H = 100, TILE = 44;
  const keys = new Set();
  const player = { x: 52.1, y: 54.2, dx: 1, dy: 0, hunger: 82, thirst: 76, energy: 94, moving: false, swim: false };
  const state = { started: false, paused: false, map: false, time: 0.23, day: 1, seconds: 0, last: 0, toastTimer: 0, waterFound: false, canalFound: false, foodFound: false, homeFound: false, sound: false, discovered: new Set(), inventory: { berries: 0, fish: 0, bugs: 0, feathers: 0 }, collected: new Set() };
  const locations = [
    { name: 'Juniper’s Porch', x: 52, y: 55, icon: '⌂', desc: 'A familiar little starting place' },
    { name: 'Canal de las Garzas', x: 49, y: 27, icon: '≈', desc: 'The water road, full of life' },
    { name: 'La Laguna', x: 25, y: 45, icon: '◉', desc: 'A cool, quiet place to drink' },
    { name: 'The Green Rows', x: 80, y: 52, icon: '✳', desc: 'Fields that reach the horizon' },
    { name: 'Coyote Hills', x: 13, y: 67, icon: '⌃', desc: 'Wind-carved paths and high views' },
    { name: 'The Saltgrass Marsh', x: 67, y: 13, icon: '♧', desc: 'Reeds whisper over shallow water' },
    { name: 'Sunset Flats', x: 44, y: 88, icon: '☼', desc: 'Warm stones, long shadows' },
    { name: 'Old Fig Tree', x: 61, y: 39, icon: '♣', desc: 'A generous patch of shade' }
  ];
  // The setting is an original, fictionalized landscape inspired by the Sonoran region—not a replica of a real home or street.
  const houses = [
    {x:46,y:49,w:4,h:3,color:'#d8b98a',roof:'#a75f48'}, {x:54,y:49,w:4,h:3,color:'#e6c997',roof:'#ad6a4e'},
    {x:41,y:55,w:4,h:3,color:'#cfae7b',roof:'#9c5946'}, {x:59,y:55,w:4,h:3,color:'#e2c99e',roof:'#ad7050'},
    {x:45,y:62,w:4,h:3,color:'#e2c599',roof:'#98604b'}, {x:55,y:63,w:4,h:3,color:'#d3b88a',roof:'#a9664a'},
    {x:36,y:44,w:4,h:3,color:'#d8c49c',roof:'#a7654a'}, {x:63,y:46,w:4,h:3,color:'#dac095',roof:'#a86148'},
    {x:70,y:42,w:4,h:3,color:'#d8bd8c',roof:'#9c6047'}, {x:73,y:62,w:4,h:3,color:'#ddc89e',roof:'#a5664b'}
  ];
  const resources = [];
  const fixedResources = [
    ['berries',39,57],['berries',57,35],['berries',34,48],['berries',63,72],['berries',74,32],['berries',18,54],['berries',86,65],['berries',48,82],
    ['fish',25,44],['fish',23,46],['fish',50,27],['fish',56,27],['fish',68,16],['fish',71,15],
    ['bugs',44,69],['bugs',79,70],['bugs',31,72],['bugs',89,48],['bugs',59,41],['bugs',14,76],
    ['feathers',41,30],['feathers',75,23],['feathers',21,61],['feathers',83,57]
  ];
  fixedResources.forEach((r,i)=>resources.push({type:r[0],x:r[1],y:r[2],id:`r${i}`}));
  const colors = { grass:'#9daa78', grass2:'#a8b681', town:'#c5b88c', field:'#a8aa71', desert:'#d2ad77', rock:'#969475', water:'#73aaa0', wet:'#88aa87', marsh:'#8da67d' };
  let viewW=800, viewH=600, dpr=1, toastTimeout;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function hash(x,y){let n=(x*374761393+y*668265263)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295;}
  function terrain(x,y){
    if(x<0||y<0||x>=W||y>=H)return 'rock';
    const canalY=27+Math.sin(x*.16)*1.35+Math.sin(x*.043)*1.5;
    if(Math.abs(y-canalY)<2.05) return 'water';
    const lx=(x-25)/9, ly=(y-45)/5.5;
    if(lx*lx+ly*ly<1) return 'water';
    const px=71+Math.sin(y*.19)*2;
    if(Math.abs(x-px)<1.1 && y>32&&y<75) return 'water';
    if(y<20&&x>37&&x<81){return hash(x,y)>.36?'marsh':'wet';}
    if(x<20 && y>55){return hash(x,y)>.46?'rock':'desert';}
    if(y>76)return hash(x,y)>.16?'desert':'grass';
    if(x>67&&y>31&&y<76)return 'field';
    if(x>32&&x<68&&y>34&&y<74)return 'town';
    if(x<27&&y<77)return hash(x,y)>.75?'rock':'grass';
    return hash(x,y)>.62?'grass2':'grass';
  }
  function isHouse(x,y){return houses.some(h=>x>=h.x-.35&&x<=h.x+h.w+.2&&y>=h.y-.25&&y<=h.y+h.h+.2);}
  function blocked(x,y){if(x<.6||y<.6||x>W-.6||y>H-.6||isHouse(x,y))return true;const t=terrain(Math.floor(x),Math.floor(y));if(t==='rock'&&hash(Math.floor(x),Math.floor(y))>.74)return true;return false;}
  function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);viewW=Math.max(1,r.width);viewH=Math.max(1,r.height);canvas.width=Math.round(viewW*dpr);canvas.height=Math.round(viewH*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);drawMap();}
  function drawTile(tx,ty,sx,sy){
    const t=terrain(tx,ty), c=colors[t]||colors.grass, h=hash(tx,ty);
    ctx.fillStyle=c;ctx.fillRect(sx,sy,TILE+1,TILE+1);
    if(t==='water'){
      ctx.fillStyle='#c2dfc0';for(let i=0;i<2;i++){let px=sx+((h*53+i*27)%TILE),py=sy+((h*31+i*19)%TILE);ctx.fillRect(px,py,8+(i*3),1.5);}
      if(h>.73){ctx.fillStyle='#d2e8c2';ctx.fillRect(sx+7,sy+31,5,2);}
    } else if(t==='rock'){
      ctx.fillStyle='#777b65';ctx.globalAlpha=.22;ctx.fillRect(sx+8,sy+8,17,8);ctx.fillRect(sx+27,sy+26,10,6);ctx.globalAlpha=1;
    } else if(t==='field'){
      ctx.strokeStyle='#7e8959';ctx.globalAlpha=.28;ctx.lineWidth=1;
      for(let i=7;i<TILE;i+=10){ctx.beginPath();ctx.moveTo(sx+i,sy+2);ctx.lineTo(sx+i,sy+TILE);ctx.stroke();}ctx.globalAlpha=1;
    } else {
      ctx.fillStyle=t==='desert'?'#f0d093':'#617d58';ctx.globalAlpha=t==='desert'?.27:.22;
      for(let i=0;i<3;i++){const px=sx+hash(tx+i*7,ty+3)*TILE,py=sy+hash(tx+2,ty+i*13)*TILE;ctx.fillRect(px,py,2,2);}ctx.globalAlpha=1;
      if(t==='marsh'&&h>.48){ctx.strokeStyle='#66845f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx+15,sy+35);ctx.lineTo(sx+17,sy+23);ctx.lineTo(sx+20,sy+18);ctx.moveTo(sx+29,sy+38);ctx.lineTo(sx+28,sy+26);ctx.stroke();}
    }
  }
  function drawTree(x,y,s=1){
    const cx=x,cy=y;
    ctx.fillStyle='#344b39';ctx.beginPath();ctx.ellipse(cx,cy+8*s,10*s,4*s,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#745d3d';ctx.fillRect(cx-2*s,cy-2*s,4*s,10*s);
    ctx.fillStyle='#526e4a';ctx.beginPath();ctx.arc(cx,cy-5*s,9*s,0,Math.PI*2);ctx.arc(cx-6*s,cy-2*s,6*s,0,Math.PI*2);ctx.arc(cx+6*s,cy-1*s,6*s,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#78905b';ctx.beginPath();ctx.arc(cx-3*s,cy-8*s,4*s,0,Math.PI*2);ctx.fill();
  }
  function drawHouse(h,ox,oy){
    const x=ox+h.x*TILE,y=oy+h.y*TILE,w=h.w*TILE,hh=h.h*TILE;
    ctx.fillStyle='#4e4e3b55';ctx.fillRect(x+4,y+hh-2,w,9);
    ctx.fillStyle=h.color;ctx.fillRect(x,y+13,w,hh-13);
    ctx.fillStyle=h.roof;ctx.beginPath();ctx.moveTo(x-5,y+18);ctx.lineTo(x+w*.5,y-5);ctx.lineTo(x+w+5,y+18);ctx.closePath();ctx.fill();
    ctx.fillStyle='#e3d4ad';ctx.fillRect(x+w*.5-7,y+hh-22,14,22);
    ctx.fillStyle='#68847b';ctx.fillRect(x+12,y+27,13,11);ctx.fillRect(x+w-25,y+27,13,11);
    ctx.strokeStyle='#ead9ae';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+18,y+27);ctx.lineTo(x+18,y+38);ctx.moveTo(x+12,y+32);ctx.lineTo(x+25,y+32);ctx.stroke();
  }
  function drawResource(r,ox,oy){if(state.collected.has(r.id))return;const x=ox+(r.x+.5)*TILE,y=oy+(r.y+.5)*TILE;
    if(r.type==='berries'){ctx.fillStyle='#62734b';ctx.beginPath();ctx.arc(x,y+3,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c67565';ctx.beginPath();ctx.arc(x-3,y+1,2,0,6.3);ctx.arc(x+2,y-2,2,0,6.3);ctx.arc(x+3,y+4,2,0,6.3);ctx.fill();}
    else if(r.type==='fish'){ctx.fillStyle='#f0cb83';ctx.beginPath();ctx.ellipse(x,y,5,2.4,-.2,0,6.3);ctx.moveTo(x+4,y);ctx.lineTo(x+8,y-4);ctx.lineTo(x+8,y+4);ctx.fill();}
    else if(r.type==='bugs'){ctx.fillStyle='#e5cb77';ctx.beginPath();ctx.ellipse(x,y,3,2,0,0,6.3);ctx.fill();}
    else {ctx.fillStyle='#f5eee0';ctx.beginPath();ctx.ellipse(x,y,2,7,.55,0,6.3);ctx.fill();}
  }
  function drawCat(x,y,now){
    const bob=player.moving?Math.sin(now*.018)*1.6:Math.sin(now*.003)*.6;
    ctx.save();ctx.translate(x,y+bob);ctx.rotate(Math.atan2(player.dy,player.dx)+Math.PI/2);
    // soft little shadow
    ctx.fillStyle='#2d392c55';ctx.beginPath();ctx.ellipse(0,7,11,5,0,0,Math.PI*2);ctx.fill();
    // tail
    ctx.strokeStyle='#d8a76a';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,7);ctx.quadraticCurveTo(-10,16,2,17+Math.sin(now*.012)*2);ctx.stroke();
    // body
    ctx.fillStyle='#e7c18e';ctx.beginPath();ctx.ellipse(0,2,7,11,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c88c58';ctx.beginPath();ctx.ellipse(-3,1,2.2,5,-.35,0,Math.PI*2);ctx.ellipse(3,5,2,4,.3,0,Math.PI*2);ctx.fill();
    // head and ears
    ctx.fillStyle='#e9c38f';ctx.beginPath();ctx.arc(0,-8,8,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(-7,-12);ctx.lineTo(-8,-20);ctx.lineTo(-1,-15);ctx.moveTo(7,-12);ctx.lineTo(8,-20);ctx.lineTo(1,-15);ctx.fill();
    ctx.fillStyle='#bd755f';ctx.beginPath();ctx.moveTo(-6,-14);ctx.lineTo(-7,-18);ctx.lineTo(-3,-15);ctx.moveTo(6,-14);ctx.lineTo(7,-18);ctx.lineTo(3,-15);ctx.fill();
    ctx.fillStyle='#405644';ctx.beginPath();ctx.arc(-3,-8,1,0,6.3);ctx.arc(3,-8,1,0,6.3);ctx.fill();ctx.fillStyle='#ae7655';ctx.fillRect(-1,-5,2,1.5);
    ctx.restore();
  }
  function draw(now=0){
    if(!viewW||!viewH)return;ctx.clearRect(0,0,viewW,viewH);
    const ox=viewW/2-player.x*TILE, oy=viewH/2-player.y*TILE;
    const x0=Math.max(0,Math.floor((player.x-viewW/(2*TILE)))-1), x1=Math.min(W,Math.ceil(player.x+viewW/(2*TILE))+1);
    const y0=Math.max(0,Math.floor(player.y-viewH/(2*TILE))-1), y1=Math.min(H,Math.ceil(player.y+viewH/(2*TILE))+1);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)drawTile(x,y,ox+x*TILE,oy+y*TILE);
    // Natural landmarks and small scenery. Fixed coordinate hash makes the world repeatable.
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const t=terrain(x,y),v=hash(x+311,y+871),sx=ox+(x+.5)*TILE,sy=oy+(y+.52)*TILE;
      if(t==='grass'||t==='grass2'||t==='rock'||t==='wet'||t==='marsh'){
        const chance=t==='wet'||t==='marsh'?.075:(t==='rock'?.14:.052);
        if(v<chance && !isHouse(x,y) && !(Math.abs(x-player.x)<1&&Math.abs(y-player.y)<1))drawTree(sx,sy, t==='rock'?.78:.8+hash(x,y)*.28);
      }
      if(t==='desert'&&v<.04){ctx.fillStyle='#7f885b';ctx.beginPath();ctx.ellipse(sx,sy,7,3,0,0,6.3);ctx.fill();ctx.fillStyle='#718153';ctx.fillRect(sx-1,sy-7,2,8);}
    }
    houses.forEach(h=>drawHouse(h,ox,oy));
    resources.forEach(r=>drawResource(r,ox,oy));
    // Porch path and gate outside Juniper's fictional home
    ctx.fillStyle='#d5bd8d';ctx.fillRect(ox+51*TILE,oy+52*TILE,TILE*2,TILE*2);
    ctx.fillStyle='#846d4f';ctx.fillRect(ox+51.8*TILE,oy+53.3*TILE,2,8);ctx.fillRect(ox+53.4*TILE,oy+53.3*TILE,2,8);
    if(player.swim){ctx.strokeStyle='#dcf3d9aa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(viewW/2,viewH/2+13,13,4,0,0,6.3);ctx.stroke();}
    drawCat(viewW/2,viewH/2,now);
    const darkness=Math.max(0,Math.sin((state.time-.25)*Math.PI*2))*.33;
    if(darkness>.01){ctx.fillStyle=`rgba(26,41,53,${darkness})`;ctx.fillRect(0,0,viewW,viewH);}
  }
  function drawMap(){if(!mapCtx)return;const s=mapCanvas.width/W;for(let y=0;y<H;y++)for(let x=0;x<W;x++){let t=terrain(x,y);mapCtx.fillStyle=colors[t]||colors.grass;mapCtx.fillRect(x*s,y*s,s+.2,s+.2);}
    locations.forEach((p,i)=>{mapCtx.fillStyle=state.discovered.has(i)?'#fff5cd':'#52614a';mapCtx.beginPath();mapCtx.arc((p.x+.5)*s,(p.y+.5)*s,state.discovered.has(i)?2.4:1.6,0,6.3);mapCtx.fill();});
    mapCtx.fillStyle='#bd704d';mapCtx.beginPath();mapCtx.arc((player.x+.5)*s,(player.y+.5)*s,3,0,6.3);mapCtx.fill();mapCtx.strokeStyle='#fff';mapCtx.lineWidth=1;mapCtx.stroke();
  }
  function showToast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2100);}
  function labelArea(){const p=player;let nearest=locations[0],dist=999;locations.forEach((l,i)=>{let d=Math.hypot(p.x-l.x,p.y-l.y);if(d<dist){dist=d;nearest=l;if(d<5&&!state.discovered.has(i)){state.discovered.add(i);showToast(`New place found · ${l.name}`);drawMap();}}});
    let area=nearest.name;if(dist>13){if(p.y<22)area='The northern marsh';else if(p.x>68&&p.y<77)area='The Green Rows';else if(p.y>76)area='Sunset Flats';else if(p.x<24)area='Coyote Hills';else area='The open country';}
    document.getElementById('locationName').textContent=area;
    document.getElementById('sceneLabel').innerHTML=`<span class="scene-mark">✦</span><span><b>${area.toUpperCase()}</b><small>${nearest.desc}</small></span>`;
    document.getElementById('coordText').textContent=`${String(Math.round(p.x)).padStart(2,'0')}° N · ${String(Math.round(p.y)).padStart(2,'0')}° E · THE WORLD IS WIDE`;
  }
  function updateJournal(){const tasks=[{ok:state.waterFound,text:'Find a sip of fresh water'},{ok:state.foodFound,text:'Find a little something to eat'},{ok:state.canalFound,text:'Follow the canal to the reeds'},{ok:state.homeFound,text:'Remember where your porch is'}];
    document.getElementById('journalList').innerHTML=tasks.map(t=>`<div class="journal-item ${t.ok?'done':''}"><span class="journal-check">${t.ok?'✓':''}</span><span class="journal-text">${t.text}</span></div>`).join('');document.getElementById('journalCount').textContent=`${tasks.filter(t=>t.ok).length} / ${tasks.length}`;
    const names={berries:['🍒','Berries'],fish:['🐟','Fish'],bugs:['🪲','Bugs'],feathers:['🪶','Feathers']};let sum=0;let items=Object.entries(state.inventory).filter(([,n])=>n>0);items.forEach(([,n])=>sum+=n);document.getElementById('inventoryTotal').textContent=sum;
    document.getElementById('inventoryList').innerHTML=items.length?items.map(([k,n])=>`<div class="item-chip"><span>${names[k][0]}</span>${names[k][1]}<b>×${n}</b></div>`).join(''):'<div class="empty-inventory">Nothing yet — the world is full of little things.</div>';
  }
  function updateNeeds(){[['hunger','hungerBar','hungerValue'],['thirst','thirstBar','thirstValue'],['energy','energyBar','energyValue']].forEach(([k,b,v])=>{document.getElementById(b).style.width=`${player[k]}%`;document.getElementById(v).textContent=Math.round(player[k]);});
    const mood=player.thirst<25?'A little parched. Find water.':player.hunger<25?'A hungry little explorer.':player.energy<25?'A shady nap sounds lovely.':player.swim?'Making a splash, quite happily.':player.hunger>70?'Curious as a cricket.':'Following the interesting smells.';document.getElementById('moodText').textContent=mood;
  }
  function interact(){if(!state.started||state.paused)return;
    // Nearby items first, with a gentle radius so a tap works on touch devices.
    const nearby=resources.filter(r=>!state.collected.has(r.id)).map(r=>({r,d:Math.hypot(r.x+.5-player.x,r.y+.5-player.y)})).filter(a=>a.d<1.65).sort((a,b)=>a.d-b.d)[0];
    if(nearby){const r=nearby.r;state.collected.add(r.id);state.inventory[r.type]++;if(r.type==='berries'){player.hunger=Math.min(100,player.hunger+20);state.foodFound=true;showToast('Sweet berries · Juniper has a snack.');}else if(r.type==='fish'){player.hunger=Math.min(100,player.hunger+30);state.foodFound=true;showToast('A shiny fish · excellent hunting, Juniper.');}else if(r.type==='bugs'){player.hunger=Math.min(100,player.hunger+11);state.foodFound=true;showToast('Crunchy little bug · nature’s snack.');}else showToast('A soft feather for the collection.');updateJournal();updateNeeds();return;}
    const nearWater=terrain(Math.floor(player.x),Math.floor(player.y))==='water'||Array.from({length:8},(_,i)=>terrain(Math.floor(player.x+Math.cos(i*Math.PI/4)),Math.floor(player.y+Math.sin(i*Math.PI/4)))).includes('water');
    if(nearWater){player.thirst=Math.min(100,player.thirst+38);state.waterFound=true;showToast('Cool, fresh water · take your time.');updateJournal();updateNeeds();return;}
    const atHome=Math.hypot(player.x-52.7,player.y-55.4)<5;
    if(atHome){player.energy=Math.min(100,player.energy+34);state.homeFound=true;showToast('A little rest on the porch. Safe and sound.');updateJournal();updateNeeds();return;}
    const shade=locations.some(l=>l.name==='Old Fig Tree'&&Math.hypot(player.x-l.x,player.y-l.y)<3.5);
    if(shade){player.energy=Math.min(100,player.energy+28);showToast('Juniper curls up in the fig tree’s shade.');updateNeeds();return;}
    showToast('A little sniff around… try the bushes, water, or porch.');
  }
  function tick(dt){if(!state.started||state.paused)return;
    state.seconds+=dt;state.time=(state.time+dt/420)%1;if(state.time<.001)state.day++;
    const hour=state.time*24;const period=hour<5?'NIGHT':hour<10?'DAWN':hour<17?'DAY':hour<20?'DUSK':'NIGHT';document.getElementById('dayLabel').textContent=`DAY ${state.day} · ${period}`;
    const t=terrain(Math.floor(player.x),Math.floor(player.y));player.swim=t==='water';
    const up=keys.has('ArrowUp')||keys.has('w')||keys.has('W'),down=keys.has('ArrowDown')||keys.has('s')||keys.has('S'),left=keys.has('ArrowLeft')||keys.has('a')||keys.has('A'),right=keys.has('ArrowRight')||keys.has('d')||keys.has('D');let vx=(right?1:0)-(left?1:0),vy=(down?1:0)-(up?1:0);const mag=Math.hypot(vx,vy);player.moving=mag>0;
    if(mag){vx/=mag;vy/=mag;player.dx=vx;player.dy=vy;const speed=(player.swim?2.55:3.25)*dt, nx=player.x+vx*speed,ny=player.y+vy*speed;
      if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;
      player.energy=Math.max(0,player.energy-dt*(player.swim?.035:.018));
    }else player.energy=Math.min(100,player.energy+dt*.11);
    player.hunger=Math.max(0,player.hunger-dt*.022);player.thirst=Math.max(0,player.thirst-dt*(player.swim?.025:.031));
    if(player.hunger===0||player.thirst===0){player.energy=Math.max(0,player.energy-dt*.08);}
    if(player.energy===0){player.x=52.1;player.y=54.2;player.energy=58;player.hunger=Math.max(player.hunger,22);player.thirst=Math.max(player.thirst,22);showToast('Juniper snoozed safely and woke near home.');}
    labelArea();updateNeeds();
    if(state.seconds>360){state.seconds=0;}
  }
  let lastFrame=0;
  function loop(now){if(!state.started)return;const dt=Math.min(.05,(now-lastFrame)/1000||0);lastFrame=now;tick(dt);draw(now);requestAnimationFrame(loop);}
  function begin(){if(state.started)return;state.started=true;document.getElementById('startOverlay').style.display='none';state.discovered.add(0);labelArea();updateJournal();updateNeeds();lastFrame=performance.now();requestAnimationFrame(loop);}
  function toggleMap(){state.map=!state.map;const el=document.getElementById('mapOverlay');el.classList.toggle('open',state.map);el.setAttribute('aria-hidden',String(!state.map));drawMap();}
  function togglePause(){if(!state.started)return;state.paused=!state.paused;document.getElementById('pauseBadge').classList.toggle('show',state.paused);if(!state.paused)lastFrame=performance.now();}
  document.getElementById('startButton').addEventListener('click',begin);
  document.getElementById('mapButton').addEventListener('click',toggleMap);
  document.getElementById('soundButton').addEventListener('click',()=>{state.sound=!state.sound;document.getElementById('soundButton').textContent=state.sound?'♫':'♩';showToast(state.sound?'Birdsong turned on in your imagination.':'Quiet mode. Just the breeze.');});
  document.getElementById('mobileAction').addEventListener('pointerdown',e=>{e.preventDefault();interact();});
  document.querySelectorAll('.pad').forEach(button=>{const dir=button.dataset.dir;const map={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(map[dir]);});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>button.addEventListener(ev,()=>keys.delete(map[dir])));});
  document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.repeat)return;if(e.key===' '||e.key==='e'||e.key==='E')interact();else if(e.key==='m'||e.key==='M')toggleMap();else if(e.key==='Escape'||e.key==='p'||e.key==='P')togglePause();else keys.add(e.key);});
  document.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>keys.clear());window.addEventListener('resize',resize);
  resize();draw(performance.now());updateJournal();updateNeeds();
})();
