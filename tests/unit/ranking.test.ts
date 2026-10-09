import { describe, expect, it } from 'vitest';
import { betterRank, chapterRank, parSecondsFor, rankOf, scoreOf } from '../../src/systems/Ranking';
import type { RankInput } from '../../src/systems/Ranking';

const perfect: RankInput = {
  damageDealt: 400,
  enemyHpTotal: 300,
  maxCombo: 14,
  seconds: 20,
  parSeconds: 60,
  hpRatio: 1,
  hitsTaken: 0,
};
const bad: RankInput = {
  damageDealt: 300,
  enemyHpTotal: 300,
  maxCombo: 1,
  seconds: 200,
  parSeconds: 60,
  hpRatio: 0.05,
  hitsTaken: 12,
};

describe('ranking', () => {
  it('permainan sempurna mendapat S, permainan buruk C', () => {
    expect(rankOf(scoreOf(perfect))).toBe('S');
    expect(rankOf(scoreOf(bad))).toBe('C');
  });
  it('batas rank', () => {
    expect(rankOf(2300)).toBe('S');
    expect(rankOf(2299)).toBe('A');
    expect(rankOf(1700)).toBe('A');
    expect(rankOf(1699)).toBe('B');
    expect(rankOf(1100)).toBe('B');
    expect(rankOf(1099)).toBe('C');
    expect(rankOf(0)).toBe('C');
  });
  it('skor naik bila HP sisa, kombo, atau kecepatan membaik; turun bila sering kena', () => {
    const mid: RankInput = { ...perfect, hpRatio: 0.5, maxCombo: 5, seconds: 70, hitsTaken: 3 };
    const base = scoreOf(mid);
    expect(scoreOf({ ...mid, hpRatio: 0.9 })).toBeGreaterThan(base);
    expect(scoreOf({ ...mid, maxCombo: 9 })).toBeGreaterThan(base);
    expect(scoreOf({ ...mid, seconds: 40 })).toBeGreaterThan(base);
    expect(scoreOf({ ...mid, hitsTaken: 6 })).toBeLessThan(base);
  });
  it('kombo di atas batas tidak menambah skor; damage di atas total HP tidak menambah skor', () => {
    expect(scoreOf({ ...perfect, maxCombo: 50 })).toBe(scoreOf({ ...perfect, maxCombo: 12 }));
    expect(scoreOf({ ...perfect, damageDealt: 9999 })).toBe(scoreOf({ ...perfect, damageDealt: 300 }));
  });
  it('tanpa kena memberi bonus', () => {
    expect(scoreOf({ ...perfect, hitsTaken: 0 })).toBeGreaterThan(scoreOf({ ...perfect, hitsTaken: 1 }));
  });
  it('skor tidak pernah negatif dan tidak NaN pada input ekstrem', () => {
    const s = scoreOf({
      damageDealt: 0,
      enemyHpTotal: 0,
      maxCombo: 0,
      seconds: 99999,
      parSeconds: 0,
      hpRatio: -1,
      hitsTaken: 999,
    });
    expect(Number.isFinite(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
  });
  it('rank bab dari rata-rata skor; rank tertinggi disimpan', () => {
    expect(chapterRank([2800, 2800])).toBe('S');
    expect(chapterRank([2800, 200])).toBe('B');
    expect(chapterRank([])).toBe('C');
    expect(betterRank('A', 'B')).toBe('A');
    expect(betterRank('B', 'S')).toBe('S');
    expect(betterRank(undefined, 'C')).toBe('C');
  });
  it('waktu acuan bertambah menurut jumlah musuh', () => {
    expect(parSecondsFor(1)).toBeGreaterThanOrEqual(20);
    expect(parSecondsFor(6)).toBeGreaterThan(parSecondsFor(3));
  });
});
