// Procedural Sound Effects using Web Audio API
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmInterval = null;
    this.bgmTempo = 130; // BPM
    this.bgmStep = 0;
    this.bgmPlaying = false;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported in this browser.", e);
    }
  }

  playJump() {
    this.init();
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playSlide() {
    this.init();
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const duration = 0.25;

    // Create noise buffer
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  playCrash() {
    this.init();
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const duration = 0.6;

    // Low rumble (drum-like)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(10, now + duration);
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    // Noise explosion
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.Q.setValueAtTime(3, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(now);
    noise.start(now);
    
    osc.stop(now + duration);
    noise.stop(now + duration);
  }

  playScore() {
    this.init();
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playUnlock() {
    this.init();
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  startBGM() {
    this.init();
    if (!this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this.resumeContext();

    const stepDuration = 60 / this.bgmTempo / 2; // eighth notes
    const scheduler = () => {
      if (!this.bgmPlaying) return;
      const now = this.ctx.currentTime;
      
      // Play a step of the rhythmic loop
      this.playBgmStep(now);

      this.bgmStep = (this.bgmStep + 1) % 16;
      this.bgmInterval = setTimeout(scheduler, stepDuration * 1000);
    };

    scheduler();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  playBgmStep(time) {
    if (this.muted) return;

    // A simple retro synth loop
    // Bass notes for a cyber runner (Mumbai vibe)
    // Progression: C, Eb, F, G, etc.
    const bassline = [
      130.81, 130.81, 130.81, 130.81, // C3
      155.56, 155.56, 155.56, 155.56, // Eb3
      174.61, 174.61, 174.61, 174.61, // F3
      196.00, 196.00, 220.00, 196.00  // G3, A3, G3
    ];

    const currentBassFreq = bassline[Math.floor(this.bgmStep / 2) % bassline.length] / 2; // drop 1 octave for deep bass

    // 1. Play Bass Synth on step 0, 2, 4, 6...
    if (this.bgmStep % 2 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(currentBassFreq, time);
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
    }

    // 2. Play a procedurally synthesized small hi-hat on step 2, 6, 10, 14
    if (this.bgmStep % 4 === 2) {
      const duration = 0.05;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.02, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(time);
      noise.stop(time + duration);
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const sound = new SoundManager();
