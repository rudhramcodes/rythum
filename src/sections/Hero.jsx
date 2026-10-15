import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './hero.css';

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ onOpenShowreel }) {
  const containerRef = useRef(null);
  const pinnedRef = useRef(null);
  const introRef = useRef(null);
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const captionRef = useRef(null);

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  // Autoplay and motion handling
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play().catch(() => {
        setPlaying(false);
      });
    }
  }, []);

  // GSAP Scroll-to-Expand Timeline
  useEffect(() => {
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (!containerRef.current || !pinnedRef.current || !frameRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=125%',
          pin: pinnedRef.current,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Text intro fades out and glides upward
      tl.to(introRef.current, {
        y: -65,
        opacity: 0,
        scale: 0.96,
        duration: 0.45,
        ease: 'power1.out',
      }, 0);

      // 2. Video Frame smoothly expands to full-bleed viewport
      tl.to(frameRef.current, {
        top: '50%',
        width: '100vw',
        height: '100vh',
        borderRadius: '0px',
        borderWidth: '0px',
        boxShadow: 'none',
        duration: 0.8,
        ease: 'power2.inOut',
      }, 0.12);

      // 3. Cinema caption reveals as the video becomes full screen
      tl.fromTo(
        captionRef.current,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        0.65
      );
    });

    return () => media.revert();
  }, []);

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !muted;
    videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted && !playing) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <section id="home" ref={containerRef} className="hero-scroll-wrap">
      <div ref={pinnedRef} className="hero-pinned-stage">
        {/* Ambient Glow */}
        <div className="hero-ambient-glow" aria-hidden="true" />

        {/* Top Intro Section */}
        <div ref={introRef} className="hero-intro">
          {/* <div className="hero-live-pill">
            <span className="hero-live-dot" />
            <span className="hero-live-label">Live Stage Reel · Concert Tour</span>
          </div> */}
          <h1 className="hero-title">
            RYTHUM<br />SHASTRI<span>.</span>
          </h1>
          <p className="hero-tagline">
            Indian classical roots. A sound made for the global stage.
          </p>
          <div className="hero-actions-row">
            <button
              type="button"
              className="button button-solid"
              onClick={onOpenShowreel}
            >
              <Play size={16} fill="currentColor" /> Watch showreel
            </button>
            <a className="text-link" href="#music">
              Listen to the music <ArrowUpRight size={18} />
            </a>
          </div>
        </div>

        {/* Expanding Cinematic Video Frame */}
        <div ref={frameRef} className="hero-video-frame">
          <video
            ref={videoRef}
            className="hero-video-element"
            loop
            muted={muted}
            playsInline
            autoPlay
            preload="auto"
            aria-label="Rythum Shastri performing live on stage"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>

          <div className="hero-video-shade" aria-hidden="true" />

          {/* Floating Controls Bar on the Frame (Left: Play/Pause, Right: Sound Toggle) */}
          <div className="hero-frame-bar">
            <button
              type="button"
              className="hero-play-pause"
              onClick={togglePlay}
              aria-label={playing ? 'Pause video' : 'Play video'}
            >
              {playing ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: '2px' }} />}
            </button>

            <button
              type="button"
              className="hero-sound-toggle"
              onClick={toggleSound}
              aria-label={muted ? 'Turn sound on' : 'Mute video'}
            >
              {muted ? (
                <>
                  <VolumeX size={16} />
                  <span>Sound On</span>
                </>
              ) : (
                <>
                  <div className="sound-wave is-live" aria-hidden="true">
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                  </div>
                  <span>Live Audio</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Full-bleed Cinema Caption (reveals when scrolled to 100%) */}
        <div ref={captionRef} className="hero-cinema-caption">
          <h2>Pure Live Stage Energy.</h2>
          <p>Bridging timeless Indian classical roots with high-voltage modern production.</p>
          <div className="hero-scroll-prompt">
            <span>Scroll to explore</span> ↓
          </div>
        </div>
      </div>
    </section>
  );
}
