(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 2200, H = 1500;
  const island = { x: 1100, y: 760, rx: 670, ry: 470 };
  const player = { x: 1060, y: 760, dir: 0, hp: 100, maxHp: 100, energy: 100, xp: 320, level: 8, cash: 12480, speed: 218, attackWait: 0, invuln: 0 };
  const crew = [
    { name:'Rin', x:980, y:705, color:'#69b5a7', hat:'#f2cf88', dir:0.6, speed:112, wait:0, skin:'#f2bd91', weapon:'staff' },
    { name:'Jax', x:1210, y:850, color:'#bf695a', hat:'#463945', dir:2.4, speed:98, wait:0, skin:'#d69772', weapon:'sword' },
    { name:'Miko', x:930, y:895, color:'#8082bb', hat:'#d9b870', dir:-1, speed:105, wait:0, skin:'#f0c99a', weapon:'staff' }
  ];
  let enemies = [];
  const cooldowns = { q:0, e:0, r:0, space:0 };
  let effects = [], drops = [], time = 0, toastTimer = 0, levelToastTimer = 0, swing = 0;
  let keys = {}, pointer = {x:0,y:0}, joystick = {x:0,y:0,active:false}, audioOn = false;
  let camera = {x:0,y:0}, viewW=innerWidth, viewH=innerHeight, dpr=1;
  const localId = Math.random().toString(36).slice(2, 9);
  const peers = new Map();
  const channel = ('BroadcastChannel' in window) ? new BroadcastChannel('fruitbound-windmill-v1') : null;
  let beaconTimer = 0;
  if (channel) {
    channel.onmessage = ({data}) => {
      if (!data || typeof data.id !== 'string' || data.id === localId) return;
      if (data.type === 'leave') {
        peers.delete(data.id);
        return;
      }
      if (data.type !== 'presence' || !Number.isFinite(data.x) || !Number.isFinite(data.y) || !Number.isFinite(data.dir)) return;
      peers.set(data.id, {
        x:clamp(data.x, 0, W), y:clamp(data.y, 0, H), dir:data.dir,
        name:typeof data.name === 'string' ? data.name.slice(0, 18) : 'Sailor',
        level:Number.isFinite(data.level) ? clamp(Math.floor(data.level), 1, 999) : 1,
        seen:performance.now()
      });
    };
    addEventListener('beforeunload', () => channel.postMessage({type:'leave', id:localId}));
  }
  const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const hash=(n)=>{let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
  function updatePresence(dt){
    for(const [id,peer] of peers)if(performance.now()-peer.seen>5500)peers.delete(id);
    if(!channel)return;
    beaconTimer+=dt;
    if(beaconTimer<.12)return;
    beaconTimer=0;
    channel.postMessage({type:'presence',id:localId,x:player.x,y:player.y,dir:player.dir,name:'Captain Kai',level:player.level});
  }
  function resize(){dpr=Math.min(devicePixelRatio||1,2);viewW=innerWidth;viewH=innerHeight;canvas.width=Math.floor(viewW*dpr);canvas.height=Math.floor(viewH*dpr);canvas.style.width=viewW+'px';canvas.style.height=viewH+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
  addEventListener('resize',resize); resize();
  const inIsland=(p,pad=0)=>{const dx=(p.x-island.x)/(island.rx-pad),dy=(p.y-island.y)/(island.ry-pad);return dx*dx+dy*dy<1};
  function randomLand(){for(let i=0;i<100;i++){let p={x:rand(island.x-island.rx*.78,island.x+island.rx*.78),y:rand(island.y-island.ry*.72,island.y+island.ry*.72)};if(inIsland(p,40))return p}return{x:island.x,y:island.y}}
  function addEnemy(){const p=randomLand();enemies.push({x:p.x,y:p.y,hp:3,maxHp:3,dir:rand(0,6.28),speed:rand(52,77),attack:0,stun:0,alive:true,skin:['#e4ad85','#cb916f','#e3b58f'][Math.floor(rand(0,3))],variant:Math.random()})}
  for(let i=0;i<7;i++)addEnemy();
  const islands=[{x:320,y:350,rx:160,ry:84},{x:1890,y:370,rx:205,ry:100},{x:1830,y:1130,rx:185,ry:102},{x:380,y:1190,rx:170,ry:91}];
  const trees=[];for(let i=0;i<42;i++){let p=randomLand();if(Math.hypot(p.x-island.x,p.y-island.y)>300)trees.push({...p,s:rand(.7,1.25),rot:rand(-.4,.4)})}
  function rounded(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
  function text(str,x,y,size,color,weight='600',align='center'){ctx.font=`${weight} ${size}px "DM Sans", sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(str,x,y)}
  function drawSea(){
    const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#1c8390');g.addColorStop(.42,'#167487');g.addColorStop(1,'#0d526d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // broad moving sea glints
    for(let i=0;i<92;i++){const x=(hash(i+1)*W+Math.sin(time*.22+i)*22),y=(hash(i+198)*H+Math.cos(time*.18+i)*18);ctx.globalAlpha=.12+.08*Math.sin(time+i);ctx.strokeStyle=i%4?'#a1dfce':'#f1d89e';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+12,y-3,x+27,y);ctx.stroke()}ctx.globalAlpha=1;
  }
  function drawIsland(){
    // soft outer reef and sandy shore
    ctx.save();ctx.translate(island.x,island.y);
    ctx.fillStyle='#267e80';ctx.beginPath();ctx.ellipse(0,0,island.rx+34,island.ry+30,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d5bc7b';ctx.beginPath();ctx.ellipse(0,0,island.rx+14,island.ry+13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#94b77d';ctx.beginPath();ctx.ellipse(0,0,island.rx,island.ry,0,0,Math.PI*2);ctx.fill();
    const land=ctx.createRadialGradient(-100,-150,40,0,0,740);land.addColorStop(0,'#a8c987');land.addColorStop(.72,'#86b779');land.addColorStop(1,'#679d72');ctx.fillStyle=land;ctx.beginPath();ctx.ellipse(0,0,island.rx-16,island.ry-15,0,0,Math.PI*2);ctx.fill();
    // soft grassy patches
    for(let i=0;i<34;i++){let a=hash(i+45)*Math.PI*2,r=Math.sqrt(hash(i+85))*.79;let x=Math.cos(a)*island.rx*r,y=Math.sin(a)*island.ry*r;ctx.globalAlpha=.12;ctx.fillStyle=i%2?'#e1d89d':'#3e846e';ctx.beginPath();ctx.ellipse(x,y,rand(14,32),rand(7,15),a,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    // village paths, winding around center
    ctx.lineCap='round';ctx.strokeStyle='#e2c789';ctx.lineWidth=37;ctx.beginPath();ctx.moveTo(-470,140);ctx.bezierCurveTo(-265,115,-260,-80,-80,-90);ctx.bezierCurveTo(100,-100,95,115,300,120);ctx.stroke();
    ctx.strokeStyle='#f0d7a2';ctx.lineWidth=3;ctx.globalAlpha=.3;ctx.stroke();ctx.globalAlpha=1;
    // central pond
    ctx.fillStyle='#69aeb0';ctx.beginPath();ctx.ellipse(-115,-10,79,49,-.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d7c88e';ctx.lineWidth=6;ctx.stroke();ctx.globalAlpha=.45;ctx.strokeStyle='#c2ead0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-120,-12,56,30,-.3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    ctx.restore();
    // rocks / little offshore keys
    islands.forEach((it,i)=>{ctx.fillStyle='#d2bc82';ctx.beginPath();ctx.ellipse(it.x,it.y,it.rx+7,it.ry+5,-.1,0,Math.PI*2);ctx.fill();ctx.fillStyle=i%2?'#7bae7d':'#83b683';ctx.beginPath();ctx.ellipse(it.x,it.y,it.rx,it.ry,-.1,0,Math.PI*2);ctx.fill();for(let j=0;j<3;j++){ctx.fillStyle='#5e966d';ctx.beginPath();ctx.arc(it.x+(j-1)*35,it.y+Math.sin(j)*18,13,0,7);ctx.fill()}});
  }
  function drawTree(t){ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.s,t.s);ctx.fillStyle='#2d574c';ctx.beginPath();ctx.ellipse(4,8,19,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8c6844';ctx.beginPath();ctx.ellipse(0,2,5,11,0,0,Math.PI*2);ctx.fill();for(let i=0;i<6;i++){let a=i*Math.PI/3+t.rot;ctx.fillStyle=['#427f5e','#4e9163','#35775a'][i%3];ctx.beginPath();ctx.ellipse(Math.cos(a)*13,Math.sin(a)*10-10,15,8,a,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#a9c874';ctx.beginPath();ctx.arc(-3,-13,5,0,7);ctx.fill();ctx.restore()}
  function drawHouse(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#55715b';ctx.fillRect(-34,4,68,43);ctx.fillStyle='#f0d99e';ctx.fillRect(-30,7,60,37);ctx.fillStyle='#b4694e';ctx.beginPath();ctx.moveTo(-41,9);ctx.lineTo(0,-24);ctx.lineTo(41,9);ctx.closePath();ctx.fill();ctx.fillStyle='#7b493c';ctx.fillRect(-8,24,16,20);ctx.fillStyle='#8bc1b4';ctx.fillRect(-25,17,11,11);ctx.fillRect(14,17,11,11);ctx.restore()}
  function drawRock(x,y,r){ctx.fillStyle='#65816e';ctx.beginPath();ctx.ellipse(x,y+5,r*1.1,r*.55,0,0,7);ctx.fill();ctx.fillStyle='#b1a77d';ctx.beginPath();ctx.ellipse(x,y,r,r*.65,-.15,0,7);ctx.fill()}
  function drawWorldProps(){
    // village huts
    drawHouse(930,495,.86);drawHouse(1320,590,.72);drawHouse(1390,920,.82);drawHouse(865,1045,.72);drawHouse(1130,1100,.62);
    // colorful village awnings and dock
    ctx.fillStyle='#8b6241';ctx.fillRect(1490,730,155,28);ctx.fillRect(1514,758,16,84);ctx.fillRect(1600,758,16,84);ctx.fillRect(1640,733,95,12);ctx.fillRect(1660,745,11,58);ctx.fillRect(1700,745,11,58);
    ctx.fillStyle='#bd7551';ctx.beginPath();ctx.moveTo(1490,730);ctx.lineTo(1530,700);ctx.lineTo(1605,700);ctx.lineTo(1645,730);ctx.closePath();ctx.fill();
    // trees under actors
    trees.forEach(drawTree);
    [[765,620,20],[1470,450,24],[1000,1090,17],[1280,440,17],[1450,1030,25],[750,850,14],[1210,500,12],[1060,440,13],[880,580,11],[1355,740,16]].forEach(p=>drawRock(...p));
    // flowers
    for(let i=0;i<36;i++){let p=randomFlower[i];ctx.fillStyle=['#f1d18d','#ed9c87','#e9e3b1'][i%3];ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(p.x,p.y,2.1,0,7);ctx.fill()}ctx.globalAlpha=1;
  }
  const randomFlower=Array.from({length:36},()=>randomLand());
  function drawCharacter(c,kind='crew'){
    const moving=c.moving||false;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.dir||0);
    // shadow
    ctx.fillStyle='#183f3b55';ctx.beginPath();ctx.ellipse(0,12,16,8,0,0,7);ctx.fill();
    if(kind==='enemy'&&c.stun>0){ctx.globalAlpha=.65+.35*Math.sin(time*25)}
    // legs and shoes
    ctx.fillStyle='#68493c';ctx.beginPath();ctx.ellipse(-6,8,4,7,-.12,0,7);ctx.ellipse(6,8,4,7,.12,0,7);ctx.fill();
    // torso, scarf, head
    ctx.fillStyle=c.color||'#d88756';ctx.beginPath();ctx.roundRect(-10,-5,20,19,6);ctx.fill();
    ctx.fillStyle=c.shirt||'#e5b66e';ctx.fillRect(-9,0,18,4);
    ctx.fillStyle=c.skin||'#eac09a';ctx.beginPath();ctx.arc(0,-12,9,0,7);ctx.fill();
    // hair / hats
    ctx.fillStyle=c.hat||'#473b37';ctx.beginPath();ctx.arc(0,-15,9,Math.PI,0);ctx.lineTo(10,-11);ctx.quadraticCurveTo(0,-6,-10,-11);ctx.closePath();ctx.fill();
    ctx.fillStyle='#3b3030';ctx.beginPath();ctx.arc(0,-13,7,Math.PI,Math.PI*2);ctx.fill();
    // arm and held weapon
    ctx.fillStyle=c.skin||'#eac09a';ctx.beginPath();ctx.arc(12,1,4,0,7);ctx.fill();
    if(kind==='enemy'){ctx.strokeStyle='#c7b9a2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(20,-12);ctx.stroke();ctx.strokeStyle='#654739';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(15,-7);ctx.lineTo(23,-15);ctx.stroke()}
    else{ctx.strokeStyle='#d8d1b3';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(13,-1);ctx.lineTo(23,-17);ctx.stroke();ctx.strokeStyle='#885c3d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(15,-4);ctx.lineTo(19,0);ctx.stroke()}
    if(kind==='player'||kind==='peer'){ctx.fillStyle=kind==='player'?'#efcd83':'#a9d8ff';ctx.beginPath();ctx.arc(0,-28,3,0,7);ctx.fill();ctx.strokeStyle=kind==='player'?'#ffdc8a':'#83c8ff';ctx.globalAlpha=.3;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,22+Math.sin(time*4)*2,0,7);ctx.stroke();ctx.globalAlpha=1}
    ctx.restore();
    if(kind==='enemy'){
      const d=dist(c,player);if(d<270){text('Bandit',c.x,c.y-31,9,'#fff4d5','700');rounded(c.x-16,c.y-25,32,3,2,'#18342d');rounded(c.x-16,c.y-25,32*(c.hp/c.maxHp),3,2,'#ef8068')}
    }else if(kind==='player'){text('CAPTAIN KAI',c.x,c.y-37,9,'#fff2c9','800');text('▼',c.x,c.y-42,7,'#ffd57d','800')}
    else if(kind==='peer'){text(`${c.name} · Lv.${c.level}`,c.x,c.y-37,9,'#d7efff','800');text('●',c.x,c.y-42,6,'#83c8ff','800')}
    else{text(c.name,c.x,c.y-30,9,'#eef5df','700')}
  }
  function drawFruit(f){ctx.save();ctx.translate(f.x,f.y+Math.sin(time*3+f.seed)*4);ctx.fillStyle='#163a3866';ctx.beginPath();ctx.ellipse(0,13,15,6,0,0,7);ctx.fill();ctx.shadowColor='#69ecc2';ctx.shadowBlur=18;const g=ctx.createRadialGradient(-4,-5,2,0,0,16);g.addColorStop(0,'#c7ffd7');g.addColorStop(.4,'#56c79b');g.addColorStop(1,'#287665');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#d1ba72';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(1,-10);ctx.quadraticCurveTo(5,-18,9,-14);ctx.stroke();ctx.fillStyle='#9dd780';ctx.beginPath();ctx.ellipse(8,-13,5,2,-.4,0,7);ctx.fill();ctx.restore();text('FRUIT',f.x,f.y-23,7,'#d7ffe5','800')}
  function drawEffects(){effects.forEach(e=>{let p=clamp(e.t/e.life,0,1);ctx.globalAlpha=1-p;if(e.type==='slash'){ctx.strokeStyle=e.color||'#fff0be';ctx.lineWidth=4*(1-p)+1;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(.4+p*.7),e.a-.8,e.a+.8);ctx.stroke()}else if(e.type==='beam'){ctx.strokeStyle=e.color||'#a7f5d2';ctx.lineWidth=14*(1-p)+2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.a)*e.r,e.y+Math.sin(e.a)*e.r);ctx.stroke();ctx.strokeStyle='#fff9d9';ctx.lineWidth=3;ctx.stroke()}else if(e.type==='burst'){ctx.fillStyle=e.color||'#afeed1';ctx.beginPath();ctx.arc(e.x,e.y,e.r*p,0,7);ctx.fill()}else if(e.type==='spark'){ctx.fillStyle=e.color||'#ffe49b';ctx.beginPath();ctx.arc(e.x+e.vx*p,e.y+e.vy*p,3*(1-p),0,7);ctx.fill()}});ctx.globalAlpha=1}
  function tick(dt){time+=dt;player.attackWait=Math.max(0,player.attackWait-dt);player.invuln=Math.max(0,player.invuln-dt);player.energy=Math.min(100,player.energy+dt*13);Object.keys(cooldowns).forEach(k=>cooldowns[k]=Math.max(0,cooldowns[k]-dt));updatePresence(dt);
    let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joystick.x,dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joystick.y;let m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}if(m>.08){player.dir=Math.atan2(dy,dx);const nx=player.x+dx*player.speed*dt,ny=player.y+dy*player.speed*dt;const cand={x:nx,y:ny};if(inIsland(cand,24)){player.x=nx;player.y=ny}}
    crew.forEach((c,i)=>{c.wait-=dt;let target=enemies.filter(e=>e.alive).sort((a,b)=>dist(c,a)-dist(c,b))[0];if(target){let d=dist(c,target);if(d>52){let a=Math.atan2(target.y-c.y,target.x-c.x);c.dir=a;let nx=c.x+Math.cos(a)*c.speed*dt,ny=c.y+Math.sin(a)*c.speed*dt;if(inIsland({x:nx,y:ny},35)){c.x=nx;c.y=ny}}else if(c.wait<=0){c.wait=1.4+Math.random();target.hp-=1;effects.push({type:'slash',x:target.x,y:target.y,a:Math.atan2(target.y-c.y,target.x-c.x),r:24,t:0,life:.22,color:'#ffd18a'});if(target.hp<=0)killEnemy(target,false)}}else{if(Math.random()<.008){c.dir=rand(0,6.28)}let nx=c.x+Math.cos(c.dir)*20*dt,ny=c.y+Math.sin(c.dir)*20*dt;if(inIsland({x:nx,y:ny},30)){c.x=nx;c.y=ny}}});
    enemies.forEach(e=>{if(!e.alive)return;e.attack-=dt;e.stun=Math.max(0,e.stun-dt);let target=dist(e,player)<dist(e,crew[0])?player:crew.slice().sort((a,b)=>dist(e,a)-dist(e,b))[0];let d=dist(e,target);if(d<270&&e.stun<=0){let a=Math.atan2(target.y-e.y,target.x-e.x);e.dir=a;if(d>35){let nx=e.x+Math.cos(a)*e.speed*dt,ny=e.y+Math.sin(a)*e.speed*dt;if(inIsland({x:nx,y:ny},35)){e.x=nx;e.y=ny}}else if(e.attack<=0){e.attack=1.2;if(target===player){player.hp=Math.max(0,player.hp-9);player.invuln=.4;updateHUD();if(player.hp<=0)respawn()}else{target.x+=Math.cos(a)*9;target.y+=Math.sin(a)*9}}}});
    effects.forEach(e=>e.t+=dt);effects=effects.filter(e=>e.t<e.life);drops.forEach(f=>f.t+=dt);
    if(enemies.filter(e=>e.alive).length<5&&Math.random()<dt*.13)addEnemy();
    const camX=clamp(player.x-viewW/2,0,W-viewW),camY=clamp(player.y-viewH/2,0,H-viewH);camera.x=camX;camera.y=camY;
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)document.getElementById('toast').classList.remove('show')}
    if(levelToastTimer>0){levelToastTimer-=dt;if(levelToastTimer<=0)document.getElementById('levelToast').classList.remove('show')}
    updateHUD();
  }
  function render(){ctx.clearRect(0,0,viewW,viewH);ctx.save();ctx.translate(-camera.x,-camera.y);drawSea();drawIsland();drawWorldProps();
    drops.forEach(drawFruit);
    // sort by depth
    const actors=[...enemies.filter(e=>e.alive).map(e=>({o:e,k:'enemy'})),...crew.map(c=>({o:c,k:'crew'})),...Array.from(peers.values(),p=>({o:p,k:'peer'})),{o:player,k:'player'}].sort((a,b)=>a.o.y-b.o.y);actors.forEach(a=>drawCharacter(a.o,a.k));drawEffects();ctx.restore();
    requestAnimationFrame(loop);
  }
  function loop(now){const dt=Math.min(.035,(now-(loop.last||now))/1000);loop.last=now;tick(dt);render()}
  function nearest(range=330){return enemies.filter(e=>e.alive&&dist(e,player)<=range).sort((a,b)=>dist(a,player)-dist(b,player))[0]}
  function attack(){if(player.attackWait>0)return;player.attackWait=.42;swing=.22;let target=nearest(148);let a=target?Math.atan2(target.y-player.y,target.x-player.x):player.dir;player.dir=a;effects.push({type:'slash',x:player.x+Math.cos(a)*27,y:player.y+Math.sin(a)*27,a,r:43,t:0,life:.22});if(target){target.hp-=1;target.stun=.16;hitSparks(target.x,target.y);if(target.hp<=0)killEnemy(target,true)}playTone(300,.06)}
  function useAbility(which){if(which==='attack'){attack();return}if(which==='space'){if(cooldowns.space>0||player.energy<12)return;cooldowns.space=1.5;player.energy-=12;const a=player.dir;for(let n=0;n<12;n++){const nx=player.x+Math.cos(a)*24,ny=player.y+Math.sin(a)*24;if(!inIsland({x:nx,y:ny},22))break;player.x=nx;player.y=ny}effects.push({type:'burst',x:player.x,y:player.y,r:48,t:0,life:.28,color:'#a6eaf0'});return}
    if(cooldowns[which]>0)return;const data={q:{cost:10,cd:3.2,range:360,damage:2},e:{cost:26,cd:8,range:300,damage:4},r:{cost:34,cd:12,range:420,damage:5}}[which];if(player.energy<data.cost){toast('Not enough energy','Wait for your energy to recover');return}player.energy-=data.cost;cooldowns[which]=data.cd;const target=nearest(data.range);let a=target?Math.atan2(target.y-player.y,target.x-player.x):player.dir;player.dir=a;const range=target?Math.min(data.range,dist(target,player)):data.range;effects.push({type:'beam',x:player.x+Math.cos(a)*18,y:player.y+Math.sin(a)*18,a,r:range,t:0,life:which==='e'?.44:.3,color:which==='r'?'#ffcf86':'#9bf0d1'});if(which==='r'&&target){let nx=target.x-Math.cos(a)*40,ny=target.y-Math.sin(a)*40;if(inIsland({x:nx,y:ny},30)){player.x=nx;player.y=ny}}
    enemies.filter(e=>e.alive&&dist(e,player)<range+28&&Math.abs(angleDiff(Math.atan2(e.y-player.y,e.x-player.x),a))<(which==='e'?.65:.27)).forEach(e=>{e.hp-=data.damage;e.stun=.5;hitSparks(e.x,e.y);if(e.hp<=0)killEnemy(e,true)});playTone(which==='q'?540:which==='e'?440:220,.14);
  }
  function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
  function hitSparks(x,y){for(let i=0;i<6;i++){let a=rand(0,Math.PI*2),v=rand(25,85);effects.push({type:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,life:.3,color:['#fff0aa','#9bf0d1','#f8a56e'][i%3]})}}
  function killEnemy(e,credit){if(!e.alive)return;e.alive=false;effects.push({type:'burst',x:e.x,y:e.y,r:37,t:0,life:.35,color:'#f2b976'});if(credit){player.xp+=45;player.cash+=80;document.getElementById('cash').textContent=player.cash.toLocaleString();const killed=5-Number(document.getElementById('questCount').dataset.left||5);let q=Math.min(5,killed+1);document.getElementById('questCount').textContent=q+' / 5';document.getElementById('questCount').dataset.left=5-q;document.getElementById('questFill').style.width=(q*20)+'%';toast(q===5?'Quest complete!':'Bandit defeated!',q===5?'+1,250 ฿ &nbsp; +840 XP':'+45 XP &nbsp; +80 ฿');if(Math.random()<.16)drops.push({x:e.x,y:e.y,t:0,seed:rand(0,20)});if(player.xp>=500){player.xp-=500;player.level++;player.maxHp+=8;player.hp=player.maxHp;player.energy=100;document.getElementById('newLevel').textContent=player.level;document.getElementById('levelToast').classList.add('show');levelToastTimer=2.6;playTone(720,.28)}}}
  function toast(title,sub){const el=document.getElementById('toast');el.querySelector('b').textContent=title;el.querySelector('small').innerHTML=sub;el.classList.add('show');toastTimer=2.2}
  function respawn(){player.hp=player.maxHp;player.x=island.x-40;player.y=island.y+40;player.energy=100;toast('Back in the fight!','Your crew kept the bandits busy');}
  function updateHUD(){document.getElementById('healthFill').style.width=(player.hp/player.maxHp*100)+'%';document.getElementById('healthText').innerHTML=`${Math.ceil(player.hp)} <small>/ ${player.maxHp}</small>`;document.getElementById('energyFill').style.width=player.energy+'%';document.getElementById('energyText').innerHTML=`${Math.floor(player.energy)} <small>/ 100</small>`;document.getElementById('xpFill').style.width=(player.xp/500*100)+'%';document.getElementById('xpText').textContent=`${player.xp} / 500`;document.getElementById('level').textContent=String(player.level).padStart(2,'0');document.querySelectorAll('.skill[data-action]').forEach(b=>{let key=b.dataset.action;if(cooldowns[key]>0)b.classList.add('cooling');else b.classList.remove('cooling')})}
  function playTone(freq,duration){if(!audioOn)return;try{const ac=playTone.ac||(playTone.ac=new(window.AudioContext||window.webkitAudioContext)());const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.035,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+duration);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+duration)}catch{}}
  addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='q'||k==='e'||k==='r')useAbility(k);if(k===' '&&!e.repeat)useAbility('space');if(k==='m')document.getElementById('mapOverlay').classList.toggle('open')});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')attack()});
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();useAbility(b.dataset.action)}));
  const joy=document.getElementById('joystick'),knob=joy.querySelector('.joy-knob');
  function joyMove(e){let r=joy.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),max=r.width*.36,d=Math.hypot(x,y);if(d>max){x=x/d*max;y=y/d*max}joystick.x=x/max;joystick.y=y/max;knob.style.left=`calc(50% + ${x}px)`;knob.style.top=`calc(50% + ${y}px)`}
  joy.addEventListener('pointerdown',e=>{joystick.active=true;joy.setPointerCapture(e.pointerId);joyMove(e)});joy.addEventListener('pointermove',e=>{if(joystick.active)joyMove(e)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>joy.addEventListener(ev,()=>{joystick.active=false;joystick.x=joystick.y=0;knob.style.left='50%';knob.style.top='50%'}));
  document.querySelector('.map-btn').addEventListener('click',()=>document.getElementById('mapOverlay').classList.add('open'));document.getElementById('closeMap').addEventListener('click',()=>document.getElementById('mapOverlay').classList.remove('open'));document.getElementById('soundBtn').addEventListener('click',e=>{audioOn=!audioOn;e.currentTarget.textContent=audioOn?'♫':'♪';if(audioOn)playTone(540,.07)});
  document.getElementById('crewToggle').addEventListener('click',()=>toast('Crew chat','Your crew is exploring the island'));
  document.querySelector('.cash-chip button').addEventListener('click',()=>toast('Fruit shop','Visit the dock merchant to browse wares'));
  document.querySelector('.avatar-btn').addEventListener('click',()=>toast('Captain Kai','Rookie sailor · Gum-Gum fruit user'));
  requestAnimationFrame(loop);
})();
