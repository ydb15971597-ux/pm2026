// 프로야구 매니저 PM — UI
let page = 'home', sortKey = null, squadFilter = 'all', statTab = 'bat', tradeTeam = null, tradeGive = [], tradeGet = [];
const esc = s => String(s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const P = id => S.players[id];
const tname = id => TD(id).name;
const short = id => TD(id).short || TD(id).name.split(' ')[0];

function rc(v){ // 능력치 색
  v = Math.round(v);
  const c = v>=17?'#3fb950':v>=14?'#9be08a':v>=11?'#d2c84a':v>=8?'#e3954b':'#f0605a';
  return `<span class="r" style="color:#0f1419;background:${c}">${v}</span>`;
}
function cab(p){ const v=ovrOf(p); const c = v>=17?'#3fb950':v>=14?'#9be08a':v>=11?'#d2c84a':v>=8?'#e3954b':'#f0605a';
  return `<span class="r" style="color:#0f1419;background:${c};min-width:34px">${CA(p)}</span>`; }
function traitChips(p,max=9){ return (p.traits||[]).slice(0,max).map(t=>`<span class="pill ${TRAITS[t]?.bad?'bad':'tr'}" title="${TRAITS[t]?.d||''}">${traitIcon(t)} ${t}</span>`).join(' '); }
function stars(p){ const n = clamp(Math.round((p.PA-60)/28),1,5); return '★'.repeat(n)+'<span class="mute">'+'★'.repeat(5-n)+'</span>'; }
const avg = (h,ab)=> ab? (h/ab).toFixed(3).replace(/^0/,'') : '-';
const era = st => st.outs? (st.er*27/st.outs).toFixed(2) : '-';
const ip = o => `${Math.floor(o/3)}${o%3?'.'+o%3:''}`;
const ops = st => { if(!st.pa) return '-'; const obp=(st.h+st.bb)/st.pa, slg=(st.h+st.d+2*st.t+3*st.hr)/(st.ab||1); return (obp+slg).toFixed(3); };
function fmtDate(d){ const x=new Date(d+'T12:00:00'); return `${x.getFullYear()}.${x.getMonth()+1}.${x.getDate()} (${'일월화수목금토'[x.getDay()]})`; }
function setAcc(){ if(S) document.documentElement.style.setProperty('--acc', TD(S.user).color); }

// ---------- 시작 화면 ----------
let startStep = 'title';
function stadiumBg(){
  return `<svg class="bg" viewBox="0 0 1456 819" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1422"/><stop offset="1" stop-color="#121c2a"/></linearGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient></defs>
    <rect width="1456" height="819" fill="url(#sky)"/>
    <path d="M114 70 L196 70 L360 425 L0 425 L0 390 Z" fill="url(#beam)"/><path d="M1260 70 L1342 70 L1456 390 L1456 425 L1100 425 Z" fill="url(#beam)"/>
    <rect x="114" y="46" width="82" height="25" rx="3" fill="#e6dfbc"/><rect x="152" y="71" width="5" height="170" fill="#2a3440"/>
    <rect x="1260" y="46" width="82" height="25" rx="3" fill="#e6dfbc"/><rect x="1298" y="71" width="5" height="170" fill="#2a3440"/>
    <rect y="425" width="1456" height="394" fill="#151a1f"/>
    <path d="M0 455 Q728 300 1456 455 L1456 490 Q728 345 0 490 Z" fill="#8a2a33"/>
    <path d="M0 490 Q728 345 1456 490 L1456 819 L0 819 Z" fill="#1c4a2e"/>
    <path d="M0 530 Q728 400 1456 530 L1456 819 L0 819 Z" fill="#1f5a36"/>
    <path d="M0 650 L728 819 L1456 650 L1456 819 L0 819 Z" fill="#163a25"/>
    <path d="M728 523 L985 652 L728 800 L470 652 Z" fill="#9a6a3c"/>
    <path d="M728 557 L925 652 L728 766 L530 652 Z" fill="#226b3e"/>
    <ellipse cx="728" cy="667" rx="26" ry="10" fill="#9a6a3c"/>
    ${[[728,523],[985,652],[728,800],[470,652]].map(([x,y])=>`<rect x="${x-7}" y="${y-7}" width="14" height="14" transform="rotate(45 ${x} ${y})" fill="#fff"/>`).join('')}
  </svg>`;
}
function renderStart(){
  const root = document.getElementById('root');
  if(startStep==='title'){
    root.innerHTML = `<div class="title" style="--acc:#e5383b">${stadiumBg()}
      <div class="inner">${titleLogo(760)}
        <div class="sub">10개 구단 · 260명의 선수 · 144경기와 가을야구, 모든 결정은 감독의 몫</div>
        <div class="sub" style="font-size:12px;opacity:.75;margin-top:6px">비공식 팬 메이드 게임 · 구단과 선수는 모두 가상입니다</div>
        <div class="btns"><button class="pri" onclick="startStep='teams';renderStart()">새 게임 시작</button>
        <button class="dark" onclick="contGame()" ${hasSave()?'':'disabled'}>이어하기</button></div></div>
      <div class="tf"><span>시즌 2026 · 로스터 기준 3월 개막</span><b>PRESS START</b></div></div>`;
    return;
  }
  root.innerHTML = `<div style="padding:34px 28px 18px;max-width:1360px;margin:auto">
    <div class="row" style="justify-content:space-between"><div><div class="eyebrow">CHOOSE YOUR CLUB</div><h2 style="font-size:32px;margin:6px 0 4px">부임할 구단을 선택하세요</h2>
      <div class="mute">구단마다 연고지·예산·팬 성향·이사회 기대치가 다릅니다.</div></div>
      <div class="row"><span class="mute">감독 이름</span><input id="mgrName" placeholder="비우면 기본 감독 이름" style="width:200px"><button onclick="startStep='title';renderStart()">← 타이틀</button></div></div></div>
  <div class="teams">${TEAM_DATA.map(t=>{
    const diff = t.goalRank<=2?'높은 기대':t.goalRank<=5?'보통':'도전';
    return `<div class="tcard" style="--c:${t.color}" onclick="pickTeam('${t.id}')">
      <div class="crestwrap">${crest(t.id,74)}</div>
      <div style="text-align:center"><b style="font-size:18px">${t.name}</b><div class="mute" style="font-size:12px;margin-top:2px">${t.city} · ${t.stadium}</div>
      <div class="row" style="justify-content:center;margin:8px 0"><span class="pill">2025 ${t.prevRank}위</span><span class="pill">감독 ${t.mgr.name}</span><span class="pill">${diff}</span></div></div>
      <div style="font-size:13px;color:#c3ccd6;min-height:62px">${t.status}</div>
      <div class="meter"><span class="mute">팬 규모</span><div class="bar"><i style="width:${t.fans.size}%;background:${t.color}"></i></div><span>${t.fans.size}</span></div>
      <div class="meter"><span class="mute">팬 인내심</span><div class="bar"><i style="width:${t.fans.patience}%;background:${t.color}"></i></div><span>${t.fans.patience}</span></div>
      <div class="mute" style="font-size:12px">예산 ${t.budget}억 · 목표 ${goalText(t.goalRank)}</div>
    </div>`}).join('')}</div>
  <div class="foot">※ 모든 구단·선수·감독·코치는 한국 프로야구를 참고해 만든 가상 설정입니다. 실제 구단·인물과 관계없습니다.</div>`;
}
function pickTeam(id){
  if(hasSave() && !confirm('새 게임을 시작하면 기존 저장이 덮어씌워집니다. 계속할까요?')) return;
  const nm = document.getElementById('mgrName').value.trim();
  newGame(id, nm || TD(id).mgr.name); page='home'; render();
}
function contGame(){ if(load()){ page='home'; render(); } }

// ---------- 레이아웃 (FM 스타일 상단 메뉴) ----------
const MENUS = [
  {k:'portal', l:'포털', items:[['home','기본 정보'],['inbox','메시지'],['schedule','일정·결과'],['standings','순위'],['stats','기록']]},
  {k:'squad', l:'선수단', items:[['squad','1군 선수단'],['tactics','라인업·전술']]},
  {k:'scout', l:'영입', items:[['db','선수 데이터베이스'],['transfer','트레이드'],['offseason','FA·드래프트']]},
  {k:'train', l:'훈련', items:[['training','훈련']]},
  {k:'club', l:'구단', items:[['club','구단·팬'],['staff','코치진'],['history','역사']]},
];
const PAGE_GROUP = {}; MENUS.forEach(m=>m.items.forEach(([p])=>PAGE_GROUP[p]=m.k));
const PAGE_LABEL = {}; MENUS.forEach(m=>m.items.forEach(([p,l])=>PAGE_LABEL[p]=l));
let prevPage='squad', curPlayer=null, curCoach=null, histB=[], histF=[];
const chev = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function render(){
  if(!S){ renderStart(); return; }
  setAcc();
  const u=S.teams[S.user], unread=S.inbox.filter(m=>!m.read).length;
  const live = todayMatch();
  const grp = PAGE_GROUP[page] || PAGE_GROUP[prevPage] || 'portal';
  const menus = MENUS.map(m=>({...m, items:m.items.filter(([p])=>p!=='offseason'||S.phase==='off')}));
  let btns;
  if(S.fired) btns='<button class="go" onclick="quit()">새 구단 찾기 <span>»</span></button>';
  else if(S.phase==='off') btns = S.off?.stage==='ready' ? '<button class="go" onclick="nextSeason()">새 시즌 시작 <span>»</span></button>' : `<button class="go" onclick="go('offseason')">오프시즌 진행 <span>»</span></button>`;
  else btns = `${live?`<button class="go live" onclick="watchLive()">● 경기 중계 <span>»</span></button><button onclick="adv(1)" title="중계 없이 결과만">결과만</button>`:`<button class="go" onclick="adv(1)">계속 <span>»</span></button>`}<button onclick="adv(6)">1주</button><button onclick="adv(S.phase==='post'?99:24)">${S.phase==='post'?'끝까지':'1달'}</button>`;
  const sub = menus.find(m=>m.k===grp).items;
  const crumb = page==='player'&&P(curPlayer) ? P(curPlayer).name : page==='coach' ? coachObj()?.name : MENUS.find(m=>m.k===grp).l;
  document.getElementById('root').innerHTML = `<div id="app">
    <header class="tb"><div class="tb1">
      <div class="hist"><button aria-label="뒤로" onclick="histBack()" ${histB.length?'':'disabled'}>‹</button><button aria-label="앞으로" onclick="histFwd()" ${histF.length?'':'disabled'}>›</button></div>
      <button class="tcrest" aria-label="구단 정보" onclick="go('club')">${crest(S.user,40)}</button>
      <div class="menus">${menus.map(m=>`<div class="menu ${m.k===grp?'on':''}"><button onclick="go('${m.items[0][0]}')">${m.l} ${chev}</button>
        <div class="dd">${m.items.map(([p,l])=>`<a href="#" class="${page===p?'on':''}" onclick="go('${p}');return false">${l}</a>`).join('')}<a href="#" onclick="quit();return false" style="${m.k==='club'?'':'display:none'}">메인 화면으로</a></div></div>`).join('')}</div>
      <span class="sp"></span>
      <div class="datebox"><div style="min-width:0"><b>${fmtDate(S.date)}</b><span>${nextMatchText()}</span></div><span class="rec">${u.w}-${u.l}${u.t?'-'+u.t:''} · ${rankOf(S.user)}위</span></div>
      <div class="cont">${btns}</div>
    </div>
    <div class="tb2"><div class="subtabs"><span class="crumb">${esc(crumb||'')}</span>${page==='player'||page==='coach'?`<a href="#" onclick="histBack();return false">← 돌아가기</a>`:sub.map(([p,l])=>`<a href="#" class="${page===p?'on':''}" onclick="go('${p}');return false">${l}</a>`).join('')}</div>
      <span class="sp"></span>
      <div class="quick"><button onclick="go('inbox')">메시지 ${unread?`<span class="n">${unread}</span>`:''}</button><button onclick="go('squad')">1군</button><button onclick="go('db')">선수 데이터베이스</button><button onclick="go('transfer')">트레이드</button><button onclick="go('standings')">순위</button></div></div></header>
    <div class="content" id="content"></div><div class="foot">※ 능력치는 게임용 추정치입니다 · 자동 저장됨 · ${esc(S.mgrName)} 감독</div></div>`;
  const fn = PAGES[page] || PAGES.home; document.getElementById('content').innerHTML = fn();
}
const uiSnap = ()=>({page, curPlayer, curCoach});
function restore(s){ page=s.page; curPlayer=s.curPlayer; curCoach=s.curCoach; }
function go(p, keepHist){ if(!keepHist && S){ histB.push(uiSnap()); if(histB.length>40) histB.shift(); histF=[]; }
  if(typeof luSel!=='undefined'){ luSel=null; pSel=null; }
  if(p!=='player'&&p!=='coach') prevPage=p; page=p; sortKey=null; render(); window.scrollTo(0,0); }
function histBack(){ if(!histB.length) return; histF.push(uiSnap()); restore(histB.pop()); render(); window.scrollTo(0,0); }
function histFwd(){ if(!histF.length) return; histB.push(uiSnap()); restore(histF.pop()); render(); window.scrollTo(0,0); }
function quit(){ if(LV) return; save(); S=null; startStep='title'; histB=[]; histF=[]; render(); }

function nextMatchText(){
  if(S.phase==='regular'){ const g=S.schedule[S.dayIdx]?.find(x=>x.includes(S.user)); if(!g) return ''; const home=g[0]===S.user; return `다음 경기 ${home?'vs':'@'} ${tname(home?g[1]:g[0])} · ${S.dayIdx+1}/144`; }
  if(S.phase==='post'){ const se=S.post.series; if(!se) return ''; return `${se.name} · ${short(se.hi)} ${se.wins[0]} - ${se.wins[1]} ${short(se.lo)}`; }
  if(S.phase==='off' && S.off) return `오프시즌 · ${{fa:'FA 시장',draft:'신인 드래프트',ready:'개막 준비'}[S.off.stage]}`;
  return '오프시즌';
}
function adv(n){
  if(LV) return;
  let last=null;
  for(let i=0;i<n;i++){ if(S.phase==='off'||S.fired) break; const g=advanceDay(); if(g && (g.home===S.user||g.away===S.user)) last=g; if(n>1 && S.inbox[0] && ['board','trade'].includes(S.inbox[0].type) && !S.inbox[0].read && S.inbox[0].date===S.date && i>0) break; }
  save(); render();
  if(n===1 && last) showGame(last);
}
function nextSeason(){ newSeason(); page='home'; render(); }


// ---------- 공통 표시 도우미 ----------
function starBar(v){ v=clamp(Math.round(v*2)/2,0,5); return `<span class="stars" role="img" aria-label="별 ${v}개"><span class="bg">★★★★★</span><span class="fg" style="width:${v/5*100}%">★★★★★</span></span>`; }
const caStars = p=>starBar((CA(p)-60)/26);
const paStars = p=>starBar((p.PA-60)/26);
function pn(p, size=30, sub=''){ return `<a class="pn" href="#" onclick="event.stopPropagation();showPlayer('${p.id}');return false">${avatar(p,size)}<span><b>${p.name}</b>${sub?`<br><span class="mute" style="font-size:12px">${sub}</span>`:''}</span></a>`; }
function statusTag(p){ if(p.inj) return '<span class="tag inj">부상</span>'; if(p.team===S.user) return '<span class="tag me">우리 팀</span>'; if(!p.team) return '<span class="tag">FA</span>'; if(p.foreign) return '<span class="tag fo">외국인</span>'; return '<span class="tag" style="background:#2a323c;color:#c5ced8">타 구단</span>'; }
function archetype(p){ const a=p.a; if(p.isP) return p.pos==='SP'?(a.vel>=15?'파워 선발':a.ctl>=15?'제구형 선발':'선발'):p.pos==='CL'?'마무리':(a.sta>=12?'롱릴리프':'불펜');
  return (a.pow>=15?'장타형 ':a.con>=15?'교타형 ':a.spd>=15?'기동력형 ':defVal(p)>=15?'수비형 ':'')+POS_KO[p.pos]; }
function recGrade(p){ // 우리 팀 같은 포지션 그룹 대비 추천 수준
  const mine = teamPlayers(S.teams[S.user]).filter(q=>q.isP===p.isP && q.id!==p.id);
  const best = mine.length? mine.map(q=>CA(q)).sort((a,b)=>b-a)[Math.min(p.isP?4:5, mine.length-1)] : 100;
  const d = CA(p)-best; const g = d>=25?['A+','#3fb950','우선순위']:d>=15?['A','#3fb950','우수']:d>=7?['B+','#9be08a','최고 보강']:d>=0?['B','#d2c84a','수준']:d>=-8?['C+','#d2c84a','좋음']:d>=-16?['C','#e3954b','실용적']:['D','#f0605a','최후의 수단'];
  return `<span class="row" style="gap:8px;flex-wrap:nowrap"><span class="grade" style="color:${g[1]}">${g[0]}</span><span>${g[2]}</span></span>`; }
function seasonLine(p){ const st=p.st; return p.isP ? (st.outs?`${st.w}승 ${st.l}패${st.sv?' '+st.sv+'세':''}${st.hld?' '+st.hld+'홀':''} · ERA ${era(st)}`:'기록 없음') : (st.pa?`${avg(st.h,st.ab)} · ${st.hr}홈런 · ${st.rbi}타점`:'기록 없음'); }
function upcoming(n){ const out=[]; let d=S.date;
  if(S.phase!=='regular') return out;
  for(let i=S.dayIdx;i<Math.min(S.dayIdx+n,S.schedule.length);i++){ const g=S.schedule[i].find(x=>x.includes(S.user)); if(g) out.push({d, h:g[0], a:g[1]}); d=nextGameDate(d); }
  return out; }
function teamProfile(tid){
  const t=S.teams[tid]; const lu=t.lineup.map(x=>S.players[x.pid]).filter(Boolean);
  const m=(arr,f)=>arr.length?arr.reduce((s,p)=>s+f(p),0)/arr.length:10;
  const rot=t.rotation.map(id=>S.players[id]).filter(Boolean), pen=teamPlayers(t).filter(p=>p.isP&&!t.rotation.includes(p.id));
  return {컨택:m(lu,p=>p.a.con), 파워:m(lu,p=>p.a.pow), 주루:m(lu,p=>(p.a.spd+p.a.stl)/2), 수비:m(lu,p=>defVal(p,p.pos)), 선발:m(rot,ovrOf), 불펜:m(pen.sort((a,b)=>ovrOf(b)-ovrOf(a)).slice(0,6),ovrOf)};
}
function radar(tid){
  const all=TEAM_DATA.map(t=>teamProfile(t.id)), me=teamProfile(tid), keys=Object.keys(me);
  const norm=k=>{ const v=all.map(x=>x[k]), lo=Math.min(...v), hi=Math.max(...v); return hi>lo?(me[k]-lo)/(hi-lo):.5; };
  const avgN=k=>{ const v=all.map(x=>x[k]), lo=Math.min(...v), hi=Math.max(...v); const a=v.reduce((s,x)=>s+x,0)/v.length; return hi>lo?(a-lo)/(hi-lo):.5; };
  const pt=(i,r)=>{ const an=-Math.PI/2+i*2*Math.PI/keys.length; return [80+Math.cos(an)*r*62, 80+Math.sin(an)*r*62]; };
  const poly=f=>keys.map((k,i)=>pt(i,.15+.85*f(k)).map(x=>x.toFixed(1)).join(',')).join(' ');
  const score = keys.reduce((s,k)=>s+norm(k),0)/keys.length;
  return {score, svg:`<svg width="170" height="170" viewBox="0 0 160 160" role="img" aria-label="팀 전력 레이더">
    ${[1,.66,.33].map(r=>`<polygon points="${keys.map((k,i)=>pt(i,r).join(',')).join(' ')}" fill="none" stroke="#2c3540"/>`).join('')}
    ${keys.map((k,i)=>{const [x,y]=pt(i,1);const [lx,ly]=pt(i,1.24);return `<line x1="80" y1="80" x2="${x}" y2="${y}" stroke="#2c3540"/><text x="${lx}" y="${ly+4}" text-anchor="middle" font-size="10" fill="#aab4bf">${k}</text>`}).join('')}
    <polygon points="${poly(avgN)}" fill="none" stroke="#8d99a6" stroke-dasharray="3 3"/>
    <polygon points="${poly(norm)}" fill="color-mix(in srgb,var(--acc) 35%,transparent)" stroke="var(--acc)" stroke-width="2"/></svg>`};
}

// ---------- 홈 (포털) ----------
const PAGES = {};
let mailFilter='all';
function inboxList(max){
  let list = S.inbox.map((m,i)=>({m,i}));
  if(mailFilter==='unread') list=list.filter(x=>!x.m.read);
  if(mailFilter==='trade') list=list.filter(x=>x.m.type==='trade'||x.m.action);
  if(max) list=list.slice(0,max);
  const TY={trade:'트레이드',board:'이사회',injury:'의무팀',staff:'코치진',match:'경기',fan:'팬',info:'알림'};
  let last=null, out='';
  for(const {m,i} of list){ if(m.date!==last){ out+=`<div class="dhead">${fmtDate(m.date)}</div>`; last=m.date; }
    out+=`<a class="msg ${m.read?'read':'unread'}" href="#" onclick="openMail(${i});return false"><div class="f"><span>${esc(m.from)}</span><span class="chip">${TY[m.type]||'알림'}</span></div><div class="t">${esc(m.title)}</div></a>`; }
  return out || '<p class="mute" style="padding:14px">메시지가 없어요</p>';
}
const mailTabs = ()=>{ const un=S.inbox.filter(m=>!m.read).length; return `<div class="mtabs">${[['all','전체'],['unread',`읽지 않음(${un})`],['trade','제안']].map(([k,l])=>`<button class="${mailFilter===k?'on':''}" onclick="mailFilter='${k}';render()">${l}</button>`).join('')}<span class="sp" style="flex:1"></span><button onclick="S.inbox.forEach(m=>m.read=true);save();render()" title="모두 읽음">모두 읽음</button></div>`; };
PAGES.inbox = ()=>`<div class="panel" style="max-width:900px"><h3>메시지</h3>${mailTabs()}<div>${inboxList()}</div></div>`;
PAGES.home = ()=>{
  const u=S.teams[S.user];
  const res = S.results.filter(r=>r.h===S.user||r.a===S.user);
  const last = res[res.length-1];
  let hero='<div class="news-hero"><div class="tx"><b>개막을 앞두고</b><p>'+esc(TD(S.user).status)+'</p></div></div>';
  if(last){ const me=last.h===S.user?1:0, my=last.s[me], op=last.s[1-me], opp=me?last.a:last.h; const w=my>op;
    const dn=id=>id?P(id)?.name||'':''; const g=last.full;
    const hrs = g? Object.values(g.box[me].bat).filter(x=>x.hr).map(x=>`${dn(x.pid)}${x.hr>1?'('+x.hr+')':''}`).join(', ') : '';
    hero=`<div class="news-hero" onclick="showResult(${S.results.indexOf(last)})"><div class="sb">${crest(last.a,64)}<span class="sc2">${last.s[0]} – ${last.s[1]}</span>${crest(last.h,64)}</div>
      <div class="tx"><b>${short(S.user)}, ${short(opp)}에 ${w?'승리':my<op?'패배':'무승부'}</b><p>${last.d.slice(5).replace('-','월 ')}일 ${TD(last.h).stadium}에서 열린 경기에서 ${tname(S.user)}가 ${my}-${op}로 ${w?'이겼다':my<op?'졌다':'비겼다'}. ${last.dec?.w?`승리 투수 ${dn(last.dec.w)}${last.dec.sv?', 세이브 '+dn(last.dec.sv):''}.`:''} ${hrs?`홈런: ${hrs}.`:''}</p></div></div>`; }
  const others = S.results.slice(-12).filter(r=>r!==last && r.h!==S.user && r.a!==S.user).slice(-3).reverse();
  const fx = [...res.slice(-4).map(r=>{const me=r.h===S.user?1:0;return {d:r.d,opp:me?r.a:r.h,home:!!me,res:[r.s[me],r.s[1-me]],idx:S.results.indexOf(r)}}), ...upcoming(9).map(g=>({d:g.d,opp:g.h===S.user?g.a:g.h,home:g.h===S.user}))];
  const today = S.phase==='regular' ? (S.schedule[S.dayIdx]||[]) : (S.post?.series?[[S.post.series.hi,S.post.series.lo]]:[]);
  const opp = (()=>{ const g=todayMatch(); return g? (g[0]===S.user?g[1]:g[0]) : null; })();
  const mine=teamPlayers(u), best=(f,flt)=>mine.filter(flt).sort((a,b)=>f(b)-f(a))[0];
  const g = Math.max(1,u.w+u.l+u.t);
  const leaders=[['최고 타율',best(p=>p.st.ab?p.st.h/p.st.ab:0,p=>!p.isP&&p.st.pa>=g*2),p=>avg(p.st.h,p.st.ab)],['최다 홈런',best(p=>p.st.hr,p=>!p.isP&&p.st.hr>0),p=>p.st.hr],['최다승',best(p=>p.st.w,p=>p.isP&&p.st.w>0),p=>p.st.w],['최다 세이브',best(p=>p.st.sv,p=>p.isP&&p.st.sv>0),p=>p.st.sv]];
  const rd = radar(S.user);
  const payroll = mine.reduce((s,p)=>s+p.salary,0);
  // 이번 주
  const days=[]; { let d=S.date, i=S.dayIdx; const start=new Date(S.date+'T12:00:00'); const dow=(start.getDay()+6)%7; const base=new Date(start); base.setDate(base.getDate()-dow);
    const map={}; for(const x of upcoming(8)) map[x.d]=x;
    for(let k=0;k<7;k++){ const dd=new Date(base); dd.setDate(base.getDate()+k); const ds=dd.toISOString().slice(0,10); const r=res.find(x=>x.d===ds); days.push({ds, lab:'월화수목금토일'[k], g:map[ds], r, today:ds===S.date}); } }
  return `<div class="dash">
   <div class="panel"><h3>메시지 <button class="lnk" onclick="go('inbox')">전체 보기</button></h3>${mailTabs()}<div class="scroll" style="max-height:1040px">${inboxList(40)}</div></div>
   <div class="panel"><div class="mid2">
     <div style="min-width:0"><h3><span class="lnk">뉴스</span></h3>${hero}
       ${others.map(r=>`<div class="nsmall">${crest(r.a,26)}<span><b>${short(r.a)} ${r.s[0]} : ${r.s[1]} ${short(r.h)}</b><br><span class="mute" style="font-size:12px">${r.d.slice(5)} · ${TD(r.h).stadium}</span></span><span style="margin-left:auto">${crest(r.h,26)}</span></div>`).join('')}
       <h3 style="margin-top:18px"><button class="lnk" onclick="go('schedule')">경기 일정</button></h3>
       <table class="fx"><tr><th>날짜</th><th>상대</th><th>장소</th><th>결과</th></tr>${fx.map(x=>`<tr class="${x.idx!=null?'click':''}" ${x.idx!=null?`onclick="showResult(${x.idx})"`:''}><td>${x.d.slice(5).replace('-','/')}</td><td>${crest(x.opp,18)} ${short(x.opp)}</td><td class="mute">${x.home?'홈':'원정'}</td><td>${x.res?`<span class="dot" style="background:${x.res[0]>x.res[1]?'#3fb950':x.res[0]<x.res[1]?'#f85149':'#d29922'}"></span><b>${x.res[0]} - ${x.res[1]}</b>`:'<span class="mute">-</span>'}</td></tr>`).join('')||'<tr><td class="mute" colspan="4">일정 없음</td></tr>'}</table>
     </div>
     <div style="min-width:0"><h3><button class="lnk" onclick="go('standings')">${S.phase==='post'?'포스트시즌':'오늘의 경기'}</button></h3>
       ${today.map(([h,a])=>`<div class="mrow ${h===S.user||a===S.user?'me':''}"><span class="h">${short(a)} ${crest(a,20)}</span><span class="v">VS</span><span class="a">${crest(h,20)} ${short(h)}</span></div>`).join('')||'<p class="mute">오늘은 경기가 없어요</p>'}
       <p class="mute" style="font-size:12px;margin:6px 0 0">원정 VS 홈 · ${S.phase==='regular'?`${S.dayIdx+1}번째 경기일`:''}</p>
       <h3 style="margin-top:18px"><span class="lnk">선수 상태</span></h3>
       ${leaders.map(([k,p,f])=>`<div class="lead"><div style="min-width:0"><div class="k">${k}</div>${p?pn(p,30):'<span class="mute">-</span>'}</div><b>${p?f(p):''}</b></div>`).join('')}
       <div class="lead"><div><div class="k">부상자</div><span>${mine.filter(p=>p.inj).map(p=>p.name).join(', ')||'없음'}</span></div></div>
     </div></div></div>
   <div class="dcol">
     <div class="panel"><h3>다음 상대 보고서</h3>${opp?(()=>{const t=S.teams[opp]; const sp=S.players[t.rotation[t.rotIdx%t.rotation.length]]; return `<div class="row" style="flex-wrap:nowrap">${crest(opp,46)}<div><b style="font-size:16px">${tname(opp)}</b><div class="mute" style="font-size:13px">${rankOf(opp)}위 · ${t.w}승 ${t.l}패 · ${TD(opp).stadium}</div></div></div>
       <div class="row" style="margin-top:12px;justify-content:space-between"><span class="mute" style="font-size:12px">최근 전적</span><span>${t.last.slice(-5).map(x=>`<span class="dot" style="background:${x==='W'?'#3fb950':x==='L'?'#f85149':'#8d99a6'};margin:0 2px"></span>`).join('')||'-'}</span></div>
       ${sp?`<div class="row" style="margin-top:10px;justify-content:space-between"><span class="mute" style="font-size:12px">예상 선발</span>${pn(sp,26,`${kmh(sp)}km · ${'★'.repeat(clamp(Math.round((CA(sp)-60)/26),1,5))}`)}</div>`:''}`})():'<p class="mute">예정된 경기가 없어요</p>'}</div>
     <div class="panel"><h3>데이터 허브</h3><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${rd.svg}<div><span class="tag" style="background:${rd.score>=.6?'#1f6f43':rd.score>=.4?'#6b5a17':'#7a2b27'}">${rd.score>=.6?'리그 상위 전력':rd.score>=.4?'리그 평균 전력':'리그 하위 전력'}</span><p class="mute" style="font-size:13px;line-height:1.6">주전 라인업과 투수진 능력을 리그 10개 구단과 비교했어요. 점선은 리그 평균이에요.</p></div></div></div>
     <div class="panel"><h3>재정 <button class="lnk" onclick="go('club')">자세히</button></h3><div class="mute" style="font-size:13px">구단 잔고</div><div class="big2">${u.balance.toFixed(1)}억 원</div>
       <div class="mute" style="font-size:13px;margin-top:8px">선수단 연봉 총액 · 예산 ${TD(S.user).budget}억</div><div style="font-size:18px;font-weight:700">${payroll.toFixed(1)}억 원</div>
       <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100,payroll/TD(S.user).budget*100)}%"></i></div></div>
     <div class="panel"><h3>구단 현황</h3>${meter('이사회 신뢰',u.board)}${meter('팬 만족도',u.fanMood)}${meter('선수단 사기',mine.reduce((s,p)=>s+p.morale,0)/mine.length)}<div class="mute" style="font-size:12px;margin-top:6px">목표: ${goalText(u.goalRank)}</div></div>
     <div class="panel"><h3>이번 주 <button class="lnk" onclick="go('training')">훈련</button></h3><div class="week">${days.map(x=>`<div class="d ${x.today?'today':''}"><b>${x.lab}</b>${x.r?(()=>{const me=x.r.h===S.user?1:0;return `${crest(me?x.r.a:x.r.h,20)}<span style="color:${x.r.s[me]>x.r.s[1-me]?'#3fb950':'#f85149'}">${x.r.s[me]}-${x.r.s[1-me]}</span>`})():x.g?`${crest(x.g.h===S.user?x.g.a:x.g.h,20)}<span class="mute">${x.g.h===S.user?'홈':'원정'}</span>`:'<span class="mute">훈련</span>'}</div>`).join('')}</div>
       <div class="mute" style="font-size:12px;margin-top:8px">훈련 중점: 야수 ${u.train.hit} · 투수 ${u.train.pit} · 강도 ${INTEN[u.train.inten].label}</div></div>
   </div></div>`;
};

function meter(l,v){ v=Math.round(v); const c=v>=65?'var(--good)':v>=35?'var(--warn)':'var(--bad)'; return `<div class="meter"><span class="mute">${l}</span><div class="bar"><i style="width:${v}%;background:${c}"></i></div><b>${v}</b></div>`; }
function resultRow(r){
  const me=r.h===S.user?1:0; const my=r.s[me], op=r.s[1-me]; const res=my>op?'<b class="good">승</b>':my<op?'<b class="bad">패</b>':'<b class="warn">무</b>';
  const idx=S.results.indexOf(r);
  return `<tr><td class="mute">${r.d.slice(5)}</td><td>${res}</td><td>${me?'vs':'@'} ${tname(me?r.a:r.h)}</td><td class="num"><b>${my} : ${op}</b></td><td>${r.full?`<a href="#" onclick="showResult(${idx});return false">박스스코어</a>`:''}</td></tr>`;
}
function showResult(i){ const r=S.results[i]; if(r.full) showGame(r.full); }

// ---------- 경기 결과 ----------
function showGame(g){
  const ids=[g.away,g.home]; const n=Math.max(g.line[0].length,g.line[1].length,9);
  const ls = `<table class="ls"><tr><th></th>${Array.from({length:n},(_,i)=>`<th>${i+1}</th>`).join('')}<th>R</th><th>H</th><th>E</th></tr>
    ${[0,1].map(s=>`<tr><td style="text-align:left"><b>${tname(ids[s])}</b></td>${Array.from({length:n},(_,i)=>`<td>${g.line[s][i]??''}</td>`).join('')}<td><b>${g.score[s]}</b></td><td>${g.box[s].hits}</td><td>${g.box[s].err}</td></tr>`).join('')}</table>`;
  const dn = id=>id?P(id)?.name||'-':'-';
  const dec = g.dec.w?`<p>승: <b>${dn(g.dec.w)}</b> · 패: ${dn(g.dec.l)}${g.dec.sv?' · 세: '+dn(g.dec.sv):''}${g.dec.hld?.length?' · 홀드: '+g.dec.hld.map(dn).join(', '):''}</p>`:'<p class="warn">무승부</p>';
  const bat = s=>`<table><tr><th>타자</th><th class="num">타수</th><th class="num">안타</th><th class="num">홈런</th><th class="num">타점</th><th class="num">볼넷</th><th class="num">삼진</th></tr>
    ${Object.values(g.box[s].bat).map(x=>`<tr><td>${dn(x.pid)}</td><td class="num">${x.ab}</td><td class="num">${x.h}</td><td class="num">${x.hr}</td><td class="num">${x.rbi}</td><td class="num">${x.bb}</td><td class="num">${x.k}</td></tr>`).join('')}</table>`;
  const pit = s=>`<table><tr><th>투수</th><th class="num">이닝</th><th class="num">피안타</th><th class="num">실점</th><th class="num">볼넷</th><th class="num">삼진</th><th class="num">투구수</th></tr>
    ${g.box[s].pit.map(x=>`<tr><td>${dn(x.pid)}</td><td class="num">${ip(x.outs)}</td><td class="num">${x.h}</td><td class="num">${x.r}</td><td class="num">${x.bb}</td><td class="num">${x.k}</td><td class="num">${Math.round(x.pc)}</td></tr>`).join('')}</table>`;
  modal(`<h2>${tname(g.away)} ${g.score[0]} : ${g.score[1]} ${tname(g.home)}</h2><div class="mute">${g.date} · ${TD(g.home).stadium}${g.post?' · 포스트시즌':''}</div>
    <div class="card" style="margin:10px 0;overflow:auto">${ls}</div>${dec}
    <div class="grid g2"><div class="card" style="overflow:auto"><h3>${tname(g.away)}</h3>${bat(0)}<br>${pit(0)}</div><div class="card" style="overflow:auto"><h3>${tname(g.home)}</h3>${bat(1)}<br>${pit(1)}</div></div>
    ${g.log?.length?`<h3 style="margin-top:12px">문자 중계</h3><div class="log">${g.log.map(l=>`<div>${l}</div>`).join('')}</div>`:''}`);
}
function modal(html){ document.getElementById('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div>${html}<div style="text-align:right;margin-top:14px"><button onclick="closeModal()">닫기</button></div></div></div>`; }
function closeModal(){ document.getElementById('modal').innerHTML=''; render(); }

// ---------- 선수 표 (선수단 · 선수 데이터베이스 공용) ----------
let dbPos='all', dbTeam='all', dbQ='', dbLimit=120;
function playerTable(ps, opt={}){
  const keyf = {name:p=>p.name, pos:p=>p.pos, age:p=>p.age, ovr:p=>-CA(p), pot:p=>-p.PA, cond:p=>-p.cond, sal:p=>-p.salary, team:p=>p.team||'zz'};
  ps=ps.slice().sort((a,b)=>{ const f=keyf[sortKey||'ovr']; const x=f(a),y=f(b); return x<y?-1:x>y?1:0; });
  const cols=[['상태',null],['선수','name'],...(opt.team?[['구단','team']]:[]),['포지션','pos'],['나이','age'],['투타',null],['능력','ovr'],['잠재력','pot'],['주요 능력',null],['특성',null],['컨디션','cond'],['연봉','sal'],[opt.team?'추천 수준':'시즌 기록',null]];
  const at = p=>{ const a=p.a; return p.isP ? `<span class="pill">${kmh(p)}km</span> ${rc(a.stf)} ${rc(a.ctl)} ${rc(a.brk)} ${rc(a.sta)}` : `${rc(a.con)} ${rc(a.pow)} ${rc(a.eye)} ${rc(a.spd)} ${rc(defVal(p))}`; };
  return `<div style="overflow-x:auto"><table><thead><tr>${cols.map(([l,k])=>`<th ${k?`onclick="sortKey='${k}';render()"`:''}>${l}${k&&sortKey===k?' ↓':''}</th>`).join('')}</tr></thead><tbody>
   ${ps.map(p=>`<tr class="click ${p.team===S.user&&opt.team?'me':''}" onclick="showPlayer('${p.id}')"><td>${statusTag(p)}</td><td>${pn(p,30)}</td>
     ${opt.team?`<td>${p.team?`${crest(p.team,18)} ${short(p.team)}`:'<span class="mute">FA</span>'}</td>`:''}
     <td>${POS_KO[p.pos]}<br><span class="mute" style="font-size:11.5px">${archetype(p)}</span></td><td class="num">${p.age}</td><td>${handTxt(p)}</td>
     <td>${caStars(p)}</td><td>${paStars(p)}</td><td>${at(p)}</td><td>${traitChips(p,1)}</td><td class="num">${Math.round(p.cond)}%</td><td class="num">${p.salary}억 · ${p.yrs??1}년</td>
     <td>${opt.team? recGrade(p) : `<span class="mute">${seasonLine(p)}</span>`}</td></tr>`).join('')}</tbody></table></div>`;
}
PAGES.squad = ()=>{
  const u=S.teams[S.user]; let ps=teamPlayers(u);
  if(squadFilter==='h') ps=ps.filter(p=>!p.isP); if(squadFilter==='p') ps=ps.filter(p=>p.isP);
  const payroll=teamPlayers(u).reduce((s,p)=>s+p.salary,0);
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">1군 선수단 <span class="mute" style="font-size:15px">${u.roster.length}명</span></h2>
    <div class="row">${[['all','전체'],['h','야수'],['p','투수']].map(([k,l])=>`<button class="${squadFilter===k?'pri':''}" onclick="squadFilter='${k}';render()">${l}</button>`).join('')}</div></div>
   <div class="panel">${playerTable(ps)}</div>
   <div class="bcards">${[['등록 인원',u.roster.length+'명'],['외국인',foreignCount(u)+' / 4'],['연봉 총액',payroll.toFixed(1)+'억'],['평균 나이',(teamPlayers(u).reduce((s,p)=>s+p.age,0)/u.roster.length).toFixed(1)+'세'],['부상자',teamPlayers(u).filter(p=>p.inj).length+'명']].map(([k,v])=>`<div class="panel"><div class="mute" style="font-size:13px">${k}</div><div style="font-size:24px;font-weight:800">${v}</div></div>`).join('')}</div>
   <p class="mute" style="font-size:12px">별점은 리그 전체 기준 능력(CA)과 잠재력(PA)이에요. 줄을 누르면 선수 화면으로 이동해요.</p>`;
};
PAGES.db = ()=>{
  let ps=Object.values(S.players).filter(p=>p.team || (S.phase==='off'&&S.off?.pool?.includes(p.id)));
  const G={h:p=>!p.isP,p:p=>p.isP,C:p=>p.pos==='C',IF:p=>['1B','2B','3B','SS','IF'].includes(p.pos),OF:p=>['LF','CF','RF','OF'].includes(p.pos),SP:p=>p.pos==='SP',RP:p=>['RP','CL'].includes(p.pos),young:p=>p.age<=24,fo:p=>p.foreign};
  if(G[dbPos]) ps=ps.filter(G[dbPos]); if(dbTeam!=='all') ps=ps.filter(p=>dbTeam==='other'?p.team!==S.user:p.team===dbTeam);
  if(dbQ) ps=ps.filter(p=>p.name.includes(dbQ));
  const n=ps.length; const u=S.teams[S.user];
  if(!sortKey) sortKey='ovr';
  const shown = ps.slice().sort((a,b)=>CA(b)-CA(a)); // 정렬은 playerTable에서
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">선수 데이터베이스</h2>
    <div class="row"><input aria-label="선수 이름 검색" placeholder="선수 이름 검색" value="${esc(dbQ)}" onchange="dbQ=this.value.trim();render()" style="width:180px">
    <select aria-label="구단" onchange="dbTeam=this.value;render()"><option value="all">전체 구단</option><option value="other" ${dbTeam==='other'?'selected':''}>다른 구단만</option>${TEAM_DATA.map(t=>`<option value="${t.id}" ${dbTeam===t.id?'selected':''}>${t.name}</option>`).join('')}</select>
    <button onclick="dbPos='all';dbTeam='all';dbQ='';render()">초기화</button></div></div>
   <div class="row" style="margin-bottom:10px">${[['all','전체'],['h','야수'],['p','투수'],['C','포수'],['IF','내야수'],['OF','외야수'],['SP','선발'],['RP','불펜'],['young','24세 이하'],['fo','외국인']].map(([k,l])=>`<button class="${dbPos===k?'pri':''}" onclick="dbPos='${k}';render()">${l}</button>`).join('')}</div>
   <div class="panel"><div class="row" style="justify-content:space-between;margin-bottom:8px"><b style="font-size:16px">${n}명 선수 발견 <span class="mute" style="font-weight:400;font-size:13px">(조건 적용됨)</span></b><span class="mute" style="font-size:13px">추천 수준 = 우리 팀 주전급과 비교한 영입 가치</span></div>
    <div class="scroll" style="max-height:62vh">${playerTable(shown.slice(0,dbLimit),{team:true})}</div>
    ${n>dbLimit?`<div style="text-align:center;margin-top:10px"><button onclick="dbLimit+=120;render()">더 보기 (${n-dbLimit}명)</button></div>`:''}</div>
   <div class="bcards">
    <div class="panel"><h3>트레이드 시장</h3><div style="font-size:20px;font-weight:800;color:${isDeadlinePassed()||S.phase==='post'?'#f85149':'#3fb950'}">${isDeadlinePassed()||S.phase==='post'?'마감':'열림'}</div><div class="mute" style="font-size:13px">트레이드 마감 7월 31일</div></div>
    <div class="panel"><h3>영입 예산</h3><div class="mute" style="font-size:13px">구단 잔고</div><div class="big2">${u.balance.toFixed(1)}억</div></div>
    <div class="panel"><h3>등록 현황</h3><div style="font-size:20px;font-weight:800">${u.roster.length}명</div><div class="mute" style="font-size:13px">외국인 ${foreignCount(u)} / 4</div></div>
    <div class="panel"><h3>바로가기</h3><div class="row"><button onclick="go('transfer')">트레이드 제안</button>${S.phase==='off'?`<button onclick="go('offseason')">FA·드래프트</button>`:''}</div></div></div>`;
};

function handTxt(p){ return p.isP ? (p.hand==='L'?'좌투':'우투')+(p.hand==='L'?'좌타':'우타') : (p.hand==='S'?'우투양타':p.hand==='L'?'우투좌타':'우투우타'); }
function estWAR(p){
  const s=p.st;
  if(p.isP){ if(!s.outs) return null; const ip=s.outs/3, era_=s.er*9/ip; return ((4.6-era_)*ip/9/9 + ip/(p.pos==='SP'?75:110)).toFixed(1); }
  if(!s.pa) return null; const obp=(s.h+s.bb)/s.pa, slg=(s.h+s.d+2*s.t+3*s.hr)/(s.ab||1);
  const posAdj={C:1.2,SS:0.75,'2B':0.3,CF:0.3,'3B':0.25,RF:-0.75,LF:-0.75,'1B':-1.2,DH:-1.7,IF:0.2,OF:-0.3}[p.pos]||0;
  return (((obp+slg)-0.73)*s.pa/22 + posAdj*s.g/144 + s.pa/600*2 + (s.sb-s.cs*2)*0.02).toFixed(1);
}
function scoutMemo(p){
  const a=p.a, L=p.isP?P_ATTR:H_ATTR, ks=Object.keys(L).filter(k=>!(k==='cat'&&p.pos!=='C')&&!(k==='bnt'));
  const top=ks.slice().sort((x,y)=>a[y]-a[x]).slice(0,2), low=ks.slice().sort((x,y)=>a[x]-a[y])[0];
  const lv=v=>v>=17?'최상급':v>=14?'수준급':v>=11?'평균 이상':'평범한';
  const parts=[];
  if(p.isP){
    const best=Object.entries(p.pitches).sort((x,y)=>y[1]-x[1])[0];
    parts.push(`최고 ${kmh(p)}km의 ${p.a.vel>=15?'강속구를 앞세운':p.a.ctl>=15?'정교한 제구가 무기인':'경기 운영형'} ${p.pos==='SP'?'선발':p.pos==='CL'?'마무리':'불펜'} 투수.`);
    parts.push(`주무기 ${best[0]}(${Math.round(best[1])})와 ${L[top[0]]}이(가) ${lv(a[top[0]])}이다.`);
  } else {
    parts.push(`${L[top[0]]}와(과) ${L[top[1]]}이(가) ${lv(Math.min(a[top[0]],a[top[1]]))}인 ${p.a.pow>=15?'장타형':p.a.con>=15?'교타형':p.a.spd>=15?'기동력형':'균형형'} ${POS_KO[p.pos]}.`);
  }
  if(p.m.cmp>=15) parts.push('중요한 순간에 침착성이 빛난다.'); else if(p.m.cmp<=6) parts.push('큰 경기에서 흔들리는 모습이 보인다.');
  parts.push(`약점은 ${L[low]}(${Math.round(a[low])}).`);
  const gap=p.PA-CA(p);
  if(p.age<=24 && gap>=15) parts.push(`잠재력이 ${gap}점 남은 성장형 자원 — 꾸준한 출전과 집중 훈련이 필요하다.`);
  else if(p.age>=34) parts.push(`30대 중반에 들어서며 ${p.isP?'구속':'주루'} 능력은 내리막이니 체력 관리가 중요하다.`);
  else if(gap<=3) parts.push('기량이 정점에 올라 있다.');
  if(p.m.dur<=6) parts.push('잔부상이 잦아 훈련 강도 조절이 필요하다.');
  return parts.join(' ');
}
// ---------- 선수 프로필 (FM 스타일) ----------
const FIELD_XY = {C:[100,186],'1B':[148,122],'2B':[124,96],SS:[76,96],'3B':[52,122],LF:[36,56],CF:[100,32],RF:[164,56],P:[100,130]};
function fieldDiagram(p){
  const dots = Object.entries(FIELD_XY).map(([pos,[x,y]])=>{
    let c='#2b333d', r=7;
    if(p.isP){ if(pos==='P'){ c='#3fb950'; r=10; } }
    else if(pos!=='P'){ const f=p.pos===pos?1:fit(p,pos); if(p.pos===pos||(p.pos==='IF'&&['2B','SS','3B'].includes(pos)&&f>=.95)||(p.pos==='OF'&&['LF','CF','RF'].includes(pos)&&f>=.95)){c='#3fb950';r=10;} else if(f>=.85){c='#e3c34a';} }
    return `<circle cx="${x*2}" cy="${pos==='P'?196:y*1.42+10}" r="${r*1.6}" fill="${c}" stroke="#0e1217" stroke-width="3"/>`; }).join('');
  return `<svg width="100%" viewBox="0 0 400 300" role="img" aria-label="수비 위치" style="max-width:280px;display:block;margin:6px auto">
    <path d="M200 290 L10 100 A270 270 0 0 1 390 100 Z" fill="#1f4f30" stroke="#2f6b44" stroke-width="2"/>
    <path d="M200 284 L272 212 L200 140 L128 212 Z" fill="#7c5a36" opacity=".9"/><path d="M200 272 L260 212 L200 152 L140 212 Z" fill="#2a6b40"/>
    ${dots}</svg>
    <div class="row" style="justify-content:center;gap:12px;font-size:12px" aria-hidden="true"><span><span class="dot" style="background:#3fb950"></span>주 포지션</span><span><span class="dot" style="background:#e3c34a"></span>가능</span></div>`;
}
function roleList(p){
  const a=p.a,m=p.m, s=(...v)=>v.reduce((x,y)=>x+y,0)/v.length/20*5;
  const R = p.isP ? [['선발 에이스',s(a.stf,a.ctl,a.brk,a.sta,a.vel)],['이닝이터',s(a.sta,a.sta,a.ctl,a.gb)],['마무리',s(a.vel,a.stf,a.brk,m.cmp)],['셋업맨',s(a.stf,a.brk,a.ctl)],['롱릴리프',s(a.sta,a.ctl,a.brk)],['땅볼 유도형',s(a.gb,a.gb,a.ctl,a.stf)]]
    : [['리드오프',s(a.con,a.eye,a.spd,a.brn,a.avk)],['테이블세터',s(a.con,a.avk,a.bnt,a.spd)],['중심타자',s(a.pow,a.pow,a.gap,a.con,m.cmp)],['교타자',s(a.con,a.con,a.avk,a.gap)],['수비형 야수',s(defVal(p),defVal(p),a.arm,a.rng)],['대주자',s(a.spd,a.stl,a.stl,a.brn)]];
  R.sort((x,y)=>y[1]-x[1]);
  return R.map(([l,v],i)=>`<div class="role ${i===0?'on':''}"><span class="rb" aria-hidden="true"></span>${starBar(v)}<span>${l}</span></div>`).join('');
}
function attrCol(title, rows, keys){ return `<div><div class="ah">${title}</div>${rows.map(([k,l,v,x])=>`<div class="at ${keys.has(k)?'key':''}"><span>${l}${x?` <span class="mute" style="font-size:12px">${x}</span>`:''}</span><b style="color:${attrColor(v)}">${Math.round(v)}</b></div>`).join('')}</div>`; }
function attrColor(v){ v=Math.round(v); return v>=17?'#3fb950':v>=14?'#9be08a':v>=11?'#e6edf3':v>=8?'#e3954b':'#f0605a'; }
PAGES.player = ()=>{
  const p=P(curPlayer); if(!p) return '<p class="mute">선수 정보를 찾을 수 없습니다.</p>';
  const a=p.a, st=p.st, isMine=p.team===S.user, ca=CA(p);
  const W=caWeights(p), keys=new Set(Object.entries(W).sort((x,y)=>y[1]-x[1]).slice(0,5).map(x=>x[0]));
  const row=(G,k)=>[k,(p.isP?P_ATTR:H_ATTR)[k],a[k],k==='vel'?kmh(p)+'km':''];
  let cols;
  if(p.isP){
    cols = attrCol('투구', ['vel','stf','ctl','brk'].map(k=>row(0,k)), keys) + `<div style="margin-top:12px"></div>` +
      attrCol('운영', ['sta','gb','hold','pfd'].map(k=>row(0,k)), keys);
    cols = `<div>${cols}</div>` + `<div>${attrCol('구종', Object.entries(p.pitches).sort((x,y)=>y[1]-x[1]).map(([k,v])=>[k,k,v,k==='고의사구'?'':`${kmh(p)+(typeof PITCH_SPD!=='undefined'?(PITCH_SPD[k]??-10):-10)}km`]), new Set())}</div>`;
  } else {
    cols = `<div>${attrCol('타격', ['con','gap','pow','eye','avk','bnt'].map(k=>row(0,k)), keys)}</div>` +
      `<div>${attrCol('주루', ['spd','stl','brn'].map(k=>row(0,k)), keys)}<div style="margin-top:12px"></div>${attrCol('수비', ['rng','hnd','arm','dp',...(p.pos==='C'?['cat']:[])].map(k=>row(0,k)), keys)}</div>`;
  }
  cols += `<div>${attrCol('정신력', Object.entries(M_ATTR).map(([k,l])=>[k,l,p.m[k]]), new Set())}</div>`;
  const bd=caBreakdown(p);
  const grp = p.isP ? [['투구',['vel','stf','ctl','brk'],'#58a6ff'],['운영',['sta','gb','hold','pfd'],'#e3954b']] : [['타격',['con','gap','pow','eye','avk','bnt'],'#58a6ff'],['주루',['spd','stl','brn'],'#e3954b'],['수비',['rng','hnd','arm','dp','cat'],'#3fb950']];
  const gs=grp.map(([g,ks,c])=>[g,ks.reduce((s,k)=>s+(bd[k]||0),0),c]); const room=Math.max(0,p.PA-ca);
  const war=estWAR(p);
  const statRows = p.isP ? [['경기',st.pg],['선발',st.gs],['이닝',ip(st.outs)],['승',st.w],['패',st.l],['세이브',st.sv],['홀드',st.hld],['ERA',era(st)],['탈삼진',st.pk],['WHIP',st.outs?((st.ph+st.pbb)*3/st.outs).toFixed(2):'-'],['WAR',war??'-']]
    : [['경기',st.g],['타석',st.pa],['타율',avg(st.h,st.ab)],['안타',st.h],['2루타',st.d],['홈런',st.hr],['타점',st.rbi],['도루',st.sb],['볼넷',st.bb],['OPS',ops(st)],['WAR',war??'-']];
  const focusOpts = Object.entries(p.isP?P_GROUPS:H_GROUPS).map(([g,ks])=>`<optgroup label="${g}">${Object.entries(ks).filter(([k])=>!(k==='cat'&&p.pos!=='C')).map(([k,l])=>`<option value="${k}" ${p.focus===k?'selected':''}>${l} 집중</option>`).join('')}</optgroup>`).join('');
  const grade = (()=>{ const g=recGrade(p); return g; })();
  return `<div class="hero">${avatar(p,120)}
    <div class="nm"><h1>${p.name}</h1><div class="l2">${archetype(p)} · ${POS_KO[p.pos]}</div><div class="l2">${p.foreign?'외국인 선수':'국내 선수'} · ${p.age}세 · ${handTxt(p)}</div></div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">${statusTag(p)}
      <details class="act"><summary>행동 ${chev}</summary><div>
        ${isMine?`<button onclick="go('tactics')">라인업에서 보기</button><button onclick="doRelease('${p.id}')">방출하기</button>`:p.team?`<button onclick="tradeTeam='${p.team}';tradeGet=['${p.id}'];tradeGive=[];go('transfer')">트레이드 제안하기</button>`:''}
        <button onclick="compareWith('${p.id}')">우리 팀 같은 포지션과 비교</button></div></details></div>
    <div class="box">${p.team?`<div class="row" style="flex-wrap:nowrap">${crest(p.team,40)}<div><b>${tname(p.team)}</b><div class="k">프로야구</div></div></div>`:'<b>FA</b>'}</div>
    <div class="box"><div class="k">${S.year} 시즌</div><b>${seasonLine(p)}</b><div class="k">${p.isP?`${st.pg}경기 · ${ip(st.outs)}이닝`:`${st.g}경기 · ${st.pa}타석`}</div></div>
    <div class="box"><div class="k">계약</div><b>연봉 ${p.salary}억 원</b><div class="k">잔여 ${p.yrs??1}년</div></div>
    <div class="box"><div class="k">능력 / 잠재력</div><div class="bigst"><span>능력</span>${caStars(p)}</div><div class="bigst"><span>잠재력</span>${paStars(p)}</div></div>
    ${!isMine&&p.team?`<div class="box"><div class="k">스카우트 보고서</div>${grade}</div>`:''}
  </div>
  <div class="panel pbody">
    <div><div class="row" style="justify-content:space-between"><div><div class="ah" style="border:0;margin:0">포지션</div><b>${POS_KO[p.pos]}</b></div></div>${fieldDiagram(p)}
      <div class="ah" style="margin-top:10px">역할 적합도</div>${roleList(p)}</div>
    ${cols}
    <div><div class="ah">정보</div>
      <div class="mute" style="font-size:12px">능력 배분 (현재 능력이 어디에 쓰였는지)</div>
      <div class="stack" style="margin:6px 0">${gs.map(([g,v,c])=>`<i title="${g}" style="width:${v/2}%;background:${c}"></i>`).join('')}<i title="성장 여지" style="width:${room/2}%;background:#e8b339"></i></div>
      <div class="legend" style="margin-top:4px;gap:10px;font-size:12px">${gs.map(([g,v,c])=>`<span><i style="background:${c}"></i>${g}</span>`).join('')}<span><i style="background:#e8b339"></i>성장 여지</span></div>
      <div class="ah" style="margin-top:14px">특성</div>${(p.traits||[]).map(t=>`<div style="margin:7px 0"><span class="pill ${TRAITS[t]?.bad?'bad':'tr'}">${traitIcon(t)} ${t}</span><div class="mute" style="font-size:12px;margin-top:2px">${TRAITS[t]?.d||''}</div></div>`).join('')||'<p class="mute">없음</p>'}
      ${p.inj?`<div class="ah" style="margin-top:14px">부상</div><b class="bad">${p.inj}일 결장 예상</b>`:''}
    </div>
  </div>
  <div class="legend2"><span><i></i>포지션에 중요한 능력 (CA가 많이 쓰임)</span></div>
  <div class="bcards">
    <div class="panel"><h3>컨디션</h3><div style="font-size:22px;font-weight:800;color:${p.cond>=85?'#3fb950':p.cond>=65?'#d2c84a':'#f85149'}">${p.cond>=85?'최상':p.cond>=65?'양호':'지침'}</div>${meter('컨디션',p.cond)}</div>
    <div class="panel"><h3>사기</h3><div style="font-size:22px;font-weight:800;color:${p.morale>=70?'#3fb950':p.morale>=45?'#d2c84a':'#f85149'}">${p.morale>=80?'매우 좋음':p.morale>=60?'좋음':p.morale>=45?'보통':'나쁨'}</div>${meter('사기',p.morale)}</div>
    <div class="panel wide"><h3>시즌 통계 · ${S.year}</h3><div style="overflow-x:auto"><table><tr>${statRows.map(([k])=>`<th class="num">${k}</th>`).join('')}</tr><tr>${statRows.map(([,v])=>`<td class="num"><b>${v}</b></td>`).join('')}</tr></table></div><p class="mute" style="font-size:12px;margin:6px 0 0">WAR은 게임 내 추정치</p></div>
    <div class="panel wide"><h3>스카우트 메모</h3><p style="margin:0;line-height:1.7;color:#d3dae2">${scoutMemo(p)}</p></div>
    ${isMine?`<div class="panel"><h3>개인 훈련</h3><select aria-label="개인 훈련" onchange="P('${p.id}').focus=this.value||null;save()"><option value="">팀 훈련 따름</option>${focusOpts}</select><p class="mute" style="font-size:12px">지정한 능력을 집중적으로 키워요.</p></div>`:''}
  </div>`;
};
function compareWith(id){
  const p=P(id); const mine=teamPlayers(S.teams[S.user]).filter(q=>q.id!==id && (p.isP? q.isP && (q.pos==='SP')===(p.pos==='SP') : !q.isP && (q.pos===p.pos||fit(q,p.pos)>=.95))).sort((a,b)=>CA(b)-CA(a)).slice(0,4);
  const L=p.isP?P_ATTR:H_ATTR, ks=Object.keys(L).filter(k=>!(k==='cat'&&p.pos!=='C'));
  const list=[p,...mine];
  modal(`<h2>선수 비교 · ${POS_KO[p.pos]}</h2><div style="overflow-x:auto"><table><tr><th>능력</th>${list.map(q=>`<th>${q.name}<br><span class="mute">${short(q.team||S.user)}</span></th>`).join('')}</tr>
    <tr><td>능력</td>${list.map(q=>`<td>${caStars(q)}</td>`).join('')}</tr><tr><td>잠재력</td>${list.map(q=>`<td>${paStars(q)}</td>`).join('')}</tr>
    ${ks.map(k=>`<tr><td>${L[k]}</td>${list.map(q=>`<td>${rc(q.a[k])}</td>`).join('')}</tr>`).join('')}</table></div>`);
}
function showPlayer(id){ closeModalQuiet(); histB.push(uiSnap()); histF=[]; curPlayer=id; go('player',true); }
function closeModalQuiet(){ document.getElementById('modal').innerHTML=''; }

function doRelease(id){ const p=P(id); if(!confirm(`${p.name}을(를) 방출할까요? 되돌릴 수 없습니다.`)) return; const e=releasePlayer(id); if(e) alert(e); else go('squad'); }

function openMail(i){
  const m=S.inbox[i]; m.read=true;
  let act='';
  if(m.action){ const a=m.action;
    act = a.done ? `<p class="mute">처리됨: ${{accepted:'수락',declined:'거절',expired:'만료'}[a.done]||a.done}</p>`
      : `<div class="row" style="margin-top:14px"><button class="pri" onclick="mailAccept(${i})">수락</button><button onclick="declineOffer(${i});closeModal()">거절</button></div>`; }
  modal(`<h2>${esc(m.title)}</h2><div class="mute">${m.from} · ${m.date}</div><hr style="border-color:var(--line)"><div class="body">${m.body}</div>${act}`); save();
}
function mailAccept(i){ const msg=acceptOffer(i); alert(msg); closeModal(); }

// ---------- 오프시즌 ----------
let faFilter='all';
PAGES.offseason = ()=>{
  if(S.phase!=='off' || !S.off) return '<p class="mute">오프시즌이 아닙니다.</p>';
  const off=S.off, u=S.teams[S.user];
  const steps = ['fa','draft','ready'].map((k,i)=>`<span class="pill ${off.stage===k?'tr':''}" style="${off.stage===k?'font-weight:800':''}">${i+1}. ${{fa:'FA 시장',draft:'신인 드래프트',ready:'개막 준비'}[k]}</span>`).join(' → ');
  const payroll = teamPlayers(u).reduce((s,p)=>s+p.salary,0);
  const head = `<div class="row" style="justify-content:space-between;margin-bottom:14px"><div><div class="eyebrow">OFFSEASON ${S.year}</div><h2 style="margin:4px 0 0">오프시즌</h2></div><div class="row">${steps}</div></div>
    <div class="grid g4" style="margin-bottom:16px">${[['잔고',u.balance.toFixed(1)+'억'],['연봉 총액',payroll.toFixed(1)+'억'],['등록 인원',u.roster.length+'명'],['외국인',foreignCount(u)+' / 4']].map(([k,v])=>`<div class="tile"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>`;
  if(off.stage==='fa'){
    let pool = off.pool.map(id=>S.players[id]).filter(p=>p && !p.team);
    if(faFilter==='mine') pool=pool.filter(p=>p.faFrom===S.user); if(faFilter==='h') pool=pool.filter(p=>!p.isP); if(faFilter==='p') pool=pool.filter(p=>p.isP); if(faFilter==='f') pool=pool.filter(p=>p.foreign);
    pool.sort((a,b)=>CA(b)-CA(a));
    const offered = Object.keys(off.offers).length;
    return head + `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">FA 시장 (${pool.length}명)</h3>
      <div class="row">${[['all','전체'],['mine','우리 팀 FA'],['h','야수'],['p','투수'],['f','외국인']].map(([k,l])=>`<button class="${faFilter===k?'pri':''}" onclick="faFilter='${k}';render()">${l}</button>`).join('')}
      <button class="pri" onclick="closeFA()">FA 시장 마감 → 드래프트 (${offered}건 오퍼)</button></div></div>
      <div class="scroll"><table><thead><tr><th>이름</th><th>이전 소속</th><th>포지션</th><th class="num">나이</th><th>CA / PA</th><th>특성</th><th class="num">요구 조건</th><th>우리 오퍼</th><th></th></tr></thead><tbody>
      ${pool.map(p=>{ const o=off.offers[p.id]; return `<tr class="${p.faFrom===S.user?'me':''}"><td><a href="#" onclick="showPlayer('${p.id}');return false"><b>${p.name}</b></a>${p.foreign?` <span class="pill">${p.aq?'아시아쿼터':'외국인'}</span>`:''}</td>
        <td>${p.faFrom?`${crest(p.faFrom,16)} ${short(p.faFrom)}`:'<span class="mute">신규</span>'}</td><td>${POS_KO[p.pos]}</td><td class="num">${p.age}</td><td>${cab(p)} <span class="mute">/ ${p.PA}</span></td><td>${traitChips(p,2)}</td>
        <td class="num">${p.ask.yrs}년 ${(p.ask.sal*p.ask.yrs).toFixed(1)}억 <span class="mute">(연 ${p.ask.sal})</span></td>
        <td>${o?`<b class="good">${o.yrs}년 ${(o.sal*o.yrs).toFixed(1)}억</b>`:'<span class="mute">-</span>'}</td><td><button onclick="offerModal('${p.id}')">${p.faFrom===S.user?'재계약':'오퍼'}</button></td></tr>`; }).join('')}</tbody></table></div>
      <p class="mute" style="font-size:12px">선수는 금액·계약 기간·구단 매력(팬 규모·성적·원소속 여부)을 비교해 최고 조건을 고릅니다. 다른 구단 FA(CA 130 이상)를 영입하면 원소속 구단에 연봉 200% 보상금을 지급합니다. 우리 팀 FA를 잡지 않으면 시장에서 다른 팀으로 갈 수 있어요.</p></div>`;
  }
  if(off.stage==='draft'){
    const d=off.draft, myTurn=d.picks[d.idx]===S.user;
    const av = draftAvail().sort((a,b)=>b.scout-a.scout);
    return head + `<div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr)"><div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px">
      <h3 style="margin:0">신인 드래프트 — ${Math.floor(d.idx/10)+1}라운드 ${d.idx%10+1}순위 ${myTurn?'<span class="good">· 우리 차례!</span>':''}</h3><button class="pri" onclick="userAutoPick();render()" ${myTurn?'':'disabled'}>스카우트 추천 지명</button></div>
      <div class="scroll"><table><thead><tr><th>이름</th><th>학교</th><th>포지션</th><th>투타</th><th>현재 CA</th><th>스카우트 평가 잠재력</th><th>특성</th><th></th></tr></thead><tbody>
      ${av.map(p=>`<tr><td><a href="#" onclick="showPlayer('${p.id}');return false"><b>${p.name}</b></a></td><td>${p.school} (${p.age}세)</td><td>${POS_KO[p.pos]}</td><td>${handTxt(p)}</td><td>${cab(p)}</td>
        <td><b>${p.scout}</b> <span style="color:#f2c14e">${'★'.repeat(clamp(Math.round((p.scout-60)/28),1,5))}</span></td><td>${traitChips(p,2)}</td><td><button onclick="userPick('${p.id}');render()" ${myTurn?'':'disabled'}>지명</button></td></tr>`).join('')}</tbody></table></div>
      <p class="mute" style="font-size:12px">잠재력은 스카우트 추정치(수석코치 능력이 높을수록 정확)입니다. 1라운드 계약금 2.5억, 2R 1.2억, 3R 0.6억, 4R 0.3억.</p></div>
      <div class="card scroll"><h3>지명 현황</h3>${d.log.slice().reverse().map(x=>`<div class="fd" style="${x.tid===S.user?'color:#ffd166':''}">${x.text}</div>`).join('')||'<p class="mute">아직 지명이 없습니다.</p>'}</div></div>`;
  }
  const myDraft = off.draft.log.filter(x=>x.tid===S.user);
  return head + `<div class="grid g2"><div class="card"><h3>FA 계약 결과</h3>${off.log.map(l=>`<div class="fd">${l}</div>`).join('')||'<p class="mute">없음</p>'}</div>
    <div class="card"><h3>우리 구단 신인</h3>${myDraft.map(x=>`<div class="fd"><a href="#" onclick="showPlayer('${x.pid}');return false">${x.text}</a></div>`).join('')}
    <div style="margin-top:16px"><button class="pri" onclick="nextSeason()">${S.year+1} 시즌 시작 ▶</button></div>
    <p class="mute" style="font-size:12px">시작 전 라인업·전술과 트레이드를 점검하세요. 등록 인원이 26명 미만이면 육성선수가 자동 등록됩니다.</p></div></div>`;
};
function offerModal(id){
  const p=P(id);
  modal(`<div class="row" style="flex-wrap:nowrap">${avatar(p,64)}<div><h2 style="margin:0">${p.name} ${p.faFrom===S.user?'재계약':'영입'} 오퍼</h2><div class="mute">${POS_KO[p.pos]} · ${p.age}세 · CA ${CA(p)} / PA ${p.PA} · 요구 ${p.ask.yrs}년 연 ${p.ask.sal}억</div></div></div>
    <div class="row" style="margin-top:16px">연봉(억/년) <input id="ofSal" type="number" step="0.1" min="0.3" value="${p.ask.sal}" style="width:110px">
    계약 기간 <select id="ofYrs">${[1,2,3,4].map(y=>`<option ${y===p.ask.yrs?'selected':''}>${y}</option>`).join('')}</select>년
    <button class="pri" onclick="submitOffer('${id}')">오퍼 제출</button></div>
    <p class="mute" style="font-size:12px">요구액의 80% 미만이면 거절합니다. 다른 구단보다 좋은 조건을 내야 데려올 수 있어요. 현재 잔고 ${S.teams[S.user].balance.toFixed(1)}억.</p>`);
}
function submitOffer(id){ const r=makeOffer(id, +document.getElementById('ofSal').value, +document.getElementById('ofYrs').value); alert(r.msg); if(r.ok) closeModal(); }
function closeFA(){ if(!confirm('FA 시장을 마감하고 결과를 발표할까요?')) return; finishFA(); render(); }

// ---------- 라인업·전술 ----------
let luSel=null, pSel=null; // 교체 대기 중인 슬롯
PAGES.tactics = ()=>{
  const u=S.teams[S.user]; validateTeam(u,false);
  const inLU = new Set(u.lineup.map(x=>x.pid));
  const hit = teamPlayers(u).filter(p=>!p.isP).sort((a,b)=>batVal(b)-batVal(a));
  const pit = teamPlayers(u).filter(p=>p.isP).sort((a,b)=>ovrOf(b)-ovrOf(a));
  const posOpts = cur=>['C','1B','2B','3B','SS','LF','CF','RF','DH'].map(x=>`<option ${x===cur?'selected':''} value="${x}">${POS_KO[x]}</option>`).join('');
  const nameCell = (p,sub)=>pn(p,34,(p.inj?`<span class="bad">부상 ${p.inj}일</span> · `:'')+sub);
  const batLine = p=>{ const st=p.st; return st.pa?`${avg(st.h,st.ab)} · ${st.hr}홈런 · OPS ${ops(st)}`:`${POS_KO[p.pos]} · ${p.hand==='L'?'좌타':p.hand==='S'?'양타':'우타'} · ${p.age}세`; };
  const pitLine = p=>{ const st=p.st; return st.outs?`ERA ${era(st)} · ${st.w}승 ${st.l}패${st.sv?' '+st.sv+'세':''}${st.hld?' '+st.hld+'홀':''}`:`${POS_KO[p.pos]} · ${p.hand==='L'?'좌완':'우완'} · ${p.age}세`; };
  const fitTag = f=> f<0.85?'<span class="pill bad">부적합</span>':f<1?'<span class="pill" style="color:var(--warn)">보조</span>':'<span class="pill" style="color:var(--good)">주 포지션</span>';
  const lu = u.lineup.map((x,i)=>{ const p=P(x.pid); const f=fit(p,x.pos), sel=luSel===i;
    return `<tr class="${sel?'sel':''}"><td class="num"><b style="font-size:16px">${i+1}</b></td><td>${nameCell(p,batLine(p))}</td>
     <td><select aria-label="${i+1}번 수비 위치" onchange="setLU(${i},'pos',this.value)">${posOpts(x.pos)}</select></td><td>${fitTag(f)}</td><td>${cab(p)}</td><td>${traitChips(p,2)}</td>
     <td style="white-space:nowrap"><button aria-label="타순 올리기" onclick="moveLU(${i},-1)">▲</button> <button aria-label="타순 내리기" onclick="moveLU(${i},1)">▼</button>
     <button class="${sel?'pri':''}" onclick="selLU(${i})">${sel?'선택 취소':luSel!=null?'타순 맞바꾸기':'교체'}</button></td></tr>`; }).join('');
  const bench = hit.filter(p=>!inLU.has(p.id)).map(p=>`<tr><td>${nameCell(p,batLine(p))}</td><td>${POS_KO[p.pos]}</td><td>${cab(p)}</td><td>${traitChips(p,1)}</td><td class="num">${Math.round(p.cond)}%</td>
     <td>${luSel!=null?`<button class="pri" ${p.inj?'disabled':''} onclick="subIn('${p.id}')">${luSel+1}번에 투입</button>`:''}</td></tr>`).join('');
  const posCount={}; u.lineup.forEach(x=>posCount[x.pos]=(posCount[x.pos]||0)+1);
  const dup = Object.entries(posCount).filter(([k,v])=>v>1).map(([k])=>POS_KO[k]);
  // 투수
  const roleOf = id=> u.rotation.includes(id)?`${u.rotation.indexOf(id)+1}선발`: id===u.closer?'마무리': u.setup.includes(id)?`필승조 ${u.setup.indexOf(id)+1}`:'불펜';
  const pRow = (label,id,key)=>{ const p=P(id); const sel=pSel===key;
    return `<tr class="${sel?'sel':''}"><td style="white-space:nowrap">${label}</td><td>${p?nameCell(p,pitLine(p)):'<span class="mute">비어 있음</span>'}</td><td>${p?cab(p):''}</td>
     <td class="mute" style="white-space:nowrap">${p?(key.startsWith('r')?`휴식 ${Math.min(p.rest,9)}일`:`피로 ${Math.round(p.fat)}`):''}</td>
     <td><button class="${sel?'pri':''}" onclick="selP('${key}')">${sel?'선택 취소':'교체'}</button></td></tr>`; };
  const rot = u.rotation.map((id,i)=>pRow(`${i+1}선발`,id,'r'+i)).join('');
  const pen = pRow('마무리',u.closer,'c')+[0,1].map(i=>pRow(`필승조 ${i+1}`,u.setup[i],'s'+i)).join('');
  const staff = pit.map(p=>`<tr><td>${nameCell(p,pitLine(p))}</td><td><span class="pill">${roleOf(p.id)}</span></td><td>${cab(p)}</td><td>${traitChips(p,1)}</td><td class="mute">${p.inj?'<span class="bad">부상</span>':`휴식 ${Math.min(p.rest,9)}일 · 피로 ${Math.round(p.fat)}`}</td>
     <td>${pSel!=null?`<button class="pri" ${p.inj?'disabled':''} onclick="assignP('${p.id}')">여기에 배치</button>`:''}</td></tr>`).join('');
  const sl = (k,l,desc)=>`<div class="row" style="margin:8px 0"><span style="width:110px">${l}</span>${[0,1,2].map(v=>`<button class="${u.tac[k]===v?'pri':''}" onclick="S.teams[S.user].tac.${k}=${v};save();render()">${['적게','보통','많이'][v]}</button>`).join('')}<span class="mute">${desc}</span></div>`;
  const field = `<svg width="100%" viewBox="0 0 400 300" role="img" aria-label="수비 배치도" style="max-width:520px;display:block;margin:auto">
    <path d="M200 290 L10 100 A270 270 0 0 1 390 100 Z" fill="#1f4f30" stroke="#2f6b44" stroke-width="2"/>
    <path d="M200 284 L272 212 L200 140 L128 212 Z" fill="#7c5a36" opacity=".9"/><path d="M200 272 L260 212 L200 152 L140 212 Z" fill="#2a6b40"/>
    ${u.lineup.filter(x=>x.pos!=='DH').map(x=>{const p=P(x.pid); const [fx,fy]=FIELD_XY[x.pos]||[100,100]; const X=fx*2, Y=fy*1.42+10; const f=fit(p,x.pos);
      return `<g><circle cx="${X}" cy="${Y}" r="9" fill="${f>=1?'#3fb950':f>=.85?'#e3c34a':'#f85149'}" stroke="#0e1217" stroke-width="2"/><text x="${X}" y="${Y-14}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" stroke="#0e1217" stroke-width="3" paint-order="stroke">${p.name}</text></g>`;}).join('')}
    ${(()=>{const sp=P(u.rotation[u.rotIdx%u.rotation.length]); return sp?`<g><circle cx="200" cy="196" r="9" fill="#58a6ff" stroke="#0e1217" stroke-width="2"/><text x="200" y="182" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" stroke="#0e1217" stroke-width="3" paint-order="stroke">${sp.name}</text></g>`:''})()}
  </svg>`;
  const dh = u.lineup.find(x=>x.pos==='DH');
  return `<h2>라인업 · 전술</h2>
  <p class="mute" style="margin-top:-6px">선수 이름을 누르면 선수 화면으로 이동해요. <b>교체</b>를 누른 뒤 아래 명단에서 선수를 고르면 그 자리에 들어가요. 줄을 <b>끌어다 놓아도</b> 바꿀 수 있어요 (타순끼리, 벤치↔라인업, 투수진↔보직).</p>
  <div class="grid" style="grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr);align-items:start">
   <div class="card" style="min-width:0"><div class="row" style="justify-content:space-between"><h3>선발 라인업</h3><button onclick="luSel=null;autoLineup(S.teams[S.user]);save();render()">수석코치 추천 라인업</button></div>
    ${dup.length?`<p class="bad">중복 포지션: ${dup.join(', ')}</p>`:''}
    <div style="overflow-x:auto"><table class="lu">${lu}</table></div></div>
   <div class="card"><h3>수비 배치</h3>${field}<p class="mute" style="font-size:12px;text-align:center;margin:6px 0 0">${dh?`지명타자: <b style="color:#fff">${P(dh.pid).name}</b> · `:''}파란 점은 다음 선발 투수 · 초록 주 포지션 · 노랑 보조 · 빨강 부적합</p></div></div>
  <div class="grid tac2" style="margin-top:14px"><div class="grid" style="min-width:0;align-content:start">
   <div class="card${luSel!=null?' pick':''}" style="min-width:0"><h3>벤치 야수 ${luSel!=null?`<span class="warn">· ${luSel+1}번 타자(${P(u.lineup[luSel].pid).name}) 대신 넣을 선수를 고르세요</span>`:''}</h3>
    <div style="overflow-x:auto"><table class="lu">${bench||'<tr><td class="mute">벤치 야수가 없어요</td></tr>'}</table></div></div>
   <div class="card"><h3>팀 전술</h3>${sl('steal','도루','빠른 주자의 도루 시도 빈도')}${sl('bunt','희생번트','접전 후반 번트 작전')}${sl('hook','선발 교체','적게 = 선발을 오래 끌고 감')}
    <p class="mute">감독 전술 능력 ${u.mgr.tac} · 수석코치 ${u.staff['수석'].rating}</p></div></div>
  <div class="grid" style="min-width:0;align-content:start">
   <div class="card"><div class="row" style="justify-content:space-between"><h3>선발 로테이션</h3><button onclick="pSel=null;autoPitching(S.teams[S.user]);save();render()">투수코치 추천</button></div><div style="overflow-x:auto"><table class="lu">${rot}</table></div></div>
   <div class="card"><h3>불펜 보직</h3><div style="overflow-x:auto"><table class="lu">${pen}</table></div></div>
   <div class="card${pSel!=null?' pick':''}"><h3>투수진 ${pSel!=null?'<span class="warn">· 배치할 투수를 고르세요</span>':''}</h3><div class="scroll" style="max-height:420px"><table class="lu">${staff}</table></div></div></div></div>`;
};
function selLU(i){
  const u=S.teams[S.user];
  if(luSel===i){ luSel=null; }
  else if(luSel!=null){ [u.lineup[i].pid,u.lineup[luSel].pid]=[u.lineup[luSel].pid,u.lineup[i].pid]; luSel=null; save(); } // 두 타자 맞바꾸기(수비 위치는 유지)
  else luSel=i;
  render();
}
function subIn(pid){ const u=S.teams[S.user]; if(luSel==null) return; u.lineup[luSel].pid=pid; luSel=null; save(); render(); }
function selP(k){ pSel = pSel===k?null:k; render(); }
function assignP(pid){
  const u=S.teams[S.user], k=pSel; if(!k) return;
  const old = k[0]==='r'?u.rotation[+k.slice(1)] : k==='c'?u.closer : u.setup[+k.slice(1)];
  // 새 투수가 맡던 자리에는 원래 투수를 넣어 맞바꾼다
  const ri=u.rotation.indexOf(pid), si=u.setup.indexOf(pid), wasC=u.closer===pid;
  if(ri>=0) u.rotation[ri]=old; if(si>=0) u.setup[si]=old; if(wasC) u.closer=old;
  if(k[0]==='r') u.rotation[+k.slice(1)]=pid; else if(k==='c') u.closer=pid; else u.setup[+k.slice(1)]=pid;
  u.rotation=u.rotation.filter(Boolean); u.setup=u.setup.filter(Boolean);
  pSel=null; fixPitching(u); save(); render();
}
function setLU(i,k,v){ const u=S.teams[S.user]; u.lineup[i][k]=v; save(); render(); }
function moveLU(i,d){ const u=S.teams[S.user], j=i+d; if(j<0||j>=u.lineup.length) return; [u.lineup[i],u.lineup[j]]=[u.lineup[j],u.lineup[i]]; save(); render(); }
function setRot(i,v){ const u=S.teams[S.user]; const j=u.rotation.indexOf(v); if(j>=0) u.rotation[j]=u.rotation[i]; u.rotation[i]=v; if(u.closer===v) u.closer=null; u.setup=u.setup.filter(x=>x!==v); fixPitching(u); save(); render(); }

// ---------- 훈련 ----------
PAGES.training = ()=>{
  const u=S.teams[S.user], tr=u.train;
  const btns = (k,list)=>list.map(v=>`<button class="${tr[k]===v?'pri':''}" onclick="S.teams[S.user].train.${k}='${v}';save();render()">${v}</button>`).join(' ');
  const indiv = teamPlayers(u).filter(p=>p.focus);
  const young = teamPlayers(u).filter(p=>p.age<=25).sort((a,b)=>(b.PA-CA(b))-(a.PA-CA(a))).slice(0,8);
  return `<h2>훈련</h2><div class="grid g2">
   <div class="card"><h3>야수 훈련 중점</h3><div class="row">${btns('hit',Object.keys(TRAIN_HIT))}</div>
    <p class="mute">타격코치 ${rc(u.staff['타격'].rating)} 수비코치 ${rc(u.staff['수비'].rating)} 주루코치 ${rc(u.staff['주루'].rating)} 배터리코치 ${rc(u.staff['배터리'].rating)}</p>
    <h3 style="margin-top:14px">투수 훈련 중점</h3><div class="row">${btns('pit',Object.keys(TRAIN_PIT))}</div>
    <p class="mute">투수코치 ${rc(u.staff['투수'].rating)}</p>
    <h3 style="margin-top:14px">훈련 강도</h3><div class="row">${[1,2,3].map(v=>`<button class="${tr.inten===v?'pri':''}" onclick="S.teams[S.user].train.inten=${v};save();render()">${INTEN[v].label}</button>`).join(' ')}</div>
    <p class="mute">강도 높음: 성장 ×1.45, 부상 위험·피로 증가 / 낮음: 성장 ×0.6, 컨디션 회복. '회복'은 훈련 대신 휴식합니다. 트레이닝코치 ${rc(u.staff['트레이닝'].rating)}가 부상 위험을 낮춥니다.</p></div>
   <div class="grid"><div class="card"><h3>개인 훈련 중인 선수</h3>${indiv.length?indiv.map(p=>`<div>${p.name} — ${(p.isP?P_ATTR:H_ATTR)[p.focus]} 집중 <a href="#" onclick="P('${p.id}').focus=null;save();render();return false">해제</a></div>`).join(''):'<p class="mute">선수단 화면에서 선수를 눌러 개인 훈련을 지정할 수 있습니다.</p>'}</div>
    <div class="card"><h3>성장 기대주 (25세 이하)</h3><table>${young.map(p=>`<tr onclick="showPlayer('${p.id}')" style="cursor:pointer"><td>${p.name}</td><td>${POS_KO[p.pos]}</td><td>${p.age}세</td><td>${cab(p)}</td><td style="color:gold">${stars(p)}</td></tr>`).join('')}</table>
    <p class="mute">성장은 나이·잠재력과 현재 능력의 차이·코치 능력·사기·훈련 강도에 따라 결정됩니다. 33세 이후에는 노화로 능력이 떨어집니다.</p></div></div></div>`;
};

// ---------- 일정 ----------
PAGES.schedule = ()=>{
  const mine = S.results.filter(r=>r.h===S.user||r.a===S.user).slice().reverse();
  const up = []; for(let d=S.dayIdx; d<Math.min(S.dayIdx+10,S.schedule.length); d++){ const g=S.schedule[d].find(x=>x.includes(S.user)); if(g) up.push(g); }
  let post='';
  if(S.post){ post = `<div class="card" style="margin-bottom:14px"><h3>포스트시즌</h3>${S.post.log.map(l=>`<div>${l}</div>`).join('')}
    ${S.post.series?`<div><b>${S.post.series.name}</b>: ${tname(S.post.series.hi)} ${S.post.series.wins[0]} - ${S.post.series.wins[1]} ${tname(S.post.series.lo)} ${S.post.series.games.map((g,i)=>`<a href="#" onclick="showGame(S.post.series.games[${i}].full);return false">[${i+1}차전 ${g.s[0]}:${g.s[1]}]</a>`).join(' ')}</div>`:''}
    ${S.post.champion?`<div class="big">🏆 ${tname(S.post.champion)}</div>`:''}</div>`; }
  return `<h2>일정 · 결과</h2>${post}<div class="grid g2"><div class="card"><h3>다가오는 경기</h3><table>${up.map(g=>`<tr><td>${g[0]===S.user?'홈':'원정'}</td><td>${g[0]===S.user?'vs '+tname(g[1]):'@ '+tname(g[0])}</td><td class="mute">${TD(g[0]).stadium}</td></tr>`).join('')||'<tr><td class="mute">없음</td></tr>'}</table></div>
   <div class="card scroll"><h3>지난 경기 (${mine.length})</h3><table>${mine.map(resultRow).join('')}</table></div></div>`;
};

// ---------- 순위 ----------
function standingsTable(compact){
  const st=standings(), top=st[0];
  return `<table><tr><th>#</th><th>팀</th><th class="num">경기</th><th class="num">승</th><th class="num">패</th><th class="num">무</th><th class="num">승률</th><th class="num">게임차</th>${compact?'':'<th class="num">득점</th><th class="num">실점</th><th>최근10</th><th>연속</th>'}</tr>
   ${st.map((t,i)=>`<tr class="${t.id===S.user?'me':''}"><td>${i+1}${i===4?' <span class="mute">┄</span>':''}</td><td>${crest(t.id,18)} ${compact?short(t.id):tname(t.id)}</td><td class="num">${t.w+t.l+t.t}</td><td class="num">${t.w}</td><td class="num">${t.l}</td><td class="num">${t.t}</td>
    <td class="num">${pct(t).toFixed(3)}</td><td class="num">${i?(((top.w-t.w)+(t.l-top.l))/2).toFixed(1):'-'}</td>${compact?'':`<td class="num">${t.rs}</td><td class="num">${t.ra}</td><td>${t.last.map(x=>x==='W'?'<span class="good">●</span>':x==='L'?'<span class="bad">●</span>':'○').join('')}</td><td>${t.streak>0?t.streak+'연승':t.streak<0?(-t.streak)+'연패':'-'}</td>`}</tr>`).join('')}</table>`;
}
PAGES.standings = ()=>`<h2>${S.year} 리그 순위</h2><div class="card" style="overflow:auto">${standingsTable(false)}</div><p class="mute">5위까지 포스트시즌 진출 (4·5위 와일드카드 결정전, 4위 1승 어드밴티지).</p>`;

// ---------- 기록 ----------
PAGES.stats = ()=>{
  const all = Object.values(S.players).filter(p=>p.team);
  const g = Math.max(1, ...Object.values(S.teams).map(t=>t.w+t.l+t.t));
  const lb = (title, list, val, fmt=v=>v)=>`<div class="card"><h3>${title}</h3><table>${list.slice(0,10).map((p,i)=>`<tr class="${p.team===S.user?'me':''}" onclick="showPlayer('${p.id}')" style="cursor:pointer"><td>${i+1}</td><td>${p.name}</td><td class="mute">${short(p.team)}</td><td class="num"><b>${fmt(val(p))}</b></td></tr>`).join('')}</table></div>`;
  const qb = all.filter(p=>p.st.pa>=g*3.1), qp = all.filter(p=>p.st.outs>=g*3);
  const by = (arr,f,asc)=>arr.slice().sort((a,b)=>asc?f(a)-f(b):f(b)-f(a));
  const AVG=p=>p.st.ab?p.st.h/p.st.ab:0, ERA=p=>p.st.outs?p.st.er*27/p.st.outs:99, OPS=p=>+ops(p.st)||0;
  return `<h2>개인 기록</h2><div class="row" style="margin-bottom:10px"><button class="${statTab==='bat'?'pri':''}" onclick="statTab='bat';render()">타격</button><button class="${statTab==='pit'?'pri':''}" onclick="statTab='pit';render()">투구</button><button class="${statTab==='team'?'pri':''}" onclick="statTab='team';render()">우리 팀</button></div>
  ${statTab==='bat'?`<div class="grid g3">${lb('타율 (규정타석)',by(qb,AVG),AVG,v=>v.toFixed(3))}${lb('홈런',by(all,p=>p.st.hr),p=>p.st.hr)}${lb('타점',by(all,p=>p.st.rbi),p=>p.st.rbi)}${lb('안타',by(all,p=>p.st.h),p=>p.st.h)}${lb('OPS (규정타석)',by(qb,OPS),OPS,v=>v.toFixed(3))}${lb('도루',by(all,p=>p.st.sb),p=>p.st.sb)}</div>`:''}
  ${statTab==='pit'?`<div class="grid g3">${lb('평균자책점 (규정이닝)',by(qp,ERA,true),ERA,v=>v.toFixed(2))}${lb('다승',by(all,p=>p.st.w),p=>p.st.w)}${lb('탈삼진',by(all,p=>p.st.pk),p=>p.st.pk)}${lb('세이브',by(all,p=>p.st.sv),p=>p.st.sv)}${lb('홀드',by(all,p=>p.st.hld),p=>p.st.hld)}${lb('이닝',by(all,p=>p.st.outs),p=>p.st.outs,ip)}</div>`:''}
  ${statTab==='team'?teamStats():''}`;
};
function teamStats(){
  const ps=teamPlayers(S.teams[S.user]);
  const h=ps.filter(p=>!p.isP&&p.st.pa).sort((a,b)=>b.st.pa-a.st.pa), pp=ps.filter(p=>p.isP&&p.st.outs).sort((a,b)=>b.st.outs-a.st.outs);
  return `<div class="card scroll"><h3>타자</h3><table><tr><th>이름</th><th class="num">경기</th><th class="num">타석</th><th class="num">타율</th><th class="num">안타</th><th class="num">2루타</th><th class="num">홈런</th><th class="num">타점</th><th class="num">득점</th><th class="num">도루</th><th class="num">볼넷</th><th class="num">삼진</th><th class="num">OPS</th></tr>
   ${h.map(p=>{const s=p.st;return `<tr><td>${p.name}</td><td class="num">${s.g}</td><td class="num">${s.pa}</td><td class="num">${avg(s.h,s.ab)}</td><td class="num">${s.h}</td><td class="num">${s.d}</td><td class="num">${s.hr}</td><td class="num">${s.rbi}</td><td class="num">${s.r}</td><td class="num">${s.sb}</td><td class="num">${s.bb}</td><td class="num">${s.k}</td><td class="num">${ops(s)}</td></tr>`}).join('')}</table>
   <h3 style="margin-top:14px">투수</h3><table><tr><th>이름</th><th class="num">경기</th><th class="num">선발</th><th class="num">이닝</th><th class="num">승</th><th class="num">패</th><th class="num">세</th><th class="num">홀</th><th class="num">ERA</th><th class="num">탈삼진</th><th class="num">볼넷</th><th class="num">피홈런</th></tr>
   ${pp.map(p=>{const s=p.st;return `<tr><td>${p.name}</td><td class="num">${s.pg}</td><td class="num">${s.gs}</td><td class="num">${ip(s.outs)}</td><td class="num">${s.w}</td><td class="num">${s.l}</td><td class="num">${s.sv}</td><td class="num">${s.hld}</td><td class="num">${era(s)}</td><td class="num">${s.pk}</td><td class="num">${s.pbb}</td><td class="num">${s.phr}</td></tr>`}).join('')}</table></div>`;
}

// ---------- 구단·팬 ----------
PAGES.club = ()=>{
  const td=TD(S.user), u=S.teams[S.user], f=td.fans;
  const payroll = teamPlayers(u).reduce((s,p)=>s+p.salary,0);
  const parkTxt = td.park.hr>1.1?'타자 친화 (홈런 많음)':td.park.hr<0.9?'투수 친화 (넓은 구장)':'중립';
  return `<div class="row" style="margin-bottom:12px">${crest(S.user,56)}<h2 style="margin:0">${td.name}</h2></div>${ballpark(S.user,160)}<div style="height:14px"></div><div class="grid g2">
   <div class="card"><h3>연고지 · 구장</h3><p>연고지: <b>${td.city}</b><br>홈구장: <b>${td.stadium}</b> (수용 ${td.cap.toLocaleString()}명)<br>구장 성향: ${parkTxt} · 홈런 보정 ×${td.park.hr}<br>모기업: ${td.owner}</p>
    <h3>구단 상황</h3><p>${td.status}</p><p>2025 시즌 ${td.prevRank}위 · 이번 시즌 목표: <b>${goalText(u.goalRank)}</b></p></div>
   <div class="card"><h3>팬 특성</h3><p>${f.desc}</p>${meter('팬 규모',f.size)}${meter('열정',f.passion)}${meter('인내심',f.patience)}${meter('기대치',f.expect)}
    <hr style="border-color:var(--line)">${meter('현재 만족도',u.fanMood)}<p class="mute">열정이 높으면 연승 때 크게 기뻐하고, 인내심이 낮으면 연패에 빠르게 등을 돌립니다. 기대치가 높을수록 패배의 실망이 큽니다. 팬 만족도는 관중 수와 이사회 신뢰에 영향을 줍니다.</p></div>
   <div class="card"><h3>재정</h3><table>
    <tr><td>현재 잔고</td><td class="num"><b class="${u.balance<0?'bad':''}">${u.balance.toFixed(1)}억</b></td></tr>
    <tr><td>시즌 수입 (입장·굿즈·스폰서)</td><td class="num good">+${u.rev.toFixed(1)}억</td></tr>
    <tr><td>시즌 지출 (연봉·코치)</td><td class="num bad">-${u.exp.toFixed(1)}억</td></tr>
    <tr><td>선수단 연봉 총액</td><td class="num">${payroll.toFixed(1)}억</td></tr>
    <tr><td>홈 평균 관중</td><td class="num">${u.homeG?Math.round(u.attTotal/u.homeG).toLocaleString():'-'}명</td></tr></table></div>
   <div class="card"><h3>감독</h3><p><b>${esc(u.mgr.name)}</b> (원래 감독: ${td.mgr.name}, ${td.mgr.age}세)<br>스타일: ${td.mgr.style}</p>
    ${meter('전술', u.mgr.tac*5)}${meter('동기부여', u.mgr.mot*5)}${meter('육성', u.mgr.dev*5)}</div>
  </div>
  <h3 style="margin-top:18px">리그 10개 구단</h3><div class="card" style="overflow:auto"><table><tr><th>구단</th><th>연고지</th><th>홈구장</th><th>감독</th><th class="num">팬 규모</th><th class="num">열정</th><th class="num">인내</th><th class="num">기대</th><th class="num">예산</th></tr>
   ${TEAM_DATA.map(t=>`<tr class="${t.id===S.user?'me':''}"><td><span style="color:${t.color}">■</span> ${t.name}</td><td>${t.city}</td><td>${t.stadium}</td><td>${t.id===S.user?esc(S.mgrName):t.mgr.name}</td><td class="num">${t.fans.size}</td><td class="num">${t.fans.passion}</td><td class="num">${t.fans.patience}</td><td class="num">${t.fans.expect}</td><td class="num">${t.budget}억</td></tr>`).join('')}</table></div>`;
};

// ---------- 코치진 ----------
// ---------- 코치진 · 코치 프로필 ----------
const COACH_ATTR = [['bat','타격 지도'],['pit','투수 지도'],['fld','수비 지도'],['run','주루 지도'],['cat','포수 지도'],['fit','컨디셔닝'],['yth','유망주 육성'],['tac','전술']];
const COACH_MENT = [['mot','동기 부여'],['dis','규율'],['man','인력 관리'],['jca','선수 능력 평가'],['jpa','선수 잠재력 평가']];
const ROLE_KEY = {수석:['tac','man','mot','jca'],투수:['pit','yth'],타격:['bat','yth'],수비:['fld'],주루:['run'],배터리:['cat','pit'],트레이닝:['fit']};
function coachObj(){ if(!curCoach) return null; const u=S.teams[S.user];
  if(curCoach.m!=null){ const c=S.coachMarket[curCoach.m]; return c?{...c, mine:false}:null; }
  const c=u.staff[curCoach.r]; return c?{...c, role:curCoach.r, mine:true}:null; }
function coachAttrs(c){ // 보직 능력(rating)에서 세부 능력을 결정적으로 펼친 값 — 게임에서 쓰이는 값은 보직 능력
  const r=srng(hash(c.name+c.role)), key=new Set(ROLE_KEY[c.role]||[]), out={};
  for(const [k] of [...COACH_ATTR,...COACH_MENT]) out[k]=clamp(Math.round(key.has(k)? c.rating+(r()*2-1) : c.rating-5+(r()*8-3)),1,20);
  return out; }
const coachWord = v=> v>=17?['매우 좋음','#3fb950']:v>=14?['좋음','#9be08a']:v>=11?['적당함','#cfd6de']:v>=8?['가능함','#e3954b']:['부적합','#f0605a'];
function coachAvatar(c,size=110){ const sk=['#f1c9a5','#e0ac85','#c98e66'][hash(c.name)%3];
  return `<svg width="${size}" height="${size}" viewBox="0 0 80 80" aria-hidden="true" style="flex:none;border-radius:12px;background:linear-gradient(#2a323c,#0b1016)"><path d="M8 80 C10 60 25 53 40 53 C55 53 70 60 72 80 Z" fill="#1d2530"/><path d="M34 53 L40 66 L46 53" fill="#e8edf2"/><rect x="34" y="44" width="12" height="11" rx="3" fill="${sk}"/><ellipse cx="40" cy="33" rx="13" ry="15" fill="${sk}"/><path d="M27 29 C27 16 53 16 53 29 C49 24 31 24 27 29 Z" fill="#3a3a3a"/></svg>`; }
function showCoach(c){ histB.push(uiSnap()); histF=[]; curCoach=c; go('coach',true); }
PAGES.coach = ()=>{
  const c=coachObj(); if(!c) return '<p class="mute">코치 정보를 찾을 수 없어요.</p>';
  const A=coachAttrs(c), key=new Set(ROLE_KEY[c.role]||[]), r=srng(hash(c.name));
  const age = c.age || 38+Math.floor(r()*24);
  const pers = ['프로다움','침착함','열정적','강인함','온화함','완벽주의'][hash(c.name)%6];
  const style = ['스몰볼','빅볼','데이터 야구','투수 중심 야구','뛰는 야구'][hash(c.name+'s')%5];
  const fitRole = COACH_ROLES.map(role=>{ const ks=ROLE_KEY[role]; return [role, ks.reduce((s,k)=>s+A[k],0)/ks.length]; }).sort((x,y)=>(y[0]===c.role)-(x[0]===c.role)||y[1]-x[1]);
  const line = ([k,l])=>{ const [w,col]=coachWord(A[k]); return `<div class="at ${key.has(k)?'key':''}"><span>${l}</span><span class="word" style="color:${col}">${w}</span></div>`; };
  return `<div class="hero">${coachAvatar(c)}
    <div class="nm"><h1>${c.name}</h1><div class="l2">${c.role}코치</div><div class="l2">${age}세</div></div>
    ${c.mine?'':`<details class="act"><summary>행동 ${chev}</summary><div><button onclick="hireCoach(${curCoach.m})">영입하기 (${c.fee}억)</button></div></details>`}
    <div class="box">${c.mine?`<div class="row" style="flex-wrap:nowrap">${crest(S.user,40)}<div><b>${tname(S.user)}</b><div class="k">${c.role}코치</div></div></div>`:'<b>무소속</b><div class="k">영입 가능</div>'}</div>
    <div class="box"><div class="k">보직 능력</div><b style="font-size:22px">${c.rating} <span class="mute" style="font-size:14px">/ 20</span></b></div>
    <div class="box"><div class="k">${c.mine?'담당':'계약금'}</div><b>${c.mine?COACH_DESC[c.role]:c.fee+'억 원'}</b></div>
  </div>
  <div class="panel pbody" style="grid-template-columns:minmax(220px,.9fr) minmax(240px,1fr) minmax(240px,1fr) minmax(240px,1fr)">
    <div><div class="ah">선호 보직</div>${fitRole.map(([role,v],i)=>`<div class="role ${i===0?'on':''}"><span class="rb" aria-hidden="true"></span>${starBar((v-4)/3.2)}<span>${role}코치</span></div>`).join('')}</div>
    <div><div class="ah">지도 능력</div>${COACH_ATTR.map(line).join('')}</div>
    <div><div class="ah">정신 · 평가 능력</div>${COACH_MENT.map(line).join('')}</div>
    <div><div class="ah">코칭 정보</div>
      <div class="mute" style="font-size:12px;margin-top:8px">성격</div><b>${pers}</b>
      <div class="mute" style="font-size:12px;margin-top:10px">선호 야구 스타일</div><b>${style}</b>
      <div class="mute" style="font-size:12px;margin-top:10px">게임 영향</div><div>${COACH_DESC[c.role]}</div>
      <p class="mute" style="font-size:12px;margin-top:12px">경기와 훈련에는 보직 능력(${c.rating})이 쓰여요. 세부 능력은 이 값을 바탕으로 한 참고 정보예요. 코치 이름은 가상 인물이에요.</p></div>
  </div>
  <div class="legend2"><span><i></i>이 보직에 중요한 능력</span></div>`;
};
PAGES.staff = ()=>{
  const u=S.teams[S.user];
  const card = (c,role,i)=>{ const isM=i!=null; return `<tr class="click" onclick='showCoach(${isM?`{m:${i}}`:`{r:"${role}"}`})'><td><div class="pn">${coachAvatar(c,34)}<span><b>${c.name}</b><br><span class="mute" style="font-size:12px">${role}코치${c.age?` · ${c.age}세`:''}</span></span></div></td><td>${starBar((c.rating-4)/3.2)}</td><td>${rc(c.rating)}</td><td class="mute">${COACH_DESC[role]}</td>${isM?`<td class="num">${c.fee}억</td><td><button onclick="event.stopPropagation();hireCoach(${i})">영입</button></td>`:''}</tr>`; };
  return `<h2>코치진</h2><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(520px,100%),1fr))">
   <div class="panel"><h3>현재 코치진</h3><div style="overflow-x:auto"><table>${COACH_ROLES.map(r=>card(u.staff[r],r)).join('')}</table></div><p class="mute" style="font-size:12px">코치를 누르면 상세 정보를 볼 수 있어요. 코치 이름은 가상 인물이에요.</p></div>
   <div class="panel"><h3>코치 영입 시장</h3><div style="overflow-x:auto"><table>${S.coachMarket.map((c,i)=>card(c,c.role,i)).join('')}</table></div>
   <p class="mute" style="font-size:12px">영입하면 해당 보직의 기존 코치와 교체되고, 계약금은 바로 잔고에서 빠져요. 시장은 약 한 달마다 갱신돼요.</p></div></div>`;
};

function hireCoach(i){
  const c=S.coachMarket[i], u=S.teams[S.user];
  if(u.balance<c.fee){ alert('잔고가 부족합니다.'); return; }
  if(!confirm(`${c.name} (${c.role}코치, 능력 ${c.rating})를 ${c.fee}억에 영입할까요? 현재 ${c.role}코치 ${u.staff[c.role].name}(${u.staff[c.role].rating})는 계약 해지됩니다.`)) return;
  u.balance-=c.fee; u.exp+=c.fee; u.staff[c.role]={name:c.name, rating:c.rating}; S.coachMarket.splice(i,1);
  mail('프런트',`${c.role}코치 교체`,`${c.name} ${c.role}코치가 새로 합류했습니다.`,'staff'); save(); if(page==='coach'){ curCoach={r:c.role}; } render();
}

// ---------- 트레이드 ----------
PAGES.transfer = ()=>{
  const u=S.teams[S.user];
  if(!tradeTeam || tradeTeam===S.user) tradeTeam = TEAM_DATA.find(t=>t.id!==S.user).id;
  const o=S.teams[tradeTeam];
  const list = (t,sel,side)=>teamPlayers(t).sort((a,b)=>ovrOf(b)-ovrOf(a)).map(p=>`<tr class="${sel.includes(p.id)?'me':''}" style="cursor:pointer" onclick="toggleTrade('${side}','${p.id}')">
     <td>${sel.includes(p.id)?'☑':'☐'}</td><td>${pn(p,26)}${p.foreign?' <span class="pill">외</span>':''}</td><td>${POS_KO[p.pos]}</td><td>${p.age}</td><td>${cab(p)}</td><td style="color:gold">${stars(p)}</td><td class="num">${p.salary}억 · ${p.yrs??1}년</td></tr>`).join('');
  return `<h2>트레이드</h2><div class="row" style="margin-bottom:10px">상대 구단 <select onchange="tradeTeam=this.value;tradeGet=[];render()">${TEAM_DATA.filter(t=>t.id!==S.user).map(t=>`<option value="${t.id}" ${t.id===tradeTeam?'selected':''}>${t.name}</option>`).join('')}</select>
   <button class="pri" onclick="proposeTrade()" ${tradeGive.length&&tradeGet.length?'':'disabled'}>트레이드 제안</button><span class="mute">내줄 선수 ${tradeGive.length}명 ↔ 받을 선수 ${tradeGet.length}명</span></div>
   <div class="grid g2"><div class="card scroll"><h3>내줄 선수 (${tname(S.user)})</h3><table>${list(u,tradeGive,'give')}</table></div>
   <div class="card scroll"><h3>받을 선수 (${tname(tradeTeam)})</h3><table>${list(o,tradeGet,'get')}</table></div></div>
   ${S.tradeLog.length?`<div class="card" style="margin-top:14px"><h3>트레이드 기록</h3>${S.tradeLog.map(l=>`<div>${l}</div>`).join('')}</div>`:''}
   <p class="mute">상대 구단은 나이·능력·잠재력을 바탕으로 가치를 평가합니다. 젊은 유망주는 높게, 30대 중반 이후 베테랑은 낮게 평가됩니다.</p>`;
};
function toggleTrade(side,id){ const a= side==='give'?tradeGive:tradeGet; const i=a.indexOf(id); if(i>=0) a.splice(i,1); else if(a.length<3) a.push(id); render(); }
function proposeTrade(){
  if(S.phase==='post'){ alert('포스트시즌에는 트레이드할 수 없습니다.'); return; }
  const r=evaluateTrade(tradeGive,tradeGet,tradeTeam);
  if(r.ok){ if(confirm(r.msg+'\n\n트레이드를 확정할까요?')){ doTrade(tradeGive,tradeGet,tradeTeam); tradeGive=[]; tradeGet=[]; save(); render(); } }
  else alert(r.msg);
}

// ---------- 역사 ----------
PAGES.history = ()=>`<h2>구단 역사</h2><div class="card"><table><tr><th>시즌</th><th>순위</th><th>성적</th><th>포스트시즌</th><th>우승팀</th></tr>
  ${S.history.map(h=>`<tr><td>${h.year}</td><td>${h.rank}위</td><td>${h.w}승 ${h.l}패 ${h.t}무</td><td>${h.post==='우승'?'🏆 <b>우승</b>':h.post}</td><td>${tname(h.champ)}</td></tr>`).join('')||'<tr><td class="mute" colspan="5">첫 시즌 진행 중</td></tr>'}</table></div>`;

render();
