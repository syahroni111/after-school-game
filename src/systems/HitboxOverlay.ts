// Garis kotak hit/hurt untuk opsi "tampilkan kotak" (Pengaturan) dan sandbox. Hanya garis dan persegi (CLAUDE.md §8).
import type Phaser from 'phaser';
import type { Fighter } from '../entities/Fighter';

export function drawHitboxes(g: Phaser.GameObjects.Graphics, fighters: readonly Fighter[]): void {
  g.clear();
  for (const f of fighters) {
    if (f.removed) continue;
    const h = f.hurtbox();
    g.lineStyle(1, 0x40c070, 1).strokeRect(Math.floor(h.x) + 0.5, Math.floor(h.y) + 0.5, h.w, h.h);
    g.lineStyle(1, 0xe8c860, 0.6).lineBetween(
      Math.floor(f.x) - 6,
      Math.floor(f.y),
      Math.floor(f.x) + 6,
      Math.floor(f.y),
    );
    const a = f.activeHit();
    if (a) {
      g.fillStyle(0xe05050, 0.45).fillRect(Math.floor(a.rect.x), Math.floor(a.rect.y), a.rect.w, a.rect.h);
      g.lineStyle(1, 0xe05050, 1).strokeRect(
        Math.floor(a.rect.x) + 0.5,
        Math.floor(a.rect.y) + 0.5,
        a.rect.w,
        a.rect.h,
      );
    }
  }
}
