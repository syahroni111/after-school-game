// Menjalankan satu Cerita Sekolah dari Hub: layar tantangan, lalu kembali ke Hub dengan hasil (skrip sukses/gagal diputar di Hub).
import type Phaser from 'phaser';
import type { SideQuest } from '../data/sidequests';
import { queueToast } from '../ui/Toast';
import { HP_FLOOR_RATIO, startHp } from './Economy';
import { game } from './GameState';
import { booksComplete, completeQuest } from './Quests';
import { runner } from './ChapterRunner';
import { playSeries } from './ScreenSeries';

export interface HubQuestResult {
  id: string;
  ok: boolean;
}

export function startQuest(from: Phaser.Scene, q: SideQuest, location: string): void {
  const p = game.profile;
  p.hp = startHp(p, HP_FLOOR_RATIO);
  const back = (st: Phaser.Scene, ok: boolean): void => {
    if (ok) for (const t of completeQuest(p, q)) queueToast(t);
    runner.save();
    st.scene.start('Hub', { location, quest: { id: q.id, ok } satisfies HubQuestResult });
  };
  playSeries(from, {
    screens: q.screens,
    onComplete: (_r, st) => back(st, booksComplete(p, q)),
    onFail: (_r, st) => back(st, false),
    onQuit: (st) => st.scene.start('Hub', { location }),
  });
}
