// Skala layar: zoom selalu bilangan bulat (CLAUDE.md §5). Pengaturan "2X/3X/4X" dibatasi oleh zoom terbesar yang muat.
import type Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W, computeZoom } from '../config';
import type { ScaleSetting } from './Settings';

/** Zoom yang dipakai untuk jendela dan pengaturan tertentu (murni). */
export function chooseZoom(innerWidth: number, innerHeight: number, scale: ScaleSetting): number {
  const max = computeZoom(innerWidth, innerHeight);
  return scale === 'auto' ? max : Math.max(1, Math.min(max, Number(scale)));
}

export function applyDisplay(game: Phaser.Game, host: HTMLElement, scale: ScaleSetting): void {
  const zoom = chooseZoom(window.innerWidth, window.innerHeight, scale);
  host.style.width = `${LOGICAL_W * zoom}px`;
  host.style.height = `${LOGICAL_H * zoom}px`;
  game.scale.refresh();
}
