// WebAudio Synthesizer Engine for Dhol & Percussion
// 100% synthesized in-browser with zero external audio assets.

let audioCtx = null;

export const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Bass Voice (Dhol "Ge" - deep, resonant bass membrane hit)
export const playBass = (time = 0, onPulse = null) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = time || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch drop envelope typical of stretched dhol goat skin
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    // Subtle saturation / drive
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    if (onPulse) {
      setTimeout(() => onPulse('bass'), Math.max(0, (now - ctx.currentTime) * 1000));
    }
  } catch (e) {
    console.warn('Audio playback error', e);
  }
};

// Treble Voice (Dhol "Na / Ti" - sharp, crisp rim crack)
export const playTreble = (time = 0, onPulse = null) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = time || ctx.currentTime;

    // Fast pitched click
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);

    // Filtered noise burst for dhol stick impact crack
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.07);

    if (onPulse) {
      setTimeout(() => onPulse('treble'), Math.max(0, (now - ctx.currentTime) * 1000));
    }
  } catch (e) {
    console.warn('Audio playback error', e);
  }
};

// Accent Voice (Clap / Chutki / Slap)
export const playClap = (time = 0, onPulse = null) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = time || ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(950, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.13);

    if (onPulse) {
      setTimeout(() => onPulse('clap'), Math.max(0, (now - ctx.currentTime) * 1000));
    }
  } catch (e) {
    console.warn('Audio playback error', e);
  }
};

// Preloader 4-beat ritual count-in
export const playCountInBeat = (beatNumber, onComplete = null) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (beatNumber === 4) {
    // 4th beat is a powerful resonant bass strike + treble snap
    playBass(now);
    playTreble(now);
  } else {
    // 1, 2, 3 beats are crisp rim taps
    playTreble(now);
  }

  if (onComplete) {
    setTimeout(onComplete, 400);
  }
};
