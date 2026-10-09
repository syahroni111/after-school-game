// Indeks aset murni (tanpa Phaser) di atas manifest hasil generate.
import { FONT, IMAGES, SHEETS, WALK_AREA_Y } from '../generated/assetManifest';
import type { ImageEntry, SheetEntry } from '../generated/assetManifest';

export { FONT, IMAGES, SHEETS, WALK_AREA_Y };
export type { ImageEntry, SheetEntry };

const sheetByKey = new Map<string, SheetEntry>(SHEETS.map((s) => [s.key, s]));
const imageByKey = new Map<string, ImageEntry>(IMAGES.map((i) => [i.key, i]));

export const getSheet = (key: string): SheetEntry | undefined => sheetByKey.get(key);
export const getImage = (key: string): ImageEntry | undefined => imageByKey.get(key);
export const hasTexture = (key: string): boolean => sheetByKey.has(key) || imageByKey.has(key);

export const sideKey = (charKey: string): string => `char:${charKey}:side`;
export const fbKey = (charKey: string): string => `char:${charKey}:fb`;
export const exprKey = (charKey: string): string => `char:${charKey}:expr`;
export const portraitKey = (charKey: string): string => `portrait:${charKey}`;

/** Key animasi Phaser untuk sheet karakter: `{charKey}:{anim}`; sheet lain: `{sheetKey}:{anim}`. */
export function animKeyFor(sheet: SheetEntry, anim: string): string {
  const m = /^char:([^:]+):(side|fb|expr)$/.exec(sheet.key);
  return m ? `${m[1]}:${anim}` : `${sheet.key}:${anim}`;
}

/** Indeks frame (dalam sheet) untuk animasi sebuah karakter, atau undefined bila tidak ada. */
export function charAnimFrames(charKey: string, anim: string): readonly number[] | undefined {
  for (const k of [sideKey(charKey), fbKey(charKey), exprKey(charKey)]) {
    const frames = sheetByKey.get(k)?.animations[anim];
    if (frames) return frames;
  }
  return undefined;
}

export const hasCharAnim = (charKey: string, anim: string): boolean => charAnimFrames(charKey, anim) !== undefined;

export const characterKeys = (): string[] =>
  SHEETS.filter((s) => s.key.endsWith(':side')).map((s) => s.key.split(':')[1] as string);

export const stageNames = (): string[] => IMAGES.filter((i) => /^stage:[^:]+$/.test(i.key)).map((i) => i.key.slice(6));
