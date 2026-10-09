// Mode Bebas dan Boss Rush (GDD §7): layar bab dimainkan ulang tanpa cerita, dengan tokoh pilihan pemain. Murni.
import { enemyDef } from './enemies';
import type { ChapterDef } from './chapters/types';
import type { ScreenDef } from './stages';

const STRIP: Partial<ScreenDef> = {
  free: true,
  practice: true,
  noMoney: true,
  before: undefined,
  during: undefined,
  after: undefined,
  allyArga: false,
  duet: false,
  escort: undefined,
  pickups: undefined,
  playerChar: undefined,
  playerName: undefined,
  cutsceneOnly: false,
  crowd: undefined,
  filter: undefined,
};

/** Layar bertarung sebuah bab, tanpa cutscene, hadiah, dan sekutu. */
export function freePlayScreens(ch: ChapterDef): ScreenDef[] {
  return ch.screens.filter((s) => s.spawns.length > 0).map((s) => ({ ...s, ...STRIP, id: `bebas_${s.id}` }));
}

/** Bab yang punya pertarungan (cutscene murni tidak masuk daftar Mode Bebas). */
export const playableChapters = (all: readonly ChapterDef[]): ChapterDef[] =>
  all.filter((c) => freePlayScreens(c).length > 0);

/** Semua bos cerita berurutan, satu bos per layar, HP penuh di setiap layar. */
export function bossRushScreens(all: readonly ChapterDef[]): ScreenDef[] {
  const out: ScreenDef[] = [];
  for (const ch of all) {
    for (const s of ch.screens) {
      const bosses = s.spawns.filter((sp) => sp.boss);
      for (const b of bosses) {
        out.push({
          ...s,
          ...STRIP,
          id: `rush_${s.id}_${b.enemy}`,
          label: enemyDef(b.enemy).name,
          spawns: [b],
          music: 'bos',
        });
      }
    }
  }
  return out;
}
