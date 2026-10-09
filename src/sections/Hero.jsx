import React, { useState } from 'react';
import { Play, ArrowDown, Sparkles, MapPin, Radio } from 'lucide-react';

export const Hero = ({ onOpenShowreel }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0D0A08]">
      {/* Fullscreen Video Background */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-70 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          <source src="/videos/WhatsApp%20Video%202026-10-08%20at%2020.03.54.mp4" type="video/mp4" />
        </video>

        {/* Cinematic Vignette & Color Grade Overlays (Martin Garrix Style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A08] via-[#0D0A08]/50 to-[#0D0A08]/70" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#0D0A08]/40 to-[#0D0A08] mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#4A0E0E]/15 mix-blend-color-burn" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col items-center text-center">
        {/* Eyebrow / Category Tag */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#140F0D]/80 border border-[#D9A441]/40 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(217,164,65,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-ping" />
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase">
            SINGER · COMPOSER · AUDIO ENGINEER
          </span>
        </div>

        {/* Monumental Display Title (Martin Garrix Scale) */}
        <div className="relative select-none my-2 sm:my-4">
          <h1 className="text-[15vw] sm:text-[14vw] md:text-[13vw] font-display font-black tracking-tight leading-[0.88] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F5EFE4] to-[#B0A798] drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] uppercase">
            RYTHUM
          </h1>
          <div className="flex items-center justify-center -mt-2 sm:-mt-6">
            <span className="font-serif italic font-normal text-3xl sm:text-5xl md:text-6xl text-[#D9A441] tracking-wide drop-shadow-[0_4px_12px_rgba(217,164,65,0.3)]">
              Shastri
            </span>
          </div>
        </div>

        {/* Artist Line */}
        <p className="max-w-2xl text-sm sm:text-lg md:text-xl font-body text-[#F5EFE4]/85 tracking-wide mt-4 mb-8 font-light leading-relaxed">
          &ldquo;His parents didn’t give him a stage name. <span className="text-[#D9A441] font-medium">They gave him a destiny.</span>&rdquo;
        </p>

        {/* Primary Call-to-Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12">
          {/* Watch Showreel Lightbox Trigger */}
          <button
            onClick={onOpenShowreel}
            className="group inline-flex items-center space-x-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#D9A441] hover:bg-[#F3CA6D] text-[#0D0A08] font-display font-extrabold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(217,164,65,0.35)] cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-[#0D0A08] flex items-center justify-center text-[#D9A441] group-hover:scale-110 transition-transform">
              <Play size={12} fill="#D9A441" className="ml-0.5" />
            </div>
            <span>WATCH SHOWREEL</span>
          </button>

          {/* Scroll down to Pulse Lab */}
          <a
            href="#pulse-lab"
            className="inline-flex items-center space-x-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-[#140F0D]/80 hover:bg-[#281D18] border border-[#D9A441]/40 text-[#F5EFE4] font-display font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 hover:border-[#D9A441] hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            <Radio size={16} className="text-[#D9A441]" />
            <span>ENTER THE PULSE</span>
          </a>

          {/* Direct Tour Jump */}
          <a
            href="#tour"
            className="inline-flex items-center space-x-2 px-5 py-3.5 sm:py-4 rounded-full bg-[#4A0E0E]/40 hover:bg-[#4A0E0E]/70 border border-[#C1272D]/50 text-[#F5EFE4] font-display font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-ping" />
            <span>TOUR DATES</span>
          </a>
        </div>

        {/* Live Proof Chips / Stat Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl pt-4 border-t border-[#281D18]/80">
          <div className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-[#140F0D]/60 border border-[#281D18] backdrop-blur-sm">
            <Sparkles size={14} className="text-[#D9A441]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5EFE4]/90 uppercase">
              500+ STAGES WORLDWIDE
            </span>
          </div>

          <div className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-[#140F0D]/60 border border-[#281D18] backdrop-blur-sm">
            <span className="text-sm font-bold text-[#D9A441]">04</span>
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5EFE4]/90 uppercase">
              COUNTRIES HEADLINED
            </span>
          </div>

          <div className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-[#140F0D]/60 border border-[#281D18] backdrop-blur-sm">
            <MapPin size={14} className="text-[#C1272D]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5EFE4]/90 uppercase">
              OCT 9–19: HOUSTON RESIDENCY
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center space-y-1 text-[#F5EFE4]/40 hover:text-[#D9A441] transition-colors pointer-events-none">
        <span className="text-[10px] font-mono tracking-widest uppercase">SCROLL TO EXPERIENCE</span>
        <ArrowDown size={14} className="animate-bounce text-[#D9A441]" />
      </div>
    </section>
  );
};

export default Hero;
