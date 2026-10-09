import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_W } from '../config';
import { chapterById } from '../data/chapters';
import { DIFFICULTIES, DIFFICULTY } from '../data/difficulty';
import type { Difficulty } from '../data/difficulty';
import { runner } from '../systems/ChapterRunner';
import { game } from '../systems/GameState';
import { newProfile } from '../systems/Profile';
import { saves } from '../systems/SaveSystem';
import type { SlotSummary } from '../systems/SaveSystem';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addDim, addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { showToast } from '../ui/Toast';
import { formatMoney } from '../util/text';

export interface SaveSelectInit {
  mode: 'new' | 'load';
}

export function chapterLabel(id: string): string {
  const ch = chapterById(id);
  if (ch) return ch.title.split(':')[0] ?? ch.title;
  return id === 'tamat' ? 'TAMAT' : id.toUpperCase();
}

export function formatPlayTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export function slotLabel(slot: number, s: SlotSummary | null): string {
  if (!s) return `SLOT ${slot + 1}   KOSONG`;
  return `SLOT ${slot + 1}   ${chapterLabel(s.chapter)}   ${formatMoney(s.money)}   ${formatPlayTime(s.playMs)}`;
}

/** Pilih slot simpan (3 slot). Mode baru: pilih kesulitan; slot terisi minta konfirmasi timpa. Mode muat: lanjutkan atau hapus. */
export class SaveSelect extends Phaser.Scene {
  private mode: 'new' | 'load' = 'new';
  private main!: Menu;
  private sub?: Menu;
  private subObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('SaveSelect');
  }

  create(data: SaveSelectInit): void {
    this.mode = data.mode;
    this.cameras.main.setBackgroundColor(0x121a2e);
    this.cameras.main.fadeIn(250, 0, 0, 0);
    addPanel(this, 40, 44, LOGICAL_W - 80, 150, this.mode === 'new' ? 'MULAI BARU: PILIH SLOT' : 'LANJUTKAN: PILIH SLOT');
    if (!saves.available) new PixelText(this, 54, 176, 'PENYIMPANAN TIDAK TERSEDIA. GAME TETAP BISA DIMAINKAN.', { color: COLORS.bad }).setDepth(100);
    this.buildMain();
  }

  private slots(): (SlotSummary | null)[] {
    return saves.summaries();
  }

  private buildMain(): void {
    const sums = this.slots();
    const items: MenuItem[] = sums.map((s, i) => ({
      label: slotLabel(i, s),
      disabled: this.mode === 'load' && !s,
      onSelect: () => this.pick(i, s),
    }));
    items.push({ label: 'KEMBALI', onSelect: () => this.scene.start('MainMenu') });
    this.main?.destroy();
    this.main = new Menu(this, { x: 66, y: 74, items, width: LOGICAL_W - 140, lineHeight: 18, depth: 110, onBack: () => this.scene.start('MainMenu'), onMove: () => audio.sfx('ui_move'), onConfirm: () => audio.sfx('ui_confirm') });
    this.main.enabled = !this.sub;
  }

  private pick(slot: number, s: SlotSummary | null): void {
    if (this.mode === 'load') {
      if (s) this.openSub(`SLOT ${slot + 1}`, [
        { label: 'LANJUTKAN', onSelect: () => this.loadSlot(slot) },
        { label: 'HAPUS SLOT', onSelect: () => this.openSub('HAPUS SLOT? TIDAK BISA DIBATALKAN', [
          { label: 'YA, HAPUS', onSelect: () => { saves.erase(slot); this.closeSub(); this.buildMain(); } },
          { label: 'BATAL', onSelect: () => this.closeSub() },
        ]) },
        { label: 'KEMBALI', onSelect: () => this.closeSub() },
      ]);
      return;
    }
    if (s) {
      this.openSub('TIMPA SLOT INI?', [
        { label: 'YA, MULAI BARU', onSelect: () => this.pickDifficulty(slot) },
        { label: 'BATAL', onSelect: () => this.closeSub() },
      ]);
    } else this.pickDifficulty(slot);
  }

  private pickDifficulty(slot: number): void {
    this.openSub('KESULITAN', [
      ...DIFFICULTIES.map((d): MenuItem => ({ label: `${DIFFICULTY[d].label}${d === 'normal' ? ' - DISARANKAN' : ''}`, onSelect: () => this.startNew(slot, d) })),
      { label: 'BATAL', onSelect: () => this.closeSub() },
    ], 1);
  }

  private startNew(slot: number, d: Difficulty): void {
    game.reset();
    game.profile = newProfile();
    game.profile.difficulty = d;
    game.slot = saves.available ? slot : -1;
    runner.begin();
    if (game.slot >= 0) saves.save(slot, game.profile);
    else showToast(this, 'TIDAK BISA MENYIMPAN', 3000, COLORS.bad);
    this.go();
  }

  private loadSlot(slot: number): void {
    const p = saves.load(slot);
    if (!p) {
      showToast(this, 'DATA SIMPAN RUSAK', 3000, COLORS.bad);
      this.closeSub();
      return;
    }
    game.reset();
    game.profile = p;
    game.slot = slot;
    runner.begin();
    this.go();
  }

  private go(): void {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => runner.play(this));
  }

  private openSub(title: string, items: MenuItem[], startIndex = 0): void {
    this.closeSub(false);
    this.main.enabled = false;
    const w = 220;
    const h = 28 + items.length * 16;
    const x = (LOGICAL_W - w) / 2;
    const y = 96;
    this.subObjs.push(addDim(this, 0.55, 120), ...addPanel(this, x, y, w, h, title, 130));
    this.sub = new Menu(this, { x: x + 20, y: y + 22, items, width: w - 34, depth: 140, startIndex, onBack: () => this.closeSub(), onMove: () => audio.sfx('ui_move'), onConfirm: () => audio.sfx('ui_confirm') });
  }

  private closeSub(rebuild = true): void {
    this.sub?.destroy();
    this.sub = undefined;
    for (const o of this.subObjs) o.destroy();
    this.subObjs = [];
    if (rebuild) this.main.enabled = true;
  }

  override update(): void {
    if (this.sub) this.sub.update();
    else this.main.update();
  }
}
