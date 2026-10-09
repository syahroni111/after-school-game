// Kejadian yang dipancarkan simulasi untuk dikonsumsi lapisan tampilan (efek, suara, kamera).
import type { Fighter } from '../entities/Fighter';
import type { MoveDef } from '../data/moves';

export type HitKind = 'miss' | 'hit' | 'block' | 'parry' | 'guardBreak';

export interface HitResult {
  kind: HitKind;
  damage: number;
  knockdown: boolean;
  ko: boolean;
}

export type ScreenFxName = 'vinyet' | 'garis_fokus' | 'gelapkan' | 'kilat_dramatis';

export type WorldEvent =
  | { type: 'fx'; name: string; x: number; y: number; flip: boolean }
  | { type: 'shake'; amount: number }
  | { type: 'flash'; alpha: number }
  | { type: 'screenFx'; name: ScreenFxName }
  | { type: 'sfx'; name: string }
  | { type: 'hitstop'; ticks: number }
  | { type: 'slowmo'; scale: number; ms: number }
  | { type: 'hit'; attacker: Fighter; target: Fighter; move: MoveDef; result: HitResult }
  | { type: 'ko'; fighter: Fighter }
  | { type: 'koDone'; fighter: Fighter }
  | { type: 'text'; text: string; x: number; y: number; color: number };
