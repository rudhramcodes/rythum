import { useState } from 'react';
import { playCountInBeat, getAudioContext } from '../audio/dholSynth';
import { Volume2, ArrowRight } from 'lucide-react';

export const Preloader = ({ onEnter }) => {
  const [step, setStep] = useState('idle'); // 'idle' | 'counting' | 'finished'
  const [beatCount, setBeatCount] = useState(0);

  const startRitual = () => {
    // Unlock Audio Context on user gesture
    getAudioContext();
    setStep('counting');

    let count = 1;
    setBeatCount(1);
    playCountInBeat(1);

    const interval = setInterval(() => {
      count += 1;
      setBeatCount(count);
      playCountInBeat(count);

      if (count >= 4) {
        clearInterval(interval);
        setTimeout(() => {
          setStep('finished');
          if (onEnter) onEnter();
        }, 600);
      }
    }, 450);
  };

  const handleSkip = () => {
    getAudioContext();
    setStep('finished');
    if (onEnter) onEnter();
  };

  if (step === 'finished') return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0D0A08] flex flex-col items-center justify-between p-6 sm:p-12 text-center select-none transition-opacity duration-700">
      {/* Top Status */}
      <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest uppercase text-[#D9A441]/70">
        <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-ping" />
        <span>AUTHENTIC ARTIST EXPERIENCE</span>
      </div>

      {/* Center Ritual Graphic & Wordmark */}
      <div className="flex flex-col items-center justify-center my-auto max-w-xl">
        {/* Pulsing Orb */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-[#D9A441]/30 animate-pulse-ring flex items-center justify-center bg-radial from-[#4A0E0E]/40 to-transparent">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-[#D9A441]/60 flex items-center justify-center bg-[#140F0D] shadow-[0_0_35px_rgba(217,164,65,0.25)]">
              <span className="font-display font-black text-2xl text-[#D9A441]">RS</span>
            </div>
          </div>

          {/* Animated Beat Count Ring */}
          {step === 'counting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl sm:text-5xl font-display font-black text-[#D9A441] drop-shadow-[0_0_20px_#D9A441] animate-bounce">
                {beatCount === 4 ? 'PULSE' : beatCount}
              </span>
            </div>
          )}
        </div>

        {/* Title & Native Script */}
        <div className="space-y-1 mb-4">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-black tracking-tight text-[#F5EFE4] uppercase">
            RYTHUM
          </h1>
          <p className="text-2xl sm:text-3xl font-serif italic text-[#D9A441] tracking-wide">
            रिदम शास्त्री
          </p>
        </div>

        <p className="text-xs sm:text-sm font-body text-[#F5EFE4]/60 max-w-md tracking-wider uppercase mb-8">
          The Pulse of Indian Classical Soul &amp; Modern Sonic Architecture
        </p>

        {/* Action Button */}
        {step === 'idle' ? (
          <button
            onClick={startRitual}
            className="group relative inline-flex items-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#D9A441] to-[#F3CA6D] text-[#0D0A08] font-display font-extrabold text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(217,164,65,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Volume2 size={18} className="animate-pulse" />
            <span>TAP TO ENTER THE PULSE</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#D9A441]">
            <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-ping" />
            <span>SYNCHRONIZING BEAT {beatCount} OF 4...</span>
          </div>
        )}
      </div>

      {/* Bottom Skip Link */}
      <div className="w-full flex justify-between items-center text-[11px] font-mono uppercase text-[#F5EFE4]/40 tracking-wider">
        <span>AUDIO SYNTHESIZER READY</span>
        <button
          onClick={handleSkip}
          className="hover:text-[#D9A441] transition-colors underline underline-offset-4 cursor-pointer"
        >
          SKIP TO SITE →
        </button>
      </div>
    </div>
  );
};

export default Preloader;
