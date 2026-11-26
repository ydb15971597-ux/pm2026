// 프로야구 매니저 PM — 모바일 UI (토스 앱처럼: 큰 제목 헤더 · 하단 탭 바 · 하단 고정 버튼 · 바텀 시트)
// 데스크톱 셸(ui.js render)을 그대로 그린 뒤, 화면 폭이 좁으면 모바일 요소를 덧붙인다. 마지막에 로드.
const MOBILE_Q = window.matchMedia('(max-width: 760px)');
const isMobile = () => MOBILE_Q.matches;
const MI = { // 탭 바 아이콘 (선)
  home:'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  squad:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6',
  tactics:'M5 4h14v17H5zM9 4V2h6v2M9 10h6M9 14h6M9 18h3',
  scout:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  more:'M4 6h16M4 12h16M4 18h16',
  bell:'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  cal:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  won:'M4 8h16v11H4zM4 12h16M8 16h3',
  back:'M15 18l-6-6 6-6', chev:'M9 6l6 6-6 6', dots:'M5 12h.01M12 12h.01M19 12h.01',
};
const mi = (k,s=24,w=2)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${MI[k]}"/></svg>`;
const M_TABS = [['home','홈','home'],['squad','선수단','squad'],['tactics','라인업','tactics'],['db','영입','scout'],['__more','전체','more']];
function mTabOn(){ const g=PAGE_GROUP[page]||PAGE_GROUP[prevPage];
  if(page==='home') return 'home'; if(page==='tactics') return 'tactics';
  if(g==='squad' || (page==='player' && P(curPlayer)?.team===S.user)) return 'squad';
  if(g==='scout') return 'db'; if(g==='portal' && (page==='home')) return 'home'; return '__more'; }

function mobileChrome(){
  document.body.classList.toggle('mob', isMobile() && !!S);
  document.querySelectorAll('.m-top,.m-bar,.m-cta').forEach(e=>e.remove());
  if(!S || !isMobile()) return;
  const app=document.getElementById('app'); if(!app) return;
  const unread=S.inbox.filter(m=>!m.read).length;
  const date=document.querySelector('.datebox b')?.textContent||'', sub=document.querySelector('.datebox span')?.textContent||'', rec=document.querySelector('.datebox .rec')?.textContent||'';
  const title = page==='home' ? tname(S.user) : (page==='player'&&P(curPlayer)) ? P(curPlayer).name : (page==='coach' ? (coachObj()?.name||'코치') : (PAGE_LABEL[page] || document.querySelector('.subtabs .crumb')?.textContent || ''));
  // 헤더
  const top=document.createElement('header'); top.className='m-top';
  top.innerHTML = `<div class="m-row">${histB.length&&page!=='home'?`<button class="m-ic" aria-label="뒤로" onclick="histBack()">${mi('back',26,2.4)}</button>`:`<button class="m-ic m-crest" aria-label="구단 정보" onclick="go('club')">${crest(S.user,30)}</button>`}
     <div class="m-tt"><b>${esc(title)}</b><span>${esc(date)} · ${esc(rec)}</span></div>
     <button class="m-ic" aria-label="메시지 ${unread}개" onclick="go('inbox')">${mi('bell',24)}${unread?`<i class="m-badge">${unread>99?'99+':unread}</i>`:''}</button></div>`;
  app.insertBefore(top, app.firstChild);
  // 하단 고정 버튼 (계속 진행)
  const cont=document.querySelector('.cont');
  if(cont){ const btns=[...cont.querySelectorAll('button')]; const main=btns.find(b=>b.classList.contains('go'))||btns[0];
    if(main){ const cta=document.createElement('div'); cta.className='m-cta';
      const label = main.classList.contains('live') ? '경기 중계 보기' : main.textContent.replace(/[»▶]/g,'').trim();
      cta.innerHTML = `<div class="m-next">${esc(sub)}</div><div class="m-ctarow"><button class="m-go ${main.classList.contains('live')?'live':''}" onclick="${main.getAttribute('onclick')}">${esc(label)}</button>${btns.length>1?`<button class="m-more" aria-label="진행 옵션" onclick="mSheetAdv()">${mi('dots',24,3)}</button>`:''}</div>`;
      app.appendChild(cta); } }
  // 탭 바
  const on=mTabOn(); const bar=document.createElement('nav'); bar.className='m-bar'; bar.setAttribute('aria-label','주 메뉴');
  bar.innerHTML = M_TABS.map(([p,l,ic])=>`<button class="${on===p?'on':''}" onclick="${p==='__more'?'mSheetMenu()':`go('${p}')`}">${mi(ic,24,on===p?2.4:1.9)}<span>${l}</span></button>`).join('');
  app.appendChild(bar);
  // 홈 요약 카드
  if(page==='home') mHomeSummary();
}
function mHomeSummary(){
  const c=document.getElementById('content'); if(!c || c.querySelector('.m-sum')) return;
  const u=S.teams[S.user], g=todayMatch(), opp=g?(g[0]===S.user?g[1]:g[0]):null, home=g&&g[0]===S.user;
  const wp=u.w+u.l? (u.w/(u.w+u.l)).toFixed(3).replace(/^0/,''):'.000';
  const d=document.createElement('section'); d.className='m-sum';
  d.innerHTML = `<div class="m-card m-hero"><div class="m-lab">${S.year} 시즌 순위</div><div class="m-big">${rankOf(S.user)}<small>위</small></div>
     <div class="m-sub">${u.w}승 ${u.l}패 ${u.t}무 · 승률 ${wp}${u.streak?` · ${u.streak>0?u.streak+'연승':(-u.streak)+'연패'}`:''}</div>
     ${opp?`<button class="m-match" onclick="go('schedule')"><span class="m-lab">오늘 경기</span><span class="m-vs">${crest(S.user,34)}<b>${home?'vs':'@'}</b>${crest(opp,34)}</span><span>${home?'홈':'원정'} · ${esc(short(opp))}${mi('chev',18)}</span></button>`:''}</div>
   <div class="m-quick">${[['tactics','라인업','tactics'],['squad','선수단','squad'],['schedule','일정','cal'],['standings','순위','trophy'],['finance','재정','won'],['training','훈련','tactics']].filter(([p])=>PAGE_LABEL[p]||PAGES[p]).slice(0,4).map(([p,l,ic])=>`<button onclick="go('${p}')"><span class="m-qi">${mi(ic,22)}</span>${l}</button>`).join('')}</div>`;
  c.insertBefore(d, c.firstChild);
}
// 바텀 시트
function mSheet(html){ mClose(); const o=document.createElement('div'); o.className='m-sheet-bg'; o.onclick=e=>{ if(e.target===o) mClose(); };
  o.innerHTML=`<div class="m-sheet" role="dialog" aria-modal="true"><div class="m-handle" aria-hidden="true"></div>${html}</div>`; document.body.appendChild(o); requestAnimationFrame(()=>o.classList.add('open')); }
function mClose(){ document.querySelectorAll('.m-sheet-bg').forEach(e=>e.remove()); }
function mSheetMenu(){
  const menus = MENUS.map(m=>({...m, items:m.items.filter(([p])=>p!=='offseason'||S.phase==='off')}));
  mSheet(`<h2 class="m-sh">전체 메뉴</h2>${menus.map(m=>`<div class="m-grp">${m.l}</div><div class="m-list">${m.items.map(([p,l])=>`<button class="${page===p?'on':''}" onclick="mClose();go('${p}')"><span>${l}</span>${mi('chev',18)}</button>`).join('')}</div>`).join('')}
    <div class="m-grp">설정</div><div class="m-list"><button onclick="BGM.toggle();mClose();mSheetMenu()"><span>배경음악</span><span class="m-sw ${typeof BGM!=='undefined'&&BGM.on?'on':''}" aria-label="${typeof BGM!=='undefined'&&BGM.on?'켜짐':'꺼짐'}"><i></i></span></button>
     <button onclick="mClose();quit()"><span>메인 화면으로</span>${mi('chev',18)}</button></div>`);
}
function mSheetAdv(){
  const btns=[...document.querySelectorAll('.cont button')];
  mSheet(`<h2 class="m-sh">진행</h2><p class="m-desc">${esc(document.querySelector('.datebox span')?.textContent||'')}</p><div class="m-list">${btns.map(b=>`<button onclick="mClose();${b.getAttribute('onclick')}"><span>${esc(b.textContent.replace(/[»▶]/g,'').trim())}</span>${mi('chev',18)}</button>`).join('')}</div>`);
}
(function(){ const _r=render; render=function(){ _r(); try{ mobileChrome(); }catch(e){ console.error(e); } };
  let was=isMobile(); MOBILE_Q.addEventListener?.('change',()=>{ if(isMobile()!==was){ was=isMobile(); mClose(); render(); } });
  if(S) render(); else mobileChrome();
})();
