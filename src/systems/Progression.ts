// Membuka jurus, karakter, lokasi, dan misi dari perintah `unlock` cerita (murni, mengubah Profile).
import { CHARACTERS } from '../data/characters';
import type { Cmd } from '../data/cutscene';
import type { Profile } from './Profile';

export const MOVE_UNLOCKS = ['badan', 'dash', 'push', 'counter', 'double'] as const;
export type MoveUnlock = (typeof MOVE_UNLOCKS)[number];

export const MOVE_LABEL: Readonly<Record<MoveUnlock, string>> = {
  badan: 'PUKULAN BADAN',
  dash: 'MAJU SELANGKAH',
  push: 'DORONGAN SEMANGAT',
  counter: 'TANGKIS DAN SERANGAN BALIK',
  double: 'KOMBO FINISHER GANDA',
};

export type UnlockKind = 'move' | 'char' | 'location' | 'quest' | 'mode';

export interface UnlockResult {
  ok: boolean;
  /** Teks pemberitahuan untuk pemain (kapital), kosong bila tak perlu. */
  toast: string;
  /** Perubahan benar-benar baru (bukan sudah terbuka). */
  changed: boolean;
}

export function parseUnlock(what: string): { kind: UnlockKind; id: string } | null {
  const i = what.indexOf(':');
  if (i < 0) return null;
  const kind = what.slice(0, i) as UnlockKind;
  const id = what.slice(i + 1);
  if (!['move', 'char', 'location', 'quest', 'mode'].includes(kind) || !id) return null;
  return { kind, id };
}

export function isValidUnlock(what: string): boolean {
  const u = parseUnlock(what);
  if (!u) return false;
  if (u.kind === 'move') return (MOVE_UNLOCKS as readonly string[]).includes(u.id);
  if (u.kind === 'char') return u.id in CHARACTERS && CHARACTERS[u.id]?.playable === true;
  if (u.kind === 'mode') return u.id === 'bebas';
  return true; // lokasi dan misi divalidasi terhadap datanya di validateContent
}

export function applyUnlock(p: Profile, what: string): UnlockResult {
  const u = parseUnlock(what);
  if (!u) return { ok: false, toast: '', changed: false };
  switch (u.kind) {
    case 'move': {
      if (!(MOVE_UNLOCKS as readonly string[]).includes(u.id)) return { ok: false, toast: '', changed: false };
      const key = u.id === 'double' ? 'doubleFinisher' : (u.id as keyof Profile['moves']);
      const changed = !p.moves[key];
      p.moves[key] = true;
      return { ok: true, changed, toast: changed ? `JURUS BARU: ${MOVE_LABEL[u.id as MoveUnlock]}` : '' };
    }
    case 'char': {
      const def = CHARACTERS[u.id];
      if (!def?.playable) return { ok: false, toast: '', changed: false };
      const changed = !p.unlockedChars.includes(u.id);
      if (changed) p.unlockedChars.push(u.id);
      return { ok: true, changed, toast: changed ? `${def.name} BISA DIMAINKAN` : '' };
    }
    case 'location': {
      const key = `loc_${u.id}`;
      const changed = p.flags[key] !== true;
      p.flags[key] = true;
      return { ok: true, changed, toast: changed ? `LOKASI TERBUKA: ${u.id.replace(/_/g, ' ').toUpperCase()}` : '' };
    }
    case 'quest': {
      const changed = p.sideQuests[u.id] === undefined;
      if (changed) p.sideQuests[u.id] = 'aktif';
      return { ok: true, changed, toast: changed ? 'CERITA SEKOLAH BARU' : '' };
    }
    case 'mode': {
      const changed = !p.cleared;
      p.cleared = true;
      return { ok: true, changed, toast: changed ? 'MODE BEBAS TERBUKA' : '' };
    }
  }
}

export const hasLocation = (p: Profile, id: string): boolean => p.flags[`loc_${id}`] === true;

/**
 * Menerapkan efek permanen sebuah skrip (flag, jurus, karakter, arsip, uang) tanpa memainkannya.
 * Dipakai lompat bab untuk debug agar profil konsisten dengan bab-bab yang dilewati.
 */
export function applyScriptEffects(p: Profile, cmds: readonly Cmd[]): void {
  for (const cmd of cmds) {
    switch (cmd.c) {
      case 'setFlag':
        p.flags[cmd.key] = cmd.value ?? true;
        break;
      case 'ifFlag': {
        const v = p.flags[cmd.key];
        const on = v !== undefined && v !== false && v !== 0 && v !== '';
        applyScriptEffects(p, on ? cmd.then : (cmd.else ?? []));
        break;
      }
      case 'unlock':
        applyUnlock(p, cmd.what);
        break;
      case 'giveMoney':
        p.money += cmd.amount;
        break;
      case 'giveArchive':
        if (!p.archives.includes(cmd.id)) p.archives.push(cmd.id);
        break;
      default:
        break;
    }
  }
}
