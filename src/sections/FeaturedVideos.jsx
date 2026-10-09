import React from 'react';
import { Play, Video, Sparkles, ArrowUpRight } from 'lucide-react';

export const FeaturedVideos = ({ onPlayVideo }) => {
  const videos = [
    {
      id: '55dn5BEVhCM',
      title: 'BEHIND THE SCENES · QABOO',
      subtitle: 'Official Single · In The Studio & On Set',
      description: 'Exclusive look inside the composition and visual filming of Qaboo with Riday and the creative team.',
      tag: 'BEHIND THE SCENES',
      views: 'VERIFIED RELEASE',
    },
    {
      id: 'dijYlnENNqE',
      title: 'PEHLA PYAAR · ACOUSTIC VOCAL',
      subtitle: 'Intimate Vocal Interpretation',
      description: 'Stripped-back vocal session highlighting classical nuances, breath control, and emotional storytelling.',
      tag: 'ACOUSTIC SESSION',
      views: 'SPECIAL PERFORMANCE',
    },
    {
      id: 'fXVsMUTegew',
      title: 'SARKARI TUNE · FOLK GARBA ANTHEM',
      subtitle: 'Festive High-Energy Live Arrangement',
      description: 'The viral folk arrangement that ignited dancefloors and cultural festivals across North America.',
      tag: 'FESTIVAL ANTHEM',
      views: '277K+ VIEWS',
    },
  ];

  return (
    <section id="videos" className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 border-b border-[#281D18] pb-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-3">
              <Video size={14} className="text-[#D9A441]" />
              <span>OFFICIAL CINEMATIC VAULT</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-[#F5EFE4] uppercase tracking-tight">
              PERFORMANCES &amp; BTS
            </h2>
            <p className="font-serif italic text-lg sm:text-2xl text-[#D9A441] mt-1">
              Live anthems, intimate sessions, and studio process.
            </p>
          </div>

          <a
            href="https://www.youtube.com/@rythumshastri1963"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 md:mt-0 inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border border-[#D9A441]/40 bg-[#140F0D] hover:bg-[#D9A441] hover:text-[#0D0A08] text-[#F5EFE4] font-mono text-xs font-bold uppercase tracking-wider transition-all"
          >
            <span>YOUTUBE CHANNEL</span>
            <ArrowUpRight size={13} />
          </a>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-[#140F0D] border border-[#281D18] rounded-2xl overflow-hidden group hover:border-[#D9A441]/50 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => onPlayVideo(vid.id, vid.title)}
                className="relative aspect-video w-full bg-[#0D0A08] cursor-pointer overflow-hidden group"
              >
                <img
                  src={`https://img.youtube.com/vi/${vid.id}/hqdefault.jpg`}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#140F0D] via-transparent to-black/30" />

                {/* Center Play Button (Martin Garrix style) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#D9A441] text-[#0D0A08] flex items-center justify-center shadow-[0_0_25px_rgba(217,164,65,0.6)] group-hover:scale-115 transition-transform">
                    <Play size={20} fill="#0D0A08" className="ml-1" />
                  </div>
                </div>

                {/* Top Badge */}
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded bg-[#0D0A08]/85 border border-[#D9A441]/30 text-[#D9A441] uppercase">
                    {vid.tag}
                  </span>
                </div>

                {/* Bottom View Count */}
                <div className="absolute bottom-3 right-3 text-[10px] font-mono font-bold text-[#F5EFE4]/80 bg-[#0D0A08]/80 px-2 py-0.5 rounded">
                  {vid.views}
                </div>
              </div>

              {/* Text Information */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-lg font-display font-bold uppercase text-[#F5EFE4] group-hover:text-[#D9A441] transition-colors mb-1">
                    {vid.title}
                  </h3>
                  <p className="text-xs font-serif italic text-[#D9A441] mb-3">
                    {vid.subtitle}
                  </p>
                  <p className="text-xs font-body text-[#F5EFE4]/60 leading-relaxed mb-6">
                    {vid.description}
                  </p>
                </div>

                <button
                  onClick={() => onPlayVideo(vid.id, vid.title)}
                  className="inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-[#D9A441] hover:text-[#F3CA6D] transition-colors cursor-pointer"
                >
                  <Play size={12} fill="currentColor" />
                  <span>PLAY VIDEO IN CINEMA MODE</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedVideos;
