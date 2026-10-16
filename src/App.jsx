import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from './components/Navigation';
import VideoModal from './components/VideoModal';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import TourLive from './sections/TourLive';
import PulseLab from './sections/PulseLab';
import MusicChapters from './sections/MusicChapters';
import TheCraft from './sections/TheCraft';
import FeaturedVideos from './sections/FeaturedVideos';
import Legacy from './sections/Legacy';
import TheCircle from './sections/TheCircle';
import BookingContact from './sections/BookingContact';
import PressPreview from './sections/PressPreview';
import Press from './pages/Press';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [video, setVideo] = useState(null);
  const playVideo = (videoId, title) => setVideo({ videoId, title });
  const isPress = /^\/press\/?$/.test(window.location.pathname);

  useEffect(() => {
    // Respect user's preference for reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp: 0.095, // Snappy, immediate response — zero floaty or sluggish delay
      wheelMultiplier: 1.05, // Crisp, natural scroll distance
      smoothWheel: true,
      syncTouch: false, // Keep native 120fps momentum on phones/touchpads
      autoRaf: false,
    });

    // Synchronize Lenis scroll events with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Keep Lenis RAF inside GSAP ticker for unified frame timing
    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Store global instance for modals & program navigation
    window.__lenis = lenis;

    // Smooth scroll for in-page anchors with navbar offset
    const handleAnchorClick = (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const targetHash = anchor.getAttribute('href');
      if (!targetHash || targetHash === '#') return;
      const targetElement = document.querySelector(targetHash);
      if (targetElement) {
        event.preventDefault();
        lenis.scrollTo(targetElement, { offset: -88, duration: 0.85 });
      }
    };
    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  // Pause Lenis background scrolling when Video modal is open
  useEffect(() => {
    if (!window.__lenis) return;
    if (video) {
      window.__lenis.stop();
    } else {
      window.__lenis.start();
    }
  }, [video]);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Navigation homePrefix={isPress ? '/' : ''} />
    <main id="main">
      {isPress ? <Press /> : <>
      <Hero onOpenShowreel={() => playVideo('TDS7PG7SzGs', 'Rythum Shastri · Showreel')} />
      <MusicChapters />
      <FeaturedVideos onPlayVideo={playVideo} />
      <TourLive />
      <PressPreview />
      <TheCraft />
      <PulseLab />
      <Legacy />
      <TheCircle />
      <BookingContact />
      </>}
    </main>
    <Footer homePrefix={isPress ? '/' : ''} />
    <VideoModal isOpen={Boolean(video)} onClose={() => setVideo(null)} videoId={video?.videoId} title={video?.title} />
  </>;
}
