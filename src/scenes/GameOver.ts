import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { Menu } from '../ui/Menu';
import { COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';

export interface GameOverInit {
  onRetry: () => void;
  onQuit: () => void;
}

/** Layar kalah: Coba Lagi / Keluar. */
export class GameOver extends Phaser.Scene {
  private menu!: Menu;

  constructor() {
    super('GameOver');
  }

  create(data: GameOverInit): void {
    this.cameras.main.setBackgroundColor(0x0a0e1a);
    this.cameras.main.fadeIn(350, 0, 0, 0);
    new PixelText(this, LOGICAL_W / 2, 64, 'KALAH...', {
      color: COLORS.bad,
      origin: 0.5,
      align: 'center',
    }).setScale(3);
    new PixelText(this, LOGICAL_W / 2, 98, 'JANGAN MENYERAH. SEKOLAH MASIH MENUNGGU.', {
      color: COLORS.dim,
      origin: 0.5,
      align: 'center',
    });
    this.menu = new Menu(this, {
      x: LOGICAL_W / 2,
      y: LOGICAL_H / 2 + 8,
      align: 'center',
      width: 120,
      items: [
        { label: 'COBA LAGI', onSelect: () => this.leave(data.onRetry) },
        { label: 'KELUAR', onSelect: () => this.leave(data.onQuit) },
      ],
    });
  }

  private leave(fn: () => void): void {
    this.menu.enabled = false;
    this.scene.stop();
    fn();
  }

  override update(): void {
    this.menu.update();
  }
}
