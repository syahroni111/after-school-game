import type Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { addNineSlice } from './NineSlice';
import { PixelText } from './PixelText';

export const COLORS = {
  text: 0xf6f7fa,
  dim: 0x84848e,
  accent: 0x86b4e8,
  gold: 0xe8c860,
  good: 0x86e8a0,
  bad: 0xe05050,
  cyan: 0x3ad0d8,
} as const;

/** Latar gelap penuh layar (persegi overlay) di bawah panel/dialog. */
export function addDim(scene: Phaser.Scene, alpha = 0.6, depth = 90): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(0, 0, LOGICAL_W, LOGICAL_H, 0x000000, alpha)
    .setOrigin(0, 0)
    .setDepth(depth)
    .setScrollFactor(0);
}

/** Panel 9-slice (panel_9slice) dengan judul opsional; mengembalikan semua objek agar mudah dihapus. */
export function addPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string,
  depth = 95,
): Phaser.GameObjects.GameObject[] {
  const objs: Phaser.GameObjects.GameObject[] = [];
  objs.push(addNineSlice(scene, x, y, w, h, 'ui:panel_9slice').setDepth(depth).setScrollFactor(0));
  if (title)
    objs.push(
      new PixelText(scene, x + 12, y + 9, title, { color: COLORS.cyan })
        .setDepth(depth + 1)
        .setScrollFactor(0),
    );
  return objs;
}
