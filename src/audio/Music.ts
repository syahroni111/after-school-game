// Sequencer musik chiptune: 2 pulse, 1 triangle, 1 noise. Jadwal nada disusun sedikit di depan waktu (lookahead).
import { SONGS } from './songs';
import { isSong } from './names';
import { buildTimeline, midiToHz, stepSeconds } from './songTheory';
import type { NoteEvent, SongDef, Timeline } from './songTheory';

const LOOKAHEAD_S = 0.14;
const TICK_MS = 30;
const FADE_S = 0.35;
const GATE = 0.92; // nada dilepas sedikit sebelum langkah berikutnya
const LEVEL = { p1: 0.1, p2: 0.05, tri: 0.17, noise: 0.11 } as const;

/** Gelombang pulse dengan duty tertentu lewat deret Fourier (OscillatorNode hanya punya square 50%). */
function pulseWave(ctx: AudioContext, duty: number): PeriodicWave {
  const n = 48;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}

export class Music {
  private readonly pulse25: PeriodicWave;
  private readonly pulse50: PeriodicWave;
  private readonly noise: AudioBuffer;
  private timer: number | undefined;
  private current: string | null = null;
  private song: SongDef | null = null;
  private timeline: Timeline | null = null;
  private bus: GainNode | null = null;
  private nextStep = 0;
  private nextTime = 0;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
  ) {
    this.pulse25 = pulseWave(ctx, 0.25);
    this.pulse50 = pulseWave(ctx, 0.5);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  get playing(): string | null {
    return this.current;
  }

  /** Mainkan lagu (sama dengan yang sedang main = tidak diulang). null = berhenti dengan memudar. */
  play(id: string | null): void {
    if (id === this.current) return;
    this.stopCurrent();
    this.current = id;
    if (!id || !isSong(id)) {
      this.current = null;
      return;
    }
    this.song = SONGS[id];
    this.timeline = buildTimeline(this.song);
    this.bus = this.ctx.createGain();
    this.bus.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.bus.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.15);
    this.bus.connect(this.out);
    this.nextStep = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.pump(), TICK_MS);
    this.pump();
  }

  private stopCurrent(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    const bus = this.bus;
    if (bus) {
      const t = this.ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0.0001, t + FADE_S);
      window.setTimeout(() => bus.disconnect(), (FADE_S + 0.4) * 1000);
    }
    this.bus = null;
    this.song = null;
    this.timeline = null;
  }

  private pump(): void {
    const { song, timeline, bus } = this;
    if (!song || !timeline || !bus) return;
    const step = stepSeconds(song.bpm);
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD_S) {
      const i = this.nextStep % timeline.totalSteps;
      for (const ch of ['p1', 'p2', 'tri', 'noise'] as const) {
        const ev = timeline.events[ch].get(i);
        if (ev) this.note(ch, ev, this.nextTime, step, bus);
      }
      this.nextStep++;
      this.nextTime += step;
    }
  }

  private note(
    ch: 'p1' | 'p2' | 'tri' | 'noise',
    ev: NoteEvent,
    t: number,
    step: number,
    bus: GainNode,
  ): void {
    if (ch === 'noise') return this.drum(ev.note as 'k' | 's' | 'h', t, bus);
    const ctx = this.ctx;
    const dur = ev.len * step * GATE;
    const osc = ctx.createOscillator();
    if (ch === 'tri') osc.type = 'triangle';
    else osc.setPeriodicWave(ch === 'p1' ? this.pulse25 : this.pulse50);
    osc.frequency.value = midiToHz(ev.note as number);
    if (ch === 'p2') osc.detune.value = 6;
    const g = ctx.createGain();
    const lvl = LEVEL[ch];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.006);
    g.gain.setValueAtTime(lvl, t + Math.max(0.01, dur - 0.04));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => g.disconnect();
  }

  private drum(kind: 'k' | 's' | 'h', t: number, bus: GainNode): void {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.connect(bus);
    if (kind === 'k') {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.11);
      g.gain.setValueAtTime(LEVEL.noise * 1.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.15);
      o.onended = () => g.disconnect();
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = kind === 's' ? 'bandpass' : 'highpass';
    f.frequency.value = kind === 's' ? 1900 : 7500;
    const len = kind === 's' ? 0.11 : 0.035;
    g.gain.setValueAtTime(kind === 's' ? LEVEL.noise * 1.3 : LEVEL.noise * 0.55, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g);
    src.start(t, Math.random() * 0.5);
    src.stop(t + len + 0.02);
    src.onended = () => g.disconnect();
  }
}
