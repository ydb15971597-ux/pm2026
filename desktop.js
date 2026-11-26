// 프로야구 매니저 PM — PC UI (토스의 깔끔한 화면 + FM의 정보 구조)
// 1100px 이상에서 body.pc 를 붙이고, 왼쪽 사이드바(FM 메뉴 그룹 전체)와 큰 제목 상단 바로 바꾼다.
// 페이지 내용(PAGES.*)은 그대로 쓰고, 모양은 index.html 끝 'PC' 블록에서만 바꾼다. mobile.js 다음에 로드.
const PC_Q = window.matchMedia('(min-width: 1101px)');
const isPC = () => PC_Q.matches;
const PC_GI = { portal:'home', squad:'squad', scout:'scout', train:'tactics', club:'won' };
function pcChrome(){
  document.body.classList.toggle('pc', isPC() && !!S);
  document.querySelectorAll('.d-side').forEach(e=>e.remove());
  if(!S || !isPC()) return;
  const app=document.getElementById('app'); if(!app) return;
  const u=S.teams[S.user], unread=S.inbox.filter(m=>!m.read).length;
  const grp = PAGE_GROUP[page] || PAGE_GROUP[prevPage] || 'portal';
  const menus = MENUS.map(m=>({...m, items:m.items.filter(([p])=>p!=='offseason'||S.phase==='off')}));
  const side=document.createElement('aside'); side.className='d-side'; side.setAttribute('aria-label','메뉴');
  side.innerHTML = `<button class="d-brand" onclick="if(!LV) quit()" aria-label="메인 화면으로">${pmIcon(34)}<span><b>프로야구 매니저</b><small>PM 2026</small></span></button>
    <button class="d-club" onclick="go('club')">${crest(S.user,44)}<span><b>${esc(tname(S.user))}</b><small>${esc(S.mgrName)} 감독 · ${S.year}</small></span></button>
    <div class="d-rec"><div><small>순위</small><b>${rankOf(S.user)}<i>위</i></b></div><div><small>성적</small><b>${u.w}-${u.l}${u.t?'-'+u.t:''}</b></div><div><small>잔고</small><b>${Math.round(u.balance)}<i>억</i></b></div></div>
    <nav class="d-nav">${menus.map(m=>`<div class="d-grp ${m.k===grp?'on':''}"><div class="d-gh">${typeof mi==='function'?mi(PC_GI[m.k]||'more',18,2):''}<span>${m.l}</span></div>
      ${m.items.map(([p,l])=>`<a href="#" class="${page===p||(page==='player'&&p===prevPage)?'on':''}" onclick="go('${p}');return false">${l}${p==='inbox'&&unread?`<i class="d-n">${unread}</i>`:''}</a>`).join('')}</div>`).join('')}</nav>
    <div class="d-foot"><button onclick="BGM.toggle();render()"><span>배경음악</span><span class="m-sw ${typeof BGM!=='undefined'&&BGM.on?'on':''}"><i></i></span></button></div>`;
  app.insertBefore(side, app.firstChild);
  // 상단 바: 큰 제목 + 상위 메뉴 이름
  const tb1=document.querySelector('.tb1');
  if(tb1 && !tb1.querySelector('.d-title')){
    const title = page==='player'&&P(curPlayer) ? P(curPlayer).name : page==='coach' ? (coachObj()?.name||'코치') : (PAGE_LABEL[page]||'');
    const gl = MENUS.find(m=>m.k===grp)?.l||'';
    const t=document.createElement('div'); t.className='d-title';
    t.innerHTML = `${histB.length?`<button class="d-back" aria-label="뒤로" onclick="histBack()">${typeof mi==='function'?mi('back',22,2.4):'‹'}</button>`:''}<div><small>${esc(gl)}</small><b>${esc(title)}</b></div>`;
    tb1.insertBefore(t, tb1.querySelector('.sp'));
  }
}
(function(){ const _r=render; render=function(){ _r(); try{ pcChrome(); }catch(e){ console.error(e); } };
  let was=isPC(); PC_Q.addEventListener?.('change',()=>{ if(isPC()!==was){ was=isPC(); render(); } });
  if(S) render();
})();
