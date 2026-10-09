// Gelombang musuh (gaya Renegade): maksimal N di layar, bos masuk saat sisa kroco <= 1. Murni.
export type Side = 'left' | 'right';

export interface SpawnDef {
  enemy: string;
  side: Side;
  /** Jeda (tick) setelah spawn sebelumnya sebelum boleh muncul. */
  delay?: number;
  boss?: boolean;
  /** Posisi kedalaman; kosong = acak di area jalan. */
  y?: number;
}

export const MAX_ON_SCREEN = 4;
export const MIN_SPAWN_GAP = 30;

export class WaveDirector {
  private queue: SpawnDef[];
  private wait = 0;
  spawned = 0;

  constructor(
    spawns: readonly SpawnDef[],
    private readonly maxOnScreen = MAX_ON_SCREEN,
  ) {
    // Kroco dulu, bos paling akhir (urutan relatif dipertahankan).
    this.queue = [...spawns.filter((s) => !s.boss), ...spawns.filter((s) => s.boss)];
  }

  get remaining(): number {
    return this.queue.length;
  }

  /** Semua sudah dimunculkan. */
  get exhausted(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Dipanggil tiap tick. `alive` = jumlah musuh hidup di layar, `aliveGrunts` = kroco (bukan bos) hidup.
   * Mengembalikan spawn yang harus dibuat tick ini (paling banyak satu).
   */
  update(alive: number, aliveGrunts: number): SpawnDef[] {
    const next = this.queue[0];
    if (!next) return [];
    if (this.wait > 0) {
      this.wait--;
      return [];
    }
    if (alive >= this.maxOnScreen) return [];
    const gruntsLeft = this.queue.some((s) => !s.boss);
    if (next.boss && (gruntsLeft || aliveGrunts > 1)) return [];
    this.queue.shift();
    this.spawned++;
    this.wait = Math.max(MIN_SPAWN_GAP, this.queue[0]?.delay ?? 0);
    return [next];
  }
}
