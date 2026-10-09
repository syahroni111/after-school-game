import Phaser from 'phaser';
import { IMAGES, SHEETS, animKeyFor } from '../data/assetIndex';
import { isLoopingAnim } from '../data/animMap';
import { LOGICAL_H, LOGICAL_W } from '../config';

const BAR_W = 200;
const BAR_H = 8;

export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const x = (LOGICAL_W - BAR_W) / 2;
    const y = LOGICAL_H / 2;
    this.add.rectangle(x - 2, y - 2, BAR_W + 4, BAR_H + 4, 0x27375f).setOrigin(0, 0);
    const fill = this.add.rectangle(x, y, 1, BAR_H, 0x86b4e8).setOrigin(0, 0);
    this.load.on('progress', (p: number) => fill.setSize(Math.max(1, Math.floor(BAR_W * p)), BAR_H));

    this.load.setPath('assets/');
    for (const s of SHEETS) this.load.spritesheet(s.key, s.path, { frameWidth: s.frameW, frameHeight: s.frameH });
    for (const i of IMAGES) this.load.image(i.key, i.path);
  }

  create(): void {
    this.createAnimations();
    this.registry.set('assetsReady', true);
    this.scene.start('Boot');
  }

  /** Animasi Phaser dibuat dari daftar indeks di manifest; tidak ada rentang frame manual. */
  private createAnimations(): void {
    for (const s of SHEETS) {
      for (const [anim, frames] of Object.entries(s.animations)) {
        if (s.key.startsWith('portrait:')) continue; // potret dipakai sebagai frame statis
        const key = animKeyFor(s, anim);
        if (this.anims.exists(key)) continue;
        this.anims.create({
          key,
          frames: frames.map((frame) => ({ key: s.key, frame })),
          frameRate: s.fps ?? 12,
          repeat: isLoopingAnim(anim) ? -1 : 0,
        });
      }
    }
  }
}
