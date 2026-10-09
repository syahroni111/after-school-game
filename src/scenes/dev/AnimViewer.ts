import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../../config';
import { characterKeys, getSheet, sideKey } from '../../data/assetIndex';
import { FRAME_DATA, HURTBOX, isActiveFrame, isInvulnFrame, isParryFrame } from '../../data/frameData';
import type { Box } from '../../data/frameData';
import { PixelText } from '../../ui/PixelText';

const SCALE = 3;
const CX = LOGICAL_W / 2;
const FRAME_TOP = 22;
const ORIGIN_X = 32;
const ORIGIN_Y = 59;
const FOOT_Y = FRAME_TOP + ORIGIN_Y * SCALE;
const SIZE = 64;

interface ViewerParams {
  char?: string;
  anim?: string;
  frame?: string;
  pause?: string;
  hit?: string;
  flip?: string;
}

/** Alat dev: memutar animasi sheet karakter, melihat nomor frame, garis tanah, dan hitbox. */
export class AnimViewer extends Phaser.Scene {
  private chars: string[] = [];
  private charIdx = 0;
  private animIdx = 0;
  private frameIdx = 0;
  private playing = true;
  private showHit = true;
  private showGrid = true;
  private flip = false;
  private elapsed = 0;
  private sprite!: Phaser.GameObjects.Sprite;
  private gfx!: Phaser.GameObjects.Graphics;
  private info!: PixelText;
  private flags!: PixelText;

  constructor() {
    super('AnimViewer');
  }

  create(data: ViewerParams): void {
    this.chars = characterKeys();
    this.charIdx = Math.max(0, this.chars.indexOf(data.char ?? 'A01_protagonis'));
    this.playing = data.pause !== '1';
    this.showHit = data.hit !== '0';
    this.flip = data.flip === '1';

    this.add.rectangle(0, 0, LOGICAL_W, LOGICAL_H, 0x1c2846).setOrigin(0, 0);
    this.gfx = this.add.graphics();
    this.sprite = this.add.sprite(CX, FOOT_Y, sideKey(this.chars[this.charIdx] as string), 0).setOrigin(ORIGIN_X / SIZE, ORIGIN_Y / SIZE).setScale(SCALE);
    this.info = new PixelText(this, 6, 4, '', { color: 0xf6f7fa });
    this.flags = new PixelText(this, 6, 46, '', { color: 0xe8c860 });
    new PixelText(this, 6, LOGICAL_H - 24, 'Q/E: KARAKTER  UP/DOWN: ANIMASI  LEFT/RIGHT: FRAME', { color: 0x86b4e8 });
    new PixelText(this, 6, LOGICAL_H - 14, 'SPASI: PUTAR/JEDA  F: BALIK  H: HITBOX  G: GRID', { color: 0x86b4e8 });

    this.setAnim(this.names().indexOf(data.anim ?? 'siap_tempur'));
    if (data.frame !== undefined) {
      this.frameIdx = Phaser.Math.Clamp(Number(data.frame), 0, this.frameList().length - 1);
      this.playing = false;
    }
    this.bindKeys();
    this.redraw();
  }

  private sheet() {
    return getSheet(sideKey(this.chars[this.charIdx] as string));
  }
  private names(): string[] {
    return Object.keys(this.sheet()?.animations ?? {});
  }
  private animName(): string {
    return this.names()[this.animIdx] ?? '';
  }
  private frameList(): readonly number[] {
    return this.sheet()?.animations[this.animName()] ?? [0];
  }

  private setAnim(idx: number): void {
    const n = this.names().length;
    this.animIdx = ((idx % n) + n) % n;
    this.frameIdx = 0;
    this.elapsed = 0;
    this.redraw();
  }

  private setChar(idx: number): void {
    const n = this.chars.length;
    const prevName = this.animName();
    this.charIdx = ((idx % n) + n) % n;
    this.sprite.setTexture(sideKey(this.chars[this.charIdx] as string));
    const keep = this.names().indexOf(prevName);
    this.setAnim(keep >= 0 ? keep : 0);
  }

  private step(d: number): void {
    const n = this.frameList().length;
    this.frameIdx = (((this.frameIdx + d) % n) + n) % n;
    this.playing = false;
    this.redraw();
  }

  private bindKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    const on = (key: string, fn: () => void) => kb.on(`keydown-${key}`, fn);
    on('Q', () => this.setChar(this.charIdx - 1));
    on('E', () => this.setChar(this.charIdx + 1));
    on('UP', () => this.setAnim(this.animIdx - 1));
    on('DOWN', () => this.setAnim(this.animIdx + 1));
    on('LEFT', () => this.step(-1));
    on('RIGHT', () => this.step(1));
    on('SPACE', () => (this.playing = !this.playing));
    on('F', () => {
      this.flip = !this.flip;
      this.redraw();
    });
    on('H', () => {
      this.showHit = !this.showHit;
      this.redraw();
    });
    on('G', () => {
      this.showGrid = !this.showGrid;
      this.redraw();
    });
  }

  override update(_time: number, delta: number): void {
    if (!this.playing) return;
    const fps = this.sheet()?.fps ?? 12;
    this.elapsed += delta;
    const n = this.frameList().length;
    const idx = Math.floor((this.elapsed / 1000) * fps) % n;
    if (idx !== this.frameIdx) {
      this.frameIdx = idx;
      this.redraw();
    }
  }

  private box(b: Box, color: number, alpha: number, filled: boolean): void {
    const x = this.flip ? CX - (b.x + b.w) * SCALE : CX + b.x * SCALE;
    const y = FOOT_Y + b.y * SCALE;
    if (filled) this.gfx.fillStyle(color, alpha).fillRect(x, y, b.w * SCALE, b.h * SCALE);
    this.gfx.lineStyle(1, color, 1).strokeRect(x + 0.5, y + 0.5, b.w * SCALE - 1, b.h * SCALE - 1);
  }

  private redraw(): void {
    const list = this.frameList();
    const anim = this.animName();
    this.sprite.setFrame(list[this.frameIdx] ?? 0).setFlipX(this.flip);
    this.gfx.clear();
    const left = CX - ORIGIN_X * SCALE;
    if (this.showGrid) {
      this.gfx.lineStyle(1, 0x34497a, 1).strokeRect(left + 0.5, FRAME_TOP + 0.5, SIZE * SCALE - 1, SIZE * SCALE - 1);
      this.gfx.lineStyle(1, 0xe8c860, 1).lineBetween(left - 40, FOOT_Y, left + SIZE * SCALE + 40, FOOT_Y); // garis tanah y=59
      this.gfx.lineStyle(1, 0x4a6296, 1).lineBetween(CX, FRAME_TOP, CX, FRAME_TOP + SIZE * SCALE); // sumbu origin x=32
    }
    const timing = FRAME_DATA[anim];
    if (this.showHit) {
      this.box(HURTBOX, 0x40c070, 0.18, true);
      if (timing?.hitbox) {
        const active = isActiveFrame(anim, this.frameIdx);
        this.box(timing.hitbox, 0xe05050, active ? 0.45 : 0, active);
      }
    }
    const fl: string[] = [];
    if (isActiveFrame(anim, this.frameIdx)) fl.push('AKTIF');
    if (isInvulnFrame(anim, this.frameIdx)) fl.push('KEBAL');
    if (isParryFrame(anim, this.frameIdx)) fl.push('TANGKIS');
    if (timing) fl.push(`ROOT ${timing.rootMotion}`);
    this.flags.setText(fl.join('  '));
    this.info.setText(
      `${this.chars[this.charIdx]}\n${anim}\nFRAME ${this.frameIdx}/${list.length - 1}  SHEET ${list[this.frameIdx] ?? 0}\n${this.playing ? 'PUTAR' : 'JEDA'}  ${this.flip ? 'KIRI' : 'KANAN'}`,
    );
  }
}
