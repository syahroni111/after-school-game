// Menyatukan Sfx dan Music dalam satu AudioContext. Konteks dibuat/dilanjutkan setelah input pertama (aturan autoplay browser).
import { settings } from '../systems/Settings';
import { installAudio } from './AudioBus';
import { Music } from './Music';
import { Sfx } from './Sfx';

export class AudioEngine {
  ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private sfxEngine: Sfx | null = null;
  musicEngine: Music | null = null;
  private wanted: string | null = null;

  /** Pasang pendengar input pertama; aman dipanggil sekali saat boot. */
  attach(target: Window = window): void {
    const unlock = (): void => {
      this.unlock();
      if (this.ctx?.state === 'running') {
        for (const ev of ['pointerdown', 'keydown'] as const) target.removeEventListener(ev, unlock);
      }
    };
    for (const ev of ['pointerdown', 'keydown'] as const) target.addEventListener(ev, unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  private unlock(): void {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        this.ctx = ctx;
        this.musicGain = ctx.createGain();
        this.sfxGain = ctx.createGain();
        this.musicGain.connect(ctx.destination);
        this.sfxGain.connect(ctx.destination);
        this.sfxEngine = new Sfx(ctx, this.sfxGain);
        this.musicEngine = new Music(ctx, this.musicGain);
        this.applyVolumes();
      }
      if (this.ctx.state !== 'running')
        void this.ctx.resume().then(() => this.musicEngine?.play(this.wanted));
      else this.musicEngine?.play(this.wanted);
    } catch {
      // audio tidak tersedia: game tetap berjalan tanpa suara
    }
  }

  /** Terapkan volume dari pengaturan aktif (dipanggil saat boot dan saat pemain mengubahnya). */
  applyVolumes(): void {
    if (!this.musicGain || !this.sfxGain) return;
    this.musicGain.gain.value = settings.current.musicVol;
    this.sfxGain.gain.value = settings.current.sfxVol;
  }

  sfx(name: string): void {
    if (this.ctx?.state === 'running') this.sfxEngine?.play(name);
  }

  music(song: string | null): void {
    this.wanted = song;
    if (this.ctx?.state === 'running') this.musicEngine?.play(song);
  }
}

export const engine = new AudioEngine();

/** Dipanggil sekali dari main.ts. */
export function setupAudio(): void {
  installAudio({ sfx: (n) => engine.sfx(n), music: (s) => engine.music(s) });
  engine.attach();
  if (import.meta.env.DEV) (window as unknown as { __audio?: AudioEngine }).__audio = engine;
}
