import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_W } from '../config';
import { DOJO_MOVES, SPARRING_REWARD } from '../data/dojo';
import type { ScreenDef } from '../data/stages';
import { runner } from '../systems/ChapterRunner';
import { buyMove, dojoStatus } from '../systems/Economy';
import type { BuyFail } from '../systems/Economy';
import { game } from '../systems/GameState';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addDim, addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { showToast } from '../ui/Toast';
import { formatMoney } from '../util/text';
import type { StageResult } from './Stage';

export interface DojoInit {
  from: string;
  fromData?: object;
}

const FAIL_TEXT: Partial<Record<BuyFail, string>> = {
  uang: 'UANG SAKU KURANG',
  terkunci: 'SELESAIKAN BAB SEBELUMNYA DULU',
  cerita: 'JURUS INI DIDAPAT DARI CERITA',
  sudah: 'SUDAH DIKUASAI',
};

const spar = (char: 'gilang' | 'bima', label: string): ScreenDef => ({
  id: `latih_${char}`,
  stage: 'gimnasium',
  label,
  spawns: [{ enemy: char, side: 'right', boss: true }],
  noMoney: true,
  free: true,
  practice: true,
  music: 'tempur',
});

/** Dojo Gilang: beli jurus dengan Rp (dibuka per bab) dan latih tanding tanpa risiko. */
export class Dojo extends Phaser.Scene {
  private menu!: Menu;
  private info!: PixelText;
  private from = 'Hub';
  private fromData: object = {};

  constructor() {
    super('Dojo');
  }

  create(data: DojoInit): void {
    this.from = data.from;
    this.fromData = data.fromData ?? {};
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.add.image(0, 0, 'stage:gimnasium').setOrigin(0, 0).setDepth(-2);
    addDim(this, 0.55, -1);
    addPanel(this, 12, 12, LOGICAL_W - 24, 168, 'DOJO GILANG');
    addPanel(this, 12, 188, LOGICAL_W - 24, 74, 'KETERANGAN');
    this.info = new PixelText(this, 24, 206, '', { color: COLORS.text }).setDepth(100);

    const items: MenuItem[] = DOJO_MOVES.map((m) => ({
      label: () => {
        const st = dojoStatus(game.profile, m.id);
        const tag = st === 'dimiliki' ? 'DIKUASAI' : st === 'terkunci' ? 'TERKUNCI' : st === 'cerita' ? 'DARI CERITA' : formatMoney(m.price);
        return `${m.label.padEnd(27)}${tag.padStart(13)}`;
      },
      onSelect: () => this.buy(m.id),
    }));
    items.push({ label: 'LATIH TANDING: GILANG', onSelect: () => this.practice('gilang', 'LATIH TANDING GILANG') });
    items.push({ label: 'LATIH TANDING: BIMA', onSelect: () => this.practice('bima', 'LATIH TANDING BIMA') });
    items.push({ label: 'KEMBALI', onSelect: () => this.leave() });
    this.menu = new Menu(this, { x: 28, y: 32, items, width: LOGICAL_W - 56, lineHeight: 16, depth: 110, onBack: () => this.leave(), onMove: () => audio.sfx('ui_move') });
  }

  private buy(id: (typeof DOJO_MOVES)[number]['id']): void {
    const r = buyMove(game.profile, id);
    if (!r.ok) {
      audio.sfx('ui_back');
      showToast(this, FAIL_TEXT[r.reason ?? 'sudah'] ?? 'TIDAK BISA', 2000, COLORS.bad);
      return;
    }
    audio.sfx('unlock');
    showToast(this, 'JURUS BARU DIKUASAI!', 2400, COLORS.good);
    runner.save();
  }

  private practice(char: 'gilang' | 'bima', label: string): void {
    const screen = spar(char, label);
    const back = (st: Phaser.Scene) => st.scene.start('Dojo', { from: this.from, fromData: this.fromData });
    this.scene.start('Stage', {
      screen,
      onDone: (r: StageResult, st: Phaser.Scene) => {
        const key = `sparring_${game.profile.chapter}`;
        if (r.win && game.profile.flags[key] !== true) {
          game.profile.flags[key] = true;
          const gain = Math.round((SPARRING_REWARD[0] + SPARRING_REWARD[1]) / 2);
          game.profile.money += gain;
          runner.save();
        }
        back(st);
      },
      onQuit: back,
    });
  }

  private leave(): void {
    this.scene.start(this.from, this.fromData);
  }

  override update(): void {
    this.menu.update();
    const m = DOJO_MOVES[this.menu.index];
    this.info.setText(
      m
        ? `${m.desc}\nUANG SAKU: ${formatMoney(game.profile.money)}`
        : this.menu.index === DOJO_MOVES.length || this.menu.index === DOJO_MOVES.length + 1
          ? 'LATIH TANDING TANPA RISIKO.\nHADIAH UANG KECIL SEKALI PER BAB.'
          : 'KEMBALI KE SEKOLAH.',
    );
  }
}
