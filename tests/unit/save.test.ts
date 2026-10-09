import { describe, expect, it } from 'vitest';
import { newProfile } from '../../src/systems/Profile';
import { SAVE_KEY, SETTINGS_KEY, SLOT_COUNT, SaveSystem, migrateProfile } from '../../src/systems/SaveSystem';
import type { StorageLike } from '../../src/systems/SaveSystem';
import { defaultSettings, migrateSettings } from '../../src/systems/Settings';

class MemStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const throwing: StorageLike = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
  removeItem() {
    throw new Error('SecurityError');
  },
};

describe('SaveSystem', () => {
  it('menyimpan dan memuat profil di slot yang benar', () => {
    const s = new SaveSystem(new MemStorage());
    const p = newProfile();
    p.money = 4200;
    p.chapter = 'ch01';
    p.step = 2;
    p.flags.sudah_kenal_dimas = true;
    expect(s.save(1, p)).toBe(true);
    expect(s.load(1)).toMatchObject({
      money: 4200,
      chapter: 'ch01',
      step: 2,
      flags: { sudah_kenal_dimas: true },
    });
    expect(s.load(0)).toBeNull();
    expect(s.load(2)).toBeNull();
  });
  it('memakai key yang sesuai spesifikasi', () => {
    const mem = new MemStorage();
    new SaveSystem(mem).save(2, newProfile());
    expect([...mem.data.keys()]).toEqual(['afterschool.save.v1.2']);
    expect(SAVE_KEY(0)).toBe('afterschool.save.v1.0');
    expect(SETTINGS_KEY).toBe('afterschool.settings.v1');
  });
  it('ringkasan 3 slot, kosong = null', () => {
    const s = new SaveSystem(new MemStorage());
    s.save(0, { ...newProfile(), money: 10 });
    const sum = s.summaries();
    expect(sum).toHaveLength(SLOT_COUNT);
    expect(sum[0]?.money).toBe(10);
    expect(sum[1]).toBeNull();
  });
  it('hapus slot', () => {
    const s = new SaveSystem(new MemStorage());
    s.save(0, newProfile());
    s.erase(0);
    expect(s.load(0)).toBeNull();
  });
  it('data rusak atau versi lebih baru ditolak tanpa melempar', () => {
    const mem = new MemStorage();
    const s = new SaveSystem(mem);
    mem.setItem(SAVE_KEY(0), '{bukan json');
    expect(s.load(0)).toBeNull();
    mem.setItem(SAVE_KEY(1), JSON.stringify({ version: 1, profile: { version: 99, chapter: 'x', step: 0 } }));
    expect(s.load(1)).toBeNull();
    mem.setItem(SAVE_KEY(2), JSON.stringify({ version: 1, profile: 'aneh' }));
    expect(s.load(2)).toBeNull();
    expect(s.summaries()).toEqual([null, null, null]);
  });
  it('storage yang melempar (kuota/keamanan): tidak crash, save mengembalikan false dan mencatat error', () => {
    const s = new SaveSystem(throwing);
    expect(s.save(0, newProfile())).toBe(false);
    expect(s.lastError).toContain('Quota');
    expect(s.load(0)).toBeNull();
    expect(() => s.erase(0)).not.toThrow();
    expect(s.summaries()).toEqual([null, null, null]);
    expect(s.loadSettings()).toEqual(defaultSettings());
  });
  it('tanpa storage sama sekali: tidak tersedia, save false', () => {
    const s = new SaveSystem(null);
    expect(s.available).toBe(false);
    expect(s.save(0, newProfile())).toBe(false);
  });
  it('migrasi melengkapi field yang belum ada di data lama', () => {
    const old = { version: 1, chapter: 'ch00', step: 3, money: 50 };
    const p = migrateProfile(old);
    expect(p).not.toBeNull();
    expect(p?.moves).toEqual({
      badan: false,
      dash: false,
      push: false,
      counter: false,
      doubleFinisher: false,
    });
    expect(p?.unlockedChars).toEqual(['A01_protagonis']);
    expect(p?.bonus.kekuatan).toBe(0);
  });
  it('pengaturan: simpan dan muat, nilai ngawur dibersihkan', () => {
    const s = new SaveSystem(new MemStorage());
    const cfg = { ...defaultSettings(), musicVol: 0.2, scale: '3' as const, reduceShake: true };
    expect(s.saveSettings(cfg)).toBe(true);
    expect(s.loadSettings()).toMatchObject({ musicVol: 0.2, scale: '3', reduceShake: true });
    const dirty = migrateSettings({
      musicVol: 9,
      sfxVol: 'keras',
      scale: '7',
      bindings: { light: ['KeyZ'], aneh: ['KeyQ'], heavy: [] },
    });
    expect(dirty.musicVol).toBe(1);
    expect(dirty.sfxVol).toBe(defaultSettings().sfxVol);
    expect(dirty.scale).toBe('auto');
    expect(dirty.bindings.light).toEqual(['KeyZ']);
    expect(dirty.bindings.heavy).toEqual(['KeyK']);
    expect('aneh' in dirty.bindings).toBe(false);
  });
});
