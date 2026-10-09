// Mesin efek suara: sintesis langsung dengan WebAudio dari resep di sfxRecipes.ts. Tanpa berkas audio.
import { SFX_RECIPES } from './sfxRecipes';
import type { SfxRecipe } from './sfxRecipes';
import { isSfx } from './names';

const MAX_VOICES = 20;
const MIN_REPEAT_S = 0.03; // efek yang sama dalam jeda sangat singkat dibuang (hindari tumpukan)

export class Sfx {
  private noise: AudioBuffer;
  private voices = 0;
  private last = new Map<string, number>();

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
  ) {
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  play(name: string): void {
    if (!isSfx(name)) return;
    const now = this.ctx.currentTime;
    if (now - (this.last.get(name) ?? -1) < MIN_REPEAT_S || this.voices >= MAX_VOICES) return;
    this.last.set(name, now);
    this.voice(SFX_RECIPES[name], now, 1);
    for (const [at, mult] of SFX_RECIPES[name].arp ?? []) this.voice(SFX_RECIPES[name], now + at, mult);
  }

  private voice(r: SfxRecipe, t0: number, mult: number): void {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    const attack = r.attack ?? 0.004;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(r.vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + r.dur);
    gain.connect(this.out);
    const stop = t0 + r.dur + 0.02;
    this.voices++;
    const nodes: AudioScheduledSourceNode[] = [];

    if (r.f0 > 0) {
      const osc = ctx.createOscillator();
      osc.type = r.wave === 'saw' ? 'sawtooth' : r.wave;
      osc.frequency.setValueAtTime(r.f0 * mult, t0);
      if (r.f1 !== r.f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, r.f1 * mult), t0 + r.dur);
      if (r.vibrato) {
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = r.vibrato[0];
        depth.gain.value = r.vibrato[1];
        lfo.connect(depth).connect(osc.frequency);
        lfo.start(t0);
        lfo.stop(stop);
        nodes.push(lfo);
      }
      const level = ctx.createGain();
      level.gain.value = 1 - (r.noise ?? 0) * 0.5;
      osc.connect(level).connect(gain);
      osc.start(t0);
      osc.stop(stop);
      nodes.push(osc);
    }
    if (r.noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = r.noiseHz ?? 2000;
      filter.Q.value = 0.8;
      const level = ctx.createGain();
      level.gain.value = r.noise * 1.4;
      src.connect(filter).connect(level).connect(gain);
      src.start(t0, Math.random() * 0.5);
      src.stop(stop);
      nodes.push(src);
    }
    const end = nodes[0];
    if (end)
      end.onended = () => {
        this.voices = Math.max(0, this.voices - 1);
        gain.disconnect();
      };
    else this.voices--;
  }
}
