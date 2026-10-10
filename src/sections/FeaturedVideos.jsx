import { Play, ArrowUpRight } from 'lucide-react';
const videos = [
  ['55dn5BEVhCM', 'Making Qaboo', 'Behind the scenes'],
  ['dijYlnENNqE', 'Pehla Pyaar', 'Acoustic session'],
  ['fXVsMUTegew', 'Sarkari Tune', 'Folk & garba'],
];
export default function FeaturedVideos({ onPlayVideo }) {
  return <section id="videos" className="section shell">
    <div className="section-heading"><div><p className="eyebrow">Watch</p><h2>In performance.<br />In the studio.</h2></div><a className="text-link" href="https://www.youtube.com/@rythumshastri1963" target="_blank" rel="noreferrer">YouTube channel <ArrowUpRight size={18} /></a></div>
    <div className="video-grid">{videos.map(([id, title, category], index) => <button className={`video-item ${index === 0 ? 'video-featured' : ''}`} key={id} onClick={() => onPlayVideo(id, title)} aria-label={`Watch ${title}`}><div className="thumbnail"><img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" width="480" height="360" /><span className="play-icon"><Play size={21} fill="currentColor" /></span></div><div className="video-caption"><div><p>{category}</p><h3>{title}</h3></div><ArrowUpRight size={20} /></div></button>)}</div>
  </section>;
}
