import Phaser from 'phaser';
import { sideKey } from '../data/assetIndex';
import type { Fighter, FighterView } from './Fighter';

const ORIGIN_X = 32 / 64;
const ORIGIN_Y = 59 / 64;
const ICON_Y = 60;

/** Tampilan Phaser untuk Fighter: sprite sheet samping_kanan, origin di titik kaki, depth = y kaki. */
export class SpriteView implements FighterView {
  readonly sprite: Phaser.GameObjects.Sprite;
  private icon: Phaser.GameObjects.Image | null = null;
  private iconKey = '';
  private flashing = false;

  constructor(
    private readonly scene: Phaser.Scene,
    charKey: string,
    private readonly baseTint?: number,
  ) {
    this.sprite = scene.add.sprite(0, 0, sideKey(charKey), 0).setOrigin(ORIGIN_X, ORIGIN_Y);
    if (baseTint !== undefined) this.sprite.setTint(baseTint);
  }

  setFrame(sheetFrame: number): void {
    this.sprite.setFrame(sheetFrame);
  }
  setPos(x: number, y: number): void {
    this.sprite.setPosition(x, y).setDepth(y);
    this.icon?.setPosition(x, y - ICON_Y).setDepth(y + 1);
  }
  setFlipX(flip: boolean): void {
    this.sprite.setFlipX(flip);
  }
  setAlpha(alpha: number): void {
    this.sprite.setAlpha(alpha);
    this.icon?.setAlpha(alpha);
  }
  setFlash(on: boolean): void {
    if (on === this.flashing) return;
    this.flashing = on;
    if (on) this.sprite.setTintFill(0xffffff);
    else if (this.baseTint !== undefined) this.sprite.setTint(this.baseTint);
    else this.sprite.clearTint();
  }

  /** Ikon status di atas kepala (pusing, marah, kuat, bertahan, lelah). */
  updateStatus(f: Fighter): void {
    const key =
      f.state === 'dizzy'
        ? 'ui:status_pusing'
        : f.status.marah
          ? 'ui:status_marah'
          : f.status.kuat > 0
            ? 'ui:status_kuat'
            : f.status.bertahan > 0
              ? 'ui:status_bertahan'
              : f.team !== 'enemy' && f.tired && f.state !== 'ko'
                ? 'ui:status_lelah'
                : '';
    if (key === this.iconKey) return;
    this.iconKey = key;
    if (!key) {
      this.icon?.setVisible(false);
      return;
    }
    if (!this.icon) this.icon = this.scene.add.image(f.x, f.y - ICON_Y, key);
    this.icon.setTexture(key).setVisible(true);
  }

  destroy(): void {
    this.sprite.destroy();
    this.icon?.destroy();
  }
}
