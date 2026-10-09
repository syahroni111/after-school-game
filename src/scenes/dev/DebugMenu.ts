import Phaser from 'phaser';
import { LOGICAL_H } from '../../config';
import { STAGES } from '../../data/stages';
import { input } from '../../systems/InputManager';
import { COLORS } from '../../ui/Panel';
import { PixelText } from '../../ui/PixelText';
import { stageLabel } from '../../util/text';

const WEATHER_CYCLE = ['', 'cerah', 'berawan', 'hujan', 'sore', 'malam'] as const;
const ROWS = 11;
const COL_W = 224;

/** Menu debug (?scene=DebugMenu): buka stage mana pun dengan cuaca apa pun, dengan/tanpa musuh. */
export class DebugMenu extends Phaser.Scene {
  private index = 0;
  private weather = 0;
  private withEnemies = false;
  private rows: PixelText[] = [];
  private info!: PixelText;

  constructor() {
    super('DebugMenu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x121a2e);
    new PixelText(this, 8, 6, 'MENU DEBUG: PILIH STAGE', { color: COLORS.cyan });
    this.rows = STAGES.map((s, i) => {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;
      const t = new PixelText(this, 18 + col * COL_W, 26 + row * 14, stageLabel(s.id));
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.select(i));
      t.on('pointerdown', () => {
        this.select(i);
        this.open();
      });
      return t;
    });
    this.info = new PixelText(this, 8, LOGICAL_H - 40, '', { color: COLORS.gold });
    new PixelText(this, 8, LOGICAL_H - 24, 'ATAS/BAWAH PILIH  KIRI/KANAN CUACA  E MUSUH ON/OFF', {
      color: COLORS.accent,
    });
    new PixelText(this, 8, LOGICAL_H - 12, 'ENTER BUKA STAGE', { color: COLORS.accent });
    this.refresh();
  }

  private select(i: number): void {
    this.index = (i + STAGES.length) % STAGES.length;
    this.refresh();
  }

  private refresh(): void {
    this.rows.forEach((r, i) => r.setTint(i === this.index ? 0xf6f7fa : 0x84848e));
    const w = WEATHER_CYCLE[this.weather];
    this.info.setText(
      `${STAGES[this.index]?.id.toUpperCase().replace(/_/g, ' ')}  CUACA: ${w ? w.toUpperCase() : 'DASAR'}  MUSUH: ${this.withEnemies ? 'YA' : 'TIDAK'}`,
    );
  }

  private open(): void {
    const stage = STAGES[this.index]?.id;
    if (!stage) return;
    const w = WEATHER_CYCLE[this.weather];
    this.scene.start('Stage', {
      stage,
      weather: w || undefined,
      enemies: this.withEnemies ? '1' : '0',
      unlock: 'all',
    });
  }

  override update(): void {
    const p = input.sample().pressed;
    if (p.has('up')) this.select(this.index - 1);
    else if (p.has('down')) this.select(this.index + 1);
    else if (p.has('right')) {
      this.weather = (this.weather + 1) % WEATHER_CYCLE.length;
      this.refresh();
    } else if (p.has('left')) {
      this.weather = (this.weather + WEATHER_CYCLE.length - 1) % WEATHER_CYCLE.length;
      this.refresh();
    } else if (p.has('interact')) {
      this.withEnemies = !this.withEnemies;
      this.refresh();
    } else if (p.has('confirm') && !p.has('interact')) this.open();
  }
}
