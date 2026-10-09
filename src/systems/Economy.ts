// Ekonomi (murni): beli makanan di Kantin, beli jurus di Dojo, HP yang terbawa antar layar. Mengubah Profile.
import { DOJO_MOVES } from '../data/dojo';
import { foodById } from '../data/items';
import type { Profile } from './Profile';
import { playerStats } from './Profile';
import { applyUnlock } from './Progression';
import type { MoveUnlock } from './Progression';

export type BuyFail = 'uang' | 'penuh' | 'tak_dikenal' | 'sudah' | 'terkunci' | 'cerita';

export interface BuyResult {
  ok: boolean;
  reason?: BuyFail;
  healed: number;
  /** Bonus statistik permanen yang baru didapat (pembelian pertama). */
  bonus?: string;
  buff?: 'kuat';
}

export const HP_FLOOR_RATIO = 0.7; // sisa HP minimum saat mulai bab / mengulang setelah kalah
export const HP_REGEN_RATIO = 0.25; // pemulihan antar layar setelah menang

export const maxHp = (p: Profile): number => playerStats(p).maxHp;
export const currentHp = (p: Profile): number => Math.min(p.hp ?? maxHp(p), maxHp(p));

export function buyFood(p: Profile, id: string): BuyResult {
  const f = foodById(id);
  if (!f) return { ok: false, reason: 'tak_dikenal', healed: 0 };
  if (p.money < f.price) return { ok: false, reason: 'uang', healed: 0 };
  const firstTime = !p.foodBought[f.id];
  const full = currentHp(p) >= maxHp(p);
  // Makanan pemulih tidak dijual percuma saat HP sudah penuh, kecuali masih ada bonus pertama kali.
  if (f.heal !== 0 && full && !firstTime) return { ok: false, reason: 'penuh', healed: 0 };
  if (f.buff && p.buff?.[f.buff] && !firstTime) return { ok: false, reason: 'sudah', healed: 0 };

  p.money -= f.price;
  const before = currentHp(p);
  const res: BuyResult = { ok: true, healed: 0 };
  if (firstTime) {
    p.foodBought[f.id] = true;
    p.bonus[f.first.stat] += f.first.amount;
    res.bonus = f.first.label;
  }
  const max = maxHp(p); // setelah bonus HP maks
  if (f.heal === 'penuh') p.hp = max;
  else if (f.heal > 0) p.hp = Math.min(max, before + f.heal);
  else p.hp = Math.min(max, before);
  res.healed = Math.max(0, (p.hp ?? 0) - before);
  if (f.buff) {
    p.buff = { ...(p.buff ?? {}), [f.buff]: true };
    res.buff = f.buff;
  }
  return res;
}

export function dojoStatus(p: Profile, id: MoveUnlock): 'dimiliki' | 'terkunci' | 'cerita' | 'tersedia' {
  const m = DOJO_MOVES.find((x) => x.id === id);
  if (!m) return 'terkunci';
  const owned = id === 'double' ? p.moves.doubleFinisher : p.moves[id];
  if (owned) return 'dimiliki';
  if (m.storyOnly) return 'cerita';
  if (m.requires && p.flags[m.requires] !== true) return 'terkunci';
  return 'tersedia';
}

export function buyMove(p: Profile, id: MoveUnlock): BuyResult {
  const m = DOJO_MOVES.find((x) => x.id === id);
  if (!m) return { ok: false, reason: 'tak_dikenal', healed: 0 };
  const st = dojoStatus(p, id);
  if (st === 'dimiliki') return { ok: false, reason: 'sudah', healed: 0 };
  if (st === 'terkunci') return { ok: false, reason: 'terkunci', healed: 0 };
  if (st === 'cerita') return { ok: false, reason: 'cerita', healed: 0 };
  if (p.money < m.price) return { ok: false, reason: 'uang', healed: 0 };
  p.money -= m.price;
  applyUnlock(p, `move:${id}`);
  return { ok: true, healed: 0 };
}

/** HP di awal layar: sisa HP terbawa, tidak kurang dari lantai (mencegah macet total). */
export function startHp(p: Profile, floor = 0): number {
  return Math.max(currentHp(p), Math.round(maxHp(p) * floor));
}

export function afterScreenHp(p: Profile, hp: number): number {
  const max = maxHp(p);
  return Math.min(max, Math.round(hp + max * HP_REGEN_RATIO));
}

/** Layar berikutnya: ambil buff makanan yang tersimpan (sekali pakai). */
export function consumeBuffs(p: Profile): { kuat: boolean } {
  const kuat = !!p.buff?.kuat;
  if (p.buff) p.buff = {};
  return { kuat };
}
