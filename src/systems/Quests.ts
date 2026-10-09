// Logika murni Cerita Sekolah (misi sampingan): ketersediaan, syarat buku, dan hadiah. Tanpa Phaser.
import type { SideQuest } from '../data/sidequests';
import { addArchive } from './Progression';
import { hasFlag } from './Profile';
import type { Profile } from './Profile';

export type QuestState = 'terkunci' | 'tersedia' | 'selesai';

export function questState(p: Profile, q: SideQuest): QuestState {
  if (p.sideQuests[q.id] === 'selesai') return 'selesai';
  return hasFlag(p, q.requires) ? 'tersedia' : 'terkunci';
}

/** Id buku yang harus diambil di seluruh layar misi (kosong bila misi tidak memakai buku). */
export function requiredBooks(q: SideQuest): string[] {
  return q.screens.flatMap((s) => (s.pickups ?? []).filter((k) => k.kind === 'buku').map((k) => k.id));
}

export const bookFlag = (id: string): string => `item_${id}`;

/** Semua buku sudah diambil (sebuah misi tanpa buku selalu lengkap). */
export function booksComplete(p: Profile, q: SideQuest): boolean {
  return requiredBooks(q).every((id) => p.flags[bookFlag(id)] === true);
}

/** Memberi hadiah satu kali. Mengembalikan teks pemberitahuan (kapital). */
export function completeQuest(p: Profile, q: SideQuest): string[] {
  if (p.sideQuests[q.id] === 'selesai') return [];
  p.sideQuests[q.id] = 'selesai';
  p.flags[`quest_${q.id}`] = true;
  p.money += q.reward.money;
  const toasts = ['CERITA SEKOLAH SELESAI'];
  if (addArchive(p, q.reward.archive)) toasts.push('ARSIP SEJARAH BARU');
  const s = q.reward.stat;
  if (s) {
    p.bonus[s.key] += s.amount;
    toasts.push(s.label);
  }
  return toasts;
}
