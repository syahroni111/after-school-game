// Attack Director: hanya N musuh yang boleh memegang "token serangan" sekaligus; yang lain mengitari pemain.
// Murni (tanpa Phaser) supaya mudah diuji.

/** Token sangkut (mis. musuh dihapus) dilepas paksa setelah ini. */
export const TOKEN_TIMEOUT_TICKS = 6 * 60;

export class AttackDirector {
  private holders = new Map<string, number>(); // id -> tick saat token diambil
  private cooldown = new Map<string, number>(); // id -> tick boleh meminta lagi

  constructor(public maxTokens: number) {}

  get active(): number {
    return this.holders.size;
  }

  has(id: string): boolean {
    return this.holders.has(id);
  }

  /** Minta token. Benar bila sudah memegang atau ada slot kosong dan cooldown selesai. */
  request(id: string, now: number): boolean {
    if (this.holders.has(id)) return true;
    if (this.holders.size >= this.maxTokens) return false;
    if (now < (this.cooldown.get(id) ?? 0)) return false;
    this.holders.set(id, now);
    return true;
  }

  /** Lepas token dan mulai cooldown pribadi musuh. */
  release(id: string, now: number, cooldownTicks: number): void {
    if (this.holders.delete(id)) this.cooldown.set(id, now + cooldownTicks);
  }

  forget(id: string): void {
    this.holders.delete(id);
    this.cooldown.delete(id);
  }

  clear(): void {
    this.holders.clear();
    this.cooldown.clear();
  }

  /** Pengaman: lepas token yang terlalu lama dipegang. */
  tick(now: number): void {
    for (const [id, since] of this.holders) if (now - since > TOKEN_TIMEOUT_TICKS) this.release(id, now, 60);
  }
}

export const RING_MIN = 70;
export const RING_MAX = 110;

/** Posisi mengitari: sisi kiri/kanan bergantian, jarak dan offset kedalaman tersebar agar tidak menumpuk. */
export function ringSlot(
  index: number,
  count: number,
  foeX: number,
  foeY: number,
  bounds: { minY: number; maxY: number },
): { x: number; y: number } {
  const side = index % 2 === 0 ? -1 : 1;
  const ring = Math.floor(index / 2);
  const dist = RING_MIN + ((ring * 22) % (RING_MAX - RING_MIN + 1));
  const spread = count <= 1 ? 0 : (index / Math.max(1, count - 1) - 0.5) * 60;
  const y = Math.min(bounds.maxY, Math.max(bounds.minY, foeY + spread));
  return { x: foeX + side * dist, y };
}
