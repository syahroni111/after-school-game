import type Phaser from 'phaser';
import { input } from '../systems/InputManager';
import { PixelText } from './PixelText';

export interface MenuItem {
  label: string | (() => string);
  onSelect?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  disabled?: boolean | (() => boolean);
}

export interface MenuOpts {
  x: number;
  y: number;
  items: MenuItem[];
  align?: 'left' | 'center';
  /** Lebar baris (untuk sorotan dan area klik). */
  width?: number;
  depth?: number;
  lineHeight?: number;
  startIndex?: number;
  onBack?: () => void;
  onMove?: () => void;
  onConfirm?: () => void;
}

const COLOR_ON = 0xf6f7fa;
const COLOR_OFF = 0x84848e;
const COLOR_DISABLED = 0x484852;
const HILITE = 0x3864b0;

/** Menu vertikal: panah/WASD, konfirmasi, kembali, dan pointer (hover memilih, klik mengonfirmasi). */
export class Menu {
  index: number;
  private readonly rows: PixelText[] = [];
  private readonly cursor: Phaser.GameObjects.Sprite;
  private readonly hilite: Phaser.GameObjects.Rectangle;
  private readonly lineHeight: number;
  private readonly width: number;
  private readonly zones: Phaser.GameObjects.Zone[] = [];
  enabled = true;

  constructor(
    scene: Phaser.Scene,
    private readonly o: MenuOpts,
  ) {
    this.lineHeight = o.lineHeight ?? 16;
    this.width = o.width ?? 140;
    this.index = o.startIndex ?? 0;
    const depth = o.depth ?? 100;
    const left = o.align === 'center' ? o.x - this.width / 2 : o.x;
    this.hilite = scene.add
      .rectangle(left, o.y, this.width, this.lineHeight - 2, HILITE, 0.55)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0);
    this.cursor = scene.add
      .sprite(left - 12, o.y, 'ui:kursor_pilih', 0)
      .setOrigin(0, 0.15)
      .setDepth(depth + 1)
      .setScrollFactor(0);
    this.cursor.play('ui:kursor_pilih:loop');
    o.items.forEach((_, i) => {
      const ty = o.y + i * this.lineHeight + 4;
      const t =
        o.align === 'center'
          ? new PixelText(scene, o.x, ty, '', { origin: 0, align: 'center' }).setOrigin(0.5, 0)
          : new PixelText(scene, left + 6, ty, '');
      t.setDepth(depth + 2).setScrollFactor(0);
      this.rows.push(t);
      const zone = scene.add
        .zone(left, o.y + i * this.lineHeight, this.width, this.lineHeight)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.hover(i));
      zone.on('pointerdown', () => {
        this.hover(i);
        this.confirm();
      });
      this.zones.push(zone);
    });
    this.refresh();
  }

  private isDisabled(i: number): boolean {
    const d = this.o.items[i]?.disabled;
    return typeof d === 'function' ? d() : !!d;
  }

  private hover(i: number): void {
    if (!this.enabled || i === this.index) return;
    this.index = i;
    this.o.onMove?.();
    this.refresh();
  }

  /** Perbarui teks dan sorotan (dipanggil otomatis tiap update). */
  refresh(): void {
    this.o.items.forEach((it, i) => {
      const label = typeof it.label === 'function' ? it.label() : it.label;
      const row = this.rows[i];
      if (!row) return;
      row.setText(label);
      row.setTint(this.isDisabled(i) ? COLOR_DISABLED : i === this.index ? COLOR_ON : COLOR_OFF);
    });
    const y = this.o.y + this.index * this.lineHeight;
    this.hilite.setY(y);
    this.cursor.setY(y + 1);
  }

  private confirm(): void {
    if (!this.enabled || this.isDisabled(this.index)) return;
    this.o.onConfirm?.();
    this.o.items[this.index]?.onSelect?.();
  }

  private move(d: number): void {
    const n = this.o.items.length;
    for (let k = 1; k <= n; k++) {
      const next = (this.index + d * k + n * k) % n;
      if (!this.isDisabled(next) || k === n) {
        this.index = next;
        break;
      }
    }
    this.o.onMove?.();
    this.refresh();
  }

  /** Panggil tiap frame dari scene.update. */
  update(): void {
    if (!this.enabled) return;
    const f = input.sample();
    const p = f.pressed;
    if (p.has('up')) this.move(-1);
    else if (p.has('down')) this.move(1);
    else if (p.has('left')) this.o.items[this.index]?.onLeft?.();
    else if (p.has('right')) this.o.items[this.index]?.onRight?.();
    else if (p.has('confirm')) this.confirm();
    else if (p.has('back')) this.o.onBack?.();
    this.refresh();
  }

  setVisible(v: boolean): void {
    this.enabled = v;
    for (const o of [this.hilite, this.cursor, ...this.rows]) o.setVisible(v);
    for (const z of this.zones) {
      if (v) z.setInteractive();
      else z.disableInteractive();
    }
  }

  destroy(): void {
    for (const o of [this.hilite, this.cursor, ...this.rows, ...this.zones]) o.destroy();
  }
}
