import { describe, expect, it } from 'vitest';
import { say, walkCmds } from '../../src/data/cutscene';
import type { Cmd } from '../../src/data/cutscene';
import { runCutscene } from '../../src/systems/Cutscene';
import type { CutsceneHost } from '../../src/systems/Cutscene';

/** Host palsu: mencatat panggilan sesuai urutan; operasi async selesai setelah giliran microtask. */
function fakeHost(flags: Record<string, boolean> = {}) {
  const log: string[] = [];
  const host: CutsceneHost = {
    say: async (c) => void log.push(`say:${c.who}:${c.text}`),
    spawn: (c) => void log.push(`spawn:${c.id}`),
    remove: (id) => void log.push(`remove:${id}`),
    move: async (c) => void log.push(`move:${c.id}:${c.x}`),
    face: (id, d) => void log.push(`face:${id}:${d}`),
    anim: async (c) => void log.push(`anim:${c.id}:${c.anim}`),
    wait: async (ms) => void log.push(`wait:${ms}`),
    fade: async (d, ms) => void log.push(`fade:${d}:${ms}`),
    shake: (a) => void log.push(`shake:${a}`),
    flash: (a) => void log.push(`flash:${a}`),
    getFlag: (k) => !!flags[k],
    setFlag: (k, v) => {
      flags[k] = !!v;
      log.push(`setFlag:${k}:${String(v)}`);
    },
    spawnWave: async (s, w) => void log.push(`wave:${s.length}:${w}`),
    music: (s) => void log.push(`music:${s}`),
    sfx: (s) => void log.push(`sfx:${s}`),
    giveMoney: (n) => void log.push(`money:${n}`),
    giveArchive: (id) => void log.push(`archive:${id}`),
    unlock: (w) => void log.push(`unlock:${w}`),
    title: async (t) => void log.push(`title:${t}`),
    hint: (t) => void log.push(`hint:${t}`),
    hintOff: () => void log.push('hintOff'),
    waitFor: async (c, n) => void log.push(`waitFor:${c}:${n}`),
  };
  return { host, log, flags };
}

describe('runCutscene', () => {
  it('menjalankan perintah berurutan dengan nilai bawaan', async () => {
    const { host, log } = fakeHost();
    await runCutscene(
      [
        { c: 'fade', dir: 'in' },
        say('A01_protagonis', 'HALO.'),
        { c: 'shake' },
        { c: 'flash' },
        { c: 'setFlag', key: 'a' },
        { c: 'giveMoney', amount: 500 },
        { c: 'unlock', what: 'move:badan' },
      ],
      host,
    );
    expect(log).toEqual([
      'fade:in:400',
      'say:A01_protagonis:HALO.',
      'shake:2',
      'flash:0.5',
      'setFlag:a:true',
      'money:500',
      'unlock:move:badan',
    ]);
  });
  it('say menunggu host selesai sebelum perintah berikutnya', async () => {
    const order: string[] = [];
    const { host } = fakeHost();
    let release!: () => void;
    host.say = () => new Promise<void>((r) => (release = r)).then(() => void order.push('say-selesai'));
    host.sfx = () => void order.push('sfx');
    const p = runCutscene([say('x', 'A'), { c: 'sfx', name: 'bell' }], host);
    await Promise.resolve();
    expect(order).toEqual([]);
    release();
    await p;
    expect(order).toEqual(['say-selesai', 'sfx']);
  });
  it('move wait:false tidak menahan cutscene, default menahan', async () => {
    const order: string[] = [];
    const { host } = fakeHost();
    let finish!: () => void;
    host.move = () => new Promise<void>((r) => (finish = r)).then(() => void order.push('tiba'));
    host.sfx = () => void order.push('sfx');
    await runCutscene(
      [
        { c: 'move', id: 'a', x: 1, wait: false },
        { c: 'sfx', name: 'step' },
      ],
      host,
    );
    expect(order).toEqual(['sfx']);
    finish();
    await Promise.resolve();
    expect(order).toEqual(['sfx', 'tiba']);
  });
  it('ifFlag memilih cabang then/else berdasarkan flag', async () => {
    const script: Cmd[] = [
      { c: 'ifFlag', key: 'kenal', then: [say('x', 'AKRAB')], else: [say('x', 'ASING')] },
      { c: 'ifFlag', key: 'kosong', then: [say('x', 'TIDAK')] },
    ];
    const a = fakeHost({ kenal: true });
    await runCutscene(script, a.host);
    expect(a.log).toEqual(['say:x:AKRAB']);
    const b = fakeHost();
    await runCutscene(script, b.host);
    expect(b.log).toEqual(['say:x:ASING']);
  });
  it('ifFlag membaca flag yang baru diset oleh perintah sebelumnya', async () => {
    const { host, log } = fakeHost();
    await runCutscene(
      [
        { c: 'setFlag', key: 'k' },
        { c: 'ifFlag', key: 'k', then: [say('x', 'YA')] },
      ],
      host,
    );
    expect(log.at(-1)).toBe('say:x:YA');
  });
  it('spawnWave menunggu secara bawaan; waitFor membawa jumlah', async () => {
    const { host, log } = fakeHost();
    await runCutscene(
      [
        { c: 'spawnWave', spawns: [{ enemy: 'cepat', side: 'left' }] },
        { c: 'spawnWave', spawns: [], wait: false },
        { c: 'waitFor', cond: 'combo', times: 3 },
        { c: 'waitFor', cond: 'move' },
      ],
      host,
    );
    expect(log).toEqual(['wave:1:true', 'wave:0:false', 'waitFor:combo:3', 'waitFor:move:1']);
  });
  it('berhenti segera bila dibatalkan', async () => {
    const { host, log } = fakeHost();
    const ctl = { cancelled: false };
    host.say = async () => {
      ctl.cancelled = true;
      log.push('say');
    };
    await runCutscene([say('x', 'A'), say('x', 'B'), { c: 'sfx', name: 'bell' }], host, ctl);
    expect(log).toEqual(['say']);
  });
  it('walkCmds mengunjungi perintah bersarang', () => {
    const seen: string[] = [];
    walkCmds(
      [
        {
          c: 'ifFlag',
          key: 'k',
          then: [say('x', 'A'), { c: 'ifFlag', key: 'j', then: [say('x', 'B')], else: [say('x', 'C')] }],
          else: [say('x', 'D')],
        },
      ],
      (c) => seen.push(c.c === 'say' ? c.text : c.c),
    );
    expect(seen).toEqual(['ifFlag', 'A', 'ifFlag', 'B', 'C', 'D']);
  });
});
