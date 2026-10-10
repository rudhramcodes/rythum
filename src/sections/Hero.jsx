import { useRef, useState, useEffect } from 'react';
import { Play, Pause, ArrowUpRight } from 'lucide-react';
export default function Hero({ onOpenShowreel }) {
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { if (media.matches) video.current?.pause(); else video.current?.play().catch(() => {}); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return <section id="home" className="hero">
    <video ref={video} className="hero-video" loop muted playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label="Rythum Shastri performing live"><source src="/videos/hero.mp4" type="video/mp4" /></video>
    <div className="hero-shade" />
    <div className="hero-content shell">
      <p className="eyebrow">Singer. Composer. Audio engineer.</p>
      <h1>RYTHUM<br />SHASTRI<span>.</span></h1>
      <div className="hero-bottom">
        <p>Indian classical roots.<br />A sound made for the stage.</p>
        <div className="hero-actions"><button className="button button-solid" onClick={onOpenShowreel}><Play size={16} fill="currentColor" /> Watch showreel</button><a className="text-link" href="#music">Listen to the music <ArrowUpRight size={18} /></a></div>
      </div>
    </div>
    <button className="video-control" aria-label={playing ? 'Pause background video' : 'Play background video'} onClick={() => { if (playing) video.current.pause(); else video.current.play().catch(() => {}); }}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
  </section>;
}
