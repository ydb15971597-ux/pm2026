// 프로야구 매니저 PM — 게임 엔진
const R = () => Math.random();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(R() * a.length)];
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function srng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const PITCH_POS = ['SP','RP','CL'];
const POS_KO = {SP:'선발',RP:'불펜',CL:'마무리',C:'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수',DH:'지명',IF:'내야',OF:'외야'};
const H_GROUPS = {
  '타격':{con:'컨택',gap:'갭파워',pow:'홈런파워',eye:'선구안',avk:'삼진회피',bnt:'번트'},
  '주루':{spd:'스피드',stl:'도루',brn:'주루센스'},
  '수비':{rng:'수비범위',hnd:'포구',arm:'송구',dp:'병살처리',cat:'포수수비'}};
const P_GROUPS = {
  '투구':{vel:'구속',stf:'구위',ctl:'제구',brk:'변화구'},
  '운영':{sta:'체력',gb:'땅볼유도',hold:'견제·퀵모션',pfd:'투수수비'}};
const M_ATTR = {cmp:'침착성',cons:'일관성',det:'승부욕',lead:'리더십',dur:'내구성'};
const H_ATTR = Object.assign({}, ...Object.values(H_GROUPS));
const P_ATTR = Object.assign({}, ...Object.values(P_GROUPS));
const TRAITS = {
 '5툴 플레이어':{t:'h',d:'타격·장타·주루·수비·송구 모두 정상급'}, '클러치 히터':{t:'h',d:'득점권·접전 상황에서 타격 상승'},
 '홈런 타자':{t:'h',d:'홈런 생산력 +8%'}, '교타자':{t:'h',d:'인플레이 안타 확률 상승'}, '선구안 장인':{t:'h',d:'볼넷 증가 · 삼진 감소'},
 '대도':{t:'h',d:'도루 시도·성공률 상승'}, '좌완 킬러':{t:'h',d:'좌투수 상대 타격 상승'}, '그물망 수비':{t:'h',d:'넓은 수비 범위로 안타를 지운다'},
 '강견':{t:'h',d:'강한 송구로 주자 진루 억제'}, '큰 경기 강자':{t:'h',d:'포스트시즌 타격 상승'}, '초구 공략':{t:'h',d:'적극적 타격: 삼진·볼넷 모두 감소'},
 '닥터K':{t:'p',d:'탈삼진 +12%'}, '컨트롤 아티스트':{t:'p',d:'볼넷 -25%'}, '파이어볼러':{t:'p',d:'150km 이상 강속구 · 탈삼진 증가'},
 '땅볼 유도형':{t:'p',d:'피홈런 감소 · 병살 유도 증가'}, '이닝이터':{t:'p',d:'투구수 한계 +10'}, '위기관리':{t:'p',d:'득점권 위기에서 강해짐'},
 '에이스 기질':{t:'p',d:'포스트시즌 능력 상승'}, '철완':{t:'p',d:'연투 후 피로 회복이 빠름'}, '좌타 스페셜리스트':{t:'p',d:'좌타자 상대 강함'},
 '견제의 달인':{t:'p',d:'도루 허용 감소'}, '볼넷 남발':{t:'p',d:'볼넷 +20%',bad:1}, '뜬공 투수':{t:'p',d:'피안타 -3% · 피홈런 +5%'},
 '롱릴리프':{t:'p',d:'불펜 등판 시 투구수 한계 +12'}, '퀵모션 약점':{t:'p',d:'도루 허용 증가',bad:1}, '스태미너 부족':{t:'p',d:'선발 투구수 한계 -10',bad:1},
 '갭 히터':{t:'h',d:'2루타 확률 증가'}, '공갈포':{t:'h',d:'장타력은 있지만 삼진 +15%',bad:1}, '병살 머신':{t:'h',d:'병살타 확률 증가',bad:1},
 '수비 불안':{t:'h',d:'수비 시 실책·범위 손해',bad:1}, '주루 센스':{t:'h',d:'안타 때 한 베이스 더 가는 확률 증가'}, '번트 장인':{t:'h',d:'희생번트 성공률 +15%'},
 '우완 킬러':{t:'h',d:'우투수 상대 타격 상승'}, '배드볼 히터':{t:'h',d:'볼넷은 적지만 어려운 공도 안타로'}, '도루 저지':{t:'h',d:'(포수) 도루 저지율 상승'},
 '끈질긴 승부':{t:'h',d:'삼진 -5% · 볼넷 +5%'}, '피홈런 주의':{t:'p',d:'피홈런 +12%',bad:1}, '변화구 마술사':{t:'p',d:'변화구로 헛스윙 유도'},
 '철인':{t:'b',d:'부상 위험 크게 감소'}, '유리몸':{t:'b',d:'부상 위험 2배',bad:1}, '새가슴':{t:'b',d:'중요한 순간 능력 하락',bad:1}, '리더':{t:'b',d:'팀 사기 상승'},
};
const has = (p,t)=>p.traits && p.traits.includes(t);
const kmh = p=>Math.round(128+p.a.vel*1.5);
const CA = p=>Math.round(clamp(ovrOf(p)*10,1,200));
const COACH_ROLES = ['수석','투수','타격','수비','주루','배터리','트레이닝'];
const COACH_DESC = {수석:'선수단 사기·전술 이해도',투수:'투수 능력 성장',타격:'타자 컨택·파워·선구 성장',수비:'수비·송구 성장',
  주루:'주루 성장·도루 성공률',배터리:'포수 성장·투수 제구 보정',트레이닝:'부상 예방·컨디션 회복'};

let S = null; // 게임 상태

function genName(r = R){ return SURNAMES[Math.floor(r()*SURNAMES.length)] + GIVEN[Math.floor(r()*GIVEN.length)] + GIVEN[Math.floor(r()*GIVEN.length)]; }

function brkOf(ars){ const v=Object.entries(ars).filter(([k])=>k!=='직구'&&k!=='투심').map(x=>x[1]).sort((a,b)=>b-a); return clamp((v[0]||5)*0.55+(v[1]||5)*0.3+(v[2]||5)*0.15,1,20); }
function mkPlayer(str, teamId, idx){
  const [name,pos,hand,age,ovr,pot,tags=''] = str.split('|');
  const r = srng(hash(name+teamId)), o=+ovr, A=+age, j=(s=1.2)=>(r()*2-1)*s;
  const isP = PITCH_POS.includes(pos);
  const p = {id:teamId+'_'+idx, name, pos, team:teamId, age:A, isP, hand,
    morale:70, cond:100, inj:0, rest:6, fat:0, focus:null, foreign:FOREIGN.has(name), st:null};
  const a = {};
  if(isP){
    a.vel=o-1+j(1.5); a.stf=o+j(); a.ctl=o+j(); a.sta= pos==='SP'? o+1+j() : o-5+j(); a.gb=10+j(3.5); a.hold=10+j(3)+(hand==='L'?2:0); a.pfd=10+j(3);
    for(const k in a) a[k]+=j(0.8);
    if(tags.includes('K')){a.vel+=3;a.stf+=2.5;a.ctl-=1.5}
    if(tags.includes('L')){a.ctl+=4;a.vel-=1.5;a.gb+=1}
    if(tags.includes('B')){a.ctl+=1;a.stf-=1}
    if(pos==='CL'){a.stf+=1;a.vel+=1}
    if(A>=36) a.vel-=2;
    if(VELO[name]) a.vel=(VELO[name]-128)/1.5;
    let ars = ARSENAL[name] ? {...ARSENAL[name]} : null;
    if(!ars){ ars={}; ars[r()<0.3?'투심':'직구']=Math.round(clamp((a.vel+a.stf)/2+j(),1,20));
      const pool=['슬라이더','커브','체인지업','포크','커터','스플리터','슬라이더','체인지업'];
      const n=2+Math.floor(r()*3); let base=o+1.5+(tags.includes('B')?2:0);
      for(let i=0;i<n;i++){ let pn; do{ pn=pool[Math.floor(r()*pool.length)] }while(ars[pn]); ars[pn]=Math.round(clamp(base+j(),1,20)); base-=1.5; } }
    p.pitches=ars; a.brk=brkOf(ars);
  } else {
    a.con=o+j(); a.gap=o+j(); a.pow=o-1+j(); a.eye=o-1+j(); a.avk=o-1+j(); a.bnt=8+j(4);
    a.spd=o-1+j(); a.stl=o-2+j(); a.brn=o-1+j();
    a.rng=o+j(); a.hnd=o+j(); a.arm=o+j(); a.dp=['2B','SS','3B','IF','1B'].includes(pos)? o+j() : o-3+j(); a.cat= pos==='C'? o+1+j() : 2+j(1);
    for(const k in a) a[k]+=j(0.8); // 개인차
    if(tags.includes('P')){a.pow+=4;a.gap+=1.5;a.avk-=2.5;a.con-=1.5;a.spd-=2;a.stl-=2.5;a.bnt-=2}
    if(tags.includes('C')){a.con+=3;a.avk+=3;a.pow-=2;a.gap+=0.5}
    if(tags.includes('E')){a.eye+=4;a.avk+=1.5}
    if(tags.includes('S')){a.spd+=4;a.stl+=5;a.brn+=2;a.bnt+=4;a.pow-=2}
    if(tags.includes('D')){a.rng+=3;a.hnd+=3;a.arm+=1.5;a.dp+=1.5}
    if(!tags.includes('P') && !['1B','DH','LF','RF'].includes(pos)) a.pow-=1.5;
    if(pos==='C'){a.spd-=4;a.stl-=5;a.brn-=1;a.arm+=1}
    if(pos==='DH'){a.rng-=4;a.hnd-=3;a.spd-=2;a.stl-=2}
    if(pos==='1B'){a.rng-=3;a.spd-=2.5;a.stl-=3;a.arm-=1.5}
    if(pos==='3B'){a.arm+=1.5;a.spd-=1}
    if(pos==='SS'||pos==='CF'){a.rng+=2;a.spd+=1}
    if(pos==='2B'){a.dp+=1;a.arm-=1}
    if(A>=33){a.spd-=(A-32)*0.6;a.stl-=(A-32)*0.7;a.rng-=(A-32)*0.3}
    if(A<=24){a.eye-=1;a.avk-=1}
  }
  p.a=a; for(const k in a) a[k]=clamp(a[k],1,20);
  // 능력 총량(CA)을 입력값에 맞추도록 세부 능력 분배 보정
  const FLOOR = {'홈런 타자':['pow',16],'교타자':['con',16],'선구안 장인':['eye',16],'대도':['stl',16],'그물망 수비':['rng',16],'강견':['arm',16],
    '컨트롤 아티스트':['ctl',16],'땅볼 유도형':['gb',16],'이닝이터':['sta',17]};
  const fixed = isP ? ['vel','sta','gb','hold','pfd','brk'] : (pos==='C'?['bnt']:['bnt','cat']);
  for(const t of (TRAIT_ASSIGN[name]||[])) if(FLOOR[t]){ const [k,v]=FLOOR[t]; a[k]=Math.max(a[k],v); fixed.push(k); }
  const oT = o + (r()*2-1)*0.45;
  const soft = v => v>17.5 ? 17.5+(v-17.5)*0.6 : v;   // 상한 근처 압축: 최상위 선수끼리도 차이가 나게
  for(let it=0; it<6; it++){
    const diff=oT-ovrOf(p);
    for(const k in a) if(!fixed.includes(k)) a[k]=clamp(soft(a[k]+diff),1,20);
    if(isP){ for(const k in p.pitches) p.pitches[k]=clamp(soft(p.pitches[k]+diff),1,20); a.brk=brkOf(p.pitches); }
  }
  p.m = {cmp:10+j(4)+(A>=32?1.5:0), cons:9+j(3)+Math.min(A-20,12)*0.25, det:11+j(4), lead:6+j(3)+Math.max(0,A-27)*0.5-(p.foreign?2:0), dur:11+j(5)};
  p.traits = makeTraits(p, tags, r, TRAIT_ASSIGN[name]);
  for(const k in p.m) p.m[k]=clamp(p.m[k],1,20);
  p.PA = Math.round(clamp(Math.max(+pot*10+j(5), CA(p)+2), 20, 200));
  p.salary = calcSalary(p);
  p.yrs = initYrs(p, r);
  resetStats(p);
  return p;
}
function makeTraits(p, tags, r, assigned){
  const T = new Set(assigned||[]), a=p.a, m=p.m;
  if(T.has('클러치 히터')||T.has('위기관리')) m.cmp=Math.max(m.cmp,16);
  if(T.has('에이스 기질')) m.cmp=Math.max(m.cmp,15);
  if(T.has('철인')||T.has('철완')) m.dur=Math.max(m.dur,17);
  if(T.has('유리몸')) m.dur=Math.min(m.dur,5);
  if(T.has('리더')) m.lead=Math.max(m.lead,16);
  const add=t=>{ if(T.size<4) T.add(t); };
  if(!p.isP){
    if(a.pow>=17) add('홈런 타자'); if(a.con>=17) add('교타자'); if(a.eye>=17) add('선구안 장인');
    if(a.stl>=17) add('대도'); if(a.rng>=17) add('그물망 수비'); if(a.arm>=17 && p.pos!=='C') add('강견');
    if(p.pos==='C' && a.arm>=15) add('도루 저지');
    if(m.cmp>=17) add('클러치 히터'); if(a.gap>=16 && a.pow<16) add('갭 히터'); if(a.brn>=16) add('주루 센스'); if(a.bnt>=15) add('번트 장인');
    if(a.pow>=14 && (a.avk<=10 || a.con<=10)) add('공갈포'); if(a.spd<=6 && p.pos!=='C') add('병살 머신');
    if(a.hnd<=8 && p.pos!=='DH') add('수비 불안'); if(a.eye<=9 && a.con>=13) add('배드볼 히터');
    if(p.hand==='R' && r()<0.08) add('좌완 킬러'); if(p.hand==='L' && r()<0.08) add('우완 킬러');
    if(a.eye>=14 && a.avk>=14 && r()<0.4) add('끈질긴 승부'); if(a.eye<11 && r()<0.12) add('초구 공략');
  } else {
    if(a.vel>=17) add('파이어볼러'); if(a.ctl>=17) add('컨트롤 아티스트'); if(a.brk>=17) add('변화구 마술사');
    if(a.gb>=16) add('땅볼 유도형'); if(a.gb<=5) add('피홈런 주의'); else if(a.gb<=7) add('뜬공 투수');
    if(p.pos==='SP' && a.sta>=18) add('이닝이터'); if(p.pos==='SP' && a.sta<=10) add('스태미너 부족');
    if(p.pos==='RP' && a.sta>=12) add('롱릴리프');
    if(tags.includes('K') && a.stf>=16) add('닥터K'); if(m.cmp>=17) add('위기관리'); if(a.hold>=17) add('견제의 달인'); if(a.hold<=5) add('퀵모션 약점');
    if(a.ctl<=9) add('볼넷 남발');
    if(p.hand==='L' && p.pos!=='SP' && r()<0.3) add('좌타 스페셜리스트'); if(p.pos!=='SP' && m.dur>=17) add('철완');
  }
  if(m.dur>=18 && !T.has('철완')) add('철인'); if(m.dur<=3) add('유리몸'); if(m.cmp<=3 && !assigned) add('새가슴'); if(m.lead>=17) add('리더');
  if(T.has('철인')&&T.has('유리몸')) T.delete('철인');
  if(!T.size){ // 모든 선수는 최소 1개의 특성: 본인 능력 중 가장 두드러진 부분
    const map = p.isP
      ? [['vel','파이어볼러'],['ctl','컨트롤 아티스트'],['brk','변화구 마술사'],['gb','땅볼 유도형'],['sta',p.pos==='SP'?'이닝이터':'롱릴리프'],['hold','견제의 달인']]
      : [['con','교타자'],['pow','홈런 타자'],['eye','끈질긴 승부'],['gap','갭 히터'],['stl','대도'],['brn','주루 센스'],['rng','그물망 수비'],['arm',p.pos==='C'?'도루 저지':'강견'],['bnt','번트 장인']];
    const avg = map.reduce((s,[k])=>s+a[k],0)/map.length;
    map.sort((x,y)=>(a[y[0]]-avg)-(a[x[0]]-avg));
    T.add(map[0][1]);
  }
  return [...T].slice(0,4);
}
function calcSalary(p){
  const o = ovrOf(p); let s = Math.max(0.4, Math.pow(Math.max(o-8,0),2)*0.28);
  if(p.age<=23) s=Math.min(s,1.5); if(p.foreign) s=Math.max(s*1.2,8);
  return Math.round(s*10)/10;
}
function resetStats(p){ p.st = {g:0,pa:0,ab:0,h:0,d:0,t:0,hr:0,rbi:0,bb:0,k:0,r:0,sb:0,cs:0, pg:0,gs:0,outs:0,ph:0,er:0,pbb:0,pk:0,phr:0,w:0,l:0,sv:0,hld:0}; }

const DEFW = {C:.3,SS:.28,CF:.25,'2B':.24,'3B':.2,RF:.18,LF:.15,'1B':.1,DH:.03,IF:.22,OF:.2};
function defVal(p,pos=p.pos){ const a=p.a; if(p.isP) return 3;
  if(pos==='C') return a.cat*.5+a.arm*.3+a.hnd*.2;
  if(['2B','SS','IF'].includes(pos)) return a.rng*.4+a.hnd*.3+a.arm*.15+a.dp*.15;
  return a.rng*.5+a.hnd*.25+a.arm*.25; }
function ovrOf(p){
  const a=p.a;
  if(p.isP) return p.pos==='SP' ? a.vel*.14+a.stf*.2+a.ctl*.24+a.brk*.24+a.sta*.12+a.gb*.06 : a.vel*.18+a.stf*.24+a.ctl*.24+a.brk*.26+a.gb*.08;
  const w=DEFW[p.pos]??.2;
  return (a.con*.27+a.gap*.1+a.pow*.21+a.eye*.14+a.avk*.1+a.spd*.08+a.stl*.03+a.brn*.07)*(1-w) + defVal(p)*w;
}
const OVR = p => CA(p);
// FM식 능력 배분: 현재능력(CA, 200점 만점)이 어떤 능력에 얼마나 쓰였는지 (포지션별 가중치)
function caWeights(p){
  if(p.isP) return p.pos==='SP' ? {vel:.14,stf:.2,ctl:.24,brk:.24,sta:.12,gb:.06} : {vel:.18,stf:.24,ctl:.24,brk:.26,gb:.08};
  const w=DEFW[p.pos]??.2, o=1-w, W={con:.27*o,gap:.1*o,pow:.21*o,eye:.14*o,avk:.1*o,spd:.08*o,stl:.03*o,brn:.07*o};
  const d = p.pos==='C'?{cat:.5,arm:.3,hnd:.2}:['2B','SS','IF'].includes(p.pos)?{rng:.4,hnd:.3,arm:.15,dp:.15}:{rng:.5,hnd:.25,arm:.25};
  for(const k in d) W[k]=(W[k]||0)+d[k]*w; return W;
}
function caBreakdown(p){
  const W=caWeights(p), ca=CA(p); let raw={}, tot=0;
  for(const k in W){ raw[k]=W[k]*p.a[k]*10; tot+=raw[k]; }
  const out={}; for(const k in raw) out[k]=raw[k]/tot*ca; return out; // 합계 = CA
}
function batVal(p){ const a=p.a; return (a.con*.3+a.gap*.1+a.pow*.25+a.eye*.15+a.avk*.08+a.spd*.07+a.brn*.05)*condMul(p); }
function condMul(p){ return 1 - (100-p.cond)/400 + (p.morale-70)/1000; }

// 수비 위치 적합도
function fit(p, slot){
  if(slot==='DH') return 1;
  if(p.isP) return 0.3;
  if(p.pos===slot) return 1;
  if(slot==='C') return 0.45;
  if(p.pos==='C') return slot==='1B'?0.85:0.55;
  const IF=['1B','2B','3B','SS'], OF=['LF','CF','RF'];
  if(p.pos==='IF') return IF.includes(slot)?0.95:0.7;
  if(p.pos==='OF') return OF.includes(slot)?0.95:(slot==='1B'?0.85:0.65);
  if(p.pos==='DH') return slot==='1B'?0.85:0.6;
  if(slot==='1B') return 0.88;
  if(IF.includes(p.pos)&&IF.includes(slot)){ if(p.pos==='SS') return 0.95; if(p.pos==='1B') return 0.65; return slot==='SS'?0.78:0.88; }
  if(OF.includes(p.pos)&&OF.includes(slot)){ if(p.pos==='CF') return 0.97; return slot==='CF'?0.85:0.95; }
  return 0.65;
}

// ---------- 초기화 ----------
function newGame(userId, mgrName){
  S = {ver:3, year:2026, dayIdx:0, date:'2026-03-28', user:userId, mgrName, teams:{}, players:{}, schedule:[], results:[],
    inbox:[], phase:'regular', post:null, history:[], nextPid:1000, coachMarket:[], tradeLog:[], fired:false};
  for(const td of TEAM_DATA){
    const t = {id:td.id, w:0,l:0,t:0, rs:0,ra:0, streak:0, last:[], roster:[], lineup:[], rotation:[], rotIdx:0, closer:null, setup:[],
      tac:{steal:1, bunt:1, hook:1}, train:{hit:'균형', pit:'균형', inten:2}, staff:{},
      fanMood:60, board:65, balance:td.budget, rev:0, exp:0, goalRank:td.goalRank, mgr:{...td.mgr}};
    if(td.id===userId) t.mgr.name = mgrName || td.mgr.name;
    td.players.forEach((s,i)=>{ const p=mkPlayer(s,td.id,i); S.players[p.id]=p; t.roster.push(p.id); });
    const r = srng(hash(td.id+'staff'));
    for(const role of COACH_ROLES) t.staff[role] = {name:genName(r), rating: Math.round(9+r()*7 + (td.budget-120)/60)};
    S.teams[td.id]=t;
    autoLineup(t); autoPitching(t);
  }
  S.schedule = makeSchedule(2026);
  refreshCoachMarket();
  const ti = TD(userId), ut = S.teams[userId];
  mail('이사회', `${S.year} 시즌 목표 안내`, `${S.mgrName} 감독님, ${ti.name}에 오신 것을 환영합니다.\n\n구단 상황: ${ti.status}\n\n이사회는 이번 시즌 목표로 <b>${goalText(ut.goalRank)}</b>을(를) 기대합니다. 재정 현황과 올해 예산은 재무팀 보고를 확인하세요.`, 'board');
  mail('팬', '팬들의 목소리', `${ti.fans.desc}\n\n팬 열정 ${ti.fans.passion} · 인내심 ${ti.fans.patience} · 기대치 ${ti.fans.expect}`, 'fan');
  mail('코치진', '훈련 계획 수립 요청', '훈련 메뉴에서 야수/투수 훈련 중점과 강도를 정해주세요. 강도가 높을수록 성장은 빠르지만 부상 위험과 피로가 늘어납니다.', 'staff');
  save();
}
const TD = id => TEAM_DATA.find(t=>t.id===id);
const tShort = id => TD(id).short || TD(id).name.split(' ')[0];
function goalText(r){ return r===1?'정규시즌 1위·우승':r<=3?`${r}위 이내 (상위권)`:r<=5?'가을야구 진출 (5위 이내)':`${r}위 이내`; }
function mail(from,title,body,type='info',action=null){ S.inbox.unshift({date:S.date, from, title, body, type, read:false, action}); if(S.inbox.length>120) S.inbox.length=120; }

function refreshCoachMarket(){
  S.coachMarket = [];
  for(let i=0;i<8;i++){ const rating=Math.round(8+R()*10); S.coachMarket.push({name:genName(), role:pick(COACH_ROLES), rating, fee:Math.round(rating*rating*0.04*10)/10, age:40+Math.floor(R()*25)}); }
}

// ---------- 일정 ----------
function makeSchedule(year){
  const ids = TEAM_DATA.map(t=>t.id), n=ids.length, rounds=[];
  const arr = ids.slice();
  for(let r=0;r<n-1;r++){
    const games=[]; for(let i=0;i<n/2;i++){ const a=arr[i], b=arr[n-1-i]; games.push(r%2?[a,b]:[b,a]); }
    rounds.push(games); arr.splice(1,0,arr.pop());
  }
  const rng = srng(year), days=[];
  for(let c=0;c<16;c++){
    const order = rounds.map((g,i)=>i).sort(()=>rng()-0.5);
    for(const ri of order) days.push(rounds[ri].map(([h,a])=> c%2?[a,h]:[h,a]));
  }
  return days;
}
function addDays(date, n){ const d=new Date(date+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function nextGameDate(date){ let d=addDays(date,1); if(new Date(d+'T12:00:00').getDay()===1) d=addDays(d,1); return d; }

// ---------- 라인업 / 마운드 자동 구성 ----------
function teamPlayers(t){ return t.roster.map(id=>S.players[id]); }
function autoLineup(t){
  const av = act1(t).filter(p=>!p.isP && !p.inj);
  const used = new Set(), slots = {};
  const W = {C:1.4,SS:1.3,'2B':1.1,CF:1.2,'3B':1.0,RF:0.9,LF:0.8,'1B':0.6};
  for(const pos of ['C','SS','CF','2B','3B','RF','LF','1B']){
    let best=null, bv=-1e9;
    for(const p of av){ if(used.has(p.id)) continue; const f=fit(p,pos);
      const v = batVal(p)*0.65 + defVal(p,pos)*f*0.35*W[pos] - (1-f)*45; if(v>bv){bv=v;best=p} }
    if(best){ used.add(best.id); slots[pos]=best; }
  }
  let dh=null, dv=-1; for(const p of av){ if(!used.has(p.id) && batVal(p)>dv){dv=batVal(p);dh=p} }
  if(dh){ used.add(dh.id); slots.DH=dh; }
  const nine = Object.entries(slots).map(([pos,p])=>({pid:p.id,pos}));
  t.lineup = orderLineup(nine);
}
function orderLineup(nine){
  const P = x=>S.players[x.pid];
  const sorted = nine.slice().sort((a,b)=>batVal(P(b))-batVal(P(a)));
  if(sorted.length<6) return sorted;
  const leadScore = p=>p.a.con+p.a.eye+p.a.spd*1.3-p.a.pow*0.5;
  const power = sorted.slice(0,4).sort((a,b)=>P(b).a.pow-P(a).a.pow);
  const rest = sorted.slice(4);
  const lead = rest.slice().sort((a,b)=>leadScore(P(b))-leadScore(P(a)))[0];
  return [lead, power[3], power[1], power[0], power[2], ...rest.filter(x=>x!==lead)];
}
function autoPitching(t){
  const ps = act1(t).filter(p=>p.isP && !p.inj);
  const spv = p=> ovrOf(p) + p.a.sta*0.15;
  const sps = ps.filter(p=>p.pos==='SP').sort((a,b)=>spv(b)-spv(a)).slice(0,5);
  for(const p of ps.filter(p=>p.pos!=='SP'&&p.pos!=='CL').sort((a,b)=>b.a.sta-a.a.sta)){ if(sps.length>=5) break; sps.push(p); }
  t.rotation = sps.map(p=>p.id);
  const rps = ps.filter(p=>!t.rotation.includes(p.id)).sort((a,b)=>ovrOf(b)-ovrOf(a)+((b.pos==='CL')-(a.pos==='CL'))*3);
  t.closer = rps[0]?.id || null; t.setup = rps.slice(1,3).map(p=>p.id);
}
function validateTeam(t, notify){
  // 부상자 등 라인업 정리
  const bad = t.lineup.length<9 || t.lineup.some(x=>{const p=S.players[x.pid]; return !p || p.inj || p.farm || p.team!==t.id});
  const badR = t.rotation.length<5 || t.rotation.some(id=>{const p=S.players[id]; return !p||p.inj||p.farm||p.team!==t.id});
  const badB = [t.closer,...t.setup].some(id=>id && (!S.players[id]||S.players[id].inj||S.players[id].farm||S.players[id].team!==t.id));
  if(t.id!==S.user){ autoLineup(t); autoPitching(t); return; }
  if(bad){ fixLineup(t); if(notify) mail('코치진','라인업 자동 조정','부상 또는 이동으로 비어 있는 자리를 수석코치가 임시로 채웠습니다. 전술 화면에서 확인하세요.','staff'); }
  if(badR||badB){ fixPitching(t); }
}
function fixLineup(t){
  const used = new Set(t.lineup.filter(x=>{const p=S.players[x.pid];return p&&!p.inj&&!p.farm&&p.team===t.id}).map(x=>x.pid));
  const posNeeded = ['C','1B','2B','3B','SS','LF','CF','RF','DH'];
  const lu = t.lineup.slice(0,9);
  while(lu.length<9) lu.push({pid:null,pos:posNeeded.find(ps=>!lu.some(x=>x.pos===ps))||'DH'});
  for(const slot of lu){ const p=S.players[slot.pid];
    if(!p||p.inj||p.farm||p.team!==t.id){ let best=null,bv=-1e9;
      for(const q of act1(t)){ if(q.isP||q.inj||used.has(q.id)) continue; const v=batVal(q)*0.6+defVal(q,slot.pos)*fit(q,slot.pos)*0.4-(1-fit(q,slot.pos))*45; if(v>bv){bv=v;best=q} }
      if(best){ slot.pid=best.id; used.add(best.id);} } }
  t.lineup = lu.filter(x=>x.pid);
}
function fixPitching(t){
  const ok = id=>{const p=S.players[id]; return p&&!p.inj&&!p.farm&&p.team===t.id&&p.isP};
  const ps = act1(t).filter(p=>p.isP&&!p.inj).sort((a,b)=>ovrOf(b)-ovrOf(a));
  t.rotation = t.rotation.filter(ok);
  for(const p of ps.slice().sort((a,b)=>b.a.sta-a.a.sta)){ if(t.rotation.length>=5) break; if(!t.rotation.includes(p.id)&&p.id!==t.closer) t.rotation.push(p.id); }
  if(!ok(t.closer)) t.closer = ps.find(p=>!t.rotation.includes(p.id))?.id || null;
  t.setup = t.setup.filter(ok);
  for(const p of ps){ if(t.setup.length>=2) break; if(!t.rotation.includes(p.id)&&p.id!==t.closer&&!t.setup.includes(p.id)) t.setup.push(p.id); }
}

// ---------- 경기 시뮬레이션 ----------
function eff(p, pc, lim){ // 투수 유효능력
  const tired = pc>lim ? (pc-lim)/9 : 0; const c = condMul(p)*(1+gv(p));
  const fb = p.pitches?.['직구'] ?? p.pitches?.['투심'] ?? p.a.stf;
  return {vel:p.a.vel-tired*0.8, stf:(p.a.stf-tired*1.4)*c, ctl:(p.a.ctl-tired*1.2)*c, brk:(p.a.brk-tired*1.2)*c, fb:(fb-tired)*c};
}
let GV = {};
let FORM_SD = 1.2, SENS = 0.8;
function gv(p){ return GV[p.id] ??= (20-p.m.cons)*0.006*(R()*2-1); } // 경기별 컨디션 기복(일관성)
function batterMods(b, pp, clutch, post){
  let m=0;
  if(post && typeof hv==='function') m+=(hv(b,'imp')-10)*0.08;
  if(b.hand!=='S'){ if(b.hand===pp.hand) m -= b.hand==='L'?1.0:0.5; }
  if(has(b,'좌완 킬러') && pp.hand==='L') m+=1.5;
  if(has(b,'우완 킬러') && pp.hand==='R') m+=1.0;
  if(clutch){ m += (b.m.cmp-10)*0.1 + (has(b,'클러치 히터')?1.2:0) - (has(b,'새가슴')?1.2:0); }
  if(post && has(b,'큰 경기 강자')) m+=1.2;
  return m;
}
function pitcherMods(pp, b, clutch, post){
  let m=0;
  if(post && typeof hv==='function') m+=(hv(pp,'imp')-10)*0.08;
  if(clutch){ m += (pp.m.cmp-10)*0.1 + (has(pp,'위기관리')?1.2:0) - (has(pp,'새가슴')?1.2:0); }
  if(post && has(pp,'에이스 기질')) m+=1.2;
  if(has(pp,'좌타 스페셜리스트') && b.hand==='L') m+=1.5;
  return m;
}
function tm(b,pp,k){
  let x=1;
  if(k==='k'){ if(has(b,'선구안 장인')) x*=0.88; if(has(b,'초구 공략')) x*=0.88; if(has(pp,'닥터K')) x*=1.12; if(has(pp,'파이어볼러')) x*=1.06; if(has(pp,'변화구 마술사')) x*=1.06; if(has(b,'공갈포')) x*=1.15; if(has(b,'끈질긴 승부')) x*=0.95; }
  if(k==='bb'){ if(has(b,'선구안 장인')) x*=1.15; if(has(b,'초구 공략')) x*=0.85; if(has(pp,'컨트롤 아티스트')) x*=0.75; if(has(pp,'볼넷 남발')) x*=1.2; if(has(b,'끈질긴 승부')) x*=1.05; if(has(b,'배드볼 히터')) x*=0.8; }
  if(k==='hr'){ if(has(b,'홈런 타자')) x*=1.08; if(has(pp,'땅볼 유도형')) x*=0.88; if(has(pp,'피홈런 주의')) x*=1.12; if(has(pp,'뜬공 투수')) x*=1.05; }
  if(k==='hit'){ if(has(b,'교타자')) x*=1.04; if(has(b,'5툴 플레이어')) x*=1.02; if(has(b,'배드볼 히터')) x*=1.03; if(has(pp,'뜬공 투수')) x*=0.97; }
  return x;
}
const injMul = p=>(1.5-p.m.dur/20)*(has(p,'철인')||has(p,'철완')?0.4:1)*(has(p,'유리몸')?2:1)*(typeof hv==='function'?0.65+hv(p,'inj')/28:1);
const runSpd = p=>(p.a.spd+p.a.brn)/2;
const NOPLAN = {k:1,bb:1,hr:1,hit:1,pk:1,pbb:1,phr:1,phit:1,pc:0,ppc:0,sp:0,rp:0,steal:1,bunt:1,ro:0,rd:0};
function probableStarter(t){ // 다음 선발 예상(로테이션 순서를 바꾸지 않음)
  for(let i=0;i<5;i++){ const p=S.players[t.rotation[(t.rotIdx+i)%t.rotation.length]]; if(p&&!p.inj&&p.rest>=4) return p; }
  return act1(t).filter(p=>p.isP&&!p.inj&&p.id!==t.closer).sort((a,b)=>(b.rest*2+b.a.sta)-(a.rest*2+a.a.sta))[0]; }
function pickStarter(t){
  for(let i=0;i<5;i++){ const id=t.rotation[(t.rotIdx+i)%t.rotation.length]; const p=S.players[id];
    if(p&&!p.inj&&p.rest>=4){ t.rotIdx=(t.rotIdx+i+1)%t.rotation.length; return p; } }
  const cand = act1(t).filter(p=>p.isP&&!p.inj&&p.id!==t.closer).sort((a,b)=>(b.rest*2+b.a.sta)-(a.rest*2+a.a.sta));
  t.rotIdx=(t.rotIdx+1)%Math.max(1,t.rotation.length); return cand[0];
}

const PITCH_SPD = {직구:0,투심:-2,커터:-6,슬라이더:-12,스위퍼:-15,커브:-22,체인지업:-15,포크:-13,스플리터:-12};
function pickW(ws){ let r=R()*ws.reduce((a,b)=>a+b,0); for(let i=0;i<ws.length;i++){ if((r-=ws[i])<0) return i; } return ws.length-1; }
function pitchType(p){
  const ent = Object.entries(p.pitches||{직구:10});
  const i = pickW(ent.map(([k,v])=> (k==='직구'||k==='투심') ? v*1.5 : v));
  const pt = ent[i][0]; return {pt, v: Math.round(kmh(p) - 1 - R()*3 + (PITCH_SPD[pt]??-10))};
}
// 투구 위치 (포수 시점, 스트라이크존 = x·y 모두 -1~1). ABS처럼 볼은 존 밖, 스트라이크는 존 안
function pitchLoc(res, pt, p, b){
  const ctl=p?p.a.ctl:10, sp=clamp((20-ctl)/20,0,0.9), lh=p&&p.hand==='L';
  const bh = b ? (b.hand==='S' ? (lh?'R':'L') : b.hand) : 'R', inside = bh==='R' ? -1 : 1;   // 우타자는 포수 기준 왼쪽에 선다
  const slide=['슬라이더','스위퍼','커터'].includes(pt), arm=['체인지업','투심','싱커'].includes(pt), off=['슬라이더','스위퍼','커브','포크','스플리터','체인지업'].includes(pt);
  const brk = slide ? (lh?-1:1)*0.25 : arm ? (lh?1:-1)*0.2 : 0;
  const u=(a,c)=>a+R()*(c-a), sg=()=>R()<0.5?-1:1; let x, y;
  if(res==='몸에 맞는 공'){ x=inside*u(1.65,2.0); y=u(-0.3,0.9); }
  else if(res==='볼'||res==='볼넷'){
    if(off && R()<0.55){ x=u(-1,1)+brk*1.5; y=-u(1.1,1.5+sp*0.6); }
    else if(R()<0.5){ x=sg()*u(1.08,1.35+sp*0.7); y=u(-1,1); } else { x=u(-1,1)+brk; y=sg()*u(1.08,1.3+sp*0.6); }
    if(Math.abs(x)<=1.04 && Math.abs(y)<=1.04){ if(Math.abs(x)>Math.abs(y)) x=Math.sign(x||1)*1.1; else y=Math.sign(y||1)*1.1; }
  }
  else if(res==='스트라이크'||res==='루킹 삼진'){ const edge=0.5+ctl*0.02; x=sg()*u(edge-0.35,0.97); y=u(-0.95,0.95); }
  else if(res==='헛스윙'||res==='헛스윙 삼진'){ if(off && R()<0.65){ x=u(-0.8,0.8)+brk*2; y=-u(0.9,1.6); } else { x=u(-0.85,0.85); y=u(0.45,1.35); } }
  else if(res==='파울'){ x=u(-1.15,1.15)+brk; y=u(-1.1,1.15); }
  else { x=u(-0.85,0.85)*(0.7+sp*0.5)+brk*0.5; y=u(-0.85,0.85); }
  if(res==='스트라이크'||res==='루킹 삼진'){ x=clamp(x,-0.98,0.98); y=clamp(y,-0.98,0.98); }
  return {lx:Math.round(clamp(x,-2.1,2.1)*100)/100, ly:Math.round(clamp(y,-1.9,1.9)*100)/100};
}
// 타석 결과에 맞는 투구 시퀀스 생성
function genPitchSeq(kind, p, bt){
  if(kind==='IBB') return [1,2,3,4].map(b=>({pt:'고의사구',v:0,res:'볼',b,s:0}));
  let b, s;
  if(kind==='K'){ b=pickW([.35,.3,.22,.13]); s=2; }
  else if(kind==='BB'){ b=3; s=pickW([.35,.4,.25]); }
  else { b=pickW([.38,.3,.2,.12]); s=pickW([.32,.4,.28]); }
  const toks=[...Array(b).fill('B'),...Array(s).fill('S')].sort(()=>R()-0.5);
  const seq=[]; let cb=0, cs=0;
  for(const t of toks){
    if(t==='B'){ cb++; seq.push({res:'볼',b:cb,s:cs}); }
    else { cs++; const r=R(); seq.push({res:r<0.4?'스트라이크':r<0.7?'헛스윙':'파울',b:cb,s:cs}); }
  }
  if(cs===2){ const f = R()<0.4 ? (R()<0.6?1:2+Math.floor(R()*3)) : 0; for(let i=0;i<f;i++) seq.push({res:'파울',b:cb,s:2}); }
  if(kind==='K') seq.push({res:R()<0.55?'헛스윙 삼진':'루킹 삼진',b:cb,s:3});
  else if(kind==='BB') seq.push({res:'볼넷',b:4,s:cs});
  else if(kind==='HBP') seq.push({res:'몸에 맞는 공',b:cb,s:cs});
  else seq.push({res:'타격',b:cb,s:cs});
  for(const x of seq){ Object.assign(x, pitchType(p)); Object.assign(x, pitchLoc(x.res, x.pt, p, bt)); }
  return seq;
}

function simGame(hid, aid, opt={}){ const g=gameGen(hid,aid,opt); let r; while(!(r=g.next()).done){} return r.value; }

// 경기 제너레이터: live 모드에서는 투구/타석 단위로 이벤트를 yield 하고, 'pa' 이벤트에서 작전 명령을 받는다.
function* gameGen(hid, aid, opt={}){
  const post = !!opt.post, wantLog = !!opt.log, live = !!opt.live;
  const actG = t => opt.exhib ? teamPlayers(t).filter(p=>!p.inj) : act1(t);   // 시범경기에는 퓨처스 선수도 출전
  const T = [S.teams[aid], S.teams[hid]];
  T.forEach(t=>validateTeam(t, t.id===S.user && !post));
  const park = TD(hid).park;
  const lu = T.map((t,i)=>((opt.lus&&opt.lus[i])||t.lineup).map(x=>({p:S.players[x.pid], pos:x.pos})));
  GV = {};
  const def=[0,0], hndD=[0,0], dpD=[0,0], armD=[0,0], catArm=[0,0];
  function calcDef(side){ const l=lu[side];
    let s=0,n=0; for(const x of l){ if(x.pos==='DH') continue; const w=['SS','C','CF','2B'].includes(x.pos)?1.3:1; s+=(defVal(x.p,x.pos)+(has(x.p,'그물망 수비')?0.8:0)-(has(x.p,'수비 불안')?0.8:0))*fit(x.p,x.pos)*w; n+=w; } def[side]=s/n;
    const f=l.filter(x=>x.pos!=='DH'); hndD[side]=f.reduce((s,x)=>s+x.p.a.hnd*fit(x.p,x.pos),0)/f.length;
    const mi=l.filter(x=>['2B','SS'].includes(x.pos)); dpD[side]=mi.length? mi.reduce((s,x)=>s+x.p.a.dp*fit(x.p,x.pos),0)/mi.length : 10;
    const of=l.filter(x=>['LF','CF','RF'].includes(x.pos)); armD[side]=of.length? of.reduce((s,x)=>s+x.p.a.arm+(has(x.p,'강견')?1.5:0),0)/of.length : 10;
    const c=l.find(x=>x.pos==='C'); catArm[side]=c?(c.p.a.arm*0.6+c.p.a.cat*0.4+(has(c.p,'도루 저지')?1.5:0))*fit(c.p,'C'):8; }
  calcDef(0); calcDef(1);
  const mgrB = T.map(t=>(t.mgr.tac-14)*0.05 + (t.staff['수석'].rating-12)*0.02 + ((t.staff['전력분석']?.rating??12)-12)*0.015 + (typeof campTac==='function'?campTac(t):0));
  const coachRun = T.map(t=>(t.staff['주루'].rating-12)*0.01);
  const form = T.map(()=> (R()+R()+R()-1.5)*FORM_SD);
  T.forEach((t,i)=>{ form[i] += (typeof talkBoost==='function' && !opt.exhib) ? talkBoost(t) : 0; });
  let PL = [NOPLAN, NOPLAN];   // 경기 플랜(공격·투수 운영) 효과 — manager.js
  const shout = [0,0];         // 감독의 한마디(이번 이닝)   // 그날 팀 컨디션(이변 요소): 전력 차가 그대로 승패로 이어지지 않게
  const box = T.map(()=>({bat:{}, pit:[], hits:0, err:0}));
  const log = [];
  const score=[0,0], line=[[],[]], bi=[0,0];
  const used = [new Set(), new Set()], gone=[new Set(), new Set()];
  lu.forEach((l,i)=>l.forEach(x=>gone[i].add(x.p.id)));
  const cur = [null,null];
  let lead = 0, goAhead = null, inning=1, half_=0, outs=0, bases=[null,null,null];
  const maxInn = post?15:11;
  const subs = [];

  function bline(side,p){ return box[side].bat[p.id] ||= {pid:p.id, pa:0,ab:0,h:0,d:0,t:0,hr:0,rbi:0,bb:0,k:0,r:0,sb:0,cs:0}; }
  function myLead(side){ return side===1?score[1]-score[0]:score[0]-score[1]; }
  function putPitcher(side, p, isSP){
    const lim0 = isSP ? 52 + p.a.sta*3.3 + (T[side].tac.hook-1)*-8 + (has(p,'이닝이터')?10:0) - (has(p,'스태미너 부족')?10:0) : 16 + p.a.sta*1.1 + (has(p,'롱릴리프')?12:0) + (PL[side].rp||0);
    const lim = opt.exhib ? (isSP ? Math.min(lim0, 48+R()*22) : Math.min(lim0, 24)) : lim0;   // 시범경기: 선발은 짧게
    if(cur[side]) cur[side].exitLead = myLead(side);
    const st = {pid:p.id, p, isSP, lim, pc:0, outs:0, h:0, r:0, er:0, bb:0, k:0, hr:0, entryLead: myLead(side), exitLead:null};
    box[side].pit.push(st); cur[side]=st; used[side].add(p.id);
    if(!isSP){ const msg=`⚾ ${TD(T[side].id).name.split(' ')[0]} 투수 교체: ${p.name}`; if(wantLog) log.push(`<i>${msg}</i>`); subs.push(msg); }
  }
  putPitcher(0, (opt.sps&&S.players[opt.sps[0]])||pickStarter(T[0]), true); putPitcher(1, (opt.sps&&S.players[opt.sps[1]])||pickStarter(T[1]), true);
  if(typeof planMods==='function' && !opt.exhib){ PL = [0,1].map(i=>planMods(T[i], T[1-i], cur[i].p, cur[1-i].p, lu[i], lu[1-i], park)); [0,1].forEach(i=>{ cur[i].lim += PL[i].sp||0; }); }

  function availRelievers(side){
    return actG(T[side]).filter(p=>p.isP && !p.inj && !used[side].has(p.id) && p.fat<30 && !T[side].rotation.includes(p.id));
  }
  const yday = addDays(S.date,-1), yday2 = addDays(S.date,-2);
  const tiredRP = p => p.lastRP===yday ? ((p.rpStreak||1)>=2 ? 99 : 6) : p.lastRP===yday2 ? 1.5 : 0;   // 연투 관리: 3연투 금지
  function chooseReliever(side, inning){
    const t=T[side], my = myLead(side);
    const av = availRelievers(side).filter(p=>tiredRP(p)<99);
    if(!av.length){ const any=actG(t).filter(p=>p.isP&&!p.inj&&!used[side].has(p.id)&&!t.rotation.includes(p.id)).sort((a,b)=>(a.fat+tiredRP(a)*5)-(b.fat+tiredRP(b)*5)); return any[0]||actG(t).filter(p=>p.isP&&!p.inj&&!used[side].has(p.id)).sort((a,b)=>a.fat-b.fat)[0]||null; }
    const hasP = id=>{ const p=av.find(q=>q.id===id); return p && tiredRP(p)<6 ? p : null; };
    const close = my>=0 && my<=3, tieLate = my===0;
    // 접전 후반: 마무리·필승조
    if(inning>=9 && (close||tieLate) && hasP(t.closer)) return hasP(t.closer);
    if(inning===8 && (close||tieLate)){ for(const id of t.setup) if(hasP(id)) return hasP(id); }
    if(inning>=7 && close){ for(const id of t.setup) if(hasP(id)) return hasP(id); }
    const pool = av.filter(p=>p.id!==t.closer && !t.setup.includes(p.id));
    const list = pool.length?pool:av;
    const big = Math.abs(my)>=4;
    const sc = p=>{
      let v = big ? -ovrOf(p)*0.6 + (p.pos==='SP'?1.5:0) + p.a.sta*0.15        // 큰 점수 차: 추격조·선발 유망주에게 이닝
                  : ovrOf(p) + (inning>=6 && close ? 1 : 0);                   // 접전 중반: 좋은 중간계투
      if(inning<=5) v += (p.a.sta-10)*0.45 + (p.pos==='SP'?2:0) + (has(p,'롱릴리프')?2:0);   // 선발 조기 강판: 롱릴리프
      return v - tiredRP(p) - p.fat*0.15 + R()*2.2;
    };
    return list.sort((a,b)=>sc(b)-sc(a))[0];
  }
  const phCount=[0,0];
  function autoPH(bat, fld, slotIdx){   // 감독(수석코치) 대타 작전
    if(inning<6 || phCount[bat]>=3 || (inning===6 && !(bases[1]||bases[2]))) return;
    const diff=myLead(bat); if(diff>0 || diff<-3) return;
    const lastAB = inning>=9;
    const onBase = bases[0]||bases[1]||bases[2];
    if(!(bases[1]||bases[2]) && !(inning>=8 && onBase) && !(lastAB && diff>=-1 && outs>=1)) return;
    const slot=lu[bat][slotIdx], now=slot.p, pp=cur[fld].p;
    const val=q=> batVal(q) + (q.hand!=='S' && q.hand===pp.hand ? (q.hand==='L'?-1.4:-0.8) : 0) + (has(q,'클러치 히터')?0.6:0) + (has(q,'좌완 킬러')&&pp.hand==='L'?1.2:0);
    const bench=actG(T[bat]).filter(q=>!q.isP&&!q.inj&&!gone[bat].has(q.id)); if(!bench.length) return;
    const best=bench.sort((a,b)=>val(b)-val(a))[0];
    const need = 0.3 + (['C','SS','CF'].includes(slot.pos)&&inning<9?1.0:0) + (T[bat].mgr.tac<12?0.3:0);
    if(val(best)-val(now) < need) return;
    gone[bat].add(best.id); slot.p=best; calcDef(bat); phCount[bat]++;
    const msg=`🔄 대타: ${now.name} → ${best.name}`; subs.push(msg); if(wantLog) log.push(`<i>${msg}</i>`);
  }
  function maybeChange(side, inning, atStart){
    const c = cur[side]; let need=false;
    if(c.pc>=c.lim) need=true;
    if(c.isSP && c.r>=6 && c.outs>=6) need=true;
    if(c.isSP && c.r>=4 && c.outs<9 && c.pc>40) need=true;
    if(!c.isSP && atStart && c.outs>=3 && !(c.pid===T[side].closer && c.outs<6 && inning>9)) need=true;
    if(c.isSP && atStart && inning>=8 && c.pc>c.lim*0.8) need=true;
    if(need){ const np=chooseReliever(side, inning); if(np) putPitcher(side,np,false); }
  }
  function scoreRuns(bat, n, runners, rbiTo){
    for(const rp of runners){ bline(bat,rp).r++; }
    score[bat]+=n; cur[1-bat].r+=n; cur[1-bat].er+=n;
    if(rbiTo) bline(bat,rbiTo).rbi+=n;
    const nl = Math.sign(score[1]-score[0]);
    if(nl!==0 && nl!==lead){ goAhead = {team:nl>0?1:0, wp:cur[nl>0?1:0], lp:cur[nl>0?0:1]}; }
    lead = nl;
  }
  const snap = (extra={})=>({inning, half:half_, outs, bases:bases.map(b=>b?b.name:null), baseIds:bases.map(b=>b?b.id:null), score:[...score], line:[line[0].slice(),line[1].slice()],
     pitcher:[cur[0].p, cur[1].p], pc:[Math.round(cur[0].pc),Math.round(cur[1].pc)], ...extra});
  // 사용자 작전 적용
  function applyCmd(cmd, bat, fld, slotIdx){
    if(!cmd) return {};
    const res = {};
    const uSide = T[0].id===S.user?0:T[1].id===S.user?1:-1;
    if(cmd.pitcher && fld===uSide){ const p=S.players[cmd.pitcher]; if(p && p.isP && !used[fld].has(p.id) && !p.inj && p.team===S.user) putPitcher(fld,p,false); }
    if(cmd.ph && bat===uSide){ const p=S.players[cmd.ph];
      if(p && !p.isP && !gone[bat].has(p.id) && !p.inj && p.team===S.user){ const slot=lu[bat][slotIdx]; const msg=`🔄 대타: ${slot.p.name} → ${p.name}`;
        gone[bat].add(p.id); slot.p=p; calcDef(bat); subs.push(msg); if(wantLog) log.push(`<i>${msg}</i>`); } }
    if(cmd.pr && bat===uSide){ const p=S.players[cmd.pr]; const bi_=bases.findIndex(b=>b && b.id===cmd.prOf);
      if(p && !p.isP && !gone[bat].has(p.id) && bi_>=0){ const old=bases[bi_]; const slot=lu[bat].find(x=>x.p.id===old.id);
        if(slot){ gone[bat].add(p.id); slot.p=p; bases[bi_]=p; calcDef(bat); const msg=`🏃 대주자: ${old.name} → ${p.name}`; subs.push(msg); if(wantLog) log.push(`<i>${msg}</i>`); } } }
    if(cmd.ibb && fld===uSide) res.ibb=true;
    if(cmd.bunt && bat===uSide) res.bunt=true;
    if(cmd.steal && bat===uSide) res.steal=true;
    if(cmd.shout && uSide>=0 && typeof shoutEffect==='function'){ const e=shoutEffect(cmd.shout, bat===uSide, bat===uSide?lu[bat][slotIdx].p:cur[fld].p, T[uSide], myLead(uSide)); shout[uSide]=e.v; subs.push(`📣 감독: "${e.say}" — ${e.react}`); if(wantLog) log.push(`<i>📣 ${e.say}</i>`); }
    return res;
  }

  function* half(bat){
    const fld=1-bat; outs=0; bases=[null,null,null]; const runs0=score[bat]; half_=bat; shout[0]=shout[1]=0;
    maybeChange(fld, inning, true);
    const tag = `${inning}회${bat?'말':'초'}`;
    if(live) yield {type:'half', ...snap(), text:`${tag} — ${TD(T[bat].id).name} 공격`};
    const maybeMid = ()=>{ if(outs<3){ const c=cur[fld]; if(c.pc>=c.lim+8 || (c.isSP && c.r>=7)) { const np=chooseReliever(fld,inning); if(np) putPitcher(fld,np,false);} } };
    while(outs<3){
      if(inning>=9 && bat===1 && score[1]>score[0]) break;
      const L = lu[bat]; const slotIdx = bi[bat]%L.length;
      let cmd = null;
      if(live){ subs.length=0; cmd = yield {type:'pa', ...snap(), batter:L[slotIdx].p, slotIdx, bat, gone:[[...gone[0]],[...gone[1]]], usedP:[[...used[0]],[...used[1]]]}; }
      const order = applyCmd(cmd, bat, fld, slotIdx);
      { const uS=T[0].id===S.user?0:T[1].id===S.user?1:-1; if(!(live && bat===uS) && !order.bunt) autoPH(bat, fld, slotIdx); }
      if(live && subs.length) yield {type:'sub', ...snap(), text:subs.join(' / ')};
      subs.length=0;
      const b = L[slotIdx].p; bi[bat]++;
      const pit = cur[fld]; const pe = eff(pit.p, pit.pc, pit.lim);
      const bl = bline(bat,b); bl.pa++;
      const diff = myLead(bat);
      // 도루
      const stealRunner = bases[0] && !bases[1] ? 0 : (bases[1] && !bases[2] && !bases[0] ? 1 : -1);
      if(stealRunner>=0 && outs<2){ const r=bases[stealRunner]; const tw=T[bat].tac.steal*(PL[bat].steal||1);
        const tryIt = order.steal || (stealRunner===0 && r.a.stl>=12 && R() < (r.a.stl-11)*0.03*tw*(has(r,'대도')?1.5:1));
        if(tryIt){
          const ok = R() < 0.64+(r.a.stl-13)*0.035+(r.a.spd-12)*0.01-(catArm[fld]-12)*0.02-(pit.p.a.hold-10)*0.02-(has(pit.p,'견제의 달인')?0.08:0)+(has(pit.p,'퀵모션 약점')?0.08:0)+coachRun[bat]-(stealRunner===1?0.08:0);
          const to = stealRunner===0?'2루':'3루';
          let txt;
          if(ok){ bases[stealRunner+1]=r; bases[stealRunner]=null; bline(bat,r).sb++; txt=`${r.name} ${to} 도루 성공!`; }
          else { bases[stealRunner]=null; outs++; pit.outs++; bline(bat,r).cs++; txt=`${r.name} ${to} 도루 실패 — 아웃`; }
          if(wantLog) log.push(`${tag} · ${txt}`);
          if(live) yield {type:'result', ...snap(), text:txt, big: ok?'도루 성공':'도루 실패'};
          if(outs>=3){ bi[bat]--; bl.pa--; break; }
        } }
      // 희생번트
      const aiBunt = bases[0] && !bases[2] && outs===0 && inning>=7 && Math.abs(diff)<=1 && batVal(b)<12.5 && R()<0.25*T[bat].tac.bunt*(PL[bat].bunt||1) && !(T[bat].id===S.user && live);
      if((order.bunt || aiBunt) && (bases[0]||bases[1]) && outs<2){
        const seq = genPitchSeq('IP', pit.p, b); pit.pc+=seq.length;
        if(live) for(const x of seq.slice(0,-1)) yield {type:'pitch', ...snap(), ...x};
        outs++; pit.outs++; let txt;
        if(R() < 0.55+b.a.bnt*0.022+(has(b,'번트 장인')?0.15:0)){ if(bases[1]&&!bases[2]){bases[2]=bases[1]; bases[1]=null;} if(bases[0]&&!bases[1]){ bases[1]=bases[0]; bases[0]=null; } txt=`${b.name} 희생번트 성공`; }
        else txt=`${b.name} 번트 실패 (주자 진루 실패)`;
        if(wantLog) log.push(`${tag} · ${txt}`);
        if(live) yield {type:'result', ...snap(), text:txt};
        maybeMid(); continue;
      }
      // 고의사구
      if(order.ibb){
        const seq=genPitchSeq('IBB'); pit.pc+=4; bl.bb++; pit.bb++;
        const rs=[]; if(bases[0]){ if(bases[1]){ if(bases[2]) rs.push(bases[2]); bases[2]=bases[1]; } bases[1]=bases[0]; } bases[0]=b;
        if(rs.length) scoreRuns(bat,rs.length,rs,b);
        if(wantLog) log.push(`${tag} · ${b.name}: 고의사구`);
        if(live) yield {type:'result', ...snap(), text:`${b.name} 고의사구`};
        maybeMid(); continue;
      }
      const clutch = inning>=7 && Math.abs(diff)<=2 && !!(bases[1]||bases[2]);
      const tp_ = typeof talkP==='function' && !opt.exhib;
      const bm = batterMods(b, pit.p, clutch, post)+form[bat]+(PL[bat].ro||0)+shout[bat]+(tp_?talkP(b):0), pm = pitcherMods(pit.p, b, clutch, post)+form[fld]+(PL[fld].rd||0)+shout[fld]+(tp_?talkP(pit.p):0);
      const cm = condMul(b)*(1+gv(b));
      const Z=v=>12+(v-12)*SENS;   // 능력 차이 반영 강도 (리그 평균 12 기준)
      const c=Z((b.a.con+bm)*cm), gp=Z((b.a.gap+bm)*cm), po=Z((b.a.pow+bm)*cm), e=Z(b.a.eye), ak=Z(b.a.avk+bm*0.5), sp=Z(b.a.spd);
      const ps=Z((pe.stf*0.5+pe.vel*0.3+pe.fb*0.2)+pm), pb=Z(pe.brk+pm), pct_=Z(pe.ctl+pm*0.5);
      const mb = mgrB[bat]-mgrB[fld]*0.5;
      const kP = 0.18*Math.exp(0.06*((ps+pb)/2 - (c*0.5+ak*0.5)))*Math.exp(-0.02*(e-12))*tm(b,pit.p,'k')*PL[bat].k*PL[fld].pk;
      const bbP = 0.083*Math.exp(0.07*(e - pct_))*tm(b,pit.p,'bb')*PL[bat].bb*PL[fld].pbb;
      const hbpP = 0.011;
      const hrP = 0.023*Math.exp(0.11*(po-12))*Math.exp(-0.055*((ps*0.6+pb*0.4)-12))*Math.exp(-0.04*(pit.p.a.gb-10))*park.hr*tm(b,pit.p,'hr')*PL[bat].hr*PL[fld].phr;
      const hitP = 0.322*Math.exp(0.035*(c-12)+mb*0.1)*Math.exp(-0.03*((ps+pb)/2-12))*(1-(def[fld]-12)*0.012)*(1+(sp-12)*0.006)*park.hit*tm(b,pit.p,'hit')*PL[bat].hit*PL[fld].phit;
      let r = R(), kind;
      if(r<kP) kind='K'; else if((r-=kP)<bbP) kind='BB'; else if((r-=bbP)<hbpP) kind='HBP'; else if((r-=hbpP)<hrP) kind='HR'; else kind='IP';
      const seq = genPitchSeq(kind==='HR'?'IP':kind, pit.p, b);
      pit.pc += Math.max(1, seq.length + (PL[bat].pc||0) + (PL[fld].ppc||0));
      if(live) for(const x of seq) yield {type:'pitch', ...snap(), ...x};
      let txt='', big=null; const before=score[bat];
      const walk = ()=>{ const rs=[]; if(bases[0]){ if(bases[1]){ if(bases[2]) rs.push(bases[2]); bases[2]=bases[1]; } bases[1]=bases[0]; } bases[0]=b; if(rs.length) scoreRuns(bat,rs.length,rs,b); };
      const dir = ()=>pick(['좌익수','중견수','우익수','좌중간','우중간']), idir=()=>pick(['유격수','2루수','3루수','1루수','투수']);
      if(kind==='K'){ bl.ab++; bl.k++; outs++; pit.outs++; pit.k++; txt='삼진'; }
      else if(kind==='BB'){ bl.bb++; pit.bb++; walk(); txt='볼넷'; }
      else if(kind==='HBP'){ walk(); txt='몸에 맞는 공'; }
      else if(kind==='HR'){ bl.ab++; bl.h++; bl.hr++; pit.h++; pit.hr++; box[bat].hits++;
        const rs=bases.filter(Boolean); rs.push(b); bases=[null,null,null]; scoreRuns(bat,rs.length,rs,b);
        txt = `<b>${pick(['좌측','중앙','우측','좌중간','우중간'])} 담장 넘어가는 홈런!</b> (${rs.length===4?'만루 홈런':rs.length+'점'})`; big = rs.length===4?'GRAND SLAM!':'HOME RUN!'; }
      else {
        if(R() < hitP){ bl.ab++; bl.h++; pit.h++; box[bat].hits++;
          const dP=0.17+(gp-12)*0.01+(sp-12)*0.002+(has(b,'갭 히터')?0.06:0), tP=Math.max(0.004,0.015+(sp-12)*0.004); const hr2=R();
          if(hr2<tP){ bl.t++; const rs=bases.filter(Boolean); bases=[null,null,b]; if(rs.length) scoreRuns(bat,rs.length,rs,b); txt=`${dir()} 3루타!`; big='3루타'; }
          else if(hr2<tP+dP){ bl.d++; const rs=[]; if(bases[2]) rs.push(bases[2]); if(bases[1]) rs.push(bases[1]); let n3=null;
            if(bases[0]){ if(R()<0.38+(has(bases[0],'주루 센스')?0.08:0)+(runSpd(bases[0])-12)*0.04-(armD[fld]-12)*0.015) rs.push(bases[0]); else n3=bases[0]; }
            bases=[null,b,n3]; if(rs.length) scoreRuns(bat,rs.length,rs,b); txt=`${dir()} 2루타`; }
          else { const rs=[]; if(bases[2]) rs.push(bases[2]); let n3=null,n2=null;
            if(bases[1]){ if(R()<0.55+(has(bases[1],'주루 센스')?0.08:0)+(runSpd(bases[1])-12)*0.04-(armD[fld]-12)*0.015) rs.push(bases[1]); else n3=bases[1]; }
            if(bases[0]){ if(!n3 && R()<0.25+(has(bases[0],'주루 센스')?0.08:0)+(runSpd(bases[0])-12)*0.03-(armD[fld]-12)*0.01) n3=bases[0]; else n2=bases[0]; }
            bases=[b,n2,n3]; if(rs.length) scoreRuns(bat,rs.length,rs,b); txt = R()<0.2?`${idir()} 내야안타`:`${dir()} 앞 안타`; }
        } else if(R() < 0.014*(1-(hndD[fld]-12)*0.06)){
          bl.ab++; box[fld].err++; const rs=[]; if(bases[2]) rs.push(bases[2]);
          bases=[b,bases[0],bases[1]]; if(rs.length){ scoreRuns(bat,rs.length,rs,null); cur[fld].er-=rs.length; } txt=`${idir()} 실책으로 출루`;
        } else { bl.ab++;
          if(R()<0.44+(pit.p.a.gb-10)*0.012){
            if(bases[0] && outs<2 && R()<0.32-(sp-12)*0.02+(dpD[fld]-12)*0.01+(has(pit.p,'땅볼 유도형')?0.05:0)+(has(b,'병살 머신')?0.08:0)){ outs+=2; pit.outs+=2; bases[0]=null; txt=`${idir()} 앞 병살타`;
              if(outs<3){ const rs=[]; if(bases[2]) {rs.push(bases[2]); bases[2]=null;} if(bases[1]){bases[2]=bases[1];bases[1]=null;} if(rs.length) scoreRuns(bat,rs.length,rs,null); } }
            else { outs++; pit.outs++; txt=`${idir()} 땅볼 아웃`;
              if(outs<3){ let [r1,r2,r3]=bases; const rs=[];
                if(r1){ if(r2){ if(r3) rs.push(r3); r3=r2; } else if(r3 && R()<0.5){ rs.push(r3); r3=null; } r2=r1; r1=null; }
                else { if(r3 && R()<0.5){ rs.push(r3); r3=null; } if(r2 && !r3 && R()<0.5){ r3=r2; r2=null; } }
                bases=[r1,r2,r3]; if(rs.length) scoreRuns(bat,rs.length,rs,b); } }
          } else if(R()<0.72){ outs++; pit.outs++; txt=`${dir()} 뜬공 아웃`;
            if(outs<3 && bases[2] && R()<0.6+(runSpd(bases[2])-12)*0.04-(armD[fld]-12)*0.015){ const rr=bases[2]; bases[2]=null; scoreRuns(bat,1,[rr],b); txt=`${dir()} 희생플라이`; }
            if(outs<3 && bases[1] && !bases[2] && R()<0.3){ bases[2]=bases[1]; bases[1]=null; }
          } else { outs++; pit.outs++; txt=`${idir()} 직선타 아웃`; }
        }
      }
      if(R()<0.0006*injMul(b)){ b.inj = 3+Math.floor(R()*35); if(wantLog||b.team===S.user) injNews(b); txt+=` <span class="bad">(${b.name} 부상)</span>`; }
      const runs = score[bat]-before;
      if(runs>0 && !big && runs>=2) big = `${runs}점!`;
      if(wantLog) log.push(`${tag} · ${b.name}: ${txt}  <span class="sc">${score[0]}-${score[1]}</span>`);
      if(live) yield {type:'result', ...snap(), text:`${b.name}: ${txt}${runs?` <b class="good">+${runs}점</b>`:''}`, big, runs};
      if(inning>=9 && bat===1 && score[1]>score[0]) break;
      maybeMid();
    }
    line[bat].push(score[bat]-runs0);
  }

  while(true){
    yield* half(0);
    if(inning>=9 && score[1]>score[0]){ line[1].push('X'); break; }
    yield* half(1);
    if(inning>=9 && score[0]!==score[1]) break;
    if(inning>=maxInn) break;
    inning++;
  }
  const win = score[1]>score[0]?1:score[0]>score[1]?0:-1;
  for(const side of [0,1]){ cur[side].exitLead = myLead(side); }
  const dec = {};
  if(win>=0 && goAhead){
    let wp = goAhead.wp; const sp = box[win].pit[0];
    if(wp===sp && sp.outs<15){ const rel=box[win].pit.slice(1).sort((a,b)=>b.outs-a.outs)[0]; if(rel) wp=rel; }
    dec.w=wp.pid; dec.l=goAhead.lp.pid;
    const last = box[win].pit[box[win].pit.length-1];
    if(last!==wp && last.entryLead>0 && (last.entryLead<=3 || last.outs>=9) && last.outs>=1) dec.sv=last.pid;
    dec.hld=[];
    for(const side of [0,1]) for(const st of box[side].pit){ if(st.isSP || st.pid===dec.w || st.pid===dec.sv || st.pid===dec.l) continue;
      if(st!==box[side].pit[box[side].pit.length-1] && st.entryLead>0 && st.entryLead<=3 && st.exitLead>0 && st.outs>=1) dec.hld.push(st.pid); }
  }
  for(const s of [0,1]) for(const st of box[s].pit){ delete st.p; }
  return {home:hid, away:aid, score:[score[0],score[1]], line, box, log, dec, innings:inning, date:S.date, post, exhib:!!opt.exhib};
}

function injNews(p){
  if(p.team===S.user) mail('의무팀', `부상: ${p.name}`, `${p.name}(${POS_KO[p.pos]})이(가) 부상으로 약 ${p.inj}일간 출전할 수 없습니다.`, 'injury');
}

function applyGame(g){
  const sides=[g.away,g.home];
  for(const side of [0,1]){
    const b=g.box[side], t=S.teams[sides[side]];
    if(!g.post){
      for(const id in b.bat){ const p=S.players[id], x=b.bat[id], st=p.st;
        st.g++; for(const k of ['pa','ab','h','d','t','hr','rbi','bb','k','r','sb','cs']) st[k]+=x[k]; p.cond=Math.max(55,p.cond-1.5); }
      b.pit.forEach((x,i)=>{ const p=S.players[x.pid], st=p.st; st.pg++; if(i===0) st.gs++;
        st.outs+=x.outs; st.ph+=x.h; st.er+=Math.max(0,x.er); st.pbb+=x.bb; st.pk+=x.k; st.phr+=x.hr; });
    }
    b.pit.forEach((x,i)=>{ const p=S.players[x.pid]; if(i===0){p.rest=0;} else { p.fat+=x.pc; p.rpStreak = p.lastRP===addDays(S.date,-1) ? (p.rpStreak||1)+1 : 1; p.lastRP=S.date; } });
    if(!g.post){ t.rs+=g.score[side]; t.ra+=g.score[1-side]; }
  }
  if(g.post) return;
  if(g.dec.w){ S.players[g.dec.w].st.w++; S.players[g.dec.l].st.l++; if(g.dec.sv) S.players[g.dec.sv].st.sv++; g.dec.hld.forEach(id=>S.players[id].st.hld++); }
  const [a,h]=[S.teams[g.away],S.teams[g.home]];
  if(g.score[0]===g.score[1]){ a.t++; h.t++; a.last.push('T'); h.last.push('T'); a.streak=0; h.streak=0; }
  else { const W=g.score[1]>g.score[0]?h:a, L=W===h?a:h; W.w++; L.l++; W.last.push('W'); L.last.push('L');
    W.streak = W.streak>0?W.streak+1:1; L.streak = L.streak<0?L.streak-1:-1;
    fanReact(W,true,g); fanReact(L,false,g); }
  for(const t of [a,h]) if(t.last.length>10) t.last.shift();
}

function fanReact(t, won, g){
  const f = t.fans||TD(t.id).fans; const exp=f.expect/100, pat=f.patience/100, pas=f.passion/100;
  const delta = won ? 0.6+pas*0.6 - exp*0.3 : -(0.4+exp*0.7)*(1.3-pat);
  t.fanMood = clamp(t.fanMood + delta, 0, 100);
  const tp = teamPlayers(t);
  tp.forEach(p=>{ p.morale = clamp(p.morale + (won?0.4:-0.35*(typeof hv==='function'?1.35-hv(p,'temp')/28:1)), 20, 100); });
  if(t.id===S.user){
    if(t.streak===5) mail('팬', '5연승! 팬들이 들썩입니다', `${TD(t.id).city} 팬들이 열광하고 있습니다. ${f.passion>90?'응원가가 경기장 밖까지 울려 퍼집니다.':'관중 수가 눈에 띄게 늘었습니다.'}`, 'fan');
    if(t.streak===-5) mail('팬', '5연패… 팬심이 흔들립니다', f.patience<50 ? '구단 게시판에 감독 경질 요구가 올라오기 시작했습니다. 반등이 시급합니다.' : '팬들은 아직 인내하고 있지만 실망감이 커지고 있습니다.', 'fan');
    if(t.streak===-8) { t.board=clamp(t.board-6,0,100); mail('이사회','연패에 대한 우려','이사회가 최근 성적에 깊은 우려를 표했습니다. 반등이 없으면 감독 거취를 논의할 수 있습니다.','board'); }
  }
}

// ---------- 하루 진행 ----------
function dailyUpdate(){
  const trainer = {};
  for(const t of Object.values(S.teams)) trainer[t.id]=t.staff['트레이닝'].rating;
  for(const p of Object.values(S.players)){
    p.rest++; p.fat*=has(p,'철완')?0.3:0.45; if(p.fat<3) p.fat=0;
    if(p.inj>0){ p.inj -= (p.inj>1 && R()<medBonus(p)) ? 2 : 1; if(p.inj<=0){ p.inj=0; } if(p.inj===0 && p.team===S.user) mail('의무팀',`복귀: ${p.name}`,`${p.name}이(가) 부상에서 회복해 출전 가능합니다.`,'injury'); }
    p.cond = clamp(p.cond + 1.2 + ((trainer[p.team]??12)-12)*0.08, 40, 100);
  }
  clubDay();
}
function weekly(){
  for(const t of Object.values(S.teams)){
    train(t);
    if(teamPlayers(t).some(p=>has(p,'리더'))) teamPlayers(t).forEach(p=>p.morale=clamp(p.morale+0.6,20,100));
    clubWeekly(t);
    // 이사회 신뢰
    const g=t.w+t.l; if(g>=12){ const rank=rankOf(t.id); const diff=t.goalRank-rank;
      t.board = clamp(t.board + diff*0.6 + (t.fanMood-50)*0.03 + (t.balance<0?-1:0), 0, 100); }
    if(t.id!==S.user){ autoLineup(t); autoPitching(t); }
  }
  const u=S.teams[S.user];
  if(S.dayIdx%24===0 && u.w+u.l>0){
    const rank=rankOf(S.user);
    mail('이사회', '월간 평가', `현재 ${rank}위 (${u.w}승 ${u.l}패 ${u.t}무). 목표: ${goalText(u.goalRank)}.\n이사회 신뢰도 ${Math.round(u.board)} / 팬 만족도 ${Math.round(u.fanMood)}.\n${u.board<30?'<b>경고: 신뢰도가 매우 낮습니다.</b>':u.board>75?'이사회는 감독님의 운영에 크게 만족하고 있습니다.':'이사회는 상황을 지켜보고 있습니다.'}`, 'board');
  }
  if(S.dayIdx%30===0) refreshCoachMarket();
  scoutWeek(); if(S.phase==='regular' && !isDeadlinePassed() && S.dayIdx>10) aiTrades();
  if(S.phase==='regular' && !isDeadlinePassed() && S.dayIdx>6 && R()<0.35) genAIOffer();
}

const TRAIN_HIT = {균형:{con:1,gap:1,pow:1,eye:1,avk:1,spd:.5,stl:.5,brn:.5,rng:1,hnd:1,arm:.5,dp:.5,cat:.5}, 컨택:{con:3,avk:1.5}, 파워:{pow:3,gap:1.5}, 선구안:{eye:3,avk:1},
  수비:{rng:2,hnd:2,arm:1,dp:1,cat:1.5}, 주루:{spd:1.5,stl:2,brn:2,bnt:1}, 회복:{}};
const TRAIN_PIT = {균형:{vel:.3,stf:1,ctl:1,brk:1,sta:.7,gb:.5}, 구위:{stf:3,vel:1}, 제구:{ctl:3}, 변화구:{brk:3}, 체력:{sta:3}, 운영:{gb:1.5,hold:1.5,pfd:1}, 회복:{}};
function growAttr(p,k,d){
  if(k==='brk' && p.pitches){ for(const pn in p.pitches) if(pn!=='직구'&&pn!=='투심') p.pitches[pn]=clamp(p.pitches[pn]+d,1,20); p.a.brk=brkOf(p.pitches); return; }
  p.a[k]=clamp(p.a[k]+d,1,20);
  if(p.pitches && (k==='stf'||k==='vel')){ const fb=p.pitches['직구']!=null?'직구':'투심'; if(p.pitches[fb]!=null) p.pitches[fb]=clamp(p.pitches[fb]+d*0.5,1,20); }
}
const INTEN = {1:{g:0.6,inj:0.0015,cond:+4,label:'낮음'},2:{g:1,inj:0.004,cond:0,label:'보통'},3:{g:1.45,inj:0.009,cond:-4,label:'높음'}};

function train(t){
  const inten = INTEN[t.train.inten]; const report=[];
  for(const p of teamPlayers(t)){
    const plan = p.focus ? {[p.focus]:3} : (p.isP ? TRAIN_PIT[t.train.pit] : TRAIN_HIT[t.train.hit]);
    const recovery = !p.focus && Object.keys(plan).length===0;
    if(recovery){ p.cond=clamp(p.cond+6,0,100); continue; }
    p.cond = clamp(p.cond+inten.cond, 40, 100);
    if(p.inj) continue;
    const coach = p.isP ? t.staff['투수'].rating : t.staff['타격'].rating;
    const ovr = ovrOf(p), gap = (p.PA - CA(p))/10;
    let g = 0;
    if(p.age<=24) g=0.09; else if(p.age<=28) g=0.06; else if(p.age<=31) g=0.03; else g=0.01;
    g *= clamp(gap,-0.5,8)/3 + 0.2;
    g *= inten.g * (0.7 + coach/40) * (0.8+p.morale/250) * (0.85+p.m.det/60) * devMul(t,p);
    const decline = p.age>=33 ? (p.age-32)*0.004 : 0;
    const total = Object.values(plan).reduce((a,b)=>a+b,0);
    const before = ovr;
    for(const k in p.a){
      if(k==='cat' && p.pos!=='C') continue;
      let c = (plan[k]||0)/total * g * 1.1;
      if(['rng','hnd','arm','dp'].includes(k)) c *= (0.7+t.staff['수비'].rating/40);
      if(['spd','stl','brn'].includes(k)) c *= (0.7+t.staff['주루'].rating/40);
      if(k==='cat' || (p.isP && k==='ctl')) c *= (0.85+t.staff['배터리'].rating/80);
      const dec = decline * (['spd','stl','vel','rng'].includes(k)?1.5:1) * (['eye','ctl','brn','gb'].includes(k)?0.4:1);
      growAttr(p, k, c*(0.5+R()) - dec*(0.5+R()));
    }
    const injRisk = inten.inj * (1.6 - t.staff['트레이닝'].rating/20) * (p.age>32?1.4:1) * injMul(p) * injTeam(t);
    if(R()<injRisk){ p.inj = 2+Math.floor(R()*14); if(t.id===S.user) mail('의무팀',`훈련 중 부상: ${p.name}`,`${p.name}이(가) 훈련 중 부상을 입었습니다. 약 ${p.inj}일 결장 예상.`,'injury'); }
    if(t.id===S.user) report.push([p, ovrOf(p)-before]);
  }
  if(t.id===S.user && report.length){
    report.sort((a,b)=>b[1]-a[1]);
    const up = report.slice(0,4).filter(x=>x[1]>0.01).map(x=>`${x[0].name} (+${x[1].toFixed(2)})`).join(', ');
    const down = report.slice(-3).filter(x=>x[1]<-0.01).map(x=>`${x[0].name} (${x[1].toFixed(2)})`).join(', ');
    mail('코치진','주간 훈련 보고',`야수 중점: ${t.train.hit} / 투수 중점: ${t.train.pit} / 강도: ${INTEN[t.train.inten].label}\n\n성장 두드러진 선수: ${up||'없음'}\n하락세 선수: ${down||'없음'}`,'staff');
  }
}

// ---------- 순위 ----------
function pct(t){ return t.w+t.l ? t.w/(t.w+t.l) : 0; }
function standings(){
  return Object.values(S.teams).slice().sort((a,b)=> pct(b)-pct(a) || (b.w-a.w) || ((b.rs-b.ra)-(a.rs-a.ra)));
}
function rankOf(id){ return standings().findIndex(t=>t.id===id)+1; }

// ---------- 포스트시즌 ----------
function endRegular(){
  const st = standings(); S.finalRank = st.map(t=>t.id);
  S.phase='post';
  S.post = {seeds: st.slice(0,5).map(t=>t.id), stage:0, series:null, log:[]};
  startSeries();
  const u=S.user, r=rankOf(u);
  mail('리그 사무국', '정규시즌 종료', `정규시즌 최종 순위: ${st.map((t,i)=>`${i+1}. ${TD(t.id).name} (${t.w}-${t.l}-${t.t})`).join('\n')}\n\n${r<=5?`<b>${TD(u).name}은(는) ${r}위로 포스트시즌에 진출합니다!</b>`:'아쉽게도 포스트시즌 진출에 실패했습니다.'}`, 'board');
}
const STAGES = [{name:'와일드카드 결정전',need:2},{name:'준플레이오프',need:3},{name:'플레이오프',need:3},{name:'한국시리즈',need:4}];
function startSeries(){
  const P=S.post, sd=P.seeds; let hi, lo;
  if(P.stage===0){ hi=sd[3]; lo=sd[4]; }
  else { hi = sd[3-P.stage]; lo = P.lastWinner; }
  P.series = {stage:P.stage, name:STAGES[P.stage].name, hi, lo, wins:[P.stage===0?1:0,0], games:[]};
}
// ---------- 시즌 진행 ----------
function advanceDay(liveCb){
  if(S.fired) return null;
  if(S.phase==='regular') return advanceRegular(liveCb);
  if(S.phase==='post') return advancePost(liveCb);
  return null;
}
function todayMatch(){
  if(S.phase==='regular') return S.schedule[S.dayIdx]?.find(g=>g.includes(S.user)) || null;
  if(S.phase==='post' && S.post.series) return [S.post.series.hi, S.post.series.lo];
  return null;
}
function advanceRegular(liveCb){
  const day = S.schedule[S.dayIdx]; let um=null;
  for(const [h,a] of day){
    if(h===S.user||a===S.user){ um=[h,a]; continue; }
    const g = simGame(h,a); applyGame(g); S.results.push({d:S.date, h, a, s:g.score, dec:g.dec});
  }
  const fin = g=>{ applyGame(g); S.results.push({d:g.date, h:um[0], a:um[1], s:g.score, dec:g.dec, full:g});
    const fulls = S.results.filter(r=>r.full); if(fulls.length>25) delete fulls[0].full;
    endDay(); return g; };
  if(liveCb){ liveCb(gameGen(um[0],um[1],{log:true,live:true}), fin, um); return 'live'; }
  return fin(simGame(um[0],um[1],{log:true}));
}
function endDay(){
  dailyUpdate();
  S.dayIdx++;
  if(S.dayIdx%6===0) weekly();
  if(S.dayIdx>=S.schedule.length) endRegular();
  else S.date = nextGameDate(S.date);
}
function advancePost(liveCb){
  const se=S.post.series; if(!se) return null;
  const fin = g=>{ applyGame(g); postAfter(g); return g; };
  if(liveCb){ liveCb(gameGen(se.hi,se.lo,{log:true,live:true,post:true}), fin, [se.hi,se.lo]); return 'live'; }
  return fin(simGame(se.hi,se.lo,{log:true,post:true}));
}
function postAfter(g){
  const P=S.post, se=P.series;
  dailyUpdate();
  if(g.score[1]>g.score[0]) se.wins[0]++; else if(g.score[0]>g.score[1]) se.wins[1]++;
  else if(se.stage===0) se.wins[0]++;
  se.games.push({s:g.score, full:g});
  const need = STAGES[se.stage].need;
  S.date = addDays(S.date,1);
  if(se.wins[0]>=need || se.wins[1]>=need){
    const winner = se.wins[0]>=need?se.hi:se.lo, loser = winner===se.hi?se.lo:se.hi;
    P.log.push(`${se.name}: ${TD(winner).name} ${Math.max(...se.wins)}-${Math.min(...se.wins)} ${TD(loser).name}`);
    if(winner===S.user || loser===S.user) mail('리그 사무국', `${se.name} 종료`, winner===S.user?`<b>${TD(winner).name}이(가) ${se.name}을(를) 통과했습니다!</b>`:`${TD(loser).name}의 가을은 ${se.name}에서 멈췄습니다.`, winner===S.user?'board':'fan');
    P.lastWinner = winner; P.stage++;
    if(P.stage>=4){ P.champion=winner; P.series=null; endSeason(); }
    else startSeries();
  }
}
function endSeason(){
  S.phase='off';
  const champ=S.post.champion, u=S.teams[S.user], r=rankOf(S.user);
  const postRes = champ===S.user?'우승':(S.post.seeds.includes(S.user)?'포스트시즌 진출':'탈락');
  S.history.push({year:S.year, champ, rank:r, w:u.w, l:u.l, t:u.t, post:postRes});
  if(champ===S.user){ u.board=clamp(u.board+30,0,100); u.fanMood=clamp(u.fanMood+30,0,100); }
  else { const diff=u.goalRank-r; u.board=clamp(u.board+diff*4 + (S.post.seeds.includes(S.user)?5:-5),0,100); }
  mail('리그 사무국', `${S.year} 한국시리즈 우승: ${TD(champ).name}`, `${S.post.log.join('\n')}\n\n<b>${TD(champ).name}이(가) ${S.year} 시즌 챔피언에 올랐습니다!</b>`, 'board');
  if(u.board<15){ S.fired=true; mail('이사회','경질 통보',`이사회는 성적 부진(${r}위)과 신뢰도 하락을 이유로 감독 계약 해지를 결정했습니다. 그동안 수고하셨습니다.`,'board'); return; }
  mail('이사회','시즌 총평',`최종 ${r}위, 목표는 ${goalText(u.goalRank)}였습니다. 이사회 신뢰도 ${Math.round(u.board)}.\n\n이제 오프시즌입니다: <b>FA 시장 → 신인 드래프트 → 새 시즌</b> 순서로 진행됩니다.`,'board');
  beginOffseason();
}

// ---------- 계약 / FA ----------
function initYrs(p, r=R){ if(p.foreign||p.age<=25) return 1; if(p.age>=35) return 1+Math.floor(r()*2); return 1+Math.floor(r()*4); }
function marketValue(p){
  const ca=CA(p); let s=Math.max(0.5, Math.pow(Math.max(ca/10-8,0),2)*0.35);
  s *= p.age<=29?1.15:p.age<=32?1:p.age<=35?0.7:0.45;
  if(p.foreign) s=clamp(s,5,20);
  return Math.round(s*10)/10;
}
function askOf(p){ return {sal:Math.round(marketValue(p)*1.1*10)/10, yrs: p.foreign?1:p.age<=29?4:p.age<=32?3:p.age<=35?2:1}; }
function foreignCount(t){ return teamPlayers(t).filter(p=>p.foreign).length; }
const F_FIRST=['존','마이크','라이언','케빈','조던','타일러','브랜든','카를로스','호세','루이스','다니엘','크리스','애런','저스틴','마커스','오스카'];
const F_LAST=['스미스','존슨','윌리엄스','로드리게스','마르티네스','가르시아','데이비스','밀러','앤더슨','톰슨','모리스','잭슨','레예스','페레스','하퍼','콜린스'];
const AQ_NAMES=['사토 유키','다나카 겐타','스즈키 료','야마모토 쇼','나카무라 다이키','린 웨이','천 즈하오','잭 오코너','미첼 리드'];
function genForeign(i){
  const aq = i>=6; const isP = R()<0.6;
  const pos = isP ? (R()<0.7?'SP':'RP') : pick(['1B','LF','RF','3B','CF','DH','2B']);
  const o = aq ? 11+R()*2.5 : 12.5+R()*3.5;
  const name = aq ? pick(AQ_NAMES) : `${pick(F_FIRST)} ${pick(F_LAST)}`;
  const tags = isP ? pick(['K','L','B','','K']) : pick(['P','C','PE','','P']);
  const p = mkPlayer(`${name}|${pos}|${R()<0.3?'L':'R'}|${25+Math.floor(R()*8)}|${o.toFixed(1)}|${Math.round(o+R()*1.5)}|${tags}`, 'FA', S.nextPid++);
  p.foreign=true; p.aq=aq; p.team=null; p.faFrom=null; p.yrs=1; p.salary=marketValue(p); p.ask=askOf(p);
  return p;
}
function beginOffseason(){
  const retired=[];
  for(const p of Object.values(S.players)){
    if(!p.team) continue;
    p.age++;
    const gap=(p.PA-CA(p))/10;
    for(const k in p.a){
      if(k==='cat' && p.pos!=='C') continue;
      let d=0; if(p.age<=25) d=gap*0.12*R(); else if(p.age<=29) d=gap*0.06*R();
      if(p.age>=33) d -= (p.age-32)*0.18*R()*(['spd','stl','vel','rng'].includes(k)?1.4:['eye','ctl','brn'].includes(k)?0.5:1);
      growAttr(p,k,d);
    }
    p.m.cons=clamp(p.m.cons+0.2,1,20); p.m.lead=clamp(p.m.lead+(p.age>=28?0.3:0.1),1,20);
    if(p.m.lead>=17 && !has(p,'리더')) p.traits.push('리더');
    p.inj=0; p.cond=100; p.morale=70; p.rest=6; p.fat=0; p.focus=p.focus||null;
    const o=ovrOf(p);
    if((p.age>=40 && (o<13 || R()<0.4)) || (p.age>=36 && o<10.5) || p.age>=44) retired.push(p);
  }
  for(const p of retired){ const t=S.teams[p.team]; t.roster=t.roster.filter(id=>id!==p.id); p.team=null; p.retired=true; }
  const pool=[];
  for(const p of Object.values(S.players)){
    if(!p.team) continue;
    p.yrs = (p.yrs??1)-1;
    if(p.yrs>0) continue;
    const mine = p.team===S.user;
    const renew = ()=>{ p.yrs=1; p.salary=calcSalary(p); };
    if(!p.foreign && (p.age<=27 || R()<0.45)){ renew(); continue; }   // 보류 선수(FA 자격 미달): 연봉 재계약
    if(!mine && p.foreign && ovrOf(p)>=13.5 && R()<0.8){ renew(); continue; }
    if(!mine && !p.foreign && CA(p)<118){ renew(); continue; }
    if(mine && !p.foreign && CA(p)<100){ renew(); continue; }
    const t=S.teams[p.team]; t.roster=t.roster.filter(id=>id!==p.id);
    p.faFrom=p.team; p.team=null; p.ask=askOf(p); pool.push(p.id);
  }
  for(let i=0;i<9;i++){ const p=genForeign(i); S.players[p.id]=p; pool.push(p.id); }
  for(const t of Object.values(S.teams)) validateTeam(t,false);
  S.off = {stage:'fa', pool, offers:{}, log:[], retired:retired.map(p=>`${p.name}(${TD(p.id.split('_')[0])?.name.split(' ')[0]||''})`)};
  const mineFA = pool.map(id=>S.players[id]).filter(p=>p.faFrom===S.user);
  mail('프런트','FA 시장 개장',`FA 자격을 얻은 선수 ${pool.length}명이 시장에 나왔습니다 (신규 외국인 후보 포함).\n${mineFA.length?`우리 팀 FA: <b>${mineFA.map(p=>p.name).join(', ')}</b> — 잡으려면 재계약 오퍼를 넣으세요.`:'우리 팀에서 FA가 된 선수는 없습니다.'}\n\n은퇴 선수: ${S.off.retired.slice(0,15).join(', ')}${S.off.retired.length>15?' 외':''}`,'info');
  save();
}
function teamNeed(t,p){
  let target;
  if(p.isP){
    const rot=t.rotation.map(id=>S.players[id]).filter(Boolean), bp=[t.closer,...t.setup].map(id=>S.players[id]).filter(Boolean);
    const grp = p.pos==='SP'?rot:bp; target = grp.length<(p.pos==='SP'?5:3) ? 60 : Math.min(...grp.map(CA));
  } else {
    const slot=t.lineup.find(x=>x.pos===p.pos)||null; const lus=t.lineup.map(x=>S.players[x.pid]).filter(Boolean);
    target = slot&&S.players[slot.pid] ? CA(S.players[slot.pid]) : (lus.length? Math.min(...lus.map(CA)) : 60);
  }
  let need = clamp((CA(p)-target)/40 + 0.12, 0, 0.8);
  if(p.foreign){ const fc=foreignCount(t); need = fc>=4?0 : need + (fc<3?0.5:0.15); }
  return need;
}
function appeal(tid,p){ return 1 + (TD(tid).fans.size-70)/500 + (6-rankOf(tid))/80 + (p.faFrom===tid?0.06:0); }
function makeOffer(pid, sal, yrs){
  const p=S.players[pid]; if(!p||p.team) return {ok:false,msg:'이미 계약한 선수입니다.'};
  if(p.foreign && foreignCount(S.teams[S.user])>=4) return {ok:false,msg:'외국인 보유 한도(4명)가 가득 찼습니다.'};
  if(sal < p.ask.sal*0.7) return {ok:false,msg:`${p.name} 측: "그 금액이면 협상할 생각이 없습니다." (요구 연 ${p.ask.sal}억)`};
  S.off.offers[pid]={sal:Math.round(sal*10)/10, yrs}; save();
  return {ok:true,msg:`${p.name}에게 ${yrs}년 총액 ${(sal*yrs).toFixed(1)}억 오퍼를 넣었습니다. FA 시장 마감 때 결과가 나옵니다.`};
}
function finishFA(){
  const off=S.off, res=[];
  const pool = off.pool.map(id=>S.players[id]).filter(p=>p && !p.team).sort((a,b)=>CA(b)-CA(a));
  for(const p of pool){
    const offers=[]; const uo=off.offers[p.id];
    if(uo && !(p.foreign && foreignCount(S.teams[S.user])>=4)) offers.push({team:S.user, ...uo});
    for(const t of Object.values(S.teams)){
      if(t.id===S.user) continue;
      const loyal = p.faFrom===t.id ? 0.3 : 0;
      const prob = clamp(teamNeed(t,p)+loyal, 0, 0.95) * (t.balance > p.ask.sal*1.5 ? 1 : 0.25);
      if(R()<prob) offers.push({team:t.id, sal:Math.round(p.ask.sal*(0.82+R()*0.3)*(loyal?1.05:1)*10)/10, yrs:clamp(p.ask.yrs-(R()<0.3?1:0),1,4)});
    }
    const util = o=> o.sal*(1+0.12*(Math.min(o.yrs,p.ask.yrs)-1))*appeal(o.team,p);
    const ok = offers.filter(o=>o.sal>=p.ask.sal*0.8).sort((a,b)=>util(b)-util(a));
    const best = ok[0];
    if(!best){ if(uo) res.push(`❌ ${p.name}: 우리 오퍼(연 ${uo.sal}억)를 거절하고 다른 길을 택했습니다.`); continue; }
    const t=S.teams[best.team]; const prevSal=p.salary;
    p.team=best.team; t.roster.push(p.id); p.salary=best.sal; p.yrs=best.yrs; p.morale=75;
    let comp='';
    if(p.faFrom && p.faFrom!==best.team && !p.foreign && CA(p)>=130){ const c=Math.round(prevSal*2*10)/10; t.balance-=c; S.teams[p.faFrom].balance+=c; comp=` · 보상금 ${c}억 → ${tShort(p.faFrom)}`; }
    const line = `${best.team===S.user?'✅':'•'} ${p.name} (${p.foreign?'외국인':POS_KO[p.pos]}, ${p.faFrom?tShort(p.faFrom):'신규'} → <b>${tShort(best.team)}</b>) ${best.yrs}년 총액 ${(best.sal*best.yrs).toFixed(1)}억${comp}`;
    res.push(line); off.log.push(line);
    if(uo && best.team!==S.user) res.push(`❌ ${p.name}: 우리 오퍼 대신 ${tShort(best.team)}을(를) 선택했습니다.`);
  }
  const mineRes = res.filter(l=>l.startsWith('✅')||l.startsWith('❌'));
  mail('프런트','FA 시장 결과',`<b>우리 구단</b>\n${mineRes.join('\n')||'참여한 계약 없음'}\n\n<b>리그 전체 FA 계약</b>\n${off.log.join('\n')||'없음'}`,'info');
  for(const t of Object.values(S.teams)) validateTeam(t,false);
  startDraft();
}

// ---------- 신인 드래프트 ----------
function genProspect(){
  const hs = R()<0.6, isP = R()<0.5;
  const pos = isP ? pick(['SP','SP','RP']) : pick(['C','SS','2B','3B','CF','RF','LF','1B','OF','IF']);
  const o = hs ? 6+R()*3.5 : 8+R()*3;
  const pot = clamp(o + 2 + R()*(hs?9:6), 8, 19.5);
  const tags = isP ? pick(['K','L','B','','']) : pick(['P','C','S','D','E','','']);
  const p = mkPlayer(`${genName()}|${pos}|${R()<0.3?'L':'R'}|${hs?18:22}|${o.toFixed(1)}|${pot.toFixed(1)}|${tags}`, 'DR', S.nextPid++);
  p.team=null; p.prospect=true; p.school = hs?'고졸':'대졸'; p.yrs=1; p.salary=0.3;
  const err = 34 - S.teams[S.user].staff['수석'].rating;
  p.scout = Math.round(clamp(p.PA + (R()*2-1)*err, 40, 200));
  return p;
}
function startDraft(){
  const pool=[]; for(let i=0;i<55;i++){ const p=genProspect(); S.players[p.id]=p; pool.push(p.id); }
  const order = S.finalRank.slice().reverse(); const picks=[];
  for(let r=0;r<4;r++) for(const t of order) picks.push(t);
  S.off.stage='draft'; S.off.draft={pool, picks, idx:0, log:[]};
  mail('스카우트팀','신인 드래프트',`2라운드까지 상위 지명권이 중요합니다. 우리 지명 순번: ${picks.map((t,i)=>t===S.user?`${Math.floor(i/10)+1}R ${i%10+1}순위`:null).filter(Boolean).join(', ')}.\n표시된 잠재력은 스카우트 평가이며 실제와 다를 수 있습니다 (수석코치 능력이 높을수록 정확).`,'staff');
  draftAuto();
}
function draftAvail(){ const d=S.off.draft; return d.pool.map(id=>S.players[id]).filter(p=>p && !p.team); }
function doPick(tid, p){
  const d=S.off.draft, r=Math.floor(d.idx/10)+1;
  p.team=tid; p.prospect=false; p.rookie=true; S.teams[tid].roster.push(p.id);
  const bonus = [2.5,1.2,0.6,0.3][r-1]; S.teams[tid].balance-=bonus;
  d.log.push({r, n:d.idx%10+1, tid, pid:p.id, text:`${r}R ${d.idx%10+1}순위 ${tShort(tid)} — ${p.name} (${POS_KO[p.pos]}, ${p.school})`});
  d.idx++;
}
function aiPick(tid){
  const av=draftAvail(); if(!av.length){ S.off.draft.idx++; return; }
  const best = av.sort((a,b)=>(b.PA*0.7+CA(b)*0.3+R()*12)-(a.PA*0.7+CA(a)*0.3+R()*12))[0];
  doPick(tid,best);
}
function draftAuto(){
  const d=S.off.draft;
  while(d.idx<d.picks.length && d.picks[d.idx]!==S.user) aiPick(d.picks[d.idx]);
  if(d.idx>=d.picks.length) endDraft();
  save();
}
function userPick(pid){
  const d=S.off.draft; if(d.picks[d.idx]!==S.user) return;
  const p=S.players[pid]; if(!p||p.team) return;
  doPick(S.user,p); draftAuto();
}
function userAutoPick(){ const av=draftAvail().sort((a,b)=>(b.scout*0.7+CA(b)*0.3)-(a.scout*0.7+CA(a)*0.3)); if(av[0]) userPick(av[0].id); }
function endDraft(){
  const d=S.off.draft;
  for(const id of d.pool){ const p=S.players[id]; if(p && !p.team) delete S.players[id]; }
  S.off.stage='ready';
  const mine = d.log.filter(x=>x.tid===S.user).map(x=>x.text).join('\n');
  mail('스카우트팀','드래프트 종료',`우리 구단 지명 선수:\n${mine}`,'staff');
  for(const t of Object.values(S.teams)) validateTeam(t,false);
}

// ---------- 새 시즌 ----------
function newSeason(){
  const final = S.finalRank;
  for(const t of Object.values(S.teams)){
    const cap = t.id===S.user?35:32;
    while(t.roster.length>cap){ const w=teamPlayers(t).filter(p=>!p.rookie).sort((a,b)=>(ovrOf(a)-a.age*0.02)-(ovrOf(b)-b.age*0.02))[0]; t.roster=t.roster.filter(id=>id!==w.id); w.team=null; w.released=true;
      if(t.id===S.user) mail('프런트','로스터 정리',`등록 인원 초과(최대 ${cap}명)로 ${w.name}이(가) 방출되었습니다.`,'info'); }
    const added=[];
    while(t.roster.length<26){ const ps=teamPlayers(t).filter(p=>p.isP).length; const isP = ps<12;
      const pos = isP ? (teamPlayers(t).filter(p=>p.pos==='SP').length<6?'SP':'RP') : pick(['C','IF','OF','1B','SS','2B','3B','LF','CF','RF']);
      const p = mkPlayer(`${genName()}|${pos}|${R()<0.3?'L':'R'}|${22+Math.floor(R()*9)}|${(9+R()*2).toFixed(1)}|${(10+R()*3).toFixed(1)}|`, t.id, S.nextPid++);
      S.players[p.id]=p; t.roster.push(p.id); added.push(p.name); }
    if(t.id===S.user && added.length) mail('프런트','육성선수 등록',`등록 인원 부족으로 육성선수 ${added.length}명(${added.join(', ')})을 정식 등록했습니다.`,'info');
    t.w=t.l=t.t=0; t.rs=t.ra=0; t.streak=0; t.last=[]; t.rotIdx=0; t.rev=0; t.exp=0; t.attTotal=0; t.homeG=0;
    t.balance += TD(t.id).budget*0.5;
    const r = final.indexOf(t.id)+1; t.goalRank = clamp(Math.round((r + TD(t.id).goalRank)/2) - (r<=3?0:1), 1, 9);
    t.fanMood = clamp(50 + (t.fanMood-50)*0.5, 20, 90);
    autoLineup(t); autoPitching(t);
  }
  for(const p of Object.values(S.players)){ resetStats(p); p.rookie=false; }
  for(const id in S.players){ if(!S.players[id].team) delete S.players[id]; }
  S.year++; S.dayIdx=0; S.date=`${S.year}-03-28`; S.schedule=makeSchedule(S.year); S.results=[]; S.phase='regular'; S.post=null; S.off=null;
  const u=S.teams[S.user];
  mail('이사회', `${S.year} 시즌 개막`, `새 시즌 목표: <b>${goalText(u.goalRank)}</b>\n라인업·전술 화면에서 새 얼굴들을 점검하세요.`, 'board');
  save();
}

// ---------- 트레이드 ----------
const isDeadlinePassed = ()=> S.phase==='regular' && S.date.slice(5) > '07-31';
function tradeCheck(give, get, otherId){
  const o=S.teams[otherId], u=S.teams[S.user];
  if(give.some(id=>S.players[id]?.team!==S.user) || get.some(id=>S.players[id]?.team!==otherId)) return '선수 소속이 바뀌어 성사할 수 없습니다.';
  const fc = (t,inn,out)=> teamPlayers(t).filter(p=>p.foreign && !out.includes(p.id)).length + inn.filter(id=>S.players[id].foreign).length;
  if(fc(o,give,get)>4 || fc(u,get,give)>4) return '외국인 선수 보유 한도(4명, 아시아쿼터 포함)를 초과합니다.';
  if(o.roster.length-get.length+give.length<22 || u.roster.length-give.length+get.length<22) return '로스터 최소 인원(22명)을 지켜야 합니다.';
  return null;
}
function evaluateTrade(give, get, otherId){
  if(isDeadlinePassed()) return {ok:false, msg:'트레이드 마감(7월 31일)이 지났습니다. 시즌 종료 후 다시 가능합니다.'};
  const err = tradeCheck(give,get,otherId); if(err) return {ok:false,msg:err};
  const vg = give.reduce((s,id)=>s+tradeValue(S.players[id]),0), vr = get.reduce((s,id)=>s+tradeValue(S.players[id]),0);
  const ratio = vg/(vr||1);
  if(ratio>=1.12) return {ok:true, msg:`${TD(otherId).name} 단장: "좋습니다, 거래하시죠."`, ratio};
  if(ratio>=0.95) return {ok:false, msg:`${TD(otherId).name} 단장: "조금만 더 얹어주시면 생각해보겠습니다."`, ratio};
  return {ok:false, msg:`${TD(otherId).name} 단장: "그 조건으로는 어렵습니다."`, ratio};
}
function genAIOffer(){ for(let i=0;i<6;i++) if(tryAIOffer()) return; }
function tryAIOffer(){
  const u=S.teams[S.user]; const o=pick(Object.values(S.teams).filter(t=>t.id!==S.user));
  const want = pick(teamPlayers(u).filter(p=>CA(p)>=105 && !p.inj)); if(!want) return;
  const vw=tradeValue(want); const cands=teamPlayers(o).filter(p=>!p.inj).sort(()=>R()-0.5);
  let pkg=null;
  for(const a of cands){ const v=tradeValue(a); if(v>=vw*0.95 && v<=vw*1.5){ pkg=[a]; break; } }
  outer: if(!pkg) for(const a of cands) for(const b of cands){ if(a===b) continue; const v=tradeValue(a)+tradeValue(b); if(v>=vw*0.98 && v<=vw*1.5){ pkg=[a,b]; break outer; } }
  if(!pkg) return false;
  const give=[want.id], get=pkg.map(p=>p.id);
  if(tradeCheck(give,get,o.id)) return false;
  const desc = p=>`${p.name} (${POS_KO[p.pos]}, ${p.age}세, CA ${CA(p)}/PA ${p.PA}, 연봉 ${p.salary}억)`;
  mail(`${tShort(o.id)} 단장`, `트레이드 제안: ${want.name} 영입 희망`, `${TD(o.id).name}이(가) 트레이드를 제안했습니다.\n\n<b>우리가 내줄 선수</b>\n${desc(want)}\n\n<b>받을 선수</b>\n${pkg.map(desc).join('\n')}`, 'trade', {type:'trade', team:o.id, give, get});
  return true;
}
function acceptOffer(i){
  const m=S.inbox[i]; const a=m.action; if(!a||a.done) return '이미 처리된 제안입니다.';
  if(a.type==='trade'){
    if(isDeadlinePassed()) { a.done='expired'; return '트레이드 마감이 지나 제안이 무효가 되었습니다.'; }
    const err=tradeCheck(a.give,a.get,a.team); if(err){ a.done='expired'; return err; }
    doTrade(a.give,a.get,a.team); a.done='accepted'; save(); return '트레이드가 성사되었습니다.';
  }
}
function declineOffer(i){ const a=S.inbox[i].action; if(a&&!a.done){ a.done='declined'; save(); } }
function releasePlayer(pid){
  const p=S.players[pid], u=S.teams[S.user]; if(!p||p.team!==S.user) return '우리 선수가 아닙니다.';
  if(u.roster.length<=24) return '최소 24명은 유지해야 합니다.';
  u.roster=u.roster.filter(id=>id!==pid); p.team=null; p.released=true;
  u.lineup=u.lineup.filter(x=>x.pid!==pid); if(u.closer===pid) u.closer=null; u.setup=u.setup.filter(x=>x!==pid); u.rotation=u.rotation.filter(x=>x!==pid);
  fixLineup(u); fixPitching(u);
  mail('프런트',`방출: ${p.name}`,`${p.name}을(를) 방출했습니다. 잔여 연봉 ${p.salary}억은 올 시즌 지출로 처리됩니다.`,'info');
  save(); return null;
}

function tradeValue(p){
  const o=ovrOf(p); let v=Math.pow(Math.max(o,5),2.4);
  const af = p.age<=23?1.35:p.age<=26?1.2:p.age<=29?1.05:p.age<=32?0.9:p.age<=35?0.65:0.4;
  v*=af; if(p.age<=26) v*=1+Math.max(0,p.PA/10-o)*0.07; if(p.inj>20) v*=0.7;
  return v;
}
function doTrade(give, get, otherId){
  const o=S.teams[otherId], u=S.teams[S.user];
  for(const id of give){ u.roster=u.roster.filter(x=>x!==id); o.roster.push(id); S.players[id].team=otherId; }
  for(const id of get){ o.roster=o.roster.filter(x=>x!==id); u.roster.push(id); S.players[id].team=S.user; S.players[id].morale=65; }
  u.lineup=u.lineup.filter(x=>!give.includes(x.pid)); fixLineup(u); fixPitching(u);
  autoLineup(o); autoPitching(o);
  const txt = `${TD(S.user).name} → ${give.map(id=>S.players[id].name).join(', ')} / ${TD(otherId).name} → ${get.map(id=>S.players[id].name).join(', ')}`;
  S.tradeLog.unshift(`${S.date} ${txt}`);
  mail('프런트','트레이드 성사',txt,'info');
  const fans=TD(S.user).fans; const star=give.some(id=>ovrOf(S.players[id])>=15);
  if(star){ u.fanMood=clamp(u.fanMood-6*(fans.passion/100),0,100); mail('팬','스타 선수 이적에 팬들 술렁',`팬들은 프랜차이즈 스타의 이적에 아쉬움을 표하고 있습니다.`,'fan'); }
}

// ---------- 저장 ----------
const SAVE_KEY='kboManager2026';
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
function load(){ try{ const s=localStorage.getItem(SAVE_KEY); if(s){ const x=JSON.parse(s); if(x.ver===2){ for(const p of Object.values(x.players)) p.yrs ??= initYrs(p); x.ver=3; }
      if(x.ver!==3){ alert('이전 버전 저장 파일이라 불러올 수 없습니다. 새 게임을 시작해주세요.'); localStorage.removeItem(SAVE_KEY); return false; } S=x; return true; } }catch(e){} return false; }
function hasSave(){ try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; } }
