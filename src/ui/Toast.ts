import type Phaser from 'phaser';
import { LOGICAL_W } from '../config';
import { COLORS } from './Panel';
import { PixelText } from './PixelText';

const DEPTH = 32000;
const active = new WeakMap<Phaser.Scene, Phaser.GameObjects.GameObject[][]>();

/** Pemberitahuan singkat di atas layar (mis. TIDAK BISA MENYIMPAN, JURUS BARU). Bertumpuk ke bawah. */
export function showToast(scene: Phaser.Scene, text: string, ms = 2400, color: number = COLORS.gold): void {
  const stack = active.get(scene) ?? [];
  active.set(scene, stack);
  const y = 52 + stack.length * 16;
  const label = new PixelText(scene, LOGICAL_W / 2, y + 3, text, { color, origin: 0.5, align: 'center' })
    .setDepth(DEPTH + 1)
    .setScrollFactor(0);
  const w = Math.max(60, label.width + 16);
  const bg = scene.add
    .rectangle(LOGICAL_W / 2, y + 7, w, 14, 0x121a2e, 0.88)
    .setDepth(DEPTH)
    .setScrollFactor(0);
  const group: Phaser.GameObjects.GameObject[] = [bg, label];
  stack.push(group);
  scene.tweens.add({
    targets: group,
    alpha: 0,
    delay: ms,
    duration: 350,
    onComplete: () => {
      for (const o of group) o.destroy();
      stack.splice(stack.indexOf(group), 1);
    },
  });
}

const queue: { text: string; color?: number }[] = [];

/** Antre pemberitahuan dari kode non-scene (mis. runner); ditampilkan oleh scene berikutnya lewat flushToasts. */
export function queueToast(text: string, color?: number): void {
  queue.push({ text, color });
}

export function flushToasts(scene: Phaser.Scene): void {
  for (const t of queue.splice(0)) showToast(scene, t.text, 3200, t.color);
}
