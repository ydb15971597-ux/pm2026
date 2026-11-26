// 프로야구 매니저 PM — 구단 운영 화면 (재정·마케팅·프런트·1군/퓨처스·신인 드래프트·해외 스카우트·FA/스토브리그·캠프)
// ui.js의 FM 스타일 셸(MENUS·render·go) 위에 페이지를 추가한다. ui.js와 live.js 다음에 로드.

(function addCss(){
  const css = `
.cl-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}
.cl-tile{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;min-width:0}
.cl-tile .k{font-size:12px;color:var(--mute)} .cl-tile .v{font-size:22px;font-weight:800;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cl-tile .s{font-size:12px;color:var(--mute);margin-top:2px}
.cl-bar{height:8px;background:#232a33;border-radius:6px;overflow:hidden;margin-top:8px}.cl-bar i{display:block;height:100%;background:var(--acc)}
.cl-bar i.over{background:var(--bad)}
.cl-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(440px,100%),1fr));gap:12px}
.cl-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:12px}
.cl-opt{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:8px}
.cl-opt button{text-align:left;padding:10px 12px;height:auto;line-height:1.4;white-space:normal}
.cl-opt button b{display:block;font-size:14px}.cl-opt button span{font-size:12px;color:var(--mute)}
.cl-opt button.pri span{color:inherit;opacity:.85}
.cl-steps{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.cl-steps span{padding:6px 12px;border-radius:20px;background:#1d242c;color:var(--mute);font-size:13px}
.cl-steps span.on{background:var(--acc);color:#fff;font-weight:700}.cl-steps span.done{color:#c8d1da}
.cl-chip{display:inline-block;padding:1px 7px;border-radius:10px;font-size:11px;background:#26303a;color:#c8d1da;margin:1px 2px;white-space:nowrap}
.cl-chip.g{background:#1f4d33;color:#a8f0bf}.cl-chip.r{background:#4d2323;color:#ffb3ab}.cl-chip.y{background:#4d4318;color:#f2dc8a}
.cl-acc{font-size:11px;color:var(--mute)}
.bigst{display:flex;align-items:center;gap:8px;margin-top:4px}.bigst span{font-size:12px;color:var(--mute);width:40px}.bigst .stars{font-size:19px}
.cl-tbl{width:100%;border-collapse:collapse}.cl-tbl th,.cl-tbl td{padding:7px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
.cl-tbl th{font-size:12px;color:var(--mute);font-weight:600;white-space:nowrap}.cl-tbl td.n,.cl-tbl th.n{text-align:right;font-variant-numeric:tabular-nums}
.cl-tbl tr.me td{background:color-mix(in srgb,var(--acc) 14%,transparent)}
.cl-wrap{overflow-x:auto}
.cl-note{font-size:12px;color:var(--mute);margin-top:8px;line-height:1.6}
.cl-led td:first-child{color:#c8d1da}
input[type=range]{accent-color:var(--acc);width:100%}
#content a:not([class]),.modal a:not([class]){color:#8ab4ff;text-decoration:none}
#content a:not([class]):hover,.modal a:not([class]):hover{text-decoration:underline}
.cl-tbl a:not([class]){color:var(--text)}
@media (max-width:640px){ .cl-tile .v{font-size:18px} }
.menu>button,.cont button,.datebox b,.datebox span{white-space:nowrap}
@media (min-width:641px) and (max-width:1180px){ .tb1{height:auto;min-height:60px;flex-wrap:wrap;row-gap:4px;padding:6px 10px} .menu>button{font-size:14px;padding:0 8px;height:48px} .dd{top:48px} .cont .go{min-width:0} .datebox{min-width:0} }`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();

// ---------- 메뉴 등록 ----------
(function addMenus(){
  const M = k => MENUS.find(m=>m.k===k);
  const put = (k, after, item)=>{ const m=M(k); if(!m || m.items.some(x=>x[0]===item[0])) return; const i=m.items.findIndex(x=>x[0]===after); m.items.splice(i<0?m.items.length:i+1,0,item); };
  put('portal','standings',['post','가을야구']); put('portal','post',['abroad','해외파']);
  put('squad','squad',['entry','1군 · 퓨처스']);
  put('scout','db',['schools','고교 · 대학 야구']); put('scout','schools',['draft','신인 드래프트']); put('scout','draft',['overseas','해외 스카우트']); put('scout','overseas',['waivers','방출 · 자유계약']);
  const off = M('scout')?.items.find(x=>x[0]==='offseason'); if(off) off[1]='FA · 스토브리그';
  put('train','training',['camp','캠프']);
  put('club','club',['finance','재정']); put('club','finance',['marketing','마케팅']); put('club','history',['savefile','저장 관리']);
  const stf = M('club')?.items.find(x=>x[0]==='staff'); if(stf) stf[1]='프런트 · 코치진';
  for(const m of MENUS) for(const [p,l] of m.items){ PAGE_GROUP[p]=m.k; PAGE_LABEL[p]=l; }
  for(const r in STAFF_ROLES) COACH_DESC[r] ||= STAFF_ROLES[r].d;
})();

// ---------- 셸 연결 ----------
const _renderBase = render;
render = function(){
  if(S){ for(const td of TEAM_DATA){ const t=S.teams[td.id]; if(t?.bud) td.budget=t.bud.wage; if(t?.fans) td.fans=t.fans; } }
  else for(const td of TEAM_DATA){ td.budget=Math.round(CLUB_FIN[td.id].raw||CLUB_FIN[td.id].rev); td.fans=td._f0; }
  _renderBase();
  if(!S) return;
  const c=document.querySelector('.cont'); if(!c || S.fired) return;
  if(S.dclass?.active) c.innerHTML=`<button class="go" onclick="go('draft')">신인 드래프트 <span>»</span></button>`;
  else if(S.phase==='off' && S.off?.stage==='exhib'){
    const ex=S.off.exhib, m=todayMatch();
    { const r=ex.rec[S.user]||[0,0,0], el=document.querySelector('.datebox .rec'); if(el) el.textContent=`시범 ${r[0]}-${r[1]}${r[2]?'-'+r[2]:''}`; }
    c.innerHTML = ex.done ? `<button class="go" onclick="offAdv('open')">${S.year+1} 시즌 개막 <span>»</span></button>`
      : `${m?`<button class="go live" onclick="watchLive()">● 시범경기 중계 <span>»</span></button>`:''}<button class="${m?'':'go'}" onclick="adv(1)">${m?'결과만':'계속 <span>»</span>'}</button><button onclick="offAdv('stage')">시범경기 끝까지</button><button onclick="offAdv('open')">개막까지</button>`;
  }
  else if(S.phase==='off' && S.off){
    const nx={stove:'스프링캠프까지', camp:'시범경기까지', exhib:'개막까지'}[S.off.stage];
    c.innerHTML=`<button class="go" onclick="offAdv('week')">계속 (1주) <span>»</span></button><button onclick="offAdv('stage')" title="다음 일정 단계까지 진행">${nx}</button>${S.off.stage!=='exhib'?`<button onclick="offAdv('open')">개막까지</button>`:''}`;
  }
};
nextMatchText = function(){
  if(S.dclass?.active) return `신인 드래프트 진행 중 · ${Math.floor(S.dclass.idx/10)+1}라운드`;
  if(S.phase==='regular'){ const g=S.schedule[S.dayIdx]?.find(x=>x.includes(S.user)); if(!g) return ''; const home=g[0]===S.user; return `다음 경기 ${home?'vs':'@'} ${tname(home?g[1]:g[0])} · ${S.dayIdx+1}/144`; }
  if(S.phase==='post'){ const se=S.post.series; if(!se) return ''; return `${se.name} · ${short(se.hi)} ${se.wins[0]} - ${se.wins[1]} ${short(se.lo)}`; }
  if(S.phase==='off' && S.off) return {stove:'스토브리그 · FA 시장', camp:'스프링캠프', exhib:'시범경기'}[S.off.stage];
  return '오프시즌';
};
const _advBase = adv;
adv = function(n){
  if(S?.phase==='off' && S.off?.stage==='exhib'){ if(LV) return; const ex=S.off.exhib, before=ex.games.length; exhibAdv(n); save(); if(page!=='exhib') page='exhib'; render();
    const mine=ex.games.slice(before).filter(g=>g.full).pop(); if(n===1&&mine) showGame(mine.full); return; }
  const ph=S?.phase, ch=S?.post?.champion; _advBase(n);
  if(S?.dclass?.active && page!=='draft') return go('draft');
  if(ph==='regular' && S.phase==='post'){ go('post'); return postIntro(); }
  if(S.post?.champion && !ch) postChampion(); };
function offAdv(mode){
  if(LV) return;
  if(mode==='open' && !confirm('개막(3월 말)까지 한 번에 진행할까요?\nFA 협상·캠프·시범경기가 자동으로 처리됩니다.')) return;
  const before=S.year;
  if(mode==='week') advanceOff(1); else if(mode==='stage') advanceOff(30,true); else advanceOff(40);
  if(S.year!==before) page='home'; else if(S.off?.stage==='exhib' && mode!=='open' && page==='offseason') page='exhib';
  render(); window.scrollTo(0,0);
}
nextSeason = function(){ offAdv('open'); };
const _tacticsBase = PAGES.tactics;
PAGES.tactics = ()=>{ const u=S.teams[S.user], full=u.roster; u.roster=full.filter(id=>!S.players[id].farm);
  try{
    const a=act1(u), nP=a.filter(p=>p.isP).length, nH=a.filter(p=>!p.isP).length, bench=nH-u.lineup.length;
    const farmH=full.map(id=>S.players[id]).filter(p=>p.farm&&!p.isP).sort((x,y)=>ovrOf(y)-ovrOf(x)).slice(0,8);
    const full_=a.length>=ENTRY_MAX, spare=a.filter(p=>p.isP&&!u.rotation.includes(p.id)&&p.id!==u.closer&&!u.setup.includes(p.id)).sort((x,y)=>ovrOf(x)-ovrOf(y)).slice(0,3);
    const call=`<div class="card" style="min-width:0"><h3>퓨처스 야수 콜업</h3>
      ${full_?`<p class="cl-note" style="margin-top:0">1군이 가득 찼어요(${a.length}/${ENTRY_MAX}). 먼저 투수나 야수를 말소해야 올릴 수 있어요.${nP>13?` 지금 투수가 ${nP}명이라 많은 편이에요:`:''}</p>
        ${nP>13?`<div class="row" style="margin-bottom:8px">${spare.map(p=>`<button onclick="act(()=>entryMove('${p.id}',false))">↓ ${p.name} 말소</button>`).join('')}</div>`:''}`:''}
      <div style="overflow-x:auto"><table class="lu">${farmH.map(p=>`<tr><td>${pn(p,30,`${POS_KO[p.pos]} · ${p.age}세${p.fst&&p.fst.ab?` · 퓨처스 ${(p.fst.h/p.fst.ab).toFixed(3).replace(/^0/,'')} ${p.fst.hr}홈런`:''}`)}</td><td>${caStars(p)}</td>
        <td class="num">${S.phase==='regular'&&p.downUntil&&S.dayIdx<p.downUntil?`<span class="cl-chip y">재등록 ${p.downUntil-S.dayIdx}일 후</span>`:`<button ${full_||p.inj?'disabled':''} onclick="act(()=>entryMove('${p.id}',true))">↑ 1군 등록</button>`}</td></tr>`).join('')||'<tr><td class="mute">퓨처스 야수가 없어요</td></tr>'}</table></div></div>`;
    const head=`<div class="cl-note" style="margin:0 0 8px">1군 엔트리 <b>${a.length}/${ENTRY_MAX}명</b> = 투수 ${nP}명 + 야수 ${nH}명 → 선발 9명을 빼면 <b>벤치 야수 ${bench}명</b>.${bench<5?' <span class="warn">벤치가 얇아요. 아래 퓨처스 콜업이나 <a href="#" onclick="go(\'entry\');return false">1군 · 퓨처스</a>에서 투수를 줄이세요 (보통 투수 13명 · 야수 15명).</span>':''}</div>`;
    return head+_tacticsBase().replace('<div class="card"><h3>팀 전술</h3>', call+'<div class="card"><h3>팀 전술</h3>');
  } finally { u.roster=full; } };

// ---------- 공통 ----------
const stV = v => starBar((v-60)/26);
function estStars(p, v, k, scale){ const c=Math.round(estV(p,v,k,scale)); return `${stV(c)}<div class="cl-acc">${k>=85?'확실':k>=60?'대략':'불확실'}</div>`; }
cab = p => caStars(p);
const tile=(k,v,s='',bar=null,over=false)=>`<div class="cl-tile"><div class="k">${k}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:''}${bar!=null?`<div class="cl-bar"><i class="${over?'over':''}" style="width:${clamp(bar,0,100)}%"></i></div>`:''}</div>`;
const eok = v => `${r1(v)}억`;
const act = (fn)=>{ const e=fn(); if(e) alert(e); render(); };
const posTxt = p => POS_KO[p.pos];
function rangeTxt([a,b]){ return a===b?`${a}`:`${a}~${b}`; }

// ---------- 1군 · 퓨처스 ----------
let entryF='all';
PAGES.entry = ()=>{
  const u=S.teams[S.user], a=act1(u), f=teamPlayers(u).filter(p=>p.farm);
  const flt=p=> entryF==='h'?!p.isP : entryF==='p'?p.isP : true;
  const row=(p,up)=>{ const st=p.st, fs=p.fst, wait=S.phase==='regular'&&p.downUntil&&S.dayIdx<p.downUntil;
    const rec = up ? (fs&&(fs.ab||fs.outs) ? (p.isP?`퓨처스 ${fs.g}경기 ERA ${(fs.er*27/Math.max(fs.outs,1)).toFixed(2)} · ${fs.k}K`:`퓨처스 ${fs.ab?(fs.h/fs.ab).toFixed(3).replace(/^0/,''):'-'} · ${fs.hr}홈런`) : '퓨처스 기록 없음')
                   : (p.isP?(st.outs?`ERA ${era(st)} · ${ip(st.outs)}이닝`:'1군 기록 없음'):(st.pa?`${avg(st.h,st.ab)} · ${st.hr}홈런`:'1군 기록 없음'));
    return `<tr><td>${pn(p,28,`${posTxt(p)} · ${p.age}세${p.foreign?(p.aq?' · 아시아쿼터':' · 외국인'):''}${p.rookie?' · 신인':''}`)}</td><td>${caStars(p)} ${typeof caArrow==='function'?caArrow(p):''}<br>${paStars(p)}</td>
      <td>${p.inj?`<span class="cl-chip r">부상 ${p.inj}일</span>`:''}${wait?`<span class="cl-chip y">재등록 ${p.downUntil-S.dayIdx}일 후</span>`:''}</td><td class="mute" style="font-size:12px">${rec}</td>
      <td class="n"><button onclick="act(()=>entryMove('${p.id}',${up}))" ${wait&&up?'disabled':''}>${up?'↑ 1군 등록':'↓ 말소'}</button> ${relBtn(p,true)}</td></tr>`; };
  const sortV=p=>-(ovrOf(p));
  const tb=(list,up)=>`<div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>능력 / 잠재력</th><th>상태</th><th>기록</th><th></th></tr>${list.filter(flt).sort((x,y)=>sortV(x)-sortV(y)).map(p=>row(p,up)).join('')||'<tr><td class="mute" colspan="5">해당 선수 없음</td></tr>'}</table></div>`;
  const fc=u.staff['퓨처스감독'];
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">1군 엔트리 · 퓨처스</h2>
    <div class="row">${[['all','전체'],['h','야수'],['p','투수']].map(([k,l])=>`<button class="${entryF===k?'pri':''}" onclick="entryF='${k}';render()">${l}</button>`).join('')}
    <button onclick="if(confirm('수석코치 추천대로 1군 엔트리를 다시 짤까요?')){autoEntry(S.teams[S.user]);save();render()}">추천 엔트리</button></div></div>
   <div class="cl-tiles">${tile('1군 엔트리',`${a.length} / ${ENTRY_MAX}`,`투수 ${a.filter(p=>p.isP).length} · 야수 ${a.filter(p=>!p.isP).length}`,a.length/ENTRY_MAX*100)}
    ${tile('퓨처스',`${f.length}명`,`퓨처스 감독 ${fc.name} (능력 ${fc.rating})`)}${tile('보류 선수',`${u.roster.length} / ${ROSTER_MAX_USER}`,'1군 + 퓨처스 전체',u.roster.length/ROSTER_MAX_USER*100)}
    ${tile('부상자',`${teamPlayers(u).filter(p=>p.inj).length}명`,`의무팀장 ${u.staff['의무팀장'].name}`)}</div>
   <div class="cl-2"><div class="panel"><h3>1군 (${a.length}명)</h3>${tb(a,false)}</div><div class="panel"><h3>퓨처스 (${f.length}명)</h3>${tb(f,true)}</div></div>
   <p class="cl-note">1군 엔트리는 최대 ${ENTRY_MAX}명이에요. 말소한 선수는 10일이 지나야 다시 등록할 수 있어요. 퓨처스 선수는 2군 경기에 꾸준히 나가며 성장해요. 25세 이하라면 퓨처스 감독 능력이 높을수록 더 빨리 자라요. 1군에 있어도 출전 기회가 적은 25세 이하 선수는 성장이 느려요.</p>`;
};

// ---------- 재정 ----------
PAGES.finance = ()=>{
  const u=S.teams[S.user], cf=CLUB_FIN[S.user], fy=u.fy||{}, pv=u.fyPrev, pr=payroll(u), tu=transUsed(u), cap=capOf(S.phase==='off'?S.year+1:S.year), ct=capTotal(u);
  const inc=REV_KEYS.reduce((s,k)=>s+(fy[k]||0),0), out=Object.keys(fy).filter(k=>!REV_KEYS.includes(k)).reduce((s,k)=>s-(fy[k]||0),0);
  const led=(o)=>{ const ks=Object.keys(FIN_LABEL); const rv=ks.filter(k=>REV_KEYS.includes(k)), ex=ks.filter(k=>!REV_KEYS.includes(k));
    return `<table class="cl-tbl cl-led"><tr><th>수입</th><th class="n">억 원</th></tr>${rv.map(k=>`<tr><td>${FIN_LABEL[k]}</td><td class="n good">${o[k]?'+'+r1(o[k]):'-'}</td></tr>`).join('')}
      <tr><th>지출</th><th></th></tr>${ex.map(k=>`<tr><td>${FIN_LABEL[k]}</td><td class="n bad">${o[k]?r1(o[k]):'-'}</td></tr>`).join('')}</table>`; };
  const rows=TEAM_DATA.map(td=>{ const t=S.teams[td.id], c=CLUB_FIN[td.id]; return `<tr class="${td.id===S.user?'me':''}"><td>${crest(td.id,18)} ${td.name}</td><td class="n">${c.raw||c.rev}</td><td class="n ${c.op<0?'bad':'good'}">${c.op>0?'+':''}${c.op}</td><td class="n">${r1(payroll(t))}</td><td class="n">${r1(capTotal(t))}</td><td class="n">${t.bud.wage}</td><td class="n ${t.balance<0?'bad':''}">${r1(t.balance)}</td></tr>`; }).join('');
  return `<h2>재정</h2>
   <div class="cl-tiles">${tile('구단 잔고',eok(u.balance),u.balance<0?'적자 — 이사회 신뢰 하락 중':'시즌 결산 때 적자면 모기업이 메워 줘요')}
    ${tile('연봉 예산',`${r1(pr)} / ${u.bud.wage}억`,'선수 연봉 총액 / 이사회 배정',pr/u.bud.wage*100,pr>u.bud.wage)}
    ${tile('영입 예산',`${r1(tu)} / ${u.bud.trans}억`,'계약금·이적료·보상금 사용액',tu/Math.max(u.bud.trans,1)*100,tu>u.bud.trans)}
    ${tile('경쟁균형세',`${r1(ct)} / ${cap}억`,'외국인·신인 제외 연봉 상위 40명 (계약금은 연평균)',ct/cap*100,ct>cap)}</div>
   <div class="cl-2">
    <div class="panel"><h3>이번 회계연도 (11월~) <span class="mute" style="font-weight:400;font-size:13px">수입 ${r1(inc)} · 지출 ${r1(out)} · 손익 <b class="${inc-out<0?'bad':'good'}">${inc-out>=0?'+':''}${r1(inc-out)}억</b></span></h3>${led(fy)}</div>
    <div class="grid" style="gap:12px">
     <div class="panel"><h3>예산 조정 (이사회 승인 범위)</h3>
      <p class="cl-note" style="margin-top:0">영입 예산과 연봉 예산 사이로 금액을 옮길 수 있어요. 연봉 예산을 넘는 계약은 맺을 수 없어요.</p>
      <div class="row"><input id="bmv" type="number" step="1" value="5" style="width:90px" aria-label="옮길 금액(억)">억
       <button onclick="act(()=>moveBudget(+document.getElementById('bmv').value))">영입 → 연봉</button>
       <button onclick="act(()=>moveBudget(-document.getElementById('bmv').value))">연봉 → 영입</button></div>
      <div class="row" style="margin-top:10px"><button class="pri" onclick="act(requestBudget)" ${u.bud.req?'disabled':''}>이사회에 예산 증액 요청</button><span class="mute" style="font-size:12px">한 해 한 번 · 이사회 신뢰도 ${Math.round(u.board)} · 단장 협상력 ${u.staff['단장'].rating}</span></div></div>
     <div class="panel"><h3>${TD(S.user).name} 실제 재무 (2025 회계연도)</h3>
      <table class="cl-tbl"><tr><td>매출</td><td class="n"><b>${cf.raw||cf.rev}억</b></td></tr><tr><td>영업손익</td><td class="n ${cf.op<0?'bad':'good'}">${cf.op>0?'+':''}${cf.op}억</td></tr>
      ${cf.raw?`<tr><td>게임 내 야구단 매출(추정)</td><td class="n">${cf.rev}억</td></tr>`:''}</table>
      ${cf.note?`<p class="cl-note">${cf.note}</p>`:''}
      <p class="cl-note">구단 매출·영업손익은 2025 회계연도 감사보고서(금융감독원 전자공시, 2026년 4월 집계)를 따라요. 수입 항목 비중, 중계권 배분(구단당 ${TV_SHARE}억), 객단가(입장 1.9만 원·상품 1.3만 원)는 게임용 추정치예요. 경쟁균형세 상한은 2026년 ${capOf(2026)}억이고 매년 5%씩 올라요. 외국인 선수 규정: 신규 첫해 총액 100만 달러(${F_RULE.newCap}억), 3명 합계 400만 달러(${F_RULE.totalCap}억), 아시아쿼터 20만 달러(${F_RULE.aqCap}억).</p></div>
    </div></div>
   ${pv?`<div class="panel" style="margin-top:12px"><h3>지난 회계연도 (${u.fyPrevYear} 시즌)</h3>${led(pv)}</div>`:''}
   <div class="panel" style="margin-top:12px"><h3>10개 구단 재정</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>구단</th><th class="n">2025 매출</th><th class="n">2025 영업손익</th><th class="n">현재 연봉 총액</th><th class="n">경쟁균형세 대상</th><th class="n">연봉 예산</th><th class="n">잔고</th></tr>${rows}</table></div></div>`;
};

// ---------- 마케팅 ----------
PAGES.marketing = ()=>{
  const u=S.teams[S.user], m=u.mkt, f=u.fans, e=mktEff(u), head=u.staff['마케팅팀장'], td=TD(S.user);
  const g=u.w+u.l||1, fill=fillOf(u,u.w/g), att=Math.round(td.cap*fill);
  const perGame = att*TICKET*priceMul(u)+att*BIZ*bizMul(u);
  const evCd = m.ev && S.phase==='regular' && S.dayIdx<m.ev.cd ? m.ev.cd-S.dayIdx : 0;
  return `<h2>마케팅</h2>
   <div class="cl-tiles">${tile('예상 관중',`${att.toLocaleString()}명`,`수용 ${td.cap.toLocaleString()}명 · 점유율 ${Math.round(fill*100)}%`,fill*100)}
    ${tile('홈경기당 수입',eok(perGame),'입장 + 상품·식음')}${tile('시즌 평균 관중',u.homeG?`${Math.round(u.attTotal/u.homeG).toLocaleString()}명`:'-',`홈 ${u.homeG||0}경기`)}
    ${tile('마케팅 효율',`${Math.round(e*100)}%`,`마케팅팀장 ${head.name} (능력 ${head.rating})`,e*70)}</div>
   <div class="cl-2">
    <div class="panel"><h3>티켓 가격</h3><div class="cl-opt">${Object.entries(PRICE).map(([k,v])=>`<button class="${m.price===k?'pri':''}" onclick="S.teams[S.user].mkt.price='${k}';save();render()"><b>${k}</b><span>${v.d}</span></button>`).join('')}</div>
     <h3 style="margin-top:16px">마케팅 예산 <span class="mute" style="font-weight:400;font-size:13px">연 ${m.spend}억 (상한 ${u.bud.mktMax}억)</span></h3>
     <input type="range" min="0" max="${u.bud.mktMax}" step="1" value="${m.spend}" aria-label="마케팅 예산" onchange="S.teams[S.user].mkt.spend=+this.value;save();render()">
     <p class="cl-note">예산을 늘릴수록 캠페인 효과가 커지지만 효과는 점점 줄어들어요 (예산의 제곱근에 비례). 예산은 정규시즌 동안 매주 나눠서 나가요.</p></div>
    <div class="panel"><h3>팬 현황</h3>${meter('팬 규모',f.size)}${meter('열정',f.passion)}${meter('인내심',f.patience)}${meter('기대치',f.expect)}${meter('만족도',u.fanMood)}
     <p class="cl-note">${f.desc}</p></div></div>
   <div class="panel" style="margin-top:12px"><h3>캠페인 중점 <span class="mute" style="font-weight:400;font-size:13px">최대 2개</span></h3><div class="cl-opt">${Object.entries(MKT_FOCUS).map(([k,d])=>`<button class="${m.focus.includes(k)?'pri':''}" onclick="toggleFocus('${k}')"><b>${k}</b><span>${d}</span></button>`).join('')}</div></div>
   <div class="panel" style="margin-top:12px"><h3>팬 이벤트 ${evCd?`<span class="cl-chip y">다음 이벤트까지 ${evCd}경기일</span>`:''}</h3><div class="cl-opt">${Object.entries(MKT_EVENTS).map(([k,v])=>`<button onclick="act(()=>runEvent('${k}'))" ${S.phase!=='regular'||evCd?'disabled':''}><b>${k} · ${v.cost}억</b><span>${v.d}</span></button>`).join('')}</div>
    <p class="cl-note">이벤트는 정규시즌에만 열 수 있고, 한 번 연 뒤에는 잠시 기다려야 해요.</p></div>`;
};
function toggleFocus(k){ const m=S.teams[S.user].mkt; const i=m.focus.indexOf(k); if(i>=0) m.focus.splice(i,1); else { if(m.focus.length>=2) m.focus.shift(); m.focus.push(k); } save(); render(); }

// ---------- 프런트 · 코치진 ----------
let staffRole='all';
PAGES.staff = ()=>{
  const u=S.teams[S.user];
  const atx=c=>Object.entries(c.at||{}).map(([k,v])=>`<span class="cl-chip ${v>=15?'g':v<=7?'r':''}">${k} ${v}</span>`).join('');
  const row=(role)=>{ const c=u.staff[role]; return `<tr><td><b>${roleName(role)}</b><div class="mute" style="font-size:12px">${STAFF_ROLES[role].d}</div></td>
    <td><a href="#" onclick="staffModal('${role}');return false"><b>${c.name}</b></a>${c.acting?' <span class="cl-chip y">대행</span>':''}${c.expiring?' <span class="cl-chip r">계약 만료</span>':''}<div class="mute" style="font-size:12px">${c.age}세</div></td>
    <td>${rc(c.rating)}</td><td>${atx(c)}</td><td class="n">${c.sal}억</td><td class="n">${c.acting?'-':c.yrs+'년'}</td>
    <td class="n">${c.expiring?`<button class="pri" onclick="renewStaff('${role}');render()">재계약 (연 ${r1(c.sal*1.08+0.1)}억)</button>`:''}${!c.acting?`<button onclick="if(confirm('${c.name} ${roleName(role)}을(를) 해임할까요? 남은 계약의 50%(${r1(c.sal*Math.max(c.yrs,0)*0.5)}억)를 위약금으로 지급합니다.'))act(()=>fireStaff('${role}'))">해임</button>`:''}</td></tr>`; };
  const grp=g=>Object.keys(STAFF_ROLES).filter(r=>STAFF_ROLES[r].g===g);
  const head='<tr><th>보직</th><th>이름</th><th>능력</th><th>세부 능력</th><th class="n">연봉</th><th class="n">잔여 계약</th><th></th></tr>';
  const mk=S.coachMarket.map((c,i)=>({c,i})).filter(x=>staffRole==='all'||x.c.role===staffRole);
  const tot=Object.values(u.staff).reduce((s,c)=>s+c.sal,0);
  return `<h2>프런트 · 코치진</h2>
   <div class="cl-tiles">${tile('스태프 인건비',eok(tot),'+ 기타 직원 30억 (연간)')}${tile('단장',u.staff['단장'].name,`협상력 ${u.staff['단장'].rating} — FA·예산 협상`)}${tile('국내 스카우트',u.staff['국내스카우트'].name,`능력 ${u.staff['국내스카우트'].rating} — 드래프트 평가`)}${tile('해외 스카우트',u.staff['해외스카우트'].name,`능력 ${u.staff['해외스카우트'].rating} — 외국인 평가`)}</div>
   <div class="panel"><h3>코칭스태프</h3><div class="cl-wrap"><table class="cl-tbl">${head}${grp('코치').map(row).join('')}</table></div></div>
   <div class="panel" style="margin-top:12px"><h3>프런트 (운영팀)</h3><div class="cl-wrap"><table class="cl-tbl">${head}${grp('프런트').map(row).join('')}</table></div></div>
   <div class="panel" style="margin-top:12px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">스태프 영입 시장</h3>
     <select aria-label="보직" onchange="staffRole=this.value;render()"><option value="all">전체 보직</option>${Object.keys(STAFF_ROLES).map(r=>`<option value="${r}" ${staffRole===r?'selected':''}>${roleName(r)}</option>`).join('')}</select></div>
    <div class="cl-wrap"><table class="cl-tbl"><tr><th>이름</th><th>보직</th><th>능력</th><th>세부 능력</th><th class="n">요구 연봉</th><th class="n">계약</th><th>현재 담당</th><th></th></tr>
    ${mk.map(({c,i})=>{ const cur=u.staff[c.role]; return `<tr><td><b>${c.name}</b><div class="mute" style="font-size:12px">${c.age}세</div></td><td>${roleName(c.role)}</td><td>${rc(c.rating)}</td><td>${atx(c)}</td><td class="n">${c.ask}억</td><td class="n">${c.yrs}년</td>
      <td class="mute" style="font-size:12px">${cur.name} (${cur.rating})</td><td class="n"><button class="${c.rating>cur.rating?'pri':''}" onclick="if(confirm('${c.name}을(를) ${roleName(c.role)}(으)로 영입할까요?${cur.acting?'':` 기존 ${cur.name}의 남은 계약 50%(${r1(cur.sal*Math.max(cur.yrs,0)*0.5)}억)를 위약금으로 지급합니다.`}'))act(()=>hireStaff(${i}))">영입</button></td></tr>`; }).join('')||'<tr><td class="mute" colspan="8">후보 없음</td></tr>'}</table></div>
    <p class="cl-note">시장은 약 한 달마다 바뀌어요. 계약이 끝난 스태프는 2월 1일 스프링캠프 전까지 재계약하지 않으면 팀을 떠나요. 스태프 이름은 모두 가상 인물이에요.</p></div>`;
};
function staffModal(role){ const c=S.teams[S.user].staff[role];
  modal(`<h2>${c.name} <span class="mute" style="font-size:15px">${roleName(role)} · ${c.age}세</span></h2>
   <p>${STAFF_ROLES[role].d}</p><table class="cl-tbl">${Object.entries(c.at).map(([k,v])=>`<tr><td>${k}</td><td class="n">${rc(v)}</td></tr>`).join('')}<tr><td><b>종합 능력</b></td><td class="n">${rc(c.rating)}</td></tr></table>
   <p class="cl-note">연봉 ${c.sal}억 · 잔여 계약 ${c.yrs}년. 게임 효과에는 종합 능력이 쓰여요.</p>`); }
hireCoach = function(i){ const e=hireStaff(i); if(e) alert(e); render(); };

// ---------- 신인 드래프트 ----------
let drF='all', drSort='est';
PAGES.draft = ()=>{
  const d=S.dclass, u=S.teams[S.user], sc=u.staff['국내스카우트'];
  if(!d) return '<p class="mute">드래프트 정보가 없어요.</p>';
  const flt={all:()=>true, hs:p=>p.schoolType==='고교', uni:p=>p.schoolType!=='고교', p:p=>p.isP, h:p=>!p.isP, w:p=>d.watch.includes(p.id)};
  const myTurn = d.active && d.picks[d.idx]===S.user;
  const rows = (d.active||!d.done) ? dAvail().filter(flt[drF]).sort((a,b)=>drSort==='acc'?b.dk-a.dk:drSort==='ca'?dEstCA(b)-dEstCA(a):dEst(b)-dEst(a)).slice(0,90) : [];
  const am=p=>{ const s=p.amStat; return p.isP?`${s.ip}이닝 ERA ${s.era} · ${s.k}K · 최고 ${s.top}km`:`${s.g}경기 ${s.avg} · ${s.hr}홈런 · ${s.sb}도루`; };
  const rng=(v,k,sc)=>{ const w=Math.round((100-k)/100*sc*0.7); return w<3?`${v}`:`${v-w}~${v+w}`; };
  const table = rows.length ? `<div class="cl-wrap"><table class="cl-tbl"><tr><th></th><th>이름</th><th>학교</th><th>포지션</th><th>투타</th><th>예상 능력</th><th>예상 잠재력</th><th>평가</th><th>지난 시즌 (아마추어)</th><th></th></tr>
    ${rows.map(p=>`<tr class="${d.watch.includes(p.id)?'me':''}"><td><button title="집중 관찰" aria-label="집중 관찰" onclick="act(()=>draftWatch('${p.id}'))">${d.watch.includes(p.id)?'★':'☆'}</button></td>
      <td><a href="#" onclick="prospectModal('${p.id}');return false"><b>${p.name}</b></a> <span class="mute" style="font-size:12px">${p.age}세</span></td><td>${p.school} <span class="cl-chip">${p.schoolType}</span></td><td>${posTxt(p)}</td><td>${handTxt(p)}</td>
      <td>${stV(dEstCA(p))}</td><td>${stV(dEst(p))}</td><td class="cl-acc">${p.dk>=85?'확실':p.dk>=60?'대략':'불확실'}</td><td class="mute" style="font-size:12px">${am(p)}</td>
      <td class="n">${d.active?`<button class="${myTurn?'pri':''}" onclick="userDraft('${p.id}');render()" ${myTurn?'':'disabled'}>지명</button>`:''}</td></tr>`).join('')}</table></div>` : '';
  const filters = `<div class="row" style="margin-bottom:10px">${[['all','전체'],['hs','고교'],['uni','대학'],['p','투수'],['h','야수'],['w',`관찰 중 (${d.watch.length})`]].map(([k,l])=>`<button class="${drF===k?'pri':''}" onclick="drF='${k}';render()">${l}</button>`).join('')}
    <select aria-label="정렬" onchange="drSort=this.value;render()">${[['est','예상 잠재력순'],['ca','예상 현재능력순'],['acc','정확도순']].map(([k,l])=>`<option value="${k}" ${drSort===k?'selected':''}>${l}</option>`).join('')}</select></div>`;
  if(d.active){
    const rd=Math.floor(d.idx/10)+1, n=d.idx%10+1;
    return `<h2>${d.year+1} 신인 드래프트 <span class="mute" style="font-size:15px">${rd}라운드 ${n}순위</span></h2>
     <div class="cl-tiles">${tile('현재 지명',myTurn?'<span class="good">우리 차례</span>':tShort(d.picks[d.idx]),`${rd}R ${n}순위 · 전체 ${d.idx+1}번째`)}${tile('우리 지명',`${d.log.filter(x=>x.tid===S.user&&x.pid).length}명`,`계약금 ${r1(d.log.filter(x=>x.tid===S.user&&x.pid).reduce((s,x)=>s+S.players[x.pid].bonus,0))}억`)}
      ${tile('보류 선수',`${u.roster.length}명`,'지명 선수는 11월 합류')}${tile('국내 스카우트',sc.name,`능력 ${sc.rating}`)}</div>
     <div class="row" style="margin-bottom:10px"><button class="pri" onclick="userDraftAuto(false);render()" ${myTurn?'':'disabled'}>스카우트 추천 지명</button><button onclick="userDraftPass();render()" ${myTurn?'':'disabled'}>이번 순번 지명 포기</button>
      <button onclick="if(confirm('남은 라운드를 모두 스카우트 추천으로 지명할까요?')){userDraftAuto(true);render()}">남은 라운드 자동</button></div>
     <div class="cl-2" style="grid-template-columns:minmax(0,2.2fr) minmax(240px,1fr)"><div class="panel">${filters}${table}</div>
      <div class="panel"><h3>지명 현황</h3><div class="scroll" style="max-height:70vh">${d.log.slice().reverse().map(x=>`<div style="padding:4px 0;border-bottom:1px solid var(--line);${x.tid===S.user?'color:#ffd166':''}">${x.text}</div>`).join('')||'<p class="mute">아직 지명이 없어요.</p>'}</div></div></div>
     <p class="cl-note">계약금: 1라운드 3.5억(1~3순위 +1.5/+1.0/+0.5억), 2라운드 1.8억, 3라운드 1.2억 … 11라운드 0.3억. 영입 예산에서 나가요.</p>`;
  }
  if(d.done){
    const mine=d.log.filter(x=>x.tid===S.user&&x.pid);
    return `<h2>${d.year+1} 신인 드래프트 결과</h2><div class="cl-2"><div class="panel"><h3>우리 구단 지명 (${mine.length}명)</h3>${mine.map(x=>{const p=S.players[x.pid]; return `<div style="padding:5px 0;border-bottom:1px solid var(--line)">${x.text}${p?` <span class="mute" style="font-size:12px">· 예상 잠재력</span> ${stV(dEst(p))}`:''}</div>`;}).join('')||'<p class="mute">없음</p>'}
      <p class="cl-note">지명 선수는 시즌이 끝난 뒤 마무리캠프부터 퓨처스로 합류해요. 다음 드래프트 후보는 새 시즌 개막과 함께 공개돼요.</p></div>
      <div class="panel"><h3>전체 지명</h3><div class="scroll" style="max-height:60vh">${d.log.map(x=>`<div style="padding:3px 0;${x.tid===S.user?'color:#ffd166':''}">${x.text}</div>`).join('')}</div></div></div>`;
  }
  return `<h2>${d.year+1} 신인 드래프트 후보 <span class="mute" style="font-size:15px">9월 드래프트 · 고교 ${d.pool.filter(id=>S.players[id]?.schoolType==='고교').length}명 · 대학 ${d.pool.filter(id=>S.players[id]&&S.players[id].schoolType!=='고교').length}명</span></h2>
   <div class="cl-tiles">${tile('드래프트',`${S.year}. 9. 15`,`${DRAFT_ROUNDS}라운드 · 전년도 순위 역순`)}${tile('우리 1라운드 순번',`${(S.prevFinal||TEAM_DATA.slice().sort((a,b)=>a.prevRank-b.prevRank).map(t=>t.id)).slice().reverse().indexOf(S.user)+1}순위`,'')}
    ${tile('국내 스카우트',sc.name,`능력 ${sc.rating} — 높을수록 평가가 빨리 정확해져요`)}${tile('집중 관찰',`${d.watch.length} / 10명`,'★를 눌러 지정')}</div>
   <div class="panel">${filters}${table}</div>
   <p class="cl-note">학교 이름은 실제 고교·대학 야구부지만 선수는 모두 가상 인물이에요. 표시된 능력은 스카우트 추정치예요. 시즌이 지날수록, 집중 관찰할수록 범위가 좁아지고 정확해져요. 연고 지역(${CITY_REGION[TD(S.user).city]}) 학교 선수는 처음부터 더 잘 알고 있어요. 아마추어 기록은 상대 수준이 낮아 실제 실력보다 좋아 보일 수 있어요.</p>`;
};
function prospectModal(pid){
  const p=S.players[pid]; if(!p) return; const k=p.dk;
  const L=p.isP?P_ATTR:H_ATTR, keys=Object.keys(L).filter(x=>!(x==='cat'&&p.pos!=='C'));
  const nz=x=>((hash(p.id+x)%1000)/500-1);
  const est=x=>{ const v=p.a[x]+nz(x)*(100-k)/100*5, w=(100-k)/100*3; const lo=clamp(Math.round(v-w),1,20), hi=clamp(Math.round(v+w),1,20); return lo===hi?`${lo}`:`${lo}~${hi}`; };
  const s=p.amStat;
  modal(`<div class="row" style="flex-wrap:nowrap">${avatar(p,64)}<div><h2 style="margin:0">${p.name}</h2><div class="mute">${p.school} (${p.schoolType}) · ${p.region} · ${posTxt(p)} · ${handTxt(p)} · ${p.age}세</div></div></div>
   <div class="cl-tiles" style="margin-top:12px">${tile('예상 능력',stV(dEstCA(p)))}${tile('예상 잠재력',stV(dEst(p)))}${tile('평가 정확도',k>=85?'확실':k>=60?'대략':'불확실')}</div>
   <h3>스카우트 평가 (추정 범위)</h3><div class="cl-3">${keys.map(x=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:3px 0"><span>${L[x]}</span><b>${est(x)}</b></div>`).join('')}</div>
   ${p.isP?`<p>구종: ${Object.keys(p.pitches).join(' · ')} · 최고 구속 ${s.top}km</p>`:''}
   <p class="mute">지난 시즌: ${p.isP?`${s.ip}이닝 ERA ${s.era} · 탈삼진 ${s.k}`:`${s.g}경기 타율 ${s.avg} · ${s.hr}홈런 · ${s.sb}도루`}</p>
   <div class="row"><button class="pri" onclick="act(()=>draftWatch('${p.id}'));closeModal()">${S.dclass.watch.includes(p.id)?'집중 관찰 해제':'집중 관찰 지정'}</button></div>`);
}

// ---------- 해외 스카우트 ----------
let ovF='all';
PAGES.overseas = ()=>{
  const u=S.teams[S.user], sc=u.staff['해외스카우트'], fc=fCounts(u), mis=u.ovs.mission;
  const mine=teamPlayers(u).filter(p=>p.foreign);
  const cands=u.ovs.cands.map(id=>S.players[id]).filter(p=>p&&!p.team).filter(p=>ovF==='all'||(ovF==='aq'?p.aqOK:ovF==='p'?p.isP:!p.isP));
  const lvTxt=L=>{ const m=(L.lv[0]+L.lv[1])/2; return m>=15?'리그 에이스·중심타자급 다수':m>=13.5?'리그 주전급':m>=12?'리그 주전~백업':m>=11?'리그 백업급':'육성형'; };
  const regOpen = S.phase==='regular' ? (md()<=F_RULE.lastDay && (u.fRep||0)<F_RULE.replace) : S.phase==='off';
  const stat=p=>{ const s=p.ovStat; return p.isP?`${s.ip}이닝 ${s.w}승 ERA ${s.era} · 9이닝당 ${s.k9}K · 최고 ${s.top}km`:`${s.g}경기 ${s.avg} · ${s.hr}홈런 · OPS ${s.ops}`; };
  return `<h2>해외 스카우트 · 외국인 선수</h2>
   <div class="cl-tiles">${tile('외국인 선수',`${fc.reg} / 3`,`투수 ${fc.regP} · 타자 ${fc.regH} (같은 유형 2명까지)`)}${tile('아시아쿼터',`${fc.aq} / 1`,'아시아 국적 · 아시아/호주 리그 출신, 총액 20만 달러')}
    ${tile('외국인 3명 연봉 합계',`${r1(fc.regSal)} / ${F_RULE.totalCap}억`,'400만 달러 상한',fc.regSal/F_RULE.totalCap*100,fc.regSal>F_RULE.totalCap)}
    ${tile('시즌 중 교체',S.phase==='regular'?`${u.fRep||0} / ${F_RULE.replace}회`:'오프시즌',S.phase==='regular'?(md()<=F_RULE.lastDay?'8월 15일까지 가능':'등록 마감'):'제한 없음')}</div>
   <div class="panel"><h3>우리 외국인 선수</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>구분</th><th>능력 / 잠재력</th><th class="n">연봉</th><th>기록</th><th></th></tr>
    ${mine.map(p=>`<tr><td>${pn(p,28,`${posTxt(p)} · ${p.age}세${p.nat?' · '+p.nat:''}`)}</td><td>${p.aq?'<span class="cl-chip y">아시아쿼터</span>':'<span class="cl-chip">외국인</span>'}</td><td>${caStars(p)}<br>${paStars(p)}</td><td class="n">${p.salary}억</td><td class="mute" style="font-size:12px">${seasonLine(p)}</td>
      <td class="n"><button onclick="if(confirm('${p.name}을(를) 방출할까요? 남은 연봉을 지급하고, 시즌 중이면 교체 횟수가 하나 줄어요.'))act(()=>releasePlayer('${p.id}'))">방출</button></td></tr>`).join('')||'<tr><td class="mute" colspan="6">없음</td></tr>'}</table></div></div>
   <div class="panel" style="margin-top:12px"><h3>스카우트 파견 ${mis?`<span class="cl-chip y">${OV_LEAGUES[mis.lg].n} 출장 중 · ${mis.end} 보고</span>`:''}</h3>
    <p class="cl-note" style="margin-top:0">${sc.name} 해외 스카우트(능력 ${sc.rating})를 2주간 파견하면 후보 ${3+Math.floor(sc.rating/6)}명을 추려 와요. 능력이 높을수록 평가가 정확해요.</p>
    <div class="cl-opt">${Object.entries(OV_LEAGUES).map(([k,L])=>`<button ${mis?'disabled':''} onclick="if(confirm('${L.n}에 스카우트를 2주간 파견할까요? 출장비 ${L.cost}억'))act(()=>startMission('${k}'))"><b>${L.n} · ${L.cost}억</b><span>${lvTxt(L)} · ${L.age[0]}~${L.age[1]}세 · 몸값 ${L.pm>=1.4?'비쌈':L.pm>=0.9?'보통':'저렴'}${L.will<0.6?' · 한국행 설득 어려움':''}${AQ_LEAGUES.has(k)?' · 아시아쿼터 가능':''}</span></button>`).join('')}</div></div>
   <div class="panel" style="margin-top:12px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">영입 후보 (${cands.length})</h3>
     <div class="row">${[['all','전체'],['p','투수'],['h','타자'],['aq','아시아쿼터 가능']].map(([k,l])=>`<button class="${ovF===k?'pri':''}" onclick="ovF='${k}';render()">${l}</button>`).join('')}</div></div>
    <div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>소속 리그</th><th>예상 능력</th><th>예상 잠재력</th><th>지난 시즌</th><th class="n">요구 조건</th><th></th></tr>
    ${cands.map(p=>`<tr><td><a href="#" onclick="ovModal('${p.id}');return false"><b>${p.name}</b></a><div class="mute" style="font-size:12px">${p.nat} · ${posTxt(p)} · ${p.age}세 · ${handTxt(p)}</div></td><td>${OV_LEAGUES[p.lg].n}${p.aqOK?' <span class="cl-chip y">AQ</span>':''}</td>
      <td>${estStars(p,CA(p),p.sk,30)}</td><td>${estStars(p,p.PA,p.sk,34)}</td><td class="mute" style="font-size:12px">${stat(p)}</td>
      <td class="n">연 ${p.ask.sal}억${p.ask.fee?`<div class="mute" style="font-size:12px">이적료 ${p.ask.fee}억</div>`:''}</td>
      <td class="n"><button onclick="act(()=>followUp('${p.id}'))" title="0.2억">추가 관찰</button> <button class="pri" onclick="ovOffer('${p.id}')" ${regOpen?'':`disabled title="${S.phase==='post'?'포스트시즌 중':'8월 15일 이후 또는 교체 2회 사용'}"`}>계약 제안</button></td></tr>`).join('')||'<tr><td class="mute" colspan="8">후보가 없어요. 스카우트를 파견하세요.</td></tr>'}</table></div>
    <p class="cl-note">선수 이름과 기록은 모두 가상이에요. 약한 리그에서 뛴 선수일수록 현지 기록이 실제 실력보다 좋아 보여요. 추가 관찰(0.2억)을 하면 평가가 정확해져요. 오프시즌에는 FA · 스토브리그 화면에도 해외 후보가 나와요.</p></div>`;
};
function ovModal(pid){ const p=S.players[pid]; const k=p.sk, L=p.isP?P_ATTR:H_ATTR, keys=Object.keys(L).filter(x=>!(x==='cat'&&p.pos!=='C'));
  const nz=x=>((hash(p.id+x)%1000)/500-1);
  const est=x=>{ const v=p.a[x]+nz(x)*(100-k)/100*5, w=(100-k)/100*3; const lo=clamp(Math.round(v-w),1,20), hi=clamp(Math.round(v+w),1,20); return lo===hi?`${lo}`:`${lo}~${hi}`; };
  modal(`<div class="row" style="flex-wrap:nowrap">${avatar(p,64)}<div><h2 style="margin:0">${p.name}</h2><div class="mute">${p.nat} · ${OV_LEAGUES[p.lg].n} · ${posTxt(p)} · ${handTxt(p)} · ${p.age}세</div></div></div>
   <div class="cl-tiles" style="margin-top:12px">${tile('예상 능력',stV(Math.round(estV(p,CA(p),k,30))))}${tile('예상 잠재력',stV(Math.round(estV(p,p.PA,k,34))))}${tile('평가 정확도',k>=85?'확실':k>=60?'대략':'불확실')}${tile('요구 조건',`연 ${p.ask.sal}억`,p.ask.fee?`이적료 ${p.ask.fee}억`:'이적료 없음')}</div>
   <h3>스카우트 평가 (추정 범위)</h3><div class="cl-3">${keys.map(x=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:3px 0"><span>${L[x]}</span><b>${est(x)}</b></div>`).join('')}</div>
   ${p.isP?`<p>구종: ${Object.keys(p.pitches).join(' · ')}</p>`:''}<p class="mute">특성(스카우트 메모): ${k>=60?p.traits.join(', '):'정보 부족 — 추가 관찰 필요'}</p>`); }
function ovOffer(pid){ const p=S.players[pid], u=S.teams[S.user], fc=fCounts(u);
  const slots=[]; if(p.aqOK && fc.aq<1) slots.push('aq'); if(fc.reg<F_RULE.slots && (p.isP?fc.regP:fc.regH)<2) slots.push('reg');
  if(!slots.length){ alert(`등록할 자리가 없어요. 외국인 ${fc.reg}/3명 (투수 ${fc.regP} · 타자 ${fc.regH}, 같은 유형 2명까지)${p.aqOK?`, 아시아쿼터 ${fc.aq}/1명`:''}. 먼저 해외 스카우트 화면에서 방출하세요.`); return; }
  const info=s=>{ const ask=s==='reg'&&p.askReg?p.askReg:p.ask, fee=ask.fee||0, max= s==='aq'?r1(F_RULE.aqCap-fee):r1(Math.min(F_RULE.newCap-fee, F_RULE.totalCap-fc.regSal)); return {ask:ask.sal, fee, max, def:Math.max(0.5,Math.min(ask.sal,max))}; };
  const I=Object.fromEntries(slots.map(s=>[s,info(s)])); window._ovI=I; const s0=slots[0];
  modal(`<h2>${p.name} 계약 제안</h2><p class="mute">${p.nat} · ${OV_LEAGUES[p.lg].n} · ${posTxt(p)} · ${p.age}세</p>
   <div class="row">등록 <select id="ovSlot" onchange="const i=_ovI[this.value];document.getElementById('ovSal').value=i.def;document.getElementById('ovHint').innerHTML=ovHint(i)">${slots.map(s=>`<option value="${s}">${s==='aq'?'아시아쿼터':'외국인 선수'}</option>`).join('')}</select>
    연봉(억) <input id="ovSal" type="number" step="0.1" min="0.3" value="${I[s0].def}" style="width:100px">
    <button class="pri" onclick="const e=signOverseas('${pid}',+document.getElementById('ovSal').value,document.getElementById('ovSlot').value); alert(e||'계약 성공!'); if(!e) closeModal(); else render();">제안</button></div>
   <p class="cl-note" id="ovHint">${ovHint(I[s0])}</p>
   <p class="cl-note">요구액보다 적게 부르면 거절할 가능성이 커지고, 거절하면 1주 뒤에 다시 협상할 수 있어요. MLB·NPB 1군 선수는 한국행을 설득하기 어려워요.</p>`); }
function ovHint(i){ return `요구 연봉 <b>${i.ask}억</b>${i.fee?` · 이적료 ${i.fee}억(구단 부담)`:''} · 이 자리로 줄 수 있는 최대 연봉 <b>${i.max}억</b> (신규 외국인 첫해 ${F_RULE.newCap}억, 아시아쿼터 ${F_RULE.aqCap}억 상한 — 이적료 포함)`; }

// ---------- FA · 스토브리그 ----------
let faF='all';
PAGES.offseason = ()=>{
  const u=S.teams[S.user];
  const steps=[['stove','스토브리그 (11~1월)'],['camp','스프링캠프 (2월)'],['exhib','시범경기 (3월)'],['open','개막']];
  const cur=S.phase==='off'&&S.off?S.off.stage:null, ci=steps.findIndex(s=>s[0]===cur);
  const head=`<div class="cl-steps">${steps.map(([k,l],i)=>`<span class="${k===cur?'on':ci>i?'done':''}">${ci>i?'✓ ':''}${l}</span>`).join('')}</div>`;
  if(!cur){
    const exp=teamPlayers(u).filter(p=>(p.yrs??1)<=1&&!p.foreign&&p.age>=28&&CA(p)>=100).sort((a,b)=>CA(b)-CA(a));
    return `<h2>FA · 스토브리그</h2>${head}<div class="panel"><h3>시즌 후 FA 자격 예정 (우리 팀)</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th class="n">나이</th><th>능력</th><th class="n">연봉</th></tr>${exp.map(p=>`<tr><td>${pn(p,26,posTxt(p))}</td><td class="n">${p.age}</td><td>${caStars(p)}</td><td class="n">${p.salary}억</td></tr>`).join('')||'<tr><td class="mute" colspan="4">없음</td></tr>'}</table></div>
      <p class="cl-note">FA 시장은 한국시리즈가 끝나면 열려요. 계약이 끝나는 28세 이상 선수는 FA가 될 수 있어요. 27세 이하는 보류 선수로 남아 연봉만 다시 정해요.</p></div>`;
  }
  const off=S.off;
  if(cur==='stove'){
    let pool=off.pool.map(id=>S.players[id]).filter(p=>p&&!p.team);
    const F={mine:p=>p.faFrom===S.user, h:p=>!p.isP, p:p=>p.isP, f:p=>p.foreign, off:p=>!!off.offers[p.id]};
    if(F[faF]) pool=pool.filter(F[faF]); pool.sort((a,b)=>CA(b)-CA(a));
    const caTxt=p=>p.ovPool?`${estStars(p,CA(p),p.sk||50,30)}`:`${caStars(p)}<br>${paStars(p)}`;
    return `<h2>FA · 스토브리그 <span class="mute" style="font-size:15px">${off.week}주차</span></h2>${head}
     <div class="cl-tiles">${tile('연봉 예산',`${r1(payroll(u))} / ${u.bud.wage}억`,'',payroll(u)/u.bud.wage*100,payroll(u)>u.bud.wage)}${tile('영입 예산 잔여',eok(u.bud.trans-transUsed(u)),'계약금·이적료·보상금')}
      ${tile('보류 선수',`${u.roster.length} / ${ROSTER_MAX_USER}`)}${tile('진행 중 오퍼',`${Object.keys(off.offers).length}건`,'매주 선수들이 답해요')}</div>
     <div class="panel"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">FA 시장 (${pool.length}명)</h3>
      <div class="row">${[['all','전체'],['mine','우리 팀 FA'],['h','야수'],['p','투수'],['f','외국인'],['off','오퍼 중']].map(([k,l])=>`<button class="${faF===k?'pri':''}" onclick="faF='${k}';render()">${l}</button>`).join('')}</div></div>
      <div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>이전 소속</th><th>능력 / 잠재력</th><th class="n">요구 조건</th><th class="n">관심 구단</th><th>우리 오퍼</th><th></th></tr>
      ${pool.map(p=>{ const o=off.offers[p.id], n=Object.keys(p.aiOff||{}).length; return `<tr class="${p.faFrom===S.user?'me':''}"><td>${p.ovPool?`<a href="#" onclick="ovModal('${p.id}');return false"><b>${p.name}</b></a><div class="mute" style="font-size:12px">${posTxt(p)} · ${p.age}세</div>`:pn(p,26,`${posTxt(p)} · ${p.age}세`)}${p.foreign?` <span class="cl-chip ${p.aqOK?'y':''}">${p.aqOK?'AQ 가능':'외국인'}</span>`:''}</td>
        <td>${p.faFrom?`${crest(p.faFrom,16)} ${short(p.faFrom)}`:`<span class="mute">${p.lg?OV_LEAGUES[p.lg].n:'신규'}</span>`}</td><td>${caTxt(p)}</td>
        <td class="n">${p.ask.yrs}년 ${r1(askTotal(p))}억<div class="mute" style="font-size:12px">${p.ask.bonus?`계약금 ${p.ask.bonus} + `:''}연 ${p.ask.sal}${p.ask.fee?` · 이적료 ${p.ask.fee}`:''}</div></td>
        <td class="n">${n?`<span class="cl-chip ${n>=2?'r':'y'}">${n}개 구단</span>`:'-'}</td>
        <td>${o?`<b class="good">${o.yrs}년 ${r1(offTotal(o))}억</b>`:'<span class="mute">-</span>'}</td>
        <td class="n">${o?`<button onclick="withdrawOffer('${p.id}');render()">철회</button>`:''}<button class="${p.faFrom===S.user?'pri':''}" onclick="faOffer('${p.id}')">${o?'수정':p.faFrom===S.user?'재계약':'오퍼'}</button></td></tr>`; }).join('')}</table></div>
      <p class="cl-note">선수들은 매주 받은 제안(계약금+연봉×기간, 구단 매력, 원소속 여부)을 비교해 결정해요. 시간이 지나면 요구액이 조금씩 내려가지만, 대어급은 일찍 다른 팀과 계약할 수 있어요. 다른 구단의 CA 130 이상 FA를 영입하면 원소속 구단에 직전 연봉의 200%를 보상금으로 내요. 1월 말에 시장이 닫혀요.</p></div>
     ${off.log.length?`<div class="panel" style="margin-top:12px"><h3>이번 스토브리그 계약</h3><div class="scroll" style="max-height:320px">${off.log.slice().reverse().map(l=>`<div style="padding:3px 0">${l}</div>`).join('')}</div></div>`:''}`;
  }
  if(cur==='camp'){
    return `<h2>스프링캠프</h2>${head}<div class="panel"><p>1차 <b>${u.camp.loc1}</b> → 2차 <b>${u.camp.loc2}</b> · 중점 <b>${u.camp.focus}</b></p><p class="cl-note">캠프 동안 매주 집중 훈련으로 선수들이 성장해요. 3월 8일부터 시범경기가 열려요.</p>
      <button onclick="go('camp')">캠프 화면</button> <button onclick="go('entry')">1군 엔트리 점검</button></div>
      <div class="panel" style="margin-top:12px"><h3>스토브리그 계약 정리</h3><div class="scroll" style="max-height:360px">${off.log.slice().reverse().map(l=>`<div style="padding:3px 0">${l}</div>`).join('')||'<p class="mute">없음</p>'}</div></div>`;
  }
  return `<h2>시범경기</h2>${head}${exhibPage()}`;
};
function exhibHtml(ex){
  if(!ex) return '<p class="mute">시범경기 기록이 없어요.</p>';
  const st=Object.entries(ex.rec).map(([id,[w,l,t]])=>({id,w,l,t})).sort((a,b)=>(b.w/(b.w+b.l||1))-(a.w/(a.w+a.l||1)));
  const mine=ex.games.filter(g=>g.h===S.user||g.a===S.user);
  return `<div class="cl-2"><div class="panel"><h3>시범경기 순위</h3><table class="cl-tbl"><tr><th>#</th><th>팀</th><th class="n">승</th><th class="n">패</th><th class="n">무</th></tr>${st.map((t,i)=>`<tr class="${t.id===S.user?'me':''}"><td>${i+1}</td><td>${crest(t.id,18)} ${tname(t.id)}</td><td class="n">${t.w}</td><td class="n">${t.l}</td><td class="n">${t.t}</td></tr>`).join('')}</table><p class="cl-note">시범경기 결과는 정규시즌 순위에 들어가지 않아요.</p></div>
   <div class="panel"><h3>우리 경기</h3><table class="cl-tbl">${mine.slice().reverse().map(g=>{const me=g.h===S.user?1:0, my=g.s[me], op=g.s[1-me]; const i=ex.games.indexOf(g); return `<tr><td class="mute">${g.d.slice(5)}</td><td>${my>op?'<b class="good">승</b>':my<op?'<b class="bad">패</b>':'<b class="warn">무</b>'}</td><td>${me?'vs':'@'} ${tname(me?g.a:g.h)}</td><td class="n"><b>${my} : ${op}</b></td><td>${g.full?`<a href="#" onclick="showGame(S.off.exhib.games[${i}].full);return false">박스스코어</a>`:''}</td></tr>`;}).join('')||'<tr><td class="mute">아직 경기가 없어요</td></tr>'}</table></div></div>`;
}
function faOffer(pid){ const p=S.players[pid], o=S.off.offers[pid]||{sal:p.ask.sal,yrs:p.ask.yrs,bonus:p.ask.bonus||0};
  modal(`<h2>${p.name} ${p.faFrom===S.user?'재계약':'영입'} 오퍼</h2><p class="mute">${posTxt(p)} · ${p.age}세 · 요구: ${p.ask.yrs}년 총액 ${r1(askTotal(p))}억 (${p.ask.bonus?`계약금 ${p.ask.bonus}억 + `:''}연봉 ${p.ask.sal}억)${p.ask.fee?` · 이적료 ${p.ask.fee}억 별도`:''}</p>
   <div class="row">연봉(억/년) <input id="foSal" type="number" step="0.1" min="0.3" value="${o.sal}" style="width:90px">
    ${p.foreign?'':`계약금(억) <input id="foBon" type="number" step="0.5" min="0" value="${o.bonus||0}" style="width:90px">
    기간 <select id="foYrs">${[1,2,3,4,5,6].map(y=>`<option ${y===o.yrs?'selected':''}>${y}</option>`).join('')}</select>년`}
    ${p.foreign&&p.aqOK?`등록 <select id="foSlot"><option value="reg">외국인</option><option value="aq">아시아쿼터</option></select>`:''}
    <button class="pri" onclick="const r=makeOffer('${pid}',+document.getElementById('foSal').value,${p.foreign?1:`+document.getElementById('foYrs').value`},${p.foreign?0:`+document.getElementById('foBon').value`},${p.foreign&&p.aqOK?`document.getElementById('foSlot').value`:'undefined'}); alert(r.msg); if(r.ok) closeModal();">오퍼 제출</button></div>
   <p class="cl-note">계약금은 영입 예산에서 바로 나가고, 연봉은 연봉 예산에 잡혀요. 총액이 요구액의 70%보다 적으면 협상하지 않아요. 결과는 다음 주 진행 때 메일로 와요.</p>`); }

// ---------- 캠프 ----------
PAGES.camp = ()=>{
  const u=S.teams[S.user], c=u.camp, fc=u.fcamp, st=S.phase==='off'&&S.off?S.off.stage:null;
  const lockF = st && st!=='stove' || (st==='stove' && S.off.fcampDone>0);
  const lockS = st==='camp'||st==='exhib';
  const locBtns=(k)=>`<div class="cl-opt">${Object.entries(CAMP_LOC).map(([n,L])=>`<button class="${c[k]===n?'pri':''}" ${lockS?'disabled':''} onclick="S.teams[S.user].camp.${k}='${n}';save();render()"><b>${n} · ${L.cost}억</b><span>${L.d}</span></button>`).join('')}</div>`;
  return `<h2>캠프</h2>
   <div class="panel"><h3>마무리캠프 (11월) ${lockF?'<span class="cl-chip">진행됨/확정</span>':''}</h3>
    <div class="cl-opt">${Object.entries(FCAMP).map(([n,L])=>`<button class="${fc.loc===n?'pri':''}" ${lockF?'disabled':''} onclick="S.teams[S.user].fcamp.loc='${n}';save();render()"><b>${n}${L.cost?` · ${L.cost}억`:''}</b><span>${n==='생략'?'휴식 — 성장 없음':n==='국내'?'기본 성장':'따뜻한 미야자키 교육리그 — 성장 +25%'}</span></button>`).join('')}</div>
    <div class="row" style="margin-top:8px">참가 대상 ${['유망주','전원'].map(w=>`<button class="${fc.who===w?'pri':''}" ${lockF?'disabled':''} onclick="S.teams[S.user].fcamp.who='${w}';save();render()">${w==='유망주'?'26세 이하 유망주':'선수단 전원'}</button>`).join('')}</div>
    <p class="cl-note">시즌이 끝난 뒤 11월 4주 동안 진행해요. 신인 지명 선수도 함께 참가해요.</p></div>
   <div class="panel" style="margin-top:12px"><h3>스프링캠프 (2월~3월 초) ${lockS?'<span class="cl-chip">진행 중/확정</span>':''}</h3>
    <h3 style="font-size:14px">1차 캠프 (2월 1일~20일)</h3>${locBtns('loc1')}
    <h3 style="font-size:14px;margin-top:12px">2차 캠프 (2월 21일~3월 7일)</h3>${locBtns('loc2')}
    <h3 style="font-size:14px;margin-top:12px">훈련 중점</h3><div class="cl-opt">${Object.entries(CAMP_FOCUS).map(([n,F])=>`<button class="${c.focus===n?'pri':''}" ${lockS?'disabled':''} onclick="S.teams[S.user].camp.focus='${n}';save();render()"><b>${n}</b><span>${F.d}</span></button>`).join('')}</div>
    <p class="cl-note">예상 비용 ${r1(CAMP_LOC[c.loc1].cost*0.6+CAMP_LOC[c.loc2].cost*0.4)}억. 캠프는 시즌 중 주간 훈련보다 성장 폭이 커요. 날씨가 추운 국내 캠프는 부상 위험이 높아요.</p></div>
   ${S.lastExhib&&S.phase!=='off'?`<h3 style="margin-top:16px">지난 시범경기</h3>${exhibHtml(S.lastExhib)}`:''}`;
};

// ---------- 선수단: 1군/퓨처스 구분 ----------
const _squadBase = PAGES.squad;
PAGES.squad = ()=>{ const u=S.teams[S.user], full=u.roster; u.roster=full.filter(id=>!S.players[id].farm);
  try{ return _squadBase().replace(/외국인<\/[^>]*>\s*<[^>]*>[^<]*\/ 4/, m=>m.replace('/ 4','/ 3+1'))+`<p class="cl-note">퓨처스 선수 ${full.length-u.roster.length}명은 <a href="#" onclick="go('entry');return false"><b>1군 · 퓨처스</b></a> 화면에서 볼 수 있어요.</p>`; } finally { u.roster=full; } };

// ---------- 선수 프로필: 엔트리 버튼 ----------
const _playerBase = PAGES.player;
PAGES.player = ()=>{ const p=P(curPlayer); let h=_playerBase();
  if(p && p.team===S.user) h=`<div class="row" style="justify-content:flex-end;margin-bottom:8px"><span class="cl-chip ${p.farm?'y':'g'}">${p.farm?'퓨처스':'1군'}</span><button onclick="act(()=>entryMove('${p.id}',${!!p.farm}))">${p.farm?'↑ 1군 등록':'↓ 퓨처스 말소'}</button>${relBtn(p)}</div>`+h;
  return h; };

render();

// ---------- 가을야구 ----------
const POST_STAGES = [['와일드카드 결정전','4위 vs 5위 · 4위 1승 안고 시작 · 최대 2경기'],['준플레이오프','3위 vs 와일드카드 승자 · 5전 3선승'],['플레이오프','2위 vs 준PO 승자 · 5전 3선승'],['한국시리즈','1위 vs PO 승자 · 7전 4선승']];
function postSeries(i){ // i번째 단계의 대진·결과
  const P=S.post, sd=P.seeds; if(!P) return null;
  if(P.series && P.series.stage===i) return {...P.series, live:true};
  const done=(P.done||[])[i]; if(done) return done;
  const hi = sd[3-i]; return {hi, lo:null, wins:[0,0], games:[], pending:true};
}
const _startSeries = startSeries;
startSeries = function(){ const P=S.post; if(P.series && P.series.stage!=null){ (P.done ||= [])[P.series.stage] = {...P.series, done:true, winner:P.lastWinner}; } _startSeries(); };
const _postAfter3 = postAfter;
postAfter = function(g){ const P=S.post, se=P.series; _postAfter3(g); if(P.champion && se && !(P.done||[])[3]) (P.done ||= [])[3]={...se, done:true, winner:P.champion}; };
PAGES.post = ()=>{
  const P=S.post;
  if(!P){
    const st=standings(), top=st[0], cut=st[4], gl=t=>((top.w-t.w)+(t.l-top.l))/2, left=144-(S.teams[S.user].w+S.teams[S.user].l+S.teams[S.user].t);
    return `<h2>가을야구 레이스</h2><div class="cl-tiles">${tile('정규시즌 남은 경기',`${left}경기`,'정규시즌 5위까지 가을야구 진출')}${tile('우리 순위',`${rankOf(S.user)}위`,rankOf(S.user)<=5?'진출권 안':'5위와 '+(((S.teams[S.user].l-cut.l)+(cut.w-S.teams[S.user].w))/2).toFixed(1)+'경기 차')}</div>
     <div class="panel"><table class="cl-tbl"><tr><th>#</th><th>팀</th><th class="n">승</th><th class="n">패</th><th class="n">무</th><th class="n">승률</th><th class="n">게임차</th><th>가을야구</th></tr>
     ${st.map((t,i)=>`<tr class="${t.id===S.user?'me':''}" style="${i===4?'border-bottom:2px solid var(--acc)':''}"><td>${i+1}</td><td>${crest(t.id,18)} ${tname(t.id)}</td><td class="n">${t.w}</td><td class="n">${t.l}</td><td class="n">${t.t}</td><td class="n">${pct(t).toFixed(3)}</td><td class="n">${i?gl(t).toFixed(1):'-'}</td><td>${['한국시리즈 직행','플레이오프 직행','준플레이오프 직행','와일드카드 (1승 어드밴티지)','와일드카드'][i]||'<span class="mute">-</span>'}</td></tr>`).join('')}</table>
     <p class="cl-note">포스트시즌: 와일드카드 결정전(4·5위) → 준플레이오프(3위) → 플레이오프(2위) → 한국시리즈(1위). 정규시즌은 올스타 휴식기와 우천 순연을 거쳐 9월 말~10월 초에 끝나고, 가을야구는 10월에 열려요.</p></div>`;
  }
  const box=(i)=>{ const se=postSeries(i), [nm,desc]=POST_STAGES[i];
    const team=(id,w,win)=>id?`<div class="row" style="justify-content:space-between;flex-wrap:nowrap;padding:6px 0;${win?'font-weight:800':''}${id===S.user?';color:#ffd166':''}"><span>${crest(id,22)} ${short(id)} <span class="mute" style="font-size:12px">${P.seeds.indexOf(id)+1}위</span></span><b style="font-size:20px">${w??''}</b></div>`:`<div class="mute" style="padding:6px 0">대기 중</div>`;
    const st = se.live?'<span class="cl-chip y">진행 중</span>':se.done?'<span class="cl-chip g">종료</span>':'<span class="cl-chip">예정</span>';
    return `<div class="panel" style="min-width:0"><div class="row" style="justify-content:space-between"><b>${nm}</b>${st}</div><div class="cl-acc" style="margin-bottom:6px">${desc}</div>
      ${team(se.hi,se.pending?null:se.wins[0],se.winner===se.hi)}${team(se.lo,se.pending?null:se.wins[1],se.winner===se.lo)}
      ${(se.games||[]).length?`<div style="margin-top:6px;font-size:12px">${se.games.map((g,k)=>`<div>${k+1}차전 ${short(se.lo||'')} ${g.s[0]} : ${g.s[1]} ${short(se.hi)} ${g.full?`<a href="#" onclick="showGame(postGame(${i},${k}));return false">박스스코어</a>`:''}</div>`).join('')}</div>`:''}</div>`; };
  const champ=P.champion;
  return `<h2>${S.year} 포스트시즌</h2>
   ${champ?`<div class="panel" style="text-align:center;margin-bottom:12px;background:linear-gradient(135deg,color-mix(in srgb,${TD(champ).color} 55%,#0e1217),#0e1217)"><div style="font-size:14px;opacity:.85">${S.year} 한국시리즈 우승</div><div class="row" style="justify-content:center;margin:8px 0">${crest(champ,64)}<span style="font-size:30px;font-weight:900">🏆 ${tname(champ)}</span></div></div>`:''}
   <div class="cl-tiles" style="grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))">${[0,1,2,3].map(box).join('')}</div>
   <p class="cl-note">${P.seeds.includes(S.user)?(champ===S.user?'우승을 축하합니다!':'우리 팀 경기는 상단 <b>● 경기 중계</b>로 볼 수 있어요.'):'우리 팀은 가을야구에 나가지 못했어요. 다른 팀 경기도 <b>● 경기 중계</b>로 관전할 수 있어요.'}</p>`;
};
function postGame(i,k){ const se=postSeries(i); return se.games[k].full; }
function postIntro(){ const P=S.post, me=P.seeds.indexOf(S.user);
  modal(`<div style="text-align:center"><div style="font-size:15px" class="mute">${S.year} 정규시즌 종료</div><h2 style="font-size:28px;margin:8px 0">🍂 가을야구 개막</h2>
   <div class="row" style="justify-content:center;gap:10px;margin:12px 0">${P.seeds.map((id,i)=>`<div style="text-align:center">${crest(id,40)}<div style="font-size:12px">${i+1}위 ${short(id)}</div></div>`).join('')}</div>
   <p>${me>=0?`<b>${tname(S.user)}</b>이(가) ${me+1}위로 가을야구에 나갑니다! ${['한국시리즈에 직행했어요.','플레이오프에서 기다려요.','준플레이오프부터 시작해요.','와일드카드 결정전 1승을 안고 시작해요.','와일드카드 결정전에서 2승이 필요해요.'][me]}`:'우리 팀은 아쉽게 탈락했어요. 다른 팀의 가을야구를 지켜볼 수 있어요.'}</p></div>`); }
function postChampion(){ const c=S.post.champion;
  modal(`<div style="text-align:center">${crest(c,90)}<h2 style="font-size:30px;margin:10px 0">🏆 ${tname(c)}</h2><p>${S.year} 한국시리즈 우승${c===S.user?' — 감독님, 축하합니다!':''}</p><p class="mute">${S.post.log.join('<br>')}</p></div>`); }

// ---------- 메일: 이벤트 선택지 ----------
openMail = function(i){
  const m=S.inbox[i]; m.read=true; let act='';
  if(m.action){ const a=m.action;
    act = a.done ? `<p class="mute">처리됨: ${{accepted:a.yes||'수락',declined:a.no||'거절',expired:'만료'}[a.done]||a.done}</p>`
      : `<div class="row" style="margin-top:14px"><button class="pri" onclick="mailAccept(${i})">${a.yes||'수락'}</button><button onclick="mailDecline(${i})">${a.no||'거절'}</button></div>`; }
  modal(`<h2>${esc(m.title)}</h2><div class="mute">${esc(m.from)} · ${m.date}</div><hr style="border-color:var(--line)"><div class="body">${m.body}</div>${act}`); save();
};
function mailDecline(i){ const a=S.inbox[i].action; if(a?.type==='pev'){ const m=pevResolve(i,false); if(m) alert(m); closeModal(); } else { declineOffer(i); closeModal(); } }

// ---------- 선수 프로필: 성격 ----------
const _playerBase2 = PAGES.player;
PAGES.player = ()=>{ const p=P(curPlayer); let h=_playerBase2(); if(!p) return h; const k=persOf(p);
  return h + `<div class="panel" style="margin-top:12px"><h3>성격 · ${k}</h3><p style="margin:0">${PERS[k].d}</p></div>`; };

// ---------- 팝업 대신 화면 이동 ----------
let viewHtml='', pgDir='fwd', lastRenderedPage=null;
modal = function(html){ const prev=viewHtml; viewHtml=html; go('view'); if(histB.length) histB[histB.length-1].vh=prev; };
closeModal = function(){ if(page==='view') histBack(); else render(); };
closeModalQuiet = function(){};
PAGES.view = ()=>`<div class="row" style="margin-bottom:12px"><button onclick="histBack()">← 돌아가기</button></div><div class="viewpg">${viewHtml}</div>`;
const _restore = restore;
restore = function(s){ _restore(s); if(s.vh!=null) viewHtml=s.vh; };
const _histBack = histBack, _histFwd = histFwd;
histBack = function(){ const vh=viewHtml; pgDir='back'; _histBack(); if(histF.length) histF[histF.length-1].vh=vh; };
histFwd = function(){ const vh=viewHtml; pgDir='fwd'; _histFwd(); if(histB.length) histB[histB.length-1].vh=vh; };
const _goBase = go;
go = function(p, keep){ pgDir='fwd'; const vh=viewHtml; _goBase(p, keep); if(!keep && histB.length && histB[histB.length-1].vh==null) histB[histB.length-1].vh=vh; };

// 알림: 창 대신 화면 아래 토스트
window.alert = function(msg){
  let box=document.getElementById('toasts'); if(!box){ box=document.createElement('div'); box.id='toasts'; box.setAttribute('role','status'); box.setAttribute('aria-live','polite'); document.body.appendChild(box); }
  const el=document.createElement('div'); el.className='toast'; el.textContent=String(msg); box.appendChild(el);
  setTimeout(()=>el.classList.add('out'), 4200); setTimeout(()=>el.remove(), 4600);
};
// 확인: 창 대신 화면 위 확인 막대 (확인을 누르면 원래 버튼을 다시 실행)
let cfPass=false;
window.confirm = function(msg){
  if(cfPass){ cfPass=false; return true; }
  const ev=window.event, el=ev && ev.target && ev.target.closest ? ev.target.closest('button,a,input,select,[onclick]') : null;
  if(!el) return true;
  document.getElementById('cfbar')?.remove();
  const bar=document.createElement('div'); bar.id='cfbar'; bar.setAttribute('role','alertdialog');
  bar.innerHTML=`<div class="t"></div><div class="b"><button class="pri">확인</button><button>취소</button></div>`;
  bar.querySelector('.t').textContent=String(msg);
  const [ok,no]=bar.querySelectorAll('button');
  ok.onclick=()=>{ bar.remove(); cfPass=true; el.click(); cfPass=false; };
  no.onclick=()=>bar.remove();
  document.body.appendChild(bar); ok.focus();
  return false;
};
(function(){ const st=document.createElement('style'); st.textContent=`
#toasts{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:80;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;width:min(560px,calc(100% - 32px))}
.toast{background:#1d252e;border:1px solid #34404c;border-left:4px solid var(--acc);color:#e8edf2;padding:10px 14px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.45);font-size:14px;line-height:1.5;white-space:pre-line;animation:tIn .22s ease-out;transition:opacity .35s,transform .35s;width:100%}
.toast.out{opacity:0;transform:translateY(8px)}
@keyframes tIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
#cfbar{position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:85;width:min(620px,calc(100% - 32px));background:#1b222b;border:1px solid #3a4652;border-top:3px solid var(--acc);border-radius:12px;padding:14px 16px;box-shadow:0 14px 34px rgba(0,0,0,.55);animation:tIn .2s ease-out}
#cfbar .t{white-space:pre-line;line-height:1.55;margin-bottom:10px}#cfbar .b{display:flex;gap:8px;justify-content:flex-end}
.pg-fwd{animation:pgF .24s cubic-bezier(.2,.7,.2,1)}.pg-back{animation:pgB .24s cubic-bezier(.2,.7,.2,1)}
@keyframes pgF{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
@keyframes pgB{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pg-fwd,.pg-back,.toast,#cfbar{animation:none}}
.viewpg h2:first-child{margin-top:0}
tr[data-dnd]{cursor:grab;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}tr[data-dnd].dnd-src{opacity:.45}tr[data-dnd].dnd-over td{background:color-mix(in srgb,var(--acc) 28%,transparent)!important}
.dnd-ghost{position:fixed;z-index:90;pointer-events:none;background:var(--acc);color:#fff;font-weight:700;padding:6px 12px;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,.5);transform:translate(-50%,-120%);white-space:nowrap}
.dnd-col.dnd-over{outline:2px dashed var(--acc);outline-offset:4px}`; document.head.appendChild(st); })();

// ---------- 드래그로 교체 ----------
function tacticsDnd(){
  const u=S.teams[S.user], tabs=document.querySelectorAll('#content table.lu'); if(tabs.length<5) return;
  const act=act1(u), inLU=new Set(u.lineup.map(x=>x.pid));
  const bench=act.filter(p=>!p.isP).sort((a,b)=>batVal(b)-batVal(a)).filter(p=>!inLU.has(p.id));
  const pit=act.filter(p=>p.isP).sort((a,b)=>ovrOf(b)-ovrOf(a));
  const tag=(t,keys)=>[...t.querySelectorAll('tr')].forEach((tr,i)=>{ if(keys[i]!=null) tr.dataset.dnd=keys[i]; });
  tag(tabs[0], u.lineup.map((x,i)=>'lu:'+i)); tag(tabs[1], bench.map(p=>'bn:'+p.id));
  tag(tabs[2], u.rotation.map((x,i)=>'ps:r'+i)); tag(tabs[3], ['ps:c','ps:s0','ps:s1']); tag(tabs[4], pit.map(p=>'pp:'+p.id));
}
function dndDrop(a, b){
  const u=S.teams[S.user]; if(!a||!b||a===b) return;
  const [ta,va]=a.split(/:(.*)/), [tb,vb]=b.split(/:(.*)/);
  if(ta==='lu'&&tb==='lu'){ const i=+va,j=+vb; [u.lineup[i],u.lineup[j]]=[u.lineup[j],u.lineup[i]]; }   // 타순 바꾸기(수비 위치도 함께)
  else if((ta==='bn'&&tb==='lu')||(ta==='lu'&&tb==='bn')){ const i=+(ta==='lu'?va:vb), pid=ta==='bn'?va:vb; if(P(pid).inj) return alert('부상 중인 선수는 넣을 수 없어요.'); u.lineup[i].pid=pid; }
  else if(ta==='pp'&&tb==='ps'){ pSel=vb; assignP(va); return; }
  else if(ta==='ps'&&tb==='pp'){ pSel=va; assignP(vb); return; }
  else if(ta==='ps'&&tb==='ps'){ const get=k=>k[0]==='r'?u.rotation[+k.slice(1)]:k==='c'?u.closer:u.setup[+k.slice(1)]; const pid=get(vb); if(pid){ pSel=va; assignP(pid); return; } }
  else if(ta==='en'&&tb==='en'){ const [pid,from]=va.split(':'), to=vb.split(':')[1]; if(from!==to){ const e=entryMove(pid, to==='1'); if(e) alert(e); } }
  else return;
  luSel=null; pSel=null; save(); render();
}
(function(){
  let st=null;
  document.addEventListener('pointerdown', e=>{
    const tr=e.target.closest && e.target.closest('tr[data-dnd]'); if(!tr || e.button>0 || e.target.closest('button,select,input')) return;
    st={tr, x:e.clientX, y:e.clientY, on:false, over:null, touch:e.pointerType==='touch', armed:e.pointerType!=='touch'};
    if(st.touch){ const me=st; me.t=setTimeout(()=>{ if(st!==me) return; me.armed=true; me.tr.classList.add('dnd-src'); try{ navigator.vibrate?.(15); }catch(_){} }, 280); }   // 터치: 길게 눌러 끌기
  });
  // 끄는 중 화면 가장자리에 가면 자동 스크롤 (라인업 ↔ 벤치가 멀리 있어도 옮길 수 있게)
  let edgeY=0, edgeRAF=0; const edgeLoop=()=>{ if(!st||!st.on||!edgeY){ edgeRAF=0; return; } scrollBy(0, edgeY); edgeRAF=requestAnimationFrame(edgeLoop); };
  document.addEventListener('touchmove', e=>{ if(st && st.armed && st.touch) e.preventDefault(); }, {passive:false});
  document.addEventListener('pointermove', e=>{
    if(!st) return;
    if(!st.armed){ if(Math.hypot(e.clientX-st.x,e.clientY-st.y)>8){ clearTimeout(st.t); st=null; } return; }
    const H=innerHeight, z=70; edgeY = e.clientY<z ? -Math.ceil((z-e.clientY)/4) : e.clientY>H-z ? Math.ceil((e.clientY-(H-z))/4) : 0; if(edgeY && st.on && !edgeRAF) edgeRAF=requestAnimationFrame(edgeLoop);
    if(!st.on){ if(Math.hypot(e.clientX-st.x,e.clientY-st.y)<7) return; st.on=true; st.tr.classList.add('dnd-src');
      st.g=document.createElement('div'); st.g.className='dnd-ghost'; st.g.textContent=(st.tr.querySelector('b')?.textContent||'선수')+' 이동'; document.body.appendChild(st.g); }
    e.preventDefault(); st.g.style.left=e.clientX+'px'; st.g.style.top=e.clientY+'px';
    const el=document.elementFromPoint(e.clientX,e.clientY); let t=el&&el.closest('tr[data-dnd]');
    if(!t && el){ const col=el.closest('.dnd-col'); if(col) t=col; }
    if(st.over!==t){ st.over?.classList.remove('dnd-over'); st.over=t; t?.classList.add('dnd-over'); }
  });
  const end=e=>{ if(!st) return; const s=st; st=null; clearTimeout(s.t); edgeY=0; if(!s.on){ s.tr.classList.remove('dnd-src'); }
    if(s.on && e && e.clientX!=null){ const el=document.elementFromPoint(e.clientX,e.clientY); const t=el&&(el.closest('tr[data-dnd]')||el.closest('.dnd-col')); if(t){ s.over?.classList.remove('dnd-over'); s.over=t; } } s.tr.classList.remove('dnd-src'); s.g?.remove(); s.over?.classList.remove('dnd-over');
    if(s.on && s.over){ const a=s.tr.dataset.dnd, b=s.over.dataset.dnd; dndDrop(a,b);
      const block=ev=>{ ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click',block,{capture:true,once:true}); setTimeout(()=>document.removeEventListener('click',block,{capture:true}),50); } };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();
function entryDnd(){
  const u=S.teams[S.user], cols=document.querySelectorAll('#content .cl-2 > .panel'); if(cols.length<2) return;
  cols.forEach((c,i)=>{ c.classList.add('dnd-col'); c.dataset.dnd='en:x:'+(i===0?'1':'2'); });
  document.querySelectorAll('#content .cl-2 > .panel tr').forEach(tr=>{ const b=tr.querySelector('button[onclick*="entryMove"]'); if(!b) return; const m=b.getAttribute('onclick').match(/entryMove\('([^']+)',(true|false)\)/); if(m) tr.dataset.dnd=`en:${m[1]}:${m[2]==='true'?'2':'1'}`; });
}

// 렌더 후처리: 화면 전환 애니메이션 · 드래그 연결
const _renderC = render;
render = function(){ _renderC(); if(!S) { lastRenderedPage=null; return; }
  const c=document.getElementById('content');
  if(c && lastRenderedPage!==page+'|'+(page==='player'?curPlayer:'')+'|'+(page==='view'?viewHtml.length:'')){ c.classList.add(pgDir==='back'?'pg-back':'pg-fwd'); }
  lastRenderedPage=page+'|'+(page==='player'?curPlayer:'')+'|'+(page==='view'?viewHtml.length:'');
  if(page==='tactics') tacticsDnd(); if(page==='entry') entryDnd();
};

// ---------- 스카우트 보고서 ----------
function knowOf(p){
  if(p.team===S.user) return 100;
  if(p.prospect || p.draftedBy || p.am) return Math.round(p.dk||30);
  if(!p.team && p.lg) return Math.round(p.sk||50);
  const u=S.teams[S.user]; S.kn ||= {};
  if(S.kn[p.id]) return S.kn[p.id];
  return Math.round(clamp(45+u.staff['국내스카우트'].rating*2+(p.age>=27?8:0)+(p.foreign?-8:0),30,88));
}
function scoutFocus(pid){ const u=S.teams[S.user], p=S.players[pid];
  if(p.prospect) return draftWatch(pid); if(!p.team && p.lg) return followUp(pid);
  if(u.balance<0.1) return '잔고가 부족합니다.'; ledg(u,'scout',-0.1); S.kn ||= {}; S.kn[pid]=95; save(); return null; }
const nzOf = (p,k) => ((hash(p.id+k)%1000)/500-1);
function estAttr(p,k,K){ const v=p.a[k]+nzOf(p,k)*(100-K)/100*5, w=(100-K)/100*3; const lo=clamp(Math.round(v-w),1,20), hi=clamp(Math.round(v+w),1,20); return {lo,hi,mid:(lo+hi)/2}; }
const estCA = (p,K) => K>=95 ? CA(p) : Math.round(CA(p)+nzOf(p,'ca')*(100-K)/100*30);
const estPA = (p,K) => K>=95 ? p.PA : Math.round(Math.max(estCA(p,K), p.PA+nzOf(p,'pa')*(100-K)/100*36));
function hidRow(p,k,K){ const v=hv(p,k), known = K>=75 ? 2 : K>=50 ? 1 : 0, g=hidGood(k,v);
  const col = g>=15?'#3fb950':g>=11?'#9be08a':g>=7?'#d2c84a':'#f0605a';
  const word = known===0 ? '알 수 없음' : known===1 ? `${hidWord(k,v)}(추정)` : hidWord(k,v);
  return `<div style="margin:7px 0"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span>${HIDDEN[k].n}</span><b style="color:${known?col:'var(--mute)'}">${word}</b></div>
    <div class="cl-bar" style="margin-top:4px"><i style="width:${known?(v/20*100):0}%;background:${col}"></i></div><div class="cl-acc">${HIDDEN[k].d}</div></div>`; }
function projLine(p,K){
  const d=ovrOf(p)-12.5, j=(100-K)/100;
  if(p.isP){ const era_=clamp(4.3-d*0.5-(p.a.ctl-12)*0.05,1.6,7), k9=clamp(7+(p.a.stf-11)*0.35+d*0.25,4,12.5), ipf=p.pos==='SP'?clamp(110+p.a.sta*3.5,90,190):clamp(45+p.a.sta*1.2,40,80);
    const w=j*1.2; return `평균자책점 ${(era_-w).toFixed(2)}~${(era_+w).toFixed(2)} · 9이닝당 탈삼진 ${k9.toFixed(1)} · ${Math.round(ipf)}이닝 안팎`; }
  const av=clamp(0.262+d*0.013+(p.a.con-12)*0.004,0.2,0.36), hr=Math.max(0,(p.a.pow-7)*2.1+d*2.2), w=j*0.03;
  return `타율 ${(av-w).toFixed(3).replace(/^0/,'')}~${(av+w).toFixed(3).replace(/^0/,'')} · 홈런 ${Math.max(0,Math.round(hr-j*8))}~${Math.round(hr+j*8)}개 · 도루 ${Math.max(0,Math.round((p.a.stl-8)*2.5))}개 안팎`;
}
function roleFor(p, ca){
  const u=S.teams[S.user]; const same=act1(u).filter(q=>q.id!==p.id && q.isP===p.isP && (p.isP ? (q.pos==='SP')===(p.pos==='SP') : (q.pos===p.pos||fit(q,p.pos)>=0.95)));
  const best=same.map(CA).sort((a,b)=>b-a); const nth=p.isP&&p.pos==='SP'?4:p.isP?6:0;
  const bar=best[Math.min(nth,best.length-1)]??100, d=ca-bar;
  const grade = d>=25?['A+','#3fb950']:d>=12?['A','#3fb950']:d>=4?['B+','#9be08a']:d>=-4?['B','#d2c84a']:d>=-14?['C','#e3954b']:['D','#f0605a'];
  const role = p.isP ? (p.pos==='SP' ? (d>=4?'선발 로테이션 즉시 합류':d>=-10?'5선발 경쟁·롱릴리프':'퓨처스 선발 육성') : (d>=8?'필승조·마무리 후보':d>=-8?'불펜 추격조':'퓨처스 불펜'))
                 : (d>=4?`주전 ${POS_KO[p.pos]}`:d>=-8?`${POS_KO[p.pos]} 백업·대타 요원`:'퓨처스 육성');
  return {grade, role, bar};
}
function scoutText(p,K,ca,pa){
  const L=p.isP?P_ATTR:H_ATTR, W=caWeights(p), ks=Object.keys(L).filter(k=>!(k==='cat'&&p.pos!=='C')&&!(k==='bnt'));
  const est=k=>estAttr(p,k,K).mid, imp=ks.filter(k=>W[k]).sort((a,b)=>est(b)-est(a));
  const top=imp.slice(0,3), low=imp.slice(-2).reverse(), out=[];
  out.push(`${p.age}세 ${p.isP?(p.pos==='SP'?'선발 투수':'불펜 투수'):POS_KO[p.pos]}. ${top.map(k=>L[k]).join('·')}이(가) 강점이고, ${low.map(k=>L[k]).join('·')}은(는) 보완이 필요하다.`);
  if(p.isP) out.push(`직구 최고 ${kmh(p)}km 안팎, 주무기는 ${Object.entries(p.pitches).sort((a,b)=>b[1]-a[1])[0][0]}.`);
  const gap=pa-ca; out.push(gap>=30?'성장 여지가 매우 크다. 꾸준한 출전과 집중 훈련이 필요한 원석.':gap>=12?'아직 성장할 여지가 남아 있다.':p.age>=33?'기량이 정점을 지나 서서히 내려오는 시기.':'현재 기량이 거의 완성됐다.');
  if(K>=50){ const h=hidOf(p);
    if(h.pro>=15) out.push('훈련 태도와 자기관리가 모범적이다.'); else if(h.pro<=6) out.push('자기관리에 대한 평판은 좋지 않다.');
    if(h.inj>=15) out.push('잔부상이 잦아 관리가 필요하다.'); else if(h.inj<=5) out.push('튼튼한 몸이 장점이다.');
    if(h.imp>=15) out.push('큰 경기에서 더 강해지는 유형.'); else if(h.imp<=5) out.push('중요한 경기에서 위축되는 모습이 보인다.');
    if(p.foreign && h.adp<=6) out.push('새 환경 적응에 시간이 걸릴 수 있다.'); }
  else out.push('성향은 더 지켜봐야 알 수 있다.');
  return out.join(' ');
}
function refreshView(html){ viewHtml=html; render(); }
function scoutReport(pid, rep){
  const p=S.players[pid]; if(!p) return; const K=knowOf(p), u=S.teams[S.user], mine=p.team===S.user;
  const ca=estCA(p,K), pa=estPA(p,K), rf=roleFor(p,ca);
  const L=p.isP?P_ATTR:H_ATTR, grps=p.isP?P_GROUPS:H_GROUPS, W=caWeights(p);
  const at=k=>{ const e=estAttr(p,k,K), txt=K>=95?`${Math.round(p.a[k])}`:(e.lo===e.hi?`${e.lo}`:`${e.lo}~${e.hi}`), v=K>=95?p.a[k]:e.mid; return `<div class="row" style="justify-content:space-between;flex-wrap:nowrap;padding:3px 0;border-bottom:1px solid var(--line);${W[k]?'font-weight:600':''}"><span>${L[k]}</span><b style="color:${attrColor(v)}">${txt}</b></div>`; };
  const where = mine?'우리 팀':p.team?tname(p.team):(p.prospect||p.am)?`${p.school} (${p.schoolType}${p.am?' '+p.am.g+'학년':''})`:p.lg?`${OV_LEAGUES[p.lg].n} · ${p.nat}`:p.faFrom?`FA (전 ${short(p.faFrom)})`:'FA';
  const stats = (p.prospect||p.am) ? (p.isP?`아마추어: ${p.amStat.ip}이닝 ERA ${p.amStat.era} · 탈삼진 ${p.amStat.k} · 최고 ${p.amStat.top}km`:`아마추어: ${p.amStat.g}경기 타율 ${p.amStat.avg} · ${p.amStat.hr}홈런 · ${p.amStat.sb}도루`)
    : p.lg && p.ovStat ? (p.isP?`현지 리그: ${p.ovStat.ip}이닝 ${p.ovStat.w}승 ERA ${p.ovStat.era} · 9이닝당 ${p.ovStat.k9}K`:`현지 리그: ${p.ovStat.g}경기 타율 ${p.ovStat.avg} · ${p.ovStat.hr}홈런 · OPS ${p.ovStat.ops}`)
    : `${S.year} 시즌: ${seasonLine(p)}`;
  const value = p.prospect ? '신인 계약금 수준' : p.lg&&!p.team ? `요구 연봉 ${p.ask.sal}억${p.ask.fee?` · 이적료 ${p.ask.fee}억`:''}` : `연봉 ${p.salary}억 · 잔여 ${p.yrs??1}년 · 시장 가치 약 ${r1(marketValue(p))}억/년`;
  const sc = p.prospect?u.staff['국내스카우트']:p.lg?u.staff['해외스카우트']:mine?u.staff['수석']:u.staff['국내스카우트'];
  const actBtns = [
    !mine && K<95 ? `<button class="pri" onclick="act(()=>scoutFocus('${p.id}'));scoutReport('${p.id}',true)">${p.prospect?(S.dclass?.watch.includes(p.id)?'집중 관찰 중':'집중 관찰 지정'):p.lg&&!p.team?'추가 관찰 (0.2억)':'집중 스카우트 (0.1억)'}</button>`:'',
    p.team && !mine ? `<button onclick="tradeTeam='${p.team}';tradeGet=['${p.id}'];tradeGive=[];go('transfer')">트레이드 제안</button>`:'',
    p.lg && !p.team && !p.ovPool ? `<button onclick="ovOffer('${p.id}')">계약 제안</button>`:'',
    p.team ? `<button onclick="showPlayer('${p.id}')">선수 화면</button>`:''].join('');
  (rep&&page==='view'?refreshView:modal)(`<div class="row" style="flex-wrap:nowrap;gap:14px">${avatar(p,84)}<div style="min-width:0"><div class="cl-acc">스카우트 보고서 · ${sc.name} (${roleName(sc.role)}) · ${S.date}</div>
     <h2 style="margin:2px 0">${p.name}</h2><div class="mute">${where} · ${POS_KO[p.pos]} · ${handTxt(p)} · ${p.age}세</div></div></div>
   <div class="cl-tiles" style="margin-top:14px">
    ${tile('현재 능력',stV(ca),K>=95?'확실':K>=60?'대략':'불확실')}${tile('잠재력',stV(pa),p.age<=24?'성장 중':p.age>=33?'하락기':'전성기')}
    ${tile('우리 팀 기준 평가',`<span style="color:${rf.grade[1]}">${rf.grade[0]}</span>`,mine?'현재 우리 선수':rf.role)}
    ${tile('평가 정확도',`${K}%`,K>=95?'충분히 파악함':'관찰할수록 정확해져요',K)}</div>
   <div class="cl-2">
    <div class="panel"><h3>스카우트 의견</h3><p style="line-height:1.75;margin:0">${scoutText(p,K,ca,pa)}</p>
     <h3 style="margin-top:14px">예상 활약 (리그 풀타임 기준)</h3><p style="margin:0">${projLine(p,K)}</p>
     <h3 style="margin-top:14px">기록 · 계약</h3><p style="margin:0">${stats}<br><span class="mute">${value}</span></p>
     <h3 style="margin-top:14px">특성</h3>${K>=60||mine?traitChips(p,4):'<span class="mute">더 관찰이 필요해요</span>'}
     <div class="row" style="margin-top:14px">${actBtns}</div></div>
    <div class="panel"><h3>성향 · 히든 능력 <span class="cl-chip">${K>=50||mine?persOf(p):'성격 미확인'}</span></h3>
     ${Object.keys(HIDDEN).map(k=>hidRow(p,k,K)).join('')}
     <p class="cl-note">히든 능력은 숫자로 공개되지 않아요. 평가 정확도가 50% 이상이면 대략, 75% 이상이면 정확하게 보여요.</p></div></div>
   <div class="panel" style="margin-top:12px"><h3>세부 능력 ${K<95?'(추정 범위)':''}</h3><div class="cl-3">${Object.entries(grps).map(([g,o])=>`<div><div class="cl-acc" style="font-weight:700;margin-bottom:4px">${g}</div>${Object.keys(o).filter(k=>!(k==='cat'&&p.pos!=='C')).map(at).join('')}</div>`).join('')}
     <div><div class="cl-acc" style="font-weight:700;margin-bottom:4px">정신력</div>${Object.entries(M_ATTR).map(([k,l])=>{ const v=p.m[k]+nzOf(p,'m'+k)*(100-K)/100*4; return `<div class="row" style="justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--line)"><span>${l}</span><b style="color:${attrColor(v)}">${K>=95?Math.round(p.m[k]):`${Math.max(1,Math.round(v-(100-K)/100*3))}~${Math.min(20,Math.round(v+(100-K)/100*3))}`}</b></div>`; }).join('')}</div></div>
     <p class="cl-note">굵게 표시된 능력은 이 포지션에서 중요한 능력이에요.</p></div>`);
}
prospectModal = scoutReport; ovModal = scoutReport;

// 선수 프로필: 스카우트 보고서 버튼 · 성향 패널
const _playerBase3 = PAGES.player;
PAGES.player = ()=>{ const p=P(curPlayer); let h=_playerBase3(); if(!p) return h;
  const bar='';
  const K=knowOf(p);
  const hid=`<div class="panel" style="margin-top:12px"><h3>성향 · 히든 능력</h3><div class="cl-3">${Object.keys(HIDDEN).map(k=>hidRow(p,k,K)).join('')}</div></div>`;
  return bar+h+hid; };

// ---------- 선수 기록 탭 ----------
let plTab='ov', recType='h', recTeam='all', recQual=true, recSort='ops';
const f3 = v => isFinite(v) ? v.toFixed(3).replace(/^0/,'') : '-';
const nH = o => ({g:o.g??o.gp??0, pa:o.pa||0, ab:o.ab||0, h:o.h||0, d:o.d||0, t:o.t||0, hr:o.hr||0, rbi:o.rbi||0, r:o.r||0, sb:o.sb||0, cs:o.cs||0, bb:o.bb||0, k:o.k||0});
const nP = o => ({g:o.pg??o.g??o.gp??0, gs:o.gs||0, outs:o.outs||0, h:o.ph??o.h??0, er:o.er||0, bb:o.pbb??o.bb??0, k:o.pk??o.k??0, hr:o.phr??o.hr??0, w:o.w||0, l:o.l||0, sv:o.sv||0, hld:o.hld||0});
function hRates(o){ const avg=o.h/o.ab, obp=(o.h+o.bb)/o.pa, slg=(o.h+o.d+2*o.t+3*o.hr)/o.ab; return {avg, obp, slg, ops:obp+slg}; }
function warH(o,pos){ if(!o.pa) return 0; const {ops:x}=hRates(o); const adj={C:1.2,SS:0.75,'2B':0.3,CF:0.3,'3B':0.25,RF:-0.75,LF:-0.75,'1B':-1.2,DH:-1.7,IF:0.2,OF:-0.3}[pos]||0; return ((x||0)-0.73)*o.pa/22 + adj*o.g/144 + o.pa/600*2 + (o.sb-o.cs*2)*0.02; }
function warP(o,pos){ if(!o.outs) return 0; const ip_=o.outs/3; return (4.6-o.er*9/ip_)*ip_/81 + ip_/(pos==='SP'?75:110); }
function hCells(o,pos){ const r=hRates(o); return [o.g,o.pa,o.ab,o.h,o.d,o.t,o.hr,o.rbi,o.r,o.sb,o.bb,o.k,f3(r.avg),f3(r.obp),f3(r.slg),f3(r.ops),warH(o,pos).toFixed(1)]; }
function pCells(o,pos){ const ip_=o.outs/3; return [o.g,o.gs,o.w,o.l,o.sv,o.hld,ip(o.outs),o.h,o.hr,o.bb,o.k,o.outs?(o.er*27/o.outs).toFixed(2):'-',o.outs?((o.h+o.bb)/ip_).toFixed(2):'-',o.outs?(o.k*9/ip_).toFixed(1):'-',warP(o,pos).toFixed(1)]; }
const H_HEAD=['경기','타석','타수','안타','2루타','3루타','홈런','타점','득점','도루','볼넷','삼진','타율','출루율','장타율','OPS','WAR'];
const P_HEAD=['경기','선발','승','패','세','홀','이닝','피안타','피홈런','볼넷','탈삼진','ERA','WHIP','K/9','WAR'];
function sumObj(list, keys){ const o={}; for(const x of list) for(const k of keys) o[k]=(o[k]||0)+(x[k]||0); return o; }
function recTable(p, rows, lead){ // rows: [label cells..., obj]
  const head=p.isP?P_HEAD:H_HEAD, cells=o=>p.isP?pCells(nP(o),p.pos):hCells(nH(o),p.pos);
  return `<div class="cl-wrap"><table class="cl-tbl"><tr>${lead.map(h=>`<th>${h}</th>`).join('')}${head.map(h=>`<th class="n">${h}</th>`).join('')}</tr>
   ${rows.map(r=>`<tr class="${r.cls||''}">${r.lab.map(x=>`<td>${x}</td>`).join('')}${cells(r.o).map(v=>`<td class="n">${v}</td>`).join('')}</tr>`).join('')}</table></div>`;
}
function seasonRows(p){
  const cur = p.isP ? p.st.pg>0 : p.st.pa>0;
  const rows=(p.car||[]).filter(c=>p.isP?c.st.pg>0:c.st.pa>0).map(c=>({lab:[c.y, c.t?`${crest(c.t,16)} ${short(c.t)}`:'-', c.age], o:c.st}));
  if(cur && !(p.car||[]).some(c=>c.y===S.year)) for(const x of curSplits(p)) rows.push({lab:[`${S.year}${S.phase==='regular'?' (진행 중)':''}`, x.t?`${crest(x.t,16)} ${short(x.t)}`:'-', p.age], o:x.st, cls:'me'});
  if(rows.length>1){ const keys=p.isP?['pg','gs','outs','ph','er','pbb','pk','phr','w','l','sv','hld']:['g',...BAT_K]; rows.push({lab:['<b>통산</b>','',''], o:sumObj(rows.map(r=>r.o),keys)}); }
  return rows;
}
function careerPanel(p){
  const rows=seasonRows(p);
  return `<div class="panel" style="margin:12px 0"><div class="row" style="justify-content:space-between"><h3 style="margin:0">시즌별 기록</h3><button onclick="plTab='rec';render()">기록 자세히 →</button></div>
   ${rows.length?recTable(p,rows,['시즌','팀','나이']):`<p class="mute" style="margin:8px 0 0">아직 1군 기록이 없어요.${p.fst&&(p.fst.ab||p.fst.outs)?' 퓨처스 기록은 기록 탭에서 볼 수 있어요.':''}</p>`}</div>`;
}
function leagueRanks(p){
  const all=Object.values(S.players).filter(q=>q.team), g=Math.max(1,...Object.values(S.teams).map(t=>t.w+t.l+t.t));
  const rank=(list,f,asc)=>{ const s=list.slice().sort((a,b)=>asc?f(a)-f(b):f(b)-f(a)); const i=s.indexOf(p); return i>=0&&i<10?i+1:null; };
  const out=[];
  if(p.isP){ const qp=all.filter(q=>q.st.outs>=g*3); [['평균자책점',qp,q=>q.st.er*27/q.st.outs,true],['다승',all,q=>q.st.w],['탈삼진',all,q=>q.st.pk],['세이브',all,q=>q.st.sv],['홀드',all,q=>q.st.hld]].forEach(([n,l,f,a])=>{ const r=rank(l,f,a); if(r) out.push(`${n} ${r}위`); }); }
  else { const qb=all.filter(q=>q.st.pa>=g*3.1); [['타율',qb,q=>q.st.h/q.st.ab],['홈런',all,q=>q.st.hr],['타점',all,q=>q.st.rbi],['안타',all,q=>q.st.h],['도루',all,q=>q.st.sb],['OPS',qb,q=>hRates(nH(q.st)).ops]].forEach(([n,l,f])=>{ const r=rank(l,f); if(r) out.push(`${n} ${r}위`); }); }
  return out;
}
function recordsHtml(p){
  const rows=seasonRows(p), ranks=leagueRanks(p), sp=p.spl;
  const futs=[...(p.car||[]).filter(c=>c.fst).map(c=>({y:c.y,f:c.fst})), ...(p.fst&&(p.fst.ab||p.fst.outs)&&!(p.car||[]).some(c=>c.y===S.year&&c.fst)?[{y:S.year,f:p.fst}]:[])];
  const futTbl = futs.length ? `<table class="cl-tbl"><tr><th>시즌</th>${p.isP?'<th class="n">경기</th><th class="n">이닝</th><th class="n">탈삼진</th><th class="n">ERA</th>':'<th class="n">경기</th><th class="n">타수</th><th class="n">안타</th><th class="n">홈런</th><th class="n">타율</th>'}</tr>
    ${futs.map(({y,f})=>`<tr><td>${y}</td>${p.isP?`<td class="n">${f.g}</td><td class="n">${ip(f.outs)}</td><td class="n">${f.k}</td><td class="n">${f.outs?(f.er*27/f.outs).toFixed(2):'-'}</td>`:`<td class="n">${f.g}</td><td class="n">${f.ab}</td><td class="n">${f.h}</td><td class="n">${f.hr}</td><td class="n">${f3(f.h/f.ab)}</td>`}</tr>`).join('')}</table>` : '<p class="mute" style="margin:0">퓨처스 기록이 없어요.</p>';
  const postRows=[...(p.car||[]).filter(c=>c.pst).map(c=>({lab:[c.y],o:c.pst})), ...(p.pst&&!(p.car||[]).some(c=>c.y===S.year&&c.pst)?[{lab:[S.year],o:p.pst}]:[])];
  const splitRows = sp ? [{lab:['홈'],o:sp.home},{lab:['원정'],o:sp.away},...Object.keys(sp.m).sort().map(m=>({lab:[`${+m}월`],o:sp.m[m]}))].filter(r=>r.o&&r.o.gp) : [];
  const gl=(p.gl||[]).map(x=>`<tr><td>${(x.dt||'').slice(5).replace('-','/')}</td><td>${x.hm?'vs':'@'} ${crest(x.o,16)} ${short(x.o)}</td><td><b class="${x.r==='W'?'good':x.r==='L'?'bad':'warn'}">${{W:'승',L:'패',T:'무'}[x.r]}</b> ${x.s}</td>
     ${p.isP?`<td class="n">${ip(x.outs)}</td><td class="n">${x.h}</td><td class="n">${x.er}</td><td class="n">${x.bb}</td><td class="n">${x.k}</td><td class="n">${x.pc}</td><td>${x.w?'<span class="cl-chip g">승</span>':x.l?'<span class="cl-chip r">패</span>':x.sv?'<span class="cl-chip g">세</span>':x.hld?'<span class="cl-chip">홀</span>':''}</td>`
            :`<td class="n">${x.ab}</td><td class="n">${x.h}</td><td class="n">${x.hr}</td><td class="n">${x.rbi}</td><td class="n">${x.bb}</td><td class="n">${x.k}</td><td class="n">${x.sb}</td>`}</tr>`).join('');
  return `<div class="row" style="flex-wrap:nowrap;gap:12px;margin-bottom:12px">${avatar(p,56)}<div><h2 style="margin:0">${p.name}</h2><div class="mute">${p.team?tname(p.team):'FA'} · ${POS_KO[p.pos]} · ${handTxt(p)} · ${p.age}세</div>
     ${ranks.length?`<div style="margin-top:4px">${ranks.map(r=>`<span class="cl-chip y">${S.year} ${r}</span>`).join('')}</div>`:''}</div></div>
   <div class="panel"><h3>시즌별 기록</h3>${rows.length?recTable(p,rows,['시즌','팀','나이']):'<p class="mute" style="margin:0">아직 1군 기록이 없어요.</p>'}
    <p class="cl-note">기록은 ${2026}년 게임 시작부터 쌓여요 (그 이전 기록은 없어요). WAR은 게임 안 추정치예요.</p></div>
   <div class="cl-2" style="margin-top:12px">
    <div class="panel"><h3>${S.year} 홈 · 원정 · 월별</h3>${splitRows.length?recTable(p,splitRows,['구분']):'<p class="mute" style="margin:0">이번 시즌 기록이 없어요.</p>'}</div>
    <div class="panel"><h3>최근 10경기</h3>${gl?`<div class="cl-wrap"><table class="cl-tbl"><tr><th>날짜</th><th>상대</th><th>결과</th>${p.isP?'<th class="n">이닝</th><th class="n">피안타</th><th class="n">자책</th><th class="n">볼넷</th><th class="n">삼진</th><th class="n">투구수</th><th></th>':'<th class="n">타수</th><th class="n">안타</th><th class="n">홈런</th><th class="n">타점</th><th class="n">볼넷</th><th class="n">삼진</th><th class="n">도루</th>'}</tr>${gl}</table></div>`:'<p class="mute" style="margin:0">최근 출전 기록이 없어요.</p>'}</div></div>
   <div class="cl-2" style="margin-top:12px">
    <div class="panel"><h3>가을야구 기록</h3>${postRows.length?recTable(p,postRows,['시즌']):'<p class="mute" style="margin:0">가을야구 출전 기록이 없어요.</p>'}</div>
    <div class="panel"><h3>퓨처스 기록</h3><div class="cl-wrap">${futTbl}</div></div></div>`;
}
const _playerBase4 = PAGES.player;
PAGES.player = ()=>{ const p=P(curPlayer); if(!p) return _playerBase4();
  const tabs=`<div class="cl-ptabs" role="tablist"><button role="tab" aria-selected="${plTab!=='rec'}" class="${plTab!=='rec'?'on':''}" onclick="plTab='ov';render()">개요</button><button role="tab" aria-selected="${plTab==='rec'}" class="${plTab==='rec'?'on':''}" onclick="plTab='rec';render()">기록</button><button onclick="scoutReport('${p.id}')">스카우트 보고서</button></div>`;
  if(plTab==='rec') return tabs+recordsHtml(p);
  const h=_playerBase4(); const i=h.indexOf('<div class="panel pbody"');
  return tabs + (i>=0 ? h.slice(0,i)+careerPanel(p)+h.slice(i) : h+careerPanel(p));
};
const _showPlayerBase = showPlayer;
showPlayer = function(id){ if(page!=='player' || curPlayer!==id) plTab = (page==='stats') ? 'rec' : plTab==='rec' && page==='player' ? 'rec' : 'ov'; _showPlayerBase(id); };

// ---------- 기록 메뉴: 전체 선수 기록 표 ----------
const _statsBase = PAGES.stats;
PAGES.stats = ()=>{
  const btn=`<button class="${statTab==='all'?'pri':''}" onclick="statTab='all';render()">선수 기록</button>`;
  if(statTab!=='all') return _statsBase().replace('>우리 팀</button>', '>우리 팀</button>'+btn);
  const g=Math.max(1,...Object.values(S.teams).map(t=>t.w+t.l+t.t));
  let ps=Object.values(S.players).filter(p=>p.team && (recType==='p'?p.isP:!p.isP) && (recTeam==='all'||p.team===recTeam));
  ps = recQual ? ps.filter(p=>recType==='p'?p.st.outs>=g*3:p.st.pa>=g*3.1) : ps.filter(p=>recType==='p'?p.st.pg>0:p.st.pa>0);
  const H=p=>nH(p.st), Pp=p=>nP(p.st);
  const KEYS = recType==='p'
    ? {era:[p=>Pp(p).outs?Pp(p).er*27/Pp(p).outs:99,true], w:[p=>p.st.w], l:[p=>p.st.l], sv:[p=>p.st.sv], hld:[p=>p.st.hld], ip:[p=>p.st.outs], k:[p=>p.st.pk], whip:[p=>p.st.outs?(p.st.ph+p.st.pbb)*3/p.st.outs:99,true], war:[p=>warP(Pp(p),p.pos)]}
    : {avg:[p=>H(p).h/H(p).ab||0], hr:[p=>p.st.hr], rbi:[p=>p.st.rbi], h:[p=>p.st.h], r:[p=>p.st.r], sb:[p=>p.st.sb], bb:[p=>p.st.bb], ops:[p=>hRates(H(p)).ops||0], obp:[p=>hRates(H(p)).obp||0], war:[p=>warH(H(p),p.pos)]};
  if(!KEYS[recSort]) recSort = recType==='p'?'era':'ops';
  const [f,asc]=KEYS[recSort]; ps.sort((a,b)=>asc?f(a)-f(b):f(b)-f(a)); ps=ps.slice(0,150);
  const th=(k,l)=>KEYS[k]?`<th class="n" style="cursor:pointer;${recSort===k?'color:var(--text)':''}" onclick="recSort='${k}';render()">${l}${recSort===k?(KEYS[k][1]?' ▲':' ▼'):''}</th>`:`<th class="n">${l}</th>`;
  const name=p=>`<a href="#" onclick="plTab='rec';_showPlayerBase('${p.id}');return false"><b>${p.name}</b></a>`;
  const rowsH=ps.map((p,i)=>{ const o=H(p), r=hRates(o); return `<tr class="${p.team===S.user?'me':''}"><td>${i+1}</td><td>${name(p)}</td><td>${crest(p.team,16)} ${short(p.team)}</td><td>${POS_KO[p.pos]}</td><td class="n">${o.g}</td><td class="n">${o.pa}</td><td class="n">${f3(r.avg)}</td><td class="n">${o.h}</td><td class="n">${o.d}</td><td class="n">${o.hr}</td><td class="n">${o.rbi}</td><td class="n">${o.r}</td><td class="n">${o.sb}</td><td class="n">${o.bb}</td><td class="n">${o.k}</td><td class="n">${f3(r.obp)}</td><td class="n">${f3(r.slg)}</td><td class="n"><b>${f3(r.ops)}</b></td><td class="n">${warH(o,p.pos).toFixed(1)}</td></tr>`; }).join('');
  const rowsP=ps.map((p,i)=>{ const o=Pp(p); return `<tr class="${p.team===S.user?'me':''}"><td>${i+1}</td><td>${name(p)}</td><td>${crest(p.team,16)} ${short(p.team)}</td><td>${POS_KO[p.pos]}</td><td class="n">${o.g}</td><td class="n">${o.gs}</td><td class="n"><b>${o.outs?(o.er*27/o.outs).toFixed(2):'-'}</b></td><td class="n">${o.w}</td><td class="n">${o.l}</td><td class="n">${o.sv}</td><td class="n">${o.hld}</td><td class="n">${ip(o.outs)}</td><td class="n">${o.h}</td><td class="n">${o.hr}</td><td class="n">${o.bb}</td><td class="n">${o.k}</td><td class="n">${o.outs?((o.h+o.bb)*3/o.outs).toFixed(2):'-'}</td><td class="n">${warP(o,p.pos).toFixed(1)}</td></tr>`; }).join('');
  const head = recType==='p'
    ? `<th>#</th><th>선수</th><th>팀</th><th>보직</th><th class="n">경기</th><th class="n">선발</th>${th('era','ERA')}${th('w','승')}${th('l','패')}${th('sv','세')}${th('hld','홀')}${th('ip','이닝')}<th class="n">피안타</th><th class="n">피홈런</th><th class="n">볼넷</th>${th('k','탈삼진')}${th('whip','WHIP')}${th('war','WAR')}`
    : `<th>#</th><th>선수</th><th>팀</th><th>포지션</th><th class="n">경기</th><th class="n">타석</th>${th('avg','타율')}${th('h','안타')}<th class="n">2루타</th>${th('hr','홈런')}${th('rbi','타점')}${th('r','득점')}${th('sb','도루')}${th('bb','볼넷')}<th class="n">삼진</th>${th('obp','출루율')}<th class="n">장타율</th>${th('ops','OPS')}${th('war','WAR')}`;
  return `<h2>개인 기록</h2><div class="row" style="margin-bottom:10px"><button onclick="statTab='bat';render()">타격</button><button onclick="statTab='pit';render()">투구</button><button onclick="statTab='team';render()">우리 팀</button>${btn}</div>
   <div class="row" style="margin-bottom:10px">${[['h','타자'],['p','투수']].map(([k,l])=>`<button class="${recType===k?'pri':''}" onclick="recType='${k}';recSort='${k==='p'?'era':'ops'}';render()">${l}</button>`).join('')}
    <select aria-label="구단" onchange="recTeam=this.value;render()"><option value="all">전체 구단</option>${TEAM_DATA.map(t=>`<option value="${t.id}" ${recTeam===t.id?'selected':''}>${t.name}</option>`).join('')}</select>
    <label class="row" style="gap:6px"><input type="checkbox" ${recQual?'checked':''} onchange="recQual=this.checked;render()"> ${recType==='p'?'규정이닝':'규정타석'}만</label>
    <span class="mute" style="font-size:12px">열 제목을 누르면 정렬돼요 · 이름을 누르면 선수 기록으로 이동</span></div>
   <div class="panel"><div class="cl-wrap"><table class="cl-tbl"><tr>${head}</tr>${(recType==='p'?rowsP:rowsH)||'<tr><td class="mute" colspan="19">기록이 없어요</td></tr>'}</table></div></div>`;
};
(function(){ const st=document.createElement('style'); st.textContent=`.cl-ptabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}.cl-ptabs button{border-radius:20px;padding:6px 16px}.cl-ptabs button.on{background:var(--acc);color:#fff;border-color:var(--acc);font-weight:700}`; document.head.appendChild(st); })();

// ---------- 선수 역사 탭 ----------
const MV_CHIP = {'신인 드래프트':'g','FA 이적':'y','FA 재계약':'g','트레이드':'y','외국인 영입':'g','방출':'r','은퇴':'r','FA 자격 취득':'','육성선수 등록':'','소속 변경':'y','입단':'g'};
function historyHtml(p){
  const mv=(p.mv&&p.mv.length)?p.mv:[{dt:'',y:S.year,type:'현 소속',from:null,to:p.team,note:''}];
  // 시즌별 소속 (기록 + 이동 기록으로 구성)
  const seasons=[...(p.car||[]).map(c=>({y:c.y,t:c.t,st:c.st})), ...((p.isP?p.st.pg:p.st.pa)>0&&!(p.car||[]).some(c=>c.y===S.year)?curSplits(p).map(x=>({y:S.year,t:x.t,st:x.st,cur:true})):[])];
  const stints=[];
  for(const m of (p.mv||[]).filter(m=>m.to)){ const last=stints[stints.length-1]; if(last && last.t===m.to) continue; stints.push({t:m.to, from:m.y, to:m.y, rows:[], used:new Set()}); }
  for(const x of seasons){ // 시즌 기록을 해당 팀 경력에 붙이기 (시간 순)
    let st=stints.find(s=>s.t===x.t && s.from<=x.y && !s.used.has(x.y) && (s.rows.length===0 || s.to>=x.y-1));
    if(!st){ st={t:x.t, from:x.y, to:x.y, rows:[], used:new Set()}; stints.push(st); }
    st.rows.push(x); st.used.add(x.y); st.to=Math.max(st.to,x.y); }
  if(!stints.length && p.team) stints.push({t:p.team, from:S.year, to:S.year, rows:[]});
  const keys=p.isP?['pg','gs','outs','ph','er','pbb','pk','phr','w','l','sv','hld']:['g',...BAT_K];
  const teamRows=stints.filter(s=>s.rows.length).map(s=>({lab:[s.t?`${crest(s.t,18)} ${tname(s.t)}`:'-', s.from===s.to?`${s.from}`:`${s.from}~${s.to}`], o:sumObj(s.rows.map(r=>r.st),keys)}));
  const tl = stints.map(s=>`<div class="cl-stint" style="--c:${s.t?TD(s.t).color:'#4b5866'}">${s.t?crest(s.t,34):''}<div><b>${s.t?tname(s.t):'무소속'}</b><div class="cl-acc">${s.from===s.to?s.from:`${s.from}~${s.to}`}${s.rows.length?` · ${s.rows.length}시즌`:' · 경기 기록 없음'}${s===stints[stints.length-1]&&s.t===p.team?' · 현재':''}</div></div></div>`).join('<div class="cl-arrow">→</div>');
  const ev = mv.slice().reverse().map(m=>`<tr><td class="mute" style="white-space:nowrap">${m.dt?m.dt.replace(/-/g,'.'):m.y}</td><td><span class="cl-chip ${MV_CHIP[m.type]||''}">${m.type}</span></td>
     <td style="white-space:nowrap">${m.from?`${crest(m.from,16)} ${short(m.from)}`:''}${m.from&&m.to?' → ':''}${m.to?`${crest(m.to,16)} ${short(m.to)}`:(m.type==='방출'||m.type==='은퇴'||m.type==='FA 자격 취득'?' → 무소속':'')}</td><td class="mute" style="font-size:12px">${m.note||''}</td></tr>`).join('');
  const origin = p.school ? `${p.school} (${p.schoolType})` : p.lg ? `${OV_LEAGUES[p.lg]?.n||''} · ${p.nat||''}` : p.nat ? `${p.nat}` : '';
  return `<div class="row" style="flex-wrap:nowrap;gap:12px;margin-bottom:12px">${avatar(p,56)}<div><h2 style="margin:0">${p.name}</h2><div class="mute">${p.team?tname(p.team):'무소속'} · ${POS_KO[p.pos]} · ${p.age}세${origin?` · 출신: ${origin}`:''}</div></div></div>
   <div class="panel"><h3>소속 팀 경력</h3><div class="cl-tl">${tl||'<span class="mute">기록 없음</span>'}</div></div>
   <div class="panel" style="margin-top:12px"><h3>팀별 통산 기록</h3>${teamRows.length?recTable(p,teamRows,['팀','기간']):'<p class="mute" style="margin:0">아직 1군 기록이 없어요.</p>'}</div>
   <div class="panel" style="margin-top:12px"><h3>이적 · 계약 기록</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>날짜</th><th>구분</th><th>이동</th><th>내용</th></tr>${ev}</table></div>
    <p class="cl-note">2026 게임 시작 이후의 이동만 기록돼요. </p></div>`;
}
const _playerBase5 = PAGES.player;
PAGES.player = ()=>{ const p=P(curPlayer); if(!p) return _playerBase5();
  if(plTab==='hist'){ const t=`<div class="cl-ptabs" role="tablist"><button role="tab" onclick="plTab='ov';render()">개요</button><button role="tab" onclick="plTab='rec';render()">기록</button><button role="tab" aria-selected="true" class="on">역사</button><button onclick="scoutReport('${p.id}')">스카우트 보고서</button></div>`; return t+historyHtml(p); }
  return _playerBase5().replace(`<button onclick="scoutReport('${p.id}')">스카우트 보고서</button></div>`, `<button role="tab" onclick="plTab='hist';render()">역사</button><button onclick="scoutReport('${p.id}')">스카우트 보고서</button></div>`);
};
(function(){ const st=document.createElement('style'); st.textContent=`.cl-tl{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.cl-stint{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:#1b222b;border-left:4px solid var(--c)}.cl-arrow{color:var(--mute);font-size:18px}`; document.head.appendChild(st); })();

// ---------- FM식 능력치 변화 표시 (시즌 개막 대비) ----------
function dArrow(d){ if(Math.abs(d)<0.25) return ''; const up=d>0; return `<span class="dl ${up?'up':'dn'}" title="시즌 개막 대비 ${up?'+':''}${d.toFixed(1)}">${up?'▲':'▼'}${up?'+':''}${Math.abs(d)>=0.95?Math.round(d):d.toFixed(1)}</span>`; }
const _attrCol = attrCol;
attrCol = function(title, rows, keys){
  const p = page==='player' ? P(curPlayer) : null; if(!p) return _attrCol(title, rows, keys);
  if(!p.aS) snapAttrs(p);
  return `<div><div class="ah">${title}</div>${rows.map(([k,l,v,x])=>`<div class="at ${keys.has(k)?'key':''}"><span>${l}${x?` <span class="mute" style="font-size:12px">${x}</span>`:''}</span><span class="row" style="gap:6px;flex-wrap:nowrap">${dArrow(attrDelta(p,k))}<b style="color:${attrColor(v)}">${Math.round(v)}</b></span></div>`).join('')}</div>`;
};
function caDelta(p){ if(!p.aS) return 0; return CA(p)-p.aS.ca; }
function caArrow(p){ const d=caDelta(p); if(Math.abs(d)<1) return ''; return `<span class="dl ${d>0?'up':'dn'}" title="시즌 개막 대비 현재 능력 ${d>0?'+':''}${d}">${d>0?'▲':'▼'}${Math.abs(d)}</span>`; }
const _playerBase6 = PAGES.player;
PAGES.player = ()=>{ const p=P(curPlayer); let h=_playerBase6(); if(!p||plTab!=='ov') return h; if(!p.aS) snapAttrs(p);
  const d=caDelta(p), gw=growthWord(p);
  const note = `<div class="cl-note" style="margin:0 0 8px">${d?`시즌 개막 대비 현재 능력 ${caArrow(p)} (200점 기준)`:'시즌 개막 이후 능력 변화 없음'}${gw?` · 성장 환경: <b>${gw}</b>${p.age<=25?' — 어릴수록 꾸준히 뛰면 더 빨리 자라요':''}`:''}</div>`;
  const i=h.indexOf('<div class="panel pbody"'); return i>=0 ? h.slice(0,i)+note+h.slice(i) : note+h; };
(function(){ const st=document.createElement('style'); st.textContent=`.dl{font-size:11px;font-weight:800;padding:0 5px;border-radius:6px;white-space:nowrap}.dl.up{color:#3fb950;background:rgba(63,185,80,.12)}.dl.dn{color:#f0605a;background:rgba(240,96,90,.12)}`; document.head.appendChild(st); })();

// ---------- 시범경기 화면 ----------
(function(){ const m=MENUS.find(x=>x.k==='portal'); if(m && !m.items.some(x=>x[0]==='exhib')){ const i=m.items.findIndex(x=>x[0]==='schedule'); m.items.splice(i+1,0,['exhib','시범경기']); PAGE_GROUP.exhib='portal'; PAGE_LABEL.exhib='시범경기'; } })();
function exStatTable(list, isP){
  const xs=p=>p.xst;
  if(isP) return `<table class="cl-tbl"><tr><th>선수</th><th class="n">경기</th><th class="n">이닝</th><th class="n">ERA</th><th class="n">탈삼진</th><th class="n">볼넷</th></tr>${list.map(p=>`<tr class="${p.team===S.user?'me':''}"><td>${pn(p,24,`${short(p.team)} · ${p.age}세${p.farm?' · 퓨처스':''}`)}</td><td class="n">${xs(p).pg}</td><td class="n">${ip(xs(p).outs)}</td><td class="n"><b>${(xs(p).er*27/xs(p).outs).toFixed(2)}</b></td><td class="n">${xs(p).pk}</td><td class="n">${xs(p).pbb}</td></tr>`).join('')}</table>`;
  return `<table class="cl-tbl"><tr><th>선수</th><th class="n">경기</th><th class="n">타수</th><th class="n">타율</th><th class="n">홈런</th><th class="n">타점</th><th class="n">OPS</th></tr>${list.map(p=>{ const o=nH(xs(p)), r=hRates(o); return `<tr class="${p.team===S.user?'me':''}"><td>${pn(p,24,`${short(p.team)} · ${p.age}세${p.farm?' · 퓨처스':''}`)}</td><td class="n">${o.g}</td><td class="n">${o.ab}</td><td class="n"><b>${f3(r.avg)}</b></td><td class="n">${o.hr}</td><td class="n">${o.rbi}</td><td class="n">${f3(r.ops)}</td></tr>`; }).join('')}</table>`;
}
function exhibPage(){
  const ex = S.phase==='off' ? S.off?.exhib : S.lastExhib;
  if(!ex || !ex.days) return `<div class="panel"><p class="mute" style="margin:0">시범경기는 3월 8일 무렵 스프링캠프가 끝난 뒤 열려요 (팀당 10경기). ${S.lastExhib?'':'아직 치른 시범경기가 없어요.'}</p></div>${S.lastExhib&&!S.lastExhib.days?exhibHtml(S.lastExhib):''}`;
  const u=S.teams[S.user], live=S.phase==='off' && !ex.done, day=ex.days[ex.idx];
  const st=Object.entries(ex.rec).map(([id,[w,l,t]])=>({id,w,l,t})).sort((a,b)=>(b.w/(b.w+b.l||1))-(a.w/(a.w+a.l||1))||b.w-a.w);
  const mine=ex.games.filter(g=>g.h===S.user||g.a===S.user);
  const all=Object.values(S.players).filter(p=>p.team && p.xst);
  const hit=all.filter(p=>!p.isP && p.xst.pa>=15).sort((a,b)=>hRates(nH(b.xst)).ops-hRates(nH(a.xst)).ops).slice(0,8);
  const pit=all.filter(p=>p.isP && p.xst.outs>=12).sort((a,b)=>a.xst.er/a.xst.outs-b.xst.er/b.xst.outs).slice(0,8);
  const ours=all.filter(p=>p.team===S.user && p.age<=25 && (p.xst.pa>=8||p.xst.outs>=9)).sort((a,b)=>(b.isP?-b.xst.er/(b.xst.outs||1)*27+5:hRates(nH(b.xst)).ops*6)-(a.isP?-a.xst.er/(a.xst.outs||1)*27+5:hRates(nH(a.xst)).ops*6)).slice(0,6);
  const today = live && day ? `<div class="panel" style="margin-bottom:12px"><h3>오늘의 시범경기 · ${day.d.replace(/-/g,'.')} (${ex.idx+1}/${ex.days.length}일차)</h3><div class="row">${day.games.map(([h,a])=>`<span class="cl-chip ${h===S.user||a===S.user?'y':''}">${short(a)} @ ${short(h)}</span>`).join('')}</div></div>` : '';
  return `${today}
   ${S.phase==='off'?`<div class="panel" style="margin-bottom:12px"><h3>우리 팀 시범경기 운영</h3><div class="cl-opt">${Object.entries(EX_MODES).map(([k,m])=>`<button class="${u.exMode===k?'pri':''}" ${ex.done?'disabled':''} onclick="S.teams[S.user].exMode='${k}';save();render()"><b>${k}</b><span>${m.d}</span></button>`).join('')}</div>
     <p class="cl-note">시범경기에는 퓨처스 선수도 나갈 수 있어요. 선발은 60구 안팎만 던지고 불펜이 1이닝씩 이어 던져요. 결과는 정규시즌 순위에 들어가지 않고, 젊은 선수는 출전 경험으로 조금씩 성장해요.</p></div>`:''}
   <div class="cl-2"><div class="panel"><h3>시범경기 순위</h3><table class="cl-tbl"><tr><th>#</th><th>팀</th><th class="n">승</th><th class="n">패</th><th class="n">무</th></tr>${st.map((t,i)=>`<tr class="${t.id===S.user?'me':''}"><td>${i+1}</td><td>${crest(t.id,18)} ${tname(t.id)}</td><td class="n">${t.w}</td><td class="n">${t.l}</td><td class="n">${t.t}</td></tr>`).join('')||'<tr><td class="mute" colspan="5">아직 경기가 없어요</td></tr>'}</table></div>
    <div class="panel"><h3>우리 경기</h3><table class="cl-tbl">${mine.slice().reverse().map(g=>{const me=g.h===S.user?1:0, my=g.s[me], op=g.s[1-me]; const i=ex.games.indexOf(g); return `<tr><td class="mute">${g.d.slice(5).replace('-','/')}</td><td>${my>op?'<b class="good">승</b>':my<op?'<b class="bad">패</b>':'<b class="warn">무</b>'}</td><td>${me?'vs':'@'} ${crest(me?g.a:g.h,16)} ${short(me?g.a:g.h)}</td><td class="n"><b>${my} : ${op}</b></td><td>${g.full?`<a href="#" onclick="showGame(${S.phase==='off'?'S.off.exhib':'S.lastExhib'}.games[${i}].full);return false">박스스코어</a>`:''}</td></tr>`;}).join('')||'<tr><td class="mute">아직 경기가 없어요</td></tr>'}</table></div></div>
   <div class="panel" style="margin-top:12px"><h3>눈에 띈 우리 유망주 (25세 이하)</h3>${ours.length?`<div class="cl-wrap">${exStatTable(ours.filter(p=>!p.isP),false)}${exStatTable(ours.filter(p=>p.isP),true)}</div>`:'<p class="mute" style="margin:0">아직 기록이 쌓이지 않았어요.</p>'}</div>
   <div class="cl-2" style="margin-top:12px"><div class="panel"><h3>타격 상위 (15타석 이상, OPS)</h3><div class="cl-wrap">${hit.length?exStatTable(hit,false):'<p class="mute" style="margin:0">기록 부족</p>'}</div></div>
    <div class="panel"><h3>투수 상위 (4이닝 이상, ERA)</h3><div class="cl-wrap">${pit.length?exStatTable(pit,true):'<p class="mute" style="margin:0">기록 부족</p>'}</div></div></div>`;
}
PAGES.exhib = ()=>`<h2>${S.phase==='off'?S.year+1:S.year} 시범경기</h2>${exhibPage()}`;
// 선수 기록 탭: 시범경기
const _recordsHtml = recordsHtml;
recordsHtml = function(p){ let h=_recordsHtml(p); const x=p.xst; if(!x || !(x.pa||x.outs)) return h;
  return h + `<div class="panel" style="margin-top:12px"><h3>${p.xstY||''} 시범경기</h3>${recTable(p,[{lab:[p.xstY||''],o:x}],['시즌'])}</div>`; };

// ---------- 방출 · 웨이버 · 자유계약 ----------
function releaseOwe(p){ const left = S.phase==='regular' ? (1-S.dayIdx/144) : S.phase==='off' ? 1 : 0; return r1(p.salary*left + p.salary*Math.max(0,(p.yrs||1)-1)*(p.foreign?0:1)); }
function relBtn(p, small){ return `<button style="${small?'padding:4px 8px;font-size:12px;':''}color:#ff8f87" onclick="askRelease('${p.id}')">방출</button>`; }
function askRelease(pid){ const p=P(pid);
  if(confirm(`${p.name}을(를) 방출할까요?\n남은 연봉 ${releaseOwe(p)}억을 지급하고 ${WAIVER_DAYS}일간 웨이버 공시합니다. 다른 구단이 데려가면 돌려받아요.`)){ const e=releasePlayer(pid); if(e) alert(e); else { alert(`${p.name}을(를) 웨이버 공시했어요.`); if(page==='player') histBack(); else render(); } } }
let wvF='all';
PAGES.waivers = ()=>{
  const u=S.teams[S.user];
  const wv=Object.values(S.players).filter(p=>!p.team && p.waiver);
  let fa=Object.values(S.players).filter(p=>!p.team && p.freeAgent && !p.retired);
  if(wvF==='h') fa=fa.filter(p=>!p.isP); if(wvF==='p') fa=fa.filter(p=>p.isP); if(wvF==='f') fa=fa.filter(p=>p.foreign);
  fa.sort((a,b)=>estCA(b,knowOf(b))-estCA(a,knowOf(a)));
  const open = S.phase==='regular' ? md()<=F_RULE.lastDay : S.phase==='off';
  const last=p=>(p.mv||[]).filter(m=>m.from).slice(-1)[0]?.from;
  return `<h2>방출 · 자유계약</h2>
   <div class="cl-tiles">${tile('보류 선수',`${u.roster.length} / ${ROSTER_MAX_USER}`,'최소 30명 유지')}${tile('웨이버 공시 중',`${wv.length}명`,`${WAIVER_DAYS}일 동안 다른 구단이 데려갈 수 있어요`)}${tile('자유계약 선수',`${fa.length}명`,open?'지금 영입 가능':'지금은 등록 불가 (8월 15일 이후·가을야구)')}${tile('연봉 예산',`${r1(payroll(u))} / ${u.bud.wage}억`)}</div>
   <div class="panel"><h3>웨이버 공시 중</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>원소속</th><th>능력 / 잠재력</th><th class="n">잔여 연봉</th><th>공시 종료</th></tr>
    ${wv.map(p=>`<tr class="${p.waiver.from===S.user?'me':''}"><td><a href="#" onclick="scoutReport('${p.id}');return false"><b>${p.name}</b></a><div class="mute" style="font-size:12px">${POS_KO[p.pos]} · ${p.age}세</div></td><td>${crest(p.waiver.from,16)} ${short(p.waiver.from)}</td><td>${caStars(p)}<br>${paStars(p)}</td><td class="n">${p.waiver.owe}억</td><td>${p.waiver.until}</td></tr>`).join('')||'<tr><td class="mute" colspan="5">없음</td></tr>'}</table></div></div>
   <div class="panel" style="margin-top:12px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">자유계약 선수</h3><div class="row">${[['all','전체'],['h','야수'],['p','투수'],['f','외국인']].map(([k,l])=>`<button class="${wvF===k?'pri':''}" onclick="wvF='${k}';render()">${l}</button>`).join('')}</div></div>
    <div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>전 소속</th><th>능력 (추정)</th><th class="n">요구 연봉</th><th></th></tr>
    ${fa.map(p=>{ const K=knowOf(p); return `<tr><td><a href="#" onclick="scoutReport('${p.id}');return false"><b>${p.name}</b></a><div class="mute" style="font-size:12px">${POS_KO[p.pos]} · ${p.age}세${p.foreign?' · 외국인':''}</div></td><td>${last(p)?`${crest(last(p),16)} ${short(last(p))}`:'-'}</td>
      <td>${estStars(p,CA(p),K,30)}</td><td class="n">${faAskOf(p)}억</td><td class="n"><button class="pri" ${open?'':'disabled'} onclick="faSign('${p.id}')">영입</button></td></tr>`; }).join('')||'<tr><td class="mute" colspan="5">자유계약 선수가 없어요</td></tr>'}</table></div>
    <p class="cl-note">방출된 선수는 ${WAIVER_DAYS}일 동안 웨이버 공시돼요. 다른 구단이 데려가면 남은 연봉 부담도 넘어가고, 아무도 데려가지 않으면 자유계약 선수가 돼요. 자유계약 선수는 1년 계약으로 싸게 데려올 수 있어요 (시즌 중에는 8월 15일까지). 스토브리그가 시작되면 FA 시장으로 넘어가요. 방출은 선수 화면이나 1군 · 퓨처스 목록의 <b>방출</b> 버튼으로 해요.</p></div>`;
};
function faSign(pid){ const p=S.players[pid], ask=faAskOf(p);
  modal(`<h2>${p.name} 영입</h2><p class="mute">${POS_KO[p.pos]} · ${p.age}세 · 요구 연봉 ${ask}억 (1년)</p>
   <div class="row">연봉(억) <input id="fsSal" type="number" step="0.1" min="0.3" value="${ask}" style="width:100px">${p.foreign&&p.aqOK?` 등록 <select id="fsSlot"><option value="reg">외국인</option><option value="aq">아시아쿼터</option></select>`:''}
    <button class="pri" onclick="const e=signFreeAgent('${pid}',+document.getElementById('fsSal').value,document.getElementById('fsSlot')?.value); alert(e||'계약 성공!'); if(!e) closeModal();">계약</button></div>
   <p class="cl-note">요구액보다 적게 부르면 거절할 수 있어요. 1군 엔트리가 가득 차 있으면 퓨처스에 등록돼요.</p>`); }
doRelease = askRelease;

// ---------- 고교 · 대학 야구 ----------
let scF='all', scSort='best';
PAGES.schools = ()=>{
  const u=S.teams[S.user], sc=u.staff['국내스카우트'], W=S.amateur?.watch||[];
  const am=Object.values(S.players).filter(p=>p.am && !p.team && !p.draftedBy);
  const by={}; for(const p of am) (by[p.school] ||= []).push(p);
  let rows=SCHOOLS().map(s=>{ const ps=by[s.n]||[]; const best=ps.length?Math.max(...ps.map(dEst)):0; const acc=ps.length?Math.round(ps.reduce((a,p)=>a+p.dk,0)/ps.length):0; const sr=ps.filter(p=>p.am.g>=p.am.last).length; return {...s, ps, best, acc, sr}; });
  if(scF==='hs') rows=rows.filter(r=>r.t==='고교'); if(scF==='uni') rows=rows.filter(r=>r.t!=='고교'); if(scF==='w') rows=rows.filter(r=>W.includes(r.n));
  if(scF.startsWith('rg:')) rows=rows.filter(r=>r.r===scF.slice(3));
  rows.sort((a,b)=>scSort==='best'?b.best-a.best:scSort==='acc'?b.acc-a.acc:a.n<b.n?-1:1);
  const regions=[...new Set(SCHOOLS().map(s=>s.r))];
  return `<h2>고교 · 대학 야구</h2>
   <div class="cl-tiles">${tile('국내 스카우트',sc.name,`능력 ${sc.rating}`)}${tile('스카우트 파견',`${W.length} / ${schoolWatchMax()}곳`,'학교당 주 0.05억 · 그 학교 전 학년 평가가 빨리 정확해져요')}${tile('아마추어 선수',`${am.length}명`,`올해 드래프트 대상 ${am.filter(p=>p.am.g>=p.am.last).length}명`)}${tile('연고 지역',CITY_REGION[TD(S.user).city],'처음부터 더 잘 알고 있어요')}</div>
   <div class="panel"><div class="row" style="justify-content:space-between;margin-bottom:8px"><div class="row">${[['all','전체'],['hs','고교'],['uni','대학'],['w',`파견 중 (${W.length})`]].map(([k,l])=>`<button class="${scF===k?'pri':''}" onclick="scF='${k}';render()">${l}</button>`).join('')}
      <select aria-label="지역" onchange="scF=this.value||'all';render()"><option value="">지역 전체</option>${regions.map(r=>`<option value="rg:${r}" ${scF==='rg:'+r?'selected':''}>${r}</option>`).join('')}</select></div>
     <select aria-label="정렬" onchange="scSort=this.value;render()">${[['best','최고 유망주순'],['acc','평가 정확도순'],['name','이름순']].map(([k,l])=>`<option value="${k}" ${scSort===k?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="cl-wrap"><table class="cl-tbl"><tr><th>학교</th><th>지역</th><th class="n">선수</th><th class="n">드래프트 대상</th><th>최고 유망주 (추정 잠재력)</th><th class="n">평가 정확도</th><th></th></tr>
    ${rows.map(r=>`<tr class="${W.includes(r.n)?'me':''}"><td><a href="#" onclick="schoolView('${r.n}');return false"><b>${r.n}</b></a> <span class="cl-chip">${r.t}</span></td><td>${r.r}</td><td class="n">${r.ps.length}</td><td class="n">${r.sr}</td><td>${r.best?stV(r.best):'-'}</td><td class="n">${r.acc}%</td>
      <td class="n"><button class="${W.includes(r.n)?'pri':''}" onclick="act(()=>toggleSchoolWatch('${r.n}'))">${W.includes(r.n)?'파견 중 · 철수':'스카우트 파견'}</button></td></tr>`).join('')}</table></div>
    <p class="cl-note">학교 이름은 실제 고교·대학 야구부지만 선수는 모두 가상 인물이에요. 선수들은 해마다 한 학년씩 올라가며 성장하고, 고교 3학년·대학 졸업반이 그해 9월 신인 드래프트에 나와요. 지명받지 못한 고교 3학년 일부는 대학에 진학해요. 스카우트 평가는 다음 해까지 이어지니, 저학년 때부터 지켜보면 드래프트 때 훨씬 정확해요.</p></div>`;
};
function schoolView(name, rep){
  const ps=Object.values(S.players).filter(p=>p.am && !p.team && !p.draftedBy && p.school===name).sort((a,b)=>b.am.g-a.am.g || dEst(b)-dEst(a));
  const s=SCHOOLS().find(x=>x.n===name), W=S.amateur.watch, on=W.includes(name);
  const am=p=>{ const x=p.amStat; return p.isP?`${x.ip}이닝 ERA ${x.era} · ${x.k}K · 최고 ${x.top}km`:`${x.g}경기 ${x.avg} · ${x.hr}홈런 · ${x.sb}도루`; };
  const html=`<div class="row" style="justify-content:space-between"><div><h2 style="margin:0">${name}</h2><div class="mute">${s.t} · ${s.r} · 선수 ${ps.length}명</div></div>
     <button class="${on?'pri':''}" onclick="act(()=>toggleSchoolWatch('${name}'));schoolView('${name}',true)">${on?'파견 중 · 철수':'스카우트 파견'}</button></div>
   <div class="panel" style="margin-top:12px"><div class="cl-wrap"><table class="cl-tbl"><tr><th>학년</th><th>이름</th><th>포지션</th><th>투타</th><th>예상 능력</th><th>예상 잠재력</th><th>평가</th><th>지난 시즌</th><th></th></tr>
    ${ps.map(p=>`<tr class="${p.am.g>=p.am.last?'me':''}"><td>${p.am.g}학년${p.am.g>=p.am.last?' <span class="cl-chip y">드래프트</span>':''}</td><td><a href="#" onclick="scoutReport('${p.id}');return false"><b>${p.name}</b></a> <span class="mute" style="font-size:12px">${p.age}세</span></td><td>${POS_KO[p.pos]}</td><td>${handTxt(p)}</td>
      <td>${stV(dEstCA(p))}</td><td>${stV(dEst(p))}</td><td class="cl-acc">${p.dk>=85?'확실':p.dk>=60?'대략':'불확실'} (${Math.round(p.dk)}%)</td><td class="mute" style="font-size:12px">${am(p)}</td>
      <td>${p.prospect&&S.dclass&&!S.dclass.done?`<button onclick="act(()=>draftWatch('${p.id}'));schoolView('${name}',true)">${S.dclass.watch.includes(p.id)?'★ 관찰 중':'☆ 집중 관찰'}</button>`:''}</td></tr>`).join('')||'<tr><td class="mute" colspan="9">선수 없음</td></tr>'}</table></div>
    <p class="cl-note">저학년 선수는 해마다 성장해요. 스카우트를 파견하면 이 학교 모든 학년의 평가가 매주 정확해져요.</p></div>`;
  (rep&&page==='view'?refreshView:modal)(html);
}

// ---------- 해외파 ----------
PAGES.abroad = ()=>{
  const now=Object.values(S.players).filter(p=>p.abroad).sort((a,b)=>CA(b)-CA(a));
  const back=Object.values(S.players).filter(p=>(p.mv||[]).some(m=>m.type==='국내 복귀'));
  const line=(p,h)=> h ? (p.isP?`${h.y} ${h.ip}이닝 ERA ${h.era} · ${h.k}K`:`${h.y} ${h.g}경기 ${h.avg} · ${h.hr}홈런`) : '첫 시즌 준비 중';
  const col=st=>st==='주전 활약'||st==='재계약'?'g':st==='부진'?'r':'y';
  return `<h2>해외파</h2>
   <div class="cl-tiles">${tile('해외 진출 선수',`${now.length}명`,'MLB · 일본 NPB')}${tile('국내 복귀',`${back.length}명`,'복귀하면 FA 시장에 나와요')}</div>
   <div class="panel"><h3>해외에서 뛰는 우리 리그 출신</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>원소속</th><th>리그</th><th class="n">시즌</th><th>최근 성적</th><th>상태</th><th class="n">잔여 계약</th></tr>
    ${now.map(p=>{ const a=p.abroad, h=a.hist[a.hist.length-1]; return `<tr class="${a.from===S.user?'me':''}"><td><a href="#" onclick="plTab='hist';_showPlayerBase('${p.id}');return false"><b>${p.name}</b></a><div class="mute" style="font-size:12px">${POS_KO[p.pos]} · ${p.age}세</div></td><td>${crest(a.from,16)} ${short(a.from)}</td><td>${ABROAD[a.lg].n}</td><td class="n">${a.hist.length}</td><td class="mute" style="font-size:12px">${line(p,h)}</td><td><span class="cl-chip ${col(a.status)}">${a.status}</span></td><td class="n">${a.yrs}년</td></tr>`; }).join('')||'<tr><td class="mute" colspan="7">아직 해외에 진출한 선수가 없어요</td></tr>'}</table></div></div>
   <div class="panel" style="margin-top:12px"><h3>국내 복귀 선수</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>선수</th><th>복귀</th><th>현재 소속</th><th>해외 경력</th></tr>
    ${back.map(p=>{ const m=(p.mv||[]).filter(x=>x.type==='국내 복귀').slice(-1)[0]; return `<tr><td><a href="#" onclick="plTab='hist';_showPlayerBase('${p.id}');return false"><b>${p.name}</b></a></td><td>${m.y}</td><td>${p.team?`${crest(p.team,16)} ${short(p.team)}`:'FA'}</td><td class="mute" style="font-size:12px">${m.note}</td></tr>`; }).join('')||'<tr><td class="mute" colspan="4">없음</td></tr>'}</table></div>
    <p class="cl-note">시즌이 끝나면 젊은 국내 스타가 MLB·NPB 진출을 시도해요. 우리 선수라면 포스팅 허락 여부를 메일로 물어요 (허락하면 포스팅 이적료를 받아요). 해외에서 잘하면 재계약하고 남고, 부진하거나 계약이 끝나면 돌아와 FA 시장에 나와요. 원소속 구단이 협상에서 유리해요. 해외 구단명과 성적은 게임 속 가상 결과예요.</p></div>`;
};
const _historyHtml = historyHtml;
historyHtml = function(p){ let h=_historyHtml(p); const seasons=[...(p.abroadPast||[]), ...(p.abroad?.hist||[])];
  if(!seasons.length && !p.abroad) return h;
  const rows=seasons.map(x=>`<tr><td>${x.y}</td><td>${ABROAD[x.lg].n}</td><td>${p.isP?`${x.ip}이닝 ERA ${x.era} · 탈삼진 ${x.k}`:`${x.g}경기 타율 ${x.avg} · ${x.hr}홈런`}</td><td><span class="cl-chip ${x.status==='부진'?'r':x.status==='주전 활약'?'g':'y'}">${x.status}</span></td></tr>`).join('');
  return h + `<div class="panel" style="margin-top:12px"><h3>해외 경력 ${p.abroad?`<span class="cl-chip y">현재 ${ABROAD[p.abroad.lg].n} · 잔여 ${p.abroad.yrs}년</span>`:''}</h3><div class="cl-wrap"><table class="cl-tbl"><tr><th>시즌</th><th>리그</th><th>성적</th><th>평가</th></tr>${rows||'<tr><td class="mute" colspan="4">첫 시즌 준비 중</td></tr>'}</table></div><p class="cl-note">해외 성적은 게임 속 가상 결과예요.</p></div>`; };

// ---------- 저장 관리 (웹 게임: 파일로 내보내기·불러오기) ----------
let DL=null, saveWarned=false;
try{ window.claude?.use?.('downloads')?.then(d=>{ DL=d; }).catch(()=>{}); }catch(e){}
save = function(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){ if(!saveWarned){ saveWarned=true; alert('이 브라우저에서는 자동 저장이 되지 않았어요 (저장 공간 부족 또는 차단). 구단 → 저장 관리에서 저장 파일로 내보내 두세요.'); } } };
function saveName(){ return `pro-baseball-manager-${S.year}-${S.user}-${S.date}.json`; }
async function exportSave(){
  if(!S) return; const data=new Blob([JSON.stringify(S)],{type:'application/json'});
  if(DL){ try{ await DL.save({filename:saveName(), data}); alert('저장 파일을 내보냈어요.'); }catch(e){ alert(e?.code==='declined'?'내보내기를 취소했어요.':'이 화면에서는 파일로 내보낼 수 없어요.'); } return; }
  if(window.claude){ alert('이 화면에서는 파일로 내보낼 수 없어요. 게임은 이 브라우저에 자동 저장되니, 같은 브라우저로 다시 열면 이어 할 수 있어요.'); return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(data); a.download=saveName(); document.body.appendChild(a); a.click(); a.remove(); }catch(e){ alert('이 화면에서는 파일로 내보낼 수 없어요.'); }
}
function importSave(file){
  if(!file) return; const rd=new FileReader();
  rd.onload=()=>{ try{ const x=JSON.parse(rd.result); if(!x || !x.teams || !x.players || !x.user) throw 0;
      localStorage.setItem(SAVE_KEY, rd.result); }catch(e){ alert('저장 파일을 읽을 수 없어요. 이 게임에서 내보낸 .json 파일인지 확인해 주세요.'); return; }
    if(load()){ page='home'; histB=[]; histF=[]; render(); alert('저장 파일을 불러왔어요.'); } };
  rd.onerror=()=>alert('파일을 읽지 못했어요.'); rd.readAsText(file);
}
function saveSizeKB(){ try{ return Math.round((localStorage.getItem(SAVE_KEY)||'').length/1024); }catch(e){ return null; } }
PAGES.savefile = ()=>{ const kb=saveSizeKB();
  return `<h2>저장 관리</h2>
   <div class="cl-tiles">${tile('자동 저장',kb!=null?`${kb}KB`:'사용 불가',kb!=null?'이 브라우저에 자동 저장 중':'이 브라우저는 저장소를 막고 있어요')}${tile('현재 게임',`${S.year} · ${tname(S.user)}`,`${S.date}`)}</div>
   <div class="panel"><h3>저장 파일로 내보내기</h3><p class="cl-note" style="margin-top:0">게임은 이 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 다른 기기에서 이어 하려면 저장 파일(.json)로 내보내 두세요.</p>
    <button class="pri" onclick="exportSave()">저장 파일 내보내기</button></div>
   <div class="panel" style="margin-top:12px"><h3>저장 파일 불러오기</h3><p class="cl-note" style="margin-top:0">내보낸 .json 파일을 고르면 그 시점부터 이어 해요. 지금 진행 중인 게임은 덮어써져요.</p>
    <label for="loadFile" class="row" style="gap:8px"><input id="loadFile" type="file" accept=".json,application/json" onchange="importSave(this.files[0])"></label></div>`; };
// 타이틀 화면에서도 불러오기
(function(){ const _rs=renderStart; renderStart=function(){ _rs(); const b=document.querySelector('.title .btns'); if(!b || document.getElementById('titleLoad')) return;
  const l=document.createElement('label'); l.className='dark'; l.id='titleLoad'; l.style.cssText='display:inline-flex;align-items:center;cursor:pointer;padding:10px 18px;border:1px solid rgba(255,255,255,.25);border-radius:10px;color:#e8edf2;background:rgba(0,0,0,.35)';
  l.innerHTML='저장 파일 불러오기<input type="file" accept=".json,application/json" style="display:none" onchange="importSave(this.files[0])">'; b.appendChild(l); }; })();
// 웹 버전 업데이트가 반영돼도 진행 중인 게임 유지
try{ window.claude?.hot?.snapshot?.(()=>({S, page})); }catch(e){}
(function(){ const start=d=>{ if(d && d.S && !S){ S=d.S; page=d.page||'home'; render(); } };
  try{ window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {}); }catch(e){} })();
if(!S) render();   // 타이틀 화면에 '저장 파일 불러오기' 버튼 반영
// 상단 바 왼쪽: PM 2026 앱 아이콘 (누르면 메인 화면)
(function(){ const _r=render; render=function(){ _r(); if(!S) return; const tb=document.querySelector('.tb1'); if(!tb || tb.querySelector('.pmhome')) return;
  const b=document.createElement('button'); b.className='pmhome'; b.title='메인 화면'; b.setAttribute('aria-label','메인 화면으로'); b.style.cssText='background:none;border:0;padding:0 8px 0 0;display:flex;align-items:center;cursor:pointer';
  b.innerHTML=pmIcon(34); b.onclick=()=>{ if(!LV) quit(); }; tb.insertBefore(b, tb.firstChild); }; })();
// 트레이드 제안: 역제안 받기
proposeTrade = function(){
  if(S.phase==='post'){ alert('포스트시즌에는 트레이드할 수 없습니다.'); return; }
  const r=evaluateTrade(tradeGive,tradeGet,tradeTeam);
  if(r.ok){ if(confirm(r.msg+'\n\n트레이드를 확정할까요?')){ doTrade(tradeGive,tradeGet,tradeTeam); tradeGive=[]; tradeGet=[]; save(); render(); } return; }
  if(r.counter){ const p=P(r.counter.add);
    if(confirm(`${r.msg}\n\n역제안을 받아들이면 ${p.name}도 함께 보냅니다. 수락할까요?`)){ tradeGive=[...tradeGive, p.id]; doTrade(tradeGive,tradeGet,tradeTeam); tradeGive=[]; tradeGet=[]; save(); render(); alert('역제안을 받아들여 트레이드가 성사됐어요.'); }
    return; }
  alert(r.msg);
};
