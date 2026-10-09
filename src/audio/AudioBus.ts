// Pintu tunggal ke audio. Diganti implementasi sebenarnya (Sfx.ts + Music.ts) di M9; sebelum itu tanpa suara.
export interface AudioBus {
  sfx(name: string): void;
  music(song: string | null): void;
}

export const audio: AudioBus = {
  sfx: () => undefined,
  music: () => undefined,
};

/** Dipakai M9 untuk memasang mesin audio asli. */
export function installAudio(impl: AudioBus): void {
  audio.sfx = impl.sfx;
  audio.music = impl.music;
}
