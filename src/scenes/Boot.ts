import Phaser from 'phaser';

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
    // Sementara (diganti Title di M6): menu debug.
    this.scene.start('DebugMenu');
  }
}
