import React from 'react';
import { Award, Star } from 'lucide-react';

export const HonorsMarquee = () => {
  const honors = [
    'FELICITATION BY US CONGRESSWOMAN MICHELLE STEEL',
    'CALIFORNIA STATE LEGISLATURE HONOREE',
    'COMMENDATION FROM MAYOR OF ARTESIA',
    '$100,000+ RAISED FOR TURKEY–SYRIA DISASTER RELIEF',
    '500+ STAGES ACROSS 4 COUNTRIES',
    'INAUGURAL THE GARBA SOCIAL: 1,500+ ATTENDEES',
    'DEAN’S LIST HONORS · MUSICIANS INSTITUTE',
    'PERFORMED AT NCPA MUMBAI & EDISON ARENAS',
  ];

  return (
    <div className="relative py-8 bg-gradient-to-r from-[#2A0909] via-[#4A0E0E] to-[#2A0909] border-y border-[#D9A441]/30 overflow-hidden select-none">
      {/* Decorative side fades */}
      <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-[#0D0A08] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#0D0A08] to-transparent z-10 pointer-events-none" />

      {/* Marquee Ribbon */}
      <div className="flex animate-marquee items-center space-x-8">
        {[...honors, ...honors].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-6 flex-shrink-0">
            <span className="text-sm sm:text-base font-display font-extrabold uppercase tracking-widest text-[#F5EFE4] flex items-center gap-2">
              <Star size={14} className="text-[#D9A441] fill-[#D9A441]" />
              <span>{item}</span>
            </span>
            <span className="text-[#D9A441]/40 font-mono text-sm">///</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HonorsMarquee;
