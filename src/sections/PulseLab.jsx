import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Shuffle, RotateCcw, Share2, Sparkles, Volume2, Check } from 'lucide-react';
import { playBass, playTreble, playClap, getAudioContext } from '../audio/dholSynth';

const DEFAULT_PRESETS = {
  garba: {
    name: 'Garba (Keherwa)',
    bpm: 104,
    // 8 steps
    bass: [true, false, false, true, true, false, true, false],
    treble: [true, false, true, false, true, false, true, true],
    clap: [false, false, true, false, false, false, true, false],
  },
  sufi: {
    name: 'Sufi Groove',
    bpm: 96,
    bass: [true, false, true, false, false, true, false, false],
    treble: [false, true, false, true, true, false, true, true],
    clap: [false, false, false, false, true, false, false, true],
  },
  techno: {
    name: 'Techno 127 BPM (Gambit)',
    bpm: 127,
    bass: [true, false, true, false, true, false, true, false],
    treble: [false, true, false, true, false, true, false, true],
    clap: [false, false, true, false, false, false, true, false],
  },
};

export const PulseLab = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(104);
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState(DEFAULT_PRESETS.garba);
  const [copied, setCopied] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [activePad, setActivePad] = useState(null);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const ringsRef = useRef([]);

  // Pulse Ring animation loop on canvas
  const triggerVisualPulse = useCallback((color = '#D9A441', radius = 20) => {
    ringsRef.current.push({
      x: canvasRef.current ? canvasRef.current.width / 2 : 150,
      y: canvasRef.current ? canvasRef.current.height / 2 : 150,
      r: radius,
      opacity: 0.9,
      color,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render concentric rings
      ringsRef.current.forEach((ring, idx) => {
        ring.r += 2.2;
        ring.opacity -= 0.018;

        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = Math.max(0, ring.opacity);
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      // Filter dead rings
      ringsRef.current = ringsRef.current.filter((r) => r.opacity > 0);
      ctx.globalAlpha = 1.0;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // Step Sequencer Timer
  useEffect(() => {
    if (!isPlaying) {
      setCurrentStep(-1);
      return;
    }

    getAudioContext();
    const intervalMs = (60 / bpm / 2) * 1000; // 8th notes

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % 8;

        // Play active voices for this step
        if (grid.bass[nextStep]) {
          playBass();
          triggerVisualPulse('#D9A441', 25);
        }
        if (grid.treble[nextStep]) {
          playTreble();
          triggerVisualPulse('#F5EFE4', 15);
        }
        if (grid.clap[nextStep]) {
          playClap();
          triggerVisualPulse('#C1272D', 18);
        }

        return nextStep;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, bpm, grid, triggerVisualPulse]);

  // Toggle a cell in the grid
  const toggleCell = (voice, stepIndex) => {
    getAudioContext();
    setGrid((prev) => ({
      ...prev,
      [voice]: prev[voice].map((val, idx) => (idx === stepIndex ? !val : val)),
    }));
  };

  // Switch Preset
  const loadPreset = (presetKey) => {
    const preset = DEFAULT_PRESETS[presetKey];
    if (preset) {
      setGrid(preset);
      setBpm(preset.bpm);
    }
  };

  // Randomize pattern
  const handleRandomize = () => {
    getAudioContext();
    const rand = (prob) => Array.from({ length: 8 }, () => Math.random() < prob);
    setGrid({
      name: 'Custom Jam',
      bpm,
      bass: rand(0.4),
      treble: rand(0.55),
      clap: rand(0.3),
    });
  };

  // Clear pattern
  const handleClear = () => {
    setGrid({
      name: 'Empty Grid',
      bpm,
      bass: Array(8).fill(false),
      treble: Array(8).fill(false),
      clap: Array(8).fill(false),
    });
  };

  // Tap Tempo
  const handleTapTempo = () => {
    const now = Date.now();
    if (lastTapTime > 0) {
      const diff = now - lastTapTime;
      if (diff > 250 && diff < 1500) {
        const calculatedBpm = Math.round(60000 / diff);
        const clampedBpm = Math.min(160, Math.max(70, calculatedBpm));
        setBpm(clampedBpm);
      }
    }
    setLastTapTime(now);
  };

  // Copy share pattern
  const handleShare = () => {
    const patternCode = `RYTHUM PULSE // BPM:${bpm} // BASS:${grid.bass.map((b) => (b ? '1' : '0')).join('')} // TREBLE:${grid.treble.map((b) => (b ? '1' : '0')).join('')} // CLAP:${grid.clap.map((b) => (b ? '1' : '0')).join('')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(patternCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Manual drum pad trigger
  const triggerPad = (voice) => {
    getAudioContext();
    setActivePad(voice);
    setTimeout(() => setActivePad(null), 150);

    if (voice === 'bass') {
      playBass();
      triggerVisualPulse('#D9A441', 30);
    } else if (voice === 'treble') {
      playTreble();
      triggerVisualPulse('#F5EFE4', 20);
    } else if (voice === 'clap') {
      playClap();
      triggerVisualPulse('#C1272D', 22);
    }
  };

  return (
    <section id="pulse-lab" className="relative py-24 sm:py-32 bg-[#0D0A08] border-t border-[#281D18] overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-[#4A0E0E]/20 to-[#D9A441]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 border-b border-[#281D18] pb-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.25em] text-[#D9A441] uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-ping" />
              <span>INTERACTIVE WEBAUDIO SYNTHESIZER</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-[#F5EFE4] uppercase tracking-tight">
              THE PULSE LAB
            </h2>
            <p className="font-serif italic text-lg sm:text-2xl text-[#D9A441] mt-1">
              &ldquo;Every name means something. His is an instruction.&rdquo;
            </p>
          </div>

          <p className="mt-4 md:mt-0 max-w-md text-xs sm:text-sm font-body text-[#F5EFE4]/60 leading-relaxed">
            This is a keherwa — the heartbeat of garba synthesized directly in your browser.
            Press play, trigger live hits, or build your own groove.
          </p>
        </div>

        {/* Top Interactive Drum Pads + Pulse Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Live Drum Pads */}
          <div className="lg:col-span-2 bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F5EFE4]/60">
                LIVE DHOL TRIGGER PADS (CLICK OR TAP)
              </span>
              <span className="text-[11px] font-mono text-[#D9A441]">0% SAMPLES · 100% SYNTHESIZED</span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* Bass Ge */}
              <button
                onClick={() => triggerPad('bass')}
                className={`py-6 sm:py-8 px-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activePad === 'bass'
                    ? 'border-[#D9A441] bg-[#D9A441]/25 scale-95 shadow-[0_0_25px_#D9A441]'
                    : 'border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441]/60 hover:bg-[#1A1412]'
                }`}
              >
                <span className="text-xl sm:text-2xl font-display font-black text-[#D9A441]">BASS</span>
                <span className="font-serif italic text-xs text-[#F5EFE4]/80 mt-1">Dhol &lsquo;Ge&rsquo;</span>
                <span className="text-[10px] font-mono text-[#D9A441]/60 mt-2">SUB 45Hz</span>
              </button>

              {/* Treble Na / Ti */}
              <button
                onClick={() => triggerPad('treble')}
                className={`py-6 sm:py-8 px-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activePad === 'treble'
                    ? 'border-[#F5EFE4] bg-[#F5EFE4]/25 scale-95 shadow-[0_0_25px_#F5EFE4]'
                    : 'border-[#281D18] bg-[#0D0A08] hover:border-[#F5EFE4]/60 hover:bg-[#1A1412]'
                }`}
              >
                <span className="text-xl sm:text-2xl font-display font-black text-[#F5EFE4]">TREBLE</span>
                <span className="font-serif italic text-xs text-[#F5EFE4]/80 mt-1">Rim &lsquo;Na / Ti&rsquo;</span>
                <span className="text-[10px] font-mono text-[#F5EFE4]/60 mt-2">SNAP 2.6kHz</span>
              </button>

              {/* Accent Clap */}
              <button
                onClick={() => triggerPad('clap')}
                className={`py-6 sm:py-8 px-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activePad === 'clap'
                    ? 'border-[#C1272D] bg-[#C1272D]/25 scale-95 shadow-[0_0_25px_#C1272D]'
                    : 'border-[#281D18] bg-[#0D0A08] hover:border-[#C1272D]/60 hover:bg-[#1A1412]'
                }`}
              >
                <span className="text-xl sm:text-2xl font-display font-black text-[#C1272D]">CLAP</span>
                <span className="font-serif italic text-xs text-[#F5EFE4]/80 mt-1">Chutki / Accent</span>
                <span className="text-[10px] font-mono text-[#C1272D]/60 mt-2">CRISP TRANSIENT</span>
              </button>
            </div>
          </div>

          {/* Canvas Waveform / Pulse Visualizer */}
          <div className="bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-mono uppercase tracking-widest text-[#F5EFE4]/50">
              RESONANCE OSCILLOSCOPE
            </div>
            <canvas
              ref={canvasRef}
              width={280}
              height={200}
              className="w-full h-[180px] pointer-events-none"
            />
            <div className="text-[11px] font-mono text-[#D9A441] tracking-wider uppercase mt-1">
              {isPlaying ? `PULSE ACTIVE · ${bpm} BPM` : 'STANDBY · PRESS PLAY'}
            </div>
          </div>
        </div>

        {/* Sequencer Grid Panel */}
        <div className="bg-[#140F0D] border border-[#281D18] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#281D18]">
            {/* Play/Stop + BPM */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-[#C1272D] hover:bg-[#a31f24] text-[#F5EFE4] shadow-[0_0_20px_rgba(193,39,45,0.4)]'
                    : 'bg-[#D9A441] hover:bg-[#F3CA6D] text-[#0D0A08] shadow-[0_0_20px_rgba(217,164,65,0.4)]'
                }`}
              >
                {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                <span>{isPlaying ? 'STOP SEQUENCER' : 'PLAY GROOVE'}</span>
              </button>

              {/* Tempo Slider */}
              <div className="flex items-center space-x-3 bg-[#0D0A08] border border-[#281D18] px-4 py-2 rounded-full">
                <span className="text-[11px] font-mono text-[#F5EFE4]/60 uppercase">TEMPO:</span>
                <input
                  type="range"
                  min="75"
                  max="145"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-20 sm:w-28 accent-[#D9A441] cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-[#D9A441] min-w-[55px]">
                  {bpm} BPM
                </span>
              </div>

              {/* Tap Tempo */}
              <button
                onClick={handleTapTempo}
                className="px-3 py-2 rounded-full border border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441] text-[11px] font-mono uppercase tracking-wider text-[#F5EFE4]/80 transition-colors cursor-pointer"
              >
                TAP TEMPO
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#F5EFE4]/50 mr-1 hidden sm:inline">
                PRESETS:
              </span>
              <button
                onClick={() => loadPreset('garba')}
                className="px-3 py-1.5 rounded-md border border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441] text-xs font-bold text-[#F5EFE4] transition-colors cursor-pointer"
              >
                Garba (Keherwa)
              </button>
              <button
                onClick={() => loadPreset('sufi')}
                className="px-3 py-1.5 rounded-md border border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441] text-xs font-bold text-[#F5EFE4] transition-colors cursor-pointer"
              >
                Sufi
              </button>
              <button
                onClick={() => loadPreset('techno')}
                className="px-3 py-1.5 rounded-md border border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441] text-xs font-bold text-[#D9A441] transition-colors cursor-pointer"
              >
                Techno 127
              </button>
            </div>
          </div>

          {/* 8-Step Grid Matrix */}
          <div className="my-8 space-y-4">
            {/* Steps indicator bar */}
            <div className="grid grid-cols-8 gap-2 sm:gap-3 pl-24 sm:pl-32">
              {Array.from({ length: 8 }).map((_, stepIdx) => (
                <div
                  key={stepIdx}
                  className={`text-center py-1 rounded text-[10px] font-mono uppercase transition-colors ${
                    currentStep === stepIdx
                      ? 'bg-[#D9A441] text-[#0D0A08] font-bold shadow-[0_0_10px_#D9A441]'
                      : 'text-[#F5EFE4]/40 bg-[#0D0A08]'
                  }`}
                >
                  0{stepIdx + 1}
                </div>
              ))}
            </div>

            {/* Bass Row */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-24 sm:w-32 flex flex-col">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-[#D9A441]">
                  BASS (GE)
                </span>
                <span className="text-[10px] font-mono text-[#F5EFE4]/40">Sub Dhol</span>
              </div>
              <div className="grid grid-cols-8 gap-2 sm:gap-3 flex-1">
                {grid.bass.map((active, stepIdx) => (
                  <button
                    key={stepIdx}
                    onClick={() => toggleCell('bass', stepIdx)}
                    className={`h-11 sm:h-14 rounded-lg border transition-all cursor-pointer ${
                      active
                        ? currentStep === stepIdx
                          ? 'bg-[#F3CA6D] border-[#FFFFFF] scale-105 shadow-[0_0_15px_#F3CA6D]'
                          : 'bg-[#D9A441] border-[#D9A441] shadow-[0_0_12px_rgba(217,164,65,0.4)]'
                        : currentStep === stepIdx
                        ? 'bg-[#281D18] border-[#D9A441]/50'
                        : 'bg-[#0D0A08] border-[#281D18] hover:border-[#D9A441]/40'
                    }`}
                    aria-label={`Bass step ${stepIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Treble Row */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-24 sm:w-32 flex flex-col">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-[#F5EFE4]">
                  TREBLE (NA)
                </span>
                <span className="text-[10px] font-mono text-[#F5EFE4]/40">Rim Snap</span>
              </div>
              <div className="grid grid-cols-8 gap-2 sm:gap-3 flex-1">
                {grid.treble.map((active, stepIdx) => (
                  <button
                    key={stepIdx}
                    onClick={() => toggleCell('treble', stepIdx)}
                    className={`h-11 sm:h-14 rounded-lg border transition-all cursor-pointer ${
                      active
                        ? currentStep === stepIdx
                          ? 'bg-white border-[#FFFFFF] scale-105 shadow-[0_0_15px_#FFFFFF]'
                          : 'bg-[#E5DFD5] border-[#E5DFD5] text-[#0D0A08] shadow-[0_0_12px_rgba(245,239,228,0.3)]'
                        : currentStep === stepIdx
                        ? 'bg-[#281D18] border-[#F5EFE4]/50'
                        : 'bg-[#0D0A08] border-[#281D18] hover:border-[#F5EFE4]/40'
                    }`}
                    aria-label={`Treble step ${stepIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Clap Row */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-24 sm:w-32 flex flex-col">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-[#C1272D]">
                  CLAP (TAALI)
                </span>
                <span className="text-[10px] font-mono text-[#F5EFE4]/40">Accent</span>
              </div>
              <div className="grid grid-cols-8 gap-2 sm:gap-3 flex-1">
                {grid.clap.map((active, stepIdx) => (
                  <button
                    key={stepIdx}
                    onClick={() => toggleCell('clap', stepIdx)}
                    className={`h-11 sm:h-14 rounded-lg border transition-all cursor-pointer ${
                      active
                        ? currentStep === stepIdx
                          ? 'bg-[#E03A41] border-white scale-105 shadow-[0_0_15px_#C1272D]'
                          : 'bg-[#C1272D] border-[#C1272D] shadow-[0_0_12px_rgba(193,39,45,0.4)]'
                        : currentStep === stepIdx
                        ? 'bg-[#281D18] border-[#C1272D]/50'
                        : 'bg-[#0D0A08] border-[#281D18] hover:border-[#C1272D]/40'
                    }`}
                    aria-label={`Clap step ${stepIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#281D18]">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRandomize}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#281D18] bg-[#0D0A08] hover:border-[#D9A441] text-xs font-mono uppercase text-[#F5EFE4]/80 transition-colors cursor-pointer"
              >
                <Shuffle size={13} />
                <span>RANDOMIZE</span>
              </button>

              <button
                onClick={handleClear}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#281D18] bg-[#0D0A08] hover:border-[#C1272D] text-xs font-mono uppercase text-[#F5EFE4]/80 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>CLEAR</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#D9A441]/10 border border-[#D9A441]/40 hover:bg-[#D9A441] hover:text-[#0D0A08] text-xs font-mono uppercase font-bold text-[#D9A441] transition-all cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span>{copied ? 'PATTERN COPIED!' : 'SHARE THIS BEAT'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PulseLab;
