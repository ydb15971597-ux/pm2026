// 프로야구 매니저 PM — 구단 운영 확장
// 재정(실제 구단 매출 기반)·이사회 예산·경쟁균형세 / 프런트·코치진 / 마케팅 / 해외 스카우트 / 고교·대학 신인 드래프트(9월)
// 퓨처스(2군)·1군 엔트리 / 스토브리그(주 단위 FA)·마무리캠프·스프링캠프·시범경기
// engine.js 다음에 로드된다. engine.js의 일부 함수는 여기서 교체(재할당)한다.

const r1 = v => Math.round(v*10)/10;
const md = () => S.date.slice(5);
const ENTRY_MAX = 28, ROSTER_MAX_USER = 52, ROSTER_MAX_AI = 48, ROSTER_FILL = 40;

// ---------- 실제 재정 기준 ----------
// 2025 회계연도 감사보고서(금융감독원 전자공시, 2026.4 연합뉴스 집계) 매출·영업손익, 단위 억 원
const CLUB_FIN = {
  LG:{rev:860, raw:967.6, op:-24.9, note:'모기업 스포츠 법인(농구단 포함) 매출 967.6억 중 야구단 몫을 860억으로 추정'},
  HH:{rev:746.4, op:-1.6}, SSG:{rev:722.0, op:49.3}, SS:{rev:948.3, op:-1.9, note:'계열사 광고 수입 292.2억 (매출의 30.8%)'},
  NC:{rev:546.8, op:4.7}, KT:{rev:800, raw:982.4, op:-5.6, note:'모기업 스포츠 법인(농구·e스포츠 포함) 매출 982.4억 중 야구단 몫을 800억으로 추정'},
  LT:{rev:810.8, op:165.6, note:'입장 수입 232억 · 상품 등 사업 수입 249억 (2025)'}, KIA:{rev:768.4, op:-5.3},
  OB:{rev:795.3, op:87.1}, WO:{rev:507.8, op:85.1, naming:true, note:'모기업 없이 네이밍 스폰서·선수 판매로 운영'}};
const TV_SHARE = 100;                       // 중계권·리그 공동 수익 배분 (게임용 추정)
const TICKET = 0.00019, BIZ = 0.00013;      // 관중 1명당 입장 수입 1.9만 원, 상품·식음 1.3만 원 (억 단위)
const capOf = y => ({2026:143.97, 2027:151.17, 2028:158.73}[y] ?? r1(158.73*Math.pow(1.05, y-2028)));  // 경쟁균형세 상한(외국인·신인 제외 상위 40명)
const F_RULE = {newCap:14, totalCap:56, aqCap:2.8, slots:3, replace:2, lastDay:'08-15'}; // 신규 외국인 100만$, 3명 합계 400만$, 아시아쿼터 20만$ (1$=1,400원)
const FIN_LABEL = {gate:'입장 수입', biz:'상품·식음 수입', tv:'중계권·리그 배분', spon:'광고·스폰서', parent:'모기업·계열사 지원', post:'포스트시즌 수입', sale:'기타 수입',
  pay:'선수 연봉', staff:'코칭스태프·프런트 인건비', op:'구장·원정·운영비', mkt:'마케팅비', ev:'팬 이벤트', trans:'계약금·이적료', comp:'보상금·위약금', camp:'캠프 비용', scout:'스카우트 출장비', tax:'야구발전기금(경쟁균형세)'};
const REV_KEYS = ['gate','biz','tv','spon','parent','post','sale'];

function ledg(t, k, v){ t.fy ||= {}; t.fy[k]=(t.fy[k]||0)+v; t.balance+=v; if(v>0) t.rev+=v; else t.exp-=v; }
const payroll = t => teamPlayers(t).reduce((s,p)=>s+p.salary,0);
const staffCost = t => Object.values(t.staff).reduce((s,c)=>s+(c.sal||0),0) + 30;   // 30억: 기타 프런트·지원 인력
const capHit = p => p.salary + (p.bonus||0)/(p.cyrs||1);
function capTotal(t){ return teamPlayers(t).filter(p=>!p.foreign && p.debutYear!==S.year).map(capHit).sort((a,b)=>b-a).slice(0,40).reduce((s,v)=>s+v,0); }
const transUsed = t => -((t.fy?.trans||0)+(t.fy?.comp||0));

// ---------- 마케팅 ----------
const PRICE = {
  '할인':{pm:0.85, fill:0.06, mood:0.02, d:'티켓 15% 인하 — 관중↑, 팬 만족도 서서히 상승'},
  '표준':{pm:1, fill:0, mood:0, d:'리그 평균 가격'},
  '다이내믹':{pm:1.08, fill:-0.01, mood:0, d:'경기·요일별 변동 가격 — 마케팅팀장 능력이 높을수록 수익↑'},
  '프리미엄':{pm:1.22, fill:-0.06, mood:-0.02, d:'티켓 22% 인상 — 수익↑, 관중·팬 만족도 하락'}};
const MKT_FOCUS = {
  '지역 밀착':'연고지 학교·지역 행사, 사회공헌 — 팬 열정·인내심 상승, 팬층 서서히 확대',
  'SNS·유튜브':'구단 채널·숏폼·선수 콘텐츠 — 젊은 팬 유입으로 팬층 확대, 상품 판매 소폭↑',
  '굿즈·유니폼':'유니폼·콜라보 굿즈 강화 — 상품·식음 수입 최대 +25%',
  '가족·어린이':'어린이 회원·패밀리석 — 관중 +4%, 팬 인내심 상승',
  '스폰서 영업':'광고·후원 영업 강화 — 스폰서 수입 최대 +12%',
  '스타 마케팅':'간판스타 중심 홍보 — 팀 최고 선수 능력만큼 관중·상품 수입 증가'};
const MKT_EVENTS = {
  '레전드 데이':{cost:1.5, mood:5, fill:0.08, days:6, d:'구단 레전드 초청 — 팬 만족도 +5, 1주간 관중 +8%'},
  '불꽃 축제':{cost:1.0, mood:3, fill:0.12, days:3, d:'경기 후 불꽃놀이 — 3경기 관중 +12%'},
  '팬 사인회':{cost:0.3, mood:2, morale:3, days:0, d:'선수단 사인회 — 팬 만족도 +2, 선수 사기 +3'},
  '스페셜 유니폼 데이':{cost:2.0, mood:3, fill:0.05, biz:0.4, days:6, d:'한정 유니폼 출시 — 1주간 상품 수입 +40%'},
  '유소년 야구교실':{cost:0.5, passion:1.5, patience:1, days:0, d:'연고지 유소년 야구교실 — 팬 열정·인내심 상승'}};
function mktEff(t){ const base=(t.fin?.rev0||600)*0.025, head=t.staff['마케팅팀장']?.rating??10; return Math.sqrt(Math.max(0,t.mkt.spend)/base)*(0.7+head/40); }
const hasF = (t,f) => t.mkt?.focus?.includes(f);
function starPow(t){ const top=Math.max(...teamPlayers(t).map(CA)); return clamp((top-140)/40,0,1.2); }
function evOn(t){ const e=t.mkt?.ev; return e && S.phase==='regular' && S.dayIdx<e.until ? MKT_EVENTS[e.name] : null; }
function fillOf(t, wp){
  const f=t.fans, e=mktEff(t), ev=evOn(t);
  let v = 0.35 + f.size/220 + (t.fanMood-50)/180 + (wp-0.5)*0.6 + f.passion/600 + PRICE[t.mkt.price].fill;
  if(hasF(t,'가족·어린이')) v+=0.04*e; if(hasF(t,'스타 마케팅')) v+=0.03*e*starPow(t); if(ev?.fill) v+=ev.fill;
  return clamp(v,0.25,1);
}
function priceMul(t){ const p=PRICE[t.mkt.price]; return t.mkt.price==='다이내믹' ? 1+((t.staff['마케팅팀장']?.rating??10)-6)*0.012 : p.pm; }
function bizMul(t){ const e=mktEff(t), ev=evOn(t); return 1 + (hasF(t,'굿즈·유니폼')?0.25*e:0) + (hasF(t,'SNS·유튜브')?0.05*e:0) + (hasF(t,'스타 마케팅')?0.15*e*starPow(t):0) + (ev?.biz||0); }
function sponMul(t){ const e=mktEff(t); return 1 + (hasF(t,'스폰서 영업')?0.12*e:0) + ((t.staff['마케팅팀장']?.rating??10)-10)*0.005 + (S.phase==='regular'&&t.w+t.l>10?(6-rankOf(t.id))*0.008:0); }
function runEvent(name){
  const u=S.teams[S.user], ev=MKT_EVENTS[name];
  if(S.phase!=='regular') return '정규시즌 홈경기 기간에만 열 수 있습니다.';
  if(u.mkt.ev && S.dayIdx < u.mkt.ev.cd) return `다음 이벤트는 ${u.mkt.ev.cd-S.dayIdx}경기일 뒤에 열 수 있습니다.`;
  if(u.balance < ev.cost) return '잔고가 부족합니다.';
  ledg(u,'ev',-ev.cost); u.mkt.ev={name, until:S.dayIdx+ev.days, cd:S.dayIdx+ev.days+6};
  if(ev.mood) u.fanMood=clamp(u.fanMood+ev.mood,0,100);
  if(ev.morale) teamPlayers(u).forEach(p=>p.morale=clamp(p.morale+ev.morale,20,100));
  if(ev.passion) u.fans.passion=clamp(u.fans.passion+ev.passion,10,100);
  if(ev.patience) u.fans.patience=clamp(u.fans.patience+ev.patience,10,100);
  save(); return null;
}

// ---------- 프런트·코치진 ----------
const STAFF_ROLES = {
  수석:{g:'코치', at:['지도력','전술','동기부여'], m:1.3, d:'선수단 사기·작전 수행 (경기력 소폭)'},
  투수:{g:'코치', at:['지도력','투수 지도','동기부여'], m:1, d:'투수 능력 성장'},
  타격:{g:'코치', at:['지도력','타격 지도','동기부여'], m:1, d:'타자 컨택·파워·선구안 성장'},
  수비:{g:'코치', at:['지도력','수비 지도','규율'], m:0.9, d:'수비·송구 성장'},
  주루:{g:'코치', at:['지도력','주루 지도','전술'], m:0.8, d:'주루 성장·도루 성공률'},
  배터리:{g:'코치', at:['지도력','포수 지도','투수 지도'], m:0.9, d:'포수 성장·투수 제구 보정'},
  트레이닝:{g:'코치', at:['체력 관리','의학','규율'], m:0.8, d:'부상 예방·컨디션 회복'},
  퓨처스감독:{g:'코치', at:['지도력','유망주 육성','동기부여'], m:1.1, d:'2군(퓨처스) 선수 성장'},
  단장:{g:'프런트', at:['협상','판단력','인맥'], m:1.6, d:'FA·트레이드 협상력, 이사회 예산 협상'},
  운영팀장:{g:'프런트', at:['행정','협상','관리'], m:0.8, d:'구장·원정 운영비 절감'},
  국내스카우트:{g:'프런트', at:['능력 판단','잠재력 판단','인맥'], m:0.7, d:'고교·대학 유망주 평가 정확도'},
  해외스카우트:{g:'프런트', at:['능력 판단','잠재력 판단','인맥'], m:0.7, d:'해외 선수 평가 정확도·발굴 인원'},
  전력분석:{g:'프런트', at:['분석력','데이터','소통'], m:0.7, d:'상대 분석으로 경기력 소폭 상승'},
  마케팅팀장:{g:'프런트', at:['기획','홍보','협상'], m:0.8, d:'마케팅 효과·스폰서 수입'},
  의무팀장:{g:'프런트', at:['의학','재활','체력 관리'], m:0.9, d:'부상 회복 속도·부상 예방'},
  매니저:{g:'프런트', at:['소통','관리','동기부여'], m:0.5, d:'선수단 매니저 — 선수 사기·외국인 적응'}};
const roleName = r => STAFF_ROLES[r].g==='코치' && r!=='퓨처스감독' ? r+'코치' : r;
function staffSal(role, rating){ return r1((0.35 + rating*rating*0.008)*STAFF_ROLES[role].m); }
function mkStaff(role, rating, rr=R, name){
  const at={}; for(const k of STAFF_ROLES[role].at) at[k]=Math.round(clamp(rating+(rr()*2-1)*2.5,3,20));
  const rt = Math.round(Object.values(at).reduce((a,b)=>a+b,0)/STAFF_ROLES[role].at.length);
  return {name:name||genName(rr), role, age:(STAFF_ROLES[role].g==='코치'?38:32)+Math.floor(rr()*24), rating:rt, at, sal:staffSal(role,rt), yrs:1+Math.floor(rr()*3)};
}
refreshCoachMarket = function(){
  const roles=Object.keys(STAFF_ROLES); S.coachMarket=[];
  for(let i=0;i<16;i++){ const role=roles[i%roles.length===i?i:Math.floor(R()*roles.length)]; const rt=Math.round(7+Math.pow(R(),1.3)*12);
    const c=mkStaff(role, rt); c.ask=r1(c.sal*(1.05+R()*0.2)); c.yrs=1+Math.floor(R()*3); S.coachMarket.push(c); }
};
function hireStaff(i){
  const c=S.coachMarket[i], u=S.teams[S.user], cur=u.staff[c.role];
  const comp = cur && !cur.acting ? r1(cur.sal*Math.max(cur.yrs,0)*0.5) : 0;
  if(u.balance < comp) return '잔고가 부족해 기존 계약 해지 위약금을 낼 수 없습니다.';
  if(comp) ledg(u,'comp',-comp);
  u.staff[c.role] = {...c, sal:c.ask}; delete u.staff[c.role].ask; S.coachMarket.splice(i,1);
  mail('프런트',`${roleName(c.role)} 교체`,`${c.name} ${roleName(c.role)}이(가) ${c.yrs}년 계약(연 ${c.ask}억)으로 합류했습니다.${comp?`\n전임자 계약 해지 위약금 ${comp}억을 지급했습니다.`:''}`,'staff');
  save(); return null;
}
function fireStaff(role){
  const u=S.teams[S.user], cur=u.staff[role]; if(cur.acting) return '이미 대행 체제입니다.';
  const comp=r1(cur.sal*Math.max(cur.yrs,0)*0.5); ledg(u,'comp',-comp);
  u.staff[role] = {...mkStaff(role,7), name:'내부 승격', acting:true, sal:0.3, yrs:1};
  mail('프런트',`${roleName(role)} 해임`,`${cur.name} ${roleName(role)}을(를) 해임했습니다. 위약금 ${comp}억. 후임을 뽑기 전까지 대행 체제(능력 7)로 운영합니다.`,'staff');
  save(); return null;
}
function renewStaff(role){
  const u=S.teams[S.user], c=u.staff[role]; if(!c.expiring) return;
  c.sal=r1(c.sal*1.08+0.1); c.yrs=2; c.expiring=false;
  mail('프런트',`${roleName(role)} 재계약`,`${c.name}과(와) 2년 재계약했습니다 (연 ${c.sal}억).`,'staff'); save();
}
function staffTick(){ // 시즌 종료 시 계약 1년 차감
  for(const t of Object.values(S.teams)) for(const role in t.staff){ const c=t.staff[role]; if(c.acting) continue;
    c.yrs--; c.age++;
    if(c.yrs<=0){
      if(t.id===S.user){ c.expiring=true; c.yrs=0; }
      else if(R()<0.7){ c.yrs=1+Math.floor(R()*3); c.sal=r1(c.sal*1.05); }
      else t.staff[role]=mkStaff(role, Math.round(clamp(c.rating+(R()*6-3),6,19)));
    } }
  const exp=Object.values(S.teams[S.user].staff).filter(c=>c.expiring);
  if(exp.length) mail('프런트','스태프 계약 만료',`계약이 끝난 스태프: ${exp.map(c=>`${c.name}(${roleName(c.role)})`).join(', ')}\n2월 1일 스프링캠프 시작 전까지 프런트·코치진 화면에서 재계약하지 않으면 팀을 떠납니다.`,'staff');
}

// ---------- 퓨처스(2군) / 1군 엔트리 ----------
const isExhib = () => S && S.phase==='off' && S.off?.stage==='exhib';
const act1 = t => teamPlayers(t).filter(p=>!p.farm);
function genFarm(t, pos, age, rr=R){
  const o=6.8+rr()*3.8, pot=clamp(o+1+Math.pow(rr(),1.5)*8,o+0.5,18);
  const p=mkPlayer(`${genName()}|${pos}|${rr()<0.3?'L':'R'}|${age}|${o.toFixed(1)}|${pot.toFixed(1)}|`, t.id, S.nextPid++);
  p.farm=true; p.salary=Math.max(0.3,Math.min(p.salary,0.6)); p.yrs=1; S.players[p.id]=p; t.roster.push(p.id); return p;
}
function fillFarm(t, target=ROSTER_FILL){
  const added=[];
  while(t.roster.length<target){
    const ps=teamPlayers(t), np=ps.filter(p=>p.isP).length, nc=ps.filter(p=>p.pos==='C').length;
    const pos = np<ps.length*0.45 ? (ps.filter(p=>p.pos==='SP').length<9?'SP':'RP') : nc<3 ? 'C' : pick(['SS','2B','3B','1B','IF','CF','LF','RF','OF']);
    added.push(genFarm(t,pos,19+Math.floor(R()*7)).name);
  }
  return added;
}
function autoEntry(t){
  const ps=teamPlayers(t), ok=p=>!(p.inj>10), sel=new Set();
  const spv=p=>ovrOf(p)+p.a.sta*0.15;
  ps.filter(p=>p.isP&&ok(p)&&p.pos==='SP').sort((a,b)=>spv(b)-spv(a)).slice(0,5).forEach(p=>sel.add(p.id));
  ps.filter(p=>p.isP&&ok(p)&&!sel.has(p.id)).sort((a,b)=>ovrOf(b)-ovrOf(a)).slice(0,13-sel.size).forEach(p=>sel.add(p.id));
  ps.filter(p=>p.pos==='C'&&ok(p)).sort((a,b)=>ovrOf(b)-ovrOf(a)).slice(0,2).forEach(p=>sel.add(p.id));
  ps.filter(p=>!p.isP&&ok(p)&&!sel.has(p.id)).sort((a,b)=>ovrOf(b)-ovrOf(a)).slice(0,ENTRY_MAX-sel.size).forEach(p=>sel.add(p.id));
  for(const p of ps) p.farm=!sel.has(p.id);
  if(t.id===S.user){ fixLineup(t); fixPitching(t); } else { autoLineup(t); autoPitching(t); }
}
function entryMove(pid, up){
  const u=S.teams[S.user], p=S.players[pid]; if(!p||p.team!==S.user) return '우리 선수가 아닙니다.';
  if(up){
    if(!p.farm) return '이미 1군입니다.';
    if(act1(u).length>=ENTRY_MAX) return `1군 엔트리가 가득 찼습니다(${ENTRY_MAX}명). 먼저 다른 선수를 말소하세요.`;
    if(S.phase==='regular' && p.downUntil && S.dayIdx<p.downUntil) return `${p.name}은(는) 말소 후 10일이 지나야 재등록할 수 있습니다 (${p.downUntil-S.dayIdx}일 남음).`;
    p.farm=false;
  } else {
    if(p.farm) return '이미 퓨처스입니다.';
    const rest=act1(u).filter(x=>x!==p);
    if(rest.filter(x=>!x.isP&&!x.inj).length<9 || rest.filter(x=>x.isP&&!x.inj).length<8) return '1군에 최소 야수 9명·투수 8명은 남겨야 합니다.';
    p.farm=true; if(S.phase==='regular') p.downUntil=S.dayIdx+10;
    u.lineup=u.lineup.filter(x=>x.pid!==pid); u.rotation=u.rotation.filter(x=>x!==pid); if(u.closer===pid) u.closer=null; u.setup=u.setup.filter(x=>x!==pid);
  }
  validateTeam(u,false); save(); return null;
}
function ensureEntry(u){ // 1군 인원이 부족하면 자동 보충
  const a=act1(u); let moved=[];
  const need=(f,n)=>{ while(act1(u).filter(f).filter(p=>!p.inj).length<n){ const c=teamPlayers(u).filter(p=>p.farm&&!p.inj&&f(p)).sort((x,y)=>ovrOf(y)-ovrOf(x))[0]; if(!c) break; c.farm=false; moved.push(c.name); } };
  need(p=>!p.isP,10); need(p=>p.isP,10);
  while(act1(u).length>ENTRY_MAX){ const w=act1(u).filter(p=>p.inj).sort((x,y)=>y.inj-x.inj)[0]||act1(u).sort((x,y)=>ovrOf(x)-ovrOf(y))[0]; w.farm=true; moved.push(`${w.name}(말소)`); }
  if(moved.length){ validateTeam(u,false); mail('코치진','엔트리 자동 조정',`부상·이동으로 1군 인원이 모자라거나 넘쳐 엔트리를 조정했습니다: ${moved.join(', ')}`,'staff'); }
}
function devMul(t,p){
  let m = 0.9 + (t.mgr.dev||10)/100;
  if(p.pers==='노력파') m*=1.1;
  m *= 0.82+hv(p,'pro')/55;
  if(p.farm){ const fc=t.staff['퓨처스감독']?.rating??10; m *= (0.8+fc/50)*(p.age<=25?1.12:0.85); }
  else if(p.age<=28 && S.phase==='regular'){ const sh=playShare(p,t); if(sh!=null) m *= p.age<=22 ? 0.65+0.85*sh : p.age<=25 ? 0.75+0.6*sh : 0.9+0.25*sh; }   // 어릴수록 출전 시간이 성장에 큰 영향
  return m*(S.campMul||1);
}
function injTeam(t){ return (1.15-(t.staff['의무팀장']?.rating??10)/60) * (t.campEff && S.date<t.campEff.until ? t.campEff.inj : 1); }
function medBonus(p){ const t=S.teams[p.team]; if(!t) return 0; return clamp(((t.staff['의무팀장']?.rating??10)-6)/40,0,0.35); }
function campTac(t){ return t.campEff && S.date<t.campEff.until ? (t.campEff.tac||0) : 0; }
function farmWeek(t){ // 퓨처스리그 기록 (주 5경기 가량)
  for(const p of teamPlayers(t)){ if(!p.farm||p.inj) continue; const f=p.fst ||= {g:0,ab:0,h:0,hr:0,outs:0,er:0,k:0};
    if(p.isP){ const outs=p.pos==='SP'?15+Math.floor(R()*4):6+Math.floor(R()*5); const era=clamp(6.5-(ovrOf(p)-8)*0.45,1.2,10);
      f.g+=p.pos==='SP'?1:3; f.outs+=outs; f.er+=Math.round(era*outs/27*(0.5+R())); f.k+=Math.round(outs/3*(0.6+p.a.stf/25)*(0.7+R()*0.6)); }
    else { const ab=15+Math.floor(R()*6); const pr=clamp(0.19+(batVal(p)-8)*0.012,0.12,0.42); let h=0; for(let i=0;i<ab;i++) if(R()<pr) h++;
      f.g+=5; f.ab+=ab; f.h+=h; f.hr+= R()<clamp((p.a.pow-7)*0.05,0,0.6)?1+(R()<0.2?1:0):0; } }
}

// ---------- 외국인 / 해외 스카우트 ----------
const AQ_NAT = new Set(['일본','대만','호주','중국','필리핀','홍콩','인도네시아']);
const AQ_INIT = {'라클란 웰치':'호주','왕옌창':'대만','다케다 소타':'일본','미야지 유마':'일본','도다 나오키':'일본','스기모토 코우지':'일본','교야마 마사키':'일본','데인':'호주','다무라 이치타':'일본','가나쿠보 유키':'일본'};
const OV_LEAGUES = {
  MLB:{n:'MLB (40인 로스터)', lv:[13.8,16.8], age:[26,32], pm:1.7, fee:[2,6], will:0.35, cost:1.2, nat:['미국','미국','도미니카','베네수엘라','쿠바','푸에르토리코','캐나다']},
  AAA:{n:'마이너리그 트리플A', lv:[12.2,15.4], age:[25,31], pm:1.0, fee:[0,1.4], will:0.8, cost:1.0, nat:['미국','미국','도미니카','베네수엘라','쿠바','푸에르토리코']},
  AA:{n:'마이너리그 더블A', lv:[10,13.2], age:[22,26], pm:0.75, fee:[0,0.7], will:0.85, cost:0.8, pot:3, nat:['미국','도미니카','베네수엘라']},
  NPB:{n:'일본 NPB 1군', lv:[13.2,16.2], age:[26,33], pm:1.5, fee:[1.5,5], will:0.45, cost:0.8, nat:['일본','일본','일본','미국','도미니카']},
  NPB2:{n:'일본 NPB 2군·육성', lv:[10.5,13.4], age:[21,28], pm:0.7, fee:[0,1], will:0.85, cost:0.6, pot:2, nat:['일본']},
  JIL:{n:'일본 독립리그', lv:[9,12], age:[21,29], pm:0.45, fee:[0,0], will:0.95, cost:0.5, nat:['일본']},
  CPBL:{n:'대만 CPBL', lv:[11,14.2], age:[23,32], pm:0.65, fee:[0,1], will:0.85, cost:0.4, nat:['대만','대만','대만','미국','도미니카']},
  LMB:{n:'멕시코 리그', lv:[11.5,14.2], age:[25,33], pm:0.75, fee:[0,0.5], will:0.9, cost:0.7, nat:['멕시코','쿠바','도미니카','베네수엘라','미국']},
  LIDOM:{n:'도미니카 윈터리그', lv:[11,14.6], age:[23,31], pm:0.85, fee:[0,1], will:0.85, cost:0.8, nat:['도미니카','도미니카','베네수엘라','미국']},
  ABL:{n:'호주 ABL', lv:[9.5,12.8], age:[20,30], pm:0.45, fee:[0,0], will:0.95, cost:0.6, nat:['호주','호주','미국']},
  IND:{n:'미국 독립리그', lv:[10,12.8], age:[24,31], pm:0.5, fee:[0,0], will:0.95, cost:0.6, nat:['미국','도미니카','캐나다']}};
const AQ_LEAGUES = new Set(['NPB','NPB2','JIL','CPBL','ABL']);
const NAMES = {
  미국:[['잭','콜','헌터','브렛','트레버','데릭','칼렙','브래들리','오언','개빈','로건','에번','코디','와일리','앤드루','네이선'],['파커','헤이스','브래넌','윈터스','콜먼','라이트','캘러헌','던컨','에머리','셸턴','포스터','길버트','하딩','로웰','매덕스','스톤']],
  캐나다:[['리암','노아','에단','조엘'],['맥케이','부셰','트렘블레이','캠벨']],
  도미니카:[['라파엘','후안','페드로','프란시스코','라몬','엔리케','넬슨','윌리','에우헤니오','프랭클린'],['바티스타','카스티요','메디나','폴랑코','소토마요르','아브레우','베리오스','타베라스','에스피날','몬테로']],
  베네수엘라:[['헤수스','오를란도','알베르토','루이스','안헬','엘비스'],['우르비나','실바','아코스타','콘트레라스','에레라','로하스']],
  쿠바:[['요안','야시엘','레오넬','오스바니'],['세스페데스','아르멘테로스','델가도','피네다']],
  푸에르토리코:[['하비에르','엑토르','카를로스'],['리베라','오르티스','콜론']],
  멕시코:[['마누엘','이그나시오','헤라르도','파블로'],['구티에레스','나바로','살라사르','오초아']],
  일본:[['유토','하루키','쇼타','다이키','겐타','료','가이토','소타','렌','히로토','유마','다쿠미'],['사토','다나카','스즈키','다카하시','와타나베','이토','나카무라','고바야시','가토','요시다','마쓰모토','이노우에','기무라','하야시']],
  대만:[['위룬','즈하오','보원','청언','자하오','쯔칭','이판','쥔하오','관위'],['린','천','황','장','리','우','류','차이','양','쉬']],
  호주:[['리암','해리슨','블레이크','코너','조시','미첼'],['오코너','리드','맥도널드','켈리','캠벨','브라운']]};
function ovName(nat){ const [f,l]=NAMES[nat]||NAMES['미국']; return (nat==='일본'||nat==='대만') ? `${pick(l)} ${pick(f)}` : `${pick(f)} ${pick(l)}`; }
function ovAsk(p, L){ const ca=CA(p); return {sal:r1(clamp(Math.pow(Math.max(ca-95,0)/10,2)*0.22*L.pm+1.5,1,40)), yrs:1, bonus:0, fee:r1(L.fee[0]+R()*(L.fee[1]-L.fee[0]))}; }
function genOverseas(lg, skill=10){
  const L=OV_LEAGUES[lg], nat=pick(L.nat), isP=R()<0.55;
  const pos = isP ? (R()<0.65?'SP':'RP') : pick(['1B','LF','RF','3B','CF','DH','2B','SS','C']);
  const o = L.lv[0]+Math.pow(R(),1.25)*(L.lv[1]-L.lv[0]), age=L.age[0]+Math.floor(R()*(L.age[1]-L.age[0]+1));
  const pot = clamp(o+(L.pot||0)*R()+(age<=25?R()*2:0)+0.3,o,19.5);
  const tags = isP ? pick(['K','L','B','','K']) : pick(['P','C','PE','','P','S']);
  const p = mkPlayer(`${ovName(nat)}|${pos}|${R()<0.3?'L':'R'}|${age}|${o.toFixed(1)}|${pot.toFixed(1)}|${tags}`, 'OV', S.nextPid++);
  p.foreign=true; p.team=null; p.nat=nat; p.lg=lg; p.aqOK = AQ_NAT.has(nat) && AQ_LEAGUES.has(lg); p.ask=ovAsk(p,L); p.yrs=1;
  if(p.aqOK){ p.askReg={...p.ask}; const fee=Math.min(p.ask.fee,0.4); p.ask={...p.ask, fee, sal:r1(Math.min(p.ask.sal, F_RULE.aqCap-fee))}; }
  p.salary=p.ask.sal;
  p.sk = Math.round(clamp(30+skill*2.5+R()*10,20,95)); p.snz=R()*2-1; p.ovStat=ovStats(p, L);
  S.players[p.id]=p; return p;
}
function ovStats(p, L){ // 현지 리그 지난 시즌 기록 — 약한 리그일수록 기록이 좋아 보인다
  const d = ovrOf(p) - (L.lv[0]+L.lv[1])/2;
  if(p.isP){ const sp=p.pos==='SP'; const ip=Math.round(sp?110+R()*60:45+R()*25);
    return {ip, era:clamp(4.3-d*0.5-(p.a.ctl-12)*0.05+(R()-0.5)*0.8,1.2,7.5).toFixed(2), k9:clamp(7+(p.a.stf-11)*0.35+d*0.25,4,13).toFixed(1), w:sp?Math.round(ip/16+d*1.5):Math.round(R()*5), top:kmh(p)+Math.round(R()*3)}; }
  const g=Math.round(100+R()*40); const avg_=clamp(0.262+d*0.013+(p.a.con-12)*0.004+(R()-0.5)*0.02,0.19,0.36);
  return {g, avg:avg_.toFixed(3).replace(/^0/,''), hr:Math.max(0,Math.round((p.a.pow-7)*2.1+d*2.2+(R()-0.5)*5)), ops:clamp(0.72+d*0.04+(p.a.pow-11)*0.012,0.52,1.15).toFixed(3)};
}
const estV = (p,v,k,scale) => v + p.snz*(100-k)/100*scale;
function estRange(p, v, k, scale){ const c=estV(p,v,k,scale), w=(100-k)/100*scale*0.7; return [Math.round(c-w), Math.round(c+w)]; }
function fCounts(t, ex=[]){ const f=teamPlayers(t).filter(p=>p.foreign && !ex.includes(p.id)); const reg=f.filter(p=>!p.aq);
  return {reg:reg.length, aq:f.length-reg.length, regP:reg.filter(p=>p.isP).length, regH:reg.filter(p=>!p.isP).length, regSal:reg.reduce((s,p)=>s+p.salary,0)}; }
function slotFor(t, p, sal, fee=0, want){ // 외국인 등록 가능한 슬롯: 'reg' | 'aq' | 오류 메시지
  const c=fCounts(t);
  const regOK = c.reg<F_RULE.slots && (p.isP ? c.regP<2 : c.regH<2);
  const aqOK = p.aqOK && c.aq<1 && sal+fee<=F_RULE.aqCap+1e-9;
  if(want==='aq') return aqOK ? 'aq' : (!p.aqOK?'아시아쿼터 대상(아시아 국적·아시아/호주 리그 출신)이 아닙니다.':c.aq>=1?'아시아쿼터 1명이 이미 있습니다.':`아시아쿼터 계약은 총액 ${F_RULE.aqCap}억(20만 달러) 이하여야 합니다.`);
  if(regOK){
    if(!p.faFrom && sal+fee>F_RULE.newCap+1e-9) return `신규 외국인 선수 첫해 총액(연봉+이적료)은 ${F_RULE.newCap}억(100만 달러)을 넘을 수 없습니다.`;
    if(c.regSal+sal>F_RULE.totalCap+1e-9) return `외국인 3명 연봉 합계 상한 ${F_RULE.totalCap}억(400만 달러)을 넘습니다 (현재 ${r1(c.regSal)}억).`;
    return 'reg';
  }
  if(aqOK) return 'aq';
  if(p.aqOK && c.aq<1) return `아시아쿼터로 등록하려면 연봉+이적료가 ${F_RULE.aqCap}억(20만 달러) 이하여야 합니다 (지금 ${r1(sal+fee)}억).`;
  return c.reg>=F_RULE.slots ? `외국인 선수 3명이 모두 차 있습니다${p.aqOK?' (아시아쿼터 자리도 차 있어요)':''}. 먼저 한 명을 방출하세요.` : `같은 유형(${p.isP?'투수':'타자'}) 외국인은 2명까지입니다.`;
}
foreignCount = t => teamPlayers(t).filter(p=>p.foreign).length;
function startMission(lg){
  const u=S.teams[S.user], L=OV_LEAGUES[lg];
  if(u.ovs.mission) return '이미 해외 출장 중인 스카우트가 있습니다.';
  if(u.balance<L.cost) return '잔고가 부족합니다.';
  ledg(u,'scout',-L.cost); u.ovs.mission={lg, end:addDays(S.date,14), start:S.date}; save(); return null;
}
function checkMission(){
  const u=S.teams[S.user], m=u.ovs?.mission; if(!m || S.date<m.end) return;
  const sc=u.staff['해외스카우트'].rating, n=3+Math.floor(sc/6), got=[];
  for(let i=0;i<n;i++){ const p=genOverseas(m.lg, sc); p.scoutedBy=S.user; u.ovs.cands.push(p.id); got.push(p); }
  u.ovs.mission=null;
  mail('해외 스카우트',`${OV_LEAGUES[m.lg].n} 스카우트 보고서`,`${u.staff['해외스카우트'].name} 스카우트가 ${got.length}명의 영입 후보를 추렸습니다.\n${got.map(p=>`· ${p.name} (${p.nat}, ${POS_KO[p.pos]}, ${p.age}세) — 요구 연봉 ${p.ask.sal}억${p.ask.fee?` · 이적료 ${p.ask.fee}억`:''}${p.aqOK?' · 아시아쿼터 가능':''}`).join('\n')}\n\n스카우트 화면에서 평가와 현지 기록을 확인하세요.`,'staff');
}
function followUp(pid){
  const u=S.teams[S.user], p=S.players[pid]; if(!p) return;
  if(u.balance<0.2) return '잔고가 부족합니다.';
  if(p.skDate===S.date) return '오늘은 이미 추가 관찰했습니다.';
  ledg(u,'scout',-0.2); p.sk=Math.min(95,p.sk+10+u.staff['해외스카우트'].rating*0.6); p.skDate=S.date; save(); return null;
}
function signOverseas(pid, sal, want){
  const u=S.teams[S.user], p=S.players[pid]; if(!p||p.team) return '이미 계약한 선수입니다.';
  if(S.phase==='post') return '포스트시즌 중에는 외국인 선수를 영입할 수 없습니다.';
  if(S.phase==='regular'){ if(md()>F_RULE.lastDay) return '8월 15일 이후에는 외국인 선수를 새로 등록할 수 없습니다.'; if((u.fRep||0)>=F_RULE.replace) return '올 시즌 외국인 교체 횟수(2회)를 모두 썼습니다.'; }
  if(p.noUntil && S.date<p.noUntil) return `${p.name} 측이 협상을 거부했습니다. ${p.noUntil} 이후 다시 시도하세요.`;
  const fee=(want==='reg'&&p.askReg?p.askReg.fee:p.ask.fee)||0, slot=slotFor(u,p,sal,fee,want); if(slot!=='reg'&&slot!=='aq') return slot;
  if(payroll(u)+sal>u.bud.wage) return `연봉 예산 초과 (예산 ${u.bud.wage}억, 현재 ${r1(payroll(u))}억). 재정 화면에서 예산을 조정하세요.`;
  if(fee && transUsed(u)+fee>u.bud.trans) return `영입 예산이 부족합니다 (남은 영입 예산 ${r1(u.bud.trans-transUsed(u))}억).`;
  const L=OV_LEAGUES[p.lg]||{will:0.8}; const gm=u.staff['단장'].rating; const ask = slot==='reg' && p.askReg ? p.askReg.sal : p.ask.sal;
  const prob = clamp((slot==='aq'?0.9:L.will)*Math.pow(sal/ask,4)*(1+(gm-10)*0.02) + (sal>=ask?0.25:0), 0, 0.97);
  if(R()>prob){ p.noUntil=addDays(S.date,7); save(); return `${p.name} 측: "그 조건으로는 한국행을 결정하기 어렵습니다." (요구 연봉 ${ask}억 · 수락 가능성 약 ${Math.round(prob*100)}% · 1주 뒤 재협상 가능)`; }
  p.team=S.user; p.aq = slot==='aq'; p.salary=sal; p.yrs=1; p.cyrs=1; p.bonus=0; p.faFrom=null; p.morale=72; p.farm=act1(u).length>=ENTRY_MAX; u.roster.push(p.id); if(!p.farm) rebalanceEntry(u,p);
  u.ovs.cands=u.ovs.cands.filter(x=>x!==pid); if(S.off) S.off.pool=S.off.pool.filter(x=>x!==pid);
  if(fee) ledg(u,'trans',-fee);
  if(S.phase==='regular') u.fRep=(u.fRep||0)+1;
  mail('프런트',`외국인 선수 영입: ${p.name}`,`${p.name}(${p.nat}, ${POS_KO[p.pos]})과(와) 연봉 ${sal}억${fee?` · 이적료 ${fee}억`:''}에 계약했습니다${p.aq?' (아시아쿼터)':''}.${p.farm?'\n1군 엔트리가 가득 차 퓨처스에 등록했습니다.':''}`,'info');
  validateTeam(u,false); save(); return null;
}

// ---------- 신인 드래프트 (고교·대학, 9월) ----------
const HS_LIST = [['덕수고','서울'],['서울고','서울'],['휘문고','서울'],['장충고','서울'],['충암고','서울'],['배재고','서울'],['신일고','서울'],['경기고','서울'],['선린인터넷고','서울'],['성남고','서울'],['배명고','서울'],['경동고','서울'],
  ['유신고','경기'],['야탑고','경기'],['부천고','경기'],['장안고','경기'],['소래고','경기'],['인천고','인천'],['제물포고','인천'],['동산고','인천'],
  ['강릉고','강원'],['원주고','강원'],['북일고','충청'],['청주고','충청'],['세광고','충청'],['대전고','충청'],['공주고','충청'],
  ['광주일고','호남'],['동성고','호남'],['진흥고','호남'],['전주고','호남'],['군산상일고','호남'],['화순고','호남'],
  ['경북고','영남'],['대구고','영남'],['상원고','영남'],['경주고','영남'],['포항제철고','영남'],['마산고','영남'],['마산용마고','영남'],['김해고','영남'],
  ['부산고','영남'],['경남고','영남'],['개성고','영남'],['부경고','영남'],['제주고','제주']];
const UNI_LIST = [['고려대','서울',4],['연세대','서울',4],['성균관대','경기',4],['한양대','서울',4],['동국대','서울',4],['단국대','경기',4],['경희대','경기',4],['홍익대','서울',4],
  ['인하대','인천',4],['건국대','서울',4],['중앙대','서울',4],['동의대','영남',4],['원광대','호남',4],['경성대','영남',4],['강릉영동대','강원',2],['송원대','호남',2]];
const CITY_REGION = {서울:'서울',인천:'인천',수원:'경기',대전:'충청',대구:'영남',부산:'영남',창원:'영남',광주:'호남'};
function genProspect2(){
  const hs=R()<0.74, isP=R()<0.52;
  const [school,region,yr] = hs ? [...pick(HS_LIST),3] : pick(UNI_LIST);
  const pos = isP ? pick(['SP','SP','RP']) : pick(['C','SS','SS','2B','3B','CF','RF','LF','1B','IF','OF']);
  const o = hs ? 5.5+R()*4 : 7.2+R()*3.8;
  // 잠재력 등급: 특급 2% · 상위 8% · 중간 30% · 하위 60% (별 5개급은 몇 년에 한 명)
  const r=R(); let pot = r<0.003 ? 18.5+R() : r<0.02 ? 16.5+R()*1.8 : r<0.10 ? 14.5+R()*2 : r<0.40 ? 12+R()*2.5 : 9+R()*3;
  if(!hs) pot=Math.min(pot,16.5);   // 대학 선수: 현재 능력은 높지만 상한은 낮다
  pot = clamp(Math.max(pot, o+1), 7, 19.6);
  const tags = isP ? pick(['K','L','B','','','K']) : pick(['P','C','S','D','E','','']);
  const age = hs ? 18+(R()<0.12?1:0) : (yr===2?20:22);
  const p = mkPlayer(`${genName()}|${pos}|${R()<0.3?'L':'R'}|${age}|${o.toFixed(1)}|${pot.toFixed(1)}|${tags}`, 'DR', S.nextPid++);
  p.team=null; p.prospect=true; p.school=school; p.schoolType=hs?'고교':(yr===2?'대학(2년제)':'대학'); p.region=region; p.salary=0.3; p.yrs=1;
  p.dnz=R()*2-1; p.dk = Math.round(18+R()*12 + (region===CITY_REGION[TD(S.user).city]?15:0));
  const d = ovrOf(p)-(hs?7.7:9.1);
  p.amStat = isP ? {ip:Math.round(30+R()*45), era:clamp(2.6-d*0.45+(R()-0.5)*0.9,0.4,6).toFixed(2), k:Math.round((30+R()*45)*(0.9+p.a.stf/18)), top:kmh(p)+Math.round(R()*3)}
                 : {g:Math.round(22+R()*14), avg:clamp(0.31+d*0.03+(R()-0.5)*0.05,0.2,0.5).toFixed(3).replace(/^0/,''), hr:Math.max(0,Math.round((p.a.pow-6)*0.6+d+(R()-0.5)*3)), sb:Math.max(0,Math.round((p.a.stl-6)*1.2+(R()-0.5)*4))};
  S.players[p.id]=p; return p;
}
function makeDraftClass(){ const pool=[]; for(let i=0;i<130;i++) pool.push(genProspect2().id); return {year:S.year, pool, watch:[], done:false, active:false, picks:[], idx:0, log:[]}; }
// 스카우트 추정: 잘 모를수록 평균 쪽으로 보수적으로 (관찰할수록 실제 값에 가까워짐)
const dEst = p => { const k=p.dk/100; return Math.round(clamp(120 + (p.PA-120)*(0.3+0.7*k) + p.dnz*(1-k)*18, 40, 200)); };
const dEstCA = p => { const k=p.dk/100; return Math.round(clamp(75 + (CA(p)-75)*(0.4+0.6*k) + p.dnz*(1-k)*12, 20, 200)); };
function draftWatch(pid){ const d=S.dclass; const i=d.watch.indexOf(pid); if(i>=0) d.watch.splice(i,1); else { if(d.watch.length>=10) return '집중 관찰은 10명까지 지정할 수 있습니다.'; d.watch.push(pid); } save(); return null; }
function scoutWeek(){ const d=S.dclass; if(!d||d.done) return; const sc=S.teams[S.user].staff['국내스카우트'].rating;
  for(const id of d.pool){ const p=S.players[id]; if(!p) continue; p.dk=Math.min(95, p.dk + (d.watch.includes(id) ? 4+sc*0.4 : 0.8+sc*0.08)); } }
const DRAFT_ROUNDS = 11;
const BONUS = r => [3.5,1.8,1.2,0.9,0.7,0.6,0.5,0.4,0.35,0.3,0.3][r-1];
function startDraftSept(){
  const d=S.dclass; if(!d||d.done||d.active) return;
  const prev = S.prevFinal || TEAM_DATA.slice().sort((a,b)=>a.prevRank-b.prevRank).map(t=>t.id);
  const order = prev.slice().reverse(); const pen = order.filter(id=>S.teams[id].taxPen);
  const r1o = [...order.filter(id=>!pen.includes(id)), ...pen];
  d.picks=[]; for(let r=0;r<DRAFT_ROUNDS;r++) for(const t of (r===0?r1o:order)) d.picks.push(t);
  d.idx=0; d.active=true; d.log=[];
  mail('리그 사무국',`${S.year+1} 신인 드래프트`,`오늘 ${S.year+1} 신인 드래프트가 열립니다 (${DRAFT_ROUNDS}라운드, 전년도 순위 역순).\n우리 지명 순번: 1라운드 ${r1o.indexOf(S.user)+1}순위 외 라운드별 ${order.indexOf(S.user)+1}순위.\n신인 드래프트 화면에서 직접 지명하세요. 지명 선수는 시즌이 끝난 뒤 마무리캠프부터 합류합니다.`,'board');
  draftRun();
}
const dAvail = () => S.dclass.pool.map(id=>S.players[id]).filter(p=>p && p.prospect);
function dPick(tid, p){
  const d=S.dclass, r=Math.floor(d.idx/10)+1, n=d.idx%10+1, t=S.teams[tid];
  if(p){ p.prospect=false; p.draftedBy=tid; p.debutYear=S.year+1; const b=r1(BONUS(r)+(r===1?[1.5,1,0.5][n-1]||0:0)); p.bonus=b; p.cyrs=1; ledg(t,'trans',-b);
    d.log.push({r, n, tid, pid:p.id, text:`${r}R ${n}순위 ${tShort(tid)} — ${p.name} (${POS_KO[p.pos]}, ${p.school})`}); }
  else d.log.push({r, n, tid, pid:null, text:`${r}R ${n}순위 ${tShort(tid)} — 지명 포기`});
  d.idx++;
}
function aiDraft(tid){
  const t=S.teams[tid], av=dAvail(), r=Math.floor(S.dclass.idx/10)+1;
  const mine = S.dclass.log.filter(x=>x.tid===tid&&x.pid).length;
  if(!av.length || (r>=8 && t.roster.length+mine>=ROSTER_MAX_AI-2)) return dPick(tid,null);
  const nz=(20-(t.staff['국내스카우트']?.rating??10))*2.5;
  const v=p=>p.PA*0.75+CA(p)*0.25+(R()*2-1)*nz;
  dPick(tid, av.sort((a,b)=>v(b)-v(a))[0]);
}
function draftRun(){ const d=S.dclass; while(d.idx<d.picks.length && d.picks[d.idx]!==S.user) aiDraft(d.picks[d.idx]); if(d.idx>=d.picks.length) endDraftSept(); save(); }
function userDraft(pid){ const d=S.dclass; if(!d.active||d.picks[d.idx]!==S.user) return; const p=S.players[pid]; if(!p||!p.prospect) return; dPick(S.user,p); draftRun(); }
function userDraftPass(){ const d=S.dclass; if(!d.active||d.picks[d.idx]!==S.user) return; dPick(S.user,null); draftRun(); }
function userDraftAuto(all){ const d=S.dclass; do{ if(d.picks[d.idx]!==S.user) break; const p=dAvail().sort((a,b)=>(dEst(b)*0.75+dEstCA(b)*0.25)-(dEst(a)*0.75+dEstCA(a)*0.25))[0]; dPick(S.user,p||null); draftRun(); }while(all && d.active); }
function endDraftSept(){
  const d=S.dclass; d.active=false; d.done=true;
  for(const id of d.pool){ const p=S.players[id]; if(p && p.prospect) delete S.players[id]; }
  d.pool=d.pool.filter(id=>S.players[id]);
  const mine=d.log.filter(x=>x.tid===S.user&&x.pid);
  mail('국내 스카우트','드래프트 종료',`우리 구단 지명 선수 (${mine.length}명, 계약금 합계 ${r1(mine.reduce((s,x)=>s+S.players[x.pid].bonus,0))}억):\n${mine.map(x=>x.text).join('\n')}\n\n지명 선수는 시즌 종료 후 마무리캠프부터 합류합니다.`,'staff');
}

// ---------- 재정 초기화 / 주간 / 정산 ----------
function initFin(t){
  const cf=CLUB_FIN[t.id], td=TD(t.id), rev=cf.rev;
  const fill0=clamp(0.35+t.fans.size/220+(60-50)/180+t.fans.passion/600,0.25,1);
  const gate0=72*td.cap*fill0*TICKET, biz0=72*td.cap*fill0*BIZ;
  let spon=rev*0.12, parent=Math.max(0, rev-gate0-biz0-TV_SHARE-spon);
  if(cf.naming){ spon=Math.max(rev*0.08, rev-gate0-biz0-TV_SHARE); parent=0; }
  t.mkt ||= {price:'표준', spend:Math.round(rev*0.025), focus:['지역 밀착'], ev:null};
  const op = Math.max(rev*0.15, rev - cf.op - payroll(t) - staffCost(t) - t.mkt.spend - 8 - rev*0.04);
  t.fin = {rev0:rev, spon, parent, op};
  t.fy = {}; t.rev=0; t.exp=0;
  t.balance = r1(rev*0.06);
}
function newBudget(t){
  const lastRev = t.fyPrev ? REV_KEYS.reduce((s,k)=>s+(t.fyPrev[k]||0),0) : t.fin.rev0;
  const revEst = lastRev*0.6 + t.fin.rev0*0.4;
  t.bud = {wage:Math.round(Math.max(payroll(t)*1.02, revEst*0.2)*(0.92+t.board/600)), trans:Math.round(revEst*0.055*(0.8+t.board/250)), mktMax:Math.round(revEst*0.05), req:false, year:S.year+(S.phase==='off'?1:0)};
}
function moveBudget(amt){ const u=S.teams[S.user]; amt=+amt; if(!amt) return null;
  if(amt>0 && u.bud.trans-transUsed(u)<amt) return '남은 영입 예산보다 많이 옮길 수 없습니다.';
  if(amt<0 && u.bud.wage+amt<payroll(u)) return '연봉 예산을 현재 연봉 총액보다 낮출 수 없습니다.';
  u.bud.wage=r1(u.bud.wage+amt); u.bud.trans=r1(u.bud.trans-amt); save(); return null; }
function requestBudget(){
  const u=S.teams[S.user]; if(u.bud.req) return '올해는 이미 예산 증액을 요청했습니다.';
  u.bud.req=true; const gm=u.staff['단장'].rating;
  const ch=clamp((u.board-40)/60+(gm-10)*0.03,0.05,0.9);
  if(R()<ch){ u.bud.wage=Math.round(u.bud.wage*1.08); u.bud.trans=Math.round(u.bud.trans*1.25);
    mail('이사회','예산 증액 승인',`이사회가 증액을 승인했습니다. 연봉 예산 ${u.bud.wage}억 · 영입 예산 ${u.bud.trans}억.`,'board'); save(); return null; }
  u.board=clamp(u.board-3,0,100); mail('이사회','예산 증액 거절',`이사회는 "현재 재정 상황에서 추가 지출은 어렵다"며 요청을 거절했습니다. (신뢰도 -3)`,'board'); save(); return '이사회가 증액 요청을 거절했습니다.';
}
function clubWeekly(t){
  // 연간 고정 수입·지출을 정규시즌 24주에 나눠 반영
  ledg(t,'tv',TV_SHARE/24); ledg(t,'spon',t.fin.spon*sponMul(t)/24); if(t.fin.parent) ledg(t,'parent',t.fin.parent/24);
  ledg(t,'pay',-payroll(t)/24); ledg(t,'staff',-staffCost(t)/24);
  ledg(t,'op',-t.fin.op*(1-((t.staff['운영팀장']?.rating??10)-10)*0.004)/24); ledg(t,'mkt',-t.mkt.spend/24);
  // 팬층 변화
  const f=t.fans, e=mktEff(t), wp=t.w+t.l?t.w/(t.w+t.l):0.5;
  f.size=clamp(f.size+(wp-0.5)*0.5+e*((hasF(t,'SNS·유튜브')?0.12:0)+(hasF(t,'지역 밀착')?0.05:0)+(hasF(t,'스타 마케팅')?0.05*starPow(t):0))-0.04,10,100);
  f.passion=clamp(f.passion+(hasF(t,'지역 밀착')?0.08*e:0)+(wp-0.5)*0.2-0.02,10,100);
  f.patience=clamp(f.patience+((hasF(t,'가족·어린이')?0.05:0)+(hasF(t,'지역 밀착')?0.04:0))*e-0.01,10,100);
  t.fanMood=clamp(t.fanMood+PRICE[t.mkt.price].mood*6,0,100);
  // 선수단 매니저: 사기 관리
  const mg=t.staff['매니저']?.rating??10;
  for(const p of teamPlayers(t)) p.morale=clamp(p.morale+(70-p.morale)*0.04+(mg-10)*0.05+(p.foreign?(mg-10)*0.05+(hv(p,'adp')-10)*0.06:0),20,100);
  // 재정 상태 → 이사회
  if(t.balance<0) t.board=clamp(t.board-0.4,0,100);
  if(payroll(t)>t.bud.wage*1.05) t.board=clamp(t.board-0.3,0,100);
  farmWeek(t);
  if(t.id!==S.user) autoEntry(t); else persWeek(t);
}
function gateDay(){
  if(S.phase!=='regular') return;
  for(const [h] of S.schedule[S.dayIdx]){ const t=S.teams[h], td=TD(h), g=t.w+t.l||1;
    const att=Math.round(td.cap*fillOf(t,t.w/g)); t.lastAtt=att; t.attTotal=(t.attTotal||0)+att; t.homeG=(t.homeG||0)+1;
    ledg(t,'gate',att*TICKET*priceMul(t)); ledg(t,'biz',att*BIZ*bizMul(t)); }
}
function postGate(g){
  const t=S.teams[g.home], td=TD(g.home); const att=Math.round(td.cap*Math.min(1,fillOf(t,0.6)+0.25));
  ledg(t,'post',att*TICKET*priceMul(t)*1.8+att*BIZ*bizMul(t)); ledg(S.teams[g.away],'post',3);
}
function settleSeason(){
  for(const t of Object.values(S.teams)){
    const cap=capOf(S.year), tot=capTotal(t);
    if(tot>cap){ t.taxCnt=(t.taxCnt||0)+1; const x=tot-cap, fee=r1(x*(t.taxCnt>=2?1:0.5)); ledg(t,'tax',-fee); t.taxPen = t.taxCnt>=2;
      if(t.id===S.user) mail('리그 사무국','경쟁균형세 초과',`연봉 상위 40명 합계 ${r1(tot)}억이 상한 ${cap}억을 ${r1(x)}억 넘었습니다.\n야구발전기금 ${fee}억을 냈습니다.${t.taxCnt>=2?'\n2회 연속 초과로 다음 신인 드래프트 1라운드 지명권이 맨 뒤로 밀립니다.':''}`,'board'); }
    else { t.taxCnt=0; t.taxPen=false; }
    if(t.balance<0){ const aid=r1(-t.balance+t.fin.rev0*0.02); ledg(t, t.fin.parent?'parent':'sale', aid);
      if(t.id===S.user){ t.board=clamp(t.board-5,0,100); mail('이사회',t.fin.parent?'모기업 긴급 지원':'긴급 자금 조달',`누적 적자로 잔고가 바닥나 ${t.fin.parent?'모기업이':'구단이 선수 판매·추가 스폰서로'} ${aid}억을 지원했습니다. 이사회는 재정 관리에 경고를 보냈습니다. (신뢰도 -5)`,'board'); } }
    t.fyPrev={...t.fy}; t.fyPrevYear=S.year;
  }
  const u=S.teams[S.user], fy=u.fy, inc=REV_KEYS.reduce((s,k)=>s+(fy[k]||0),0), out=Object.keys(fy).filter(k=>!REV_KEYS.includes(k)).reduce((s,k)=>s-(fy[k]||0),0), pr=inc-out;
  u.board=clamp(u.board+(pr>=0?3:pr<-u.fin.rev0*0.05?-6:-2),0,100);
  mail('재무팀',`${S.year} 시즌 결산`,`<b>수입 ${r1(inc)}억 · 지출 ${r1(out)}억 · 손익 ${pr>=0?'+':''}${r1(pr)}억</b>\n\n${Object.keys(fy).sort((a,b)=>fy[b]-fy[a]).map(k=>`${FIN_LABEL[k]||k}: ${fy[k]>0?'+':''}${r1(fy[k])}억`).join('\n')}\n\n잔고 ${r1(u.balance)}억. ${pr>=0?'흑자 운영에 이사회가 만족합니다.':'적자 폭에 이사회가 우려를 표했습니다.'}`,'board');
  for(const t of Object.values(S.teams)){ t.fy={}; t.rev=0; t.exp=0; newBudget(t); }
  mail('이사회',`${S.year+1} 시즌 예산 배정`,`연봉 예산 <b>${u.bud.wage}억</b> (현재 선수 연봉 ${r1(payroll(u))}억)\n영입 예산(계약금·이적료) <b>${u.bud.trans}억</b>\n마케팅 예산 상한 ${u.bud.mktMax}억\n\n재정 화면에서 연봉 예산과 영입 예산 사이로 금액을 옮기거나 증액을 요청할 수 있습니다.`,'board');
}

// ---------- 초기화 / 저장 호환 ----------
function initClub(){
  for(const t of Object.values(S.teams)){
    const td=TD(t.id), rr=srng(hash(t.id+'club'));
    t.fans ||= {...(td._f0||td.fans)};
    for(const role in STAFF_ROLES){ const c=t.staff[role];
      const base=Math.round(clamp(9+rr()*7+(CLUB_FIN[t.id].rev-650)/120,6,18));
      if(!c) t.staff[role]=mkStaff(role, base, rr);
      else if(!c.at){ const n=mkStaff(role, c.rating, rr, c.name); n.rating=c.rating; t.staff[role]=n; } }
    for(const p of teamPlayers(t)) if(p.foreign && AQ_INIT[p.name]){ p.aq=true; p.nat=AQ_INIT[p.name]; p.aqOK=true; p.salary=Math.min(p.salary, r1(1.6+rr()*1.2)); }
    const reg=teamPlayers(t).filter(p=>p.foreign&&!p.aq), rs=reg.reduce((s,p)=>s+p.salary,0);
    if(rs>F_RULE.totalCap) reg.forEach(p=>p.salary=r1(p.salary*F_RULE.totalCap*0.97/rs));
    for(const p of teamPlayers(t)){ p.cyrs ??= p.yrs; p.bonus ??= 0; }
    fillFarm(t);
    t.mkt ||= null; initFin(t); newBudget(t);
    t.camp ||= {loc1:'일본(오키나와)', loc2:'일본(오키나와)', focus:'기술 훈련'}; t.fcamp ||= {loc:'국내', who:'유망주'};
    t.fRep=0; t.ovs={mission:null, cands:[]};
    autoEntry(t);
  }
  for(const p of Object.values(S.players)) if(p.team) persOf(p);
  S.dclass = makeDraftClass(); S.dclassV=2; S.fict=true; S.prevFinal = null;
  refreshCoachMarket();
  S.ver=4;
}
// 구단 전력 보정 (시뮬 결과를 2025 실제 순위권에 맞추기 위한 미세 조정, OVR 단위)
const TEAM_ADJ = {LG:-0.2, SS:-0.3, KT:-0.2, SSG:0.4, HH:0.2};
for(const td of TEAM_DATA){ const d=TEAM_ADJ[td.id]; if(!d || td._adj) continue; td._adj=true;
  td.players = td.players.map(str=>{ const f=str.split('|'); f[4]=String(Math.round((+f[4]+d)*10)/10); f[5]=String(Math.max(+f[4], Math.round((+f[5]+d)*10)/10)); return f.join('|'); }); }
for(const td of TEAM_DATA){ td._b0 ??= td.budget; td._f0 ??= td.fans; }
const _newGame = newGame;
newGame = function(userId, mgrName){
  for(const td of TEAM_DATA){ td.budget=td._b0; td.fans=td._f0; }
  _newGame(userId, mgrName); initClub();
  const u=S.teams[S.user], cf=CLUB_FIN[S.user];
  mail('재무팀','구단 재정 현황',`2025 회계연도 매출 ${cf.raw||cf.rev}억 · 영업${cf.op>=0?'이익':'손실'} ${Math.abs(cf.op)}억 (감사보고서 기준)${cf.note?`\n※ ${cf.note}`:''}\n\n올해 연봉 예산 <b>${u.bud.wage}억</b> · 영입 예산 <b>${u.bud.trans}억</b> · 경쟁균형세 상한 ${capOf(S.year)}억\n잔고 ${u.balance}억으로 시작합니다.`,'board');
  mail('국내 스카우트','2027 신인 드래프트 준비',`9월 신인 드래프트에 나올 고교·대학 선수 ${S.dclass.pool.length}명의 관찰을 시작했습니다.\n신인 드래프트 화면에서 집중 관찰 선수(최대 10명)를 지정하면 평가가 빨리 정확해집니다.`,'staff');
  save();
};
load = function(){
  let ok=false;
  try{ const raw=localStorage.getItem(SAVE_KEY); if(raw){ const x=JSON.parse(raw);
      if(x.ver===2){ for(const p of Object.values(x.players)) p.yrs ??= initYrs(p); x.ver=3; }
      if(x.ver===3 || x.ver===4){ S=x; ok=true; }
      else { alert('이전 버전 저장 파일이라 불러올 수 없습니다. 새 게임을 시작해주세요.'); return false; } } }catch(e){ console.error(e); }
  if(!ok) return false;
  if(S.dclass && !S.dclass.done && !S.dclass.active && S.dclassV!==2){ for(const id of S.dclass.pool) delete S.players[id]; S.dclass=makeDraftClass(); }
  S.dclassV=2;
  if(!S.fict){ for(const p of Object.values(S.players)){ const n=NAME_MAP_H[hash(p.name)] || (p.name.endsWith(')') ? (NAME_MAP_H[hash(p.name.slice(0,-3))]||'')+(NAME_MAP_H[hash(p.name.slice(0,-3))]?p.name.slice(-3):'') : ''); if(n) p.name=n; }
    for(const t of Object.values(S.teams)){ const n=NAME_MAP_H[hash(t.mgr.name)]; if(n) t.mgr.name=n; } { const n=NAME_MAP_H[hash(S.mgrName)]; if(n) S.mgrName=n; } S.fict=true; }
  if(!S.amateur){ const d=S.dclass; if(d && !d.done && !d.active){ for(const id of d.pool) delete S.players[id]; initAmateur(); S.dclass=makeDraftClass(); } else initAmateur(1); }
  for(const p of Object.values(S.players)) if(!p.team && p.aqOK && p.lg && !p.askReg){ p.askReg={...p.ask}; const fee=Math.min(p.ask.fee||0,0.4); p.ask={...p.ask, fee, sal:r1(Math.min(p.ask.sal, F_RULE.aqCap-fee))}; }
  if(S.ver===3 || !S.teams[S.user].fin){ initClub();
    if(S.phase==='off'){ const o=S.off||{}; const pool=(o.pool||[]).filter(id=>S.players[id]&&!S.players[id].team);
      for(const id of pool){ const p=S.players[id]; p.ask=askOf(p); if(p.foreign&&!p.faFrom){ p.lg='AAA'; p.sk=50; p.ovPool=true; } }
      S.off={stage:'stove', pool, offers:{}, log:o.log||[], week:0, retired:o.retired||[], exhib:null, fcampDone:0};
      S.dclass.done=true; S.prevFinal=S.finalRank?S.finalRank.slice():null; } mail('프런트','구단 운영 기능 추가','재정·마케팅·프런트·해외 스카우트·퓨처스·신인 드래프트(9월) 기능이 추가되었습니다. 저장 파일을 새 버전으로 변환했습니다.','info'); save(); }
  return true; };

// ---------- 하루/주간 훅 ----------
function clubDay(){
  gateDay();
  if(S.phase==='regular' && S.dclass && !S.dclass.done && !S.dclass.active && md()>='09-15') startDraftSept();
  checkMission(); allStar();
  if(S.phase==='regular') ensureEntry(S.teams[S.user]);
}
const _advanceDay = advanceDay;
advanceDay = function(cb){ if(S.dclass?.active) return null; if(S.phase==='off') return isExhib() ? advanceExhibDay(cb) : null; return _advanceDay(cb); };
const _postAfter = postAfter;
postAfter = function(g){ postGate(g); return _postAfter(g); };
const _endRegular = endRegular;
endRegular = function(){ if(S.dclass && !S.dclass.done && !S.dclass.active){ startDraftSept(); } S.prevFinal = null; _endRegular(); S.prevFinal = S.finalRank.slice(); };
const _doTrade = doTrade;
doTrade = function(give, get, otherId){ _doTrade(give,get,otherId); const u=S.teams[S.user];
  for(const id of get){ const p=S.players[id]; p.farm = act1(u).filter(x=>x!==p).length>=ENTRY_MAX; } autoEntry(S.teams[otherId]); validateTeam(u,false); };
tradeCheck = function(give, get, otherId){
  const o=S.teams[otherId], u=S.teams[S.user];
  if(give.some(id=>S.players[id]?.team!==S.user) || get.some(id=>S.players[id]?.team!==otherId)) return '선수 소속이 바뀌어 성사할 수 없습니다.';
  const fc=(t,inn,out)=>{ const ps=[...teamPlayers(t).filter(p=>!out.includes(p.id)), ...inn.map(id=>S.players[id])].filter(p=>p.foreign); const reg=ps.filter(p=>!p.aq);
    return reg.length>3 || ps.length-reg.length>1 || reg.filter(p=>p.isP).length>2 || reg.filter(p=>!p.isP).length>2; };
  if(fc(o,give,get) || fc(u,get,give)) return '외국인 보유 규정(외국인 3명·같은 유형 2명·아시아쿼터 1명)을 넘습니다.';
  if(o.roster.length-get.length+give.length<30 || u.roster.length-give.length+get.length<30) return '보류 선수 최소 인원(30명)을 지켜야 합니다.';
  return null;
};
releasePlayer = function(pid){
  const p=S.players[pid], u=S.teams[S.user]; if(!p||p.team!==S.user) return '우리 선수가 아닙니다.';
  if(u.roster.length<=30) return '보류 선수를 최소 30명은 유지해야 합니다.';
  const left = S.phase==='regular' ? (1-S.dayIdx/144) : S.phase==='off' ? 1 : 0;
  const owe = r1(p.salary*left + p.salary*Math.max(0,(p.yrs||1)-1)*(p.foreign?0:1));
  u.roster=u.roster.filter(id=>id!==pid); p.team=null; p.released=true;
  u.lineup=u.lineup.filter(x=>x.pid!==pid); if(u.closer===pid) u.closer=null; u.setup=u.setup.filter(x=>x!==pid); u.rotation=u.rotation.filter(x=>x!==pid);
  if(owe>0) ledg(u,'comp',-owe);
  fixLineup(u); fixPitching(u); if(S.phase==='regular') ensureEntry(u);
  mail('프런트',`방출: ${p.name}`,`${p.name}을(를) 방출했습니다. 잔여 연봉 ${owe}억을 지급했습니다.${p.foreign&&S.phase==='regular'?`\n외국인 교체 가능 횟수: ${F_RULE.replace-(u.fRep||0)}회 남음 (8월 15일까지).`:''}`,'info');
  save(); return null;
};

// ---------- 시즌 종료 → 스토브리그 ----------
endSeason = function(){
  S.phase='off';
  const champ=S.post.champion, u=S.teams[S.user], r=rankOf(S.user);
  const postRes = champ===S.user?'우승':(S.post.seeds.includes(S.user)?'포스트시즌 진출':'탈락');
  S.history.push({year:S.year, champ, rank:r, w:u.w, l:u.l, t:u.t, post:postRes});
  if(champ===S.user){ u.board=clamp(u.board+30,0,100); u.fanMood=clamp(u.fanMood+30,0,100); u.fans.size=clamp(u.fans.size+4,10,100); }
  else { const diff=u.goalRank-r; u.board=clamp(u.board+diff*4+(S.post.seeds.includes(S.user)?5:-5),0,100); }
  mail('리그 사무국', `${S.year} 한국시리즈 우승: ${TD(champ).name}`, `${S.post.log.join('\n')}\n\n<b>${TD(champ).name}이(가) ${S.year} 시즌 챔피언에 올랐습니다!</b>`, 'board');
  if(u.board<15){ S.fired=true; mail('이사회','경질 통보',`이사회는 성적 부진(${r}위)과 신뢰도 하락을 이유로 감독 계약 해지를 결정했습니다. 그동안 수고하셨습니다.`,'board'); return; }
  mail('이사회','시즌 총평',`최종 ${r}위, 목표는 ${goalText(u.goalRank)}였습니다. 이사회 신뢰도 ${Math.round(u.board)}.\n\n스토브리그가 시작됩니다.\n· 11월: 마무리캠프 · FA 시장 · 외국인 재계약\n· 12~1월: 비활동 기간 (FA·트레이드·해외 스카우트 계속)\n· 2월: 스프링캠프 → 3월 시범경기 → 3월 말 개막`,'board');
  beginOffseason();
};
function renewForeign(p){ p.yrs=1; p.cyrs=1; p.bonus=0; p.salary = p.aq ? Math.min(F_RULE.aqCap, r1(p.salary*1.1)) : clamp(r1(marketValue(p)*1.05),5,20); }
askOf = function(p){
  if(p.foreign) return {sal: p.aq?F_RULE.aqCap: clamp(r1(marketValue(p)*1.05),5,20), yrs:1, bonus:0, fee:0};
  const sal=r1(marketValue(p)*1.1*(0.95+hv(p,'amb')*0.006)), yrs=p.age<=29?4:p.age<=32?3:p.age<=35?2:1, ca=CA(p);
  return {sal, yrs, bonus: r1(sal*yrs*(ca>=140?0.5:ca>=120?0.3:0.1)), fee:0};
};
beginOffseason = function(){
  settleSeason();
  const retired=[];
  for(const p of Object.values(S.players)){
    if(!p.team) continue;
    p.age++;
    const gap=(p.PA-CA(p))/10;
    for(const k in p.a){
      if(k==='cat' && p.pos!=='C') continue;
      let d=0; if(p.age<=25) d=gap*0.12*R(); else if(p.age<=29) d=gap*0.06*R();
      if(p.age>=33) d -= (1.3-hv(p,'pro')/33)*(p.age-32)*0.18*R()*(['spd','stl','vel','rng'].includes(k)?1.4:['eye','ctl','brn'].includes(k)?0.5:1);
      growAttr(p,k,d);
    }
    p.m.cons=clamp(p.m.cons+0.2,1,20); p.m.lead=clamp(p.m.lead+(p.age>=28?0.3:0.1),1,20);
    if(p.m.lead>=17 && !has(p,'리더')) p.traits.push('리더');
    p.inj=0; p.cond=100; p.morale=70; p.rest=6; p.fat=0;
    const o=ovrOf(p);
    if((p.age>=40 && (o<13 || R()<0.4)) || (p.age>=36 && o<10.5) || p.age>=44 || (p.farm && p.age>=30 && o<9.5 && R()<0.6) || p.retireEnd) retired.push(p);
  }
  for(const p of retired){ const t=S.teams[p.team]; t.roster=t.roster.filter(id=>id!==p.id); p.team=null; p.retired=true; }
  const pool=[];
  for(const p of Object.values(S.players)){
    if(!p.team) continue;
    p.yrs=(p.yrs??1)-1; if(p.yrs>0) continue;
    const mine=p.team===S.user, renew=()=>{ p.yrs=1; p.cyrs=1; p.bonus=0; p.salary=Math.max(0.3,calcSalary(p)); };
    if(!p.foreign && (p.age<=27 || R()<0.45)){ renew(); continue; }
    if(!mine && p.foreign && ovrOf(p)>=13.5 && R()<0.8){ renewForeign(p); continue; }
    if(!mine && !p.foreign && CA(p)<118){ renew(); continue; }
    if(mine && !p.foreign && CA(p)<100){ renew(); continue; }
    const t=S.teams[p.team]; t.roster=t.roster.filter(id=>id!==p.id);
    p.faFrom=p.team; p.team=null; p.ask=askOf(p); pool.push(p.id);
  }
  // 신인 합류
  const joined={};
  for(const p of Object.values(S.players)){ if(!p.draftedBy || p.team) continue; const t=S.teams[p.draftedBy];
    p.team=t.id; p.farm=true; p.salary=0.3; p.yrs=1; p.cyrs=1; p.rookie=true; t.roster.push(p.id); (joined[t.id] ||= []).push(p.name); delete p.draftedBy; }
  // 해외 FA 시장 후보 (AI 구단도 영입)
  const lgs=Object.keys(OV_LEAGUES);
  for(let i=0;i<16;i++){ const p=genOverseas(pick(lgs), 10); p.sk=50; p.ovPool=true; pool.push(p.id); }
  staffTick(); refreshCoachMarket();
  for(const t of Object.values(S.teams)){ t.fRep=0; validateTeam(t,false); }
  S.off = {stage:'stove', pool, offers:{}, log:[], week:0, retired:retired.map(p=>p.name), exhib:null, fcampDone:0};
  S.date = addDays(S.date, 4);
  const mineFA = pool.map(id=>S.players[id]).filter(p=>p.faFrom===S.user);
  mail('프런트','스토브리그 개막 · FA 시장',`FA 자격을 얻은 선수와 해외 영입 후보 등 ${pool.length}명이 시장에 나왔습니다.\n${mineFA.length?`우리 팀 FA: <b>${mineFA.map(p=>p.name).join(', ')}</b> — 잡으려면 재계약 오퍼를 넣으세요.`:'우리 팀에서 FA가 된 선수는 없습니다.'}\n선수들은 매주 제안을 비교해 계약합니다. 대어급은 빨리 결정하는 경우가 많습니다.\n\n은퇴 선수: ${S.off.retired.slice(0,15).join(', ')}${S.off.retired.length>15?' 외':''}`,'info');
  if(joined[S.user]) mail('국내 스카우트','신인 선수 합류',`드래프트 지명 선수 ${joined[S.user].length}명이 마무리캠프에 합류했습니다: ${joined[S.user].join(', ')}\n(퓨처스 등록, 선수단 화면에서 확인)`,'staff');
  mail('코치진','마무리캠프 계획',`11월 마무리캠프 장소와 참가 대상을 캠프 화면에서 정해주세요. 젊은 선수 성장에 큰 영향을 줍니다.`,'staff');
  save();
};

// ---------- FA 시장 (주 단위) ----------
const askTotal = p => (p.ask.bonus||0)+p.ask.sal*p.ask.yrs;
const offTotal = o => (o.bonus||0)+o.sal*o.yrs;
teamNeed = function(t,p){
  let target;
  if(p.isP){ const rot=t.rotation.map(id=>S.players[id]).filter(Boolean), bp=[t.closer,...t.setup].map(id=>S.players[id]).filter(Boolean);
    const grp=p.pos==='SP'?rot:bp; target = grp.length<(p.pos==='SP'?5:3) ? 60 : Math.min(...grp.map(CA)); }
  else { const slot=t.lineup.find(x=>x.pos===p.pos)||null; const lus=t.lineup.map(x=>S.players[x.pid]).filter(Boolean);
    target = slot&&S.players[slot.pid] ? CA(S.players[slot.pid]) : (lus.length? Math.min(...lus.map(CA)) : 60); }
  let need = clamp((CA(p)-target)/40+0.12, 0, 0.8);
  if(p.foreign){ const s=slotFor(t,p,p.ask.sal,p.ask.fee||0); need = (s!=='reg'&&s!=='aq') ? 0 : need + (fCounts(t).reg<3?0.5:0.15); }
  if(t.roster.length>=ROSTER_MAX_AI) need*=0.4;
  return need;
};
appeal = function(tid,p){ const t=S.teams[tid]; return 1+((t.fans?.size??TD(tid).fans.size)-70)/500+(6-rankOf(tid))/80+(p.faFrom===tid?0.02+hv(p,'loy')*0.006:0)+(tid===S.user?((t.staff['단장']?.rating??10)-10)*0.01:0); };
function canSignUser(p, o){
  const u=S.teams[S.user];
  if(p.foreign){ const s=slotFor(u,p,o.sal,p.ask.fee||0,o.slot); if(s!=='reg'&&s!=='aq') return s; }
  const add = o.sal - (p.faFrom===S.user?0:0);
  if(payroll(u)+add>u.bud.wage) return `연봉 예산 초과 — 예산 ${u.bud.wage}억, 현재 연봉 총액 ${r1(payroll(u))}억. 재정 화면에서 예산을 조정하거나 증액을 요청하세요.`;
  const up=(o.bonus||0)+(p.ask.fee||0);
  if(up && transUsed(u)+up>u.bud.trans) return `영입 예산 부족 — 남은 영입 예산 ${r1(u.bud.trans-transUsed(u))}억 (계약금·이적료 ${r1(up)}억 필요).`;
  if(u.roster.length>=ROSTER_MAX_USER) return `보류 선수 최대 인원(${ROSTER_MAX_USER}명)이 찼습니다.`;
  return null;
}
makeOffer = function(pid, sal, yrs, bonus=0, slot){
  const p=S.players[pid]; if(!p||p.team) return {ok:false,msg:'이미 계약한 선수입니다.'};
  if(!S.off || S.off.stage!=='stove') return {ok:false,msg:'FA 협상은 스토브리그(11월~1월)에만 할 수 있습니다.'};
  sal=r1(Math.max(0.3,sal)); bonus=r1(Math.max(0,bonus)); if(p.foreign){ yrs=1; bonus=0; }
  const o={team:S.user, sal, yrs, bonus, slot};
  const err=canSignUser(p,o); if(err) return {ok:false,msg:err};
  if(offTotal(o) < askTotal(p)*0.7) return {ok:false,msg:`${p.name} 측: "그 금액이면 협상할 생각이 없습니다." (요구 총액 ${r1(askTotal(p))}억)`};
  S.off.offers[pid]=o; save();
  return {ok:true,msg:`${p.name}에게 ${yrs}년 총액 ${r1(offTotal(o))}억(계약금 ${bonus}억 + 연봉 ${sal}억) 오퍼를 넣었습니다. 다음 주 진행 때 답이 옵니다.`};
};
function withdrawOffer(pid){ delete S.off.offers[pid]; save(); }
function signFA(p, o, res){
  const t=S.teams[o.team], prevSal=p.salary;
  if(p.foreign){ const s=slotFor(t,p,o.sal,p.ask.fee||0,o.slot); if(s!=='reg'&&s!=='aq') return false; p.aq = s==='aq'; }
  p.team=o.team; t.roster.push(p.id); p.salary=o.sal; p.yrs=o.yrs; p.cyrs=o.yrs; p.bonus=o.bonus||0; p.morale=75; p.farm=false;
  ledg(t,'trans',-((o.bonus||0)+(p.ask.fee||0)));
  let comp='';
  if(p.faFrom && p.faFrom!==o.team && !p.foreign && CA(p)>=130){ const c=r1(prevSal*2); ledg(t,'comp',-c); ledg(S.teams[p.faFrom],'sale',c); comp=` · 보상금 ${c}억 → ${tShort(p.faFrom)}`; }
  const line=`${o.team===S.user?'✅':'•'} ${p.name} (${p.foreign?(p.aq?'아시아쿼터':'외국인'):POS_KO[p.pos]}, ${p.faFrom?tShort(p.faFrom):(p.lg?OV_LEAGUES[p.lg].n:'신규')} → <b>${tShort(o.team)}</b>) ${o.yrs}년 총액 ${r1(offTotal(o))}억${comp}`;
  S.off.log.push(line); res.push(line);
  const uo=S.off.offers[p.id]; if(uo && o.team!==S.user) res.push(`❌ ${p.name}: 우리 오퍼 대신 ${tShort(o.team)}을(를) 선택했습니다.`);
  delete S.off.offers[p.id];
  if(o.team===S.user){ p.farm = act1(t).filter(x=>x!==p).length>=ENTRY_MAX; if(!p.farm) rebalanceEntry(t,p); validateTeam(t,false); }
  return true;
}
function faWeek(final=false){
  const off=S.off, res=[]; off.week++;
  const pool=off.pool.map(id=>S.players[id]).filter(p=>p && !p.team).sort((a,b)=>CA(b)-CA(a));
  for(const p of pool){
    p.faWk=(p.faWk||0)+1; p.faWait ??= 1+Math.floor(R()*3);
    const decay=Math.pow(0.95,Math.max(0,p.faWk-2))*(final?0.75:1), askT=askTotal(p)*decay;
    const offers=[], uo=off.offers[p.id];
    if(uo){ const e=canSignUser(p,uo); if(e){ res.push(`⚠ ${p.name}: 우리 오퍼 무효 — ${e}`); delete off.offers[p.id]; } else offers.push(uo); }
    p.aiOff ||= {};
    for(const t of Object.values(S.teams)){ if(t.id===S.user) continue;
      if(p.aiOff[t.id]){ offers.push(p.aiOff[t.id]); continue; }
      const loyal=p.faFrom===t.id?0.3:0;
      let prob=clamp(teamNeed(t,p)+loyal,0,0.95)*(final?0.8:0.45);
      if(payroll(t)+p.ask.sal>t.bud.wage*1.08) prob*=0.3;
      if(t.bud.trans-transUsed(t)<(p.ask.bonus||0)+(p.ask.fee||0)) prob*=0.3;
      if(p.lg) prob*=OV_LEAGUES[p.lg].will;
      if(R()<prob){ const f=(0.85+R()*0.25)*(loyal?1.05:1)*decay; const o={team:t.id, sal:r1(p.ask.sal*f), yrs:clamp(p.ask.yrs-(R()<0.3?1:0),1,4), bonus:r1((p.ask.bonus||0)*f)};
        p.aiOff[t.id]=o; offers.push(o); }
    }
    if(!offers.length){ if(final && uo===undefined && !p.foreign && R()<0.5){ /* 미계약 */ } continue; }
    const util=o=>offTotal(o)*(1+0.05*Math.min(o.yrs,p.ask.yrs))*appeal(o.team,p);
    offers.sort((a,b)=>util(b)-util(a));
    const ready = final || p.faWk>=p.faWait || offTotal(offers[0])>=askT*1.08;
    const best = offers.find(o=>offTotal(o)>=askT*0.9);
    if(!ready || !best){ if(uo && offTotal(uo)<askT*0.9 && p.faWk>=2) res.push(`💬 ${p.name}: 더 좋은 조건을 원합니다 (현재 요구 총액 약 ${r1(askT)}억)`); else if(uo) res.push(`⏳ ${p.name}: 우리 오퍼를 검토 중입니다`); continue; }
    signFA(p,best,res);
  }
  if(res.length) mail('프런트',`FA 시장 ${off.week}주차${final?' (마감)':''}`,`${res.filter(l=>!l.startsWith('•')).join('\n')||'우리 구단 관련 소식 없음'}\n\n<b>리그 계약 소식</b>\n${res.filter(l=>l.startsWith('•')).join('\n')||'없음'}`,'info');
}
function endStove(){
  faWeek(true);
  const off=S.off, gone=off.pool.map(id=>S.players[id]).filter(p=>p&&!p.team);
  for(const p of gone){ if(!p.foreign) p.retired=true; }
  off.offers={};
  const u=S.teams[S.user];
  for(const role in u.staff){ const c=u.staff[role]; if(c.expiring){ u.staff[role]={...mkStaff(role,7), name:'내부 승격', acting:true, sal:0.3, yrs:1}; mail('프런트',`${roleName(role)} 계약 종료`,`${c.name}이(가) 팀을 떠났습니다. 대행 체제로 운영합니다.`,'staff'); } }
  for(const t of Object.values(S.teams)){ const fc=fCounts(t);
    if(t.id!==S.user) while(fCounts(t).reg<3){ const c=fCounts(t); const p=genOverseas(pick(['AAA','AAA','AAA','LIDOM','NPB','MLB','CPBL','LMB']),12); if(R()>OV_LEAGUES[p.lg].will){ delete S.players[p.id]; continue; } const sal=Math.min(p.ask.sal,F_RULE.newCap-(p.ask.fee||0), F_RULE.totalCap-c.regSal);
      if((p.isP?c.regP:c.regH)>=2){ delete S.players[p.id]; continue; } p.team=t.id; p.salary=r1(Math.max(1,sal)); p.yrs=1; p.cyrs=1; p.bonus=0; t.roster.push(p.id); }
    if(t.id!==S.user && fCounts(t).aq<1){ const p=genOverseas(pick(['NPB2','CPBL','ABL','JIL']),12); if(p.aqOK){ p.aq=true; p.team=t.id; p.salary=Math.min(p.ask.sal,F_RULE.aqCap); p.yrs=1; p.cyrs=1; p.bonus=0; t.roster.push(p.id); } else delete S.players[p.id]; }
    fillFarm(t); validateTeam(t,false); }
}

// ---------- 캠프 ----------
const CAMP_LOC = {
  '국내(고흥·남해)':{cost:2, g:0.9, inj:1.2, d:'비용이 가장 적지만 추운 날씨로 부상 위험이 높습니다.'},
  '대만(가오슝)':{cost:5, g:1.05, inj:1.0, d:'따뜻하고 저렴합니다. CPBL 팀과 연습경기.'},
  '호주(질롱·시드니)':{cost:7, g:1.1, inj:0.95, d:'한여름 날씨와 넓은 훈련장.'},
  '일본(오키나와)':{cost:8, g:1.12, inj:0.9, d:'국내 여러 구단이 모여 연습경기 상대가 많습니다 — 실전 감각↑'},
  '미국(애리조나)':{cost:12, g:1.2, inj:0.9, d:'최고 수준 시설과 MLB 스프링트레이닝 환경. 비싸고 이동 피로가 있습니다.'}};
const CAMP_FOCUS = {
  '기초 체력':{g:0.9, inj:0.85, d:'시즌 초반(5월까지) 부상 위험 -15%'},
  '기술 훈련':{g:1.3, inj:1, d:'능력치 성장 +30%'},
  '실전 위주':{g:1.0, inj:1, morale:5, d:'연습경기 위주 — 선수 사기 +5, 시즌 초 경기력 소폭↑', tac:0.04},
  '전술 훈련':{g:0.9, inj:1, d:'작전·수비 포메이션 숙달 — 시즌 초(5월까지) 경기력↑', tac:0.08}};
const FCAMP = {'국내':{cost:0.5,g:1}, '일본(미야자키)':{cost:2,g:1.25}, '생략':{cost:0,g:0}};
function campTrain(t, mul, filter){ // 캠프 1주 훈련 (train과 같은 원리, 강도·범위를 따로 지정)
  for(const p of teamPlayers(t)){ if(p.inj || (filter && !filter(p))) continue;
    const coach=p.isP?t.staff['투수'].rating:t.staff['타격'].rating, gap=(p.PA-CA(p))/10;
    let g = p.age<=24?0.09:p.age<=28?0.06:p.age<=31?0.03:0.01;
    g *= (clamp(gap,-0.5,8)/3+0.2)*(0.7+coach/40)*(0.85+p.m.det/60)*mul;
    const plan = p.isP ? TRAIN_PIT['균형'] : TRAIN_HIT['균형'], tot=Object.values(plan).reduce((a,b)=>a+b,0);
    for(const k in plan){ if(k==='cat'&&p.pos!=='C') continue; growAttr(p,k,plan[k]/tot*g*1.1*(0.5+R())); }
    if(R()<0.004*injTeam(t)*injMul(p)) p.inj=2+Math.floor(R()*12);
  }
}
function fcampWeek(){ // 11월 마무리캠프
  for(const t of Object.values(S.teams)){ const fc=t.id===S.user?t.fcamp:{loc:'국내',who:'유망주'}; const L=FCAMP[fc.loc]; if(!L.g) continue;
    if(S.off.fcampDone===0) ledg(t,'camp',-L.cost);
    campTrain(t, L.g*1.3, fc.who==='전원'?null:(p=>p.age<=26)); }
  S.off.fcampDone++;
}
function springStart(){
  for(const t of Object.values(S.teams)){ const c=t.camp, L1=CAMP_LOC[c.loc1], L2=CAMP_LOC[c.loc2], F=CAMP_FOCUS[c.focus];
    ledg(t,'camp',-r1(L1.cost*0.6+L2.cost*0.4));
    t.campEff={inj:F.inj, tac:F.tac||0, until:`${S.year+1}-05-01`};
    if(F.morale) teamPlayers(t).forEach(p=>p.morale=clamp(p.morale+F.morale,20,100)); }
  const u=S.teams[S.user];
  mail('코치진','스프링캠프 출발',`1차 ${u.camp.loc1} → 2차 ${u.camp.loc2} · 중점: ${u.camp.focus}\n캠프 비용 ${r1(CAMP_LOC[u.camp.loc1].cost*0.6+CAMP_LOC[u.camp.loc2].cost*0.4)}억.`,'staff');
}
function springWeek(){
  const second = S.date.slice(5)>='02-21';
  for(const t of Object.values(S.teams)){ const L=CAMP_LOC[second?t.camp.loc2:t.camp.loc1], F=CAMP_FOCUS[t.camp.focus]; campTrain(t, L.g*F.g*1.5); }
}
function exhibWeek(){
  const ex=S.off.exhib, ids=Object.keys(S.teams);
  for(let d=0; d<4; d++){
    const sh=ids.slice().sort(()=>R()-0.5);
    for(let i=0;i<10;i+=2){ const h=sh[i], a=sh[i+1]; const g=simGame(h,a,{log:true});
      const rec=x=>ex.rec[x] ||= [0,0,0];
      if(g.score[0]===g.score[1]){ rec(h)[2]++; rec(a)[2]++; } else { const w=g.score[1]>g.score[0]?h:a, l=w===h?a:h; rec(w)[0]++; rec(l)[1]++; }
      ex.games.push({d:addDays(S.date,d-6), h, a, s:g.score, full:(h===S.user||a===S.user)?g:null});
      for(const p of Object.values(S.players)) if(p.team && p.fat) p.fat=0; }
    for(const t of Object.values(S.teams)) t.rotIdx=(t.rotIdx||0);
  }
  const fulls=ex.games.filter(g=>g.full); while(fulls.length>8){ fulls.shift().full=null; }
}

// ---------- 오프시즌 주 단위 진행 ----------
function offStageOf(){ const d=S.date, y=S.year+1; return d>=`${y}-03-08`?'exhib':d>=`${y}-02-01`?'camp':'stove'; }
function advanceOff(weeks=1, until){
  if(S.phase!=='off' || !S.off) return;
  if(S.off.stage==='exhib'){ const ex=S.off.exhib;
    if(until){ exhibAdv(99); save(); return; }
    if(weeks>1){ exhibAdv(99); newSeason(); return; }
    if(ex.idx<ex.days.length){ exhibAdv(5); save(); return; }
    newSeason(); return; }
  for(let w=0; w<weeks; w++){
    const before=S.off.stage;
    S.date=addDays(S.date,7);
    const now=offStageOf();
    if(before==='stove'){
      faWeek();
      if(S.date.slice(5,7)==='11' || (S.date.slice(5,7)==='12' && S.off.fcampDone<4)) fcampWeek();
      if(R()<0.25) genAIOffer();
      if(R()<0.5) aiTrades();
      if(S.off.week%4===0) refreshCoachMarket();
      checkMission();
      for(const t of Object.values(S.teams)) if(t.id!==S.user){ while(t.roster.length>ROSTER_MAX_AI){ const w=teamPlayers(t).filter(p=>!p.rookie).sort((a,b)=>ovrOf(a)-ovrOf(b))[0]; t.roster=t.roster.filter(id=>id!==w.id); logMove(w,'방출',t.id,null,'로스터 정리'); w.team=null; w.released=true; w.freeAgent=true; w.ask=askOf(w); } }
    }
    if(before==='stove' && now!=='stove'){ endStove(); S.off.stage='camp'; springStart(); }
    if(S.off.stage==='camp'){ checkMission(); if(now==='camp') springWeek(); }
    if(S.off.stage==='camp' && now==='exhib'){ S.off.stage='exhib'; startExhib(); for(const t of Object.values(S.teams)){ if(t.id!==S.user) autoEntry(t); else ensureEntry(t); }
      mail('리그 사무국','시범경기 개막','3월 시범경기가 시작됩니다. 결과는 순위에 반영되지 않습니다. 개막 엔트리(1군 28명)를 점검하세요.','board'); }
    if(S.off.stage==='exhib'){ save(); return; }   // 시범경기는 하루 단위로 진행
    if(until && S.off?.stage!==before) break;
  }
  save();
}

// ---------- 새 시즌 개막 ----------
newSeason = function(){
  for(const t of Object.values(S.teams)){
    const cap=t.id===S.user?ROSTER_MAX_USER:ROSTER_MAX_AI;
    while(t.roster.length>cap){ const w=teamPlayers(t).filter(p=>!p.rookie).sort((a,b)=>(ovrOf(a)+(a.PA-CA(a))/40-a.age*0.02)-(ovrOf(b)+(b.PA-CA(b))/40-b.age*0.02))[0];
      t.roster=t.roster.filter(id=>id!==w.id); w.team=null; w.released=true;
      if(t.id===S.user) mail('프런트','로스터 정리',`보류 선수 초과(최대 ${cap}명)로 ${w.name}이(가) 방출되었습니다.`,'info'); }
    const added=fillFarm(t);
    if(t.id===S.user && added.length) mail('프런트','육성선수 등록',`보류 인원 부족으로 육성선수 ${added.length}명을 퓨처스에 등록했습니다: ${added.join(', ')}`,'info');
    t.w=t.l=t.t=0; t.rs=t.ra=0; t.streak=0; t.last=[]; t.rotIdx=0; t.attTotal=0; t.homeG=0; t.fRep=0; if(t.mkt) t.mkt.ev=null;
    const r=(S.prevFinal||S.finalRank).indexOf(t.id)+1; t.goalRank=clamp(Math.round((r+TD(t.id).goalRank)/2)-(r<=3?0:1),1,9);
    t.fanMood=clamp(50+(t.fanMood-50)*0.5,20,90);
    if(t.id!==S.user) autoEntry(t); else { if(act1(t).length>ENTRY_MAX||act1(t).length<26) autoEntry(t); ensureEntry(t); }
  }
  for(const p of Object.values(S.players)){ resetStats(p); p.rookie=false; p.fst=null; p.downUntil=0; p.aiOff=null; p.faWk=0; p.faWait=null; }
  for(const id in S.players){ const q=S.players[id]; if(!q.team && !q.am && !q.abroad) delete S.players[id]; }   // 아마추어·해외파는 유지
  for(const t of Object.values(S.teams)) if(t.ovs) t.ovs.cands=t.ovs.cands.filter(id=>S.players[id]);
  S.year++; S.dayIdx=0; S.date=`${S.year}-03-28`; S.schedule=makeSchedule(S.year); S.results=[]; S.phase='regular'; S.post=null; S.lastExhib=S.off?.exhib||null; S.off=null; S.campMul=1;
  S.dclass=makeDraftClass();
  const u=S.teams[S.user];
  { const fc=fCounts(u); if(fc.reg<3||fc.aq<1) mail('프런트','외국인 선수 공백',`외국인 선수 ${fc.reg}/3명, 아시아쿼터 ${fc.aq}/1명으로 개막합니다. 해외 스카우트 화면에서 영입할 수 있어요 (시즌 중 교체 2회, 8월 15일까지).`,'info'); }
  mail('이사회', `${S.year} 시즌 개막`, `새 시즌 목표: <b>${goalText(u.goalRank)}</b>\n연봉 예산 ${u.bud.wage}억 · 영입 예산 잔여 ${r1(u.bud.trans-transUsed(u))}억.\n라인업·전술과 1군 엔트리를 점검하세요.`, 'board');
  save();
};

// ---------- 일정: 올스타 휴식기 · 우천 순연 · 가을야구 휴식일 ----------
nextGameDate = function(date){
  let d=addDays(date,1); const y=d.slice(0,4);
  if(d>=`${y}-07-10` && d<`${y}-07-15`) d=`${y}-07-15`;               // 올스타 휴식기
  if(S && S.phase==='regular' && R()<0.1) d=addDays(d,1);             // 우천 순연
  if(new Date(d+'T12:00:00').getDay()===1) d=addDays(d,1);              // 월요일 휴식
  return d;
};
const _postAfter2 = postAfter;
postAfter = function(g){ const st=S.post.stage; _postAfter2(g); if(S.post && S.post.stage!==st && !S.post.champion) S.date=addDays(S.date,2); };
function allStar(){
  if(S.phase!=='regular' || md()<'07-12' || (S.asg||0)>=S.year) return;
  S.asg=S.year;
  const pool=Object.values(S.players).filter(p=>p.team&&!p.farm&&!p.inj);
  const pick_=(f,n)=>pool.filter(f).sort((a,b)=>CA(b)-CA(a)).slice(0,n);
  const sel=[...pick_(p=>p.isP&&p.pos==='SP',6),...pick_(p=>p.isP&&p.pos!=='SP',6),...['C','1B','2B','3B','SS','LF','CF','RF','DH'].flatMap(ps=>pick_(p=>!p.isP&&p.pos===ps,2))];
  const mine=sel.filter(p=>p.team===S.user);
  mine.forEach(p=>p.morale=clamp(p.morale+5,20,100)); if(mine.length) S.teams[S.user].fanMood=clamp(S.teams[S.user].fanMood+1,0,100);
  mail('리그 사무국',`${S.year} 올스타 선정`,`올스타 휴식기(7월 10~14일)입니다.\n우리 구단 올스타: ${mine.map(p=>p.name).join(', ')||'없음'}\n\n리그 올스타: ${sel.map(p=>`${p.name}(${tShort(p.team)})`).join(', ')}`,'board');
}

// ---------- 선수 성격 ----------
const PERS = {
  '리더형':{d:'선수단을 이끄는 리더. 연패 때 선수단 미팅을 열고, 젊은 선수들을 다독인다.', m:{lead:3}, g:1},
  '프로페셔널':{d:'철저한 자기관리로 기복이 적고, 후배들의 본보기가 된다.', m:{cons:3,det:1}, g:1},
  '승부사':{d:'큰 경기·접전에서 더 강해진다. 출전에 대한 욕심이 크다.', m:{cmp:2,det:2}, g:1},
  '분위기 메이커':{d:'더그아웃 분위기를 살리고 팬 서비스에도 적극적이다.', m:{}, g:1},
  '노력파':{d:'훈련량이 많아 성장이 빠르다. 특타·특훈을 자청한다.', m:{det:3}, g:1},
  '침착함':{d:'어떤 상황에서도 흔들리지 않는다.', m:{cmp:3}, g:1},
  '야심가':{d:'더 큰 무대와 대우를 원한다. 활약하면 다년 계약·연봉 인상을 요구한다.', m:{det:2}, g:0},
  '자유로운 영혼':{d:'개성이 강하고 컨디션 기복이 있다.', m:{cons:-2}, g:0},
  '예민함':{d:'비판에 민감해 부진하면 사기가 크게 떨어진다.', m:{cmp:-2}, g:-1},
  '불평꾼':{d:'출전 시간과 대우에 대한 불만을 자주 드러낸다.', m:{lead:-2}, g:-1}};
// 데이터 선수(주요 선수)의 고정 성격 — 긍정적 성향만 사용
const PERS_REAL = {류철진:'프로페셔널',양의수:'리더형',김범현:'승부사',최서:'프로페셔널',양규종:'리더형',강민범:'분위기 메이커',김현혁:'리더형',최형철:'프로페셔널',
  오석환:'리더형',구자수:'리더형',전준원:'리더형',나율범:'리더형',채재성:'리더형',박해재:'노력파',노찬은:'노력파',김진윤:'노력파',고영훈:'침착함',원태승:'승부사',
  안우기:'승부사',곽찬:'승부사',김도재:'승부사',문상주:'노력파',노율환:'분위기 메이커',박현호:'노력파',정수도:'프로페셔널',김택우:'침착함',박용현:'침착함',
  조한현:'침착함',안수민:'노력파',홍서기:'침착함',박주우:'승부사',레이너스:'프로페셔널',디아스:'분위기 메이커',박연원:'분위기 메이커',황건빈:'분위기 메이커',
  문보상:'침착함',김지웅:'승부사',강하호:'승부사',류주혁:'노력파',박건동:'프로페셔널',손철영:'노력파',임철규:'프로페셔널',정해하:'침착함',김하윤:'침착함'};
const REAL_NAMES = new Set(TEAM_DATA.flatMap(t=>t.players.map(s=>s.split('|')[0])));
function rollPers(p){
  if(PERS_REAL[p.name]) return PERS_REAL[p.name];
  const real = REAL_NAMES.has(p.name), m=p.m;
  const w = {'리더형':m.lead>=14?4:0.5,'프로페셔널':m.cons>=13?3:1,'승부사':m.cmp>=14?3:1,'분위기 메이커':1.5,'노력파':m.det>=13?3:1,'침착함':m.cmp>=13?2:0.8,
    '야심가':real?0:(p.age<=29?1.5:0.5),'자유로운 영혼':real?0:1,'예민함':real?0:(m.cmp<=8?1.5:0.4),'불평꾼':real?0:0.7};
  const ks=Object.keys(w); return ks[pickW(ks.map(k=>w[k]))];
}
function persOf(p){ if(!p.pers){ p.pers=rollPers(p); for(const [k,v] of Object.entries(PERS[p.pers].m)) p.m[k]=clamp(p.m[k]+v,1,20); } return p.pers; }
const isPers = (p,k) => persOf(p)===k;
function persMail(from, title, body, action){ mail(from, title, body, action?'trade':'staff', action||null); }
function persWeek(u){
  const ps=teamPlayers(u); ps.forEach(persOf);
  // 약속 이행 확인
  for(const p of ps) if(p.promise && S.dayIdx>=p.promise.until){
    const gained = p.isP ? p.st.outs-p.promise.base : p.st.pa-p.promise.base, ok = gained >= (p.isP?15:25);
    p.morale=clamp(p.morale+(ok?5:-14),20,100); persMail(p.name, ok?'약속을 지켜줘서 고맙습니다':'약속이 지켜지지 않았습니다', ok?`${p.name}: "기회를 주셔서 감사합니다. 보답하겠습니다."`:`${p.name}이(가) 출전 약속이 지켜지지 않았다며 실망했습니다. (사기 크게 하락)`); delete p.promise; }
  if(S.phase!=='regular' || R()>0.45) return;
  const act=act1(u), avgCA=act.reduce((s,p)=>s+CA(p),0)/act.length, E=[];
  const lead=act.filter(p=>isPers(p,'리더형')).sort((a,b)=>b.m.lead-a.m.lead)[0];
  if(lead && u.streak<=-3) E.push(()=>{ ps.forEach(p=>p.morale=clamp(p.morale+5,20,100)); persMail(lead.name,'선수단 미팅',`${lead.name}이(가) 연패를 끊자며 선수단 미팅을 열었습니다. "다들 고개 들자. 한 경기씩 이기면 된다."\n(선수단 사기 +5)`); });
  const mood=act.filter(p=>isPers(p,'분위기 메이커'))[0];
  if(mood && u.streak>=3) E.push(()=>{ u.fanMood=clamp(u.fanMood+3,0,100); ps.forEach(p=>p.morale=clamp(p.morale+2,20,100)); persMail('홍보팀','더그아웃 세리머니 화제',`${mood.name}의 더그아웃 세리머니가 SNS에서 화제가 됐습니다. 팬들 반응이 뜨겁습니다.\n(팬 만족도 +3, 선수단 사기 +2)`); });
  const vet=ps.filter(p=>p.age>=31&&(isPers(p,'프로페셔널')||isPers(p,'리더형')));
  for(const v of vet){ const y=ps.filter(p=>p.age<=24&&p.isP===v.isP&&p.PA-CA(p)>=15); if(y.length && R()<0.5){ const k=pick(y); E.push(()=>{ const ks=Object.keys(k.isP?P_ATTR:H_ATTR).filter(x=>!(x==='cat'&&k.pos!=='C')).sort(()=>R()-0.5).slice(0,3); ks.forEach(x=>growAttr(k,x,0.45)); k.m.det=clamp(k.m.det+0.5,1,20);
    persMail('코치진','베테랑의 멘토링',`${v.name}이(가) ${k.name}에게 노하우를 전수하고 있습니다. ${k.name}의 ${ks.map(x=>(k.isP?P_ATTR:H_ATTR)[x]).join('·')}이(가) 좋아졌습니다.`); }); break; } }
  const hard=pick(ps.filter(p=>isPers(p,'노력파')&&!p.inj));
  if(hard && R()<0.35) E.push(()=>{ const ks=Object.keys(hard.isP?P_ATTR:H_ATTR).filter(x=>!(x==='cat'&&hard.pos!=='C')).sort((a,b)=>hard.a[a]-hard.a[b]).slice(0,2); ks.forEach(x=>growAttr(hard,x,0.35)); hard.cond=clamp(hard.cond-6,40,100);
    persMail('코치진',`${hard.name} 특별 훈련 자청`,`${hard.name}이(가) 경기 후 남아 ${ks.map(x=>(hard.isP?P_ATTR:H_ATTR)[x]).join('·')} 특별 훈련을 했습니다. (능력 소폭 상승, 컨디션 -6)`); });
  const bench=ps.filter(p=>!p.promise&&p.morale<70&&CA(p)>=avgCA-12&&(isPers(p,'승부사')||isPers(p,'야심가')||isPers(p,'불평꾼'))&&(p.farm||(p.isP?p.st.outs<S.dayIdx*0.5:p.st.pa<S.dayIdx*1.5)));
  if(bench.length){ const p=pick(bench); E.push(()=>persMail(p.name,'출전 기회를 원합니다',`${p.name}${p.farm?'(퓨처스)':''}이(가) 감독실을 찾아왔습니다.\n"더 많이 뛰고 싶습니다. 기회를 주십시오."\n\n<b>수락</b>: 2주 안에 꾸준히 기용하겠다고 약속합니다 (사기 +8, 지키지 못하면 크게 실망).\n<b>거절</b>: 지금은 어렵다고 말합니다 (사기 하락).`,{type:'pev',kind:'play',pid:p.id,yes:'기회를 약속한다',no:'지금은 어렵다'})); }
  const amb=ps.filter(p=>isPers(p,'야심가')&&CA(p)>=140&&p.age<=30&&(p.yrs??1)<=2&&p.askedExt!==S.year&&!p.foreign);
  if(amb.length){ const p=pick(amb); const sal=r1(Math.max(p.salary*1.25,marketValue(p))); E.push(()=>{ p.askedExt=S.year; persMail(`${p.name} 에이전트`,'다년 계약 요청',`${p.name} 측이 다년 계약을 요청했습니다: <b>4년 · 연봉 ${sal}억</b> (현재 연봉 ${p.salary}억, 잔여 ${p.yrs??1}년)\n\n<b>수락</b>: 계약을 연장합니다 (사기 +10, 연봉 예산에 반영).\n<b>거절</b>: 시즌 뒤 FA 시장을 노릴 수 있습니다 (사기 -10).`,{type:'pev',kind:'ext',pid:p.id,sal,yes:'연장 계약',no:'거절'}); }); }
  const fo=ps.filter(p=>p.foreign&&p.morale<65);
  if(fo.length){ const p=pick(fo); E.push(()=>persMail(u.staff['매니저'].name+' 매니저',`${p.name} 향수병`,`${p.name}이(가) 가족을 그리워하며 힘들어합니다. 가족 초청 비용(0.3억)을 지원할까요?\n\n<b>수락</b>: 0.3억 지원 (사기 +12)\n<b>거절</b>: 사기 -6`,{type:'pev',kind:'home',pid:p.id,yes:'가족 초청 지원',no:'지원하지 않음'})); }
  const old=ps.filter(p=>p.age>=38&&!p.retireEnd&&md()>='08-01');
  if(old.length){ const p=pick(old); E.push(()=>persMail(p.name,'은퇴를 고민하고 있습니다',`${p.name}이(가) 올 시즌을 끝으로 은퇴하는 것을 고민하고 있다고 털어놓았습니다.\n\n<b>수락</b>: 은퇴 투어를 열어 마지막 시즌을 함께합니다 (팬 만족도 +6, 시즌 뒤 은퇴).\n<b>거절</b>: 한 시즌 더 함께하자고 설득합니다.`,{type:'pev',kind:'retire',pid:p.id,yes:'은퇴 투어',no:'설득한다'})); }
  const sens=ps.filter(p=>isPers(p,'예민함')&&!p.isP&&p.st.pa>60&&p.st.h/Math.max(p.st.ab,1)<0.22);
  if(sens.length){ const p=pick(sens); E.push(()=>{ p.morale=clamp(p.morale-8,20,100); persMail('코치진',`${p.name} 부진에 위축`,`${p.name}이(가) 부진 기사와 댓글에 크게 위축됐습니다. (사기 -8) 퓨처스에서 재정비하거나 휴식을 고려해 보세요.`); }); }
  const free=ps.filter(p=>isPers(p,'자유로운 영혼'));
  if(free.length){ const p=pick(free); E.push(()=>{ const good=R()<0.5; u.fanMood=clamp(u.fanMood+(good?2:-2),0,100); persMail('홍보팀',`${p.name} SNS 화제`,good?`${p.name}의 유쾌한 SNS 게시물이 팬들 사이에서 화제입니다. (팬 만족도 +2)`:`${p.name}의 SNS 게시물을 두고 팬들 사이에 갑론을박이 벌어졌습니다. (팬 만족도 -2)`); }); }
  const grumble=ps.filter(p=>isPers(p,'불평꾼')&&p.morale<50);
  if(grumble.length){ const p=pick(grumble); E.push(()=>{ ps.forEach(q=>q.morale=clamp(q.morale-1,20,100)); persMail('코치진',`${p.name} 불만 표출`,`${p.name}이(가) 라커룸에서 대우에 대한 불만을 드러내 분위기가 가라앉았습니다. (선수단 사기 -1)`); }); }
  if(E.length) pick(E)();
}
const _acceptOffer = acceptOffer, _declineOffer = declineOffer;
function pevResolve(i, yes){
  const a=S.inbox[i].action, p=S.players[a.pid], u=S.teams[S.user]; if(a.done) return '이미 처리했습니다.';
  if(!p || p.team!==S.user){ a.done='expired'; save(); return '해당 선수가 더 이상 우리 팀에 없습니다.'; }
  a.done = yes ? 'accepted' : 'declined'; let msg='';
  if(a.kind==='play'){ if(yes){ p.morale=clamp(p.morale+8,20,100); p.promise={until:S.dayIdx+14, base:p.isP?p.st.outs:p.st.pa}; msg=`${p.name}에게 기회를 약속했습니다. 2주 안에 꾸준히 기용하세요.${p.farm?' (지금은 퓨처스에 있어요 — 1군에 등록하세요)':''}`; }
    else { p.morale=clamp(p.morale-(isPers(p,'불평꾼')?12:8),20,100); if(isPers(p,'불평꾼')) teamPlayers(u).forEach(q=>q.morale=clamp(q.morale-1,20,100)); msg=`${p.name}이(가) 실망한 채 돌아갔습니다.`; } }
  if(a.kind==='ext'){ if(yes){ if(payroll(u)-p.salary+a.sal>u.bud.wage){ a.done=null; return `연봉 예산이 부족합니다 (예산 ${u.bud.wage}억). 재정 화면에서 조정한 뒤 다시 수락하세요.`; }
      p.salary=a.sal; p.yrs=4; p.cyrs=4; p.morale=clamp(p.morale+10,20,100); msg=`${p.name}과(와) 4년 연장 계약을 맺었습니다 (연봉 ${a.sal}억).`; }
    else { p.morale=clamp(p.morale-10,20,100); msg=`${p.name} 측은 시즌 뒤 FA 시장을 알아보겠다고 했습니다.`; } }
  if(a.kind==='home'){ if(yes){ if(u.balance<0.3){ a.done=null; return '잔고가 부족합니다.'; } ledg(u,'ev',-0.3); p.morale=clamp(p.morale+12,20,100); msg=`${p.name}의 가족이 한국에 왔습니다. 표정이 밝아졌어요.`; }
    else { p.morale=clamp(p.morale-6,20,100); msg='지원하지 않기로 했습니다.'; } }
  if(a.kind==='retire'){ if(yes){ p.retireEnd=true; u.fanMood=clamp(u.fanMood+6,0,100); msg=`${p.name}의 은퇴 투어가 시작됩니다. 원정 구장마다 기념 행사가 열립니다.`; }
    else { p.morale=clamp(p.morale+2,20,100); msg=`${p.name}: "감독님 말씀대로 한 번 더 해보겠습니다."`; } }
  save(); return msg;
}
acceptOffer = function(i){ const a=S.inbox[i]?.action; if(a?.type==='pev') return pevResolve(i,true); return _acceptOffer(i); };
declineOffer = function(i){ const a=S.inbox[i]?.action; if(a?.type==='pev'){ const m=pevResolve(i,false); if(m) setTimeout(()=>typeof alert==='function'&&alert(m),0); return m; } return _declineOffer(i); };

// ---------- AI 구단끼리 트레이드 ----------
function aiTrades(force){
  if(!force && R()>0.4) return;
  const ids=Object.keys(S.teams).filter(id=>id!==S.user);
  for(let tries=0; tries<80; tries++){
    const A=S.teams[pick(ids)], B=S.teams[pick(ids.filter(x=>x!==A.id))];
    const pool=t=>teamPlayers(t).filter(p=>!p.foreign&&!p.inj&&!p.rookie&&CA(p)>=95&&!(p.mv||[]).some(m=>m.type==='트레이드'&&m.y===S.year));
    const x=pick(pool(A)), y=pick(pool(B)); if(!x||!y||x.isP===y.isP&&x.pos===y.pos) continue;
    const vx=tradeValue(x), vy=tradeValue(y), r=vx/vy; if(r<0.8||r>1.25) continue;
    const nA=teamNeed(A,y), nB=teamNeed(B,x); if(nA<0.1||nB<0.1) continue;
    if(A.roster.length<32||B.roster.length<32) continue;
    A.roster=A.roster.filter(id=>id!==x.id); B.roster=B.roster.filter(id=>id!==y.id);
    A.roster.push(y.id); B.roster.push(x.id); x.team=B.id; y.team=A.id; x.morale=y.morale=65;
    logMove(x,'트레이드',A.id,B.id,`↔ ${y.name}`); logMove(y,'트레이드',B.id,A.id,`↔ ${x.name}`);
    autoEntry(A); autoEntry(B);
    const txt=`${TD(A.id).name} ${x.name}(${POS_KO[x.pos]}) ↔ ${TD(B.id).name} ${y.name}(${POS_KO[y.pos]})`;
    S.tradeLog.unshift(`${S.date} ${txt}`); if(S.tradeLog.length>60) S.tradeLog.length=60;
    mail('리그 사무국','리그 소식: 트레이드 성사',`${txt}\n\n${tShort(A.id)}은(는) ${y.isP?'마운드':POS_KO[y.pos]+' 자리'}를, ${tShort(B.id)}은(는) ${x.isP?'마운드':POS_KO[x.pos]+' 자리'}를 보강했습니다.`,'info');
    return true;
  }
  return false;
}

// 새로 합류한 선수 때문에 1군이 한쪽(투수/야수)으로 쏠리면 가장 약한 같은 유형 선수를 퓨처스로 (알림 메일)
function rebalanceEntry(u, p){
  const a=act1(u), nP=a.filter(x=>x.isP).length, nH=a.length-nP;
  if(a.length<ENTRY_MAX-1) return;
  if((p.isP && nP>14) || (!p.isP && nH>16)){
    const w=a.filter(x=>x.isP===p.isP && x!==p && !u.lineup.some(l=>l.pid===x.id) && !u.rotation.includes(x.id) && x.id!==u.closer).sort((x,y)=>ovrOf(x)-ovrOf(y))[0];
    if(w){ w.farm=true; if(S.phase==='regular') w.downUntil=S.dayIdx+10; mail('코치진','엔트리 조정',`${p.name} 합류로 1군 ${p.isP?'투수':'야수'}가 많아져 ${w.name}을(를) 퓨처스로 내렸습니다.`,'staff'); }
  }
}

// ---------- 히든 능력치 (1~20, 화면에는 말과 막대로만 표시) ----------
const HIDDEN = {
  pro:{n:'프로의식', d:'자기관리·훈련 태도. 높을수록 성장이 빠르고 노화가 늦다.'},
  inj:{n:'부상 위험', d:'부상을 당하기 쉬운 정도. 높을수록 자주 다친다.', inv:1},
  amb:{n:'야망', d:'더 큰 무대·대우에 대한 욕심. 높으면 계약 요구가 세다.'},
  loy:{n:'충성심', d:'소속 구단에 대한 애착. 높으면 FA 때 원소속 구단을 선호한다.'},
  adp:{n:'적응력', d:'새 팀·새 리그에 녹아드는 능력. 외국인·이적 선수에게 중요.'},
  temp:{n:'멘탈 안정', d:'기복·연패에 흔들리지 않는 정도.'},
  imp:{n:'큰 경기', d:'가을야구 같은 중요한 경기에서의 활약.'}};
const PERS_HID = {'리더형':{pro:3,loy:3,temp:2},'프로페셔널':{pro:6,temp:2},'승부사':{imp:5,amb:2},'분위기 메이커':{adp:4,temp:2},'노력파':{pro:4},
  '침착함':{temp:5,imp:3},'야심가':{amb:6,loy:-3},'자유로운 영혼':{pro:-3,adp:3},'예민함':{temp:-5,imp:-3},'불평꾼':{pro:-4,loy:-3,temp:-3}};
function hidOf(p){
  if(p.h) return p.h;
  const r=srng(hash(p.name+(p.id||'')+'h')), j=s=>(r()*2-1)*s, b=PERS_HID[persOf(p)]||{};
  const h={pro:10+j(3)+(p.m.det-11)*0.4, inj:10+j(2.5)-(p.m.dur-11)*0.7+(has(p,'유리몸')?6:0)-(has(p,'철인')||has(p,'철완')?5:0)+Math.max(0,p.age-32)*0.4,
    amb:10+j(4)-(p.age>33?2:0), loy:10+j(4)+(p.age>33?1.5:0), adp:10+j(4), temp:10+j(3)+(p.m.cmp-11)*0.4, imp:10+j(3)+(p.m.cmp-11)*0.3+(has(p,'큰 경기 강자')||has(p,'에이스 기질')?4:0)-(has(p,'새가슴')?4:0)};
  for(const k in b) h[k]+=b[k];
  for(const k in h) h[k]=Math.round(clamp(h[k],1,20));
  return p.h=h;
}
const hv = (p,k) => (p.h||hidOf(p))[k];
function hidWord(k,v){ const inv=HIDDEN[k].inv; const lv = v>=17?4:v>=13?3:v>=8?2:v>=5?1:0;
  return inv ? ['매우 낮음','낮음','보통','높음','매우 높음'][lv] : ['매우 낮음','낮음','보통','높음','매우 높음'][lv]; }
function hidGood(k,v){ return HIDDEN[k].inv ? 21-v : v; }

// ---------- 선수 기록: 경기 로그 · 홈/원정 · 월별 · 가을야구 · 시즌별 커리어 ----------
const BAT_K=['pa','ab','h','d','t','hr','rbi','bb','k','r','sb','cs'], PIT_K=['g','gs','outs','h','er','bb','k','hr','w','l','sv','hld'];
function addLine(o, x, keys){ for(const k of keys) o[k]=(o[k]||0)+(x[k]||0); o.gp=(o.gp||0)+1; return o; }
const _applyGame2 = applyGame;
applyGame = function(g){
  _applyGame2(g);
  const sides=[g.away,g.home], mo=(g.date||S.date).slice(5,7);
  for(const side of [0,1]){
    const b=g.box[side], my=g.score[side], op=g.score[1-side], res=my>op?'W':my<op?'L':'T', opp=sides[1-side], home=side===1;
    for(const id in b.bat){ const p=S.players[id], x=b.bat[id]; if(!p) continue;
      if(g.post){ addLine(p.pst ||= {}, x, BAT_K); continue; }
      const sp=p.spl ||= {home:{},away:{},m:{}}; addLine(home?sp.home:sp.away, x, BAT_K); addLine(sp.m[mo] ||= {}, x, BAT_K);
      (p.gl ||= []).unshift({dt:g.date||S.date, o:opp, hm:home?1:0, r:res, s:`${my}:${op}`, ...Object.fromEntries(BAT_K.map(k=>[k,x[k]||0]))}); if(p.gl.length>10) p.gl.length=10; }
    b.pit.forEach((x,i)=>{ const p=S.players[x.pid]; if(!p) return;
      const y={g:1, gs:i===0?1:0, outs:x.outs, h:x.h, er:Math.max(0,x.er), bb:x.bb, k:x.k, hr:x.hr, w:g.dec.w===p.id?1:0, l:g.dec.l===p.id?1:0, sv:g.dec.sv===p.id?1:0, hld:(g.dec.hld||[]).includes(p.id)?1:0};
      if(g.post){ addLine(p.pst ||= {}, y, PIT_K); return; }
      const sp=p.spl ||= {home:{},away:{},m:{}}; addLine(home?sp.home:sp.away, y, PIT_K); addLine(sp.m[mo] ||= {}, y, PIT_K);
      (p.gl ||= []).unshift({dt:g.date||S.date, o:opp, hm:home?1:0, r:res, s:`${my}:${op}`, pc:Math.round(x.pc), ...y}); if(p.gl.length>10) p.gl.length=10; });
  }
};
function archiveSeason(){ // 시즌 종료 시 기록 보관 (beginOffseason 처음)
  for(const p of Object.values(S.players)){
    const st=p.st; const played = p.isP ? st.pg>0 : st.pa>0; const fp = p.fst && (p.fst.ab||p.fst.outs);
    if(!played && !fp && !p.pst) continue;
    const parts = (typeof curSplits==='function' && p.tsplit) ? curSplits(p) : [{t:p.team, st}];
    if(!parts.length) parts.push({t:p.team, st});
    parts.forEach((x,i)=>{ const last=i===parts.length-1; (p.car ||= []).push({y:S.year, t:x.t, st:Object.fromEntries(ST_KEYS(p).map(k=>[k,x.st[k]||0])), fst:last&&fp?{...p.fst}:null, pst:last&&p.pst?{...p.pst}:null, age:p.age}); });
    p.tsplit=null;
  }
}
const _beginOffseason2 = beginOffseason;
beginOffseason = function(){ archiveSeason(); return _beginOffseason2(); };
const _newSeason2 = newSeason;
newSeason = function(){ for(const p of Object.values(S.players)){ p.spl=null; p.gl=null; p.pst=null; } return _newSeason2(); };

// ---------- 선수 이동 기록 (역사 탭) ----------
const ST_KEYS = p => p.isP ? ['pg','gs','outs','ph','er','pbb','pk','phr','w','l','sv','hld'] : ['g',...BAT_K];
function stDiff(p, a, b){ const o={}; for(const k of ST_KEYS(p)) o[k]=(a[k]||0)-(b[k]||0); return o; }
function curSplits(p){ // 이번 시즌 팀별 기록 [{t, st}] (시즌 중 트레이드 반영)
  const sp=p.tsplit||[]; const used=sumSt(p, sp.map(x=>x.st)); const rest=stDiff(p,p.st,used);
  return [...sp, {t:p.team, st:rest}].filter(x=>p.isP?x.st.pg>0:x.st.g>0||x.st.pa>0); }
function sumSt(p, list){ const o={}; for(const x of list) for(const k of ST_KEYS(p)) o[k]=(o[k]||0)+(x[k]||0); return o; }
function logMove(p, type, from, to, note){ if(!p) return;
  if(type==='트레이드' && from && (S.phase==='regular'||S.phase==='post')){ const sp=p.tsplit ||= []; const used=sumSt(p, sp.map(x=>x.st)); sp.push({t:from, st:stDiff(p,p.st,used)}); } (p.mv ||= []).push({dt:S.date, y:S.year, type, from:from||null, to:to||null, note:note||''}); if(p.mv.length>40) p.mv.shift(); }
const _initClub2 = initClub;
initClub = function(){ _initClub2(); for(const p of Object.values(S.players)) if(p.team && !p.mv){ logMove(p, REAL_NAMES.has(p.name)?`${S.year} 시즌 개막`:'육성선수 등록', null, p.team, p.foreign?(p.aq?'아시아쿼터':'외국인 선수'):''); } };
const _genFarm = genFarm;
genFarm = function(t,pos,age,rr){ const p=_genFarm(t,pos,age,rr); logMove(p,'육성선수 등록',null,t.id,'퓨처스'); return p; };
const _dPick = dPick;
dPick = function(tid,p){ const d=S.dclass, r=Math.floor(d.idx/10)+1, n=d.idx%10+1; _dPick(tid,p); if(p) logMove(p,'신인 드래프트',null,tid,`${p.school} · ${r}라운드 ${n}순위 · 계약금 ${p.bonus}억`); };
const _signFA = signFA;
signFA = function(p,o,res){ const from=p.faFrom, lg=p.lg; const ok=_signFA(p,o,res); if(ok){ const re=from===o.team;
  logMove(p, re?'FA 재계약':p.foreign&&!from?'외국인 영입':'FA 이적', from, o.team, `${o.yrs}년 총액 ${r1(offTotal(o))}억${!from&&lg?` · 전 ${OV_LEAGUES[lg]?.n||''}`:''}`); } return ok; };
const _signOverseas = signOverseas;
signOverseas = function(pid,sal,want){ const p=S.players[pid], lg=p?.lg; const e=_signOverseas(pid,sal,want); if(!e) logMove(p,'외국인 영입',null,S.user,`전 ${OV_LEAGUES[lg]?.n||'해외'} · 연봉 ${sal}억${p.aq?' · 아시아쿼터':''}`); return e; };
const _doTrade2 = doTrade;
doTrade = function(give,get,otherId){ _doTrade2(give,get,otherId); give.forEach(id=>logMove(S.players[id],'트레이드',S.user,otherId,`↔ ${get.map(x=>S.players[x].name).join(', ')}`)); get.forEach(id=>logMove(S.players[id],'트레이드',otherId,S.user,`↔ ${give.map(x=>S.players[x].name).join(', ')}`)); };
const _releasePlayer2 = releasePlayer;
releasePlayer = function(pid){ const p=S.players[pid], from=p?.team; const e=_releasePlayer2(pid); if(!e) logMove(p,'방출',from,null,''); return e; };
const _beginOffseason3 = beginOffseason;
beginOffseason = function(){ const prevTeam={}; for(const p of Object.values(S.players)) if(p.team) prevTeam[p.id]=p.team;
  _beginOffseason3();
  for(const p of Object.values(S.players)){ const was=prevTeam[p.id];
    if(was && p.retired && !p.team) logMove(p,'은퇴',was,null,`${p.age}세`);
    else if(was && !p.team && p.faFrom===was) logMove(p,'FA 자격 취득',was,null,'');
    else if(!was && p.team && !p.mv?.length) logMove(p,'입단',null,p.team,''); } };
const _endStove2 = endStove;
endStove = function(){ _endStove2(); for(const p of Object.values(S.players)) if(p.team && !p.mv) logMove(p, p.foreign?'외국인 영입':'입단', null, p.team, p.lg?`전 ${OV_LEAGUES[p.lg].n}`:''); };
const _newSeason3 = newSeason;
newSeason = function(){ const before={}; for(const p of Object.values(S.players)) if(p.team) before[p.id]=p.team;
  for(const p of Object.values(S.players)){ if(!p.team) continue; const last=(p.mv||[]).slice(-1)[0]; if(last && last.to && last.to!==p.team) logMove(p,'소속 변경',last.to,p.team,''); }
  for(const id in before){ const p=S.players[id]; if(p && p.released && !p.team && !(p.mv||[]).some(m=>m.type==='방출'&&m.y===S.year)) logMove(p,'방출',before[id],null,'로스터 정리'); }
  return _newSeason3(); };

// ---------- 출전 시간과 성장 ----------
function playShare(p,t){ // 1군 출전 비중 (주전 풀타임 ≈ 1)
  const g=t.w+t.l+t.t; if(g<10) return null; const st=p.st;
  const v = p.isP ? (p.pos==='SP' ? st.gs/(g/5) : st.pg/(g*0.42)) : st.pa/(g*3.9);
  return clamp(v,0,1.15);
}
function growthWord(p){ const t=S.teams[p.team]; if(!t||p.age>28) return ''; if(p.farm) return '퓨처스 실전'; const sh=playShare(p,t); if(sh==null) return ''; return sh>=0.8?'주전 출전':sh>=0.4?'간간이 출전':'출전 부족'; }
const _applyGame3 = applyGame;
applyGame = function(g){
  _applyGame3(g); if(g.post) return;
  for(const side of [0,1]){ const b=g.box[side];
    const exp=(p,amt)=>{ if(!p||p.age>25) return; const gap=(p.PA-CA(p))/20; if(gap<=0) return;
      const W=caWeights(p), ks=Object.keys(W); const k=ks[pickW(ks.map(x=>W[x]))]; growAttr(p,k,amt*Math.min(1,gap)*(0.5+R())); };
    for(const id in b.bat){ const x=b.bat[id]; if(x.pa>=2) exp(S.players[id], 0.02*(S.players[id]?.age<=22?1.3:1)*Math.min(1.25,x.pa/4)); }
    for(const x of b.pit){ if(x.outs>=3) exp(S.players[x.pid], 0.02*(S.players[x.pid]?.age<=22?1.3:1)*Math.min(1.5,x.outs/9)); }
  }
};
// ---------- 능력치 변화 기준점 (시즌 개막 시점) ----------
function snapAttrs(p){ p.aS={a:{...p.a}, pt:p.pitches?{...p.pitches}:null, m:{...p.m}, ca:CA(p), y:S.year}; }
const _initClub3 = initClub;
initClub = function(){ _initClub3(); for(const p of Object.values(S.players)) if(p.team) snapAttrs(p); };
const _newSeason4 = newSeason;
newSeason = function(){ const r=_newSeason4(); for(const p of Object.values(S.players)) if(p.team) snapAttrs(p); return r; };
function attrDelta(p, k){ const b=p.aS; if(!b) return 0; const base = k in p.a ? b.a[k] : (p.pitches && k in p.pitches) ? b.pt?.[k] : k in p.m ? b.m[k] : null; const cur = k in p.a ? p.a[k] : (p.pitches && k in p.pitches) ? p.pitches[k] : p.m[k];
  return base==null||cur==null ? 0 : cur-base; }

// ---------- 시범경기 (3월, 하루 단위) ----------
const EX_MODES = {'주전 위주':{sub:1, sp:0.1, d:'개막 라인업 그대로 — 실전 감각 유지'}, '반반':{sub:3, sp:0.35, d:'주전과 백업·유망주를 섞어 기용'}, '유망주 테스트':{sub:5, sp:0.6, d:'퓨처스·신인 위주로 기회 — 성장과 옥석 가리기'}};
function startExhib(){
  const ids=Object.keys(S.teams), n=ids.length, rounds=[], arr=ids.slice().sort(()=>R()-0.5);
  for(let r=0;r<n-1;r++){ const gs=[]; for(let i=0;i<n/2;i++){ const a=arr[i], b=arr[n-1-i]; gs.push(r%2?[a,b]:[b,a]); } rounds.push(gs); arr.splice(1,0,arr.pop()); }
  rounds.push(rounds[Math.floor(R()*rounds.length)].map(([h,a])=>[a,h]));
  let d = S.date < `${S.year+1}-03-08` ? `${S.year+1}-03-08` : S.date; const days=[];
  for(const gs of rounds){ if(new Date(d+'T12:00:00').getDay()===1) d=addDays(d,1); days.push({d, games:gs}); d=addDays(d,1); }
  S.off.exhib={days, idx:0, rec:{}, games:[], ri:{}, done:false};
  for(const p of Object.values(S.players)){ const o={}; resetStats(o); p.xst=o.st; p.xstY=S.year+1; }
  for(const t of Object.values(S.teams)){ t.exMode ||= '반반'; if(t.id!==S.user) autoEntry(t); }
  S.date=days[0].d;
}
function exhibLineup(t){ const n=EX_MODES[t.id===S.user?t.exMode:'반반'].sub + (t.id===S.user?0:Math.floor(R()*2));
  const lu=t.lineup.map(x=>({...x})), used=new Set(lu.map(x=>x.pid));
  const sc=p=>(p.age<=25?6:0)+(p.PA-CA(p))/10+ovrOf(p)*0.4+R()*3;
  const cands=teamPlayers(t).filter(p=>!p.isP&&!p.inj&&!used.has(p.id)).sort((a,b)=>sc(b)-sc(a));
  let k=0; for(const i of [...lu.keys()].sort(()=>R()-0.5)){ if(k>=n) break; const slot=lu[i]; const c=cands.find(p=>!used.has(p.id)&&(slot.pos==='DH'||fit(p,slot.pos)>=0.85)); if(c){ used.add(c.id); slot.pid=c.id; k++; } }
  return lu;
}
function exhibStarter(t){ const m=EX_MODES[t.id===S.user?t.exMode:'반반'];
  const young=teamPlayers(t).filter(p=>p.isP&&p.pos==='SP'&&!p.inj&&!t.rotation.includes(p.id)&&p.age<=26).sort((a,b)=>b.PA-a.PA);
  if(young.length && R()<m.sp) return pick(young.slice(0,3)).id;
  const rot=t.rotation.filter(id=>S.players[id]&&!S.players[id].inj); const ex=S.off.exhib; const i=ex.ri[t.id]=(ex.ri[t.id]||0)+1; return rot[i%rot.length];
}
const exOpt = (h,a) => ({exhib:true, lus:[exhibLineup(S.teams[a]), exhibLineup(S.teams[h])], sps:[exhibStarter(S.teams[a]), exhibStarter(S.teams[h])]});
function applyExhib(g, mine){
  const ex=S.off.exhib, sides=[g.away,g.home];
  for(const side of [0,1]){ const b=g.box[side];
    for(const id in b.bat){ const p=S.players[id], x=b.bat[id]; if(!p) continue; const st=p.xst; st.g++; for(const k of BAT_K) st[k]+=x[k]||0;
      if(p.age<=25 && x.pa>=2 && p.PA>CA(p)){ const W=caWeights(p), ks=Object.keys(W); growAttr(p, ks[pickW(ks.map(k=>W[k]))], 0.025*(0.5+R())); } }
    b.pit.forEach((x,i)=>{ const p=S.players[x.pid]; if(!p) return; const st=p.xst; st.pg++; if(i===0) st.gs++; st.outs+=x.outs; st.ph+=x.h; st.er+=Math.max(0,x.er); st.pbb+=x.bb; st.pk+=x.k; st.phr+=x.hr;
      if(i===0) p.rest=0; else p.fat+=x.pc;
      if(p.age<=25 && x.outs>=3 && p.PA>CA(p)){ const W=caWeights(p), ks=Object.keys(W); growAttr(p, ks[pickW(ks.map(k=>W[k]))], 0.025*(0.5+R())); } });
  }
  if(g.dec.w){ S.players[g.dec.w].xst.w++; S.players[g.dec.l].xst.l++; if(g.dec.sv) S.players[g.dec.sv].xst.sv++; }
  const rec=x=>ex.rec[x] ||= [0,0,0];
  if(g.score[0]===g.score[1]){ rec(g.home)[2]++; rec(g.away)[2]++; } else { const w=g.score[1]>g.score[0]?g.home:g.away, l=w===g.home?g.away:g.home; rec(w)[0]++; rec(l)[1]++; }
  ex.games.push({d:S.date, h:g.home, a:g.away, s:g.score, full:mine?g:null});
}
function exEndDay(){ const ex=S.off.exhib; dailyUpdate(); ex.idx++;
  if(ex.idx>=ex.days.length){ ex.done=true; const r=ex.rec[S.user]||[0,0,0];
    mail('리그 사무국','시범경기 종료',`${S.year+1} 시범경기가 끝났습니다. 우리 팀 ${r[0]}승 ${r[1]}패 ${r[2]}무.\n시범경기 화면에서 유망주들의 기록을 확인하고 개막 엔트리를 정하세요. 상단의 <b>개막</b> 버튼을 누르면 정규시즌이 시작됩니다.`,'board'); }
  else S.date=ex.days[ex.idx].d; }
function advanceExhibDay(liveCb){
  const ex=S.off.exhib, day=ex.days[ex.idx]; if(!day) return null;
  let um=null;
  for(const [h,a] of day.games){ if(h===S.user||a===S.user){ um=[h,a]; continue; } applyExhib(simGame(h,a,exOpt(h,a)), false); }
  if(!um){ exEndDay(); return null; }
  const fin=g=>{ applyExhib(g,true); const f=ex.games.filter(x=>x.full); if(f.length>10) f[0].full=null; exEndDay(); return g; };
  if(liveCb){ liveCb(gameGen(um[0],um[1],{...exOpt(um[0],um[1]),log:true,live:true}), fin, um); return 'live'; }
  return fin(simGame(um[0],um[1],{...exOpt(um[0],um[1]),log:true}));
}
function exhibAdv(n){ for(let i=0;i<n;i++){ const ex=S.off?.exhib; if(!ex||ex.idx>=ex.days.length) break; advanceExhibDay(); } }
const _todayMatch = todayMatch;
todayMatch = function(){ if(isExhib()){ const ex=S.off.exhib, d=ex.days[ex.idx]; return d ? (d.games.find(g=>g.includes(S.user))||null) : null; } return _todayMatch(); };

// ---------- 웨이버 공시 · 자유계약 ----------
const WAIVER_DAYS = 7;
const _releasePlayer3 = releasePlayer;
releasePlayer = function(pid){
  const p=S.players[pid], u=S.teams[S.user];
  const left = S.phase==='regular' ? (1-S.dayIdx/144) : S.phase==='off' ? 1 : 0;
  const owe = p ? r1(p.salary*left + p.salary*Math.max(0,(p.yrs||1)-1)*(p.foreign?0:1)) : 0;
  const e=_releasePlayer3(pid); if(e) return e;
  p.waiver={from:S.user, until:addDays(S.date,WAIVER_DAYS), owe}; p.ask=askOf(p); p.freeAgent=false;
  mail('리그 사무국',`웨이버 공시: ${p.name}`,`${p.name}을(를) 웨이버 공시했습니다. ${WAIVER_DAYS}일(${p.waiver.until}까지) 동안 다른 구단이 데려갈 수 있어요.\n데려가는 구단이 나오면 남은 연봉 부담(${owe}억)이 넘어가 돌려받습니다. 아무도 데려가지 않으면 자유계약 선수가 됩니다.`,'info');
  save(); return null;
};
function processWaivers(days=1){
  for(const p of Object.values(S.players)){
    const w=p.waiver; if(!w || p.team) continue;
    for(const t of Object.values(S.teams)){ if(t.id===S.user || t.id===w.from || t.roster.length>=46) continue;
      const need=teamNeed(t,p), prob=clamp(need-0.12,0,0.5)*0.35*days;
      if(R()<prob){ p.team=t.id; t.roster.push(p.id); p.waiver=null; p.released=false; p.freeAgent=false; p.morale=65; autoEntry(t);
        logMove(p,'웨이버 영입',w.from,t.id,`잔여 연봉 ${w.owe}억 승계`);
        if(w.from===S.user){ if(w.owe>0) ledg(S.teams[S.user],'comp',w.owe); mail('리그 사무국',`웨이버 클레임: ${p.name}`,`${TD(t.id).name}이(가) 웨이버 공시된 ${p.name}을(를) 데려갔습니다. 남은 연봉 ${w.owe}억을 돌려받았습니다.`,'info'); }
        break; } }
    if(p.waiver && S.date>=w.until){ p.waiver=null; p.freeAgent=true;
      if(w.from===S.user) mail('리그 사무국',`자유계약 공시: ${p.name}`,`웨이버 기간 동안 ${p.name}을(를) 데려가는 구단이 없어 자유계약 선수가 됐습니다. 이제 어느 구단과도 계약할 수 있어요.`,'info'); }
  }
}
const faAskOf = p => r1(Math.max(0.3, marketValue(p)*0.55));
function signFreeAgent(pid, sal, want){
  const p=S.players[pid], u=S.teams[S.user]; if(!p || p.team || !p.freeAgent) return '영입할 수 없는 선수입니다.';
  if(S.phase==='post') return '포스트시즌 중에는 선수를 등록할 수 없습니다.';
  if(S.phase==='regular' && md()>F_RULE.lastDay) return '8월 15일 이후에는 새 선수를 등록할 수 없습니다.';
  if(u.roster.length>=ROSTER_MAX_USER) return `보류 선수 최대 인원(${ROSTER_MAX_USER}명)이 찼습니다.`;
  if(payroll(u)+sal>u.bud.wage) return `연봉 예산 초과 (예산 ${u.bud.wage}억, 현재 ${r1(payroll(u))}억).`;
  let slot=null; if(p.foreign){ slot=slotFor(u,p,sal,0,want); if(slot!=='reg'&&slot!=='aq') return slot; if(S.phase==='regular' && (u.fRep||0)>=F_RULE.replace) return '올 시즌 외국인 교체 횟수(2회)를 모두 썼습니다.'; }
  const ask=faAskOf(p); if(sal<ask*0.8) return `${p.name} 측: "최소 ${ask}억은 받아야 합니다."`;
  if(sal<ask && R()<0.5) return `${p.name} 측이 고민 끝에 거절했습니다. 조금 더 올려 보세요 (요구 ${ask}억).`;
  p.team=S.user; u.roster.push(p.id); p.salary=r1(sal); p.yrs=1; p.cyrs=1; p.bonus=0; p.freeAgent=false; p.released=false; p.morale=70; if(slot) p.aq=slot==='aq';
  p.farm=act1(u).length>=ENTRY_MAX; if(p.foreign && S.phase==='regular') u.fRep=(u.fRep||0)+1;
  logMove(p,'자유계약 영입',null,S.user,`연봉 ${p.salary}억`); validateTeam(u,false);
  mail('프런트',`자유계약 영입: ${p.name}`,`${p.name}과(와) 1년 연봉 ${p.salary}억에 계약했습니다.${p.farm?' (1군 엔트리가 가득 차 퓨처스에 등록)':''}`,'info');
  save(); return null;
}
const _clubDay = clubDay;
clubDay = function(){ _clubDay(); processWaivers(1); };
const _advanceOff2 = advanceOff;
advanceOff = function(weeks=1, until){
  for(let i=0;i<weeks;i++){
    if(S.phase!=='off' || !S.off) break;
    if(S.off.stage==='exhib'){ _advanceOff2(until?1:(weeks-i>1?2:1), !!until); return; }   // 시범경기 구간은 원래 흐름 그대로
    const st=S.off.stage; _advanceOff2(1, false); processWaivers(7); scoutWeek();
    if(until && S.off && S.off.stage!==st) break;
  } };
const _beginOffseason4 = beginOffseason;
beginOffseason = function(){ _beginOffseason4(); for(const p of Object.values(S.players)) if(!p.team && (p.freeAgent||p.waiver) && !S.off.pool.includes(p.id)){ p.waiver=null; p.freeAgent=false; p.faFrom=p.faFrom||null; p.ask=askOf(p); S.off.pool.push(p.id); } };

// ---------- 고교 · 대학 야구 (학년제) ----------
const SCHOOLS = () => [...HS_LIST.map(([n,r])=>({n,r,t:'고교'})), ...UNI_LIST.map(([n,r,y])=>({n,r,t:y===2?'대학(2년제)':'대학'}))];
const lastGrade = t => t==='고교'?3:t==='대학(2년제)'?2:4;
function amStatOf(p){ const hs=p.schoolType==='고교', d=ovrOf(p)-(hs?7.7:9.1);
  return p.isP ? {ip:Math.round(25+R()*50), era:clamp(2.8-d*0.45+(R()-0.5)*0.9,0.4,7).toFixed(2), k:Math.round((25+R()*50)*(0.8+p.a.stf/18)), top:kmh(p)+Math.round(R()*3)}
               : {g:Math.round(20+R()*16), avg:clamp(0.3+d*0.03+(R()-0.5)*0.05,0.18,0.5).toFixed(3).replace(/^0/,''), hr:Math.max(0,Math.round((p.a.pow-6)*0.6+d+(R()-0.5)*3)), sb:Math.max(0,Math.round((p.a.stl-6)*1.2+(R()-0.5)*4))}; }
function genAmateur(sc, type, region, grade){
  const hs=type==='고교', last=lastGrade(type), left=Math.max(0,last-grade), isP=R()<0.52;
  const pos = isP ? pick(['SP','SP','RP']) : pick(['C','SS','SS','2B','3B','CF','RF','LF','1B','IF','OF']);
  const oS = hs ? 5.5+R()*4 : 7.2+R()*3.8, o = Math.max(3.5, oS-left*0.9);
  const r=R(); let pot = r<0.003 ? 18.5+R() : r<0.02 ? 16.5+R()*1.8 : r<0.10 ? 14.5+R()*2 : r<0.40 ? 12+R()*2.5 : 9+R()*3;
  if(!hs) pot=Math.min(pot,16.5); pot=clamp(Math.max(pot,oS+1),7,19.6);
  const tags = isP ? pick(['K','L','B','','','K']) : pick(['P','C','S','D','E','','']);
  const age = hs ? 15+grade : 18+grade;
  const p = mkPlayer(`${genName()}|${pos}|${R()<0.3?'L':'R'}|${age}|${o.toFixed(1)}|${pot.toFixed(1)}|${tags}`, 'AM', S.nextPid++);
  p.team=null; p.am={g:grade, last}; p.school=sc; p.schoolType=type; p.region=region; p.salary=0.3; p.yrs=1;
  p.dnz=R()*2-1; p.dk=Math.round(10+R()*8+(region===CITY_REGION[TD(S.user).city]?12:0)); p.amStat=amStatOf(p);
  S.players[p.id]=p; return p;
}
function initAmateur(shift=0){
  S.amateur={watch:[], lastYear:S.year};
  for(const s of SCHOOLS()){ const last=lastGrade(s.t); for(let g=1; g<=last; g++){ const n = s.t==='고교'?2:(R()<0.5?1:2); for(let i=0;i<n;i++) genAmateur(s.n,s.t,s.r,g-shift); } }
}
function amateurYear(){
  S.amateur.lastYear=S.year;
  for(const p of Object.values(S.players)){ if(!p.am || p.team || p.draftedBy) continue;
    p.am.g++; p.age++; const gap=(p.PA-CA(p))/10, W=caWeights(p);
    for(const k in W) growAttr(p,k,clamp(gap*0.14+R()*0.25,0,1.3));
    if(p.am.g===p.am.last) p.amStat=amStatOf(p); else p.amStat=amStatOf(p); }
  for(const s of SCHOOLS()){ const n = s.t==='고교'?2:(R()<0.5?1:2); for(let i=0;i<n;i++) genAmateur(s.n,s.t,s.r,1); }
}
makeDraftClass = function(){
  if(!S.amateur) initAmateur(); else if(S.amateur.lastYear!==S.year) amateurYear();
  const pool=Object.values(S.players).filter(p=>p.am && !p.team && !p.draftedBy && p.am.g>=p.am.last).map(p=>{ p.prospect=true; return p.id; });
  return {year:S.year, pool, watch:[], done:false, active:false, picks:[], idx:0, log:[]};
};
const schoolWatchMax = () => 1+Math.floor(S.teams[S.user].staff['국내스카우트'].rating/6);
function toggleSchoolWatch(name){ const w=S.amateur.watch, i=w.indexOf(name); if(i>=0){ w.splice(i,1); save(); return null; }
  if(w.length>=schoolWatchMax()) return `스카우트를 보낼 수 있는 학교는 ${schoolWatchMax()}곳까지예요 (국내 스카우트 능력에 따라 늘어나요).`; w.push(name); save(); return null; }
scoutWeek = function(){
  const u=S.teams[S.user], sc=u.staff['국내스카우트'].rating, W=S.amateur?.watch||[], d=S.dclass;
  for(const p of Object.values(S.players)){ if(!p.am || p.team || p.draftedBy) continue;
    let inc=0.5+sc*0.05; if(W.includes(p.school)) inc+=5+sc*0.45; if(d && !d.done && d.watch.includes(p.id)) inc+=4+sc*0.4;
    p.dk=Math.min(95,p.dk+inc); }
  if(W.length) ledg(u,'scout',-0.05*W.length);
};
const _endDraftSept2 = endDraftSept;
endDraftSept = function(){ const d=S.dclass, unis=UNI_LIST.filter(u=>u[2]===4);
  for(const id of d.pool){ const p=S.players[id]; if(!p || !p.prospect) continue;
    if(p.schoolType==='고교' && R()<0.45){ const [n,r]=pick(unis); p.prospect=false; p.am={g:0,last:4}; p.school=n; p.schoolType='대학'; p.region=r; } }   // 미지명 고졸 → 대학 진학
  d.pool=d.pool.filter(id=>S.players[id]?.prospect || S.players[id]?.draftedBy);
  _endDraftSept2(); };
const _dPick2 = dPick;
dPick = function(tid,p){ _dPick2(tid,p); if(p) delete p.am; };

// ---------- 해외 진출 (MLB · NPB) ----------
const ABROAD = {MLB:{n:'MLB', bar:158}, NPB:{n:'일본 NPB', bar:143}};
function abroadLine(p, score){ const L=p.isP;
  return L ? {ip:Math.round(clamp(80+score*4+R()*40,15,190)), era:clamp(4.3-score*0.09+(R()-0.5)*0.8,1.8,8).toFixed(2), k:Math.round(clamp(70+score*3+R()*40,10,230))}
           : {g:Math.round(clamp(100+score*3+R()*30,15,155)), avg:clamp(0.255+score*0.003+(R()-0.5)*0.03,0.17,0.34).toFixed(3).replace(/^0/,''), hr:Math.max(0,Math.round((p.a.pow-8)*1.6+score*0.4+(R()-0.5)*6))}; }
function goAbroad(p, lg, fee){
  const from=p.team, t=S.teams[from];
  t.roster=t.roster.filter(id=>id!==p.id); t.lineup=t.lineup.filter(x=>x.pid!==p.id); t.rotation=t.rotation.filter(x=>x!==p.id); if(t.closer===p.id) t.closer=null; t.setup=t.setup.filter(x=>x!==p.id);
  p.team=null; p.farm=false; p.abroad={lg, from, y0:S.year+1, yrs:lg==='MLB'?1+Math.floor(R()*3):2+Math.floor(R()*2), hist:[], status:'진출'};
  if(fee) ledg(t,'sale',fee);
  logMove(p,'해외 진출',from,null,`${ABROAD[lg].n}${fee?` · 포스팅 이적료 ${fee}억`:' · FA'}`);
  if(t.id===S.user){ fixLineup(t); fixPitching(t); } else autoEntry(t);
  mail('리그 사무국',`해외 진출: ${p.name}`,`${TD(from).name}의 ${p.name}이(가) ${ABROAD[lg].n}에 진출합니다${fee?` (포스팅 이적료 ${fee}억 → ${tShort(from)})`:''}.`,'info');
}
const abroadLg = p => CA(p)>=155 ? (R()<0.8?'MLB':'NPB') : (R()<0.4?'MLB':'NPB');
function abroadSeason(){ // 시즌이 끝날 때 해외파 1년 결과 → 잔류 또는 국내 복귀
  const back=[];
  for(const p of Object.values(S.players)){ const a=p.abroad; if(!a) continue;
    p.age++; if(p.age>=33) for(const k in p.a) growAttr(p,k,-(p.age-32)*0.12*R()); else if(p.age<=27){ const W=caWeights(p); for(const k in W) growAttr(p,k,clamp((p.PA-CA(p))/10*0.08,0,0.6)); }
    const score = CA(p)-ABROAD[a.lg].bar + (R()*2-1)*12, line=abroadLine(p,score);
    const status = score>=8?'주전 활약':score>=-6?'백업·플래툰':'부진';
    a.hist.push({y:S.year, lg:a.lg, status, ...line}); a.status=status; a.yrs--;
    const firstFail = a.hist.length===1 && status==='부진' && R()<0.5;
    if(a.yrs<=0 || firstFail){ if(!firstFail && score>=-4 && p.age<=34){ a.yrs=1+Math.floor(R()*2); a.status='재계약'; continue; } back.push(p); }
  }
  return back;
}
function abroadCandidates(){ // 해외 진출을 노리는 국내 스타
  return Object.values(S.players).filter(p=>p.team && !p.foreign && p.age>=24 && p.age<=31 && CA(p)>=146 && !(p.mv||[]).some(m=>m.type==='국내 복귀'&&m.y>=S.year-1));
}
const _beginOffseason5 = beginOffseason;
beginOffseason = function(){
  const back = abroadSeason();
  _beginOffseason5();
  // 국내 복귀: FA 시장으로 (원소속 구단 우선 협상 효과)
  for(const p of back){ const a=p.abroad; p.abroadPast=(p.abroadPast||[]).concat(a.hist); p.abroad=null; p.faFrom=a.from; p.ask=askOf(p); p.returned=true; if(!S.off.pool.includes(p.id)) S.off.pool.push(p.id);
    logMove(p,'국내 복귀',null,null,`${ABROAD[a.lg].n} ${a.hist.length}시즌 · 마지막 시즌 ${a.status}`);
    mail('리그 사무국',`해외파 복귀: ${p.name}`,`${p.name}이(가) ${ABROAD[a.lg].n} 생활을 마치고 돌아와 FA 시장에 나왔습니다. 원소속 구단 ${tShort(a.from)}이(가) 협상에서 유리합니다.`,'info'); }
  // 새 해외 진출: AI 구단 스타 (연 최대 2명), 우리 선수는 허락 여부를 묻는다
  let n=0;
  for(const p of abroadCandidates().sort(()=>R()-0.5)){
    const ch = (CA(p)>=158?0.16:0.05) * (0.6+hv(p,'amb')/25);
    if(R()>ch) continue;
    const lg=abroadLg(p), fee=r1(marketValue(p)*2.5);
    if(p.team===S.user){ mail(`${p.name} 에이전트`,'해외 진출 희망',`${p.name}이(가) ${ABROAD[lg].n} 진출을 위해 포스팅을 허락해 달라고 요청했습니다.\n\n<b>수락</b>: 포스팅을 허락합니다 (예상 이적료 ${fee}억, 선수는 팀을 떠나요).\n<b>거절</b>: 남게 합니다 (사기 크게 하락).`,'trade',{type:'pev',kind:'post',pid:p.id,lg,fee,yes:'포스팅 허락',no:'잔류 설득'}); }
    else if(n<2){ goAbroad(p,lg,fee); n++; }
  }
  // FA 시장에 나온 대어 일부는 해외로
  for(const id of S.off.pool.slice()){ const p=S.players[id]; if(n>=2) break; if(!p || p.team || p.foreign || p.returned || p.age>31 || CA(p)<150 || R()>0.06) continue; n++;
    S.off.pool=S.off.pool.filter(x=>x!==id); p.team=p.faFrom; if(p.team){ const t=S.teams[p.team]; t.roster.push(p.id); goAbroad(p, abroadLg(p), 0); } }
};
const _pevResolve = pevResolve;
pevResolve = function(i, yes){ const a=S.inbox[i]?.action; if(a?.kind!=='post') return _pevResolve(i,yes);
  const p=S.players[a.pid]; if(a.done) return '이미 처리했습니다.'; if(!p || p.team!==S.user){ a.done='expired'; save(); return '해당 선수가 더 이상 우리 팀에 없습니다.'; }
  a.done = yes?'accepted':'declined';
  if(yes){ goAbroad(p, a.lg, a.fee); save(); return `${p.name}의 포스팅을 허락했습니다. 이적료 ${a.fee}억을 받았어요.`; }
  p.morale=clamp(p.morale-15-(hv(p,'amb')-10),20,100); save(); return `${p.name}이(가) 크게 실망했습니다. 내년에 다시 요청할 수 있어요.`; };

// ---------- 가상 이름 변환표 (이전 저장 파일 호환) ----------
const NAME_MAP_H = {"1513459581": "치리나스", "930030409": "톨하스트", "2451521624": "손철영", "742953763": "임철규", "1296910829": "송범기", "2539656209": "라클란 웰치", "2327660482": "유영태", "3992887184": "김진윤", "3022180273": "이정연", "4237441838": "함혁주", "917736163": "장현우", "340748158": "김범우", "1400878749": "홍서기", "1549827344": "박해재", "1457191119": "신민규", "1926421587": "오스턴", "3081406876": "문보상", "4002842371": "오석환", "1236230593": "박연원", "3900329370": "문수주", "2168113176": "구본민", "1598941650": "천태호", "3546950227": "이주재", "1711127792": "최원건", "493287011": "에르난디스", "1292121373": "오웬 하이트", "642898151": "류철진", "1692350770": "문상주", "3627444763": "왕옌창", "3223235941": "엄찬백", "3323295943": "김서용", "1165199860": "정기주", "2445933321": "박상용", "1822776324": "주선상", "1167301321": "조서욱", "191649712": "황도서", "913796803": "페라타", "3568198257": "강하호", "1925010779": "노율환", "456160072": "채재성", "3287882787": "문현우", "1421004339": "심우건", "997355092": "하주상", "857641363": "이도서", "3170908455": "최찬훈", "2329703955": "허인용", "139726204": "이호석", "1040982046": "황찬묵", "2786486123": "김동연", "4166706077": "미치 하이트", "1530055379": "버하센", "224026442": "김범현", "3890845265": "다케다 소타", "598456979": "김건상", "3468409022": "문지원", "3349117114": "조한현", "2699616522": "노찬은", "1627655835": "이경운", "3472716697": "김인", "845793695": "한두용", "997318656": "박시주", "210644613": "에레디오", "3155573834": "최서", "804196867": "김재태", "1029791607": "한혁섬", "2537442283": "최율훈", "3745721757": "박태한", "3118570164": "정영재", "1053705290": "고명진", "476365722": "조한우", "3117420552": "이성영", "1437888370": "안상승", "3222154395": "오윤곤", "239752187": "후라노", "2577604227": "원태승", "3327123306": "해닝", "2736006903": "최원서", "3440776286": "이선현", "1263351897": "이선현(좌)", "4242965757": "백성현", "198448727": "김하윤", "2320319413": "미야지 유마", "3197314432": "배찬건", "1173626000": "이진성", "3459344739": "김범훈", "1524500877": "이선현(우)", "2137762586": "양창진", "358706999": "디아스", "2831236112": "구자수", "873400718": "최형철", "156194349": "김지웅", "583557851": "이지현", "1797051827": "김승찬", "1611157292": "류주혁", "3375086548": "강민범", "127017226": "김성율", "3551484606": "이율규", "2558872341": "박기규", "1081405134": "이석헌", "26863906": "전선우", "3442257227": "와일리", "2415559326": "구선모", "3698545627": "케일러", "4193490536": "신민윤", "737124646": "김상원", "3176417425": "도다 나오키", "1474284600": "류진윤", "4035951058": "김영원", "1019693251": "전경민", "4142131899": "김연호", "2423776051": "배재우", "1396673470": "임선호", "2979665301": "데이비스", "2260981948": "박주우", "2600231659": "김주규", "2721267924": "권수동", "3421320884": "박건동", "2254331004": "김휘범", "2772453722": "김형태", "2901998088": "이민성", "2213137595": "서호원", "1860035383": "천재지", "2989260910": "최용원", "1490705170": "안영열", "3933417194": "오지수", "1864666767": "자우어", "1191492018": "고영훈", "3390937390": "소상준", "4012720411": "보쉴러", "623389196": "오원도", "750258537": "스기모토 코우지", "1258501285": "박용현", "629499730": "손도현", "2376563141": "한진혁", "2429619914": "원재현", "306165141": "주승", "1516138003": "김건수", "770039030": "전영주", "1883597871": "안수민", "2454075153": "할리어드", "1131573019": "김현혁", "1728421251": "최원규", "2730603814": "허경준", "710732550": "김철수", "696390921": "장성철", "2371541878": "권준진", "682875670": "문윤철", "2894755146": "배정민", "117151843": "이민연", "3785264129": "한승하", "2647935300": "강현재", "407176464": "장준도", "3492472563": "로드리게즈", "2846279315": "비즐리", "1917268775": "박세진", "3100049847": "나균우", "1845351952": "김범욱", "2789435203": "교야마 마사키", "4231710436": "김율중", "4151304888": "최준호", "1932903648": "정우원", "1078963148": "정현상", "1247434324": "홍민한", "3931946750": "구승석", "2884130090": "윤서빈", "2752950853": "레이너스", "3999094235": "전준원", "945735862": "윤동규", "2540374693": "황건빈", "4058792458": "고승윤", "701752709": "나동엽", "2803266236": "손도영", "2608364675": "전민호", "3612296642": "유동남", "2319842686": "한동주", "3172993788": "한준양", "3052482227": "장진성", "3886386064": "정보하", "2170568312": "김민주", "1028075357": "베일", "559023461": "몰러", "1135073879": "양규종", "2675123447": "이의진", "4041922210": "윤석철", "1483444959": "김찬현", "3215143991": "정해하", "1694991406": "조규우", "3832848662": "전상찬", "3401109191": "최지석", "3279210898": "성한탁", "966300232": "이준진", "692534637": "황준하", "1401207552": "김도재", "219782081": "파스트로", "1104034409": "데인", "2002123842": "나율범", "1625163199": "김선건", "3934684692": "김호훈", "863363418": "이창찬", "648029675": "김서군", "2267373723": "한준상", "3233172251": "오선건", "1312938499": "윤도훈", "2629234532": "박인", "628291309": "고지욱", "3040449117": "박정건", "3836075980": "잭 로건", "1323939360": "곽찬", "2277936398": "플레센", "4082076221": "최승윤", "657222120": "최민연", "4146499115": "다무라 이치타", "2686395490": "김택우", "1379427322": "이지하", "4193697679": "박범국", "2537875792": "박신혁", "1667478468": "양의수", "808566660": "박현호", "1031003631": "카메런", "3950805297": "양철환", "4223708368": "정수도", "2471591474": "오원진", "124360868": "박준승", "1566574028": "김민도", "1660405929": "강범호", "3794324692": "안재지", "2043106871": "김기성", "4072816443": "김인현", "1973402875": "추재윤", "1365753556": "조주행", "1019687439": "이유민", "251253907": "안우기", "566192481": "데 레이수스", "1196073019": "요키스", "2717757290": "하영석", "3897087300": "정현연", "1845972731": "김범하", "4044511259": "가나쿠보 유키", "3682717986": "주석우", "2210188878": "원민현", "2984611962": "조영승", "3398095479": "박윤훈", "3487080418": "김도민", "1000676302": "윤석현", "711945288": "이주연", "2458842662": "브록스", "1853143303": "최주우", "170336656": "안치도", "542656551": "임규열", "727222431": "어준도", "614200037": "여동윤", "4291080679": "김건도", "3958286071": "김재주", "4089351307": "박건홍", "1259070939": "전태용", "2655059717": "이우종", "866318498": "권혁규", "2495472855": "오선인", "2233155613": "염율엽", "936348122": "김준문", "2753424409": "이지용", "1443662256": "박진범", "384252563": "이상준", "2361860998": "이수철", "154153796": "김태석", "1399277655": "이범인", "4162020760": "김원서", "3188953394": "설석진"};   // 이전 저장의 이름 → 가상 이름 (원래 이름의 해시를 키로)

// ---------- 새 게임: 2025 시즌 종료 후 스토브리그에서 시작 ----------
const _newGame3 = newGame;
newGame = function(userId, mgrName){ _newGame3(userId, mgrName); startFromStove(); };
function startFromStove(){
  const order=TEAM_DATA.slice().sort((a,b)=>a.prevRank-b.prevRank).map(t=>t.id);
  S.year=2025; S.phase='off'; S.date='2025-11-03'; S.dayIdx=0; S.results=[]; S.finalRank=order.slice(); S.prevFinal=order.slice();
  for(const p of Object.values(S.players)) if(p.am){ p.am.g--; p.age--; p.prospect=false; }   // 개막 때 한 학년 올라간다
  S.amateur.lastYear=2025; S.dclass={year:2025, pool:[], watch:[], done:true, active:false, picks:[], idx:0, log:[], pre:true};
  const pool=[], ids=Object.keys(S.teams);
  for(let i=0;i<10;i++){ const isP=R()<0.5, pos=isP?pick(['SP','RP','RP']):pick(['1B','2B','3B','SS','LF','CF','RF','C','DH']), age=29+Math.floor(R()*7), o=11+R()*3.2;
    const p=mkPlayer(`${genName()}|${pos}|${R()<0.3?'L':'R'}|${age}|${o.toFixed(1)}|${(o+0.4).toFixed(1)}|`, 'FA', S.nextPid++);
    p.team=null; p.faFrom=pick(ids); p.ask=askOf(p); p.yrs=0; S.players[p.id]=p; logMove(p,'FA 자격 취득',p.faFrom,null,''); pool.push(p.id); }
  const lgs=Object.keys(OV_LEAGUES);
  for(let i=0;i<14;i++){ const p=genOverseas(pick(lgs),10); p.sk=50; p.ovPool=true; pool.push(p.id); }
  S.off={stage:'stove', pool, offers:{}, log:[], week:0, retired:[], exhib:null, fcampDone:0};
  S.inbox=S.inbox.filter(m=>!/신인 드래프트 준비/.test(m.title));
  mail('이사회','2025 시즌 종료 · 스토브리그 개막',`${S.mgrName} 감독님, ${TD(S.user).name}에 오신 것을 환영합니다. 2025 시즌이 끝나고 스토브리그가 시작됐습니다.\n\n<b>개막(2026년 3월 28일)까지 할 일</b>\n· FA 시장에서 전력 보강 (영입 → FA · 스토브리그)\n· 트레이드 · 해외 스카우트로 외국인 선수 점검\n· 11월 마무리캠프 · 2월 스프링캠프 계획 (훈련 → 캠프)\n· 고교·대학 유망주 관찰 시작 (영입 → 고교 · 대학 야구)\n· 3월 시범경기에서 개막 엔트리 결정\n\n상단의 <b>계속</b>을 누르면 1주씩 진행됩니다.`,'board');
  save();
}

// ---------- 선수 키우는 재미: 잠재력 각성 · 월간 육성 리포트 ----------
function breakoutWeek(){
  if(S.phase!=='regular' && !(S.phase==='off' && S.off?.stage==='camp')) return;
  for(const t of Object.values(S.teams)) for(const p of teamPlayers(t)){
    if(p.age>24 || p.breakout || p.inj) continue;
    const sh = p.farm ? 0.7 : (playShare(p,t) ?? 0.5);
    const ch = 0.0035 * (0.5+sh) * (0.6+hv(p,'pro')/25) * (S.off?.stage==='camp'?1.5:1);
    if(R()>ch) continue;
    const up=Math.round(15+R()*20), W=caWeights(p), ks=Object.keys(W).sort((a,b)=>W[b]-W[a]).slice(0,3);
    p.PA=Math.min(200,p.PA+up); p.breakout=S.year; ks.forEach(k=>growAttr(p,k,0.6+R()*0.6)); p.morale=clamp(p.morale+10,20,100);
    if(t.id===S.user) mail('코치진',`잠재력 각성: ${p.name}`,`${p.age}세 ${POS_KO[p.pos]} <b>${p.name}</b>이(가) 뭔가를 깨달은 듯합니다. 코치진은 잠재력이 한 단계 올라갔다고 평가합니다 (잠재력 ▲${up}).\n${ks.map(k=>(p.isP?P_ATTR:H_ATTR)[k]).join('·')}이(가) 눈에 띄게 좋아졌습니다. 꾸준히 기회를 주면 더 크게 자랄 수 있어요.`,'staff');
    else if(CA(p)>=110 && R()<0.3) mail('리그 사무국',`리그 소식: ${tShort(t.id)} 유망주 ${p.name} 급성장`,`${TD(t.id).name}의 ${p.age}세 ${POS_KO[p.pos]} ${p.name}이(가) 잠재력을 터뜨리고 있다는 평가입니다. 트레이드 시장에서 몸값이 오를 것 같습니다.`,'info');
  }
}
function growthReport(){
  const u=S.teams[S.user], ps=teamPlayers(u).filter(p=>p.aS).map(p=>({p, d:CA(p)-p.aS.ca})).sort((a,b)=>b.d-a.d);
  const top=ps.filter(x=>x.d>=2).slice(0,6); if(!top.length) return;
  const young=teamPlayers(u).filter(p=>p.age<=23).sort((a,b)=>b.PA-a.PA).slice(0,3);
  mail('코치진','월간 육성 리포트',`<b>시즌 개막 대비 많이 성장한 선수</b>\n${top.map(x=>`· ${x.p.name} (${x.p.age}세 ${POS_KO[x.p.pos]}) 능력 ▲${x.d} · ${growthWord(x.p)||'—'}`).join('\n')}\n\n<b>코치진이 주목하는 23세 이하</b>\n${young.map(p=>`· ${p.name} ${POS_KO[p.pos]} — ${p.farm?'퓨처스에서 성장 중':growthWord(p)}`).join('\n')}\n\n어린 선수는 1군에서 꾸준히 뛸수록 빨리 자랍니다.`,'staff');
}
const _clubWeekly2 = clubWeekly;
clubWeekly = function(t){ _clubWeekly2(t); if(t.id===S.user){ breakoutWeek(); if(S.phase==='regular' && S.dayIdx%24===0 && S.dayIdx>0) growthReport(); } };

// ---------- 해외 스카우트 재미: 숨은 보석 ----------
const GEM_LEAGUES = new Set(['AA','NPB2','JIL','CPBL','LMB','ABL','IND','LIDOM']);
const _genOverseas2 = genOverseas;
genOverseas = function(lg, skill=10){ const p=_genOverseas2(lg, skill);
  if(GEM_LEAGUES.has(lg) && p.age<=26 && R()<0.08){ p.gem=true; p.PA=Math.min(200, Math.round(p.PA+25+R()*15)); }
  return p; };
const _checkMission2 = checkMission;
checkMission = function(){ const u=S.teams[S.user], before=new Set(u.ovs?.cands||[]); _checkMission2();
  const fresh=(u.ovs?.cands||[]).filter(id=>!before.has(id)).map(id=>S.players[id]).filter(p=>p?.gem);
  for(const p of fresh) if(R() < 0.35+u.staff['해외스카우트'].rating*0.03) mail('해외 스카우트',`숨은 보석 후보: ${p.name}`,`${OV_LEAGUES[p.lg].n}의 ${p.age}세 ${POS_KO[p.pos]} <b>${p.name}</b>. 지금 기록은 평범하지만 몸의 탄력과 습득 속도가 남다릅니다. 추가 관찰을 해 보시길 권합니다.`,'staff'); };

// ---------- 트레이드 재미: AI 역제안 ----------
const _evaluateTrade = evaluateTrade;
evaluateTrade = function(give, get, otherId){
  const r=_evaluateTrade(give, get, otherId); if(r.ok || r.ratio==null || r.ratio<0.55) return r;
  const vg=give.reduce((s,id)=>s+tradeValue(S.players[id]),0), vr=get.reduce((s,id)=>s+tradeValue(S.players[id]),0), gap=vr*1.12-vg;
  const cands=teamPlayers(S.teams[S.user]).filter(p=>!give.includes(p.id) && !p.inj && tradeValue(p)>=gap && !tradeCheck([...give,p.id],get,otherId)).sort((a,b)=>tradeValue(a)-tradeValue(b));
  const add=cands[0]; if(!add || give.length>=3) return r;
  return {...r, counter:{add:add.id}, msg:`${TD(otherId).name} 단장: "그 조건만으로는 부족합니다. ${add.name}(${add.age}세 ${POS_KO[add.pos]})까지 넣어 주시면 바로 사인하겠습니다."`};
};
