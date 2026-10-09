// Simpan/muat: 3 slot di localStorage. Semua akses dibungkus try/catch; bila gagal game tetap jalan tanpa simpan.
import { PROFILE_VERSION, newProfile } from './Profile';
import type { Profile } from './Profile';
import { defaultSettings, migrateSettings } from './Settings';
import type { Settings } from './Settings';

export const SLOT_COUNT = 3;
export const SAVE_KEY = (slot: number): string => `afterschool.save.v1.${slot}`;
export const SETTINGS_KEY = 'afterschool.settings.v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SlotSummary {
  slot: number;
  chapter: string;
  money: number;
  playMs: number;
  savedAt: number;
}

interface Envelope {
  version: number;
  savedAt: number;
  profile: Profile;
}

/** Memvalidasi dan melengkapi data simpan lama (migrasi). Mengembalikan null bila rusak. */
export function migrateProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== 'number' || r.version > PROFILE_VERSION) return null;
  const base = newProfile();
  const p = { ...base, ...(r as Partial<Profile>) };
  if (typeof p.chapter !== 'string' || typeof p.step !== 'number' || !Number.isFinite(p.step)) return null;
  p.version = PROFILE_VERSION;
  p.bonus = { ...base.bonus, ...(r.bonus as object | undefined) };
  p.moves = { ...base.moves, ...(r.moves as object | undefined) };
  p.flags = typeof r.flags === 'object' && r.flags ? (r.flags as Profile['flags']) : {};
  p.archives = Array.isArray(r.archives) ? (r.archives as string[]) : [];
  p.unlockedChars =
    Array.isArray(r.unlockedChars) && r.unlockedChars.length > 0
      ? (r.unlockedChars as string[])
      : base.unlockedChars;
  if (typeof p.money !== 'number' || !Number.isFinite(p.money)) p.money = 0;
  return p;
}

export class SaveSystem {
  /** Terakhir kali menyimpan gagal (dipakai untuk menampilkan pemberitahuan). */
  lastError = '';

  constructor(private readonly storage: StorageLike | null) {}

  get available(): boolean {
    return this.storage !== null;
  }

  private read(key: string): unknown {
    if (!this.storage) return null;
    try {
      const s = this.storage.getItem(key);
      return s ? (JSON.parse(s) as unknown) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): boolean {
    if (!this.storage) {
      this.lastError = 'penyimpanan tidak tersedia';
      return false;
    }
    try {
      this.storage.setItem(key, JSON.stringify(value));
      this.lastError = '';
      return true;
    } catch (e) {
      this.lastError = String(e);
      return false;
    }
  }

  load(slot: number): Profile | null {
    const raw = this.read(SAVE_KEY(slot)) as Envelope | null;
    return raw ? migrateProfile(raw.profile) : null;
  }

  save(slot: number, profile: Profile): boolean {
    return this.write(SAVE_KEY(slot), {
      version: PROFILE_VERSION,
      savedAt: Date.now(),
      profile,
    } satisfies Envelope);
  }

  erase(slot: number): void {
    try {
      this.storage?.removeItem(SAVE_KEY(slot));
    } catch {
      /* diabaikan: tidak ada yang bisa dilakukan */
    }
  }

  summaries(): (SlotSummary | null)[] {
    return Array.from({ length: SLOT_COUNT }, (_, i) => {
      const raw = this.read(SAVE_KEY(i)) as Envelope | null;
      const p = raw ? migrateProfile(raw.profile) : null;
      return p
        ? { slot: i, chapter: p.chapter, money: p.money, playMs: p.playMs, savedAt: raw?.savedAt ?? 0 }
        : null;
    });
  }

  loadSettings(): Settings {
    return migrateSettings(this.read(SETTINGS_KEY));
  }

  saveSettings(s: Settings): boolean {
    return this.write(SETTINGS_KEY, s);
  }

  resetSettings(): Settings {
    const d = defaultSettings();
    this.saveSettings(d);
    return d;
  }
}

/** localStorage bila bisa dipakai (bisa melempar di jendela privat/iframe tanpa izin), kalau tidak null. */
export function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    const probe = '__afterschool_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export const saves = new SaveSystem(typeof window === 'undefined' ? null : browserStorage());
