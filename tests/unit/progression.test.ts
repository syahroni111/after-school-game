import { describe, expect, it } from 'vitest';
import { say } from '../../src/data/cutscene';
import { CHAPTERS } from '../../src/data/chapters';
import { applyScriptEffects, applyUnlock, isValidUnlock, parseUnlock } from '../../src/systems/Progression';
import { newProfile, playerStats } from '../../src/systems/Profile';

describe('unlock', () => {
  it('membuka jurus, karakter, lokasi, misi, dan mode; hanya memberi toast saat benar-benar baru', () => {
    const p = newProfile();
    expect(applyUnlock(p, 'move:counter')).toMatchObject({ ok: true, changed: true });
    expect(p.moves.counter).toBe(true);
    expect(applyUnlock(p, 'move:counter')).toMatchObject({ ok: true, changed: false, toast: '' });
    expect(applyUnlock(p, 'move:double').changed).toBe(true);
    expect(p.moves.doubleFinisher).toBe(true);
    expect(applyUnlock(p, 'char:A02_sahabat').toast).toContain('DIMAS');
    expect(p.unlockedChars).toEqual(['A01_protagonis', 'A02_sahabat']);
    applyUnlock(p, 'location:kantin');
    expect(p.flags.loc_kantin).toBe(true);
    applyUnlock(p, 'quest:buku_hilang');
    expect(p.sideQuests.buku_hilang).toBe('aktif');
    applyUnlock(p, 'mode:bebas');
    expect(p.cleared).toBe(true);
  });
  it('unlock tidak valid ditolak', () => {
    const p = newProfile();
    for (const w of ['', 'move', 'move:terbang', 'char:C03_kutu_buku', 'dunia:x', 'location:']) {
      expect(isValidUnlock(w), w).toBe(false);
      expect(applyUnlock(p, w).ok, w).toBe(false);
    }
    expect(parseUnlock('move:badan')).toEqual({ kind: 'move', id: 'badan' });
  });
});

describe('applyScriptEffects', () => {
  it('menerapkan flag, unlock, uang, arsip, dan memilih cabang ifFlag', () => {
    const p = newProfile();
    applyScriptEffects(p, [
      { c: 'setFlag', key: 'a' },
      { c: 'giveMoney', amount: 700 },
      { c: 'giveArchive', id: 'arsip_1' },
      { c: 'giveArchive', id: 'arsip_1' },
      { c: 'unlock', what: 'move:badan' },
      { c: 'ifFlag', key: 'a', then: [{ c: 'setFlag', key: 'cabang_then' }], else: [{ c: 'setFlag', key: 'cabang_else' }] },
      say('A01_protagonis', 'HALO'),
    ]);
    expect(p.flags).toMatchObject({ a: true, cabang_then: true });
    expect(p.flags.cabang_else).toBeUndefined();
    expect(p.money).toBe(700);
    expect(p.archives).toEqual(['arsip_1']);
    expect(p.moves.badan).toBe(true);
  });
  it('menerapkan semua bab sebelum Bab 1 menghasilkan profil yang konsisten (flag Prolog)', () => {
    const p = newProfile();
    for (const s of CHAPTERS[0]?.screens ?? []) for (const sc of [s.before, s.during, s.after]) if (sc) applyScriptEffects(p, sc);
    expect(p.flags.prolog_selesai).toBe(true);
    expect(p.flags.kenal_dimas).toBe(true);
  });
});

describe('statistik pemain', () => {
  it('bonus permanen dari Kantin ditambahkan ke statistik dasar', () => {
    const p = newProfile();
    p.bonus = { kekuatan: 2, ketahanan: 3, kecepatan: 1, stamina: 5, hpMaks: 10 };
    const s = playerStats(p);
    expect(s.maxHp).toBe(110);
    expect(s.maxStamina).toBe(105);
    expect(s.power).toBeCloseTo(1.08, 5);
    expect(s.defense).toBe(3);
    expect(s.speed).toBeCloseTo(1.03, 5);
  });
  it('Dimas kuat dan lambat, Bayu cepat', () => {
    const p = newProfile();
    const raka = playerStats(p, 'A01_protagonis');
    const dimas = playerStats(p, 'A02_sahabat');
    const bayu = playerStats(p, 'A08_petarung_cepat');
    expect(dimas.maxHp).toBeGreaterThan(raka.maxHp);
    expect(dimas.speed).toBeLessThan(raka.speed);
    expect(bayu.speed).toBeGreaterThan(raka.speed);
  });
});
