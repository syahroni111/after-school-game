// Aktor cutscene/hub: sprite karakter yang digerakkan skrip. Untuk pemain di Stage dipakai FighterActor.
import type Phaser from 'phaser';
import { animSheet, hasTexture } from '../data/assetIndex';
import type { Fighter } from './Fighter';

export interface Actor {
  readonly id: string;
  readonly char: string;
  x: number;
  y: number;
  facing: 1 | -1;
  /** Mulai animasi karakter (nama dari paket aset). */
  play(anim: string, loop: boolean): void;
  animDone(): boolean;
  setPos(x: number, y: number): void;
  setFacing(f: 1 | -1): void;
  destroy(): void;
}

const ORIGIN_X = 32 / 64;
const ORIGIN_Y = 59 / 64;

/** NPC/aktor biasa: sprite dengan animasi Phaser dari manifest; otomatis memilih sheet samping atau depan-belakang. */
export class SpriteActor implements Actor {
  readonly sprite: Phaser.GameObjects.Sprite;
  facing: 1 | -1 = 1;
  private sheet: 'side' | 'fb' | 'expr' = 'side';
  x: number;
  y: number;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    readonly char: string,
    x: number,
    y: number,
    facing: 1 | -1 = 1,
  ) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.sprite = scene.add.sprite(x, y, `char:${char}:side`, 0).setOrigin(ORIGIN_X, ORIGIN_Y);
    this.setPos(x, y);
    this.setFacing(facing);
  }

  play(anim: string, loop: boolean): void {
    const sheet = animSheet(this.char, anim);
    if (!sheet) return;
    this.sheet = sheet;
    const key = `char:${this.char}:${sheet}`;
    if (!hasTexture(key)) return;
    this.sprite.setTexture(key);
    this.sprite.play({ key: `${this.char}:${anim}`, repeat: loop ? -1 : 0 }, true);
    this.sprite.setFlipX(this.sheet === 'side' && this.facing < 0);
  }

  animDone(): boolean {
    return !this.sprite.anims.isPlaying;
  }

  setPos(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(Math.floor(x), Math.floor(y)).setDepth(y);
  }

  setFacing(f: 1 | -1): void {
    this.facing = f;
    this.sprite.setFlipX(this.sheet === 'side' && f < 0);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

/** Membungkus Fighter (pemain atau musuh di Stage) agar bisa digerakkan skrip. Hanya animasi sheet samping. */
export class FighterActor implements Actor {
  constructor(
    readonly id: string,
    private readonly f: Fighter,
  ) {}
  get char(): string {
    return this.f.charKey;
  }
  get x(): number {
    return this.f.x;
  }
  set x(v: number) {
    this.f.x = v;
  }
  get y(): number {
    return this.f.y;
  }
  set y(v: number) {
    this.f.y = v;
  }
  get facing(): 1 | -1 {
    return this.f.facing;
  }
  set facing(v: 1 | -1) {
    this.f.facing = v;
  }
  play(anim: string, loop: boolean): void {
    this.f.playFree(anim, loop);
  }
  animDone(): boolean {
    return this.f.animDone;
  }
  setPos(x: number, y: number): void {
    this.f.place(x, y);
  }
  setFacing(f: 1 | -1): void {
    this.f.facing = f;
    this.f.syncView();
  }
  destroy(): void {
    /* Fighter dimiliki Stage; tidak dihancurkan oleh skrip. */
  }
}
