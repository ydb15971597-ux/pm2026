// 프로야구 매니저 PM — 실시간 경기 중계 화면
let LV = null;
const LV_SPEED = {slow:1200, normal:600, fast:170};

function watchLive(){
  if(LV || S.fired) return;
  const m = todayMatch(); if(!m) return;
  const r = advanceDay((gen, fin, match)=>{
    const [h,a] = match;
    LV = {gen, fin, home:h, away:a, uSide: a===S.user?0 : h===S.user?1 : -1, feed:[], speed:(typeof pmPrefs==='function'&&pmPrefs().liveSpeed)||'normal', paused:false,
      queued:null, ev:null, count:[0,0], lastPitch:null, banner:null, timer:null, lastWasPa:false, post:S.phase==='post', exhib:S.phase==='off'};
  });
  if(r==='live'){ try{ BGM.crowdBed?.(true); }catch(e){} renderLive(); stepLive(); }
}
function liveDelay(ev){
  const b = LV_SPEED[LV.speed]||600;
  return ev.type==='pitch'? b : ev.type==='result'? b*2.2 : ev.type==='half'? b*2.6 : ev.type==='sub'? b*1.8 : b*0.5;
}
function stepLive(){
  if(!LV) return;
  clearTimeout(LV.timer);
  while(true){
    let cmd;
    if(LV.lastWasPa){ cmd = LV.queued; LV.queued = null; if(cmd&&cmd.shout){ LV.shoutN=(LV.shoutN||0)+1; LV.shoutKey=LV.ev.inning+'-'+LV.ev.half; } }
    const r = LV.gen.next(cmd);
    if(r.done){ finishLive(r.value); return; }
    const ev = r.value; LV.ev = ev; LV.lastWasPa = ev.type==='pa';
    if(ev.type==='pa'){ LV.count=[0,0]; LV.lastPitch=null; LV.pa=ev; LV.zone=[]; LV.zoneBat=ev.batter; LV.zonePit=ev.pitcher?.[1-ev.bat]||null; }
    if(ev.type==='pitch'){ LV.count=[Math.min(ev.b,3),Math.min(ev.s,2)]; LV.lastPitch=ev; if(ev.lx!=null) (LV.zone ||= []).push({x:ev.lx, y:ev.ly, res:ev.res, pt:ev.pt, v:ev.v});
      LV.feed.unshift({k:'pitch', t:`${ev.pt==='고의사구'?'고의사구':`${ev.pt} <b>${ev.v}km</b>`} · ${ev.res}`, c:`${ev.b}-${ev.s}`}); }
    if(ev.type==='result'){ LV.feed.unshift({k:'result', t:ev.text}); if(ev.big){ LV.banner=ev.big; LV.bannerUntil=Date.now()+1800; } }
    if(ev.type==='half'){ LV.feed.unshift({k:'half', t:ev.text}); LV.count=[0,0]; LV.lastPitch=null; }
    if(ev.type==='sub') LV.feed.unshift({k:'sub', t:ev.text});
    if(LV.feed.length>120) LV.feed.length=120;
    if(LV.speed!=='end' && LV.speed!=='inning' && LV.speed!=='pa') try{ liveSfx(ev); }catch(e){}
    if(LV.speed==='end') continue;
    if(LV.speed==='inning'){ if(ev.type==='half'){ LV.speed='normal'; LV.paused=true; renderLive(); return; } continue; }
    if(LV.speed==='pa'){ if(ev.type==='pa'){ LV.speed='normal'; LV.paused=true; renderLive(); return; } continue; }
    renderLive();
    if(!LV.paused) LV.timer = setTimeout(stepLive, liveDelay(ev));
    return;
  }
}
function finishLive(g){
  try{ const sc=LV.ev?.score; BGM.crowdBed?.(false); if(sc && LV.uSide>=0 && BGM.crowd){ const my=sc[LV.uSide], op=sc[1-LV.uSide]; if(my!==op) BGM.crowd(my>op?'win':'lose'); } }catch(e){}
  const fin = LV.fin; clearTimeout(LV.timer); LV=null;
  fin(g); save();
  document.getElementById('live').innerHTML='';
  render(); showGame(g);
}
function liveSpeed(s){ if(!LV) return; LV.speed=s; LV.paused=false; if(s==='end'||s==='inning'||s==='pa') stepLive(); else { clearTimeout(LV.timer); LV.timer=setTimeout(stepLive, 80); } renderLive(); }
function livePause(){ if(!LV) return; LV.paused=!LV.paused; clearTimeout(LV.timer); if(!LV.paused) LV.timer=setTimeout(stepLive,100); renderLive(); }
function liveCmd(c){ if(!LV) return; if(!c){ LV.queued=null; } else { const q={...(LV.queued||{}), ...c}; for(const k in q) if(q[k]==null||q[k]===false) delete q[k]; LV.queued=Object.keys(q).length?q:null; } renderLive(); }
function liveSet(k,v){ if(!LV) return; const q=LV.queued||{}; liveCmd({[k]: q[k]===v ? null : v}); }

function diamond(bases){
  const on = i=>bases[i]; const b = (x,y,i)=>`<rect x="${x-11}" y="${y-11}" width="22" height="22" transform="rotate(45 ${x} ${y})" fill="${on(i)?'#ffd166':'#1d2530'}" stroke="${on(i)?'#ffd166':'#5b6878'}" stroke-width="2"/>`;
  const nm = (x,y,i,anchor)=> on(i)?`<text x="${x}" y="${y}" fill="#ffd166" font-size="12" font-weight="700" text-anchor="${anchor}">${esc(bases[i])}</text>`:'';
  return `<svg viewBox="0 0 240 190" width="100%" style="max-width:300px">
    <path d="M120 20 L210 105 L120 180 L30 105 Z" fill="#1f5a35" stroke="#2c7a49" stroke-width="2"/>
    <path d="M120 48 L182 105 L120 160 L58 105 Z" fill="#8a5a33" opacity=".55"/>
    <path d="M120 64 L166 105 L120 146 L74 105 Z" fill="#1f5a35"/>
    <circle cx="120" cy="105" r="7" fill="#a0703f"/>
    ${b(120,48,1)}${b(182,105,0)}${b(58,105,2)}
    <path d="M112 168 L128 168 L128 176 L120 182 L112 176 Z" fill="#e6edf3"/>
    ${nm(120,30,1,'middle')}${nm(196,134,0,'middle')}${nm(44,134,2,'middle')}
  </svg>`;
}
function lights(n, total, color){ return Array.from({length:total},(_,i)=>`<i style="background:${i<n?color:'#26303b'}"></i>`).join(''); }

function renderLive(){
  if(!LV) return;
  const ev = LV.ev || {inning:1, half:0, outs:0, bases:[null,null,null], score:[0,0], line:[[],[]], pitcher:[null,null], pc:[0,0]};
  const ids=[LV.away, LV.home];
  const n = Math.max(9, ev.line[0].length, ev.line[1].length + (ev.half===1?1:0));
  const cell = (s,i)=>{ let v = ev.line[s][i]; if(v===undefined && i===ev.inning-1 && s===ev.half) v = ev.score[s]-ev.line[s].reduce((a,b)=>a+(+b||0),0); return v??''; };
  const ls = `<table class="ls lvls"><tr><th style="text-align:left">${LV.exhib?'시범경기':LV.post?'포스트시즌':'정규시즌'}</th>${Array.from({length:n},(_,i)=>`<th class="${i===ev.inning-1?'curinn':''}">${i+1}</th>`).join('')}<th>R</th></tr>
    ${[0,1].map(s=>`<tr class="${ev.half===s?'atbat':''}"><td style="text-align:left;white-space:nowrap">${crest(ids[s],20)} <b>${short(ids[s])}</b></td>${Array.from({length:n},(_,i)=>`<td>${cell(s,i)}</td>`).join('')}<td class="rr">${ev.score[s]}</td></tr>`).join('')}</table>`;
  const bat = ev.half, fld = 1-bat;
  const pit = ev.pitcher?.[fld] ? S.players[ev.pitcher[fld].id] || ev.pitcher[fld] : null;
  const batter = LV.pa?.batter ? (S.players[LV.pa.batter.id]||LV.pa.batter) : null;
  const lp = LV.lastPitch;
  const pCard = pit ? `<div class="lvcard"><div class="row" style="flex-wrap:nowrap">${avatar(pit,54)}<div><div class="mute" style="font-size:12px">투수 · ${short(ids[fld])}</div><b style="font-size:17px">${pit.name}</b>
      <div class="mute" style="font-size:12px">${pit.hand==='L'?'좌완':'우완'} · 최고 ${kmh(pit)}km · 투구수 <b style="color:var(--text)">${ev.pc?.[fld]??0}</b></div></div></div>
      <div class="row" style="margin-top:8px;gap:6px">${Object.entries(pit.pitches||{}).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>`<span class="pill">${k} ${rc(v)}</span>`).join('')}</div>
      <div style="margin-top:6px">${traitChips(pit,3)}</div></div>` : '';
  const st = batter?.st; const today = LV.pa?.today;
  const bCard = batter ? `<div class="lvcard"><div class="row" style="flex-wrap:nowrap">${avatar(batter,54)}<div><div class="mute" style="font-size:12px">타자 · ${short(ids[bat])} ${LV.pa ? (LV.pa.slotIdx+1)+'번' : ''}</div><b style="font-size:17px">${batter.name}</b>
      <div class="mute" style="font-size:12px">${POS_KO[batter.pos]} · ${batter.hand==='L'?'좌타':batter.hand==='S'?'양타':'우타'} · 시즌 ${st&&st.ab?avg(st.h,st.ab):'-'} ${st?st.hr:0}홈런</div></div></div>
      <div class="row" style="margin-top:8px;gap:6px"><span class="pill">컨택 ${rc(batter.a.con)}</span><span class="pill">파워 ${rc(batter.a.pow)}</span><span class="pill">선구 ${rc(batter.a.eye)}</span><span class="pill">주루 ${rc(batter.a.spd)}</span></div>
      <div style="margin-top:6px">${traitChips(batter,3)}</div></div>` : '';
  const uBat = LV.uSide>=0 && LV.uSide===bat, uFld = LV.uSide>=0 && LV.uSide===fld;
  const q = LV.queued || {};
  const ut = S.teams[S.user];
  const src = LV.pa || ev;   // 출전 중인 선수 정보는 타석 시작 이벤트에 들어 있다
  const inGame = new Set((src.gone && src.gone[LV.uSide]) || []);
  const usedP = new Set((src.usedP && src.usedP[LV.uSide]) || []);
  let ctrl = '';
  if(uBat){
    const opp = pit ? (S.players[pit.id]||pit) : null, oh = opp?.hand || 'R';
    const bench = act1(ut).filter(p=>!p.isP && !p.inj && !inGame.has(p.id)).sort((a,b)=>batVal(b)-batVal(a));
    const runners = (ev.baseIds||[]).map((id,i)=>id?{id,i}:null).filter(Boolean);
    const mu = p=> p.hand==='S' ? '<span class="lvm g">양타</span>' : p.hand!==oh ? `<span class="lvm g">${p.hand==='L'?'좌타':'우타'} 유리</span>` : `<span class="lvm r">${p.hand==='L'?'좌타':'우타'} 불리</span>`;
    const card = p=>`<button class="lvc ${q.ph===p.id?'on':''}" onclick="liveSet('ph','${p.id}')"><b>${p.name}</b><span>${POS_KO[p.pos]} · 컨택 ${Math.round(p.a.con)} · 파워 ${Math.round(p.a.pow)}</span>${mu(p)}</button>`;
    const fast = bench.slice().sort((a,b)=>(b.a.spd+b.a.brn)-(a.a.spd+a.a.brn)).slice(0,4);
    ctrl = `<div class="row"><b style="color:var(--acc)">공격 작전</b>
      <button class="${q.bunt?'pri':''}" onclick="liveSet('bunt',${!q.bunt})" ${ev.bases[0]||ev.bases[1]?'':'disabled'}>희생번트</button>
      <button class="${q.steal?'pri':''}" onclick="liveSet('steal',${!q.steal})" ${(ev.bases[0]&&!ev.bases[1])||(ev.bases[1]&&!ev.bases[2]&&!ev.bases[0])?'':'disabled'}>도루</button></div>
      <div class="lvh">대타 — ${batter?`<b>${batter.name}</b> 대신`:''} · 상대 투수 ${oh==='L'?'좌완':'우완'} <span class="mute">(누르면 다음 타석에 기용, 한 번 더 누르면 취소)</span></div>
      <div class="lvgrid">${bench.map(card).join('')||'<span class="mute">벤치 야수가 없어요</span>'}</div>
      ${runners.length&&fast.length?`<div class="lvh">대주자</div><div class="lvgrid">${runners.map(r=>fast.map(p=>`<button class="lvc ${q.pr===p.id&&q.prOf===r.id?'on':''}" onclick="liveCmd(${q.pr===p.id&&q.prOf===r.id?"{pr:null,prOf:null}":`{prOf:'${r.id}',pr:'${p.id}'}`})"><b>${['1루','2루','3루'][r.i]} ${S.players[r.id]?.name} → ${p.name}</b><span>스피드 ${Math.round(p.a.spd)} · 주루 ${Math.round(p.a.brn)}</span></button>`).join('')).join('')}</div>`:''}`;
  } else if(uFld){
    const nb = LV.pa?.batter ? (S.players[LV.pa.batter.id]||LV.pa.batter) : null;
    const role = p=> p.id===ut.closer?'마무리':ut.setup.includes(p.id)?'필승조':ut.rotation.includes(p.id)?'선발':p.a.sta>=12||p.pos==='SP'?'롱릴리프':'불펜';
    const yday=addDays(S.date,-1), no3=p=>p.lastRP===yday && (p.rpStreak||1)>=2;
    const ord={마무리:0,필승조:1,불펜:2,롱릴리프:3,선발:4};
    const pen = act1(ut).filter(p=>p.isP && !p.inj && !usedP.has(p.id)).sort((a,b)=>ord[role(a)]-ord[role(b)] || ovrOf(b)-ovrOf(a));
    const pcard = p=>{ const st=[]; if(no3(p)) st.push('<span class="lvm r">3연투</span>'); else if(p.lastRP===yday) st.push('<span class="lvm y">어제 등판</span>'); if(p.fat>15) st.push('<span class="lvm r">피로</span>'); if(ut.rotation.includes(p.id)&&p.rest<4) st.push('<span class="lvm r">선발 휴식 중</span>');
      if(nb && nb.hand!=='S') st.push(p.hand===nb.hand?`<span class="lvm g">${nb.hand==='L'?'좌타':'우타'} 상대 유리</span>`:'');
      return `<button class="lvc ${q.pitcher===p.id?'on':''}" onclick="liveSet('pitcher','${p.id}')"><b>${p.name} <span class="mute" style="font-weight:400">${p.hand==='L'?'좌':'우'} · ${role(p)}</span></b><span>${'★'.repeat(clamp(Math.round((CA(p)-60)/26),1,5))} · 최고 ${kmh(p)}km</span>${st.join('')}</button>`; };
    ctrl = `<div class="row"><b style="color:var(--acc)">수비 작전</b><button class="${q.ibb?'pri':''}" onclick="liveSet('ibb',${!q.ibb})">고의사구</button></div>
      <div class="lvh">투수 교체 — 지금 ${pit?`<b>${pit.name}</b> 투구수 ${ev.pc?.[fld]??0}`:''}${nb?` · 다음 타자 ${nb.name}(${nb.hand==='L'?'좌타':nb.hand==='S'?'양타':'우타'})`:''} <span class="mute">(누르면 다음 타석부터 등판)</span></div>
      <div class="lvgrid">${pen.map(pcard).join('')||'<span class="mute">나갈 수 있는 투수가 없어요</span>'}</div>`;
  } else ctrl = `<div class="mute">관전 모드 — 작전을 지시할 수 없습니다.</div>`;
  if(typeof shoutHtml==='function') ctrl = shoutHtml(ev, uBat, uFld) + ctrl;
  const qTxt = Object.keys(q).length ? `<span class="pill tr">다음 타석 적용 예정: ${[q.bunt&&'번트',q.steal&&'도루',q.ibb&&'고의사구',q.ph&&('대타 '+S.players[q.ph]?.name),q.pr&&('대주자 '+S.players[q.pr]?.name),q.pitcher&&('투수 '+S.players[q.pitcher]?.name),q.shout&&'감독의 한마디'].filter(Boolean).join(', ')}</span> <a href="#" onclick="liveCmd(null);return false">취소</a>` : '';
  const banner = LV.banner && Date.now()<LV.bannerUntil ? `<div class="lvbanner">${LV.banner}</div>` : '';
  const sp = (k,l)=>`<button class="${LV.speed===k&&!LV.paused?'pri':''}" onclick="liveSpeed('${k}')">${l}</button>`;
  document.getElementById('live').innerHTML = `<div class="lvwrap"><div class="lv">
    <div class="row" style="justify-content:space-between;margin-bottom:10px"><div class="row"><span class="livedot"></span><b>LIVE</b><span class="mute">${TD(LV.home).stadium} · ${fmtDate(S.date)}</span></div>
      <div class="row"><button onclick="livePause()">${LV.paused?'▶ 재개':'⏸ 일시정지'}</button>${sp('slow','느리게')}${sp('normal','보통')}${sp('fast','빠르게')}<button onclick="liveSpeed('pa')">다음 타석</button><button onclick="liveSpeed('inning')">다음 이닝</button><button onclick="liveSpeed('end')">경기 끝까지</button></div></div>
    <div class="card" style="overflow:auto;padding:8px 12px">${ls}</div>
    <div class="lvmain">
      <div class="card lvfield">${banner}
        <div class="row" style="justify-content:space-between;width:100%"><b style="font-size:18px">${ev.inning}회${ev.half?'말':'초'} ${ev.half?'▼':'▲'}</b>
          <div class="bso"><span>B</span>${lights(LV.count[0],3,'#3fb950')}<span>S</span>${lights(LV.count[1],2,'#d29922')}<span>O</span>${lights(ev.outs,2,'#f85149')}</div></div>
        ${diamond(ev.bases)}
        <div class="lvpitch">${lp?`<span class="mute">${lp.pt==='고의사구'?'':lp.pt}</span> <b>${lp.v?lp.v+'km':''}</b> <span class="${/삼진|헛스윙|스트라이크/.test(lp.res)?'warn':/볼넷|볼/.test(lp.res)?'good':''}">${lp.res}</span>`:'&nbsp;'}</div>
      </div>
      <div class="lvside">${pCard}<div class="vs">VS</div>${bCard}</div>
      <div class="card lvfz"><div class="lvzone"><h3>투구 위치 <span class="mute" style="font-size:12px;font-weight:400">ABS 존 · 포수 시점</span></h3>${zoneSvg()}</div><div class="lvfeed"><h3>문자 중계</h3>${LV.feed.map(f=>`<div class="fd fd-${f.k}">${f.c?`<span class="cnt">${f.c}</span>`:''}${f.t}</div>`).join('')}</div></div>
    </div>
    <div class="card" style="margin-top:12px">${ctrl}<div style="margin-top:6px">${qTxt}</div>
      <div class="mute" style="font-size:12px;margin-top:6px">작전은 다음 타석 시작 때 적용됩니다. 일시정지 후 지시하면 편합니다. 지시하지 않으면 수석코치가 알아서 운영합니다.</div></div>
  </div></div>`;
}

// ---------- ABS 스트라이크존 ----------
const ZCOL = {'볼':'#3fb950','볼넷':'#3fb950','스트라이크':'#f85149','루킹 삼진':'#f85149','헛스윙':'#ff9f43','헛스윙 삼진':'#ff9f43','파울':'#f2c14e','타격':'#58a6ff','몸에 맞는 공':'#b36bff'};
function zoneSvg(){
  const z=(LV.zone||[]).filter(p=>p.pt!=='고의사구'), b=LV.zoneBat?(S.players[LV.zoneBat.id]||LV.zoneBat):null;
  const pp=LV.ev?.pitcher?.[1-(LV.ev?.half??0)]; const lh=pp&&(S.players[pp.id]||pp).hand==='L';
  const bh = b ? (b.hand==='S' ? (lh?'R':'L') : b.hand) : null;
  const X=x=>100+x*40, Y=y=>112-y*46;
  const grid=[-1/3,1/3].map(t=>`<line x1="${X(t)}" y1="${Y(1)}" x2="${X(t)}" y2="${Y(-1)}" stroke="#5b6672" stroke-dasharray="3 3"/><line x1="${X(-1)}" y1="${Y(t)}" x2="${X(1)}" y2="${Y(t)}" stroke="#5b6672" stroke-dasharray="3 3"/>`).join('');
  const batter = bh ? `<g opacity=".55"><rect x="${bh==='R'?8:168}" y="${Y(1.6)}" width="24" height="${Y(-1.9)-Y(1.6)}" rx="10" fill="#2a3440"/><text x="${bh==='R'?20:180}" y="${Y(-1.9)+14}" text-anchor="middle" font-size="11" fill="#aab4bf">${bh==='R'?'우타':'좌타'}</text></g>` : '';
  const dots=z.map((p,i)=>{ const last=i===z.length-1; return `<g>${last?`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="13" fill="none" stroke="#fff" stroke-width="2" opacity=".85"/>`:''}<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="9" fill="${ZCOL[p.res]||'#8d99a6'}" stroke="#0b0f14" stroke-width="1.5"/><text x="${X(p.x)}" y="${Y(p.y)+4}" text-anchor="middle" font-size="11" font-weight="800" fill="#0b0f14">${i+1}</text></g>`; }).join('');
  const list = z.length ? `<div class="zlist">${z.map((p,i)=>`<div><span class="zn" style="background:${ZCOL[p.res]||'#8d99a6'}">${i+1}</span>${p.pt} <b>${p.v}km</b> <span class="mute">${p.res}</span></div>`).join('')}</div>` : '<div class="mute" style="font-size:12px">투구를 기다리는 중</div>';
  return `<svg viewBox="0 0 200 230" width="100%" style="max-width:240px;display:block;margin:0 auto" role="img" aria-label="투구 위치 스트라이크존">
    <rect x="0" y="0" width="200" height="230" rx="10" fill="#0e141b"/>${batter}
    <rect x="${X(-1)}" y="${Y(1)}" width="${X(1)-X(-1)}" height="${Y(-1)-Y(1)}" fill="rgba(255,255,255,.05)" stroke="#d9e1e8" stroke-width="2"/>${grid}
    <path d="M${X(-0.75)} 200 L${X(0.75)} 200 L${X(0.75)} 208 L100 216 L${X(-0.75)} 208 Z" fill="#e8edf2" opacity=".85"/>
    ${dots}</svg>
    <div class="zleg">${[['볼','#3fb950'],['스트라이크','#f85149'],['헛스윙','#ff9f43'],['파울','#f2c14e'],['인플레이','#58a6ff']].map(([l,c])=>`<span><i style="background:${c}"></i>${l}</span>`).join('')}</div>${list}`;
}
(function(){ const st=document.createElement('style'); st.textContent=`.lvmain{grid-template-columns:minmax(250px,1fr) minmax(260px,1fr) minmax(400px,1.5fr)!important}
.lvfz{display:grid;grid-template-columns:minmax(200px,250px) minmax(0,1fr);gap:12px;align-items:start;max-height:470px}
.lvfz .lvfeed{max-height:440px;overflow:auto}.lvzone h3{margin:0 0 6px}
.zleg{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center;font-size:11px;color:var(--mute);margin:6px 0}.zleg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:3px;vertical-align:-1px}
.zlist{font-size:12px;line-height:1.75;max-height:150px;overflow:auto}.zn{display:inline-block;width:17px;height:17px;border-radius:50%;text-align:center;line-height:17px;font-size:10px;font-weight:800;color:#0b0f14;margin-right:5px}
@media (max-width:1100px){ .lvmain{grid-template-columns:1fr 1fr!important} .lvfz{grid-column:1 / -1} }
@media (max-width:640px){ .lvmain{grid-template-columns:1fr!important} .lvfz{grid-template-columns:1fr;max-height:none} }`; document.head.appendChild(st); })();

(function(){ const st=document.createElement('style'); st.textContent=`.lvh{margin:10px 0 6px;font-size:13px;color:var(--mute)}.lvh b{color:var(--text)}
.lvgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px;max-height:230px;overflow:auto;padding-right:2px}
.lvc{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:7px 10px;line-height:1.35;border-radius:9px}
.lvc b{font-size:13px}.lvc span{font-size:12px;color:var(--mute)}.lvc.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 22%,var(--panel2))}
.lvm{font-size:11px!important;font-weight:700;padding:0 6px;border-radius:6px}.lvm.g{color:#3fb950!important;background:rgba(63,185,80,.12)}.lvm.r{color:#f0605a!important;background:rgba(240,96,90,.12)}.lvm.y{color:#d2c84a!important;background:rgba(210,200,74,.12)}`; document.head.appendChild(st); })();

// 중계 상황별 관중 소리 (audio.js BGM.crowd): 우리 팀에 좋은 장면이면 환호, 나쁘면 탄식. 관전 경기는 홈 관중 기준
function liveSfx(ev){
  if(typeof BGM==='undefined' || !BGM.crowd || !ev) return;
  const bat = ev.half, userBat = LV.uSide>=0 ? LV.uSide===bat : bat===1;
  if(ev.type==='pitch'){ BGM.pitch?.(ev, LV.speed); return; }
  if(ev.type==='result'){
    const t = String(ev.text||'');
    let k = /홈런/.test(t)?'hr' : /2루타|3루타/.test(t)?'xbh' : /안타/.test(t)?'hit' : /병살/.test(t)?'dp' : /삼진/.test(t)?'k' : /도루 성공/.test(t)?'sb' : /도루 실패/.test(t)?'sbx' : null;
    let good = userBat;
    if(k==='k'||k==='dp'){ good = !userBat; }
    if(k==='sbx'){ k='sb'; good = !userBat; }
    const late = ev.inning>=7 ? 1.15 : 1;
    if(k) BGM.crowd(k, good, late);
    else { BGM.batted?.(t); if(ev.runs) BGM.crowd('run', userBat, late); }
    if(LV.uSide>=0 && userBat && /고의사구|몸에 맞는/.test(t)) BGM.crowd('boo');   // 우리 타자 고의사구·사구 → 야유
  }
  if(ev.type==='half' && LV.uSide>=0 && userBat && Math.random()<0.5) BGM.crowd('rally');   // 우리 공격 시작: 구호 응원
  if(ev.type==='pa' && LV.uSide>=0){
    const risp = !!(ev.bases[1]||ev.bases[2]), lead = LV.uSide===1 ? ev.score[1]-ev.score[0] : ev.score[0]-ev.score[1], key = ev.inning+'-'+ev.half;
    if(risp && Math.abs(lead)<=3 && LV.cheerKey!==key){
      if(userBat){ LV.cheerKey=key; BGM.crowd('chance'); }
      else if(ev.inning>=6){ LV.cheerKey=key; BGM.crowd('crisis'); }
    }
  }
}
