// Memainkan daftar layar berurutan di luar alur bab (Cerita Sekolah, Mode Bebas, Boss Rush).
import type Phaser from 'phaser';
import type { ScreenDef } from '../data/stages';
import type { ResultRow } from '../scenes/Result';
import type { StageResult } from '../scenes/Stage';

export interface SeriesOptions {
  screens: readonly ScreenDef[];
  /** Semua layar dimenangkan. */
  onComplete: (results: StageResult[], from: Phaser.Scene) => void;
  /** Satu layar kalah (KO atau aturan misi dilanggar); `retry` mengulang dari layar itu. */
  onFail: (r: StageResult, from: Phaser.Scene, retry: () => void) => void;
  onQuit: (from: Phaser.Scene) => void;
}

export function playSeries(from: Phaser.Scene, o: SeriesOptions, start = 0, done: StageResult[] = []): void {
  const screen = o.screens[start];
  if (!screen) {
    o.onComplete(done, from);
    return;
  }
  from.scene.start('Stage', {
    screen,
    onDone: (r: StageResult, st: Phaser.Scene) => {
      if (!r.win) o.onFail(r, st, () => playSeries(st, o, start, done));
      else playSeries(st, o, start + 1, [...done, r]);
    },
    onQuit: (st: Phaser.Scene) => o.onQuit(st),
  });
}

/** Baris layar Hasil dari hasil-hasil layar. */
export function resultRows(results: readonly StageResult[]): ResultRow[] {
  return results.map((r) => ({
    label: r.label,
    score: r.score,
    rank: r.rank,
    damage: r.stats.damageDealt,
    combo: r.stats.maxCombo,
    seconds: r.seconds,
  }));
}
