// Konstanta penyetelan pertarungan. Satuan: px, tick (1/60 detik), poin.
import { msToTicks } from '../util/math';

export const WALK_SPEED = 1.15; // px/tick di sumbu x
export const DEPTH_SPEED = 0.85; // px/tick di sumbu y (kedalaman)
export const DASH_SPEED = 2.6;
export const DASH_MOVE_TICKS = 24;
export const DASH_CARRY_TICKS = 14; // momentum maju terbawa ke pukulan lurus dash
export const DOUBLE_TAP_TICKS = msToTicks(220);
export const DASH_ATTACK_WINDOW = msToTicks(300);

export const DEPTH_TOLERANCE = 10; // |dy| maksimum agar serangan bisa mengenai
export const BODY_PUSH_X = 14; // jarak minimum antar petarung
export const BODY_PUSH_Y = 6;

export const PARRY_WINDOW_TICKS = 8; // GDD §4.1: jendela tangkis 8 frame logika
export const PARRY_STAGGER_TICKS = 50;
export const COUNTER_WINDOW_TICKS = 40; // sisa waktu setelah parry untuk memicu serangan balik

export const STAMINA_MAX = 100;
export const STAMINA_BLOCK_DRAIN = 6 / 60; // per tick
export const STAMINA_BLOCK_HIT = 12;
export const STAMINA_DODGE = 18;
export const STAMINA_REGEN = 25 / 60; // per tick
export const STAMINA_REGEN_DELAY = msToTicks(600);
export const STAMINA_TIRED_BELOW = 20;

export const DIZZY_TICKS = 60;
export const CHARGE_FREEZE_FRAME = 5; // frame wind-up terakhir pukulan_berat
export const CHARGE_MIN_TICKS = msToTicks(250);
export const CHARGE_MAX_TICKS = msToTicks(750);

export const KNOCKBACK_DECAY = 0.93;
export const HITSTUN_SLIDE = 0.9;
export const DOWN_TICKS_MIN = msToTicks(600);
export const DOWN_TICKS_MAX = msToTicks(1200);
export const AFTER_DODGE_IDLE_TICKS = msToTicks(400);
export const SPAWN_INVULN_TICKS = 30;
export const FLASH_TICKS = 5; // kedip putih saat terkena

export const KUAT_TICKS = 20 * 60;
export const KUAT_MULT = 1.15;
export const MARAH_MULT = 1.25;
export const BERTAHAN_MULT = 0.8;

export const ENEMY_LEAVE_SPEED = 1.0;
export const ENEMY_LEAVE_FADE_TICKS = 50;

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
export const DEFAULT_BOUNDS: Bounds = { minX: 14, maxX: 466, minY: 160, maxY: 266 };

/** Duet Panji (Bab 7): jumlah pukulan yang mendarat (pemain dan sekutu) untuk mengisi meteran. */
export const DUET_FULL_HITS = 12;
