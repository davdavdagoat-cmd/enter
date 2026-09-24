document.addEventListener('DOMContentLoaded', () => {
  const sports = ['All','Football','Basketball','Soccer','Baseball','Hockey','Racing','Golf','Tennis','Boxing','Other'];
  const seed = [
    ['Touchdown Target','Football','🏈','Hit the end-zone target','target'],['Field Goal Flick','Football','🏈','Kick through the uprights','target'],['QB Accuracy','Football','🎯','Hit moving receivers','target'],['End Zone Rush','Football','🏃','Dodge defenders','dodge'],['Football Sprint','Football','⚡','Survive the sprint','dodge'],
    ['Hoop Shot','Basketball','🏀','Sink the shot','target'],['3 Point Challenge','Basketball','🎯','Score from deep','target'],['Dunk Dash','Basketball','🔥','Time your run','dodge'],['Court Hustle','Basketball','🏀','Avoid defenders','dodge'],['Free Throw Pro','Basketball','🏀','Perfect your throws','target'],
    ['Penalty Shootout','Soccer','⚽','Beat the keeper','target'],['Goal Rush','Soccer','🥅','Score fast','target'],['Dribble Dash','Soccer','⚽','Avoid tackles','dodge'],['Corner Kick','Soccer','🎯','Hit the corner','target'],['Golden Boot','Soccer','👟','Rack up goals','target'],
    ['Home Run Derby','Baseball','⚾','Smash pitches','baseball'],['Batting Practice','Baseball','⚾','React to pitches','baseball'],['Fastball Challenge','Baseball','🔥','Time your swing','baseball'],['Base Runner','Baseball','🏃','Steal bases','dodge'],['Grand Slam','Baseball','💥','Find the sweet spot','baseball'],
    ['Hockey Slapshot','Hockey','🏒','Beat the goalie','target'],['Ice Breaker','Hockey','🧊','Score under pressure','target'],['Puck Accuracy','Hockey','🎯','Hit targets','target'],['Goalie Hero','Hockey','🥅','Save shots','target'],['Rink Rush','Hockey','🏒','Race across the ice','dodge'],
    ['Street Racer','Racing','🏎️','Dodge traffic','dodge'],['Formula Sprint','Racing','🏁','Survive the track','dodge'],['Drift Master','Racing','💨','Stay on course','dodge'],['Turbo Traffic','Racing','🚘','Weave through traffic','dodge'],['Drag Race','Racing','🚦','Launch perfectly','dodge'],
    ['Mini Golf','Golf','⛳','Sink the putt','target'],['Golf Target','Golf','🎯','Land near the flag','target'],['Long Drive','Golf','🏌️','Max your drive','target'],['Putt Perfect','Golf','⛳','Read the green','target'],['Fairway Challenge','Golf','🌳','Keep it straight','target'],
    ['Tennis Serve','Tennis','🎾','Serve the target','target'],['Ace Attack','Tennis','🎾','Serve an ace','target'],['Rally Master','Tennis','⚡','Keep the rally alive','target'],['Court Target','Tennis','🎯','Hit the corners','target'],['Tennis Dash','Tennis','🎾','Reach every shot','dodge'],
    ['Boxing Punch','Boxing','🥊','Punch targets','boxing'],['Heavyweight','Boxing','🥊','Land combos','boxing'],['Speed Bag','Boxing','⚡','Tap targets','boxing'],['Knockout Round','Boxing','💥','Find the opening','boxing'],['Ring Rush','Boxing','🥊','Survive the round','dodge'],
    ['Skate Sprint','Other','⛸️','Race to the finish','dodge'],['Archery Ace','Other','🏹','Hit the bullseye','target'],['Bowling Blitz','Other','🎳','Knock down pins','target'],['Volleyball Serve','Other','🏐','Serve into the target','target'],['Track Sprint','Other','🏃','Sprint to victory','dodge']
  ];
  const icons = {Football:'🏈',Basketball:'🏀',Soccer:'⚽',Baseball:'⚾',Hockey:'🏒',Racing:'🏎️',Golf:'⛳',Tennis:'🎾',Boxing:'🥊',Other:'🏆'};
  const games = [...seed, ...Array.from({length:60}, (_,i) => { const s=sports[1+(i%10)]; return [`${s} Challenge ${i+1}`,s,icons[s],'A fresh arcade challenge','target']; })];
  const $ = id => document.getElementById(id);
  let active='All';
  let xp=Number(localStorage.getItem('xp')||0);
  let best=Number(localStorage.getItem('best')||0);
  let player=localStorage.getItem('player')||'Rookie';

  $('playerName').textContent=player;
  $('statGames').textContent=games.length+'+';
  $('heroGames').textContent=games.length+'+';

  function renderChips(){
    $('chips').innerHTML='';
    sports.forEach(s=>{
      const b=document.createElement('button'); b.className='chip'+(s===active?' active':''); b.textContent=s;
      b.onclick=()=>{active=s;renderChips();renderGames();}; $('chips').appendChild(b);
    });
  }
  function renderGames(){
    const q=$('search').value.trim().toLowerCase();
    const list=games.filter(g=>(active==='All'||g[1]===active) && (!q || g.join(' ').toLowerCase().includes(q)));
    const grid=$('grid'); grid.innerHTML='';
    list.forEach(g=>{
      const card=document.createElement('article'); card.className='card';
      card.innerHTML=`<div class="pic">${g[2]}</div><div class="body"><h3>${g[0]}</h3><p>${g[3]} • ${g[1]}</p><button class="play">PLAY ▶</button></div>`;
      card.querySelector('.play').onclick=()=>startGame(g); grid.appendChild(card);
    });
  }
  function updateStats(){
    const level=Math.floor(xp/100)+1;
    $('statXP').textContent=xp; $('statBest').textContent=best; $('level').textContent=level; $('xpText').textContent=xp+' XP'; $('xpbar').style.width=(xp%100)+'%';
  }
  $('search').addEventListener('input',renderGames);
  $('theme').onclick=()=>document.body.classList.toggle('light');
  $('nameBtn').onclick=()=>{const n=prompt('Enter your arcade name:',player);if(n){player=n.trim().slice(0,20)||'Rookie';localStorage.setItem('player',player);$('playerName').textContent=player;}};
  renderChips(); renderGames(); updateStats();

  const modal=$('modal'), gameBox=$('game'); let raf=null, cleanup=null;
  function close(){ modal.classList.add('hidden'); gameBox.innerHTML=''; if(raf)cancelAnimationFrame(raf); if(cleanup)cleanup(); raf=null; cleanup=null; }
  $('close').onclick=close; modal.addEventListener('click',e=>{if(e.target===modal)close();}); document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});

  function startGame(g){
    close(); modal.classList.remove('hidden');
    gameBox.innerHTML=`<h2 class="gameTitle">${g[2]} ${g[0]}</h2><p class="gameSub">${g[3]} • Click/tap the target. Use A/D or ←/→ for dodge games.</p><canvas width="760" height="430"></canvas><div class="gameButtons"><button id="restart">↻ Restart</button></div>`;
    const c=gameBox.querySelector('canvas'), ctx=c.getContext('2d'), W=c.width,H=c.height; let score=0,t=0,over=false,px=W/2,target={x:W/2,y:110,r:35},keys={};
    function reset(){score=0;t=0;over=false;px=W/2;target={x:W/2,y:110,r:35};}
    gameBox.querySelector('#restart').onclick=reset;
    const kd=e=>{keys[e.key.toLowerCase()]=true;}; const ku=e=>{keys[e.key.toLowerCase()]=false;};
    addEventListener('keydown',kd);addEventListener('keyup',ku);cleanup=()=>{removeEventListener('keydown',kd);removeEventListener('keyup',ku);};
    c.addEventListener('click',e=>{
      if(over)return; const r=c.getBoundingClientRect(); const mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height;
      if(Math.hypot(mx-target.x,my-target.y)<target.r+12){score++;xp+=10;localStorage.setItem('xp',xp);best=Math.max(best,score);localStorage.setItem('best',best);updateStats();target.x=55+Math.random()*(W-110);target.y=75+Math.random()*(H-180);target.r=Math.max(17,target.r-.7);}
    });
    function frame(){
      ctx.fillStyle='#081018';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#203244';
      for(let a=20;a<W;a+=50){ctx.beginPath();ctx.moveTo(a,0);ctx.lineTo(a,H);ctx.stroke();} for(let a=20;a<H;a+=50){ctx.beginPath();ctx.moveTo(0,a);ctx.lineTo(W,a);ctx.stroke();}
      ctx.fillStyle='white';ctx.font='800 19px Arial';ctx.fillText('SCORE '+score,20,32);
      if(g[4]==='dodge'){
        px+=(keys.d||keys.arrowright?6:0)-(keys.a||keys.arrowleft?6:0);px=Math.max(25,Math.min(W-25,px));
        for(let i=0;i<6;i++){const yy=(t*(2+i*.35)+i*90)%470-30,xx=55+((i*137)%650);ctx.fillStyle=['#3ee58e','#5ca8ff','#ff5c68','#ffd15a'][i%4];ctx.fillRect(xx-15,yy,30,46);}
        ctx.fillStyle='white';ctx.beginPath();ctx.arc(px,H-55,17,0,Math.PI*2);ctx.fill(); if(t>900)over=true;
      } else if(g[4]==='boxing'){
        ctx.fillStyle='#ff5c68';ctx.beginPath();ctx.arc(target.x,target.y,target.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.textAlign='center';ctx.fillText('HIT',target.x,target.y+6);ctx.textAlign='left'; if(t%45===0){target.x=70+Math.random()*(W-140);target.y=80+Math.random()*(H-180);}
      } else {
        ctx.fillStyle='#3ee58e';ctx.beginPath();ctx.arc(target.x,target.y,target.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#06110b';ctx.textAlign='center';ctx.fillText('TARGET',target.x,target.y+5);ctx.textAlign='left';
      }
      if(over){ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 48px Arial';ctx.fillText('FINISH!',W/2,H/2);ctx.textAlign='left';}
      t++;raf=requestAnimationFrame(frame);
    }
    frame();
  }
});
