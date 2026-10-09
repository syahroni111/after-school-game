// Musuh data-driven (GDD §5.2). Nama generik untuk kroco; tint hanya membedakan level, bukan identitas sekolah.
import type { School } from './characters';
import type { ScreenFxName } from '../combat/events';

export type PlanStep = 'light' | 'heavy' | 'dash' | 'special' | 'back-light';

export interface PlanDef {
  steps: readonly PlanStep[];
  weight: number;
}

export interface PhaseDef {
  /** Aktif saat HP turun di bawah rasio ini (1 = sejak awal pertarungan). */
  below: number;
  marah?: boolean;
  speedMult?: number;
  spawn?: readonly string[];
  screenFx?: ScreenFxName;
  say?: string;
}

export interface EnemyDef {
  id: string;
  charKey: string;
  name: string;
  school: School;
  hp: number;
  power: number;
  defense: number;
  speed: number;
  plans: readonly PlanDef[];
  guardChance: number;
  dodgeChance: number;
  parrySkill: number;
  /** Cooldown antar serangan (tick). */
  cooldown: readonly [number, number];
  /** Jarak mengitari. */
  ring: number;
  money: readonly [number, number];
  tint?: number;
  boss?: boolean;
  phases?: readonly PhaseDef[];
  /** Arketipe, untuk dokumentasi dan HUD. */
  style: 'cepat' | 'agresif' | 'dash' | 'tank' | 'counter' | 'campuran' | 'dalang';
}

const jab: PlanDef = { steps: ['light'], weight: 1 };

const grunt = (over: Partial<EnemyDef> & Pick<EnemyDef, 'id' | 'charKey' | 'style' | 'plans'>): EnemyDef => ({
  name: 'ANAK EAST BLOCK',
  school: 'east',
  hp: 48,
  power: 0.85,
  defense: 0,
  speed: 1,
  guardChance: 0.1,
  dodgeChance: 0.05,
  parrySkill: 0,
  cooldown: [60, 110],
  ring: 90,
  money: [500, 1000],
  ...over,
});

const LIGHT_TINT = 0xe2d4ff; // sangat ringan: pembeda "suruhan", tetap terbaca sebagai East Block

export const ENEMIES: Readonly<Record<string, EnemyDef>> = Object.fromEntries(
  (
    [
      grunt({
        id: 'cepat',
        charKey: 'B06_rival_cepat',
        style: 'cepat',
        hp: 42,
        power: 0.8,
        speed: 1.15,
        dodgeChance: 0.35,
        cooldown: [45, 90],
        ring: 80,
        plans: [
          { steps: ['light'], weight: 3 },
          { steps: ['light', 'light'], weight: 1 },
        ],
        money: [500, 900],
      }),
      grunt({
        id: 'agresif',
        charKey: 'B04_rival_agresif',
        style: 'agresif',
        hp: 50,
        power: 0.85,
        guardChance: 0.05,
        plans: [
          { steps: ['light', 'light', 'light'], weight: 3 },
          { steps: ['light', 'light'], weight: 1 },
        ],
        money: [700, 1100],
      }),
      grunt({
        id: 'dash',
        charKey: 'B03_rival_atletis',
        style: 'dash',
        hp: 48,
        power: 0.9,
        ring: 120,
        cooldown: [70, 120],
        plans: [{ steps: ['dash', 'light'], weight: 3 }, jab],
        money: [700, 1200],
      }),
      grunt({
        id: 'tank',
        charKey: 'B05_rival_bertahan',
        style: 'tank',
        hp: 66,
        power: 0.9,
        defense: 2,
        speed: 0.85,
        guardChance: 0.55,
        cooldown: [90, 150],
        ring: 85,
        plans: [
          { steps: ['heavy'], weight: 3 },
          { steps: ['light', 'heavy'], weight: 1 },
        ],
        money: [900, 1500],
      }),
      // Suruhan Haris: varian kroco dengan nama dan tint berbeda.
      grunt({
        id: 'suruhan_cepat',
        charKey: 'B06_rival_cepat',
        name: 'SURUHAN HARIS',
        style: 'cepat',
        hp: 54,
        power: 0.9,
        speed: 1.15,
        dodgeChance: 0.4,
        cooldown: [40, 80],
        tint: LIGHT_TINT,
        plans: [jab, { steps: ['light', 'light'], weight: 1 }],
        money: [800, 1200],
      }),
      grunt({
        id: 'suruhan_agresif',
        charKey: 'B04_rival_agresif',
        name: 'SURUHAN HARIS',
        style: 'agresif',
        hp: 62,
        power: 1,
        tint: LIGHT_TINT,
        plans: [
          { steps: ['light', 'light', 'light'], weight: 3 },
          { steps: ['light', 'heavy'], weight: 1 },
        ],
        money: [1000, 1400],
      }),
      grunt({
        id: 'suruhan_tank',
        charKey: 'B05_rival_bertahan',
        name: 'SURUHAN HARIS',
        style: 'tank',
        hp: 80,
        power: 1,
        defense: 3,
        speed: 0.85,
        guardChance: 0.6,
        cooldown: [80, 130],
        tint: LIGHT_TINT,
        plans: [
          { steps: ['heavy'], weight: 2 },
          { steps: ['light', 'heavy'], weight: 1 },
        ],
        money: [1200, 1600],
      }),
      // Bos dan miniboss.
      grunt({
        id: 'jaka',
        charKey: 'B04_rival_agresif',
        name: 'JAKA',
        style: 'agresif',
        hp: 130,
        power: 1,
        guardChance: 0,
        cooldown: [35, 70],
        boss: true,
        plans: [
          { steps: ['light', 'light', 'light'], weight: 3 },
          { steps: ['light', 'light', 'light', 'heavy'], weight: 1 },
        ],
        money: [3000, 3000],
      }),
      grunt({
        id: 'rendy',
        charKey: 'B03_rival_atletis',
        name: 'RENDY',
        style: 'dash',
        hp: 150,
        power: 1,
        ring: 120,
        cooldown: [40, 80],
        boss: true,
        plans: [
          { steps: ['dash', 'light'], weight: 3 },
          { steps: ['light', 'light', 'heavy'], weight: 2 },
        ],
        money: [3500, 3500],
      }),
      grunt({
        id: 'teguh',
        charKey: 'B05_rival_bertahan',
        name: 'TEGUH',
        style: 'tank',
        hp: 190,
        power: 1,
        defense: 3,
        speed: 0.9,
        guardChance: 0.55,
        cooldown: [60, 110],
        boss: true,
        plans: [
          { steps: ['heavy'], weight: 3 },
          { steps: ['light', 'heavy'], weight: 2 },
          { steps: ['back-light'], weight: 1 },
        ],
        money: [4000, 4000],
      }),
      grunt({
        id: 'yoga',
        charKey: 'B06_rival_cepat',
        name: 'YOGA',
        style: 'cepat',
        hp: 140,
        power: 1,
        speed: 1.15,
        dodgeChance: 0.45,
        cooldown: [35, 70],
        boss: true,
        plans: [
          { steps: ['light', 'light'], weight: 3 },
          { steps: ['light', 'light', 'light'], weight: 2 },
        ],
        money: [3500, 3500],
      }),
      grunt({
        id: 'sekar',
        charKey: 'B02_wakil_rival',
        name: 'SEKAR',
        style: 'counter',
        hp: 210,
        power: 1.05,
        defense: 2,
        parrySkill: 0.55,
        guardChance: 0.15,
        dodgeChance: 0.1,
        cooldown: [45, 90],
        boss: true,
        plans: [
          { steps: ['light', 'light', 'light'], weight: 2 },
          { steps: ['light', 'heavy'], weight: 2 },
          { steps: ['heavy'], weight: 1 },
        ],
        money: [5000, 5000],
      }),
      grunt({
        id: 'arga',
        charKey: 'B01_pemimpin_rival',
        name: 'ARGA',
        style: 'campuran',
        hp: 270,
        power: 1.05,
        defense: 2,
        speed: 1.03,
        guardChance: 0.25,
        dodgeChance: 0.2,
        parrySkill: 0.2,
        cooldown: [35, 75],
        ring: 95,
        boss: true,
        phases: [{ below: 0.5, marah: true, speedMult: 1.12, say: 'ARGA MARAH' }],
        plans: [
          { steps: ['light', 'light', 'light'], weight: 3 },
          { steps: ['light', 'light', 'heavy'], weight: 2 },
          { steps: ['dash', 'light'], weight: 2 },
          { steps: ['heavy'], weight: 1 },
          { steps: ['special'], weight: 1 },
        ],
        money: [5000, 5000],
      }),
      grunt({
        id: 'haris',
        charKey: 'B07_senior_mengintimidasi',
        name: 'BANG HARIS',
        style: 'dalang',
        hp: 400,
        power: 1.1,
        defense: 3,
        speed: 1,
        guardChance: 0.2,
        dodgeChance: 0.1,
        parrySkill: 0.15,
        cooldown: [30, 65],
        ring: 100,
        boss: true,
        phases: [
          { below: 1, spawn: ['suruhan_agresif', 'suruhan_cepat'] },
          { below: 0.66 },
          { below: 0.3, marah: true, speedMult: 1.2, screenFx: 'gelapkan' },
        ],
        plans: [
          { steps: ['heavy'], weight: 3 },
          { steps: ['light', 'light', 'heavy'], weight: 2 },
          { steps: ['heavy', 'heavy'], weight: 1 },
          { steps: ['special'], weight: 2 },
          { steps: ['light', 'light', 'light', 'heavy'], weight: 1 },
        ],
        money: [8000, 8000],
      }),
      grunt({
        id: 'gilang',
        charKey: 'A07_petarung_bertahan',
        name: 'GILANG',
        school: 'north',
        style: 'tank',
        hp: 120,
        power: 0.85,
        defense: 2,
        speed: 0.95,
        guardChance: 0.4,
        parrySkill: 0.3,
        cooldown: [60, 100],
        boss: true,
        plans: [
          { steps: ['light', 'light'], weight: 3 },
          { steps: ['heavy'], weight: 2 },
        ],
        money: [0, 0],
      }),
      grunt({
        id: 'bima',
        charKey: 'A04_murid_atletis',
        name: 'BIMA',
        school: 'north',
        style: 'campuran',
        hp: 110,
        power: 0.85,
        dodgeChance: 0.25,
        cooldown: [45, 85],
        boss: true,
        plans: [
          { steps: ['light', 'light', 'light'], weight: 3 },
          { steps: ['dash', 'light'], weight: 2 },
          { steps: ['heavy'], weight: 1 },
        ],
        money: [0, 0],
      }),
      grunt({
        id: 'tiara',
        charKey: 'A06_murid_enerjik',
        name: 'TIARA',
        school: 'north',
        style: 'cepat',
        hp: 70,
        power: 0.7,
        speed: 1.05,
        guardChance: 0.15,
        cooldown: [60, 110],
        ring: 70,
        plans: [
          { steps: ['light'], weight: 3 },
          { steps: ['light', 'light'], weight: 1 },
        ],
        money: [0, 0],
      }),
      // Senior angkatan lama (Bab 5, kilas balik): kroco tanpa uang, dimainkan pemain sebagai Hendra muda.
      grunt({
        id: 'senior_cepat',
        charKey: 'B06_rival_cepat',
        name: 'SENIOR ANGKATAN LAMA',
        style: 'cepat',
        hp: 46,
        power: 0.85,
        speed: 1.1,
        dodgeChance: 0.3,
        cooldown: [45, 90],
        plans: [jab, { steps: ['light', 'light'], weight: 1 }],
        money: [0, 0],
      }),
      grunt({
        id: 'senior_agresif',
        charKey: 'B04_rival_agresif',
        name: 'SENIOR ANGKATAN LAMA',
        style: 'agresif',
        hp: 56,
        power: 0.95,
        plans: [
          { steps: ['light', 'light', 'light'], weight: 3 },
          { steps: ['light', 'heavy'], weight: 1 },
        ],
        money: [0, 0],
      }),
      grunt({
        id: 'senior_tank',
        charKey: 'B05_rival_bertahan',
        name: 'SENIOR ANGKATAN LAMA',
        style: 'tank',
        hp: 72,
        power: 0.95,
        defense: 2,
        speed: 0.85,
        guardChance: 0.5,
        cooldown: [80, 130],
        plans: [
          { steps: ['heavy'], weight: 2 },
          { steps: ['light', 'heavy'], weight: 1 },
        ],
        money: [0, 0],
      }),
      grunt({
        id: 'senior_lama',
        charKey: 'B07_senior_mengintimidasi',
        name: 'SENIOR ANGKATAN LAMA',
        style: 'dalang',
        hp: 170,
        power: 0.9,
        defense: 1,
        guardChance: 0.2,
        cooldown: [50, 90],
        ring: 95,
        boss: true,
        phases: [{ below: 0.5, speedMult: 1.1 }],
        plans: [
          { steps: ['heavy'], weight: 2 },
          { steps: ['light', 'light', 'heavy'], weight: 2 },
          { steps: ['light', 'light'], weight: 1 },
        ],
        money: [0, 0],
      }),
    ] satisfies EnemyDef[]
  ).map((d) => [d.id, d]),
);

export const enemyDef = (id: string): EnemyDef => {
  const d = ENEMIES[id];
  if (!d) throw new Error(`Musuh tidak dikenal: ${id}`);
  return d;
};
