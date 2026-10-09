import type Phaser from 'phaser';
import { LOGICAL_W } from '../config';
import type { School } from '../data/characters';
import { formatMoney } from '../util/text';
import { PixelText } from './PixelText';

const DEPTH = 30000;
const BAR_W = 96;
const BAR_H = 10;
const STRIP_H = 44;

export interface HudTarget {
  name: string;
  school: School;
  ratio: number;
  boss: boolean;
}

export interface HudState {
  name: string;
  school: School;
  hp: number;
  maxHp: number;
  tempHp: number;
  stamina: number;
  maxStamina: number;
  money: number;
  combo: number;
  statuses: readonly string[];
  target: HudTarget | null;
  /** Teks tambahan di tengah atas (WAKTU, KENA, KAWAL). */
  extra?: string;
}

const SCHOOL_KEY: Record<School, string> = {
  north: 'north_hall',
  east: 'east_block',
  south: 'south_court',
  staff: 'north_hall',
};
const STATUS_KEYS = ['pusing', 'lelah', 'marah', 'kuat', 'bertahan'] as const;

/** HUD pertarungan: bar HP dan stamina pemain, bar musuh/bos, uang, kombo, ikon status. */
export class Hud {
  private readonly parts: Phaser.GameObjects.GameObject[] = [];
  private hpFill: Phaser.GameObjects.Image;
  private hpTemp: Phaser.GameObjects.Image;
  private staFill: Phaser.GameObjects.Image;
  private enemyFill: Phaser.GameObjects.Image;
  private name: PixelText;
  private money: PixelText;
  private combo: PixelText;
  private enemyName: PixelText;
  private bossTag: PixelText;
  private emblem: Phaser.GameObjects.Image;
  private enemyEmblem: Phaser.GameObjects.Image;
  private plate: Phaser.GameObjects.Image;
  private statusIcons: Phaser.GameObjects.Image[] = [];
  private enemyGroup: Phaser.GameObjects.GameObject[] = [];
  private comboShown = 0;
  private extra!: PixelText;
  private hidden = false;

  constructor(private readonly scene: Phaser.Scene) {
    const img = (x: number, y: number, key: string, group?: Phaser.GameObjects.GameObject[]) => {
      const o = scene.add.image(x, y, key).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH);
      this.parts.push(o);
      group?.push(o);
      return o;
    };
    const strip = scene.add
      .rectangle(0, 0, LOGICAL_W, STRIP_H, 0x121a2e, 0.62)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH - 1);
    this.parts.push(strip);

    // Pemain (kiri)
    img(4, 4, 'ui:bingkai_potret_kecil');
    this.emblem = img(6, 6, 'ui:emblem_north_hall');
    img(44, 6, 'ui:bar_kosong');
    this.hpTemp = img(44, 6, 'ui:bar_kesehatan_rival');
    this.hpFill = img(44, 6, 'ui:bar_kesehatan');
    img(44, 18, 'ui:bar_kosong');
    this.staFill = img(44, 18, 'ui:bar_stamina');
    this.name = this.text(44, 31, '', 0xf6f7fa);
    this.combo = this.text(6, 50, '', 0xe8c860);
    this.extra = this.text(LOGICAL_W / 2, 6, '', 0xf6f7fa);
    this.extra.setOrigin(0.5, 0);
    this.money = this.text(112, 31, '', 0xe8c860);
    for (let i = 0; i < STATUS_KEYS.length; i++) {
      const s = scene.add
        .image(44 + i * 17, 42, `ui:status_${STATUS_KEYS[i]}`)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH)
        .setVisible(false);
      this.statusIcons.push(s);
      this.parts.push(s);
    }

    // Musuh/bos (kanan)
    const g = this.enemyGroup;
    img(LOGICAL_W - 40, 4, 'ui:bingkai_potret_kecil', g);
    this.enemyEmblem = img(LOGICAL_W - 38, 6, 'ui:emblem_east_block', g);
    img(LOGICAL_W - 44 - BAR_W, 6, 'ui:bar_kosong', g);
    this.enemyFill = img(LOGICAL_W - 44 - BAR_W, 6, 'ui:bar_kesehatan_rival', g);
    this.plate = img(LOGICAL_W - 44 - 75, 18, 'ui:papan_nama_east_block', g);
    this.enemyName = this.text(LOGICAL_W - 44, 33, '', 0xf6f7fa);
    this.enemyName.setOrigin(1, 0);
    this.bossTag = this.text(LOGICAL_W - 44 - BAR_W, 33, 'BOS', 0xe05050);
    for (const o of [this.enemyName, this.bossTag]) g.push(o);
    this.setEnemyVisible(false);
  }

  private text(x: number, y: number, s: string, color: number): PixelText {
    const t = new PixelText(this.scene, x, y, s, { color }).setScrollFactor(0).setDepth(DEPTH);
    this.parts.push(t);
    return t;
  }

  private setEnemyVisible(v: boolean): void {
    for (const o of this.enemyGroup) (o as Phaser.GameObjects.Image).setVisible(v);
  }

  private static crop(img: Phaser.GameObjects.Image, ratio: number): void {
    const w = Math.round(BAR_W * Math.min(1, Math.max(0, ratio)));
    img.setVisible(w > 0);
    if (w > 0) img.setCrop(0, 0, w, BAR_H);
  }

  update(s: HudState): void {
    if (this.hidden) return;
    this.name.setText(s.name);
    this.emblem.setTexture(`ui:emblem_${SCHOOL_KEY[s.school]}`);
    Hud.crop(this.hpFill, s.hp / s.maxHp);
    const hpW = Math.round(BAR_W * Math.min(1, s.hp / s.maxHp));
    const tempW = Math.round(BAR_W * Math.min(1, (s.hp + s.tempHp) / s.maxHp)) - hpW;
    this.hpTemp.setVisible(s.tempHp > 0 && tempW > 0);
    if (s.tempHp > 0 && tempW > 0) this.hpTemp.setCrop(hpW, 0, tempW, BAR_H);
    Hud.crop(this.staFill, s.stamina / s.maxStamina);
    this.money.setText(formatMoney(s.money));
    this.extra.setText(s.extra ?? '');

    if (s.combo !== this.comboShown) {
      this.comboShown = s.combo;
      this.combo.setText(s.combo >= 2 ? `KOMBO ${s.combo}` : '');
    }
    STATUS_KEYS.forEach((k, i) => this.statusIcons[i]?.setVisible(s.statuses.includes(k)));

    const t = s.target;
    this.setEnemyVisible(!!t);
    if (t) {
      Hud.crop(this.enemyFill, t.ratio);
      this.enemyName.setText(t.name);
      this.enemyEmblem.setTexture(`ui:emblem_${SCHOOL_KEY[t.school]}`);
      this.plate.setTexture(`ui:papan_nama_${SCHOOL_KEY[t.school]}`);
      this.bossTag.setVisible(t.boss);
    }
  }

  setVisible(v: boolean): void {
    this.hidden = !v;
    for (const p of this.parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(v);
    if (v) this.comboShown = -1; // paksa gambar ulang teks kombo
  }

  destroy(): void {
    for (const p of this.parts) p.destroy();
    this.parts.length = 0;
  }
}
