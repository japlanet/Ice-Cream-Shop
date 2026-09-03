/**
 * All sound in the shop, synthesised with Web Audio so nothing has to be
 * downloaded and it all works offline.
 *
 * Effects: a soft plop for each scoop (rising as the stack grows), a sparkle
 * for toppings, a counter bell when an order goes out, a happy "yum" for a
 * pleased customer, a gentle "hmm" when something is not quite right, and a
 * fanfare for a new reward. The background tune is an original, slow
 * music-box waltz, scheduled a little ahead of time so it never stutters.
 *
 * iOS only allows audio to start inside a user gesture, so `unlock()` is
 * called from the first press.
 */

type Osc = OscillatorType;

interface ToneOptions {
  freq: number;
  freqEnd?: number;
  type?: Osc;
  duration: number;
  start?: number;
  gain?: number;
  attack?: number;
  lowpass?: number;
  vibrato?: number;
  dest?: AudioNode;
}

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private unlocked = false;

  sfxEnabled = true;
  musicEnabled = true;

  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private step = 0;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      this.sfxGain = ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(master);
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(master);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.ctx = ctx;
      return ctx;
    } catch {
      return null;
    }
  }

  /** Call from a user gesture. Creates and resumes the context, starts music if wanted. */
  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    void ctx.resume();
    this.unlocked = true;
    if (this.musicEnabled) this.startMusic();
  }

  setHidden(hidden: boolean): void {
    if (!this.ctx || !this.unlocked) return;
    if (hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  private tone(o: ToneOptions): void {
    const ctx = this.ctx;
    const dest = o.dest ?? this.sfxGain;
    if (!ctx || !dest) return;
    const t0 = ctx.currentTime + (o.start ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + o.duration);
    const attack = o.attack ?? 0.01;
    const peak = o.gain ?? 0.2;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration);
    let node: AudioNode = osc;
    if (o.lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = o.lowpass;
      node.connect(lp);
      node = lp;
    }
    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = o.vibrato;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + o.duration + 0.05);
    }
    node.connect(gain);
    gain.connect(dest);
    osc.start(t0);
    osc.stop(t0 + o.duration + 0.05);
  }

  private burst(duration: number, start: number, gain: number, filterFreq: number, type: BiquadFilterType = "lowpass"): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.sfxGain) return;
    const t0 = ctx.currentTime + start;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  private bell(freq: number, start: number, duration: number, gain: number, dest?: AudioNode): void {
    this.tone({ freq, duration, start, gain, attack: 0.004, dest });
    this.tone({ freq: freq * 2.76, duration: duration * 0.45, start, gain: gain * 0.25, attack: 0.004, dest });
    this.tone({ freq: freq * 5.4, duration: duration * 0.2, start, gain: gain * 0.08, attack: 0.002, dest });
  }

  private marimba(freq: number, at: number, duration: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const start = at - ctx.currentTime;
    this.tone({ freq, duration, start, gain, attack: 0.005, lowpass: 2600, dest: this.musicGain });
    this.tone({ freq: freq * 3.9, duration: duration * 0.35, start, gain: gain * 0.12, attack: 0.003, dest: this.musicGain });
  }

  private guard(): boolean {
    return this.sfxEnabled && !!this.ctx;
  }

  // Effects
  // -----------------------------------------------------------------------

  /** A button tap. */
  playTick(): void {
    if (!this.guard()) return;
    this.tone({ freq: 900, freqEnd: 700, duration: 0.05, gain: 0.08, attack: 0.003 });
  }

  /** A cone or cup landing on the counter. */
  playCone(): void {
    if (!this.guard()) return;
    this.tone({ freq: 320, freqEnd: 180, type: "triangle", duration: 0.12, gain: 0.2, attack: 0.004 });
    this.burst(0.05, 0, 0.12, 1500);
  }

  /** A scoop plopping on. Pitch rises with each scoop of the stack. */
  playScoop(i: number): void {
    if (!this.guard()) return;
    const f = 330 * Math.pow(2, Math.min(i, 3) * 3 / 12);
    this.tone({ freq: f * 0.7, freqEnd: f, type: "sine", duration: 0.16, gain: 0.26, attack: 0.008 });
    this.burst(0.04, 0.02, 0.08, 900);
  }

  /** A topping going on: a little sparkle. */
  playTopping(): void {
    if (!this.guard()) return;
    [88, 92, 95, 100].forEach((m, i) => this.bell(midiHz(m), i * 0.045, 0.25, 0.1));
  }

  /** The counter bell when an order goes out. */
  playBell(): void {
    if (!this.guard()) return;
    this.bell(midiHz(93), 0, 0.9, 0.22);
    this.bell(midiHz(97), 0.12, 0.8, 0.14);
  }

  /** A happy customer: a bright, rising three-note "yum". */
  playYum(): void {
    if (!this.guard()) return;
    [72, 76, 79].forEach((m, i) => this.bell(midiHz(m), i * 0.1, 0.45, 0.18));
    this.bell(midiHz(84), 0.32, 0.7, 0.2);
    for (const m of [72, 76, 79]) this.tone({ freq: midiHz(m), type: "triangle", duration: 0.8, start: 0.34, gain: 0.05, attack: 0.05 });
  }

  /** Not quite right: a soft, low "hmm" wobble. Never harsh. */
  playHmm(): void {
    if (!this.guard()) return;
    this.tone({ freq: 260, freqEnd: 230, type: "triangle", duration: 0.18, gain: 0.14, attack: 0.02, vibrato: 6 });
    this.tone({ freq: 230, freqEnd: 250, type: "triangle", duration: 0.22, start: 0.2, gain: 0.14, attack: 0.02, vibrato: 6 });
  }

  /** That cannot go there: a quiet double boop. */
  playNope(): void {
    if (!this.guard()) return;
    this.tone({ freq: 220, freqEnd: 180, type: "triangle", duration: 0.1, gain: 0.12, attack: 0.01 });
    this.tone({ freq: 190, freqEnd: 150, type: "triangle", duration: 0.14, start: 0.11, gain: 0.12, attack: 0.01 });
  }

  /** The door: a two-note shop chime as a friend comes in. */
  playDoor(): void {
    if (!this.guard()) return;
    this.bell(midiHz(88), 0, 0.5, 0.14);
    this.bell(midiHz(84), 0.18, 0.7, 0.14);
  }

  /** A friend leaving: a soft descending whoosh. */
  playBye(): void {
    if (!this.guard()) return;
    this.burst(0.3, 0, 0.06, 900, "bandpass");
    this.tone({ freq: 700, freqEnd: 300, type: "sine", duration: 0.3, gain: 0.05, attack: 0.03 });
  }

  /** Something new for the shop! A fanfare. */
  playReward(): void {
    if (!this.guard()) return;
    const notes = [72, 76, 79, 84, 79, 84, 88];
    notes.forEach((m, i) => this.bell(midiHz(m), i * 0.11, 0.5, 0.22));
    for (const m of [72, 76, 79, 84]) this.tone({ freq: midiHz(m), type: "triangle", duration: 1.2, start: 0.8, gain: 0.07, attack: 0.05 });
    this.tone({ freq: midiHz(96), duration: 1.2, start: 0.85, gain: 0.04, attack: 0.1 });
  }

  // -----------------------------------------------------------------------
  // Background tune
  // -----------------------------------------------------------------------

  setMusic(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (enabled && this.unlocked) this.startMusic();
    if (!enabled) this.stopMusic();
  }

  private startMusic(): void {
    const ctx = this.ensure();
    if (!ctx || this.musicTimer) return;
    this.step = 0;
    this.nextStepTime = ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.schedule(), 90);
  }

  stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextStepTime < ctx.currentTime + 0.3) {
      this.playStep(this.step % TUNE_STEPS, this.nextStepTime);
      this.step += 1;
      this.nextStepTime += STEP;
    }
  }

  private playStep(i: number, at: number): void {
    const melody = MELODY[i];
    if (melody) this.marimba(midiHz(melody), at, 0.7, 0.22);
    const bar = Math.floor(i / 6);
    const inBar = i % 6;
    const chord = CHORDS[bar % CHORDS.length];
    // Waltz: a low root on the first beat, two soft chord taps after it.
    if (inBar === 0) this.marimba(midiHz(chord.root - 12), at, 0.9, 0.18);
    if (inBar === 2 || inBar === 4) {
      this.marimba(midiHz(chord.root + chord.third), at, 0.35, 0.06);
      this.marimba(midiHz(chord.root + 7), at, 0.35, 0.06);
    }
  }
}

// A slow waltz at 96 beats per minute on an eighth-note grid (six steps a bar),
// eight bars long. An original tune with a music-box feel.
const STEP = 60 / 96 / 2;
const TUNE_STEPS = 48;
const MELODY: number[] = [
  76, 0, 79, 0, 84, 0,
  83, 0, 79, 0, 76, 0,
  77, 0, 81, 0, 86, 0,
  84, 0, 81, 0, 77, 0,
  76, 0, 79, 0, 84, 0,
  88, 0, 86, 0, 84, 0,
  83, 0, 81, 79, 77, 0,
  76, 0, 0, 0, 0, 0,
];
/** root as MIDI note, third as semitones above the root (4 major, 3 minor). */
const CHORDS = [
  { root: 60, third: 4 }, // C
  { root: 55, third: 4 }, // G
  { root: 53, third: 4 }, // F
  { root: 53, third: 4 }, // F
  { root: 60, third: 4 }, // C
  { root: 57, third: 3 }, // Am
  { root: 55, third: 4 }, // G
  { root: 60, third: 4 }, // C
];

export const audio = new AudioEngine();
