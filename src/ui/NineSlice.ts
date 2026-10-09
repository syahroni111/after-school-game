import type Phaser from 'phaser';
import { getImage } from '../data/assetIndex';

/** Panel 9-slice dari aset UI (inset dibaca dari manifest). */
export function addNineSlice(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  key: string,
): Phaser.GameObjects.NineSlice {
  const inset = getImage(key)?.nineSlice;
  if (!inset) throw new Error(`Aset bukan 9-slice: ${key}`);
  const [l, r, t, b] = inset;
  return scene.add.nineslice(Math.floor(x), Math.floor(y), key, undefined, w, h, l, r, t, b).setOrigin(0, 0);
}
