// Tipe perintah cutscene (data cerita bertipe). Logika dan teks cerita tidak bercampur dengan kode scene.
import type { SpawnDef } from '../systems/WaveDirector';
import type { FlagValue } from '../systems/Profile';

export type Expr = 'netral' | 'serius' | 'marah' | 'percaya_diri' | 'khawatir' | 'terkejut';
export type Dir = 'left' | 'right';
/** Syarat tutorial: dipantau dari aksi pemain. */
export type WaitCond = 'move' | 'hit' | 'combo' | 'guard' | 'parry' | 'dodge' | 'counter' | 'special' | 'dash';

export const EXPRESSIONS: readonly Expr[] = ['netral', 'serius', 'marah', 'percaya_diri', 'khawatir', 'terkejut'];

export interface SayCmd {
  c: 'say';
  /** Kunci karakter (mis. A01_protagonis) atau 'narasi' (tanpa potret dan nama). */
  who: string;
  text: string;
  face?: Expr;
  /** Nama tampilan khusus (mis. SUARA, ANAK EAST BLOCK). */
  name?: string;
  /** Sisi potret; kosong = ditentukan dari posisi aktor. */
  side?: Dir;
}

export type Cmd =
  | SayCmd
  | { c: 'spawn'; id: string; char: string; x: number; y: number; face?: Dir; anim?: string }
  | { c: 'remove'; id: string }
  | { c: 'move'; id: string; x: number; y?: number; speed?: number; wait?: boolean }
  | { c: 'face'; id: string; dir: Dir | string }
  | { c: 'anim'; id: string; anim: string; loop?: boolean; wait?: boolean }
  | { c: 'wait'; ms: number }
  | { c: 'fade'; dir: 'in' | 'out'; ms?: number }
  | { c: 'shake'; amount?: number }
  | { c: 'flash'; alpha?: number }
  | { c: 'setFlag'; key: string; value?: FlagValue }
  | { c: 'ifFlag'; key: string; then: readonly Cmd[]; else?: readonly Cmd[] }
  | { c: 'spawnWave'; spawns: readonly SpawnDef[]; wait?: boolean }
  | { c: 'music'; song: string }
  | { c: 'sfx'; name: string }
  | { c: 'giveMoney'; amount: number }
  | { c: 'giveArchive'; id: string }
  | { c: 'unlock'; what: string }
  | { c: 'title'; text: string; sub?: string }
  | { c: 'hint'; text: string }
  | { c: 'hintOff' }
  | { c: 'waitFor'; cond: WaitCond; times?: number };

export type CmdName = Cmd['c'];

/** Kunjungi semua perintah termasuk yang bersarang di ifFlag. */
export function walkCmds(cmds: readonly Cmd[], visit: (cmd: Cmd) => void): void {
  for (const cmd of cmds) {
    visit(cmd);
    if (cmd.c === 'ifFlag') {
      walkCmds(cmd.then, visit);
      if (cmd.else) walkCmds(cmd.else, visit);
    }
  }
}

// Pembantu penulisan data cerita yang ringkas dan terbaca.
export const say = (who: string, text: string, face?: Expr, extra: Partial<SayCmd> = {}): SayCmd => ({ c: 'say', who, text, face, ...extra });
export const narasi = (text: string): SayCmd => ({ c: 'say', who: 'narasi', text });
export const wait = (ms: number): Cmd => ({ c: 'wait', ms });
