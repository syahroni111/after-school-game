import { describe, expect, it } from 'vitest';
import { CHARGE_SCALE, CHIP_SCALE, DEFENSE_CAP, calcDamage } from '../../src/combat/Damage';
import type { DamageInput } from '../../src/combat/Damage';
import { MOVES } from '../../src/data/moves';

const base: DamageInput = {
  base: 10,
  attackerPower: 1,
  attackerBuff: 1,
  defense: 0,
  defenderBuff: 1,
  blocked: false,
  charged: false,
};

describe('calcDamage', () => {
  it('damage dasar', () => expect(calcDamage(base)).toBe(10));
  it('power dan buff mengalikan', () => {
    expect(calcDamage({ ...base, attackerPower: 1.2 })).toBe(12);
    expect(calcDamage({ ...base, attackerBuff: 1.15 })).toBe(12); // 11.5 dibulatkan
  });
  it('Ketahanan mengurangi 2% per poin dengan batas', () => {
    expect(calcDamage({ ...base, defense: 5 })).toBe(9);
    expect(calcDamage({ ...base, defense: 999 })).toBe(Math.round(10 * (1 - DEFENSE_CAP)));
  });
  it('buff bertahan mengurangi 20%', () => expect(calcDamage({ ...base, defenderBuff: 0.8 })).toBe(8));
  it('serangan bertenaga x1,5', () =>
    expect(calcDamage({ ...base, charged: true })).toBe(Math.round(10 * CHARGE_SCALE)));
  it('ditahan: hanya damage kecil (chip), boleh 0', () => {
    expect(calcDamage({ ...base, blocked: true })).toBe(Math.round(10 * CHIP_SCALE));
    expect(calcDamage({ ...base, base: 1, blocked: true })).toBe(0);
  });
  it('kena tidak pernah kurang dari 1', () =>
    expect(calcDamage({ ...base, base: 1, defense: 999, defenderBuff: 0.1 })).toBe(1));
  it('nilai jurus: finisher dan serangan balik lebih kuat dari pukulan ringan', () => {
    expect(MOVES.heavy.damage).toBeGreaterThan(MOVES.hook.damage);
    expect(MOVES.counter.damage).toBeGreaterThan(MOVES.heavy.damage);
    expect(MOVES.jab.damage).toBeLessThan(MOVES.straight.damage);
  });
});
