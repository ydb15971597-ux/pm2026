// 프로야구 매니저 PM — 감독 업무: 경기 플랜·상대 분석, 경기 전 기자회견·선수단 미팅, 경기 중 감독의 한마디, 설정(스킨·환경설정·저장 슬롯)

// ---------- 경기 플랜 ----------
const OPLANS = {
  bal:  {n:'균형', d:'평소 스타일대로', m:{}},
  pat:  {n:'끈질긴 승부', d:'공을 오래 봐서 투구수를 늘린다 · 볼넷↑ 삼진↓', m:{k:0.96, bb:1.1, hr:0.93, hit:0.98, pc:0.5}},
  first:{n:'초구 공략', d:'빠른 카운트에 승부 · 안타↑ 볼넷↓', m:{k:0.93, bb:0.84, hit:1.01, pc:-0.6}},
  power:{n:'장타 노림', d:'큰 스윙으로 한 방 · 홈런↑ 삼진↑', m:{k:1.1, hr:1.15, hit:0.96, bb:1.02}},
  small:{n:'스몰볼', d:'짧게 치고 뛴다 · 삼진↓ 도루·번트↑ 홈런↓', m:{k:0.93, hr:0.86, hit:1.01, steal:1.8, bunt:2}},
};
const PPLANS = {
  bal:   {n:'균형', d:'평소대로 운영', m:{}},
  long:  {n:'선발 길게', d:'선발을 믿고 오래 끌고 간다', m:{sp:14}},
  pen:   {n:'불펜 총력', d:'선발을 일찍 내리고 불펜을 쏟는다', m:{sp:-20, rp:4}},
  attack:{n:'정면 승부', d:'스트라이크로 붙는다 · 볼넷↓ 투구수↓ 피홈런↑', m:{pbb:0.85, phr:1.1, phit:1.01, ppc:-0.5}},
  bait:  {n:'유인구 위주', d:'존 밖으로 유혹 · 삼진↑ 볼넷↑ 피홈런↓', m:{pk:1.06, pbb:1.12, phr:0.9, phit:1.01, ppc:0.5}},
};
const avgA = (l,k)=>{ const f=l.filter(x=>x.pos!=='P'); return f.reduce((s,x)=>s+x.p.a[k],0)/Math.max(1,f.length); };
function penQ(t){ const bp=act1(t).filter(p=>p.isP && !p.inj && !t.rotation.includes(p.id)).map(p=>(p.a.stf+p.a.brk+p.a.ctl)/3).sort((a,b)=>b-a).slice(0,5); return bp.length? bp.reduce((s,v)=>s+v,0)/bp.length : 10; }
const spQ = p=> p ? (p.a.stf+p.a.brk+p.a.ctl)/3 : 10;
function luOf(t){ return (t.lineup||[]).map(x=>({p:S.players[x.pid], pos:x.pos})).filter(x=>x.p); }
function catArmOf(l){ const c=l.find(x=>x.pos==='C'); return c? c.p.a.arm*0.6+c.p.a.cat*0.4 : 10; }
let LGN=null;   // 리그 평균(플랜 맞춤도 기준)
function lgNorm(){
  if(LGN && LGN.date===S.date) return LGN;
  const ts=Object.values(S.teams), lus=ts.map(luOf), sps=ts.flatMap(t=>t.rotation.map(id=>S.players[id]).filter(Boolean));
  const ma=k=>lus.reduce((s,l)=>s+avgA(l,k),0)/lus.length, pa=k=>sps.reduce((s,p)=>s+p.a[k],0)/Math.max(1,sps.length);
  return LGN={date:S.date, eye:ma('eye'), con:ma('con'), pow:ma('pow'), spd:ma('spd'), ctl:pa('ctl'), sta:pa('sta'), gb:pa('gb'), brk:pa('brk'), sq:sps.reduce((s,p)=>s+spQ(p),0)/Math.max(1,sps.length), bq:ts.reduce((s,t)=>s+penQ(t),0)/ts.length, arm:lus.reduce((s,l)=>s+catArmOf(l),0)/lus.length};
}
function oFit(k, oppSP, oppT, myLu, park){
  if(!oppSP) return 0; const a=oppSP.a, L=lgNorm();
  const eye=avgA(myLu,'eye')-L.eye, con=avgA(myLu,'con')-L.con, pow=avgA(myLu,'pow')-L.pow, spd=avgA(myLu,'spd')-L.spd;
  const v = k==='pat' ? (L.ctl-a.ctl)/4 + (L.sta-a.sta)/6 + (L.bq-penQ(oppT))/4 + eye/3
    : k==='first' ? (a.ctl-L.ctl)/4 + con/3 - eye/5
    : k==='power' ? (L.gb-a.gb)/4 + ((park?.hr||1)-1)*5 + pow/2.5
    : k==='small' ? (L.arm-catArmOf(luOf(oppT)))/4 + spd/2.5 - ((park?.hr||1)-1)*4 - pow/4 : 0;
  return clamp(v*0.6,-1,1);
}
function pFit(k, mySP, myT, oppLu){
  if(!mySP) return 0; const a=mySP.a, L=lgNorm(), bq=penQ(myT)-L.bq, sq=spQ(mySP)-L.sq;
  const eye=avgA(oppLu,'eye')-L.eye, pow=avgA(oppLu,'pow')-L.pow;
  const v = k==='long' ? (a.sta-L.sta)/4 - bq/3 + sq/4
    : k==='pen' ? bq/2.5 - sq/4 - (a.sta-L.sta)/6
    : k==='attack' ? (a.ctl-L.ctl)/4 + eye/3 - pow/3
    : k==='bait' ? (a.brk-L.brk)/4 - eye/2.5 + pow/5 : 0;
  return clamp(v*0.6,-1,1);
}
const anaOf = t => t.staff?.['전력분석']?.rating ?? 12;
const readScale = t => 0.45 + anaOf(t)/40 + ((t.mgr?.tac??14)-14)*0.02;   // 분석·감독 전술 능력이 높을수록 맞춤 플랜 효과↑
function noiseFor(t, key){ const r=srng(hash(S.date+t.id+key)); return (r()*2-1)*Math.max(0.1, 1-anaOf(t)/20)*0.7; }
function aiPlan(t, opp, mySP, oppSP, myLu, oppLu, park){
  const pick=(set,fit)=>{ let best='bal', bv=0.18; for(const k in set){ if(k==='bal') continue; const v=fit(k)+noiseFor(t,k); if(v>bv){ bv=v; best=k; } } return best; };
  return {o:pick(OPLANS,k=>oFit(k,oppSP,opp,myLu,park)), p:pick(PPLANS,k=>pFit(k,mySP,t,oppLu))};
}
function planMods(t, opp, mySP, oppSP, myLu, oppLu, park){
  const pl = (t.id===S.user && t.plan && !t.plan.auto) ? t.plan : aiPlan(t,opp,mySP,oppSP,myLu,oppLu,park);
  t.lastPlan = pl;
  const m = {...NOPLAN, ...(OPLANS[pl.o]||OPLANS.bal).m, ...(PPLANS[pl.p]||PPLANS.bal).m};
  const sc = readScale(t);
  m.ro = oFit(pl.o,oppSP,opp,myLu,park)*0.75*sc;
  m.rd = pFit(pl.p,mySP,t,oppLu)*0.75*sc;
  return m;
}
// 오늘 경기 분석 (화면용)
function matchInfo(){
  const m = todayMatch(); if(!m) return null;
  const [h,a]=m, u=S.teams[S.user], oppId = h===S.user? a : h, opp=S.teams[oppId];
  const mySP=probableStarter(u), oppSP=probableStarter(opp), park=TD(h).park;
  return {h, a, home:h===S.user, opp, oppId, mySP, oppSP, park, myLu:luOf(u), oppLu:luOf(opp)};
}
function fitShown(v, t, key){ return clamp(v + noiseFor(t,'show'+key)*0.6, -1, 1); }
function planPanel(compact){
  const mi = matchInfo(); const u=S.teams[S.user]; u.plan ||= {o:'bal', p:'bal'};
  if(!mi) return `<div class="panel"><h3>경기 플랜</h3><p class="mute">오늘은 경기가 없어요. 다음 경기 전에 상대 분석과 함께 플랜을 정할 수 있어요.</p></div>`;
  const {opp, oppId, mySP, oppSP, park, myLu, oppLu} = mi;
  const of = k=>fitShown(oFit(k,oppSP,opp,myLu,park),u,'o'+k), pf = k=>fitShown(pFit(k,mySP,u,oppLu),u,'p'+k);
  const bestO = Object.keys(OPLANS).filter(k=>k!=='bal').sort((x,y)=>of(y)-of(x))[0], bestP = Object.keys(PPLANS).filter(k=>k!=='bal').sort((x,y)=>pf(y)-pf(x))[0];
  const meter = v=>{ const n=Math.round((v+1)*2.5); return `<span class="fitm" title="상대 맞춤도">${'●'.repeat(n)}${'○'.repeat(5-n)}</span>`; };
  const chip = (set,k,cur,kind,fit)=>`<button class="planc ${cur===k&&!u.plan.auto?'on':''}" onclick="setPlan('${kind}','${k}')"><b>${set[k].n}${k!=='bal'&&(kind==='o'?bestO:bestP)===k?' <span class="rec">추천</span>':''}</b><span>${set[k].d}</span>${k==='bal'?'':meter(fit(k))}</button>`;
  const ana = anaOf(u);
  const hot = oppLu.map(x=>x.p).filter(p=>p.gl&&p.gl.length>=5).map(p=>{ const g=p.gl.slice(-7); const ab=g.reduce((s,x)=>s+(x.ab||0),0), hh=g.reduce((s,x)=>s+(x.h||0),0); return {p, av: ab? hh/ab : 0, ab}; }).filter(x=>x.ab>=12).sort((a,b)=>b.av-a.av);
  const lefty = myLu.filter(x=>x.p.hand==='L').length, plat = oppSP ? (oppSP.hand==='L' ? `상대 선발이 좌완이라 우리 좌타자 ${lefty}명이 불리해요.${lefty>=4?' 우타 대타 카드를 준비하세요.':''}` : `상대 선발이 우완이라 좌타자(${lefty}명)가 유리해요.`) : '';
  const notes = [];
  if(oppSP){ const a=oppSP.a; if(a.ctl<=10) notes.push('상대 선발 제구가 불안 — 공을 많이 보게 하면 무너질 수 있어요.'); if(a.ctl>=15) notes.push('상대 선발이 제구형 — 볼카운트 싸움은 불리, 빠르게 승부하세요.'); if(a.gb<=8) notes.push('뜬공 투수 — 장타를 노릴 만해요.'); if(a.sta<=10) notes.push('상대 선발 스태미너가 약해 5회 이후 불펜 싸움이 돼요.'); }
  if(penQ(opp) < 11) notes.push(`${short(oppId)} 불펜이 약해요 — 투구수를 늘려 선발을 일찍 끌어내리세요.`);
  if(catArmOf(oppLu) < 10) notes.push('상대 포수 송구가 약해 도루 시도가 잘 통해요.');
  if(avgA(oppLu,'eye') <= 10.5) notes.push('상대 타선이 성급해요 — 유인구에 잘 속아요.');
  if(avgA(oppLu,'pow') >= 13.5) notes.push('상대 타선 장타력이 강해요 — 정면 승부는 위험해요.');
  const acc = ana>=15 ? '정밀' : ana>=11 ? '보통' : '대략';
  const spLine = (p,lbl)=> p ? `<div class="spl">${avatar(p,40)}<div><span class="mute">${lbl}</span><br><b>${p.name}</b> <span class="mute">${p.hand==='L'?'좌':'우'} · ${era(p.st)} ERA · 제구 ${Math.round(p.a.ctl)} · 체력 ${Math.round(p.a.sta)}</span></div></div>` : '';
  return `<div class="panel planpanel"><h3>상대 분석 · 경기 플랜 <span class="mute" style="font-weight:400;font-size:12px">전력분석 ${acc} (능력 ${Math.round(ana)})</span></h3>
    <div class="row" style="gap:18px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:1;min-width:240px">
        <div class="row" style="gap:10px;margin-bottom:8px">${crest(oppId,40)}<div><b>${mi.home?'vs':'@'} ${tname(oppId)}</b><br><span class="mute">${(()=>{const o=S.teams[oppId];return `${o.w}승 ${o.l}패 · 불펜 ${penQ(o)>=12.5?'강함':penQ(o)>=11?'보통':'약함'}`})()}</span></div></div>
        ${spLine(oppSP,'상대 예상 선발')}${spLine(mySP,'우리 선발')}
        ${hot.length?`<div class="mute" style="margin-top:6px;font-size:12.5px">상대 최근 7경기 — 🔥 ${hot.slice(0,2).map(x=>`${x.p.name} ${x.av.toFixed(3).slice(1)}`).join(', ')}${hot.length>2?` · 🧊 ${hot[hot.length-1].p.name} ${hot[hot.length-1].av.toFixed(3).slice(1)}`:''}</div>`:''}
      </div>
      <div style="flex:1.3;min-width:260px"><b style="font-size:13px">분석팀 리포트</b><ul class="anal">${[plat,...notes].filter(Boolean).slice(0, ana>=15?6:ana>=11?4:2).map(x=>`<li>${x}</li>`).join('')||'<li class="mute">특이 사항 없음</li>'}</ul></div>
    </div>
    ${compact?'':`<div class="mute" style="font-size:12px;margin:10px 0 4px">●는 상대와의 맞춤도(분석팀 추정). 상대 약점에 맞춘 플랜일수록 효과가 커지고, 엇나가면 손해예요.</div>`}
    <div class="planrow"><div class="plh">공격 플랜</div><div class="plg">${Object.keys(OPLANS).map(k=>chip(OPLANS,k,u.plan.o,'o',of)).join('')}</div></div>
    <div class="planrow"><div class="plh">투수 운영</div><div class="plg">${Object.keys(PPLANS).map(k=>chip(PPLANS,k,u.plan.p,'p',pf)).join('')}</div></div>
    <label class="row" style="gap:6px;margin-top:8px;font-size:13px"><input type="checkbox" ${u.plan.auto?'checked':''} onchange="S.teams[S.user].plan.auto=this.checked;save();render()"> 수석코치에게 매 경기 플랜 맡기기</label>
  </div>`;
}
function setPlan(kind,k){ const u=S.teams[S.user]; u.plan ||= {o:'bal',p:'bal'}; u.plan[kind]=k; u.plan.auto=false; save(); render(); }
{ const _tac = PAGES.tactics; PAGES.tactics = ()=> _tac() + planPanel(); }

// ---------- 경기 전: 기자회견 · 선수단 미팅 ----------
function talkBoost(t){ return t.talk && t.talk.date===S.date ? clamp(t.talk.v||0,-0.7,0.8) : 0; }
function talkP(p){ const t=S.teams[S.user]; if(!t?.talk || t.talk.date!==S.date) return 0; const x=t.talk.pl?.[p.id]; return x||0; }
function myStreak(){ const rs=S.results.filter(r=>r.h===S.user||r.a===S.user); let n=0, w=null; for(let i=rs.length-1;i>=0;i--){ const r=rs[i], me=r.h===S.user?1:0, win=r.s[me]>r.s[1-me]; if(r.s[0]===r.s[1]) break; if(w===null) w=win; if(win!==w) break; n++; } return {n, w}; }
function teamMor(t){ const l=teamPlayers(t).filter(p=>!p.farm); return l.reduce((s,p)=>s+p.morale,0)/Math.max(1,l.length); }
function teamDet(t){ const l=teamPlayers(t).filter(p=>!p.farm); return l.reduce((s,p)=>s+p.m.det,0)/Math.max(1,l.length); }
function isBigGame(){
  if(S.preBig?.date===S.date) return S.preBig.v;
  const mi=matchInfo(); let v=false;
  if(mi){ const st=myStreak(), r=rankOf(mi.oppId);
    v = S.phase==='post' || S.dayIdx===0 || r<=2 || st.n>=3 || srng(hash(S.date+'pc'))()<0.22; }
  S.preBig={date:S.date, v}; return v;
}
function pmPrefs(){ try{ return JSON.parse(localStorage.getItem('pm2026Prefs')||'{}'); }catch(e){ return {}; } }
function setPref(k,v){ const p=pmPrefs(); p[k]=v; try{ localStorage.setItem('pm2026Prefs', JSON.stringify(p)); }catch(e){} applyPrefs(); }
function preMode(){ return pmPrefs().pre || 'big'; }
function preNeeded(){
  if(!S || S.fired || LV || !(S.phase==='regular'||S.phase==='post') || !todayMatch() || S.preDone===S.date) return false;
  const m=preMode(); return m==='all' || (m==='big' && isBigGame());
}
let preAct = 'adv';
{ const _adv0 = adv; adv = function(n){ if(page==='pregame' && todayMatch() && S.preDone!==S.date){ preGo('adv'); return; } if(n===1 && preNeeded()){ preAct='adv'; go('pregame'); return; } _adv0(n); };
  const _wl0 = watchLive; watchLive = function(){ if(page==='pregame' && S.preDone!==S.date){ preGo('live'); return; } if(preNeeded()){ preAct='live'; go('pregame'); return; } _wl0(); };
  window.preGo = function(kind){ S.preDone=S.date; save(); page='home'; if((kind||preAct)==='live') _wl0(); else _adv0(1); }; }

function pressQuestions(){
  const mi=matchInfo(), u=S.teams[S.user], st=myStreak(), r=rankOf(S.user), or=rankOf(mi.oppId), mor=teamMor(u), det=teamDet(u), mot=u.mgr.mot??12;
  const on = tname(mi.oppId), qs=[];
  const lu = luOf(u).map(x=>x.p);
  if(S.phase==='post') qs.push({q:`가을야구 무대입니다. ${on}과의 경기, 각오 한마디 부탁드립니다.`, o:[
    {t:'"우리 야구를 하면 이깁니다. 선수들을 믿습니다."', f:{v:mor>=65?0.3:0.1, mor:2, fan:1}, r:'선수들이 감독의 믿음에 고무됐다.'},
    {t:'"부담 없이 즐기라고 했습니다. 결과는 따라올 겁니다."', f:{v:0.15+(12-det)*0.03, mor:1}, r:'더그아웃 분위기가 한결 가벼워졌다.'},
    {t:'"오늘 지면 끝이라는 각오로 나갑니다."', f:{v:det>=13?0.4:-0.15, mor:det>=13?1:-2, fan:2}, r:det>=13?'승부욕 강한 선수들의 눈빛이 달라졌다.':'일부 선수들이 긴장으로 몸이 굳었다.'}]});
  if(st.n>=3 && !st.w) qs.push({q:`${st.n}연패 중입니다. 팬들의 걱정이 큰데, 해법이 있습니까?`, o:[
    {t:'"모든 책임은 저에게 있습니다. 선수들은 잘하고 있어요."', f:{v:0.2, mor:3, board:1, fan:1}, r:'선수들이 감독을 위해 뛰겠다는 분위기다.'},
    {t:'"선수들의 집중력이 떨어졌습니다. 정신 차려야 합니다."', f:{v:det>=13?0.3:-0.2, mor:-3, board:1}, r:det>=13?'공개 질책이 오히려 자극이 됐다.':'선수단이 공개 질책에 상처를 받았다.'},
    {t:'"긴 시즌입니다. 곧 반등할 거라 확신합니다."', f:{v:0.05, mor:1, fan:-1}, r:'팬들은 대책 없는 낙관이라며 아쉬워했다.'}]});
  if(st.n>=3 && st.w) qs.push({q:`${st.n}연승의 상승세입니다. 비결이 뭘까요?`, o:[
    {t:'"선수들 덕분이죠. 다들 하나로 뭉쳤습니다."', f:{v:0.1, mor:3}, r:'선수들이 뿌듯해한다.'},
    {t:'"아직 멀었습니다. 들뜨지 않겠습니다."', f:{v:0.2, mor:0, board:1}, r:'방심 없이 다음 경기에 집중하는 분위기.'},
    {t:'"이 기세면 우승도 노려볼 만합니다."', f:{v:mor>=75?0.15:-0.05, mor:1, fan:3, board:-1}, r:'팬들은 열광했지만 이사회는 말을 아끼라는 반응.'}]});
  if(or<=3 && or<r) qs.push({q:`${or}위 ${on}은 강팀입니다. 어떻게 상대하실 건가요?`, o:[
    {t:'"이길 자신 있습니다. 우리도 강팀입니다."', f:{v:mor>=68?0.3:-0.1, fan:2}, r:mor>=68?'자신감이 선수단에 퍼졌다.':'분위기가 받쳐 주지 않아 허세로 들렸다.'},
    {t:'"상대 약점을 충분히 분석했습니다."', f:{v:0.05+anaOf(u)/80, board:1}, r:'분석팀이 준비한 자료에 선수들이 귀를 기울인다.'},
    {t:'"배운다는 자세로 부딪혀 보겠습니다."', f:{v:0.05, mor:1, fan:-1}, r:'겸손하지만 팬들은 다소 맥이 빠졌다.'}]});
  // 부진한 주전
  const slump = lu.filter(p=>p.st && p.st.ab>=60 && p.st.h/p.st.ab<0.225).sort((a,b)=>a.st.h/a.st.ab-b.st.h/b.st.ab)[0];
  if(slump) qs.push({q:`${slump.name} 선수가 타율 ${avg(slump.st.h,slump.st.ab)}로 부진합니다. 계속 기용하실 건가요?`, pid:slump.id, o:[
    {t:'"누구보다 열심히 합니다. 곧 살아날 겁니다."', f:{pm:[slump.id,8], pv:[slump.id, 0.4]}, r:`${slump.name}이(가) 감독의 공개 지지에 고마워했다.`},
    {t:'"분발이 필요합니다. 본인도 알고 있을 겁니다."', f:{pm:[slump.id,-4], pv:[slump.id, slump.m.det>=14?0.6:-0.4]}, r:slump.m.det>=14?`${slump.name}이(가) 이를 악물었다.`:`${slump.name}이(가) 더 위축된 모습이다.`},
    {t:'"라인업 조정도 검토하고 있습니다."', f:{pm:[slump.id,-8], mor:-1, board:1}, r:`${slump.name}의 표정이 어두워졌다. 다른 선수들은 긴장했다.`}]});
  // 잘 나가는 젊은 선수
  const young = lu.filter(p=>p.age<=24 && p.st && p.st.ab>=40 && p.st.h/p.st.ab>=0.300)[0];
  if(young) qs.push({q:`${young.age}세 ${young.name} 선수의 활약이 눈부십니다. 어떻게 보십니까?`, o:[
    {t:'"리그를 대표할 선수가 될 겁니다."', f:{pm:[young.id,6], pv:[young.id, young.m.cmp>=12?0.3:-0.2], fan:2}, r:young.m.cmp>=12?`${young.name}이(가) 기대에 부응하겠다고 했다.`:`${young.name}이(가) 쏟아지는 관심에 부담을 느낀다.`},
    {t:'"아직 배울 게 많습니다. 차근차근 키우겠습니다."', f:{pm:[young.id,1], pv:[young.id,0.15]}, r:`${young.name}이(가) 차분하게 다음 경기를 준비한다.`},
    {t:'"선배들이 잘 이끌어 준 덕분입니다."', f:{mor:1}, r:'베테랑들이 흐뭇해한다.'}]});
  // 구단 운영
  if(u.board<45 || u.balance<0) qs.push({q:'구단의 투자가 부족하다는 지적이 있습니다. 프런트에 아쉬움은 없나요?', o:[
    {t:'"프런트가 최선을 다하고 있습니다. 저희가 결과로 보답해야죠."', f:{board:3, fan:-1}, r:'이사회가 감독의 발언을 반겼다.'},
    {t:'"솔직히 보강이 필요합니다. 구단도 알고 있을 겁니다."', f:{board:-4, fan:3, mor:1}, r:'팬들은 속 시원하다는 반응, 이사회는 불편한 기색.'},
    {t:'"지금 선수들로 충분히 해낼 수 있습니다."', f:{mor:2}, r:'선수단은 감독의 신뢰를 느꼈다.'}]});
  if(S.dayIdx===0 && S.phase==='regular') qs.push({q:'개막전입니다. 올 시즌 목표를 말씀해 주세요.', o:[
    {t:`"목표는 ${goalText(u.goalRank)}입니다. 반드시 해내겠습니다."`, f:{board:2, fan:1, v:0.1}, r:'이사회는 목표를 분명히 한 감독에게 신뢰를 보냈다.'},
    {t:'"우승입니다. 그 이하는 생각하지 않습니다."', f:{fan:4, board:-1, v:mor>=70?0.2:0}, r:'팬들은 환호했고 언론은 대담한 출사표라 썼다.'},
    {t:'"한 경기 한 경기 최선을 다하겠습니다."', f:{v:0.05}, r:'무난한 출사표.'}]});
  // 기본 질문
  qs.push({q:`오늘 ${mi.oppSP?`상대 선발은 ${mi.oppSP.name}입니다. 공략법이 있나요?`:'경기 운영 구상은 어떻습니까?'}`, o:[
    {t:'"분석은 끝났습니다. 타자들에게 노림수를 줬습니다."', f:{v:0.04+anaOf(u)/100}, r:'분석팀이 준비한 노림수를 타자들이 공유했다.'},
    {t:'"특별한 건 없습니다. 우리 야구를 할 뿐이죠."', f:{v:0.05, mor:1}, r:'평소와 같은 분위기.'},
    {t:'"그건 경기 끝나고 말씀드리죠."', f:{v:0.02, fan:-1}, r:'기자들은 다소 아쉬워했다.'}]});
  qs.push({q:'최근 팀 분위기는 어떻습니까?', o:[
    {t:'"최고입니다. 선수들 표정이 밝아요."', f:{v:mor>=70?0.12:-0.05, mor:1}, r:mor>=70?'실제로 더그아웃이 밝다.':'선수들은 그 말에 공감하지 못하는 눈치다.'},
    {t:'"좋은 긴장감이 있습니다."', f:{v:0.08}, r:'적당한 긴장감이 감돈다.'},
    {t:'"솔직히 더 끌어올려야 합니다."', f:{v:det>=13?0.15:-0.05, mor:-1, board:1}, r:'선수들이 감독의 쓴소리를 곱씹는다.'}]});
  // 감독 동기부여 능력이 효과를 키움
  const k = 0.7 + mot/30;
  for(const q of qs) for(const o of q.o) if(o.f.v) o.f.v *= k;
  return qs.slice(0,2);
}
function preState(){
  if(S.pre?.date===S.date) return S.pre;
  const big = isBigGame();
  S.pre = {date:S.date, qs: big ? pressQuestions() : [], ans:[], talk:null, msg:null};
  S.teams[S.user].talk = {date:S.date, v:0, pl:{}};
  return S.pre;
}
function applyFx(f, tag){
  const u=S.teams[S.user], tk=u.talk;
  if(f.v) tk.v = (tk.v||0) + f.v;
  if(f.mor) teamPlayers(u).filter(p=>!p.farm).forEach(p=>p.morale=clamp(p.morale+f.mor,20,100));
  if(f.board) u.board = clamp(u.board+f.board,0,100);
  if(f.fan) u.fanMood = clamp(u.fanMood+f.fan,0,100);
  if(f.pm){ const p=S.players[f.pm[0]]; if(p) p.morale=clamp(p.morale+f.pm[1],20,100); }
  if(f.pv){ tk.pl[f.pv[0]] = (tk.pl[f.pv[0]]||0) + f.pv[1]; }
}
function pressAnswer(qi, oi){
  const pr=preState(); if(pr.ans[qi]!=null) return;
  const o=pr.qs[qi].o[oi]; pr.ans[qi]=oi; applyFx(o.f);
  if(pr.ans.filter(x=>x!=null).length===pr.qs.length){
    const qq=pr.qs.map((q,i)=>`Q. ${q.q}\nA. ${q.o[pr.ans[i]].t}`).join('\n\n');
    mail('언론', `경기 전 기자회견 — ${short(matchInfo()?.oppId||S.user)}전`, qq+'\n\n'+pr.qs.map((q,i)=>'· '+q.o[pr.ans[i]].r).join('\n'), 'info'); S.inbox[0].read=true;
  }
  save(); render();
}
const TALKS = [
  {k:'calm', n:'차분하게', say:'"늘 하던 대로 하자. 한 타석, 한 구씩."', f:()=>({v:0.1, mor:0.5})},
  {k:'trust', n:'믿음', say:'"너희를 믿는다. 마음껏 해 봐."', f:(m,d)=>({v:m<70?0.3:0.15, mor:2})},
  {k:'fire', n:'다그치기', say:'"오늘은 반드시 잡는다. 물러서지 마!"', f:(m,d)=>({v:d>=13&&m>=60?0.38:-0.15, mor:-1})},
  {k:'fun', n:'즐기기', say:'"결과 걱정은 내가 한다. 즐기고 와."', f:(m,d,big)=>({v:big?0.28:0.08, mor:1})},
];
const PMSG = [
  {k:'hero', n:'"오늘 해결사는 너다"', f:p=>p.m.cmp>=12?0.6:-0.3, r:p=>p.m.cmp>=12?'자신감 넘치는 표정으로 고개를 끄덕였다.':'부담스러운 듯 표정이 굳었다.'},
  {k:'easy', n:'"편하게, 네 것만 해"', f:p=>0.3, r:()=>'한결 편안해진 얼굴이다.'},
  {k:'push', n:'"요즘 실망스럽다. 보여 줘"', f:p=>p.m.det>=14?0.7:-0.45, r:p=>p.m.det>=14?'이를 악물고 배트를 쥐었다.':'시무룩해졌다.'},
];
function teamTalk(k){
  const pr=preState(); if(pr.talk) return; const u=S.teams[S.user], t=TALKS.find(x=>x.k===k);
  const f=t.f(teamMor(u), teamDet(u), S.phase==='post'||rankOf(matchInfo().oppId)<=2); f.v*=0.7+(u.mgr.mot??12)/30;
  applyFx(f); pr.talk={k, r: f.v>=0.25?'선수들이 힘차게 대답하며 그라운드로 나섰다.':f.v>=0.08?'선수들이 고개를 끄덕였다.':'선수들 사이에 어색한 침묵이 흘렀다.'}; save(); render();
}
let pmSel=null, preTab='plan';
function playerMsg(k){
  const pr=preState(); if(pr.msg || !pmSel) return; const p=S.players[pmSel], m=PMSG.find(x=>x.k===k);
  const v=m.f(p)*(0.7+(S.teams[S.user].mgr.mot??12)/30); applyFx({pv:[p.id, v], pm:[p.id, v>0?3:-3]});
  pr.msg={pid:p.id, k, r:`${p.name}: ${m.r(p)}`}; save(); render();
}
PAGES.pregame = ()=>{
  const mi=matchInfo(); if(!mi) return `<div class="panel"><h3>경기 전 준비</h3><p class="mute">오늘은 경기가 없어요.</p></div>`;
  const pr=preState(), u=S.teams[S.user];
  const press = pr.qs.length ? pr.qs.map((q,qi)=>`<div class="pq"><div class="pqq"><span class="mic">🎤</span><b>${esc(q.q)}</b></div>
      ${pr.ans[qi]==null ? `<div class="pqo">${q.o.map((o,oi)=>`<button onclick="pressAnswer(${qi},${oi})">${esc(o.t)}</button>`).join('')}</div>`
        : `<div class="pqa">${esc(q.o[pr.ans[qi]].t)}</div><div class="pqr">→ ${esc(q.o[pr.ans[qi]].r)}</div>`}</div>`).join('')
    : `<p class="mute">오늘은 기자회견이 없어요.</p>`;
  const tv = u.talk?.date===S.date ? u.talk.v : 0;
  const pool = [...luOf(u).map(x=>x.p), mi.mySP].filter(Boolean);
  const talk = pr.talk ? `<div class="pqa">${TALKS.find(x=>x.k===pr.talk.k).say}</div><div class="pqr">→ ${pr.talk.r}</div>`
    : `<div class="pqo">${TALKS.map(t=>`<button onclick="teamTalk('${t.k}')"><b>${t.n}</b> ${t.say}</button>`).join('')}</div>`;
  const msg = pr.msg ? `<div class="pqr">${esc(pr.msg.r)}</div>` : `<div class="lvgrid" style="margin:6px 0">${pool.map(p=>`<button class="lvc ${pmSel===p.id?'on':''}" onclick="pmSel='${p.id}';render()"><b>${p.name}</b><span>${POS_KO[p.pos]} · 사기 ${Math.round(p.morale)}</span></button>`).join('')}</div>
      ${pmSel?`<div class="pqo">${PMSG.map(m=>`<button onclick="playerMsg('${m.k}')">${m.n}</button>`).join('')}</div>`:'<span class="mute">선수를 고르면 메시지를 고를 수 있어요.</span>'}`;
  const mood = tv>=0.35?['최고조','good']:tv>=0.15?['좋음','good']:tv>-0.05?['보통','']:['가라앉음','warn'];
  const mob = typeof isMobile==='function' && isMobile();
  const tabs = [['plan','분석·플랜'], ...(pr.qs.length?[['press','기자회견'+(pr.ans.filter(x=>x!=null).length<pr.qs.length?' •':'')]]:[]), ['talk','미팅'+(pr.talk&&pr.msg?'':' •')]];
  if(!tabs.some(t=>t[0]===preTab)) preTab='plan';
  const sec = k => !mob || preTab===k;
  return `<div class="pregame ${mob?'mob':''}">
    ${mob?`<div class="pgtabs">${tabs.map(([k,l])=>`<button class="${preTab===k?'on':''}" onclick="preTab='${k}';render();scrollTo(0,0)">${l}</button>`).join('')}</div>`:''}
    <div class="panel pghead"><div class="row" style="gap:14px;justify-content:center">${crest(mi.a,56)}<div style="text-align:center"><b style="font-size:20px">${short(mi.a)} @ ${short(mi.h)}</b><br><span class="mute">${TD(mi.h).stadium} · ${fmtDate(S.date)}${S.phase==='post'&&S.post.series?' · '+S.post.series.name:''}</span></div>${crest(mi.h,56)}</div>
      <div style="text-align:center;margin-top:8px">선수단 분위기 <b class="${mood[1]}">${mood[0]}</b></div></div>
    ${sec('plan')?planPanel(true):''}
    ${pr.qs.length&&sec('press')?`<div class="panel"><h3>경기 전 기자회견</h3>${press}<p class="mute" style="font-size:12px;margin-top:6px">답변은 선수단 사기·오늘 경기력·이사회 신뢰·팬 만족도에 반영돼요.</p></div>`:''}
    ${sec('talk')?`<div class="panel"><h3>선수단 미팅</h3>${talk}</div>
    <div class="panel"><h3>선수에게 한마디</h3>${msg}</div>`:''}
    ${mob?(()=>{ const i=tabs.findIndex(t=>t[0]===preTab); return i<tabs.length-1?`<button class="pgnext" onclick="preTab='${tabs[i+1][0]}';render();scrollTo(0,0)">다음: ${tabs[i+1][1].replace(' •','')} →</button>`:''; })():''}
    <div class="panel pgfoot"><div class="row" style="gap:10px;flex-wrap:wrap"><button class="pri" onclick="preGo('live')">▶ 경기 중계 보기</button><button onclick="preGo('adv')">결과만 보기</button>
      <span style="flex:1"></span><label class="mute" style="font-size:13px">경기 전 준비 화면 <select onchange="setPref('pre',this.value);render()">${[['big','중요한 경기만'],['all','매 경기'],['off','안 보기']].map(([k,l])=>`<option value="${k}" ${preMode()===k?'selected':''}>${l}</option>`).join('')}</select></label></div></div>
  </div>`;
};
PAGE_LABEL.pregame = '경기 전 준비'; PAGE_GROUP.pregame = 'portal';

// ---------- 경기 중: 감독의 한마디 ----------
const SHOUTS = {
  bat: [ {k:'trust', n:'"네 스윙을 해라"'}, {k:'calm', n:'"짧게, 편하게 맞혀"'}, {k:'fire', n:'"여기서 끝내자!"'} ],
  fld: [ {k:'trust', n:'"네 공을 믿어"'}, {k:'calm', n:'"하나씩 잡아가자"'}, {k:'fire', n:'"피하지 말고 붙어!"'} ],
};
function shoutEffect(k, batting, p, t, lead){
  const mot=(t.mgr?.mot??12), sc=0.7+mot/30, cmp=p.m.cmp, det=p.m.det;
  let v, react;
  if(k==='trust'){ v=0.35+(cmp-10)*0.05; react = cmp>=12?`${p.name}의 눈빛이 살아났다`:`${p.name}이(가) 고개를 끄덕였다`; }
  else if(k==='calm'){ v=0.25; react=`${p.name}이(가) 크게 숨을 내쉬었다`; }
  else { const ok = det>=13 || cmp>=14; v = ok? 0.7 : -0.35; react = ok? `${p.name}이(가) 주먹을 불끈 쥐었다` : `${p.name}이(가) 잔뜩 굳어 버렸다`; }
  const say = SHOUTS[batting?'bat':'fld'].find(x=>x.k===k).n.replace(/"/g,'');
  return {v: v*sc, say, react};
}
function shoutHtml(ev, uBat, uFld){
  if(!LV || LV.exhib || !(uBat||uFld) || !ev || ev.inning==null) return '';
  const lead = LV.uSide===1 ? ev.score[1]-ev.score[0] : ev.score[0]-ev.score[1];
  const risp = !!(ev.bases[1]||ev.bases[2]);
  if(!risp || ev.inning<5 || Math.abs(lead)>3) return '';
  const used = LV.shoutN||0, key=ev.inning+'-'+ev.half, q=LV.queued||{};
  if(used>=3) return `<div class="shout off">📣 감독의 한마디는 이 경기에서 모두 썼어요 (3/3)</div>`;
  if(LV.shoutKey===key) return '';
  return `<div class="shout"><div class="lvh">📣 ${uBat?'득점 찬스':'실점 위기'} — 감독의 한마디 <span class="mute">(남은 횟수 ${3-used} · 이번 이닝 동안 효과)</span></div>
    <div class="row" style="gap:6px;flex-wrap:wrap">${SHOUTS[uBat?'bat':'fld'].map(s=>`<button class="${q.shout===s.k?'pri':''}" onclick="liveSet('shout','${s.k}')">${s.n}</button>`).join('')}</div></div>`;
}

// ---------- 설정: 스킨 · 환경설정 · 저장 슬롯 ----------
const SKINS = {
  base:    {n:'PM 차콜', d:'기본 다크', v:{}},
  classic: {n:'클래식 그린', d:'옛 감독 게임 느낌의 녹색 톤', v:{'--bg':'#0b1a12','--bg2':'#0e2016','--panel':'#11261a','--panel2':'#173323','--panel3':'#1d3d2a','--text':'#eaf5ec','--text2':'#c3dccb','--mute':'#86a892'}},
  navy:    {n:'미드나잇 네이비', d:'푸른 밤 야구장', v:{'--bg':'#070d1c','--bg2':'#0b1326','--panel':'#0f1a33','--panel2':'#152345','--panel3':'#1b2c55','--text':'#eef3ff','--text2':'#c5d1ee','--mute':'#8796bb'}},
  wine:    {n:'와인 레드', d:'짙은 버건디', v:{'--bg':'#14080b','--bg2':'#1b0b10','--panel':'#231016','--panel2':'#2e1620','--panel3':'#3a1c28','--text':'#f7ecef','--text2':'#e0c6cd','--mute':'#ad8a94'}},
  slate:   {n:'슬레이트 그레이', d:'밝은 회색 다크', v:{'--bg':'#1a1e24','--bg2':'#20252c','--panel':'#262c34','--panel2':'#303741','--panel3':'#3a424d','--text':'#f2f5f8','--text2':'#d3dae2','--mute':'#9aa5b1'}},
  hc:      {n:'고대비', d:'글자를 더 또렷하게', v:{'--bg':'#000','--bg2':'#000','--panel':'#0a0a0a','--panel2':'#161616','--panel3':'#222','--text':'#fff','--text2':'#f0f0f0','--mute':'#c4c4c4','--line':'rgba(255,255,255,.22)','--line2':'rgba(255,255,255,.35)'}},
};
function applyPrefs(){
  const p=pmPrefs(), sk=SKINS[p.skin]||SKINS.base, r=document.documentElement;
  const els=[r, document.body].filter(Boolean);
  els.forEach(el=>{ Object.keys(SKINS.hc.v).concat(['--bg2','--line','--line2']).forEach(k=>el.style.removeProperty(k)); for(const [k,v] of Object.entries(sk.v)) el.style.setProperty(k,v); });
  r.style.fontSize = ({s:'14px', m:'', l:'17px'})[p.font||'m'];
  document.body && document.body.classList.toggle('noanim', !!p.noanim);
  if(p.liveSpeed && typeof LV_SPEED!=='undefined') window.PM_LIVESPEED = p.liveSpeed;
}
const SLOT_KEY = i=>'pm2026_slot'+i;
function slotInfo(i){ try{ const raw=localStorage.getItem(SLOT_KEY(i)); if(!raw) return null; const s=JSON.parse(raw); return {team:s.user, year:s.year, date:s.date, at:s._savedAt, w:s.teams?.[s.user]?.w, l:s.teams?.[s.user]?.l}; }catch(e){ return null; } }
function saveSlot(i){ save(); try{ const o=JSON.parse(JSON.stringify(S)); o._savedAt=new Date().toISOString().slice(0,16).replace('T',' '); localStorage.setItem(SLOT_KEY(i), JSON.stringify(o)); alert(`슬롯 ${i}에 저장했어요.`); }catch(e){ alert('저장 공간이 부족해 슬롯에 저장하지 못했어요. 저장 파일 내보내기를 이용해 주세요.'); } render(); }
function loadSlot(i){ try{ const raw=localStorage.getItem(SLOT_KEY(i)); if(!raw) return; if(LV) return; localStorage.setItem('kboManager2026', raw); if(load()){ histB=[]; histF=[]; page='home'; render(); alert(`슬롯 ${i}을(를) 불러왔어요.`); } }catch(e){ alert('불러오지 못했어요.'); } }
function delSlot(i){ if(!confirm(`슬롯 ${i}을(를) 지울까요? 되돌릴 수 없어요.`)) return; try{ localStorage.removeItem(SLOT_KEY(i)); }catch(e){} render(); }
PAGES.settings = ()=>{
  const p=pmPrefs();
  const opt=(k,v,l,cur)=>`<button class="planc ${cur===v?'on':''}" onclick="setPref('${k}','${v}');render()"><b>${l}</b></button>`;
  const skins = Object.entries(SKINS).map(([k,s])=>{ const v={...{'--bg':'#090c11','--panel':'#11161d','--panel2':'#18202a','--text':'#eef2f6'}, ...s.v};
    return `<button class="skin ${ (p.skin||'base')===k?'on':''}" onclick="setPref('skin','${k}');render()"><span class="sw" style="background:${v['--bg']}"><i style="background:${v['--panel']}"></i><i style="background:${v['--panel2']}"></i><i style="background:var(--acc)"></i></span><b>${s.n}</b><span class="mute">${s.d}</span></button>`; }).join('');
  const slots=[1,2,3].map(i=>{ const s=slotInfo(i); return `<div class="slot"><b>슬롯 ${i}</b>${s?`<span>${crest(s.team,26)} ${tname(s.team)} · ${s.year}년 ${s.date?.slice(5).replace('-','/')} · ${s.w??0}승 ${s.l??0}패</span><span class="mute">${s.at||''}</span>`:'<span class="mute">비어 있음</span>'}
      <span style="flex:1"></span>${S?`<button onclick="saveSlot(${i})">저장</button>`:''}${s?`<button onclick="loadSlot(${i})">불러오기</button><button onclick="delSlot(${i})">삭제</button>`:''}</div>`; }).join('');
  return `<div class="settings">
    <div class="panel"><h3>스킨</h3><div class="skins">${skins}</div>
      <div class="row" style="gap:10px;margin-top:10px;font-size:13px"><label class="row" style="gap:6px"><input type="checkbox" ${p.neutral?'checked':''} onchange="setPref('neutral',this.checked);render()"> 구단 색 대신 기본 빨강 강조색 쓰기</label></div></div>
    <div class="panel"><h3>환경설정</h3>
      <div class="setrow"><span>글자 크기</span><div class="plg">${opt('font','s','작게',p.font||'m')}${opt('font','m','보통',p.font||'m')}${opt('font','l','크게',p.font||'m')}</div></div>
      <div class="setrow"><span>경기 전 준비 화면<br><span class="mute" style="font-size:12px">기자회견·선수단 미팅·플랜</span></span><div class="plg">${opt('pre','big','중요한 경기만',preMode())}${opt('pre','all','매 경기',preMode())}${opt('pre','off','안 보기',preMode())}</div></div>
      <div class="setrow"><span>중계 기본 속도</span><div class="plg">${opt('liveSpeed','slow','느리게',p.liveSpeed||'normal')}${opt('liveSpeed','normal','보통',p.liveSpeed||'normal')}${opt('liveSpeed','fast','빠르게',p.liveSpeed||'normal')}</div></div>
      <div class="setrow"><span>배경음악</span><div class="plg"><button class="planc ${BGM.on?'on':''}" onclick="BGM.toggle();setTimeout(render,50)"><b>${BGM.on?'켜짐':'꺼짐'}</b></button>
        <input type="range" min="0" max="1" step="0.05" value="${BGM.vol??0.35}" oninput="BGM.setVol(+this.value)" aria-label="배경음악 음량" style="width:160px"></div></div>
      <div class="setrow"><span>효과음<br><span class="mute" style="font-size:12px">플레이 버튼을 누를 때 타격음</span></span><div class="plg"><button class="planc ${BGM.sfx?'on':''}" onclick="BGM.setSfx(!BGM.sfx);render()"><b>${BGM.sfx?'켜짐':'꺼짐'}</b></button></div></div>
      <div class="setrow"><span>소리 미리 듣기</span><div class="plg">${[['hit','타격음','BGM.hit()'],['fan','팡파르','BGM.fanfare()'],['cheer','환호','BGM.crowd(\'xbh\',true)'],['hr','홈런','BGM.crowd(\'hr\',true)'],['groan','탄식','BGM.crowd(\'hit\',false)'],['song','응원가','BGM.crowd(\'song\')'],['rally','구호','BGM.crowd(\'rally\')'],['crisis','큰북','BGM.crowd(\'crisis\')']].map(([k,l,f])=>`<button onclick="${f}">${l}</button>`).join('')}</div></div>
      <div class="setrow"><span>효과음 출처</span><span class="mute" style="font-size:12.5px">Freesoundcraft Baseball FX Sound Pack · 관중 녹음 · 큰북·응원가·팡파르는 직접 합성</span></div>
      <div class="setrow"><span>화면 효과</span><div class="plg"><label class="row" style="gap:6px"><input type="checkbox" ${p.noanim?'checked':''} onchange="setPref('noanim',this.checked)"> 애니메이션 줄이기</label></div></div>
    </div>
    <div class="panel"><h3>저장</h3>
      <p class="mute" style="font-size:13px;margin-bottom:8px">게임은 진행할 때마다 자동 저장돼요. 슬롯에 따로 저장해 두면 그 시점으로 돌아갈 수 있어요.</p>
      ${S?`<div class="row" style="gap:8px;margin-bottom:10px"><button class="pri" onclick="save();alert('저장했어요.')">지금 저장</button><button onclick="go('savefile')">저장 파일 내보내기·불러오기</button></div>`:''}
      <div class="slots">${slots}</div></div>
  </div>`;
};
PAGE_LABEL.settings='설정'; PAGE_GROUP.settings='set'; PAGE_GROUP.savefile='set'; PAGE_LABEL.savefile=PAGE_LABEL.savefile||'저장 관리';
if(!MENUS.some(m=>m.k==='set')) MENUS.push({k:'set', l:'설정', items:[['settings','설정'],['savefile','저장 관리']]});
// 구단색 대신 기본 강조색
{ const _setAcc = setAcc; setAcc = function(){ _setAcc(); if(pmPrefs().neutral){ const r=document.documentElement; r.style.setProperty('--acc','#e5383b'); r.style.setProperty('--accL','#ff6b6e'); r.style.setProperty('--accS','rgba(229,56,59,.14)'); } }; }

// ---------- 메시지: 스페이스바로 다음 메시지 ----------
document.addEventListener('keydown', e=>{
  if(!S || LV) return;
  const tg=e.target; if(tg && (tg.tagName==='INPUT'||tg.tagName==='TEXTAREA'||tg.tagName==='SELECT'||tg.isContentEditable)) return;
  if(e.code!=='Space' && e.key!==' ') return;
  if(!(page==='inbox' || page==='view')) return;
  const i = S.inbox.findIndex(m=>!m.read);
  if(i<0){ if(page!=='home'){ e.preventDefault(); alert('읽지 않은 메시지가 없어요.'); } return; }
  e.preventDefault(); openMail(i);
});

// ---------- 팀 선택 (토스 스타일: 한 화면 목록 + 상세 카드) ----------
let pickSel = null, pickMore = false;
{ const _rs2 = renderStart; renderStart = function(){
  if(startStep!=='teams'){ _rs2(); return; }
  const root=document.getElementById('root'); const nm=document.getElementById('mgrName')?.value||'';
  const t = pickSel ? TD(pickSel) : null;
  const diff = x=> x.goalRank<=2?'높은 기대':x.goalRank<=5?'보통':'도전';
  root.innerHTML = `<div class="pick">
    <div class="pick-top"><div><button onclick="startStep='title';pickSel=null;renderStart()" style="margin-bottom:10px">← 타이틀</button><h2>어느 구단을 맡을까요?</h2>
      <div class="mute">2026 시즌 3월 시범경기부터 시작해요. 구단마다 예산·팬 성향·이사회 기대치가 달라요.</div></div></div>
    <div class="pick-grid"><div class="pick-list">${TEAM_DATA.slice().sort((a,b)=>a.prevRank-b.prevRank).map(x=>`<button class="pk ${pickSel===x.id?'on':''}" style="--c:${x.color}" onclick="pickSel='${x.id}';pickMore=false;renderStart()">${crest(x.id,44)}<span><b>${x.name}</b><span class="s">${x.city} · 예산 ${x.budget}억</span></span><span class="rk">2025<br> <b>${x.prevRank}위</b></span></button>`).join('')}</div>
    ${t ? `<div class="pdet ${pickMore?'more':''}" style="--c:${t.color}"><div class="hd">${crest(t.id,56)}<div><b style="font-size:19px">${t.name}</b><div class="mute" style="font-size:13px">${t.stadium} · 감독 ${t.mgr.name}</div></div>
        <button class="m-more" style="margin-left:auto;min-height:36px;padding:6px 12px;font-size:13px" onclick="pickMore=!pickMore;renderStart()">${pickMore?'접기':'자세히'}</button></div>
      <div class="st">${t.status}</div>
      <div class="kv"><div>이사회 목표<b>${goalText(t.goalRank)}</b></div><div>난이도<b>${diff(t)}</b></div><div>팬 규모<b>${t.fans.size}</b></div><div>팬 인내심<b>${t.fans.patience}</b></div></div>
      <input id="mgrName" placeholder="감독 이름 (비우면 ${t.mgr.name})" value="${esc(nm)}">
      <button class="go" onclick="pickTeam('${t.id}')">${t.name.split(' ').pop()} 감독으로 시작</button></div>`
      : `<div class="pdet"><b style="font-size:17px">구단을 골라 주세요</b><p class="mute" style="margin-top:8px;font-size:14px">목록에서 구단을 누르면 여기에서 정보를 보고 바로 시작할 수 있어요.</p><input id="mgrName" type="hidden" value="${esc(nm)}"></div>`}
    </div>
    <div class="foot" style="margin-top:18px">※ 모든 구단·선수·감독·코치는 한국 프로야구를 참고해 만든 가상 설정입니다. 실제 구단·인물과 관계없습니다.</div></div>`;
}; }
// PC 홈에도 요약 카드
{ const _r3 = render; render = function(){ _r3(); try{ if(S && page==='home' && !(typeof isMobile==='function' && isMobile()) && !(typeof isPC==='function' && isPC()) && typeof mHomeSummary==='function') mHomeSummary(); if(document.body) applyPrefs(); }catch(e){ console.error(e); } }; }

applyPrefs();
