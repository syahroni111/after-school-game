import Phaser from 'phaser';
import { hasTexture } from '../data/assetIndex';
import { PixelText } from '../ui/PixelText';

const FX_DEPTH = 9000;

/** Kumpulan sprite efek (impact, debu, dll.) yang dipakai ulang; tidak membuat objek baru tiap pukulan. */
export class EffectPool {
  private sprites: Phaser.GameObjects.Sprite[] = [];
  private texts: PixelText[] = [];
  private nextSprite = 0;
  private nextText = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly size = 24,
  ) {}

  play(name: string, x: number, y: number, flip = false, depth = FX_DEPTH): void {
    const key = `fx:${name}`;
    if (!hasTexture(key)) return;
    const s = this.acquireSprite();
    s.setTexture(key, 0)
      .setPosition(Math.floor(x), Math.floor(y))
      .setFlipX(flip)
      .setDepth(depth)
      .setVisible(true)
      .setActive(true)
      .setAlpha(1);
    const animKey = `${key}:main`;
    if (this.scene.anims.exists(animKey)) s.play(animKey);
  }

  private acquireSprite(): Phaser.GameObjects.Sprite {
    const free = this.sprites.find((s) => !s.active);
    if (free) return free;
    if (this.sprites.length < this.size) {
      const s = this.scene.add.sprite(0, 0, 'fx:impact_kecil').setActive(false).setVisible(false);
      s.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.setActive(false).setVisible(false));
      this.sprites.push(s);
      return s;
    }
    const s = this.sprites[this.nextSprite % this.sprites.length] as Phaser.GameObjects.Sprite;
    this.nextSprite++;
    return s;
  }

  /** Teks melayang (uang, pemulihan) yang naik lalu memudar. */
  floatText(text: string, x: number, y: number, color: number): void {
    let t = this.texts.find((e) => !e.active);
    if (!t) {
      if (this.texts.length < 12) {
        t = new PixelText(this.scene, 0, 0, '', { origin: 0.5, align: 'center' });
        this.texts.push(t);
      } else {
        t = this.texts[this.nextText++ % this.texts.length] as PixelText;
        this.scene.tweens.killTweensOf(t);
      }
    }
    const label = t
      .setText(text)
      .setTint(color)
      .setPosition(Math.floor(x), Math.floor(y))
      .setDepth(FX_DEPTH + 10)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1);
    this.scene.tweens.add({
      targets: label,
      y: Math.floor(y) - 18,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => label.setActive(false).setVisible(false),
    });
  }

  clear(): void {
    for (const s of this.sprites) s.setActive(false).setVisible(false);
    for (const t of this.texts) {
      this.scene.tweens.killTweensOf(t);
      t.setActive(false).setVisible(false);
    }
  }
}
