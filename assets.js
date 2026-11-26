// 프로야구 매니저 PM — 게임 이미지 (SVG, 오프라인 동작)
// 구단 엠블럼은 실제 로고가 아닌 게임용 오리지널 디자인입니다.
const CREST_TXT = {LG:'GEM',HH:'FAL',SSG:'PIL',SS:'BK',NC:'RAP',KT:'SOR',LT:'TIT',KIA:'PAN',OB:'GRZ',WO:'LEG'};
function shade(hex, f){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255;
  const m=v=>Math.round(f<0? v*(1+f) : v+(255-v)*f); return '#'+[m(r),m(g),m(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); }

// 방패형 엠블럼: 팀 컬러 + 야구공 실밥 + 팀 약칭
function crest(id, size=40){
  const t = TD(id); const c=t.color, d=shade(c,-0.35), txt=CREST_TXT[id]||id, fs = txt.length>=3?15:txt.length===2&&/[가-힣]/.test(txt)?15:18;
  return `<svg width="${size}" height="${size*1.15}" viewBox="0 0 80 92" role="img" aria-label="${t.name} 엠블럼" style="flex:none;vertical-align:middle">
  <defs><linearGradient id="cg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
  <path d="M40 3 L74 13 V44 C74 66 59 81 40 89 C21 81 6 66 6 44 V13 Z" fill="url(#cg${id})" stroke="#fff" stroke-opacity=".9" stroke-width="3"/>
  <path d="M40 10 L67 18 V44 C67 62 55 75 40 82 C25 75 13 62 13 44 V18 Z" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
  <circle cx="40" cy="30" r="10" fill="#fff"/>
  <path d="M33 23 Q37 30 33 37 M47 23 Q43 30 47 37" stroke="${c}" stroke-width="1.6" fill="none"/>
  <text x="40" y="${fs>=18?64:62}" text-anchor="middle" font-family="-apple-system,'Apple SD Gothic Neo',sans-serif" font-weight="900" font-size="${fs}" fill="#fff" letter-spacing=".5">${txt}</text>
  <path d="M26 71 H54" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
</svg>`;
}

// 선수 실루엣 (FM의 얼굴 자리를 대신하는 오리지널 아바타)
function avatar(p, size=72){
  const c = (p.team && TD(p.team)?.color) || (p.faFrom && TD(p.faFrom)?.color) || '#4b5866', skin = ['#f1c9a5','#e0ac85','#c98e66','#8d5a3b'][hash(p.name)%4];
  return `<svg width="${size}" height="${size}" viewBox="0 0 80 80" role="img" aria-label="${p.name}" style="flex:none;border-radius:10px;background:linear-gradient(${shade(c,-0.2)},#0b1016)">
  <path d="M10 80 C12 60 26 54 40 54 C54 54 68 60 70 80 Z" fill="${c}"/>
  <path d="M33 54 L40 64 L47 54" fill="#fff" opacity=".85"/>
  <text x="40" y="76" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="sans-serif">${p.isP?'P':(p.pos==='DH'?'DH':p.pos)}</text>
  <rect x="34" y="44" width="12" height="12" rx="3" fill="${skin}"/>
  <ellipse cx="40" cy="34" rx="13" ry="15" fill="${skin}"/>
  <path d="M26 31 C26 18 54 18 54 31 Z" fill="${shade(c,-0.25)}"/>
  <path d="M50 29 C58 29 62 31 62 33 L50 33 Z" fill="${shade(c,-0.4)}"/>
  <circle cx="40" cy="22" r="2.4" fill="#fff" opacity=".8"/>
</svg>`;
}

// 특성 아이콘 (선 아이콘)
const ICON_PATHS = {
  bat:'M4 20 L7 17 M6.5 17.5 L17 7 C18.5 5.5 20.5 5.5 20 4 C19.5 3.5 18.5 3.5 17 5 L6.5 15.5',
  power:'M13 2 L4 14 H11 L10 22 L20 9 H13 Z',
  eye:'M2 12 C5 6 19 6 22 12 C19 18 5 18 2 12 Z M12 9.5 A2.5 2.5 0 1 0 12.01 9.5',
  run:'M13 4 A2 2 0 1 0 13.01 4 M6 21 L9 15 L13 17 L14 22 M9 15 L11 9 L16 11 L19 9 M11 9 L7 11',
  glove:'M6 21 C4 15 4 9 7 7 V4 M10 13 V3 M13 13 V3.5 M16 13 V5 M19 13 C19 9 20 8 20 8 M6 21 H17 C19 18 20 15 19 13',
  arm:'M4 18 C8 10 14 7 21 6 M17 3 L21 6 L18 10',
  fire:'M12 22 C7 22 5 18 6 14 C7 11 9 10 9 7 C11 9 12 10 12 12 C13 9 14 6 13 2 C17 5 19 10 19 15 C19 19 16 22 12 22 Z',
  target:'M12 3 A9 9 0 1 0 12.01 3 M12 7.5 A4.5 4.5 0 1 0 12.01 7.5 M12 11 A1 1 0 1 0 12.01 11',
  curve:'M4 18 C6 6 16 4 20 8 C22 11 19 14 15 12',
  ground:'M3 20 H21 M7 16 L12 8 L17 16 M12 8 V4',
  clock:'M12 3 A9 9 0 1 0 12.01 3 M12 7 V12 L15 14',
  heart:'M12 20 C5 15 3 11 4 8 C5 5 9 4 12 8 C15 4 19 5 20 8 C21 11 19 15 12 20 Z',
  star:'M12 3 L14.7 8.6 L21 9.3 L16.3 13.6 L17.6 20 L12 16.8 L6.4 20 L7.7 13.6 L3 9.3 L9.3 8.6 Z',
  shield:'M12 3 L20 6 V12 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 12 V6 Z',
  crown:'M3 18 H21 L19 8 L15 12 L12 5 L9 12 L5 8 Z',
  warn:'M12 3 L22 20 H2 Z M12 9 V14 M12 17 V17.5',
  hand:'M8 13 V5 A1.5 1.5 0 0 1 11 5 V11 M11 10 V3.5 A1.5 1.5 0 0 1 14 3.5 V11 M14 10 V5 A1.5 1.5 0 0 1 17 5 V13 C17 18 14 21 11 21 C8 21 6 19 5 16 L3.5 12.5 A1.5 1.5 0 0 1 6 11 L8 13',
};
const TRAIT_ICON = {
 '5툴 플레이어':'star','클러치 히터':'target','홈런 타자':'power','교타자':'bat','선구안 장인':'eye','대도':'run','좌완 킬러':'bat','우완 킬러':'bat',
 '그물망 수비':'glove','강견':'arm','큰 경기 강자':'crown','초구 공략':'bat','갭 히터':'bat','공갈포':'power','병살 머신':'ground','수비 불안':'glove',
 '주루 센스':'run','번트 장인':'bat','배드볼 히터':'bat','도루 저지':'arm','끈질긴 승부':'eye',
 '닥터K':'target','컨트롤 아티스트':'target','파이어볼러':'fire','땅볼 유도형':'ground','이닝이터':'clock','위기관리':'shield','에이스 기질':'crown',
 '철완':'arm','좌타 스페셜리스트':'hand','견제의 달인':'eye','피홈런 주의':'warn','변화구 마술사':'curve','볼넷 남발':'warn','뜬공 투수':'curve',
 '롱릴리프':'clock','퀵모션 약점':'warn','스태미너 부족':'clock',
 '철인':'heart','유리몸':'heart','새가슴':'heart','리더':'crown',
};
function icon(name, size=14, color='currentColor'){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;vertical-align:-2px"><path d="${ICON_PATHS[name]||ICON_PATHS.star}"/></svg>`;
}
const traitIcon = (t,size=13)=>icon(TRAIT_ICON[t]||'star', size);

// 타이틀 로고
// PM 2026 앱 아이콘 (오리지널: 홈플레이트 + 야구공 실밥 + PM). icons/ 폴더에 PNG·SVG 원본
let _pmi=0;
function pmIcon(size=48){
  const i='pmi'+(_pmi++);
  if(size<=40) return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="프로야구 매니저 PM 2026" style="flex:none"><defs><linearGradient id="${i}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232c3a"/><stop offset="1" stop-color="#0a0d12"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#${i}b)"/><path d="M13 12 H51 Q53 12 53 14 V36 L33.5 54 Q32 55.4 30.5 54 L11 36 V14 Q11 12 13 12 Z" fill="#fff"/><path d="M17 14 Q13.5 25 17 36 M47 14 Q50.5 25 47 36" stroke="#e5383b" stroke-width="2.6" fill="none" stroke-linecap="round"/><text x="32" y="33" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="17" letter-spacing="-1" fill="#0f141b">PM</text></svg>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-label="프로야구 매니저 PM 2026" style="flex:none">
  <defs><linearGradient id="${i}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2330"/><stop offset="1" stop-color="#080b10"/></linearGradient>
    <radialGradient id="${i}w" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#e5383b" stop-opacity=".55"/><stop offset="1" stop-color="#e5383b" stop-opacity="0"/></radialGradient>
    <linearGradient id="${i}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe5ec"/></linearGradient>
    <linearGradient id="${i}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d4f"/><stop offset="1" stop-color="#c3122e"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#${i}g)"/><rect width="512" height="512" rx="112" fill="url(#${i}w)"/>
  <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="4"/>
  <path d="M116 112 H396 Q412 112 412 128 V278 Q412 290 403 298 L268 420 Q256 431 244 420 L109 298 Q100 290 100 278 V128 Q100 112 116 112 Z" fill="url(#${i}p)"/>
  <g fill="none" stroke="url(#${i}r)" stroke-width="9" stroke-linecap="round"><path d="M150 128 Q122 205 150 290"/><path d="M362 128 Q390 205 362 290"/></g>
  <g stroke="#d7263d" stroke-width="7" stroke-linecap="round"><path d="M139 146 l22 6"/><path d="M134 172 l23 3"/><path d="M132 199 l24 0"/><path d="M133 226 l23 -3"/><path d="M137 253 l22 -6"/><path d="M373 146 l-22 6"/><path d="M378 172 l-23 3"/><path d="M380 199 l-24 0"/><path d="M379 226 l-23 -3"/><path d="M375 253 l-22 -6"/></g>
  <text x="256" y="256" text-anchor="middle" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="112" letter-spacing="-4" fill="#0f141b">PM</text>
  <rect x="196" y="300" width="120" height="34" rx="17" fill="url(#${i}r)"/><text x="256" y="325" text-anchor="middle" font-family="'Arial Black',Arial,sans-serif" font-weight="900" font-size="24" letter-spacing="3" fill="#fff">2026</text></svg>`;
}
// 타이틀 로고: 아이콘 + 워드마크
// PM 2026 엠블럼 (icons/pm-icon.svg와 같은 디자인: 홈플레이트 + 야구공 실밥 + PM + 2026)
const PM_DEFS = `<linearGradient id="pmPlate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe5ec"/></linearGradient>
  <linearGradient id="pmRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d4f"/><stop offset="1" stop-color="#c3122e"/></linearGradient>`;
const PM_PLATE = `<path d="M116 112 H396 Q412 112 412 128 V278 Q412 290 403 298 L268 420 Q256 431 244 420 L109 298 Q100 290 100 278 V128 Q100 112 116 112 Z" fill="url(#pmPlate)"/>
  <g fill="none" stroke="url(#pmRed)" stroke-width="9" stroke-linecap="round"><path d="M150 128 Q122 205 150 290"/><path d="M362 128 Q390 205 362 290"/></g>
  <g stroke="#d7263d" stroke-width="7" stroke-linecap="round"><path d="M139 146 l22 6"/><path d="M134 172 l23 3"/><path d="M132 199 l24 0"/><path d="M133 226 l23 -3"/><path d="M137 253 l22 -6"/>
    <path d="M373 146 l-22 6"/><path d="M378 172 l-23 3"/><path d="M380 199 l-24 0"/><path d="M379 226 l-23 -3"/><path d="M375 253 l-22 -6"/></g>
  <text x="256" y="256" text-anchor="middle" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="112" letter-spacing="-4" fill="#0f141b">PM</text>
  <rect x="196" y="300" width="120" height="34" rx="17" fill="url(#pmRed)"/>
  <text x="256" y="325" text-anchor="middle" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="24" letter-spacing="3" fill="#fff">2026</text>`;
// 앱 아이콘 (둥근 사각형 배경 포함)
function pmIcon(size=40){
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-label="프로야구 매니저 PM 2026" style="flex:none;display:block"><defs>${PM_DEFS}
    <linearGradient id="pmBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2330"/><stop offset="1" stop-color="#080b10"/></linearGradient>
    <radialGradient id="pmGlow" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#e5383b" stop-opacity=".55"/><stop offset="1" stop-color="#e5383b" stop-opacity="0"/></radialGradient></defs>
    <rect width="512" height="512" rx="112" fill="url(#pmBg)"/><rect width="512" height="512" rx="112" fill="url(#pmGlow)"/>
    <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="4"/>${PM_PLATE}</svg>`;
}
// 타이틀 로고: 엠블럼 + 게임 이름
function titleLogo(w=420){
  return `<svg width="${w}" viewBox="0 0 580 160" role="img" aria-label="프로야구 매니저 PM 2026" style="max-width:100%"><defs>${PM_DEFS}
    <filter id="pmShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter></defs>
  <g filter="url(#pmShadow)" transform="translate(8 6) scale(.46) translate(-100 -112)">${PM_PLATE}</g>
  <text x="176" y="66" font-family="-apple-system,'Helvetica Neue',sans-serif" font-size="15" font-weight="800" letter-spacing="5" fill="#9aa6b3">PRO BASEBALL MANAGER</text>
  <text x="172" y="126" font-family="-apple-system,'Apple SD Gothic Neo',sans-serif" font-size="56" font-weight="900" letter-spacing="-1" fill="#f2f5f8">프로야구 매니저</text>
</svg>`;
}

// 구장 일러스트 (구단 페이지 헤더)
function ballpark(id, h=150){
  const c = TD(id).color;
  return `<svg viewBox="0 0 600 150" preserveAspectRatio="xMidYMax slice" style="width:100%;height:${h}px;display:block;border-radius:10px" role="img" aria-label="${TD(id).stadium}">
  <defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a2e"/><stop offset="1" stop-color="${shade(c,-0.55)}"/></linearGradient></defs>
  <rect width="600" height="150" fill="url(#sky${id})"/>
  ${[60,180,420,540].map(x=>`<g><rect x="${x-2}" y="10" width="4" height="60" fill="#3a4654"/><rect x="${x-16}" y="4" width="32" height="10" rx="2" fill="#fff8d6"/><path d="M${x-16} 14 L${x-90} 150 H${x+90} L${x+16} 14 Z" fill="#fff8d6" opacity=".05"/></g>`).join('')}
  <path d="M0 95 Q300 40 600 95 V150 H0 Z" fill="${shade(c,-0.3)}"/>
  <path d="M0 105 Q300 58 600 105 V150 H0 Z" fill="#1f5f33"/>
  <path d="M300 150 L210 112 L300 86 L390 112 Z" fill="#a8743f"/>
  <path d="M300 146 L232 114 L300 94 L368 114 Z" fill="#2a7a42"/>
  <circle cx="300" cy="118" r="5" fill="#b9864f"/>
  ${[[300,146],[232,114],[300,94],[368,114]].map(([x,y])=>`<rect x="${x-3}" y="${y-3}" width="6" height="6" fill="#fff" transform="rotate(45 ${x} ${y})"/>`).join('')}
</svg>`;
}
