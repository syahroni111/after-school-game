import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { input } from '../systems/InputManager';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addDim, addPanel } from '../ui/Panel';

export interface PauseInit {
  /** Key scene yang dijeda dan akan dilanjutkan. */
  parent: string;
  onRestart?: () => void;
  onQuit: () => void;
  onSettings?: () => void;
}

/** Menu jeda di atas scene yang dijeda. */
export class Pause extends Phaser.Scene {
  private menu!: Menu;

  constructor() {
    super('Pause');
  }

  create(data: PauseInit): void {
    input.clear();
    const w = 150;
    const h = 128;
    const x = (LOGICAL_W - w) / 2;
    const y = (LOGICAL_H - h) / 2;
    addDim(this, 0.62);
    addPanel(this, x, y, w, h, 'JEDA');

    const resume = () => {
      this.scene.stop();
      this.scene.resume(data.parent);
    };
    const items: MenuItem[] = [{ label: 'LANJUTKAN', onSelect: resume }];
    if (data.onRestart) {
      items.push({
        label: 'ULANGI LAYAR',
        onSelect: () => {
          this.scene.stop();
          data.onRestart?.();
        },
      });
    }
    if (data.onSettings) items.push({ label: 'PENGATURAN', onSelect: () => data.onSettings?.() });
    items.push({
      label: 'KELUAR',
      onSelect: () => {
        this.scene.stop();
        data.onQuit();
      },
    });
    this.menu = new Menu(this, { x: x + 22, y: y + 28, items, width: w - 36, onBack: resume });
  }

  override update(): void {
    this.menu.update();
  }
}
