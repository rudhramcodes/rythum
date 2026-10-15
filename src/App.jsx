import { useState } from 'react';
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

export default function App() {
  const [video, setVideo] = useState(null);
  const playVideo = (videoId, title) => setVideo({ videoId, title });
  const isPress = /^\/press\/?$/.test(window.location.pathname);
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
