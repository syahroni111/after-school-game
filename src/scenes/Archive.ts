import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { ARCHIVES } from '../data/archives';
import { game } from '../systems/GameState';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';

export interface ArchiveInit {
  from: string;
  fromData?: object;
}

/** Galeri Sejarah: daftar 12 halaman arsip (yang belum ditemukan tampil ???) dan pembaca teksnya. */
export class Archive extends Phaser.Scene {
  private menu!: Menu;
  private title!: PixelText;
  private body!: PixelText;
  private count!: PixelText;
  private from = 'MainMenu';
  private fromData: object = {};

  constructor() {
    super('Archive');
  }

  create(data: ArchiveInit): void {
    this.from = data.from;
    this.fromData = data.fromData ?? {};
    this.cameras.main.setBackgroundColor(0x121a2e);
    this.cameras.main.fadeIn(200, 0, 0, 0);
    const found = new Set(game.profile.archives);
    addPanel(this, 8, 8, 196, 254, 'ARSIP SEJARAH');
    addPanel(this, 212, 8, 260, 254, 'ISI ARSIP');
    this.count = new PixelText(this, 20, 246, `${found.size}/${ARCHIVES.length} DITEMUKAN`, {
      color: found.size === ARCHIVES.length ? COLORS.gold : COLORS.dim,
    }).setDepth(100);
    this.title = new PixelText(this, 226, 30, '', { color: COLORS.accent }).setDepth(100);
    this.body = new PixelText(this, 226, 50, '', { color: COLORS.text }).setDepth(100);

    const items: MenuItem[] = ARCHIVES.map((a, i) => ({
      label: found.has(a.id)
        ? `${String(i + 1).padStart(2, '0')} ${a.title}`.slice(0, 29)
        : `${String(i + 1).padStart(2, '0')} ???`,
      onSelect: () => this.show(i),
    }));
    items.push({ label: 'KEMBALI', onSelect: () => this.leave() });
    this.menu = new Menu(this, {
      x: 24,
      y: 28,
      items,
      width: 172,
      lineHeight: 16,
      depth: 110,
      onBack: () => this.leave(),
      onMove: () => this.preview(),
    });
    this.preview();
  }

  private show(i: number): void {
    const a = ARCHIVES[i];
    if (!a) return;
    if (game.profile.archives.includes(a.id)) {
      audio.sfx('ui_confirm');
      this.preview();
    }
  }

  private preview(): void {
    const a = ARCHIVES[this.menu.index];
    if (!a) {
      this.title.setText('');
      this.body.setText('');
      return;
    }
    if (game.profile.archives.includes(a.id)) {
      this.title.setText(a.title);
      this.body.setText(a.lines.join('\n'));
    } else {
      this.title.setText('???');
      this.body.setText(
        'HALAMAN INI BELUM DITEMUKAN.\nCARI PENANDA BERKEDIP DI STAGE DAN\nTEKAN E UNTUK MENGAMBILNYA.',
      );
    }
    this.count.setX(20);
  }

  private leave(): void {
    this.scene.start(this.from, this.fromData);
  }

  override update(): void {
    this.menu.update();
    this.preview();
  }
}
