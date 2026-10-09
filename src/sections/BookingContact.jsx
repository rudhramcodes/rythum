import React, { useState } from 'react';
import { Mail, Phone, Calendar, MapPin, Send, Check, Copy, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';

export const BookingContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: 'Navratri Festival',
    eventCity: '',
    eventDate: '',
    inquiry: '',
  });
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const bookingEmail = 'notyourshastri@gmail.com';

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bookingEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    // Prepare mailto payload
    const subject = encodeURIComponent(`Booking Inquiry: ${formData.eventType} in ${formData.eventCity || 'TBD'}`);
    const body = encodeURIComponent(
      `Hello Rythum & Management,\n\nI am contacting you regarding a live performance booking:\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nEvent Type: ${formData.eventType}\nCity / Location: ${formData.eventCity}\nTarget Date: ${formData.eventDate}\n\nDetails:\n${formData.inquiry}\n\nLooking forward to your response.`
    );

    // Open mail client
    window.location.href = `mailto:${bookingEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="booking" className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 border-b border-[#281D18] pb-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-ping" />
              <span>DIRECT ARTIST MANAGEMENT &amp; GIGS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-[#F5EFE4] uppercase tracking-tight">
              BOOKING &amp; INQUIRIES
            </h2>
            <p className="font-serif italic text-lg sm:text-2xl text-[#D9A441] mt-1">
              Bring the pulse to your arena, festival, or private gala.
            </p>
          </div>

          <div className="mt-6 md:mt-0">
            <span className="text-xs font-mono text-[#F5EFE4]/60 uppercase">
              WORLDWIDE AVAILABILITY · FESTIVALS &amp; WEDDINGS
            </span>
          </div>
        </div>

        {/* Martin Garrix Style Booking Trust Card */}
        <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-[#140F0D] border border-[#D9A441]/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[#D9A441]/10 border border-[#D9A441] flex items-center justify-center text-[#D9A441] flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#D9A441] uppercase">
                OFFICIAL VERIFIED BOOKING DESK
              </span>
              <div className="text-lg sm:text-2xl font-mono font-bold text-[#F5EFE4] mt-0.5 break-all">
                {bookingEmail}
              </div>
              <p className="text-xs font-body text-[#F5EFE4]/60 mt-1">
                For prompt tour dates, contract riders, and festival programming inquiries.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441] text-xs font-mono uppercase text-[#F5EFE4] transition-colors cursor-pointer"
            >
              {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedEmail ? 'COPIED TO CLIPBOARD' : 'COPY INBOX'}</span>
            </button>

            <a
              href={`mailto:${bookingEmail}`}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#D9A441] hover:bg-[#F3CA6D] text-[#0D0A08] font-display font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Mail size={14} />
              <span>SEND EMAIL</span>
            </a>
          </div>
        </div>

        {/* Two Column Layout: Inquiry Form & Artist Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Inquiry Form */}
          <div className="lg:col-span-2 bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-10 shadow-xl">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F5EFE4] uppercase mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-[#D9A441]" />
              <span>DIRECT PERFORMANCE INQUIRY FORM</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70 mb-2">
                    YOUR NAME / PROMOTER *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name / Organization"
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A08] border border-[#281D18] focus:border-[#D9A441] text-sm text-[#F5EFE4] focus:outline-none transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70 mb-2">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A08] border border-[#281D18] focus:border-[#D9A441] text-sm text-[#F5EFE4] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70 mb-2">
                    PHONE / WHATSAPP NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A08] border border-[#281D18] focus:border-[#D9A441] text-sm text-[#F5EFE4] focus:outline-none transition-colors"
                  />
                </div>

                {/* Event Category */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70 mb-2">
                    EVENT TYPE
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A08] border border-[#281D18] focus:border-[#D9A441] text-sm text-[#F5EFE4] focus:outline-none transition-colors"
                  >
                    <option value="Navratri Festival">Navratri Festival / Garba Night</option>
                    <option value="Arena / Concert Tour">Arena / Concert Tour Headline</option>
                    <option value="Wedding / Sangeet Gala">Wedding / Sangeet Gala</option>
                    <option value="Corporate / Private Event">Corporate / Private Event</option>
                    <option value="College / University Festival">College / University Festival</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Event City */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70 mb-2">
                    CITY &amp; COUNTRY *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eventCity}
                    onChange={(e) => setFormData({ ...formData, eventCity: e.target.value })}
                    placeholder="e.g. Dallas, TX or London, UK"
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A08] border border-[#281D18] focus:border-[#D9A441] text-sm text-[#F5EFE4] focus:outline-none transition-colors"
                  />
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70 mb-2">
                    PROPOSED DATE(S)
                  </label>
                  <input
                    type="text"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    placeholder="e.g. October 2026 or Spring 2027"
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A08] border border-[#281D18] focus:border-[#D9A441] text-sm text-[#F5EFE4] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Inquiry Message */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#F5EFE4]/70 mb-2">
                  EVENT DETAILS &amp; TECHNICAL REQUIREMENTS *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.inquiry}
                  onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
                  placeholder="Expected crowd size, venue name, live band requirements, sound setup..."
                  className="w-full px-4 py-3 rounded-lg bg-[#0D0A08] border border-[#281D18] focus:border-[#D9A441] text-sm text-[#F5EFE4] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-[#D9A441] hover:bg-[#F3CA6D] text-[#0D0A08] font-display font-extrabold text-sm uppercase tracking-widest flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_25px_rgba(217,164,65,0.35)] cursor-pointer"
              >
                <Send size={16} />
                <span>SUBMIT BOOKING INQUIRY</span>
              </button>

              {submitted && (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
                  <Check size={16} />
                  <span>Inquiry prepared! Opening your mail client and dispatching to {bookingEmail}.</span>
                </div>
              )}
            </form>
          </div>

          {/* Sidebar Info & Verified Socials */}
          <div className="space-y-6">
            <div className="bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-8">
              <h4 className="text-sm font-mono font-bold uppercase tracking-widest text-[#D9A441] mb-4">
                OFFICIAL CHANNELS
              </h4>

              <div className="space-y-3 text-xs font-mono">
                <a
                  href="https://instagram.com/rythum_shastri"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0D0A08] border border-[#281D18] hover:border-[#D9A441] text-[#F5EFE4] hover:text-[#D9A441] transition-all"
                >
                  <span>Instagram: @rythum_shastri</span>
                  <ArrowUpRight size={14} />
                </a>

                <a
                  href="https://facebook.com/rythumshastri"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0D0A08] border border-[#281D18] hover:border-[#D9A441] text-[#F5EFE4] hover:text-[#D9A441] transition-all"
                >
                  <span>Facebook: Rythum Shastri</span>
                  <ArrowUpRight size={14} />
                </a>

                <a
                  href="https://www.youtube.com/@rythumshastri1963"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0D0A08] border border-[#281D18] hover:border-[#D9A441] text-[#F5EFE4] hover:text-[#D9A441] transition-all"
                >
                  <span>YouTube: @rythumshastri1963</span>
                  <ArrowUpRight size={14} />
                </a>

                <a
                  href="https://music.apple.com/us/artist/rythum-shastri/1640653195"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0D0A08] border border-[#281D18] hover:border-[#D9A441] text-[#F5EFE4] hover:text-[#D9A441] transition-all"
                >
                  <span>Apple Music: Rythum Shastri</span>
                  <ArrowUpRight size={14} />
                </a>

                <a
                  href="https://open.spotify.com/artist/7Aht2xRvnv83wSBOYg3Bol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0D0A08] border border-[#281D18] hover:border-[#D9A441] text-[#F5EFE4] hover:text-[#D9A441] transition-all"
                >
                  <span>Spotify Artist Profile</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div className="bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-8">
              <h4 className="text-sm font-mono font-bold uppercase tracking-widest text-[#D9A441] mb-2">
                PRESS &amp; TECHNICAL RIDER
              </h4>
              <p className="text-xs font-body text-[#F5EFE4]/60 leading-relaxed mb-4">
                High-resolution press portraits, sound engineer input lists, stage plots, and bio sheets available upon request.
              </p>
              <a
                href={`mailto:${bookingEmail}?subject=${encodeURIComponent('Press Kit / Technical Rider Request')}`}
                className="text-xs font-mono font-bold text-[#D9A441] hover:underline"
              >
                REQUEST EPK VIA EMAIL →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingContact;
