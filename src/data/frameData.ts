// Data frame per animasi (sumber: GDD §4.3, diverifikasi dengan pengukuran piksel sheet dan AnimViewer).
// Indeks frame RELATIF terhadap awal animasi, inklusif. Hitbox dalam koordinat lokal (titik kaki, menghadap kanan).
import { TICKS_PER_FRAME } from '../config';

export interface Box {
  x: number; // tepi kiri relatif titik kaki (positif = ke depan)
  y: number; // tepi atas relatif titik kaki (negatif = ke atas)
  w: number;
  h: number;
}

export interface FrameTiming {
  frames: number;
  active?: readonly [number, number];
  invuln?: readonly [number, number];
  parry?: readonly [number, number];
  /** Frame mulai kapan tombol berikutnya boleh memutus ke serangan lanjutan. */
  cancelFrom?: number;
  /** Pergeseran akhir (px, searah hadap); diterapkan saat animasi selesai. */
  rootMotion: number;
  /** Geser kedalaman (px) selama animasi, dipakai menghindar_samping. */
  depthShift?: number;
  hitbox?: Box;
}

/** Hurtbox standar tubuh (titik kaki). Tinggi badan sprite ±52 px, lebar tubuh ±20 px. */
export const HURTBOX: Box = { x: -10, y: -50, w: 20, h: 50 };

// Hitbox: dari depan tubuh (x=+6) sampai ujung kepalan terukur (jangkauan sprite dikurangi 32) ditambah margin 2-4 px,
// setinggi dada-bahu supaya tidak mudah meleset pada selisih kedalaman kecil.
const jab: Box = { x: 6, y: -42, w: 22, h: 22 };
const straight: Box = { x: 6, y: -42, w: 24, h: 22 };
const hook: Box = { x: 6, y: -46, w: 20, h: 28 };
const body: Box = { x: 6, y: -40, w: 25, h: 22 };
const heavy: Box = { x: 6, y: -44, w: 27, h: 24 };
const counter: Box = { x: 6, y: -42, w: 26, h: 24 };
const push: Box = { x: -34, y: -46, w: 68, h: 42 }; // hampir 360°, lebar

export const FRAME_DATA: Readonly<Record<string, FrameTiming>> = {
  pukulan_cepat: { frames: 8, active: [3, 4], cancelFrom: 5, rootMotion: 0, hitbox: jab },
  pukulan_lurus: { frames: 10, active: [4, 6], cancelFrom: 7, rootMotion: 0, hitbox: straight },
  pukulan_kait: { frames: 10, active: [4, 6], cancelFrom: 7, rootMotion: 0, hitbox: hook },
  pukulan_badan: { frames: 10, active: [4, 6], cancelFrom: 7, rootMotion: 0, hitbox: body },
  pukulan_berat: { frames: 14, active: [6, 8], rootMotion: 0, hitbox: heavy },
  serangan_balik: { frames: 12, invuln: [0, 5], active: [7, 9], rootMotion: 0, hitbox: counter },
  dorong: { frames: 10, active: [4, 6], rootMotion: 0, hitbox: push },
  tangkis: { frames: 8, parry: [2, 5], rootMotion: 0 },
  bertahan: { frames: 6, rootMotion: 0 },
  menghindar_mundur: { frames: 10, invuln: [1, 6], rootMotion: -10 },
  menghindar_samping: { frames: 10, invuln: [1, 6], rootMotion: 0, depthShift: 24 },
  maju_selangkah: { frames: 8, rootMotion: 8 },
  terhuyung: { frames: 10, rootMotion: -6 },
  terpental: { frames: 12, rootMotion: -18 },
  jatuh: { frames: 12, rootMotion: 0 },
  bangkit: { frames: 14, invuln: [0, 13], rootMotion: 0 },
  pulih: { frames: 10, rootMotion: 0 },
};

export const framesToTicks = (frames: number): number => frames * TICKS_PER_FRAME;

export function animTicks(anim: string): number {
  const t = FRAME_DATA[anim];
  return t ? framesToTicks(t.frames) : 0;
}

/** Frame animasi untuk tick ke-N sejak animasi mulai (berhenti di frame terakhir). */
export const frameAtTick = (tick: number, frames: number): number =>
  Math.min(frames - 1, Math.floor(tick / TICKS_PER_FRAME));

const within = (range: readonly [number, number] | undefined, frame: number): boolean =>
  !!range && frame >= range[0] && frame <= range[1];

export const isActiveFrame = (anim: string, frame: number): boolean =>
  within(FRAME_DATA[anim]?.active, frame);
export const isInvulnFrame = (anim: string, frame: number): boolean =>
  within(FRAME_DATA[anim]?.invuln, frame);
export const isParryFrame = (anim: string, frame: number): boolean => within(FRAME_DATA[anim]?.parry, frame);
