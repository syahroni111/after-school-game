// Nama SFX dan lagu (murni, tanpa WebAudio) agar data cerita bisa divalidasi tanpa memuat audio.
export const SFX_NAMES = [
  'swing', 'swing_heavy', 'hit_light', 'hit_mid', 'hit_heavy', 'hit_counter', 'hit_special',
  'block', 'parry', 'guard_up', 'guard_break', 'dodge', 'dash', 'land', 'ko', 'ko_boss', 'telegraph', 'charge_ready',
  'step', 'ui_move', 'ui_confirm', 'ui_back', 'money', 'unlock', 'archive', 'text', 'door', 'bell',
] as const;
export type SfxName = (typeof SFX_NAMES)[number];

export const SONG_IDS = ['judul', 'sekolah', 'tempur', 'bos', 'kilas_balik', 'festival'] as const;
export type SongId = (typeof SONG_IDS)[number];

export const isSfx = (n: string): n is SfxName => (SFX_NAMES as readonly string[]).includes(n);
export const isSong = (n: string): n is SongId => (SONG_IDS as readonly string[]).includes(n);
