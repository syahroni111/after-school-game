// Menjalankan cerita: layar demi layar di dalam bab, simpan otomatis, layar Hasil di akhir bab, lalu bab berikutnya.
import type Phaser from 'phaser';
import { CHAPTERS, chapterById } from '../data/chapters';
import type { ChapterDef } from '../data/chapters';
import type { ResultRow } from '../scenes/Result';
import type { StageResult } from '../scenes/Stage';
import { queueToast } from '../ui/Toast';
import { debug } from './Debug';
import { game } from './GameState';
import { applyScriptEffects } from './Progression';
import { betterRank, chapterRank } from './Ranking';
import { saves } from './SaveSystem';

const SAVE_FAIL = 'TIDAK BISA MENYIMPAN';

export class ChapterRunner {
  private results: StageResult[] = [];
  private retrying = false;

  /** Mulai bab baru dari awal (hasil layar bab sebelumnya dikosongkan). */
  begin(): void {
    this.results = [];
    this.retrying = false;
  }

  /** Simpan ke slot aktif. Gagal: game tetap jalan dan pemain diberi tahu. */
  save(): boolean {
    if (game.slot < 0) return true;
    const ok = saves.save(game.slot, game.profile);
    if (!ok) queueToast(SAVE_FAIL, 0xe05050);
    return ok;
  }

  /** Mainkan langkah profil saat ini (layar atau akhir bab). `from` = scene yang sedang aktif. */
  play(from: Phaser.Scene): void {
    const p = game.profile;
    const ch = chapterById(p.chapter);
    if (!ch) {
      queueToast('BERSAMBUNG... TERIMA KASIH SUDAH BERMAIN');
      from.scene.start('MainMenu');
      return;
    }
    const screen = ch.screens[p.step];
    if (!screen) {
      this.finishChapter(from, ch);
      return;
    }
    from.scene.start('Stage', {
      screen,
      skipIntro: this.retrying,
      onDone: (r: StageResult, st: Phaser.Scene) => this.onScreenDone(st, ch, r),
      onQuit: (st: Phaser.Scene) => {
        this.save();
        st.scene.start('MainMenu');
      },
    });
  }

  private onScreenDone(st: Phaser.Scene, ch: ChapterDef, r: StageResult): void {
    const p = game.profile;
    p.playMs += Math.round(r.seconds * 1000);
    if (!r.win) {
      st.scene.start('GameOver', {
        onRetry: () => {
          this.retrying = true;
          this.play(st);
        },
        onQuit: () => {
          this.save();
          st.scene.start('MainMenu');
        },
      });
      return;
    }
    this.retrying = false;
    const screen = ch.screens[p.step];
    if (screen && screen.spawns.length > 0) {
      this.results.push(r);
      p.ranks[screen.id] = betterRank(p.ranks[screen.id] as 'S' | 'A' | 'B' | 'C' | undefined, r.rank);
    }
    p.step++;
    this.save();
    this.play(st);
  }

  private finishChapter(from: Phaser.Scene, ch: ChapterDef): void {
    const p = game.profile;
    const rows: ResultRow[] = this.results.map((r) => ({
      label: r.label,
      score: r.score,
      rank: r.rank,
      damage: r.stats.damageDealt,
      combo: r.stats.maxCombo,
      seconds: r.seconds,
    }));
    if (rows.length > 0) p.ranks[ch.id] = betterRank(p.ranks[ch.id] as 'S' | 'A' | 'B' | 'C' | undefined, chapterRank(rows.map((x) => x.score)));
    p.flags[`${ch.id}_selesai`] = true;
    p.chapter = ch.next ?? 'tamat';
    p.step = 0;
    if (!ch.next) p.cleared = true;
    this.save();
    this.results = [];
    const proceed = (sc: Phaser.Scene): void => this.afterChapter(sc, ch);
    if (rows.length > 0) {
      from.scene.start('Result', { title: ch.title, rows, money: p.money, onContinue: () => proceed(from) });
    } else proceed(from);
  }

  private afterChapter(from: Phaser.Scene, ch: ChapterDef): void {
    const hubExists = from.scene.manager.keys.Hub !== undefined;
    if (ch.hub && hubExists) {
      from.scene.start('Hub');
      return;
    }
    if (!ch.next) {
      from.scene.start(from.scene.manager.keys.Credits ? 'Credits' : 'MainMenu', { ending: true });
      return;
    }
    this.play(from);
  }

  /** Alat debug (?debug=1&chapter=ch02&step=0): lompat langsung dengan efek bab sebelumnya diterapkan. */
  jumpTo(chapterId: string, step = 0): boolean {
    const target = chapterById(chapterId);
    if (!target) return false;
    for (const ch of CHAPTERS) {
      if (ch.id === chapterId) break;
      for (const s of ch.screens) for (const script of [s.before, s.during, s.after]) if (script) applyScriptEffects(game.profile, script);
      game.profile.flags[`${ch.id}_selesai`] = true;
    }
    // layar sebelum `step` pada bab tujuan
    for (const s of target.screens.slice(0, step)) for (const script of [s.before, s.during, s.after]) if (script) applyScriptEffects(game.profile, script);
    game.profile.chapter = chapterId;
    game.profile.step = step;
    if (debug.money !== undefined) game.profile.money = debug.money;
    this.begin();
    return true;
  }
}

export const runner = new ChapterRunner();

