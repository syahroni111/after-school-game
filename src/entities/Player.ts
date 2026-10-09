// Mengubah InputFrame menjadi Intent untuk Fighter pemain: arah, kombo, chord Dorongan Semangat, maju-dobel (dash), serangan belakang.
import type { BufferedAction } from '../combat/ComboBuffer';
import { DOUBLE_TAP_TICKS } from '../data/tuning';
import type { InputFrame } from '../systems/InputManager';
import type { Fighter, Intent } from './Fighter';

const CHORD_TICKS = 4; // J dan K dalam rentang ±4 tick dianggap bersamaan

export class PlayerController {
  private lastTap: Record<'left' | 'right', number> = { left: -999, right: -999 };
  private lastLight = -999;
  private lastHeavy = -999;
  private chordUsed = -999;

  /** `tick` = tick logika pemain; `frame` = hasil InputManager.sample() untuk tick ini. */
  intent(frame: InputFrame, f: Fighter, tick: number): Intent {
    const h = frame.held;
    const p = frame.pressed;
    const moveX = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
    const moveY = (h.has('down') ? 1 : 0) - (h.has('up') ? 1 : 0);
    const presses: BufferedAction[] = [];
    let dashPressed = false;

    for (const dir of ['left', 'right'] as const) {
      if (!p.has(dir)) continue;
      const facingDir = f.facing > 0 ? 'right' : 'left';
      if (dir === facingDir && tick - this.lastTap[dir] <= DOUBLE_TAP_TICKS) dashPressed = true;
      this.lastTap[dir] = tick;
    }

    const lightP = p.has('light');
    const heavyP = p.has('heavy');
    if (lightP) this.lastLight = tick;
    if (heavyP) this.lastHeavy = tick;
    const chord =
      (lightP || heavyP) &&
      Math.abs(this.lastLight - this.lastHeavy) <= CHORD_TICKS &&
      tick - this.chordUsed > CHORD_TICKS * 2;
    if (p.has('special') || chord) {
      presses.push('special');
      if (chord) this.chordUsed = tick;
    } else {
      if (lightP) presses.push(moveX !== 0 && moveX !== f.facing ? 'back-light' : 'light');
      if (heavyP) presses.push('heavy');
    }
    if (p.has('guard')) presses.push('guard');
    if (p.has('dodge')) presses.push('dodge');

    return {
      moveX: moveX as -1 | 0 | 1,
      moveY: moveY as -1 | 0 | 1,
      guardHeld: h.has('guard'),
      heavyHeld: h.has('heavy'),
      dashPressed,
      presses,
    };
  }
}
