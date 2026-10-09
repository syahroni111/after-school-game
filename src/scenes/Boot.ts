import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { PixelText } from '../ui/PixelText';

/** Pintu masuk: memuat aset lewat Preload lalu menuju scene tujuan (?scene=NAMA untuk alat dev). */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    if (!this.registry.get('assetsReady')) {
      this.scene.start('Preload');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const target = params.get('scene');
    if (target && this.scene.get(target)) {
      this.scene.start(target, Object.fromEntries(params));
      return;
    }
    // Sementara (diganti Title di M6).
    this.add.rectangle(0, 0, LOGICAL_W, LOGICAL_H, 0x121a2e).setOrigin(0, 0);
    new PixelText(this, LOGICAL_W / 2, LOGICAL_H / 2, 'AFTER SCHOOL', {
      color: 0xf6f7fa,
      align: 'center',
      origin: 0.5,
    });
  }
}
