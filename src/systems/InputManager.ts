// Input keyboard + gamepad yang bisa diatur ulang (rebind). Inti (InputState) murni; hanya attach() menyentuh DOM.
export type Action =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'light'
  | 'heavy'
  | 'guard'
  | 'dodge'
  | 'special'
  | 'interact'
  | 'pause'
  | 'confirm'
  | 'back';

export const ACTIONS: readonly Action[] = [
  'left',
  'right',
  'up',
  'down',
  'light',
  'heavy',
  'guard',
  'dodge',
  'special',
  'interact',
  'pause',
  'confirm',
  'back',
];

/** Aksi yang boleh diatur ulang pemain lewat menu Pengaturan. */
export const REBINDABLE: readonly Action[] = [
  'left',
  'right',
  'up',
  'down',
  'light',
  'heavy',
  'guard',
  'dodge',
  'special',
  'interact',
  'pause',
];

export type Bindings = Record<Action, string[]>;

export const DEFAULT_KEYS: Bindings = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  light: ['KeyJ'],
  heavy: ['KeyK'],
  guard: ['KeyL'],
  dodge: ['Space'],
  special: ['KeyI'],
  interact: ['KeyE'],
  pause: ['Escape', 'KeyP'],
  confirm: ['Enter', 'KeyJ', 'KeyE'],
  back: ['Escape', 'KeyK', 'Backspace'],
};

export interface PadSnapshot {
  buttons: readonly boolean[];
  axes: readonly number[];
}

const AXIS_DEADZONE = 0.5;

/** Gamepad standar (layout Xbox/PlayStation): A/✕=0, B/○=1, X/□=2, Y/△=3, RB=5, RT=7, Start=9, D-pad=12..15. */
export function padActions(p: PadSnapshot): Set<Action> {
  const out = new Set<Action>();
  const b = (i: number) => p.buttons[i] === true;
  const ax = p.axes[0] ?? 0;
  const ay = p.axes[1] ?? 0;
  if (ax < -AXIS_DEADZONE || b(14)) out.add('left');
  if (ax > AXIS_DEADZONE || b(15)) out.add('right');
  if (ay < -AXIS_DEADZONE || b(12)) out.add('up');
  if (ay > AXIS_DEADZONE || b(13)) out.add('down');
  if (b(2)) out.add('light');
  if (b(3)) out.add('heavy');
  if (b(5) || b(7)) out.add('guard');
  if (b(0)) {
    out.add('dodge');
    out.add('interact');
    out.add('confirm');
  }
  if (b(1)) {
    out.add('special');
    out.add('back');
  }
  if (b(9)) out.add('pause');
  return out;
}

export interface InputFrame {
  held: ReadonlySet<Action>;
  pressed: ReadonlySet<Action>;
}

/** Status input tanpa DOM: mengubah kode tombol/gamepad menjadi aksi, dengan deteksi tepi (tekan) per sample(). */
export class InputState {
  private keys = new Set<string>();
  private padHeld = new Set<Action>();
  private prevHeld = new Set<Action>();
  private edgeQueue = new Set<Action>();
  bindings: Bindings;

  constructor(bindings: Bindings = DEFAULT_KEYS) {
    this.bindings = bindings;
  }

  keyDown(code: string): void {
    if (this.keys.has(code)) return;
    this.keys.add(code);
    for (const a of ACTIONS) if (this.bindings[a].includes(code)) this.edgeQueue.add(a);
  }
  keyUp(code: string): void {
    this.keys.delete(code);
  }
  setPad(snapshot: PadSnapshot | null): void {
    const next = snapshot ? padActions(snapshot) : new Set<Action>();
    for (const a of next) if (!this.padHeld.has(a)) this.edgeQueue.add(a);
    this.padHeld = next;
  }
  clear(): void {
    this.keys.clear();
    this.padHeld.clear();
    this.prevHeld.clear();
    this.edgeQueue.clear();
  }

  private computeHeld(): Set<Action> {
    const held = new Set<Action>(this.padHeld);
    for (const a of ACTIONS) if (this.bindings[a].some((c) => this.keys.has(c))) held.add(a);
    return held;
  }

  isHeld(a: Action): boolean {
    return this.computeHeld().has(a);
  }

  /** Ambil keadaan saat ini; tekanan (edge) yang terkumpul sejak sample() sebelumnya dikonsumsi di sini. */
  sample(): InputFrame {
    const held = this.computeHeld();
    const pressed = new Set<Action>(this.edgeQueue);
    for (const a of held) if (!this.prevHeld.has(a)) pressed.add(a);
    this.edgeQueue.clear();
    this.prevHeld = held;
    return { held, pressed };
  }
}

/** Penghubung DOM untuk InputState. */
export class InputManager extends InputState {
  private attached = false;
  lastDevice: 'keyboard' | 'gamepad' = 'keyboard';

  attach(target: Window = window): void {
    if (this.attached) return;
    this.attached = true;
    target.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.lastDevice = 'keyboard';
      this.keyDown(e.code);
    });
    target.addEventListener('keyup', (e) => this.keyUp(e.code));
    target.addEventListener('blur', () => this.clear());
  }

  /** Dipanggil sebelum sample() agar gamepad ikut terbaca. */
  pollPad(): void {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = [...pads].find((p): p is Gamepad => !!p && p.connected);
    if (!pad) {
      this.setPad(null);
      return;
    }
    const snap = { buttons: pad.buttons.map((b) => b.pressed), axes: [...pad.axes] };
    const before = this.lastDevice;
    this.setPad(snap);
    if (
      snap.buttons.some(Boolean) ||
      Math.abs(snap.axes[0] ?? 0) > AXIS_DEADZONE ||
      Math.abs(snap.axes[1] ?? 0) > AXIS_DEADZONE
    )
      this.lastDevice = 'gamepad';
    else this.lastDevice = before;
  }

  override sample(): InputFrame {
    this.pollPad();
    return super.sample();
  }
}

export const input = new InputManager();
