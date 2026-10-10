import { useState, useEffect, useRef } from 'react';
import { Play, Square, Shuffle, RotateCcw, Copy } from 'lucide-react';
import { playBass, playTreble, playClap, getAudioContext } from '../audio/dholSynth';
const presets = {
  Garba: { bpm: 104, bass: [1,0,0,1,1,0,1,0], treble: [1,0,1,0,1,0,1,1], clap: [0,0,1,0,0,0,1,0] },
  Sufi: { bpm: 96, bass: [1,0,1,0,0,1,0,0], treble: [0,1,0,1,1,0,1,1], clap: [0,0,0,0,1,0,0,1] },
  Techno: { bpm: 127, bass: [1,0,1,0,1,0,1,0], treble: [0,1,0,1,0,1,0,1], clap: [0,0,1,0,0,0,1,0] },
};
const voices = [['bass', 'Bass', 'Ge', playBass], ['treble', 'Treble', 'Na / Ti', playTreble], ['clap', 'Clap', 'Taali', playClap]];
export default function PulseLab() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(104);
  const [step, setStep] = useState(-1);
  const [grid, setGrid] = useState(presets.Garba);
  const [preset, setPreset] = useState('Garba');
  const [notice, setNotice] = useState('');
  const [activePad, setActivePad] = useState(null);
  const lastTap = useRef(0);
  const padTimer = useRef(null);
  const pattern = useRef(grid);
  useEffect(() => { pattern.current = grid; }, [grid]);
  useEffect(() => () => clearTimeout(padTimer.current), []);
  useEffect(() => {
    if (!playing) return;
    let current = 0;
    function tick() {
      voices.forEach(([key, , , play]) => { if (pattern.current[key][current]) play(); });
      setStep(current);
      current = (current + 1) % 8;
    }
    tick();
    const timer = setInterval(tick, 60000 / bpm / 2);
    return () => clearInterval(timer);
  }, [playing, bpm]);
  useEffect(() => {
    const stopWhenHidden = () => { if (document.hidden) { setPlaying(false); setStep(-1); } };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => document.removeEventListener('visibilitychange', stopWhenHidden);
  }, []);
  function togglePlayback() {
    if (!playing && !getAudioContext()) { setNotice('Audio is unavailable in this browser.'); return; }
    setPlaying(!playing); setStep(-1);
  }
  function changeCell(voice, index) {
    setPreset('');
    setGrid(previous => ({ ...previous, [voice]: previous[voice].map((value, i) => i === index ? Number(!value) : value) }));
  }
  function tapTempo() {
    const now = Date.now();
    const gap = now - lastTap.current;
    if (gap > 250 && gap < 1500) setBpm(Math.max(75, Math.min(145, Math.round(60000 / gap))));
    lastTap.current = now;
  }
  function pad(key, play) {
    if (!getAudioContext()) { setNotice('Audio is unavailable in this browser.'); return; }
    play(); setActivePad(key); clearTimeout(padTimer.current);
    padTimer.current = setTimeout(() => setActivePad(null), 140);
  }
  async function copyPattern() {
    const code = `Rythum Pulse | ${bpm} BPM | ${voices.map(([key]) => `${key}: ${grid[key].join('')}`).join(' | ')}`;
    try { await navigator.clipboard.writeText(code); setNotice('Pattern copied to clipboard.'); }
    catch { setNotice(`Copy unavailable. Your pattern: ${code}`); }
  }
  return <section id="pulse-lab" className="section instrument-section"><div className="shell">
    <div className="section-heading"><div><p className="eyebrow">Make a little noise</p><h2>The Pulse Lab.</h2></div><p className="section-note">Start with a groove. Make it yours.<br />Tap the pads or edit the eight-step pattern.</p></div>
    <div className="instrument">
      <div className="instrument-top"><div className="drum-pads">{voices.map(([key, name, syllable, play]) => <button className={`drum-pad ${activePad === key ? 'pad-active' : ''}`} key={key} onClick={() => pad(key, play)}><span>{name}</span><small>{syllable}</small></button>)}</div><div className="preset-controls"><span>Start with a pattern</span><div>{Object.keys(presets).map(name => <button key={name} aria-pressed={preset === name} onClick={() => { setGrid(presets[name]); setBpm(presets[name].bpm); setPreset(name); }}>{name}</button>)}</div></div></div>
      <div className="sequencer-controls"><button className="button button-solid" onClick={togglePlayback} aria-pressed={playing}>{playing ? <Square size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}{playing ? 'Stop' : 'Play groove'}</button><label className="tempo-control">Tempo<input type="range" min="75" max="145" value={bpm} onChange={e => setBpm(Number(e.target.value))} /><output>{bpm} BPM</output></label><button className="text-link" onClick={tapTempo}>Tap tempo</button></div>
      <div className="sequencer-scroll"><div className="sequencer"><div className="step-numbers"><span />{Array.from({length: 8}, (_, i) => <span className={step === i ? 'current-number' : ''} key={i}>{i + 1}</span>)}</div>{voices.map(([key, name]) => <div className="sequence-row" key={key}><span className="voice-name">{name}</span>{grid[key].map((active, i) => <button className={`step ${active ? 'step-on' : ''} ${step === i ? 'step-current' : ''}`} aria-label={`${name} step ${i + 1}`} aria-pressed={Boolean(active)} onClick={() => changeCell(key, i)} key={i} />)}</div>)}</div></div>
      <div className="instrument-footer"><div><button className="text-link" onClick={() => { setPreset(''); setGrid(Object.fromEntries(voices.map(([key]) => [key, Array.from({length: 8}, () => Number(Math.random() > .55))]))); }}><Shuffle size={15} />Randomize</button><button className="text-link" onClick={() => { setPreset(''); setGrid(Object.fromEntries(voices.map(([key]) => [key, Array(8).fill(0)]))); }}><RotateCcw size={15} />Clear</button></div><button className="text-link" onClick={copyPattern}><Copy size={15} />Copy pattern</button></div><p className="instrument-notice" role="status">{notice}</p>
    </div>
  </div></section>;
}
