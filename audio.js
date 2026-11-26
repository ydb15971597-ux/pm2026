// 프로야구 매니저 PM — 배경음악 (오리지널 곡, WebAudio 실시간 합성: 외부 음원 파일 없음)
// 두 곡: 메인 테마(로파이 시티팝풍, D장조 100BPM) · 경기 테마(야구장 응원풍, A장조 126BPM, 중계 중 자동 전환)
// 악기: FM 일렉트릭 피아노, 디튠 패드, 서브 베이스, 리드(필터 엔벨로프+딜레이), 오르간 스탭, 드럼(킥·스네어·하이햇·박수), 리버브
const BGM = (() => {
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const NN = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const note = s => { const m=/^([A-G]#?)(\d)$/.exec(s); return m ? NN[m[1]] + (+m[2]+1)*12 : null; };
  const TRACKS = {
    main: { bpm:100, swing:0.14, style:'lofi',
      bars:[ // [베이스 근음, 화음 보이싱]
        [43,[59,62,66,69]],[42,[57,61,64,66]],[40,[55,59,62,66]],[45,[55,61,64,69]],
        [43,[59,62,66,69]],[42,[57,61,64,66]],[47,[57,62,66,69]],[45,[55,61,64,67]],
        [40,[55,59,62,66]],[45,[55,61,64,67]],[42,[57,61,64,69]],[47,[57,62,66,69]],
        [40,[55,59,62,66]],[45,[55,61,64,67]],[38,[54,57,61,64]],[38,[54,57,61,66]] ],
      mel:[
        '. D5 F#5 A5 - F#5 E5 D5','C#5 - - E5 - . A4 -','B4 D5 G5 - F#5 E5 D5 E5','E5 - - - . C#5 D5 E5',
        'F#5 - A5 - D6 - C#6 B5','A5 - - F#5 - E5 C#5 -','D5 F#5 B5 - A5 F#5 D5 -','E5 - - - - . . .',
        'G5 - F#5 G5 - B5 A5 G5','G5 - E5 - C#5 - . A4','A5 - F#5 E5 C#5 - E5 F#5','F#5 - D5 - B4 - . .',
        'B4 D5 E5 G5 - B5 - A5','A5 - G5 - E5 - C#5 E5','D5 - - - F#5 - A5 -','C#6 - - D6 - - - .' ] },
    game: { bpm:126, swing:0, style:'stadium',
      bars:[
        [45,[57,61,64]],[40,[56,59,64]],[42,[57,61,66]],[38,[57,62,66]],
        [45,[57,61,64]],[40,[56,59,64]],[38,[57,62,66]],[40,[56,59,64]],
        [38,[57,62,66]],[40,[56,59,64]],[37,[56,61,64]],[42,[57,61,66]],
        [38,[57,62,66]],[40,[56,59,64]],[45,[57,61,64]],[45,[57,61,64]] ],
      mel:[
        'A4 - C#5 E5 - C#5 E5 A5','G#5 - E5 - B4 - E5 -','F#5 - A5 F#5 - C#5 E5 F#5','F#5 - D5 - A4 - . .',
        'A4 - C#5 E5 - C#5 E5 A5','B5 - G#5 - E5 - B5 -','A5 - F#5 - D5 - F#5 A5','G#5 - - - B5 - - -',
        'F#5 - A5 - D6 - A5 -','G#5 - B5 - E6 - B5 -','C#6 - B5 - A5 - G#5 -','A5 - F#5 - C#5 - . .',
        'D5 F#5 A5 - D6 - C#6 B5','B5 - G#5 - E5 F#5 G#5 B5','A5 - - - E5 - C#5 -','A5 - - - . . . .' ] },
  };
  let ctx=null, out=null, comp=null, rev=null, revIn=null, dly=null, dlyIn=null, noiseBuf=null, timer=null, watch=null;
  let step=0, nextT=0, on=false, vol=0.35, cur='main', want='main';
  function prefs(){ try{ const p=JSON.parse(localStorage.getItem('kboBgm')||'{}'); if(typeof p.vol==='number') vol=p.vol; return p; }catch(e){ return {}; } }
  function savePrefs(){ try{ const o=JSON.parse(localStorage.getItem('kboBgm')||'{}'); localStorage.setItem('kboBgm', JSON.stringify({...o, on, vol})); }catch(e){ try{ localStorage.setItem('kboBgm', JSON.stringify({on, vol})); }catch(_){} } }
  function init(){
    if(ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value=-16; comp.knee.value=12; comp.ratio.value=3; comp.attack.value=0.01; comp.release.value=0.2;
    const shelf = ctx.createBiquadFilter(); shelf.type='highshelf'; shelf.frequency.value=7000; shelf.gain.value=-4;
    out = ctx.createGain(); out.gain.value = 0.0001;
    out.connect(shelf); shelf.connect(comp); comp.connect(ctx.destination);
    // 리버브: 감쇠하는 스테레오 노이즈 임펄스
    rev = ctx.createConvolver(); const len=ctx.sampleRate*2.4, ir=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let c=0;c<2;c++){ const d=ir.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2); }
    rev.buffer=ir; revIn=ctx.createGain(); revIn.gain.value=0.32; const rf=ctx.createBiquadFilter(); rf.type='lowpass'; rf.frequency.value=5000;
    revIn.connect(rf); rf.connect(rev); rev.connect(out);
    // 딜레이 (점8분)
    dly = ctx.createDelay(1.5); dlyIn = ctx.createGain(); dlyIn.gain.value=0.22; const fb=ctx.createGain(); fb.gain.value=0.32; const df=ctx.createBiquadFilter(); df.type='lowpass'; df.frequency.value=2600;
    dlyIn.connect(dly); dly.connect(df); df.connect(fb); fb.connect(dly); df.connect(out); df.connect(revIn);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate*0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  }
  const bus = (pan=0, wet=0.2, delay=0)=>{ const g=ctx.createGain(), p=ctx.createStereoPanner?ctx.createStereoPanner():null; if(p){ p.pan.value=pan; g.connect(p); p.connect(out); } else g.connect(out);
    if(wet){ const s=ctx.createGain(); s.gain.value=wet; g.connect(s); s.connect(revIn); } if(delay){ const s=ctx.createGain(); s.gain.value=delay; g.connect(s); s.connect(dlyIn); } return g; };
  const adsr = (g,t,a,d,s,peak,dur,r)=>{ const gg=g.gain; gg.setValueAtTime(0.0001,t); gg.linearRampToValueAtTime(peak,t+a); gg.exponentialRampToValueAtTime(Math.max(0.0002,peak*s),t+a+d); gg.setValueAtTime(Math.max(0.0002,peak*s),t+Math.max(a+d,dur)); gg.exponentialRampToValueAtTime(0.0001,t+Math.max(a+d,dur)+r); return t+Math.max(a+d,dur)+r; };
  // FM 일렉트릭 피아노
  function epiano(n, t, dur, vel=1, pan=0){
    const f=hz(n), g=ctx.createGain(), dst=bus(pan,0.28); g.connect(dst);
    const end=adsr(g,t,0.004,0.9,0.35,0.075*vel,dur,0.35);
    const car=ctx.createOscillator(); car.frequency.value=f; const mod=ctx.createOscillator(); mod.frequency.value=f; const mg=ctx.createGain();
    mg.gain.setValueAtTime(f*1.6*vel,t); mg.gain.exponentialRampToValueAtTime(f*0.15,t+0.6); mod.connect(mg); mg.connect(car.frequency);
    const bell=ctx.createOscillator(); bell.frequency.value=f*4; const bg=ctx.createGain(); bg.gain.setValueAtTime(0.018*vel,t); bg.gain.exponentialRampToValueAtTime(0.0001,t+0.25); bell.connect(bg); bg.connect(dst);
    car.connect(g); [car,mod,bell].forEach(o=>{ o.start(t); o.stop(end+0.05); });
  }
  // 디튠 패드
  function pad(ns, t, dur, lvl=0.022){
    const f=ctx.createBiquadFilter(); f.type='lowpass'; f.Q.value=0.7; f.frequency.setValueAtTime(500,t); f.frequency.linearRampToValueAtTime(1300,t+dur*0.5); f.frequency.linearRampToValueAtTime(700,t+dur);
    const g=ctx.createGain(); f.connect(g); g.connect(bus(0,0.55)); const end=adsr(g,t,dur*0.25,0.2,0.85,lvl,dur*0.85,dur*0.4);
    ns.forEach((n,i)=>[-9,8].forEach(dt=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=hz(n); o.detune.value=dt+(i%2?3:-3); o.connect(f); o.start(t); o.stop(end+0.05); }));
  }
  // 오르간 스탭 (경기 테마)
  function organ(ns, t, dur, lvl=0.05){
    const g=ctx.createGain(); g.connect(bus(0.15,0.3)); const end=adsr(g,t,0.006,0.08,0.7,lvl,dur,0.06);
    const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=6.2; lg.gain.value=4; lfo.connect(lg); lfo.start(t); lfo.stop(end+0.05);
    ns.forEach(n=>[[1,1],[2,0.55],[3,0.3],[4,0.18],[6,0.08]].forEach(([h,a])=>{ const o=ctx.createOscillator(), og=ctx.createGain(); o.frequency.value=hz(n)*h; og.gain.value=a/ns.length; lg.connect(o.detune); o.connect(og); og.connect(g); o.start(t); o.stop(end+0.05); }));
  }
  // 리드
  function lead(n, t, dur, style){
    const f=hz(n), g=ctx.createGain(), flt=ctx.createBiquadFilter(); flt.type='lowpass'; flt.Q.value= style==='stadium'?3:1.2;
    const top = style==='stadium'? 4200 : 2600; flt.frequency.setValueAtTime(top*0.35,t); flt.frequency.linearRampToValueAtTime(top,t+0.03); flt.frequency.exponentialRampToValueAtTime(top*0.45,t+0.35);
    flt.connect(g); g.connect(bus(-0.1, 0.3, style==='stadium'?0.12:0.3));
    const end=adsr(g,t,style==='stadium'?0.012:0.02,0.15,0.75,style==='stadium'?0.06:0.055,dur,0.12);
    const vib=ctx.createOscillator(), vg=ctx.createGain(); vib.frequency.value=5.5; vg.gain.setValueAtTime(0,t); vg.gain.linearRampToValueAtTime(style==='stadium'?6:9,t+0.25); vib.connect(vg);
    const types = style==='stadium' ? [['sawtooth',-6,0.6],['sawtooth',6,0.6],['square',0,0.25]] : [['triangle',0,1],['square',4,0.22],['sine',-1200,0.0]];
    types.forEach(([ty,dt,a])=>{ if(!a) return; const o=ctx.createOscillator(), og=ctx.createGain(); o.type=ty; o.frequency.value=f; o.detune.value=dt; vg.connect(o.detune); og.gain.value=a; o.connect(og); og.connect(flt); o.start(t); o.stop(end+0.05); });
    vib.start(t); vib.stop(end+0.05);
  }
  function bass(n, t, dur, style){
    const o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter(); o.type='sine'; o2.type= style==='stadium'?'sawtooth':'triangle'; o.frequency.value=hz(n); o2.frequency.value=hz(n);
    const g2=ctx.createGain(); g2.gain.value= style==='stadium'?0.25:0.35; o2.connect(g2); g2.connect(f);
    f.type='lowpass'; f.frequency.setValueAtTime(style==='stadium'?900:520,t); f.frequency.exponentialRampToValueAtTime(260,t+0.25); o.connect(g); f.connect(g); g.connect(bus(0,0));
    const end=adsr(g,t,0.006,0.12,0.7,0.2,dur,0.05); [o,o2].forEach(x=>{ x.start(t); x.stop(end+0.05); });
  }
  function kick(t, lvl=0.8){ const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(155,t); o.frequency.exponentialRampToValueAtTime(44,t+0.12);
    g.gain.setValueAtTime(lvl,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.32); o.connect(g); g.connect(bus(0,0)); o.start(t); o.stop(t+0.35);
    noise(t,0.012,'highpass',3000,lvl*0.25,0); duck(t); }
  let duckG=null; function duck(t){ /* 킥에 맞춰 패드·베이스가 살짝 눌리는 효과 */ out.gain.setTargetAtTime(vol*0.42,t,0.005); out.gain.setTargetAtTime(vol*0.5,t+0.06,0.08); }
  function noise(t, dur, type, freq, lvl, wet=0.1, pan=0, q=0.8){ const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=noiseBuf; s.playbackRate.value=0.9+Math.random()*0.2;
    f.type=type; f.frequency.value=freq; f.Q.value=q; g.gain.setValueAtTime(lvl,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(bus(pan,wet)); s.start(t); s.stop(t+dur+0.02); }
  function snare(t, lvl=0.3){ noise(t,0.18,'bandpass',2000,lvl,0.25,0,0.6); const o=ctx.createOscillator(), g=ctx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(160,t+0.06);
    g.gain.setValueAtTime(lvl*0.6,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.1); o.connect(g); g.connect(bus(0,0.15)); o.start(t); o.stop(t+0.12); }
  const hat = (t,lvl,open)=> noise(t, open?0.16:0.035, 'highpass', 8000, lvl, 0.05, 0.25, 0.5);
  const clap = (t,lvl=0.22)=>{ [0,0.011,0.023].forEach((d,i)=>noise(t+d, i===2?0.14:0.03, 'bandpass', 1300, lvl, 0.35, 0, 1.2)); };
  const crowd = (t,lvl=0.12)=>{ for(let i=0;i<6;i++) noise(t+Math.random()*0.03, 0.08, 'bandpass', 900+Math.random()*900, lvl*(0.6+Math.random()*0.5), 0.5, Math.random()*1.2-0.6, 1); };
  const SEQ = {}; function melOf(tr){ return SEQ[tr] ||= TRACKS[tr].mel.map(b=>b.split(' ')); }
  function stepDur(){ return 60/TRACKS[cur].bpm/4; }
  function schedule(i, t){
    const T=TRACKS[cur], bar=Math.floor(i/16)%T.bars.length, s=i%16, [root, ch]=T.bars[bar], sd=stepDur(), st=T.style;
    // 스윙: 홀수 16분음표를 살짝 늦춘다
    const tt = t + (s%2 ? sd*T.swing : 0);
    // 멜로디 (8분음표 단위)
    if(s%2===0){ const mel=melOf(cur)[bar], k=s/2, tok=mel[k];
      if(tok && tok!=='-' && tok!=='.'){ let len=1; while(k+len<8 && mel[k+len]==='-') len++; const n=note(tok); if(n!=null) lead(n, tt, sd*2*len*0.92, st); } }
    if(st==='lofi'){
      if(s===0) pad(ch.map(n=>n-12).concat([ch[0]]), t, sd*16);
      if(s===0||s===6||(s===10&&bar%2)) ch.forEach((n,j)=>epiano(n, tt+j*0.012, sd*(s===0?5:3), s===0?0.9:0.65, (j-1.5)*0.25));
      const bp = {0:[root,5],6:[root+12,2],8:[root+7,3],11:[root,2],14:[root+(bar%2?10:5),2]}[s]; if(bp) bass(bp[0], tt, sd*bp[1], st);
      if(s===0||s===7||(s===10&&bar%4!==3)) kick(t, s===0?0.75:0.55);
      if(s===4||s===12) snare(t, 0.26);
      hat(tt, s%4===2?0.05:s%2?0.018:0.032, s===14&&bar%2);
      if(bar%8===7 && s>=12) snare(tt, 0.06+0.03*(s-12));   // 필인
    } else {
      if(s===0 && bar%4===0) pad(ch.map(n=>n-12), t, sd*64, 0.014);
      if(s%4===2) organ(ch, t, sd*1.4, 0.05);              // 오프비트 오르간 스탭
      if(s%4===0) kick(t, 0.8);
      if(s===4||s===12){ snare(t,0.2); clap(t,0.2); }
      hat(t, s%2?0.02:0.04, s%4===2);
      const bp = {0:[root,3],3:[root,1],4:[root+12,2],8:[root,3],11:[root+7,1],12:[root+12,2]}[s]; if(bp) bass(bp[0], t, sd*bp[1], st);
      // 4·8마디 끝: "짝짝 짝짝짝" 응원 박수 + 함성
      if(bar%4===3){ if([8,10,12,13,14].includes(s)) clap(t,0.24); if(s===14) crowd(t,0.1); }
      if(bar===15 && s===0) crowd(t,0.14);
    }
  }
  function tick(){
    while(nextT < ctx.currentTime + 0.3){
      if(step%16===0 && want!==cur && step%64===0){ cur=want; step=0; }
      else if(step%16===0 && want!==cur && want==='game'){ cur=want; step=0; }   // 경기 시작하면 바로 전환
      schedule(step, nextT); nextT += stepDur(); step++;
    }
  }
  function start(){ init(); if(!ctx) return; ctx.resume(); if(timer) return; step=0; nextT=ctx.currentTime+0.12; cur=want; timer=setInterval(tick, 40); on=true;
    out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(vol*0.5, ctx.currentTime, 0.3); savePrefs(); ui(); }
  function stop(){ on=false; if(timer){ clearInterval(timer); timer=null; } if(ctx){ out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08); } savePrefs(); ui(); }
  function setVol(v){ vol=Math.max(0,Math.min(1,v)); if(ctx&&on) out.gain.setTargetAtTime(vol*0.5, ctx.currentTime, 0.05); savePrefs(); }
  function ui(){
    let el=document.getElementById('bgm');
    if(!el){ el=document.createElement('div'); el.id='bgm'; document.body.appendChild(el);
      const st=document.createElement('style'); st.textContent=`#bgm{position:fixed;right:14px;bottom:14px;z-index:60;display:flex;align-items:center;gap:8px;background:rgba(14,18,23,.92);border:1px solid #2c3540;border-radius:22px;padding:6px 12px 6px 8px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
#bgm button{border:0;background:none;color:#e8edf2;font-weight:700;font-size:13px;cursor:pointer;padding:4px 6px;white-space:nowrap}
#bgm input{width:80px;accent-color:#e5383b}body.mob #bgm{display:none}@media (max-width:760px){#bgm{display:none}}`; document.head.appendChild(st); }
    el.innerHTML=`<button aria-label="배경음악 ${on?'끄기':'켜기'}" onclick="BGM.toggle()">${on?'♪ BGM 켜짐':'♪ BGM 꺼짐'}</button><input type="range" min="0" max="1" step="0.05" value="${vol}" aria-label="배경음악 음량" oninput="BGM.setVol(+this.value)">`;
  }
  // 효과음: 배트에 공이 맞는 "딱!" — 나무 배트 타격음(날카로운 크랙 + 나무 울림 + 낮은 충격음 + 짧은 잔향)
  let sfxOut=null, sfxOn=true;
  try{ sfxOn = JSON.parse(localStorage.getItem('kboBgm')||'{}').sfx !== false; }catch(e){}
  function batHit(power=1){
    if(!sfxOn) return; init(); if(!ctx) return; ctx.resume();
    if(!sfxOut){ sfxOut=ctx.createGain(); sfxOut.gain.value=0.85; sfxOut.connect(comp);
      const w=ctx.createGain(); w.gain.value=0.38; const cv=ctx.createConvolver(); cv.buffer=rev.buffer; sfxOut.connect(w); w.connect(cv); cv.connect(comp);                       // 야구장 잔향
      const sl=ctx.createDelay(0.5); sl.delayTime.value=0.11; const sg=ctx.createGain(); sg.gain.value=0.16; const sf=ctx.createBiquadFilter(); sf.type='lowpass'; sf.frequency.value=3500;
      sfxOut.connect(sl); sl.connect(sf); sf.connect(sg); sg.connect(comp); }                                   // 관중석에서 돌아오는 짧은 메아리
    const t=ctx.currentTime+0.005, p=power*(0.92+Math.random()*0.16), f0=1180*(0.97+Math.random()*0.06);
    // 1) 맑게 울리는 나무 공진음 ("깡"): 나무 막대처럼 비정수배 배음, 높은 음일수록 빨리 사라짐
    [[1,0.55,0.20],[2.76,0.26,0.09],[5.40,0.10,0.045],[0.47,0.24,0.13]].forEach(([r,a,d])=>{ const o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine';
      o.frequency.setValueAtTime(f0*r*1.025,t); o.frequency.exponentialRampToValueAtTime(f0*r,t+0.02);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(a*p,t+0.0008); g.gain.exponentialRampToValueAtTime(0.0001,t+d*(power>1?1.15:1));
      o.connect(g); g.connect(sfxOut); o.start(t); o.stop(t+d*1.2+0.02); });
    // 2) 맞는 순간의 아주 짧은 "탁" (밝은 클릭, 지저분하지 않게 4ms)
    const n=ctx.createBufferSource(); n.buffer=noiseBuf; const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=4500;
    const ng=ctx.createGain(); ng.gain.setValueAtTime(0.55*p,t); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.006);
    n.connect(hp); hp.connect(ng); ng.connect(sfxOut); n.start(t); n.stop(t+0.02);
    // 3) 가볍게 받쳐 주는 몸통음 (둔하지 않게 짧고 작게)
    const k=ctx.createOscillator(), kg=ctx.createGain(); k.type='triangle'; k.frequency.setValueAtTime(320,t); k.frequency.exponentialRampToValueAtTime(180,t+0.04);
    kg.gain.setValueAtTime(0.18*p,t); kg.gain.exponentialRampToValueAtTime(0.0001,t+0.05); k.connect(kg); kg.connect(sfxOut); k.start(t); k.stop(t+0.07);
  }
  function setSfx(v){ sfxOn=!!v; try{ const p=JSON.parse(localStorage.getItem('kboBgm')||'{}'); p.sfx=sfxOn; localStorage.setItem('kboBgm', JSON.stringify(p)); }catch(e){} if(sfxOn) batHit(0.8); }
  // 플레이 버튼(시작·이어하기·계속·경기 중계·구단 선택 확정)을 누르면 "딱!"
  const PLAY_SEL = '.tt-go,.tt-save,.cont .go,.m-go,.pdet .go,.pregame .pri';
  document.addEventListener('pointerdown', e=>{ const b=e.target.closest && e.target.closest(PLAY_SEL); if(b && !b.disabled) batHit(b.classList.contains('live')?1.15:1); }, true);
  document.addEventListener('keydown', e=>{ if((e.key==='Enter'||e.key===' ') && document.activeElement?.matches?.(PLAY_SEL)) batHit(); }, true);
  function boot(){
    const p=prefs(); ui();
    watch = setInterval(()=>{ want = (typeof LV!=='undefined' && LV) ? 'game' : 'main'; }, 500);
    if(p.on!==false){ const go=()=>{ document.removeEventListener('pointerdown',go,true); document.removeEventListener('keydown',go,true); if(!on && prefs().on!==false) start(); };
      document.addEventListener('pointerdown',go,true); document.addEventListener('keydown',go,true); }  // 브라우저 정책: 첫 클릭 뒤 재생
  }
  return {start, stop, toggle(){ on?stop():start(); }, setVol, boot, get on(){ return on; }, get vol(){ return vol; }, get track(){ return cur; }, hit:batHit, setSfx, get sfx(){ return sfxOn; }};
})();
BGM.boot();
