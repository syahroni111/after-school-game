// Dojo Gilang (GDD §6): jurus dibeli dengan Rp dan dibuka per bab. Latih tanding tanpa risiko.
import type { MoveUnlock } from '../systems/Progression';

export interface DojoMove {
  id: MoveUnlock;
  label: string;
  price: number;
  /** Flag yang harus ada agar jurus tampil dibeli (selesai bab sebelumnya). Kosong = langsung. */
  requires?: string;
  /** Diberi gratis oleh cerita (tidak bisa dibeli). */
  storyOnly?: boolean;
  desc: string;
}

export const DOJO_MOVES: readonly DojoMove[] = [
  { id: 'counter', label: 'TANGKIS DAN SERANGAN BALIK', price: 0, storyOnly: true, desc: 'TEKAN L TEPAT SEBELUM KENA, LALU J' },
  { id: 'badan', label: 'PUKULAN BADAN', price: 4000, requires: 'ch01_selesai', desc: 'ARAH BELAKANG LALU J. MEMECAH PERTAHANAN' },
  { id: 'dash', label: 'MAJU SELANGKAH', price: 6000, requires: 'ch02_selesai', desc: 'TEKAN ARAH DEPAN DUA KALI, LALU J' },
  { id: 'push', label: 'DORONGAN SEMANGAT', price: 0, storyOnly: true, desc: 'J DAN K BERSAMAAN. MEMAKAI 12 HP SEMENTARA' },
  { id: 'double', label: 'KOMBO FINISHER GANDA', price: 12000, requires: 'ch03_selesai', desc: 'PUKULAN BERAT DUA KALI DI UJUNG KOMBO' },
];

export type Sparring = 'A07_petarung_bertahan' | 'A04_murid_atletis';
export const SPARRING_REWARD: readonly [number, number] = [500, 1000];
