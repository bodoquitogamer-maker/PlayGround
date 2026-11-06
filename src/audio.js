// Tiny procedural soundscape. No external audio assets, no autoplay.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.padGain = null;
    this.muted = false;
    this.started = false;
    this.timer = null;
    this.step = 0;
    this.chords = [
      [110, 164.81, 220, 261.63],
      [98, 146.83, 196, 246.94],
      [87.31, 130.81, 174.61, 220],
      [82.41, 123.47, 164.81, 207.65],
    ];
  }

  async ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.58;
    this.master.connect(this.ctx.destination);
    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.027;
    this.padGain.connect(this.master);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    filter.Q.value = 1.2;
    filter.connect(this.padGain);

    const notes = [55, 82.41, 110, 164.81, 220];
    notes.forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      osc.type = index < 2 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;
      osc.detune.value = (index - 2) * 4;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.18 / (index + 1);
      osc.connect(gain).connect(filter);
      osc.start();
    });

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain).connect(this.padGain.gain);
    lfo.start();
    this.started = true;
  }

  async start() {
    await this.ensure();
    if (!this.ctx || this.timer) return;
    this.step = 0;
    this.timer = window.setInterval(() => this.tick(), 2800);
    this.tick();
  }

  tick() {
    if (!this.ctx || this.muted || !this.started) return;
    const chord = this.chords[this.step % this.chords.length];
    this.step += 1;
    // Soft electric-piano chord.
    chord.forEach((freq, index) => {
      this.tone(freq, 2.8, 0.011 / (index * 0.45 + 1), 'sine', 0);
      this.tone(freq * 2.002, 2.2, 0.0045 / (index * 0.4 + 1), 'sine', 0.03);
    });
    // Sub pulse.
    this.tone(55, 0.48, 0.06, 'sine', 0);
    this.tone(110, 0.24, 0.018, 'triangle', 0);
    // A distant sparkle.
    if (this.step % 4 === 2) {
      this.tone(987.77, 0.8, 0.007, 'sine', 0.2);
      this.tone(1318.51, 0.7, 0.005, 'sine', 0.3);
    }
  }

  tone(frequency, duration, volume, type = 'sine', delay = 0, destination = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(destination || this.master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  noise(duration = 0.18, volume = 0.03) {
    if (!this.ctx) return;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3600;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  heartbeat(strength = 1) {
    this.tone(58, 0.2, 0.11 * strength, 'sine');
    this.tone(46, 0.26, 0.07 * strength, 'sine', 0.09);
  }

  tickSound() {
    this.tone(880, 0.05, 0.018, 'sine');
  }

  hit(perfect = false) {
    this.heartbeat(1.1);
    this.tone(perfect ? 1046.5 : 783.99, 0.35, 0.045, 'sine');
    if (perfect) {
      this.tone(1567.98, 0.55, 0.024, 'sine', 0.08);
      this.tone(2093, 0.4, 0.012, 'sine', 0.16);
    }
    this.noise(0.12, 0.014);
  }

  miss() {
    this.tone(196, 0.14, 0.035, 'triangle');
    this.tone(146.83, 0.22, 0.02, 'triangle', 0.08);
  }

  ui() {
    this.tone(523.25, 0.08, 0.018, 'sine');
    this.tone(783.99, 0.1, 0.012, 'sine', 0.035);
  }

  select() {
    this.tone(392, 0.13, 0.032, 'sine');
    this.tone(587.33, 0.2, 0.026, 'sine', 0.07);
    this.tone(880, 0.28, 0.014, 'sine', 0.13);
  }

  whoosh() {
    this.noise(0.6, 0.022);
    this.tone(98, 1.2, 0.026, 'sine');
  }

  chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 1.2, 0.018, 'sine', i * 0.08));
  }

  async toggle() {
    this.muted = !this.muted;
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.58, this.ctx.currentTime + 0.2);
    }
    if (!this.muted) await this.ensure();
    return this.muted;
  }
}
