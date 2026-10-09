import type Phaser from 'phaser';
import { LOGICAL_W } from '../config';
import { DIALOG, dialogMaxChars } from '../data/dialogLayout';
import type { Dir } from '../data/cutscene';
import type { PortraitSpec } from '../data/portraits';
import { audio } from '../audio/AudioBus';
import { debug } from '../systems/Debug';
import { input } from '../systems/InputManager';
import { wrapText } from '../util/text';
import { addNineSlice } from './NineSlice';
import { COLORS } from './Panel';
import { PixelText } from './PixelText';

export interface DialogSpec {
  name?: string;
  text: string;
  portrait?: PortraitSpec | null;
  side: Dir;
}

const DEPTH = 31000;
const FAST_ADVANCE_MS = 110;
const FAST_FACTOR = 6;

/** Kotak dialog: potret 96x96 di dalam bingkai, nama, efek ketik 40 karakter/detik, maks. 3 baris, percepat dan lewati. */
export class DialogBox {
  private readonly parts: Phaser.GameObjects.GameObject[] = [];
  private readonly box: Phaser.GameObjects.NineSlice;
  private readonly name: PixelText;
  private readonly body: PixelText;
  private frame!: Phaser.GameObjects.Image;
  private face!: Phaser.GameObjects.Image;
  private pages: string[] = [];
  private page = 0;
  private elapsed = 0;
  private doneMs = 0;
  private resolve: (() => void) | null = null;
  private hasPortrait = false;

  constructor(scene: Phaser.Scene) {
    this.box = addNineSlice(scene, DIALOG.boxX, DIALOG.boxY, DIALOG.boxW, DIALOG.boxH, 'ui:kotak_dialog_9slice').setDepth(DEPTH).setScrollFactor(0);
    this.name = new PixelText(scene, 0, 0, '', { color: COLORS.cyan }).setDepth(DEPTH + 2).setScrollFactor(0);
    this.body = new PixelText(scene, 0, 0, '', { color: COLORS.text }).setDepth(DEPTH + 2).setScrollFactor(0);
    this.frame = scene.add.image(0, 0, 'ui:bingkai_potret').setOrigin(0, 0).setDepth(DEPTH + 1).setScrollFactor(0);
    this.face = scene.add.image(0, 0, 'portrait:A01_protagonis', 0).setOrigin(0, 0).setDepth(DEPTH + 1.5).setScrollFactor(0);
    this.parts.push(this.box, this.name, this.body, this.frame, this.face);
    for (const p of this.parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    scene.input.on('pointerdown', () => this.advance());
  }

  get active(): boolean {
    return this.resolve !== null;
  }

  /** Tampilkan satu dialog; promise selesai setelah pemain menekan lanjut (semua halaman). */
  show(spec: DialogSpec): Promise<void> {
    const portrait = spec.portrait ?? null;
    this.hasPortrait = portrait !== null;
    const maxChars = dialogMaxChars(this.hasPortrait);
    const lines = wrapText(spec.text, maxChars);
    this.pages = [];
    for (let i = 0; i < lines.length; i += DIALOG.maxLines) this.pages.push(lines.slice(i, i + DIALOG.maxLines).join('\n'));
    if (this.pages.length === 0) this.pages = [''];
    this.page = 0;
    this.layout(spec, portrait);
    this.startPage();
    for (const p of this.parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(true);
    this.frame.setVisible(portrait !== null);
    this.face.setVisible(portrait !== null);
    return new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
  }

  private layout(spec: DialogSpec, portrait: PortraitSpec | null): void {
    const right = spec.side === 'right';
    const frameSize = portrait?.kind === 'small' ? DIALOG.smallFrame : DIALOG.portraitFrame;
    const boxBottom = DIALOG.boxY + DIALOG.boxH;
    const fx = right ? LOGICAL_W - DIALOG.boxX - frameSize : DIALOG.boxX;
    const fy = boxBottom - frameSize;
    let textX = DIALOG.boxX + DIALOG.padX;
    if (portrait) {
      const inset = portrait.kind === 'small' ? 2 : 4;
      if (portrait.kind === 'portrait') {
        this.frame.setTexture(portrait.rival ? 'ui:bingkai_potret_rival' : 'ui:bingkai_potret');
        this.face.setTexture(portrait.key, portrait.frame).setCrop();
        this.face.setPosition(fx + inset, fy + inset);
      } else {
        this.frame.setTexture('ui:bingkai_potret_kecil');
        this.face.setTexture(portrait.key, portrait.frame).setCrop(16, 4, 32, 32);
        this.face.setPosition(fx + inset - 16, fy + inset - 4);
      }
      this.frame.setPosition(fx, fy);
      if (!right) textX = DIALOG.boxX + DIALOG.padX + (portrait.kind === 'small' ? DIALOG.smallFrame : DIALOG.portraitFrame) + 4;
    }
    this.name.setText(spec.name ?? '').setPosition(textX, DIALOG.boxY + DIALOG.nameY);
    this.body.setPosition(textX, DIALOG.boxY + DIALOG.textY);
  }

  private startPage(): void {
    this.elapsed = 0;
    this.doneMs = 0;
    this.body.setText('');
  }

  private get shownChars(): number {
    return Math.floor((this.elapsed / 1000) * DIALOG.charsPerSecond);
  }

  private get typing(): boolean {
    return this.shownChars < (this.pages[this.page] ?? '').length;
  }

  private advance(): void {
    if (!this.resolve) return;
    if (this.typing) {
      this.elapsed = 1e9;
      return;
    }
    if (this.page < this.pages.length - 1) {
      this.page++;
      this.startPage();
      return;
    }
    audio.sfx('ui_confirm');
    this.hide();
  }

  /** Dipanggil tiap frame render dari scene. */
  update(dtMs: number): void {
    if (!this.resolve) return;
    const frame = input.sample();
    const fast = frame.held.has('back') || debug.fast;
    this.elapsed += dtMs * (fast ? FAST_FACTOR : 1);
    const full = this.pages[this.page] ?? '';
    const shown = Math.min(full.length, this.shownChars);
    if (this.body.text.length !== shown) this.body.setText(full.slice(0, shown));
    if (frame.pressed.has('confirm') || frame.pressed.has('interact')) this.advance();
    else if (!this.typing && fast) {
      this.doneMs += dtMs;
      if (this.doneMs >= (debug.fast ? 40 : FAST_ADVANCE_MS)) this.advance();
    }
  }

  hide(): void {
    for (const p of this.parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    const r = this.resolve;
    this.resolve = null;
    r?.();
  }

  destroy(): void {
    for (const p of this.parts) p.destroy();
    this.parts.length = 0;
    this.resolve = null;
  }
}
