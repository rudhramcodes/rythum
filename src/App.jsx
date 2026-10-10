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

export default function App() {
  const [video, setVideo] = useState(null);
  const playVideo = (videoId, title) => setVideo({ videoId, title });
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Navigation />
    <main id="main">
      <Hero onOpenShowreel={() => playVideo('TDS7PG7SzGs', 'Rythum Shastri · Showreel')} />
      <MusicChapters />
      <FeaturedVideos onPlayVideo={playVideo} />
      <TourLive />
      <TheCraft />
      <PulseLab />
      <Legacy />
      <TheCircle />
      <BookingContact />
    </main>
    <Footer />
    <VideoModal isOpen={Boolean(video)} onClose={() => setVideo(null)} videoId={video?.videoId} title={video?.title} />
  </>;
}
