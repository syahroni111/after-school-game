import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';

/** Scene awal: setelah Preload selesai, tampilkan layar uji aset sederhana (diganti Title di M6). */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.add.rectangle(0, 0, LOGICAL_W, LOGICAL_H, 0x121a2e).setOrigin(0, 0);
    if (!this.registry.get('assetsReady')) {
      this.scene.start('Preload');
      return;
    }
    this.add.image(0, 0, 'stage:halaman').setOrigin(0, 0);
    this.add.sprite(120, 220, 'char:A01_protagonis:side', 6).setOrigin(32 / 64, 59 / 64);
  }
}
