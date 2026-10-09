import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { chapterRank } from '../systems/Ranking';
import type { Rank } from '../systems/Ranking';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { COLORS, addPanel } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { formatMoney } from '../util/text';

export interface ResultRow {
  label: string;
  score: number;
  rank: Rank;
  damage: number;
  combo: number;
  seconds: number;
}

export interface ResultInit {
  title: string;
  rows: ResultRow[];
  money?: number;
  onContinue: () => void;
  onRetry?: () => void;
}

export const RANK_COLOR: Record<Rank, number> = {
  S: COLORS.gold,
  A: COLORS.good,
  B: COLORS.accent,
  C: COLORS.dim,
};

/** Layar Hasil: rank per layar dan rank bab (S/A/B/C). */
export class Result extends Phaser.Scene {
  private menu?: Menu;

  constructor() {
    super('Result');
  }

  create(data: ResultInit): void {
    this.cameras.main.setBackgroundColor(0x121a2e);
    this.cameras.main.fadeIn(250, 0, 0, 0);
    const w = 400;
    const h = 232;
    const x = (LOGICAL_W - w) / 2;
    const y = (LOGICAL_H - h) / 2;
    addPanel(this, x, y, w, h, `HASIL: ${data.title}`);

    const t = (tx: number, ty: number, str: string, color: number, origin?: number) =>
      new PixelText(this, tx, ty, str, {
        color,
        origin,
        align: origin === undefined ? 'left' : 'center',
      }).setDepth(100);
    const rows = data.rows;
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    t(x + 16, y + 28, 'LAYAR', COLORS.dim);
    t(x + 190, y + 28, 'KOMBO  WAKTU   SKOR', COLORS.dim);
    rows.forEach((r, i) => {
      const ry = y + 42 + i * 14;
      t(x + 16, ry, `${i + 1}. ${r.label}`.slice(0, 26), COLORS.text);
      new PixelText(
        this,
        x + 190,
        ry,
        `${String(r.combo).padStart(3)}   ${fmt(r.seconds)}   ${String(r.score).padStart(4)}`,
        { color: COLORS.text },
      ).setDepth(100);
      const letter = new PixelText(this, x + w - 28, ry - 1, r.rank, { color: RANK_COLOR[r.rank] })
        .setAlpha(0)
        .setDepth(100);
      this.tweens.add({ targets: letter, alpha: 1, delay: 250 + i * 160, duration: 120 });
    });

    const overall = chapterRank(rows.map((r) => r.score));
    const big = new PixelText(this, x + w - 56, y + h - 84, overall, {
      color: RANK_COLOR[overall],
      origin: 0.5,
      align: 'center',
    })
      .setScale(6)
      .setAlpha(0)
      .setDepth(100);
    new PixelText(this, x + w - 56, y + h - 48, 'RANK BAB', {
      color: COLORS.dim,
      origin: 0.5,
      align: 'center',
    }).setDepth(100);
    this.tweens.add({ targets: big, alpha: 1, delay: 400 + rows.length * 160, duration: 200 });
    if (data.money !== undefined)
      new PixelText(this, x + 16, y + h - 30, `UANG SAKU ${formatMoney(data.money)}`, {
        color: COLORS.gold,
      }).setDepth(100);

    // Scene ini berhenti dulu; callback milik scene lain (Stage/Chapter) yang memulai scene berikutnya.
    const go = (fn: () => void) => () => {
      this.scene.stop();
      fn();
    };
    const items: MenuItem[] = [{ label: 'LANJUT', onSelect: go(data.onContinue) }];
    const retry = data.onRetry;
    if (retry) items.push({ label: 'ULANGI', onSelect: go(retry) });
    this.menu = new Menu(this, { x: x + 28, y: y + h - 84, items, width: 100, onBack: go(data.onContinue) });
  }

  override update(): void {
    this.menu?.update();
  }
}
