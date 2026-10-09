// Kalkulasi damage (murni).
export interface DamageInput {
  base: number;
  attackerPower: number; // pengali dasar penyerang (1 = normal)
  attackerBuff: number; // pengali buff (kuat = 1.15, marah = 1.25)
  defense: number; // poin Ketahanan target
  defenderBuff: number; // pengali masuk (bertahan = 0.8)
  blocked: boolean;
  charged: boolean;
}

export const DEFENSE_PER_POINT = 0.02;
export const DEFENSE_CAP = 0.5;
export const CHIP_SCALE = 0.15;
export const CHARGE_SCALE = 1.5;

export function calcDamage(i: DamageInput): number {
  const defenseCut = Math.min(DEFENSE_CAP, i.defense * DEFENSE_PER_POINT);
  let dmg = i.base * i.attackerPower * i.attackerBuff * i.defenderBuff * (1 - defenseCut);
  if (i.charged) dmg *= CHARGE_SCALE;
  if (i.blocked) dmg *= CHIP_SCALE;
  return Math.max(i.blocked ? 0 : 1, Math.round(dmg));
}

/** Darah sementara dari Dorongan Semangat: pulih setelah N pukulan mendarat tanpa terkena. */
export interface TempHp {
  amount: number;
  hitsNeeded: number;
}

export const SPECIAL_HP_COST = 12;
export const SPECIAL_RECOVER_HITS = 4;
