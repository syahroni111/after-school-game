import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_W } from '../config';
import { FOODS } from '../data/items';
import { runner } from '../systems/ChapterRunner';
import { buyFood, currentHp, maxHp } from '../systems/Economy';
import type { BuyFail } from '../systems/Economy';
import { game } from '../systems/GameState';
import { playerStats } from '../systems/Profile';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addDim, addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { showToast } from '../ui/Toast';
import { formatMoney } from '../util/text';

export interface ShopInit {
  from: string;
  fromData?: object;
}

const FAIL_TEXT: Record<BuyFail, string> = {
  uang: 'UANG SAKU KURANG',
  penuh: 'HP SUDAH PENUH',
  tak_dikenal: 'BARANG TIDAK ADA',
  sudah: 'EFEKNYA MASIH AKTIF',
  terkunci: 'BELUM TERSEDIA',
  cerita: 'DIDAPAT DARI CERITA',
};

/** Kantin (gaya toko River City): makanan memulihkan HP; pembelian pertama tiap jenis memberi +1 statistik permanen. */
export class Shop extends Phaser.Scene {
  private menu!: Menu;
  private status!: PixelText;
  private info!: PixelText;
  private from = 'Hub';
  private fromData: object = {};

  constructor() {
    super('Shop');
  }

  create(data: ShopInit): void {
    this.from = data.from;
    this.fromData = data.fromData ?? {};
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.add.image(0, 0, 'stage:kantin').setOrigin(0, 0).setDepth(-2);
    addDim(this, 0.55, -1);
    addPanel(this, 12, 12, 290, 160, 'KANTIN');
    addPanel(this, 310, 12, 158, 160, 'STATUS');
    addPanel(this, 12, 180, LOGICAL_W - 24, 82, 'KETERANGAN');
    this.status = new PixelText(this, 322, 30, '', { color: COLORS.text }).setDepth(100);
    this.info = new PixelText(this, 24, 198, '', { color: COLORS.text }).setDepth(100);

    const items: MenuItem[] = FOODS.map((f) => ({
      label: () => {
        const baru = game.profile.foodBought[f.id] ? '' : ' BARU!';
        return `${f.name.padEnd(13)}${formatMoney(f.price).padStart(10)}${baru}`;
      },
      onSelect: () => this.buy(f.id),
    }));
    items.push({ label: 'KEMBALI', onSelect: () => this.leave() });
    this.menu = new Menu(this, { x: 28, y: 32, items, width: 262, lineHeight: 18, depth: 110, onBack: () => this.leave(), onMove: () => audio.sfx('ui_move') });
    this.refreshText();
  }

  private buy(id: string): void {
    const r = buyFood(game.profile, id);
    if (!r.ok) {
      audio.sfx('ui_back');
      showToast(this, FAIL_TEXT[r.reason ?? 'tak_dikenal'], 1800, COLORS.bad);
      return;
    }
    audio.sfx('money');
    const parts: string[] = [];
    if (r.healed > 0) parts.push(`HP PULIH ${Math.round(r.healed)}`);
    if (r.buff) parts.push('KUAT SIAP');
    if (r.bonus) parts.push(r.bonus);
    showToast(this, parts.join('  ') || 'ENAK!', 2200, COLORS.good);
    runner.save();
  }

  private refreshText(): void {
    const p = game.profile;
    const s = playerStats(p);
    const b = p.bonus;
    this.status.setText(
      `${formatMoney(p.money)}\n\nHP ${Math.round(currentHp(p))}/${maxHp(p)}\nKEKUATAN  ${b.kekuatan}\nKETAHANAN ${b.ketahanan}\nKECEPATAN ${b.kecepatan}\nSTAMINA   ${b.stamina}\nHP MAKS   ${b.hpMaks}\n${p.buff?.kuat ? '\nBUFF: KUAT SIAP' : ''}`,
    );
    const f = FOODS[this.menu?.index ?? 0];
    if (f) {
      const first = p.foodBought[f.id] ? 'SUDAH PERNAH. TIDAK ADA BONUS LAGI.' : `PEMBELIAN PERTAMA: ${f.first.label} - PERMANEN`;
      this.info.setText(`${f.name}: ${f.effect}\n${first}\nKEKUATAN SEKARANG: ${s.power.toFixed(2)}X`);
    } else this.info.setText('KEMBALI KE SEKOLAH.');
  }

  private leave(): void {
    this.scene.start(this.from, this.fromData);
  }

  override update(): void {
    this.menu.update();
    this.refreshText();
  }
}
