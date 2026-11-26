// 프로야구 매니저 PM — 타이틀(메인) 화면, 토스 스타일
// 큰 문장 · 앱 아이콘 · 이어하기 카드 · 큰 버튼 하나 · 간단한 소개. renderStart의 'title' 단계만 바꾼다. 맨 마지막에 로드.
function savePeek(){
  try{ const raw=localStorage.getItem(SAVE_KEY); if(!raw) return null; const x=JSON.parse(raw); const t=x.teams?.[x.user]; if(!t) return null;
    return {user:x.user, date:x.date, year:x.year, w:t.w||0, l:t.l||0, d:t.t||0, mgr:(!x.fict && typeof NAME_MAP_H!=='undefined' && NAME_MAP_H[hash(x.mgrName||'')]) || x.mgrName, phase:x.phase}; }catch(e){ return null; } }
const T_IC = {
  team:'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  ball:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM7 4.5c2 2 2.8 4.6 2.8 7.5S9 17.5 7 19.5M17 4.5c-2 2-2.8 4.6-2.8 7.5s.8 5.5 2.8 7.5',
  chart:'M4 20V10M10 20V4M16 20v-7M22 20H2',
  swap:'M7 7h13l-4-4M17 17H4l4 4',
  chev:'M9 6l6 6-6 6', file:'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5', music:'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
};
const tic = (k,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${T_IC[k]}"/></svg>`;
{ const _rsT = renderStart; renderStart = function(){
  document.body.classList.toggle('ttl', startStep==='title');
  if(startStep!=='title'){ _rsT(); return; }
  const sv = savePeek(), td = sv && TEAM_DATA.find(t=>t.id===sv.user);
  const bgmOn = typeof BGM!=='undefined' && BGM.on;
  document.getElementById('root').innerHTML = `<div class="tt">
    <header class="tt-nav"><div class="tt-brand">${pmIcon(30)}<b>프로야구 매니저</b></div>
      <button class="tt-bgm ${bgmOn?'on':''}" onclick="BGM.toggle();renderStart()" aria-label="배경음악 ${bgmOn?'끄기':'켜기'}">${tic('music',16)}<span>배경음악</span><span class="m-sw ${bgmOn?'on':''}"><i></i></span></button></header>
    <main class="tt-main">
      <div class="tt-icon">${pmIcon(96)}</div>
      <p class="tt-eyebrow">프로야구 매니저 PM 2026</p>
      <h1 class="tt-h">내 손으로 만드는<br>우승 구단</h1>
      <p class="tt-p">라인업부터 FA·드래프트·재정까지,<br>감독이 되어 144경기와 가을야구를 이끌어 보세요.</p>
      ${td?`<button class="tt-save" onclick="contGame()">${crest(td.id,48)}<span class="tt-sv"><small>이어하기</small><b>${esc(td.name)}</b><span>${esc(sv.mgr||'')} 감독 · ${fmtDate(sv.date)} · ${sv.w}승 ${sv.l}패${sv.d?' '+sv.d+'무':''}</span></span>${tic('chev',22)}</button>`:''}
      <div class="tt-cta"><button class="tt-go ${td?'alt':''}" onclick="startStep='teams';renderStart()">${td?'새 게임 시작':'시작하기'}</button>
        <label class="tt-sub" id="titleLoad">${tic('file',18)}<span>저장 파일 불러오기</span><input type="file" accept=".json,application/json" onchange="importSave(this.files[0])"></label></div>
      <ul class="tt-feats">
        <li><span class="tt-fi">${tic('team')}</span><div><b>10개 구단 · 260명</b><span>구단마다 다른 예산·팬·목표</span></div></li>
        <li><span class="tt-fi">${tic('ball')}</span><div><b>실시간 경기 중계</b><span>투구 하나하나에 작전 지시</span></div></li>
        <li><span class="tt-fi">${tic('swap')}</span><div><b>FA · 드래프트 · 트레이드</b><span>스토브리그까지 1년 내내</span></div></li>
        <li><span class="tt-fi">${tic('chart')}</span><div><b>FM식 능력치 200</b><span>숨은 능력과 성장까지</span></div></li>
      </ul>
    </main>
    <footer class="tt-foot">비공식 팬 메이드 게임 · 구단과 선수는 모두 가상이에요</footer>
  </div>`;
}; }
if(!S) renderStart();
