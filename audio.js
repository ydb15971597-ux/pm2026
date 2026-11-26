// 프로야구 매니저 PM — 배경음악 (오리지널 곡, WebAudio로 실시간 합성: 외부 음원 파일 없음)
// 야구장 오르간 + 베이스 + 드럼 + 박수. G장조, 8마디 루프 2개(A·B)를 번갈아 연주한다.
const BGM = (() => {
  const BPM = 116, STEP = 60 / BPM / 2;           // 8분음표 길이(초)
  const mid = n => 440 * Math.pow(2, (n - 69) / 12);
  const N = {G3:55,A3:57,B3:59,C4:60,D4:62,E4:64,'F#4':66,G4:67,A4:69,B4:71,C5:72,D5:74,E5:76,'F#5':78,G5:79,A5:81,B5:83,C6:84,D6:86};
  // 멜로디: 마디당 8칸(8분음표), '-' 앞 음 유지, '.' 쉼표
  const MEL_A = [
    'G4 B4 D5 - G5 - D5 B4', 'E5 - D5 B4 G4 - B4 -', 'C5 E5 G5 - E5 C5 E5 G5', 'F#5 - E5 D5 A4 - . .',
    'B4 D5 G5 - B5 - A5 G5', 'E5 - G5 E5 C5 - E5 -', 'A4 C5 E5 - D5 C5 B4 A4', 'D5 - F#5 - A5 - . .'];
  const MEL_B = [
    'B5 - A5 G5 D5 - G5 -', 'G5 - F#5 E5 B4 - E5 -', 'E5 G5 C6 - B5 A5 G5 E5', 'F#5 G5 A5 - D5 - . .',
    'D6 - B5 G5 B5 - D6 -', 'C6 - A5 F#5 A5 - C6 -', 'B5 A5 G5 E5 D5 E5 G5 A5', 'G5 - - - . . . .'];
  const CHORDS_A = [['G3','B3','D4'],['E4','G4','B3'],['C4','E4','G4'],['D4','F#4','A3'],['G3','B3','D4'],['C4','E4','G4'],['A3','C4','E4'],['D4','F#4','A3']];
  const CHORDS_B = [['G3','B3','D4'],['E4','G4','B3'],['C4','E4','G4'],['D4','F#4','A3'],['G3','B3','D4'],['D4','F#4','A3'],['C4','E4','G4'],['G3','B3','D4']];
  const ROOT = c => N[c[0]] - 12;
  let ctx=null, master=null, comp=null, noiseBuf=null, timer=null, step=0, nextT=0, on=false, vol=0.35;
  function prefs(){ try{ const p=JSON.parse(localStorage.getItem('kboBgm')||'{}'); if(typeof p.vol==='number') vol=p.vol; return p; }catch(e){ return {}; } }
  function savePrefs(){ try{ localStorage.setItem('kboBgm', JSON.stringify({on, vol})); }catch(e){} }
  function init(){
    if(ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=4;
    master = ctx.createGain(); master.gain.value = vol*0.5;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate*0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  }
  function env(g, t, a, peak, dur, rel){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+a); g.gain.setValueAtTime(peak,t+Math.max(a,dur-rel)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); }
  function organ(note, t, dur, lvl=0.16){ // 드로바 오르간: 1·2·3배음 + 약한 비브라토
    const g=ctx.createGain(); env(g,t,0.008,lvl,dur,0.05); g.connect(master);
    const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=6; lg.gain.value=2.2; lfo.connect(lg);
    [[1,1],[2,0.5],[3,0.22],[4,0.12]].forEach(([h,a])=>{ const o=ctx.createOscillator(), og=ctx.createGain(); o.type='sine'; o.frequency.value=mid(note)*h; lg.connect(o.detune); og.gain.value=a; o.connect(og); og.connect(g); o.start(t); o.stop(t+dur+0.05); });
    lfo.start(t); lfo.stop(t+dur+0.05);
  }
  function pad(notes, t, dur){ const g=ctx.createGain(); env(g,t,0.04,0.035,dur,0.2); const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1400; f.connect(g); g.connect(master);
    notes.forEach(n=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=mid(N[n]); o.connect(f); o.start(t); o.stop(t+dur+0.05); }); }
  function bass(note, t, dur){ const o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter(); o.type='triangle'; o.frequency.value=mid(note);
    f.type='lowpass'; f.frequency.value=600; env(g,t,0.005,0.32,dur,0.06); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05); }
  function kick(t){ const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+0.16);
    g.gain.setValueAtTime(0.55,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.22); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.25); }
  function noise(t, dur, type, freq, lvl){ const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=noiseBuf;
    f.type=type; f.frequency.value=freq; g.gain.setValueAtTime(lvl,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+dur+0.02); }
  const snare = t => { noise(t,0.14,'bandpass',1800,0.22); };
  const hat = (t,open) => noise(t,open?0.12:0.035,'highpass',7000,open?0.06:0.045);
  const clap = t => { [0,0.012,0.024].forEach(d=>noise(t+d,0.09,'bandpass',1200,0.16)); };   // 관중 박수
  function schedule(i, t){
    const part = Math.floor(i/64)%2 ? 'B' : 'A', bar = Math.floor(i/8)%8, s = i%8;
    const mel = (part==='A'?MEL_A:MEL_B)[bar].split(' '), ch = (part==='A'?CHORDS_A:CHORDS_B)[bar];
    // 멜로디
    if(mel[s] && mel[s]!=='-' && mel[s]!=='.'){ let len=1; while(s+len<8 && mel[s+len]==='-') len++; organ(N[mel[s]], t, STEP*len*0.95); }
    // 화음·베이스
    if(s===0) pad(ch, t, STEP*8);
    if(s%2===0){ const r=ROOT(ch); bass(s===4?r+7:s===6&&bar%2?r+12:r, t, STEP*1.8); }
    // 드럼
    if(s===0||s===4||(s===5&&bar%2)) kick(t);
    if(s===2||s===6) { snare(t); if(bar%4===3 || bar===7) clap(t); }
    hat(t, s===7);
    // 4·8마디 끝: "짝짝 짝짝짝" 응원 박수
    if(bar===3||bar===7){ if(s===4) clap(t); if(s===5) clap(t+STEP*0.5); }
  }
  function tick(){ while(nextT < ctx.currentTime + 0.25){ schedule(step, nextT); nextT += STEP; step++; } }
  function start(){ init(); if(!ctx) return; ctx.resume(); if(timer) return; step=0; nextT=ctx.currentTime+0.1; timer=setInterval(tick, 50); on=true; master.gain.setTargetAtTime(vol*0.5, ctx.currentTime, 0.1); savePrefs(); ui(); }
  function stop(){ on=false; if(timer){ clearInterval(timer); timer=null; } if(ctx) master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); savePrefs(); ui(); }
  function setVol(v){ vol=Math.max(0,Math.min(1,v)); if(ctx&&on) master.gain.setTargetAtTime(vol*0.5, ctx.currentTime, 0.05); savePrefs(); }
  function ui(){
    let el=document.getElementById('bgm');
    if(!el){ el=document.createElement('div'); el.id='bgm'; document.body.appendChild(el);
      const st=document.createElement('style'); st.textContent=`#bgm{position:fixed;right:14px;bottom:14px;z-index:60;display:flex;align-items:center;gap:8px;background:rgba(14,18,23,.92);border:1px solid #2c3540;border-radius:22px;padding:6px 12px 6px 8px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
#bgm button{border:0;background:none;color:#e8edf2;font-weight:700;font-size:13px;cursor:pointer;padding:4px 6px;white-space:nowrap}
#bgm input{width:80px;accent-color:#e5383b}@media (max-width:640px){#bgm input{display:none}}`; document.head.appendChild(st); }
    el.innerHTML=`<button aria-label="배경음악 ${on?'끄기':'켜기'}" onclick="BGM.toggle()">${on?'♪ BGM 켜짐':'♪ BGM 꺼짐'}</button><input type="range" min="0" max="1" step="0.05" value="${vol}" aria-label="배경음악 음량" oninput="BGM.setVol(+this.value)">`;
  }
  function boot(){
    const p=prefs(); ui();
    if(p.on!==false){ const go=()=>{ document.removeEventListener('pointerdown',go,true); document.removeEventListener('keydown',go,true); if(!on && prefs().on!==false) start(); };
      document.addEventListener('pointerdown',go,true); document.addEventListener('keydown',go,true); }  // 브라우저 정책: 첫 클릭 뒤 재생
  }
  return {start, stop, toggle(){ on?stop():start(); }, setVol, boot, get on(){ return on; }};
})();
BGM.boot();
