import Phaser from 'phaser';
import type { ScreenFxName } from '../combat/events';

export interface FxOptions {
  /** Kurangi guncangan/kilat (opsi aksesibilitas, M9). */
  reduceShake: () => boolean;
  reduceFlash: () => boolean;
}

const DEPTH = 20000;

/** Efek layar: guncangan kamera (piksel bulat), kilat, vinyet, garis fokus, gelapkan. */
export class ScreenFx {
  private shakeAmp = 0;
  private shakeMs = 0;
  private shakeTotal = 1;
  private overlay: Phaser.GameObjects.Sprite;
  private cinematic: Phaser.GameObjects.Sprite;
  private cinematicTimer = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opts: FxOptions = { reduceShake: () => false, reduceFlash: () => false },
  ) {
    this.overlay = scene.add
      .sprite(0, 0, 'fx:kilat_layar', 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setVisible(false);
    this.overlay.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.overlay.setVisible(false));
    this.cinematic = scene.add
      .sprite(0, 0, 'fx:vinyet_fokus', 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH - 1)
      .setVisible(false);
  }

  shake(amount: number): void {
    const a = this.opts.reduceShake() ? Math.floor(amount / 2) : amount;
    if (a <= 0) return;
    this.shakeAmp = Math.max(this.shakeAmp, a);
    this.shakeTotal = 100 + a * 40;
    this.shakeMs = Math.max(this.shakeMs, this.shakeTotal);
  }

  flash(alpha: number): void {
    if (this.opts.reduceFlash()) return;
    this.overlay.setTexture('fx:kilat_layar').setAlpha(alpha).setVisible(true).play('fx:kilat_layar:main');
  }

  screen(name: ScreenFxName): void {
    const map: Record<ScreenFxName, [string, number, boolean]> = {
      vinyet: ['fx:vinyet_fokus', 0.85, false],
      garis_fokus: ['fx:garis_fokus_radial', 0.8, true],
      gelapkan: ['fx:gelapkan_latar', 0.6, true],
      kilat_dramatis: ['fx:kilat_dramatis', 0.7, true],
    };
    const [key, alpha, animate] = map[name];
    if (this.opts.reduceFlash() && name === 'kilat_dramatis') return;
    this.cinematic.setTexture(key, 0).setAlpha(alpha).setVisible(true);
    if (animate) this.cinematic.play(`${key}:main`);
    this.cinematicTimer = 700;
  }

  update(deltaMs: number): void {
    const cam = this.scene.cameras.main;
    if (this.shakeMs > 0) {
      this.shakeMs -= deltaMs;
      const k = Math.max(0, this.shakeMs / this.shakeTotal);
      const amp = Math.ceil(this.shakeAmp * k);
      cam.setScroll(Phaser.Math.Between(-amp, amp), Phaser.Math.Between(-amp, amp));
      if (this.shakeMs <= 0) {
        this.shakeAmp = 0;
        cam.setScroll(0, 0);
      }
    }
    if (this.cinematicTimer > 0) {
      this.cinematicTimer -= deltaMs;
      if (this.cinematicTimer <= 0) this.cinematic.setVisible(false).anims.stop();
    }
  }

  reset(): void {
    this.shakeAmp = 0;
    this.shakeMs = 0;
    this.scene.cameras.main.setScroll(0, 0);
    this.overlay.setVisible(false);
    this.cinematic.setVisible(false);
  }
}
