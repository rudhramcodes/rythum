import React, { useState } from 'react';
import { Mail, ArrowRight, Check, Users, Sparkles } from 'lucide-react';

export const TheCircle = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-4">
            <Users size={14} />
            <span>COMMUNITY &amp; VIP INNER CIRCLE</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl font-display font-black text-[#F5EFE4] uppercase tracking-tight mb-3">
            THE CIRCLE
          </h2>

          <p className="font-serif italic text-xl sm:text-3xl text-[#D9A441] mb-6">
            &ldquo;Garba is danced in a circle. So is this.&rdquo;
          </p>

          <p className="text-xs sm:text-base font-body text-[#F5EFE4]/70 max-w-xl mx-auto leading-relaxed mb-8">
            Join the inner circle for early tour ticket drops, festival stage access, unreleased studio stems, and exclusive Navratri mixes.
          </p>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="relative max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#140F0D] border border-[#281D18] focus-within:border-[#D9A441] rounded-2xl sm:rounded-full p-2 transition-all shadow-xl">
              <div className="flex items-center pl-4 w-full sm:w-auto flex-1">
                <Mail size={18} className="text-[#D9A441]/60 flex-shrink-0 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full bg-transparent text-sm text-[#F5EFE4] placeholder-[#F5EFE4]/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#D9A441] hover:bg-[#F3CA6D] text-[#0D0A08] font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(217,164,65,0.3)] cursor-pointer flex-shrink-0"
              >
                <span>JOIN CIRCLE</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {submitted && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center justify-center space-x-2 animate-fadeIn">
                <Check size={14} />
                <span>WELCOME TO THE CIRCLE. YOU ARE ON THE VIP LIST.</span>
              </div>
            )}
          </form>

          <p className="text-[11px] font-mono text-[#F5EFE4]/40 mt-4 uppercase tracking-wider">
            ZERO SPAM · ONLY DIRECT SIGNALS FROM RYTHUM
          </p>
        </div>
      </div>
    </section>
  );
};

export default TheCircle;
