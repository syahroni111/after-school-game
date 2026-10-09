// State machine per Fighter. Semua perpindahan lewat go() sehingga tercatat dan bisa diuji.

export type FState =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'block'
  | 'parry'
  | 'counter'
  | 'dodge'
  | 'dash'
  | 'hitstun'
  | 'knockback'
  | 'down'
  | 'getup'
  | 'dizzy'
  | 'ko'
  | 'cutscene';

const ACTIONABLE: FState[] = [
  'attack',
  'block',
  'dodge',
  'dash',
  'hitstun',
  'knockback',
  'dizzy',
  'ko',
  'cutscene',
];

/** Tabel perpindahan yang diizinkan. Kunci = asal, nilai = tujuan sah. */
export const TRANSITIONS: Readonly<Record<FState, readonly FState[]>> = {
  idle: ['walk', ...ACTIONABLE],
  walk: ['idle', ...ACTIONABLE],
  attack: ['idle', 'attack', 'dash', 'hitstun', 'knockback', 'dizzy', 'ko', 'cutscene'],
  block: ['idle', 'walk', 'parry', 'dodge', 'hitstun', 'knockback', 'dizzy', 'ko', 'cutscene'],
  parry: ['idle', 'block', 'counter', 'parry', 'hitstun', 'knockback', 'ko', 'cutscene'],
  counter: ['idle', 'knockback', 'ko', 'cutscene'],
  dodge: ['idle', 'attack', 'block', 'hitstun', 'knockback', 'ko', 'cutscene'],
  dash: ['idle', 'attack', 'hitstun', 'knockback', 'ko', 'cutscene'],
  hitstun: ['idle', 'hitstun', 'knockback', 'dizzy', 'ko', 'cutscene'],
  knockback: ['down', 'ko', 'cutscene'],
  down: ['getup', 'ko', 'cutscene'],
  getup: ['idle', 'ko', 'cutscene'],
  dizzy: ['idle', 'hitstun', 'knockback', 'ko', 'cutscene'],
  ko: ['idle', 'cutscene'],
  cutscene: ['idle', 'cutscene'],
};

export interface TransitionRecord {
  from: FState;
  to: FState;
  cause: string;
  tick: number;
}

export class FighterStateMachine {
  state: FState = 'idle';
  /** Tick sejak masuk state saat ini. */
  stateTick = 0;
  readonly log: TransitionRecord[] = [];
  private clock = 0;

  constructor(private readonly maxLog = 64) {}

  can(to: FState): boolean {
    return TRANSITIONS[this.state].includes(to);
  }

  /** Pindah state. Mengembalikan false (dan tidak mengubah apa pun) bila perpindahan tidak sah. */
  go(to: FState, cause = ''): boolean {
    if (!this.can(to)) return false;
    this.log.push({ from: this.state, to, cause, tick: this.clock });
    if (this.log.length > this.maxLog) this.log.shift();
    this.state = to;
    this.stateTick = 0;
    return true;
  }

  /** Pindah bila sah; bila tidak, paksa. Dipakai untuk reaksi yang harus terjadi (kena pukul, guard break). */
  enter(to: FState, cause = ''): void {
    if (!this.go(to, cause)) this.force(to, cause);
  }

  /** Paksa (untuk reset/spawn/cutscene). Tetap tercatat. */
  force(to: FState, cause = 'force'): void {
    this.log.push({ from: this.state, to, cause, tick: this.clock });
    if (this.log.length > this.maxLog) this.log.shift();
    this.state = to;
    this.stateTick = 0;
  }

  advance(): void {
    this.clock++;
    this.stateTick++;
  }

  is(...states: FState[]): boolean {
    return states.includes(this.state);
  }
}
