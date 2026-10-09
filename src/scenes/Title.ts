import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { input } from '../systems/InputManager';
import { COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { flushToasts } from '../ui/Toast';

/** Rona warna latar di belakang teks subjudul bawaan sampul (menggantikan "PIXEL ACTION ASSET PACK"). */
export const SUBTITLE_PATCH = { x: 92, y: 52, w: 296, h: 26, color: 0x16213c };

/** Layar judul: sampul 240x135 dilebarkan x2 (kelipatan bulat), subjudul game, TEKAN ENTER berkedip. */
export class Title extends Phaser.Scene {
  private prompt!: PixelText;
  private leaving = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.leaving = false;
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.add.image(0, 0, 'cover:240x135').setOrigin(0, 0).setScale(2);
    this.add.rectangle(SUBTITLE_PATCH.x, SUBTITLE_PATCH.y, SUBTITLE_PATCH.w, SUBTITLE_PATCH.h, SUBTITLE_PATCH.color).setOrigin(0, 0);
    new PixelText(this, LOGICAL_W / 2, SUBTITLE_PATCH.y + 6, 'JEJAK TIGA SEKOLAH', { color: COLORS.accent, origin: 0.5, align: 'center' }).setScale(2).setY(SUBTITLE_PATCH.y + 14);
    this.prompt = new PixelText(this, LOGICAL_W / 2, LOGICAL_H - 26, 'TEKAN ENTER', { color: COLORS.text, origin: 0.5, align: 'center' });
    new PixelText(this, 6, LOGICAL_H - 12, `V${__APP_VERSION__}`, { color: COLORS.dim });
    this.input.on('pointerdown', () => this.go());
    audio.music('judul');
    flushToasts(this);
  }

  private go(): void {
    if (this.leaving) return;
    this.leaving = true;
    audio.sfx('ui_confirm');
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('MainMenu'));
  }

  override update(time: number): void {
    this.prompt.setVisible(Math.floor(time / 500) % 2 === 0);
    const p = input.sample().pressed;
    if (p.has('confirm') || p.has('interact') || p.has('light') || p.has('pause')) this.go();
  }
}
