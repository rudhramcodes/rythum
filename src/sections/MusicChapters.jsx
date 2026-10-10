import { ArrowUpRight } from 'lucide-react';
const spotify = 'https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol';
const releases = [
  ['Soor Shakti', '2022', 'Folk & garba', 'Traditional melodies and garba arrangements.', spotify],
  ['Gambit', '2024', 'Techno fusion', 'Indian vocals meet electronic production, with Ridáy.', spotify],
  ['Qaboo', '2024', 'Contemporary', 'Co-written and co-composed by Rythum Shastri.', 'https://music.apple.com/us/artist/rythum-shastri/1640653195'],
];
export default function MusicChapters() {
  return <section id="music" className="section shell">
    <div className="section-heading"><div><p className="eyebrow">Selected releases</p><h2>The music.</h2></div><a className="text-link" href={spotify} target="_blank" rel="noreferrer">All music on Spotify <ArrowUpRight size={18} /></a></div>
    <div className="music-layout"><div className="release-list">{releases.map(([title, year, genre, description, url]) => <a className="release-row" href={url} target="_blank" rel="noreferrer" key={title}><div className="release-meta"><span>{genre}</span><span>{year}</span></div><div className="release-title"><h3>{title}</h3><ArrowUpRight size={25} /></div><p>{description}</p></a>)}</div><div className="spotify-player"><iframe src="https://open.spotify.com/embed/artist/7Aht2xRvnv83wSBOYg3Bol?theme=0" width="100%" height="452" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Listen to Rythum Shastri on Spotify" /><p>Listen here, or open your streaming app.</p></div></div>
  </section>;
}
