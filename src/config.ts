// Konstanta dan fungsi murni (tanpa import Phaser) supaya bisa diuji di Node.
export const LOGICAL_W = 480;
export const LOGICAL_H = 270;
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

/** Zoom bulat: kelipatan integer terbesar yang muat di jendela (minimum 1). */
export function computeZoom(innerWidth: number, innerHeight: number): number {
  return Math.max(1, Math.floor(Math.min(innerWidth / LOGICAL_W, innerHeight / LOGICAL_H)));
}

/** Animasi karakter berjalan 12 fps; satu frame animasi = 5 tick logika (60 Hz). */
export const ANIM_FPS = 12;
export const TICKS_PER_FRAME = TICK_HZ / ANIM_FPS;
