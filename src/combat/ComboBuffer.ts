// Input buffer: menyimpan tekanan tombol sebentar supaya aksi berikutnya terasa responsif (150 ms = 9 tick).
import { msToTicks } from '../util/math';

export type BufferedAction = 'light' | 'heavy' | 'special' | 'dodge' | 'guard' | 'back-light';

export const BUFFER_TICKS = msToTicks(150);
/** Kombo terputus bila tidak ada serangan lanjutan dalam 350 ms setelah serangan selesai. */
export const COMBO_GAP_TICKS = msToTicks(350);

interface Entry {
  action: BufferedAction;
  expire: number;
}

export class ComboBuffer {
  private entries: Entry[] = [];

  push(action: BufferedAction, now: number, ttl = BUFFER_TICKS): void {
    this.entries.push({ action, expire: now + ttl });
  }

  /** Ambil dan hapus tekanan tertua yang cocok dan belum kedaluwarsa. */
  consume(now: number, accept: (a: BufferedAction) => boolean): BufferedAction | null {
    this.prune(now);
    const i = this.entries.findIndex((e) => accept(e.action));
    if (i < 0) return null;
    return (this.entries.splice(i, 1)[0] as Entry).action;
  }

  has(now: number, accept: (a: BufferedAction) => boolean): boolean {
    this.prune(now);
    return this.entries.some((e) => accept(e.action));
  }

  clear(): void {
    this.entries = [];
  }

  get size(): number {
    return this.entries.length;
  }

  private prune(now: number): void {
    this.entries = this.entries.filter((e) => e.expire >= now);
  }
}
