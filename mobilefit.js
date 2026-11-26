// 프로야구 매니저 PM — 모바일 맞춤 (760px 이하, mobile.js 다음에 로드)
// 1) 긴 화면은 위쪽 칩 탭으로 섹션을 나눠 한 번에 하나만 보여 준다 → 세로 스크롤 줄이기
// 2) 화면보다 넓은 표는 줄마다 카드처럼 접어서 보여 준다 → 가로 스크롤 없애기
let mSec = {};   // 화면별로 고른 섹션
const MSEC_SKIP = new Set(['inbox','view','player','coach','pregame','schedule','standings','savefile','entry']);   // entry: 1군↔퓨처스 드래그를 위해 한 화면
// 서로 끌어다 놓는 섹션은 한 탭에 묶는다 (라인업↔벤치, 로테이션↔투수진)
const MSEC_GROUPS = { tactics: [['타선', /라인업|수비 배치|벤치|야수/], ['투수진', /로테이션|불펜|투수진/], ['작전·플랜', /전술|분석|플랜/]] };
function mTitle(el){ const h=el.querySelector(':scope > h3, :scope > .row h3, :scope > div > h3'); if(!h) return ''; const c=h.cloneNode(true); c.querySelectorAll('button,select,a,.mute,small,span.pill').forEach(x=>x.remove()); return c.textContent.replace(/\s+/g,' ').trim().slice(0,14); }
function mSections(){
  const c=document.getElementById('content'); if(!c || MSEC_SKIP.has(page)) return;
  const all=[...c.querySelectorAll('.panel, .card')].filter(el=>!el.parentElement.closest('.panel, .card') && !el.closest('.m-sum') && el.offsetParent!==null);
  let secs=all.map(el=>({el, t:mTitle(el)})).filter(x=>x.t);
  const G=MSEC_GROUPS[page];
  if(G){ secs=secs.map(x=>{ const g=G.find(([,re])=>re.test(x.t)); return g?{el:x.el, t:g[0]}:null; }).filter(Boolean); }
  else { const seen={}; secs.forEach(x=>{ seen[x.t]=(seen[x.t]||0)+1; if(seen[x.t]>1) x.t+=' '+seen[x.t]; }); }
  const names = G ? G.map(g=>g[0]).filter(n=>secs.some(x=>x.t===n)) : [...new Set(secs.map(x=>x.t))];
  if(names.length<2 || (names.length<3 && c.scrollHeight<2200 && !G)) return;
  let cur = mSec[page]; if(!names.includes(cur)) cur = names[0];
  secs.forEach(x=>{ x.el.classList.toggle('msec-hide', x.t!==cur); });
  // 섹션을 다 숨긴 빈 칸(그리드 열) 정리
  [...c.querySelectorAll('.grid, .dash, .dcol, .mid2, .cl-2, .cl-3, .bcards')].forEach(g=>{ const vis=[...g.children].some(ch=>!ch.classList.contains('msec-hide') && ch.offsetHeight>0); g.classList.toggle('msec-empty', !vis); });
  const bar=document.createElement('div'); bar.className='msec'; bar.setAttribute('role','tablist');
  bar.innerHTML = names.map(n=>`<button role="tab" aria-selected="${n===cur}" class="${n===cur?'on':''}">${esc(n)}</button>`).join('');
  [...bar.children].forEach((b,i)=>b.onclick=()=>{ mSec[page]=names[i]; render(); scrollTo(0,0); });
  c.insertBefore(bar, c.firstChild);
  requestAnimationFrame(()=>bar.querySelector('.on')?.scrollIntoView({inline:'center', block:'nearest'}));
}
function mTables(){
  const c=document.getElementById('content'); if(!c) return;
  c.querySelectorAll('table').forEach(tb=>{
    if(tb.closest('.msec-hide')) return;
    const box=tb.parentElement; if(!box) return;
    if(tb.scrollWidth <= Math.min(box.clientWidth, innerWidth-24) + 6) return;
    let hr = tb.tHead?.rows[tb.tHead.rows.length-1];
    if(!hr){ const r0=tb.rows[0]; if(r0 && [...r0.cells].every(c=>c.tagName==='TH')){ hr=r0; r0.classList.add('mc-head'); } }   // thead 없이 첫 줄이 머리글인 표
    const heads=[...(hr?.cells||[])].map(th=>th.textContent.trim());
    tb.classList.add('mcard');
    // 카드가 길어지지 않게 덜 중요한 칸부터 숨김 (이름 + 핵심 5칸 정도만)
    const MINOR=['상태','투타','특성','주요 능력','컨디션','국적','계약','연봉','잔여','키','체중','성격','등번호','학년','학교'];
    const keep=new Set(heads.map((h,i)=>i)); let extra=heads.filter(Boolean).length-6;
    for(const m of MINOR){ if(extra<=0) break; const i=heads.indexOf(m); if(i>=0){ keep.delete(i); extra--; } }
    [...tb.tBodies].forEach(b=>[...b.rows].forEach(tr=>[...tr.cells].forEach((td,i)=>{ if(heads[i] && !td.dataset.l) td.dataset.l = heads[i]==='포지션' ? '' : heads[i]; const txt=[...td.childNodes].filter(n=>!(n.classList&&n.classList.contains('mute'))).map(n=>n.textContent).join('').trim(); if(!txt && !td.querySelector('button,select,input,svg,.stars,.pn')) td.classList.add('mc-x'); if(!keep.has(i) && !td.querySelector('button,select,input,.pn')) td.classList.add('mc-x'); })));
  });
}
(function(){ const _r=render; render=function(){ _r(); try{ if(S && typeof isMobile==='function' && isMobile()){ mSections(); mTables(); } else if(S && page!=='home'){ mSections(); } }catch(e){ console.error(e); } }; if(S) render(); })();
