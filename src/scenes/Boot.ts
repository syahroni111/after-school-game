import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.add.rectangle(0, 0, LOGICAL_W, LOGICAL_H, 0x121a2e).setOrigin(0, 0);
    this.add
      .text(LOGICAL_W / 2, LOGICAL_H / 2, 'AFTER SCHOOL', { fontFamily: 'monospace', fontSize: '16px', color: '#e4e6ec' })
      .setOrigin(0.5);
  }
}
