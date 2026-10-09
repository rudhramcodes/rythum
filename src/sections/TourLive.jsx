import React from 'react';
import { Calendar, MapPin, ArrowRight, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

export const TourLive = () => {
  const tourDates = [
    {
      date: 'OCT 02–03, 2026',
      city: 'Longview, Texas',
      event: 'Fall Headline Festival',
      venue: 'Maude Cobb Convention Center',
      status: 'COMPLETED',
      statusType: 'past',
    },
    {
      date: 'OCT 09–19, 2026',
      city: 'Houston, Texas',
      event: 'Navratri 10-Night Residency',
      venue: 'VPSS Cultural Center Hall',
      status: 'HAPPENING NOW · ON STAGE',
      statusType: 'live',
    },
    {
      date: 'OCT 22–23, 2026',
      city: 'El Paso, Texas',
      event: 'Southwest Navratri Celebration',
      venue: 'El Paso Coliseum Pavilion',
      status: 'CONFIRMED · RSVP OPEN',
      statusType: 'upcoming',
    },
    {
      date: 'NOV 07, 2026',
      city: 'Nashville, Tennessee',
      event: 'Music City Heritage Concert',
      venue: 'Grand Cultural Auditorium',
      status: 'CONFIRMED',
      statusType: 'upcoming',
    },
    {
      date: 'NOV 14, 2026',
      city: 'Longview, Texas',
      event: 'Season Finale & Devotional Gala',
      venue: 'Belcher Center Stage',
      status: 'CONFIRMED',
      statusType: 'upcoming',
    },
  ];

  return (
    <section id="tour" className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 border-b border-[#281D18] pb-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-ping" />
              <span>OFFICIAL 2026 GIG CALENDAR</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-[#F5EFE4] uppercase tracking-tight">
              TOUR &amp; LIVE STAGES
            </h2>
            <p className="font-serif italic text-lg sm:text-2xl text-[#D9A441] mt-1">
              &ldquo;500+ stages. Four countries. One circle.&rdquo;
            </p>
          </div>

          <a
            href="#booking"
            className="mt-6 md:mt-0 inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#D9A441] hover:bg-[#F3CA6D] text-[#0D0A08] font-display font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(217,164,65,0.3)]"
          >
            <span>BRING RYTHUM TO YOUR CITY</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Live Now Spotlight Card */}
        <div className="relative mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#4A0E0E]/40 via-[#140F0D] to-[#140F0D] border border-[#C1272D]/60 shadow-[0_0_40px_rgba(193,39,45,0.2)] overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#C1272D]/20 border border-[#C1272D] flex items-center justify-center text-[#C1272D] flex-shrink-0 animate-pulse">
                <Calendar size={24} />
              </div>
              <div>
                <div className="inline-flex items-center space-x-2 text-[11px] font-mono font-bold tracking-widest text-[#C1272D] uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-ping" />
                  <span>CURRENTLY ON STAGE · OCTOBER 9–19</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#F5EFE4] uppercase">
                  HOUSTON, TEXAS · NAVRATRI RESIDENCY
                </h3>
                <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/70 mt-1">
                  A ten-night immersive celebration of traditional garba, classical improvisation, and sonic high-energy dhol.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="#booking"
                className="px-5 py-2.5 rounded-full border border-[#D9A441] bg-[#D9A441]/10 hover:bg-[#D9A441] hover:text-[#0D0A08] text-[#D9A441] text-xs font-mono font-bold uppercase tracking-wider transition-all"
              >
                BOOKINGS FOR NEXT RUN →
              </a>
            </div>
          </div>
        </div>

        {/* Tour Dates Table (Martin Garrix style list) */}
        <div className="divide-y divide-[#281D18] border-y border-[#281D18] mb-16">
          {tourDates.map((gig, idx) => (
            <div
              key={idx}
              className={`py-6 sm:py-7 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-[#140F0D]/60 px-4 -mx-4 rounded-lg group ${
                gig.statusType === 'live' ? 'bg-[#4A0E0E]/15 border-l-2 border-l-[#C1272D]' : ''
              }`}
            >
              {/* Date & City */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="w-36 font-mono text-sm sm:text-base font-bold text-[#D9A441] tracking-wider">
                  {gig.date}
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-lg sm:text-xl text-[#F5EFE4] group-hover:text-[#D9A441] transition-colors uppercase">
                    {gig.city}
                  </span>
                  <span className="text-xs font-body text-[#F5EFE4]/60">
                    {gig.event} · {gig.venue}
                  </span>
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex items-center space-x-4 self-start md:self-auto">
                <span
                  className={`text-[11px] font-mono font-bold tracking-wider px-3 py-1 rounded-full uppercase ${
                    gig.statusType === 'live'
                      ? 'bg-[#C1272D] text-white shadow-[0_0_12px_#C1272D]'
                      : gig.statusType === 'past'
                      ? 'bg-[#281D18] text-[#F5EFE4]/40'
                      : 'border border-[#D9A441]/50 text-[#D9A441] bg-[#D9A441]/10'
                  }`}
                >
                  {gig.status}
                </span>

                <a
                  href="#booking"
                  className="text-xs font-mono font-bold text-[#F5EFE4]/70 hover:text-[#D9A441] uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  INQUIRE <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* The Garba Social & Heritage Story Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#D9A441] uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              <span>COMMUNITY IMPACT</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F5EFE4] uppercase mb-3">
              THE GARBA SOCIAL
            </h3>
            <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/70 leading-relaxed mb-4">
              Co-founded in September 2023, drawing over 1,500 attendees at the inaugural celebration.
              Officially recognized and commended by US Congresswoman Michelle Steel for uniting the diaspora and preserving ancient cultural artforms.
            </p>
            <div className="text-[11px] font-mono text-[#D9A441]/80">
              ★ 1,500+ ATTENDEES · CULTURAL REVIVAL
            </div>
          </div>

          <div className="bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#D9A441] uppercase tracking-wider mb-2">
              <ShieldCheck size={14} />
              <span>PRESTIGIOUS VENUES &amp; COLLABORATIONS</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F5EFE4] uppercase mb-3">
              ICONIC STAGES HEADLINED
            </h3>
            <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/70 leading-relaxed mb-4">
              Headlined Rang Raas, NCPA Mumbai, Edison New Jersey, Navsari Reunion Dallas (~1,000 attendees), and Sufi concerts alongside Navdeep Wadali. Opened for legends Sudesh Bhosale &amp; Anup Jalota.
            </p>
            <div className="text-[11px] font-mono text-[#D9A441]/80">
              ★ INDIA · USA · CANADA · NEPAL
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TourLive;
