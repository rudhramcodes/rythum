import React from 'react';
import { ArrowUp, Heart, ArrowUpRight } from 'lucide-react';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#0D0A08] border-t border-[#281D18] py-16 text-[#F5EFE4] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-14 border-b border-[#281D18]">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-[#140F0D] border border-[#D9A441]/40 flex items-center justify-center font-display font-black text-sm text-[#D9A441]">
                RS
              </div>
              <span className="font-display font-black text-xl tracking-tight text-[#F5EFE4] uppercase">
                RYTHUM SHASTRI
              </span>
            </div>
            <p className="max-w-md text-xs sm:text-sm font-body text-[#F5EFE4]/60 leading-relaxed font-light">
              Indian classical heritage electrified by modern audio engineering. Carrying centuries of vocal devotion onto festival stages across the globe.
            </p>
            <div className="text-xs font-mono text-[#D9A441] pt-2">
              MANAGEMENT: <a href="mailto:notyourshastri@gmail.com" className="hover:underline">notyourshastri@gmail.com</a>
            </div>
          </div>

          {/* Quick Nav Col */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D9A441] mb-4">
              EXPERIENCE
            </h4>
            <ul className="space-y-2.5 text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70">
              <li>
                <a href="#tour" className="hover:text-[#D9A441] transition-colors">Tour Dates</a>
              </li>
              <li>
                <a href="#pulse-lab" className="hover:text-[#D9A441] transition-colors">The Pulse Lab</a>
              </li>
              <li>
                <a href="#music" className="hover:text-[#D9A441] transition-colors">Sound Chapters</a>
              </li>
              <li>
                <a href="#craft" className="hover:text-[#D9A441] transition-colors">The Craft</a>
              </li>
              <li>
                <a href="#videos" className="hover:text-[#D9A441] transition-colors">Showreel &amp; BTS</a>
              </li>
              <li>
                <a href="#legacy" className="hover:text-[#D9A441] transition-colors">Legacy</a>
              </li>
            </ul>
          </div>

          {/* Channels Col */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D9A441] mb-4">
              NETWORK
            </h4>
            <ul className="space-y-2.5 text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70">
              <li>
                <a href="https://instagram.com/rythum_shastri" target="_blank" rel="noopener noreferrer" className="hover:text-[#D9A441] transition-colors flex items-center gap-1">
                  Instagram <ArrowUpRight size={11} />
                </a>
              </li>
              <li>
                <a href="https://facebook.com/rythumshastri" target="_blank" rel="noopener noreferrer" className="hover:text-[#D9A441] transition-colors flex items-center gap-1">
                  Facebook <ArrowUpRight size={11} />
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@rythumshastri1963" target="_blank" rel="noopener noreferrer" className="hover:text-[#D9A441] transition-colors flex items-center gap-1">
                  YouTube <ArrowUpRight size={11} />
                </a>
              </li>
              <li>
                <a href="https://music.apple.com/us/artist/rythum-shastri/1640653195" target="_blank" rel="noopener noreferrer" className="hover:text-[#D9A441] transition-colors flex items-center gap-1">
                  Apple Music <ArrowUpRight size={11} />
                </a>
              </li>
              <li>
                <a href="https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol" target="_blank" rel="noopener noreferrer" className="hover:text-[#D9A441] transition-colors flex items-center gap-1">
                  Spotify <ArrowUpRight size={11} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#F5EFE4]/50 gap-4">
          <div>
            © 2026 RYTHUM SHASTRI · ALL RIGHTS RESERVED.
          </div>

          <div className="font-serif italic text-sm text-[#D9A441]">
            &ldquo;Made to a beat.&rdquo;
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center space-x-1 hover:text-[#D9A441] transition-colors cursor-pointer uppercase"
          >
            <span>BACK TO TOP</span>
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
