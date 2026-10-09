// Pelaksana cutscene: menjalankan daftar perintah berurutan terhadap sebuah CutsceneHost.
// Host (scene) yang mengurus tampilan; di sini hanya urutan, percabangan, dan penantian.
import type { Cmd, SayCmd, WaitCond } from '../data/cutscene';
import type { FlagValue } from './Profile';
import type { SpawnDef } from './WaveDirector';

export interface CutsceneHost {
  say(cmd: SayCmd): Promise<void>;
  spawn(cmd: Extract<Cmd, { c: 'spawn' }>): void;
  remove(id: string): void;
  move(cmd: Extract<Cmd, { c: 'move' }>): Promise<void>;
  face(id: string, dir: string): void;
  anim(cmd: Extract<Cmd, { c: 'anim' }>): Promise<void>;
  wait(ms: number): Promise<void>;
  fade(dir: 'in' | 'out', ms: number): Promise<void>;
  shake(amount: number): void;
  flash(alpha: number): void;
  getFlag(key: string): boolean;
  setFlag(key: string, value: FlagValue): void;
  spawnWave(spawns: readonly SpawnDef[], wait: boolean): Promise<void>;
  music(song: string): void;
  sfx(name: string): void;
  giveMoney(amount: number): void;
  giveArchive(id: string): void;
  unlock(what: string): void;
  title(text: string, sub?: string): Promise<void>;
  hint(text: string): void;
  hintOff(): void;
  waitFor(cond: WaitCond, times: number): Promise<void>;
}

export interface CutsceneControl {
  /** Set true untuk menghentikan cutscene (mis. scene ditutup). */
  cancelled: boolean;
}

export const DEFAULT_FADE_MS = 400;
export const DEFAULT_SHAKE = 2;
export const DEFAULT_FLASH = 0.5;

export async function runCutscene(
  cmds: readonly Cmd[],
  host: CutsceneHost,
  ctl: CutsceneControl = { cancelled: false },
): Promise<void> {
  for (const cmd of cmds) {
    if (ctl.cancelled) return;
    switch (cmd.c) {
      case 'say':
        await host.say(cmd);
        break;
      case 'spawn':
        host.spawn(cmd);
        break;
      case 'remove':
        host.remove(cmd.id);
        break;
      case 'move':
        if (cmd.wait === false) void host.move(cmd);
        else await host.move(cmd);
        break;
      case 'face':
        host.face(cmd.id, cmd.dir);
        break;
      case 'anim':
        if (cmd.wait) await host.anim(cmd);
        else void host.anim(cmd);
        break;
      case 'wait':
        await host.wait(cmd.ms);
        break;
      case 'fade':
        await host.fade(cmd.dir, cmd.ms ?? DEFAULT_FADE_MS);
        break;
      case 'shake':
        host.shake(cmd.amount ?? DEFAULT_SHAKE);
        break;
      case 'flash':
        host.flash(cmd.alpha ?? DEFAULT_FLASH);
        break;
      case 'setFlag':
        host.setFlag(cmd.key, cmd.value ?? true);
        break;
      case 'ifFlag':
        await runCutscene(host.getFlag(cmd.key) ? cmd.then : (cmd.else ?? []), host, ctl);
        break;
      case 'spawnWave':
        await host.spawnWave(cmd.spawns, cmd.wait !== false);
        break;
      case 'music':
        host.music(cmd.song);
        break;
      case 'sfx':
        host.sfx(cmd.name);
        break;
      case 'giveMoney':
        host.giveMoney(cmd.amount);
        break;
      case 'giveArchive':
        host.giveArchive(cmd.id);
        break;
      case 'unlock':
        host.unlock(cmd.what);
        break;
      case 'title':
        await host.title(cmd.text, cmd.sub);
        break;
      case 'hint':
        host.hint(cmd.text);
        break;
      case 'hintOff':
        host.hintOff();
        break;
      case 'waitFor':
        await host.waitFor(cmd.cond, cmd.times ?? 1);
        break;
    }
  }
}
