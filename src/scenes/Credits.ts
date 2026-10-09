import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { audio } from '../audio/AudioBus';
import { input } from '../systems/InputManager';
import { COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';

const LINES: readonly (readonly [string, number])[] = [
  ['AFTER SCHOOL', COLORS.text],
  ['JEJAK TIGA SEKOLAH', COLORS.accent],
  ['', 0],
  ['CERITA, DESAIN, DAN PEMROGRAMAN', COLORS.cyan],
  ['DIKEMBANGKAN DENGAN CLAUDE CODE', COLORS.text],
  ['', 0],
  ['GRAFIS', COLORS.cyan],
  ['PAKET ASET PIXEL AFTER SCHOOL', COLORS.text],
  ['KARAKTER, STAGE, EFEK, DAN ANTARMUKA', COLORS.dim],
  ['', 0],
  ['AUDIO', COLORS.cyan],
  ['DISINTESIS LANGSUNG DENGAN WEBAUDIO', COLORS.text],
  ['MUSIK DAN EFEK SUARA ORISINAL', COLORS.dim],
  ['', 0],
  ['MESIN', COLORS.cyan],
  ['PHASER 3, TYPESCRIPT, VITE', COLORS.text],
  ['', 0],
  ['NORTH HALL, EAST BLOCK, DAN SOUTH COURT', COLORS.accent],
  ['ADALAH SEKOLAH DAN KOTA FIKTIF.', COLORS.dim],
  ['TIDAK ADA KEJADIAN NYATA DALAM CERITA INI.', COLORS.dim],
  ['', 0],
  ['TERIMA KASIH SUDAH BERMAIN!', COLORS.gold],
];
const SPEED = 22; // px per detik
const LINE_H = 14;

/** Kredit bergulir. Tombol apa saja untuk kembali. */
export class Credits extends Phaser.Scene {
  private texts: PixelText[] = [];
  private t = 0;
  private from = 'MainMenu';

  constructor() {
    super('Credits');
  }

  create(data: { from?: string; ending?: boolean }): void {
    this.from = data.from ?? 'MainMenu';
    this.cameras.main.setBackgroundColor(0x0a0e1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.t = 0;
    audio.music('festival');
    this.texts = LINES.map(
      ([s, c], i) =>
        new PixelText(this, LOGICAL_W / 2, LOGICAL_H + i * LINE_H, s, {
          color: c || COLORS.text,
          origin: 0.5,
          align: 'center',
        }),
    );
    this.input.on('pointerdown', () => this.leave());
  }

  private leave(): void {
    this.scene.start(this.from === 'Credits' ? 'MainMenu' : this.from);
  }

  override update(_time: number, delta: number): void {
    this.t += delta / 1000;
    const last = LINES.length - 1;
    this.texts.forEach((tx, i) => tx.setY(Math.floor(LOGICAL_H + i * LINE_H - this.t * SPEED)));
    const f = input.sample();
    const fast = f.held.has('confirm') || f.held.has('down');
    if (fast) this.t += (delta / 1000) * 2;
    if (f.pressed.has('back') || f.pressed.has('pause')) this.leave();
    if (this.texts[last] && this.texts[last].y < LOGICAL_H / 2 - 20) {
      if (this.t > (LINES.length * LINE_H + LOGICAL_H / 2) / SPEED + 3) this.leave();
    }
  }
}
