import React, { useState, useEffect } from 'react';
import { Menu, X, Volume2, VolumeX, ArrowUpRight, Music2, Calendar, Radio } from 'lucide-react';

export const Navigation = ({ isAudioActive, toggleAudio }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'TOUR DATES', href: '#tour', badge: 'LIVE' },
    { label: 'THE PULSE LAB', href: '#pulse-lab', badge: 'PLAY' },
    { label: 'SOUND CHAPTERS', href: '#music', badge: '3 EPISODES' },
    { label: 'THE CRAFT', href: '#craft' },
    { label: 'SHOWREEL & BTS', href: '#videos' },
    { label: 'LEGACY', href: '#legacy' },
    { label: 'BOOKING & CONTACT', href: '#booking' },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Top Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0D0A08]/90 backdrop-blur-md border-b border-[#281D18] py-3.5 shadow-2xl'
            : 'bg-gradient-to-b from-[#0D0A08]/90 via-[#0D0A08]/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo / Monogram */}
          <a
            href="#"
            className="flex items-center space-x-3 group"
            aria-label="Rythum Shastri Home"
          >
            <div className="w-9 h-9 rounded-sm bg-[#140F0D] border border-[#D9A441]/40 flex items-center justify-center font-display font-black text-sm text-[#D9A441] shadow-[0_0_15px_rgba(217,164,65,0.2)] group-hover:border-[#D9A441] group-hover:scale-105 transition-all">
              RS
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold tracking-widest text-sm text-[#F5EFE4] group-hover:text-[#D9A441] transition-colors uppercase">
                RYTHUM SHASTRI
              </span>
              <span className="text-[9px] tracking-widest uppercase text-[#F5EFE4]/50 font-body">
                SINGER · COMPOSER · ENGINEER
              </span>
            </div>
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-7">
            <a
              href="#tour"
              className="text-xs font-semibold uppercase tracking-wider text-[#F5EFE4]/80 hover:text-[#D9A441] transition-colors flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C1272D] animate-ping" />
              Tour
            </a>
            <a
              href="#pulse-lab"
              className="text-xs font-semibold uppercase tracking-wider text-[#F5EFE4]/80 hover:text-[#D9A441] transition-colors flex items-center gap-1.5"
            >
              <Radio size={12} className="text-[#D9A441]" />
              Pulse Lab
            </a>
            <a
              href="#music"
              className="text-xs font-semibold uppercase tracking-wider text-[#F5EFE4]/80 hover:text-[#D9A441] transition-colors"
            >
              Music
            </a>
            <a
              href="#craft"
              className="text-xs font-semibold uppercase tracking-wider text-[#F5EFE4]/80 hover:text-[#D9A441] transition-colors"
            >
              The Craft
            </a>
            <a
              href="#videos"
              className="text-xs font-semibold uppercase tracking-wider text-[#F5EFE4]/80 hover:text-[#D9A441] transition-colors"
            >
              Videos
            </a>
            <a
              href="#legacy"
              className="text-xs font-semibold uppercase tracking-wider text-[#F5EFE4]/80 hover:text-[#D9A441] transition-colors"
            >
              Legacy
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live City Pill */}
            <a
              href="#tour"
              className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#4A0E0E]/40 border border-[#C1272D]/50 text-[11px] font-semibold text-[#F5EFE4] hover:border-[#D9A441] transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-pulse" />
              <span className="text-[#D9A441] uppercase tracking-wider">ON STAGE: HOUSTON</span>
            </a>

            {/* Audio Synth Toggle */}
            {toggleAudio && (
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-full border transition-all ${
                  isAudioActive
                    ? 'border-[#D9A441] bg-[#D9A441]/10 text-[#D9A441]'
                    : 'border-[#281D18] bg-[#140F0D] text-[#F5EFE4]/60 hover:text-[#F5EFE4]'
                }`}
                title={isAudioActive ? 'Audio Synthesizer Active' : 'Enable Audio'}
                aria-label="Toggle audio engine"
              >
                {isAudioActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            )}

            {/* Booking Button */}
            <a
              href="#booking"
              className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full bg-[#D9A441] text-[#0D0A08] font-bold text-xs tracking-wider uppercase hover:bg-[#F3CA6D] transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(217,164,65,0.25)]"
            >
              BOOK NOW
            </a>

            {/* Martin Garrix Fullscreen Menu Trigger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-md border border-[#D9A441]/50 bg-[#140F0D]/80 hover:bg-[#D9A441] hover:text-[#0D0A08] text-[#F5EFE4] text-xs font-bold uppercase tracking-widest transition-all"
              aria-label="Open menu"
            >
              <Menu size={16} />
              <span className="hidden xs:inline">MENU</span>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Overlay Menu (Martin Garrix Style) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0D0A08] text-[#F5EFE4] flex flex-col justify-between p-6 sm:p-12 overflow-y-auto animate-fadeIn">
          {/* Top Header inside overlay */}
          <div className="flex items-center justify-between border-b border-[#281D18] pb-6">
            <div className="flex items-center space-x-3">
              <span className="font-display font-black text-xl text-[#D9A441]">RS</span>
              <span className="text-xs uppercase tracking-widest text-[#F5EFE4]/60">
                OFFICIAL ARTIST HUB
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full border border-[#D9A441] text-[#D9A441] hover:bg-[#D9A441] hover:text-[#0D0A08] transition-all text-xs font-bold tracking-widest uppercase"
              aria-label="Close menu"
            >
              <X size={16} />
              <span>CLOSE</span>
            </button>
          </div>

          {/* Monumental Navigation Links */}
          <div className="my-auto py-10 flex flex-col space-y-4 sm:space-y-6 max-w-4xl">
            {navLinks.map((link, idx) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="group flex items-center justify-between text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold uppercase tracking-tight text-[#F5EFE4]/90 hover:text-[#D9A441] transition-all hover:translate-x-3"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-xs sm:text-sm font-body text-[#D9A441]/50 group-hover:text-[#D9A441]">
                    0{idx + 1}
                  </span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full border border-[#D9A441]/40 text-[#D9A441] uppercase tracking-wider">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>

          {/* Bottom Bar: Booking & Socials */}
          <div className="border-t border-[#281D18] pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#F5EFE4]/50 mb-1">
                DIRECT MANAGEMENT & BOOKING
              </p>
              <a
                href="mailto:notyourshastri@gmail.com"
                className="text-sm sm:text-base font-bold text-[#D9A441] hover:underline"
              >
                notyourshastri@gmail.com
              </a>
            </div>

            <div className="flex flex-wrap gap-4 md:justify-end text-xs font-semibold uppercase tracking-wider text-[#F5EFE4]/70">
              <a
                href="https://instagram.com/rythum_shastri"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D9A441] flex items-center gap-1"
              >
                Instagram <ArrowUpRight size={12} />
              </a>
              <a
                href="https://facebook.com/rythumshastri"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D9A441] flex items-center gap-1"
              >
                Facebook <ArrowUpRight size={12} />
              </a>
              <a
                href="https://www.youtube.com/@rythumshastri1963"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D9A441] flex items-center gap-1"
              >
                YouTube <ArrowUpRight size={12} />
              </a>
              <a
                href="https://music.apple.com/us/artist/rythum-shastri/1640653195"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D9A441] flex items-center gap-1"
              >
                Apple Music <ArrowUpRight size={12} />
              </a>
              <a
                href="https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D9A441] flex items-center gap-1"
              >
                Spotify <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
