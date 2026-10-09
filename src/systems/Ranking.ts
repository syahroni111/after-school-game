// Ranking S/A/B/C per layar dan bab (gaya Streets of Rage 4). Murni dan diuji.
export type Rank = 'S' | 'A' | 'B' | 'C';

export interface RankInput {
  damageDealt: number;
  /** Total HP musuh yang harus dijatuhkan di layar ini. */
  enemyHpTotal: number;
  maxCombo: number;
  seconds: number;
  /** Waktu acuan (detik) untuk layar ini. */
  parSeconds: number;
  hpRatio: number; // 0..1 sisa HP pemain
  hitsTaken: number;
}

export const COMBO_CAP = 12;
export const POINTS = { damage: 1000, combo: 40, time: 500, hp: 600, noHit: 300, perHit: 40 } as const;
export const RANK_CUTOFFS: readonly [number, Rank][] = [
  [2300, 'S'],
  [1700, 'A'],
  [1100, 'B'],
  [0, 'C'],
];

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function scoreOf(i: RankInput): number {
  const damage = POINTS.damage * clamp01(i.damageDealt / Math.max(1, i.enemyHpTotal));
  const combo = Math.min(i.maxCombo, COMBO_CAP) * POINTS.combo;
  const slow = i.parSeconds * 1.5;
  const fast = i.parSeconds * 0.6;
  const time = POINTS.time * clamp01((slow - i.seconds) / Math.max(1, slow - fast));
  const hp = POINTS.hp * clamp01(i.hpRatio);
  const hits = i.hitsTaken === 0 ? POINTS.noHit : Math.max(0, POINTS.noHit - i.hitsTaken * POINTS.perHit * 2);
  return Math.round(damage + combo + time + hp + hits);
}

export function rankOf(score: number): Rank {
  for (const [min, rank] of RANK_CUTOFFS) if (score >= min) return rank;
  return 'C';
}

const ORDER: Rank[] = ['C', 'B', 'A', 'S'];
export const betterRank = (a: Rank | undefined, b: Rank): Rank =>
  a && ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;

/** Rank bab = rank dari rata-rata skor layar. */
export function chapterRank(scores: readonly number[]): Rank {
  if (scores.length === 0) return 'C';
  return rankOf(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Waktu acuan: 8 detik + 9 detik per musuh. */
export const parSecondsFor = (enemyCount: number): number => Math.max(20, 8 + 9 * enemyCount);
