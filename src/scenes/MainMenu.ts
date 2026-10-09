import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { saves } from '../systems/SaveSystem';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { COLORS } from '../ui/Panel';
import { SUBTITLE_PATCH } from './Title';
import { PixelText } from '../ui/PixelText';
import { flushToasts, showToast } from '../ui/Toast';

/** Menu utama: Mulai baru, Lanjutkan, Pengaturan, Kredit. */
export class MainMenu extends Phaser.Scene {
  private menu!: Menu;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.add.image(0, 0, 'cover:240x135').setOrigin(0, 0).setScale(2);
    this.add.rectangle(SUBTITLE_PATCH.x, SUBTITLE_PATCH.y, SUBTITLE_PATCH.w, SUBTITLE_PATCH.h, SUBTITLE_PATCH.color).setOrigin(0, 0);
    new PixelText(this, LOGICAL_W / 2, SUBTITLE_PATCH.y + 14, 'JEJAK TIGA SEKOLAH', { color: COLORS.accent, origin: 0.5, align: 'center' }).setScale(2);
    this.add.rectangle(LOGICAL_W / 2 - 84, 104, 168, 82, 0x0a0e1a, 0.78).setOrigin(0, 0).setDepth(5);

    const hasSave = saves.summaries().some((s) => s !== null);
    const items: MenuItem[] = [
      { label: 'MULAI BARU', onSelect: () => this.scene.start('SaveSelect', { mode: 'new' }) },
      { label: 'LANJUTKAN', disabled: !hasSave, onSelect: () => this.scene.start('SaveSelect', { mode: 'load' }) },
      {
        label: 'PENGATURAN',
        onSelect: () => (this.scene.manager.keys.Settings ? this.scene.start('Settings', { from: 'MainMenu' }) : showToast(this, 'SEGERA HADIR')),
      },
      { label: 'KREDIT', onSelect: () => (this.scene.manager.keys.Credits ? this.scene.start('Credits', { from: 'MainMenu' }) : showToast(this, 'SEGERA HADIR')) },
    ];
    this.menu = new Menu(this, { x: LOGICAL_W / 2, y: 112, items, align: 'center', width: 140, depth: 10, onMove: () => audio.sfx('ui_move'), onConfirm: () => audio.sfx('ui_confirm') });
    if (!saves.available) new PixelText(this, LOGICAL_W / 2, LOGICAL_H - 14, 'PENYIMPANAN TIDAK TERSEDIA: PROGRES TIDAK DISIMPAN', { color: COLORS.bad, origin: 0.5, align: 'center' }).setDepth(10);
    audio.music('judul');
    flushToasts(this);
  }

  override update(): void {
    this.menu.update();
  }
}
