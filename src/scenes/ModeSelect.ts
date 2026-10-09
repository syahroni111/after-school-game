import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_W } from '../config';
import { characterName } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { bossRushScreens, freePlayScreens, playableChapters } from '../data/modes';
import type { ScreenDef } from '../data/stages';
import { runner } from '../systems/ChapterRunner';
import { game } from '../systems/GameState';
import { playSeries, resultRows } from '../systems/ScreenSeries';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addDim, addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';

export interface ModeSelectInit {
  from?: string;
  fromData?: object;
}

const TITLE_MAX = 30;

/** Mode Bebas (ulangi bab dengan tokoh pilihan) dan Boss Rush (semua bos berurutan). Terbuka setelah tamat. */
export class ModeSelect extends Phaser.Scene {
  private menu!: Menu;
  private from = 'Hub';
  private fromData: object = {};
  private chapterIdx = 0;

  constructor() {
    super('ModeSelect');
  }

  create(data: ModeSelectInit): void {
    this.from = data.from ?? this.from;
    this.fromData = data.fromData ?? this.fromData;
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.add.image(0, 0, 'stage:halaman').setOrigin(0, 0).setDepth(-2);
    addDim(this, 0.6, -1);
    addPanel(this, 60, 40, LOGICAL_W - 120, 168, 'MODE BEBAS DAN BOSS RUSH');
    new PixelText(this, 78, 190, 'TANPA UANG DAN TANPA HUKUMAN. HP PENUH DI SETIAP LAYAR.', { color: COLORS.dim }).setDepth(100);

    const chapters = playableChapters(CHAPTERS);
    const list = game.profile.unlockedChars;
    const items: MenuItem[] = [
      {
        label: () => `KARAKTER: ${characterName(game.profile.selectedChar)}`,
        onSelect: () => this.cycleChar(1),
        onLeft: () => this.cycleChar(-1),
        onRight: () => this.cycleChar(1),
        disabled: list.length < 2,
      },
      {
        label: () => `BAB: ${(chapters[this.chapterIdx]?.title ?? '').slice(0, TITLE_MAX)}`,
        onSelect: () => this.cycleChapter(chapters.length, 1),
        onLeft: () => this.cycleChapter(chapters.length, -1),
        onRight: () => this.cycleChapter(chapters.length, 1),
      },
      { label: 'MULAI MODE BEBAS', onSelect: () => this.startFree(chapters[this.chapterIdx]?.id ?? '') },
      { label: 'MULAI BOSS RUSH', onSelect: () => this.startRush() },
      { label: 'KEMBALI', onSelect: () => this.leave() },
    ];
    this.menu = new Menu(this, { x: 84, y: 66, items, width: LOGICAL_W - 168, depth: 110, onBack: () => this.leave(), onMove: () => audio.sfx('ui_move') });
  }

  private cycleChar(d: number): void {
    const list = game.profile.unlockedChars;
    const i = list.indexOf(game.profile.selectedChar);
    game.profile.selectedChar = list[(i + d + list.length) % list.length] as string;
  }

  private cycleChapter(n: number, d: number): void {
    this.chapterIdx = (this.chapterIdx + d + n) % n;
  }

  private startFree(chapterId: string): void {
    const ch = CHAPTERS.find((c) => c.id === chapterId);
    if (!ch) return;
    this.run(freePlayScreens(ch), ch.title);
  }

  private startRush(): void {
    this.run(bossRushScreens(CHAPTERS), 'BOSS RUSH');
  }

  private run(screens: ScreenDef[], title: string): void {
    const back = (sc: Phaser.Scene): void => void sc.scene.start('ModeSelect');
    playSeries(this, {
      screens,
      onComplete: (results, st) =>
        st.scene.start('Result', { title, rows: resultRows(results), money: game.profile.money, onContinue: () => back(st) }),
      onFail: (_r, st, retry) => st.scene.start('GameOver', { onRetry: retry, onQuit: () => back(st) }),
      onQuit: back,
    });
  }

  private leave(): void {
    runner.save();
    this.scene.start(this.from, this.fromData);
  }

  override update(): void {
    this.menu.update();
  }
}
