import React from 'react';
import { Heart, Sparkles, Music4 } from 'lucide-react';

export const Legacy = () => {
  return (
    <section id="legacy" className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-[#140F0D] border border-[#281D18] rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-b from-[#4A0E0E]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Top Tag */}
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-6">
            <Sparkles size={14} className="text-[#D9A441]" />
            <span>THE SHASTRI PARAMPARA · FAMILY LINEAGE</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl font-display font-black text-[#F5EFE4] uppercase tracking-tight mb-4">
            BEFORE RYTHUM, THERE WAS BHAVIN
          </h2>

          <p className="font-serif italic text-xl sm:text-2xl text-[#D9A441] mb-8">
            The &ldquo;Shahenshah-e-Sufism&rdquo; and an unbroken musical inheritance.
          </p>

          <div className="space-y-6 text-sm sm:text-base font-body text-[#F5EFE4]/80 leading-relaxed font-light">
            <p>
              Long before synthesizers, DAWs, and arena sound systems entered Rythum&apos;s world, his home resonated with the tanpura and the soul-stirring hymns of his father, <strong>Bhavin Shastri</strong>.
              Celebrated internationally as the <em>&ldquo;Shahenshah-e-Sufism&rdquo;</em>, Bhavin ji has graced more than <strong>4,000 stages worldwide</strong> and lent his voice to legendary cinematic playback tracks, including <em>&ldquo;O Rahi&rdquo;</em> from the Bollywood film <em>Maanjhi</em>.
            </p>

            <p className="text-[#F5EFE4]/90 border-l-2 border-[#D9A441] pl-4 sm:pl-6 py-1 italic font-serif text-base sm:text-lg text-[#F5EFE4]">
              &ldquo;The son learned devotion at home and discipline behind the mixing console. His music is not a rebellion against tradition — it is tradition electrified.&rdquo;
            </p>

            <p>
              Father and son have shared historic stages together, including their landmark joint patriotic release <em>&ldquo;Atmanirbhar Bharat&rdquo;</em> (2020) and their unforgettable live collaborative performance <em>&ldquo;Ehsaas&rdquo;</em> (2024).
            </p>
          </div>

          {/* Milestone Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-[#281D18]">
            <div className="p-4 rounded-xl bg-[#0D0A08] border border-[#281D18]">
              <span className="text-xl sm:text-2xl font-display font-black text-[#D9A441]">4,000+</span>
              <p className="text-[11px] font-mono text-[#F5EFE4]/60 uppercase mt-1">
                Performances by Bhavin Shastri
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D0A08] border border-[#281D18]">
              <span className="text-xl sm:text-2xl font-display font-black text-[#D9A441]">MAANJHI</span>
              <p className="text-[11px] font-mono text-[#F5EFE4]/60 uppercase mt-1">
                Bollywood Playback &lsquo;O Rahi&rsquo;
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D0A08] border border-[#281D18]">
              <span className="text-xl sm:text-2xl font-display font-black text-[#D9A441]">EHSAAS</span>
              <p className="text-[11px] font-mono text-[#F5EFE4]/60 uppercase mt-1">
                Father &amp; Son Collaboration
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Legacy;
