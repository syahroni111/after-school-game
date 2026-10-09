import Phaser from 'phaser';
import { FONT } from '../data/assetIndex';
import { LINE_HEIGHT, sanitizeText } from '../util/text';

export const PIXEL_FONT = 'pixel';

/** Mendaftarkan bitmap font dari font_piksel_5x7 (sel 6x7: glyph 5 px + 1 px jarak). Panggil sekali. */
export function registerPixelFont(scene: Phaser.Scene): void {
  if (scene.cache.bitmapFont.exists(PIXEL_FONT)) return;
  const config: Phaser.Types.GameObjects.BitmapText.RetroFontConfig = {
    image: FONT.key,
    width: FONT.advance,
    height: FONT.glyphH,
    chars: FONT.chars,
    charsPerRow: FONT.chars.length,
    'offset.x': 0,
    'offset.y': 0,
    'spacing.x': 0,
    'spacing.y': 0,
    lineSpacing: LINE_HEIGHT - FONT.glyphH,
  };
  scene.cache.bitmapFont.add(PIXEL_FONT, Phaser.GameObjects.RetroFont.Parse(scene, config));
}

export interface PixelTextOptions {
  color?: number;
  align?: 'left' | 'center' | 'right';
  origin?: number;
}

const ALIGN = { left: 0, center: 1, right: 2 } as const;

/** Teks piksel: otomatis kapital, karakter tak dikenal diganti spasi. Posisi akhir dibulatkan. */
export class PixelText extends Phaser.GameObjects.BitmapText {
  constructor(scene: Phaser.Scene, x: number, y: number, text: string, opts: PixelTextOptions = {}) {
    super(
      scene,
      Math.floor(x),
      Math.floor(y),
      PIXEL_FONT,
      sanitizeText(text),
      undefined,
      ALIGN[opts.align ?? 'left'],
    );
    scene.add.existing(this);
    if (opts.color !== undefined) this.setTint(opts.color);
    if (opts.origin !== undefined) this.setOrigin(opts.origin);
  }

  override setText(value: string | string[]): this {
    const clean = Array.isArray(value) ? value.map(sanitizeText) : sanitizeText(String(value));
    return super.setText(clean);
  }
}
