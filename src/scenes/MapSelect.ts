import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { chapterById } from '../data/chapters';
import { HUB_LOCATIONS } from '../data/hub';
import { runner } from '../systems/ChapterRunner';
import { game } from '../systems/GameState';
import { hasLocation } from '../systems/Progression';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { formatMoney } from '../util/text';

export interface MapInit {
  location?: string;
}

/** Peta Sekolah: pilih lokasi Waktu Bebas yang sudah terbuka, atau lanjutkan cerita. */
export class MapSelect extends Phaser.Scene {
  private menu!: Menu;
  private location = 'halaman';

  constructor() {
    super('MapSelect');
  }

  create(data: MapInit): void {
    this.location = data.location ?? game.profile.hubLocation ?? 'halaman';
    this.cameras.main.setBackgroundColor(0x121a2e);
    this.cameras.main.fadeIn(200, 0, 0, 0);
    addPanel(this, 60, 14, 360, 242, 'PETA SEKOLAH');
    new PixelText(this, 410, 22, formatMoney(game.profile.money), { color: COLORS.gold, origin: 1 })
      .setDepth(100)
      .setOrigin(1, 0);

    const next = chapterById(game.profile.chapter);
    const items: MenuItem[] = [
      {
        label: next ? `LANJUTKAN CERITA: ${next.title}`.slice(0, 52) : 'CERITA UTAMA TAMAT',
        disabled: !next,
        onSelect: () => {
          runner.begin();
          runner.play(this);
        },
      },
    ];
    for (const loc of HUB_LOCATIONS) {
      const open = loc.id === 'halaman' || hasLocation(game.profile, loc.id);
      items.push({
        label: open ? `${loc.label}${loc.id === this.location ? '  - DI SINI' : ''}` : '???',
        disabled: !open,
        onSelect: () => this.scene.start('Hub', { location: loc.id }),
      });
    }
    items.push({ label: 'KEMBALI', onSelect: () => this.scene.start('Hub', { location: this.location }) });
    this.menu = new Menu(this, {
      x: 80,
      y: 38,
      items,
      width: 320,
      lineHeight: 17,
      depth: 110,
      onBack: () => this.scene.start('Hub', { location: this.location }),
      onMove: () => audio.sfx('ui_move'),
      onConfirm: () => audio.sfx('ui_confirm'),
      startIndex: 1,
    });
  }

  override update(): void {
    this.menu.update();
  }
}
