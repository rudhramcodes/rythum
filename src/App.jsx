import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Navigation from './components/Navigation';
import Preloader from './components/Preloader';
import CustomCursor from './components/CustomCursor';
import VideoModal from './components/VideoModal';
import Footer from './components/Footer';

import Hero from './sections/Hero';
import TourLive from './sections/TourLive';
import PulseLab from './sections/PulseLab';
import MusicChapters from './sections/MusicChapters';
import TheCraft from './sections/TheCraft';
import FeaturedVideos from './sections/FeaturedVideos';
import Legacy from './sections/Legacy';
import HonorsMarquee from './sections/HonorsMarquee';
import TheCircle from './sections/TheCircle';
import BookingContact from './sections/BookingContact';

export const App = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(true);
  const [videoModal, setVideoModal] = useState({
    isOpen: false,
    videoId: '',
    title: '',
  });

  // Smooth scroll with Lenis
  useEffect(() => {
    let lenisInstance = null;
    let rafId = null;

    try {
      lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      const raf = (time) => {
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis smooth scroll initialization skipped', e);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance) lenisInstance.destroy();
    };
  }, []);

  const openShowreel = () => {
    setVideoModal({
      isOpen: true,
      videoId: 'TDS7PG7SzGs',
      title: 'Rythum Shastri · Official Showreel',
    });
  };

  const handlePlayVideo = (videoId, title) => {
    setVideoModal({
      isOpen: true,
      videoId,
      title,
    });
  };

  const handleCloseVideo = () => {
    setVideoModal((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleAudio = () => {
    setIsAudioActive((prev) => !prev);
  };

  return (
    <div className="relative min-h-screen bg-[#0D0A08] text-[#F5EFE4] selection:bg-[#D9A441] selection:text-[#0D0A08]">
      {/* Film Grain Texture Overlay */}
      <div className="film-grain" />

      {/* Desktop Custom Cursor */}
      <CustomCursor />

      {/* Preloader Entrance Ritual */}
      {!hasEntered && (
        <Preloader onEnter={() => setHasEntered(true)} />
      )}

      {/* Lightbox Video Modal */}
      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={handleCloseVideo}
        videoId={videoModal.videoId}
        title={videoModal.title}
      />

      {/* Top Navbar & Menu */}
      <Navigation
        isAudioActive={isAudioActive}
        toggleAudio={toggleAudio}
      />

      {/* Main Sections Hierarchy */}
      <main>
        {/* 01 Hero with Fullscreen Looping Muted Video */}
        <Hero onOpenShowreel={openShowreel} />

        {/* 02 Tour / Live Residency Dates (Houston Live Highlight) */}
        <TourLive />

        {/* 03 The Pulse Lab (WebAudio Dhol Sequencer & Visualizer) */}
        <PulseLab />

        {/* 04 Sound Chapters & Verified Spotify Embed */}
        <MusicChapters />

        {/* 05 The Craft (Classical Heritage vs Audio Engineering) */}
        <TheCraft />

        {/* 06 Performances & BTS Vault */}
        <FeaturedVideos onPlayVideo={handlePlayVideo} />

        {/* 07 Honors Marquee Ticker */}
        <HonorsMarquee />

        {/* 08 Legacy (Bhavin Shastri & Lineage) */}
        <Legacy />

        {/* 09 The Circle (VIP Community & Newsletter) */}
        <TheCircle />

        {/* 10 Booking Desk & Inquiries */}
        <BookingContact />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;