import React, { useState } from 'react';
import { Disc3, ExternalLink, Play, Radio, Music, ArrowUpRight } from 'lucide-react';

export const MusicChapters = () => {
  const [activeTab, setActiveTab] = useState(0);

  const chapters = [
    {
      chapterNumber: '01',
      title: 'ROOTS',
      project: 'Soor Shakti',
      year: '2022',
      tagline: 'Seven-track traditional folk & garba collection',
      description:
        'Self-released with a singular mission: bringing traditional folk melodies and ancestral rhythm to the youth living thousands of miles across oceans.',
      tracks: ['Mor Bani Thangat Kare', 'Dhuni Re Dhakavi', 'Dakla', 'Aarti & Thaal Arrangements'],
      badge: 'TRADITIONAL FOLK',
      accentColor: '#D9A441',
      links: [
        { label: 'Listen on Spotify', url: 'https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol' },
        { label: 'Gaana Stream', url: 'https://gaana.com/artist/rythum-shastri' },
      ],
    },
    {
      chapterNumber: '02',
      title: 'COLLISION',
      project: 'Gambit',
      year: '2024',
      tagline: '127 BPM Techno Fusion with Ridáy',
      description:
        'Signed to JD Records. A ferocious sonic collision of Indian classical vocal agility and subterranean European techno synthesis.',
      tracks: ['Gambit (feat. Rythum Shastri)', 'Checkmate (Club Edit)', '127 BPM Vocal stems'],
      badge: 'TECHNO FUSION',
      accentColor: '#FFFFFF',
      links: [
        { label: 'Listen on Spotify', url: 'https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol' },
        { label: 'Shazam Track', url: 'https://www.shazam.com' },
      ],
    },
    {
      chapterNumber: '03',
      title: 'NOW',
      project: 'Qaboo',
      year: '2024',
      tagline: 'Co-written, Co-composed on Melodious Records',
      description:
        'The definitive modern crossover. Melodic warmth, intricate classical runs, and pristine commercial mixing and mastering performed by Rythum.',
      tracks: ['Qaboo (Original Single)', 'Acoustic Reprise', 'BTS Studio Sessions'],
      badge: 'CONTEMPORARY CROSSOVER',
      accentColor: '#C1272D',
      links: [
        { label: 'Apple Music', url: 'https://music.apple.com/us/artist/rythum-shastri/1640653195' },
        { label: 'Listen on Spotify', url: 'https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol' },
      ],
    },
  ];

  return (
    <section id="music" className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 border-b border-[#281D18] pb-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-3">
              <Disc3 size={14} className="animate-spin text-[#D9A441]" />
              <span>DISCOGRAPHY IN THREE EPISODES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-[#F5EFE4] uppercase tracking-tight">
              SOUND CHAPTERS
            </h2>
            <p className="font-serif italic text-lg sm:text-2xl text-[#D9A441] mt-1">
              Roots. Collision. The modern pulse.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center space-x-3">
            <a
              href="https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#1DB954]/15 hover:bg-[#1DB954] text-[#1DB954] hover:text-[#0D0A08] border border-[#1DB954]/40 font-mono text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Music size={14} />
              <span>FOLLOW ON SPOTIFY</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>

        {/* 3 Chapters Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {chapters.map((ch, idx) => (
            <div
              key={ch.chapterNumber}
              className="bg-[#140F0D] border border-[#281D18] hover:border-[#D9A441]/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl group"
            >
              <div>
                {/* Chapter Meta */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#D9A441] font-bold tracking-widest">
                    CHAPTER {ch.chapterNumber}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-[#281D18] bg-[#0D0A08] text-[#F5EFE4]/60">
                    {ch.year}
                  </span>
                </div>

                {/* Chapter Name & Project */}
                <h3 className="text-2xl sm:text-3xl font-display font-black text-[#F5EFE4] uppercase group-hover:text-[#D9A441] transition-colors">
                  {ch.title}
                </h3>
                <h4 className="text-lg font-serif italic text-[#D9A441] mb-3">
                  {ch.project}
                </h4>

                <p className="text-xs font-mono text-[#F5EFE4]/70 mb-4 uppercase tracking-wider">
                  {ch.tagline}
                </p>

                <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/60 leading-relaxed mb-6">
                  {ch.description}
                </p>

                {/* Key Tracks List */}
                <div className="space-y-2 mb-6 pt-4 border-t border-[#281D18]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5EFE4]/40">
                    KEY SELECTIONS:
                  </span>
                  {ch.tracks.map((track, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-center space-x-2 text-xs font-body text-[#F5EFE4]/80"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441]" />
                      <span>{track}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-4 border-t border-[#281D18] flex flex-wrap gap-2">
                {ch.links.map((link, lIdx) => (
                  <a
                    key={lIdx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md border border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441] text-xs font-mono text-[#F5EFE4]/80 hover:text-[#D9A441] transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight size={11} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Real Verified Spotify Artist Embed */}
        <div className="bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-[#1DB954] animate-ping" />
              <h3 className="text-lg font-display font-extrabold uppercase text-[#F5EFE4] tracking-wide">
                OFFICIAL SPOTIFY ARTIST PLAYER
              </h3>
            </div>
            <span className="text-xs font-mono text-[#F5EFE4]/50">
              VERIFIED STREAMING HUB
            </span>
          </div>

          <div className="relative w-full rounded-xl overflow-hidden bg-black/40 border border-[#281D18]">
            <iframe
              src="https://open.spotify.com/embed/artist/7Aht2xRvnv83wSBOYg3Bol?utm_source=generator&theme=0"
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen=""
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Rythum Shastri on Spotify"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MusicChapters;
