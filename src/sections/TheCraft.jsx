import React from 'react';
import { Sliders, Mic2, Award, Headphones, Disc, Sparkles } from 'lucide-react';

export const TheCraft = () => {
  return (
    <section id="craft" className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-ping" />
            <span>THE DUAL MASTERY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-[#F5EFE4] uppercase tracking-tight">
            THE CRAFT
          </h2>
          <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-[#D9A441] mt-3 leading-relaxed">
            &ldquo;He learned surrender from the gharanas and signal flow from the studio console.&rdquo;
          </p>
          <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/60 mt-3 max-w-xl mx-auto">
            His sound is what happens when 500 years of vocal devotion meets state-of-the-art acoustic physics in one artist.
          </p>
        </div>

        {/* Split Editorial Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Panel: Classical Gharana Pedigree */}
          <div className="relative bg-[#140F0D] border border-[#281D18] rounded-2xl p-8 sm:p-10 flex flex-col justify-between overflow-hidden group hover:border-[#D9A441]/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4A0E0E]/20 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-xl bg-[#0D0A08] border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441]">
                  <Mic2 size={24} />
                </div>
                <span className="text-xs font-mono text-[#D9A441] font-bold tracking-widest uppercase">
                  DISCIPLINES OF DEVOTION
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-[#F5EFE4] mb-3">
                CLASSICAL HERITAGE &amp; GHARANA LINEAGE
              </h3>
              <p className="text-sm font-serif italic text-[#D9A441] mb-6">
                Patiala · Kirana · Bhendi Bazaar traditions
              </p>

              <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/70 leading-relaxed mb-6">
                Trained through rigorous discipleship under the masters of three legendary Indian classical gharanas.
                From intricate taans and micro-tonal meend to the devotional surrender of Sufi poetry, his vocal technique
                carries an unbroken chain of musical spirituality.
              </p>

              <div className="space-y-3 pt-6 border-t border-[#281D18]">
                <div className="flex items-start space-x-3 text-xs font-body text-[#F5EFE4]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] mt-1.5 flex-shrink-0" />
                  <span><strong>Microtonal Nuance:</strong> Mastering shrutis and complex ragas with effortless pitch control.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-body text-[#F5EFE4]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] mt-1.5 flex-shrink-0" />
                  <span><strong>Rhythmic Improvisation:</strong> Complex layakaari, tihais, and cross-rhythm dhol cadence.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-body text-[#F5EFE4]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] mt-1.5 flex-shrink-0" />
                  <span><strong>Sufi Depth:</strong> Emotional resonance passed down through ancestral vocal heritage.</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#281D18] flex items-center justify-between text-[11px] font-mono text-[#D9A441]">
              <span>ANCIENT FOUNDATION</span>
              <span>500-YEAR ROOTS</span>
            </div>
          </div>

          {/* Right Panel: Audio Engineering & Production */}
          <div className="relative bg-[#140F0D] border border-[#281D18] rounded-2xl p-8 sm:p-10 flex flex-col justify-between overflow-hidden group hover:border-[#D9A441]/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D9A441]/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-xl bg-[#0D0A08] border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441]">
                  <Sliders size={24} />
                </div>
                <span className="text-xs font-mono text-[#D9A441] font-bold tracking-widest uppercase">
                  SONIC ARCHITECTURE
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-[#F5EFE4] mb-3">
                AUDIO ENGINEERING &amp; PRODUCTION CRAFT
              </h3>
              <p className="text-sm font-serif italic text-[#D9A441] mb-6">
                Musicians Institute Graduate · Dean&apos;s List Honors
              </p>

              <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/70 leading-relaxed mb-6">
                Mentored directly by Grammy-winning audio engineers and mixing legends. Rythum does not outsource his sound:
                he composes, arranges, records, mixes, and masters his own records, designing every transient and low-end sub frequency
                with surgical precision.
              </p>

              <div className="space-y-3 pt-6 border-t border-[#281D18]">
                <div className="flex items-start space-x-3 text-xs font-body text-[#F5EFE4]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] mt-1.5 flex-shrink-0" />
                  <span><strong>Full Signal-Chain Mastery:</strong> Analog outboard processing, modern digital modeling, and acoustics.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-body text-[#F5EFE4]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] mt-1.5 flex-shrink-0" />
                  <span><strong>Low-End Engineering:</strong> Custom 808/sub-bass synthesis engineered to rattle arena sound systems.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-body text-[#F5EFE4]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] mt-1.5 flex-shrink-0" />
                  <span><strong>Independent Vision:</strong> Self-sung, self-produced, self-mixed, and self-mastered releases.</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#281D18] flex items-center justify-between text-[11px] font-mono text-[#D9A441]">
              <span>MODERN ARCHITECTURE</span>
              <span>GRAMMY-MENTORED CRAFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheCraft;
