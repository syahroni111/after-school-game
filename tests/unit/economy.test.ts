import { describe, expect, it } from 'vitest';
import { FOODS } from '../../src/data/items';
import { DOJO_MOVES } from '../../src/data/dojo';
import { afterScreenHp, buyFood, buyMove, consumeBuffs, currentHp, dojoStatus, maxHp, startHp } from '../../src/systems/Economy';
import { newProfile, playerStats } from '../../src/systems/Profile';

const rich = () => {
  const p = newProfile();
  p.money = 100_000;
  return p;
};

describe('Kantin', () => {
  it('pembelian pertama memberi bonus permanen, berikutnya tidak', () => {
    const p = rich();
    p.hp = 50;
    const first = buyFood(p, 'gorengan');
    expect(first).toMatchObject({ ok: true, bonus: 'KEKUATAN NAIK 1' });
    expect(p.bonus.kekuatan).toBe(1);
    expect(p.money).toBe(99_000);
    p.hp = 50;
    const second = buyFood(p, 'gorengan');
    expect(second.ok).toBe(true);
    expect(second.bonus).toBeUndefined();
    expect(p.bonus.kekuatan).toBe(1);
  });
  it('bonus tiap makanan sesuai GDD §6', () => {
    const p = rich();
    p.hp = 10;
    for (const f of FOODS) buyFood(p, f.id);
    expect(p.bonus).toEqual({ kekuatan: 1, stamina: 5, ketahanan: 1, hpMaks: 10, kecepatan: 1 });
    expect(playerStats(p).maxHp).toBe(110);
    expect(playerStats(p).maxStamina).toBe(105);
  });
  it('pemulihan HP sesuai makanan dan tidak melebihi HP maksimum', () => {
    const p = rich();
    p.hp = 10;
    expect(buyFood(p, 'gorengan').healed).toBe(15);
    expect(currentHp(p)).toBe(25);
    p.hp = 95;
    buyFood(p, 'roti_bakar'); // +40 tetapi dibatasi maksimum
    expect(currentHp(p)).toBe(maxHp(p));
    p.hp = 5;
    buyFood(p, 'nasi_goreng');
    expect(currentHp(p)).toBe(maxHp(p));
  });
  it('uang kurang ditolak tanpa mengubah apa pun', () => {
    const p = newProfile();
    p.money = 500;
    p.hp = 50;
    const r = buyFood(p, 'gorengan');
    expect(r).toMatchObject({ ok: false, reason: 'uang' });
    expect(p.money).toBe(500);
    expect(p.bonus.kekuatan).toBe(0);
    expect(p.foodBought.gorengan).toBeUndefined();
  });
  it('makanan pemulih tidak dijual saat HP penuh, kecuali untuk bonus pertama', () => {
    const p = rich();
    expect(buyFood(p, 'gorengan').ok).toBe(true); // pertama: bonus meski HP penuh
    expect(buyFood(p, 'gorengan')).toMatchObject({ ok: false, reason: 'penuh' });
    expect(p.money).toBe(99_000);
  });
  it('susu kotak memberi buff Kuat sekali pakai untuk layar berikutnya', () => {
    const p = rich();
    expect(buyFood(p, 'susu_kotak')).toMatchObject({ ok: true, buff: 'kuat', bonus: 'KECEPATAN NAIK 1' });
    expect(buyFood(p, 'susu_kotak')).toMatchObject({ ok: false, reason: 'sudah' });
    expect(consumeBuffs(p)).toEqual({ kuat: true });
    expect(consumeBuffs(p)).toEqual({ kuat: false });
  });
  it('makanan tak dikenal ditolak', () => {
    expect(buyFood(rich(), 'pizza').reason).toBe('tak_dikenal');
  });
});

describe('Dojo', () => {
  it('jurus terkunci sampai bab sebelumnya selesai, lalu bisa dibeli dan tersimpan', () => {
    const p = rich();
    expect(dojoStatus(p, 'badan')).toBe('terkunci');
    expect(buyMove(p, 'badan')).toMatchObject({ ok: false, reason: 'terkunci' });
    p.flags.ch01_selesai = true;
    expect(dojoStatus(p, 'badan')).toBe('tersedia');
    expect(buyMove(p, 'badan').ok).toBe(true);
    expect(p.moves.badan).toBe(true);
    expect(p.money).toBe(96_000);
    expect(dojoStatus(p, 'badan')).toBe('dimiliki');
    expect(buyMove(p, 'badan')).toMatchObject({ ok: false, reason: 'sudah' });
  });
  it('Kombo Finisher Ganda mengubah flag moves.doubleFinisher', () => {
    const p = rich();
    p.flags.ch03_selesai = true;
    expect(buyMove(p, 'double').ok).toBe(true);
    expect(p.moves.doubleFinisher).toBe(true);
    expect(p.money).toBe(88_000);
  });
  it('jurus cerita tidak bisa dibeli; uang kurang ditolak', () => {
    const p = rich();
    expect(buyMove(p, 'push')).toMatchObject({ ok: false, reason: 'cerita' });
    expect(buyMove(p, 'counter')).toMatchObject({ ok: false, reason: 'cerita' });
    const q = newProfile();
    q.flags.ch02_selesai = true;
    expect(buyMove(q, 'dash')).toMatchObject({ ok: false, reason: 'uang' });
  });
  it('harga sesuai GDD', () => {
    const price = Object.fromEntries(DOJO_MOVES.map((m) => [m.id, m.price]));
    expect(price).toMatchObject({ badan: 4000, dash: 6000, double: 12000 });
  });
});

describe('HP terbawa antar layar', () => {
  it('startHp memakai sisa HP tetapi tidak di bawah lantai', () => {
    const p = newProfile();
    expect(startHp(p)).toBe(100);
    p.hp = 20;
    expect(startHp(p)).toBe(20);
    expect(startHp(p, 0.7)).toBe(70);
    p.hp = 90;
    expect(startHp(p, 0.7)).toBe(90);
  });
  it('pemulihan antar layar +25% dari maksimum', () => {
    const p = newProfile();
    expect(afterScreenHp(p, 30)).toBe(55);
    expect(afterScreenHp(p, 90)).toBe(100);
  });
});
