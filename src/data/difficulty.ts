export type Difficulty = 'mudah' | 'normal' | 'sulit';

export interface DifficultyDef {
  label: string;
  tokens: number; // penyerang bersamaan
  enemyDamage: number; // pengali damage musuh
  enemyHp: number; // pengali HP musuh
  reaction: number; // tick jeda berpikir AI (lebih kecil = lebih tajam)
  cooldown: number; // pengali cooldown serangan musuh
}

export const DIFFICULTY: Readonly<Record<Difficulty, DifficultyDef>> = {
  mudah: { label: 'MUDAH', tokens: 1, enemyDamage: 0.75, enemyHp: 0.85, reaction: 24, cooldown: 1.3 },
  normal: { label: 'NORMAL', tokens: 2, enemyDamage: 1, enemyHp: 1, reaction: 14, cooldown: 1 },
  sulit: { label: 'SULIT', tokens: 3, enemyDamage: 1.25, enemyHp: 1.2, reaction: 8, cooldown: 0.75 },
};

export const DIFFICULTIES: readonly Difficulty[] = ['mudah', 'normal', 'sulit'];
