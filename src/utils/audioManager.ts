// Web Audio API Sound and Ambience Manager
class AudioManager {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private ambientNodes: AudioScheduledSourceNode[] = [];
  private lastFootstepTime = 0;
  private isMuted = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public ensureInitialized() {
    this.init();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- Ambient Post-Apocalyptic / Alien Soundscape ---
  public startAmbience(map: string = 'earth') {
    this.init();
    if (!this.ctx || !this.ambientGain || this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;

    try {
      const now = this.ctx.currentTime;
      // Frequency and drone tuning based on map
      let baseFreq = 55;
      let padFreq = 164.8;
      let filterFreq = 260;
      if (map === 'space') {
        baseFreq = 42;
        padFreq = 220;
        filterFreq = 450;
      } else if (map === 'mars') {
        baseFreq = 48; // Dark heavy doom drone
        padFreq = 144;
        filterFreq = 320;
      } else if (map === 'moon') {
        baseFreq = 38;
        padFreq = 196;
        filterFreq = 180;
      }

      // 1. Deep Sub Drone
      const droneOsc1 = this.ctx.createOscillator();
      droneOsc1.type = map === 'mars' ? 'sawtooth' : 'triangle';
      droneOsc1.frequency.setValueAtTime(baseFreq, now);

      // Slow pitch drift for eerie atmospheric feel
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(2.0, now);
      lfo.connect(lfoGain);
      lfoGain.connect(droneOsc1.frequency);
      lfo.start();

      // 2. Harmonic Ambient Pad
      const droneOsc2 = this.ctx.createOscillator();
      droneOsc2.type = 'sine';
      droneOsc2.frequency.setValueAtTime(padFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.setValueAtTime(map === 'space' ? 5 : 2.5, now);

      // Slow filter sweep
      const filterLfo = this.ctx.createOscillator();
      filterLfo.frequency.setValueAtTime(0.08, now);
      const filterLfoGain = this.ctx.createGain();
      filterLfoGain.gain.setValueAtTime(80, now);
      filterLfo.connect(filterLfoGain);
      filterLfoGain.connect(filter.frequency);
      filterLfo.start();

      // 3. Ambient atmospheric noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.08;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(map === 'space' ? 500 : 320, now);
      windFilter.Q.setValueAtTime(1.2, now);

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(map === 'moon' ? 0.08 : 0.2, now);

      noiseSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.ambientGain);
      noiseSource.start();

      // Connect drone oscillators
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(map === 'mars' ? 0.3 : 0.4, now);
      droneOsc1.connect(filter);
      droneOsc2.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.ambientGain);

      droneOsc1.start();
      droneOsc2.start();

      this.ambientNodes = [droneOsc1, droneOsc2, lfo, filterLfo, noiseSource];
    } catch {
      // AudioContext policy fallback
    }
  }

  public stopAmbience() {
    if (!this.isAmbientPlaying) return;
    this.ambientNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {}
    });
    this.ambientNodes = [];
    this.isAmbientPlaying = false;
  }

  // --- Sound Effects ---

  // Footstep sound with surface variation and timing control
  public playFootstep(isSprinting = false, isCrouching = false) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const minInterval = isCrouching ? 520 : isSprinting ? 260 : 380;
    const now = performance.now();
    if (now - this.lastFootstepTime < minInterval) return;
    this.lastFootstepTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Subtle pitch randomizer for organic steps
    const pitch = (isCrouching ? 70 : 90) + (Math.random() - 0.5) * 15;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCrouching ? 160 : 280, t);

    const volume = isCrouching ? 0.08 : isSprinting ? 0.28 : 0.18;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Weapon fire sounds
  public playFire(type: string) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    if (type === 'shotgun') {
      // Super Shotgun: Earth-shaking double-barrel blast + mechanical rack
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.28);
      oscGain.gain.setValueAtTime(0.9, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.25, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 1500);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1800, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(300, t + 0.2);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.32);
      noise.start(t);

      // Shotgun shell rack click at t + 0.35s
      setTimeout(() => {
        if (!this.ctx || !this.sfxGain || this.isMuted) return;
        const t2 = this.ctx.currentTime;
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(800, t2);
        clickOsc.frequency.setValueAtTime(400, t2 + 0.04);
        clickGain.gain.setValueAtTime(0.25, t2);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.08);
        clickOsc.connect(clickGain);
        clickGain.connect(this.sfxGain);
        clickOsc.start(t2);
        clickOsc.stop(t2 + 0.09);
      }, 350);
    } else if (type === 'chainsaw') {
      // Gritty chainsaw rip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.linearRampToValueAtTime(160, t + 0.08);
      osc.frequency.linearRampToValueAtTime(85, t + 0.16);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, t);
      filter.Q.setValueAtTime(4, t);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.19);
    } else if (type === 'chaingun') {
      // Rapid heavy automatic fire
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);
      oscGain.gain.setValueAtTime(0.5, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, t);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.55, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
      noise.start(t);
    } else if (type === 'plasma') {
      // High-energy electric plasma pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t);
      filter.Q.setValueAtTime(8, t);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === 'rocket') {
      // Heavy rocket ignition whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(260, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.33);
    } else if (type === 'bfg') {
      // Cataclysmic BFG launch burst
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4500, t);
      filter.Q.setValueAtTime(9, t);

      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.68);
    } else if (type === 'pistol') {
      // Punchy gunshot: Transient crack + bass thump
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      oscGain.gain.setValueAtTime(0.5, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      // Noise crack
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 800);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(800, t);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.15);
      noise.start(t);
    } else if (type === 'laser') {
      // Sci-fi high-energy laser pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1100, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.Q.setValueAtTime(6, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.21);
    } else if (type === 'melee') {
      // Fast weapon swing whoosh
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.exponentialRampToValueAtTime(900, t + 0.08);
      filter.Q.setValueAtTime(3, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    } else if (type === 'builder') {
      // Digital block placement click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.setValueAtTime(780, t + 0.03);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  // Large explosive detonation (Rocket or BFG impact)
  public playExplosion(isHuge = false) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHuge ? 90 : 130, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + (isHuge ? 0.8 : 0.45));
    oscGain.gain.setValueAtTime(isHuge ? 1.0 : 0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + (isHuge ? 0.9 : 0.5));

    const duration = isHuge ? 0.8 : 0.4;
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (isHuge ? 6000 : 3000));
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(isHuge ? 1200 : 800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, t + duration);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isHuge ? 0.9 : 0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration + 0.1);
    noise.start(t);
  }

  // BFG charge buildup whine
  public playBfgCharge() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + 0.4);
    filter.Q.setValueAtTime(5, t);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  // Combat hit feedback (enemy / target hit)
  public playHitImpact(isEnemy = true) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Fleshy / metallic impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isEnemy ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isEnemy ? 180 : 120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.09);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isEnemy ? 450 : 300, t);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Flashlight click
  public playFlashlightClick() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Two quick micro clicks
    [0, 0.03].forEach((delay) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, t + delay);
      gain.gain.setValueAtTime(0.15, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.015);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.02);
    });
  }

  // Wildlife peaceful chirp/trill
  public playWildlifeChirp() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    const baseFreq = 720 + (Math.random() - 0.5) * 80;
    osc1.frequency.setValueAtTime(baseFreq, t);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, t + 0.16);

    osc2.frequency.setValueAtTime(baseFreq * 1.5, t);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, t + 0.1);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  // Player taking damage
  public playPlayerHurt() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }
}

export const audioManager = new AudioManager();
