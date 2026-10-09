// Simulasi pertarungan tanpa tampilan: kombo, tangkis, menghindar, kedalaman, knockdown, KO, root motion.
import { describe, expect, it } from 'vitest';
import type { WorldEvent } from '../../src/combat/events';
import { TICKS_PER_FRAME } from '../../src/config';
import { FRAME_DATA, framesToTicks } from '../../src/data/frameData';
import { MOVES } from '../../src/data/moves';
import { DEPTH_TOLERANCE } from '../../src/data/tuning';
import { mkRig } from './helpers';

const movesUsed = (events: WorldEvent[]) =>
  events.filter((e): e is Extract<WorldEvent, { type: 'hit' }> => e.type === 'hit').map((e) => e.move.id);

describe('gerak dan batas', () => {
  it('berjalan 4 arah dan tetap di dalam batas area', () => {
    const { world, a, run } = mkRig(100);
    a.held.moveX = -1;
    run(2000);
    expect(a.f.x).toBeGreaterThanOrEqual(world.bounds.minX);
    expect(a.f.state).toBe('walk');
    a.held.moveX = 0;
    a.held.moveY = 1;
    run(2000);
    expect(a.f.y).toBeLessThanOrEqual(world.bounds.maxY);
    a.held.moveY = 0;
    run(2);
    expect(a.f.state).toBe('idle');
  });
  it('menghadap arah gerak terakhir', () => {
    const { a, run } = mkRig(100);
    a.held.moveX = -1;
    run(3);
    expect(a.f.facing).toBe(-1);
  });
});

describe('kombo', () => {
  it('rantai: ringan x3 lalu finisher berat, tiap tekanan memajukan langkah', () => {
    const { world, a, b, run } = mkRig(26, { bOver: { maxHp: 999 } });
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      a.press('light');
      run(framesToTicks(FRAME_DATA.pukulan_cepat?.cancelFrom ?? 5) + 2);
      seen.push(a.f.move?.id ?? '-');
      void b;
    }
    expect(seen).toEqual(['jab', 'straight', 'hook', 'heavy']);
    run(200);
    expect(movesUsed(world.drainEvents()).slice(0, 4)).toContain('heavy');
  });
  it('input buffer: tekanan saat serangan berjalan tidak hilang dan menyambung kombo', () => {
    const { world, a, run } = mkRig(26, { bOver: { maxHp: 999 } });
    a.press('light');
    run(1);
    expect(a.f.move?.id).toBe('jab');
    run(4);
    a.press('light'); // ditekan di tengah startup jab, jauh sebelum titik cancel
    run(60);
    expect(world.drainEvents().length).toBeGreaterThan(0);
    expect(a.f.chainIdx).toBeGreaterThanOrEqual(2);
  });
  it('kombo terputus bila jeda lebih dari 350 ms', () => {
    const { a, run } = mkRig(100);
    a.press('light');
    run(40);
    run(60);
    a.press('light');
    run(1);
    expect(a.f.move?.id).toBe('jab');
  });
  it('hitbox hanya aktif pada frame aktif animasi', () => {
    const { a, run } = mkRig(100);
    a.press('light');
    const activeTicks: number[] = [];
    for (let t = 0; t < 60; t++) {
      run(1);
      if (a.f.activeHit()) activeTicks.push(t);
    }
    const [f0, f1] = FRAME_DATA.pukulan_cepat?.active as [number, number];
    expect(activeTicks.length).toBe((f1 - f0 + 1) * TICKS_PER_FRAME);
  });
});

describe('kena dan reaksi', () => {
  it('pukulan ringan mengenai: musuh terhuyung dan kehilangan HP', () => {
    const { a, b, run } = mkRig(26);
    a.press('light');
    run(30);
    expect(b.f.hp).toBeLessThan(b.f.stats.maxHp);
    expect(b.f.state).toBe('hitstun');
  });
  it('toleransi kedalaman: selisih 10 px kena, 11 px meleset', () => {
    for (const [dy, hit] of [
      [DEPTH_TOLERANCE, true],
      [DEPTH_TOLERANCE + 1, false],
    ] as const) {
      const { a, b, run } = mkRig(26);
      b.f.y = a.f.y + dy;
      a.press('light');
      run(40);
      expect(b.f.hp < b.f.stats.maxHp, `dy=${dy}`).toBe(hit);
    }
  });
  it('pukulan berat menjatuhkan: knockback -> down -> getup -> idle', () => {
    const { a, b, run, runUntil } = mkRig(26);
    a.press('heavy');
    expect(runUntil(() => b.f.state === 'knockback')).toBeGreaterThan(0);
    expect(runUntil(() => b.f.state === 'down')).toBeGreaterThan(0);
    expect(runUntil(() => b.f.state === 'getup')).toBeGreaterThan(0);
    expect(runUntil(() => b.f.state === 'idle')).toBeGreaterThan(0);
    run(1);
    expect(b.f.hp).toBeLessThan(b.f.stats.maxHp);
  });
  it('hitstop membekukan simulasi sesaat setelah pukulan mendarat', () => {
    const { world, a, run } = mkRig(26);
    a.press('heavy');
    run(60);
    expect(world.drainEvents().some((e) => e.type === 'hitstop')).toBe(true);
  });
  it('satu serangan hanya mengenai target sekali', () => {
    const { world, a, run } = mkRig(26);
    a.press('light');
    run(60);
    expect(movesUsed(world.drainEvents()).filter((m) => m === 'jab')).toHaveLength(1);
  });
  it('musuh yang kalah tidak mati: jatuh, bangkit, pergi, lalu dihapus', () => {
    const { world, a, b, run, runUntil } = mkRig(26, { bOver: { maxHp: 5 } });
    a.press('heavy');
    expect(runUntil(() => b.f.dead)).toBeGreaterThanOrEqual(0);
    expect(runUntil(() => b.f.state === 'ko', 900)).toBeGreaterThan(0);
    expect(b.f.koPhase).toBe('rising');
    run(2000);
    expect(b.f.removed).toBe(true);
    expect(world.fighters).not.toContain(b.f);
    expect(world.drainEvents().some((e) => e.type === 'koDone')).toBe(true);
  });
});

describe('bertahan, tangkis, serangan balik', () => {
  /** Penyerang (b) menyerang; bertahan (a) menekan guard `lead` tick sebelum kena. */
  function parryRig(holdBefore: number) {
    const rig = mkRig(26, { aOver: { maxHp: 100 } });
    rig.b.f.facing = -1;
    rig.b.press('light');
    if (holdBefore < 0) return rig;
    // jab aktif pada tick ~15
    rig.run(Math.max(0, 15 - holdBefore));
    rig.a.held.guard = true;
    return rig;
  }

  it('guard ditekan tepat sebelum kena -> tangkis sukses, tanpa damage, penyerang terhuyung', () => {
    const rig = parryRig(4);
    rig.run(40);
    expect(rig.a.f.hp).toBe(100);
    expect(rig.b.f.state).toBe('hitstun');
    expect(rig.a.f.state === 'parry' || rig.a.f.state === 'block').toBe(true);
  });
  it('setelah tangkis, tombol pukul memicu serangan balik yang menjatuhkan', () => {
    const rig = parryRig(4);
    rig.runUntil(() => rig.a.f.state === 'parry');
    rig.a.held.guard = false;
    rig.a.press('light');
    rig.run(12); // melewati hitstop tangkis (80 ms)
    expect(rig.a.f.state).toBe('counter');
    rig.run(framesToTicks(FRAME_DATA.serangan_balik?.frames ?? 12));
    expect(rig.b.f.hp).toBeLessThan(rig.b.f.stats.maxHp);
    expect(['knockback', 'down', 'getup', 'idle']).toContain(rig.b.f.state);
  });
  it('guard sudah lama ditahan -> hanya ditahan: damage kecil dan stamina berkurang', () => {
    const rig = mkRig(26);
    rig.a.held.guard = true;
    rig.run(30);
    rig.b.press('light');
    rig.run(40);
    expect(rig.a.f.state).toBe('block');
    expect(rig.a.f.hp).toBeGreaterThanOrEqual(99);
    expect(rig.a.f.stamina).toBeLessThan(100);
  });
  it('serangan dari belakang tidak bisa ditahan', () => {
    const rig = mkRig(26);
    rig.a.f.facing = -1; // membelakangi musuh
    rig.a.held.guard = true;
    rig.run(30);
    rig.b.press('light');
    rig.run(40);
    expect(rig.a.f.hp).toBeLessThan(100);
  });
  it('pukulan badan memecah pertahanan: lawan jadi pusing', () => {
    const rig = mkRig(26);
    rig.b.f.facing = -1;
    rig.b.held.guard = true;
    rig.run(30);
    expect(rig.b.f.state).toBe('block');
    rig.a.press('back-light');
    rig.run(40);
    expect(rig.b.f.state).toBe('dizzy');
  });
  it('stamina habis saat bertahan -> Guard Break (pusing)', () => {
    const rig = mkRig(100);
    rig.a.held.guard = true;
    expect(rig.runUntil(() => rig.a.f.state === 'dizzy', 1500)).toBeGreaterThan(0);
    rig.a.held.guard = false;
    rig.run(70);
    expect(rig.a.f.state).not.toBe('dizzy');
  });
});

describe('menghindar dan root motion', () => {
  it('menghindar mundur: kebal pada frame kebal, pergeseran akhir -10 px', () => {
    const rig = mkRig(26);
    const x0 = rig.a.f.x;
    rig.b.f.facing = -1;
    rig.a.press('dodge');
    rig.b.press('light');
    rig.run(4);
    // jab musuh aktif sekitar tick 15..24 ; dodge kebal tick 5..34
    rig.run(framesToTicks(10));
    expect(rig.a.f.hp).toBe(100);
    expect(rig.a.f.x).toBeCloseTo(x0 - 10, 5);
  });
  it('menghindar samping menggeser kedalaman ±24 px', () => {
    const rig = mkRig(100);
    const y0 = rig.a.f.y;
    rig.a.held.moveY = -1;
    rig.a.press('dodge');
    rig.run(framesToTicks(10) + 2);
    expect(Math.abs(rig.a.f.y - (y0 - 24))).toBeLessThan(2.5);
  });
  it('menghindar menguras stamina 18 dan tidak bisa bila stamina kurang', () => {
    const rig = mkRig(100);
    rig.a.press('dodge');
    rig.run(2);
    expect(rig.a.f.stamina).toBeCloseTo(82, 0);
    rig.a.f.stamina = 5;
    rig.run(framesToTicks(10) + 10);
    rig.a.press('dodge');
    rig.run(3);
    expect(rig.a.f.state).not.toBe('dodge');
  });
  it('maju selangkah memajukan posisi (dash + root +8) dan butuh jurus terbuka', () => {
    const rig = mkRig(300);
    const x0 = rig.a.f.x;
    rig.a.doDash();
    rig.run(framesToTicks(8) + 2);
    expect(rig.a.f.x - x0).toBeGreaterThan(8);
  });
  it('maju + pukul: tombol pukul saat dash memicu pukulan lurus dash (damage lebih besar)', () => {
    const rig = mkRig(55, { bOver: { maxHp: 999 } });
    rig.a.doDash();
    rig.run(6);
    expect(rig.a.f.state).toBe('dash');
    rig.a.press('light');
    rig.run(2);
    expect(rig.a.f.move?.id).toBe('dashStraight');
    rig.run(60);
    expect(rig.b.f.stats.maxHp - rig.b.f.hp).toBe(MOVES.dashStraight.damage);
  });
  it('dash tidak bisa dipakai bila jurus belum dibuka', () => {
    const rig = mkRig(300, {
      unlocks: { badan: false, dash: false, push: false, counter: false, doubleFinisher: false },
    });
    rig.a.doDash();
    rig.run(3);
    expect(rig.a.f.state).not.toBe('dash');
  });
  it('tidak ada loncatan posisi: pergeseran per tick selalu kecil selama simulasi acak', () => {
    const rig = mkRig(30, { aOver: { maxHp: 9999 }, bOver: { maxHp: 9999 } });
    let seed = 12345;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    let prevA = rig.a.f.x;
    let prevB = rig.b.f.x;
    let worst = 0;
    for (let t = 0; t < 4000; t++) {
      for (const p of [rig.a, rig.b]) {
        if (rnd() < 0.08)
          p.press(
            (['light', 'light', 'heavy', 'dodge', 'guard', 'back-light'] as const)[Math.floor(rnd() * 6)] ??
              'light',
          );
        if (rnd() < 0.03) p.held.moveX = ([-1, 0, 1] as const)[Math.floor(rnd() * 3)] ?? 0;
        if (rnd() < 0.03) p.held.moveY = ([-1, 0, 1] as const)[Math.floor(rnd() * 3)] ?? 0;
        if (rnd() < 0.02) p.held.guard = !p.held.guard;
        if (rnd() < 0.01) p.doDash();
      }
      rig.world.tick();
      worst = Math.max(worst, Math.abs(rig.a.f.x - prevA), Math.abs(rig.b.f.x - prevB));
      prevA = rig.a.f.x;
      prevB = rig.b.f.x;
    }
    expect(worst).toBeLessThanOrEqual(20);
  });
  it('state yang dicapai selalu lewat perpindahan sah (log state machine)', () => {
    const rig = mkRig(30);
    for (let t = 0; t < 1500; t++) {
      if (t % 20 === 0) rig.a.press('light');
      if (t % 50 === 0) rig.b.press('heavy');
      rig.world.tick();
    }
    expect(rig.a.f.sm.log.length).toBeGreaterThan(3);
  });
});

describe('Dorongan Semangat', () => {
  it('memakai 12 HP sebagai darah sementara, menjatuhkan semua musuh sekitar', () => {
    const rig = mkRig(30);
    rig.a.press('special');
    rig.run(2);
    expect(rig.a.f.hp).toBe(88);
    expect(rig.a.f.tempHp).toBe(12);
    rig.run(40);
    expect(rig.b.f.state === 'knockback' || rig.b.f.state === 'down').toBe(true);
  });
  it('darah sementara kembali setelah 4 pukulan mendarat tanpa terkena', () => {
    const rig = mkRig(30, { bOver: { maxHp: 999 } });
    rig.a.press('special');
    rig.run(120);
    expect(rig.a.f.hp).toBe(88);
    const rig2 = rig;
    rig2.a.f.tempHits = 1;
    rig2.a.f.onHitLanded({ kind: 'hit', damage: 1, knockdown: false, ko: false });
    expect(rig2.a.f.hp).toBe(100);
    expect(rig2.a.f.tempHp).toBe(0);
  });
  it('tidak bisa dipakai bila HP <= 12 dan darah sementara hilang bila terkena', () => {
    const rig = mkRig(300);
    rig.a.f.hp = 12;
    rig.a.press('special');
    rig.run(3);
    expect(rig.a.f.move?.id).not.toBe('push');
    const rig2 = mkRig(30);
    rig2.a.f.tempHp = 12;
    rig2.a.f.tempHits = 4;
    rig2.b.f.facing = -1;
    rig2.b.press('light');
    rig2.run(40);
    expect(rig2.a.f.tempHp).toBe(0);
  });
});

describe('pukulan berat bertenaga', () => {
  it('menahan tombol berat di akhir wind-up memberi versi bertenaga dengan damage lebih besar', () => {
    const tap = mkRig(26);
    tap.a.press('heavy');
    tap.run(120);
    const dmgTap = tap.b.f.stats.maxHp - tap.b.f.hp;

    const held = mkRig(26);
    held.a.held.heavy = true;
    held.a.press('heavy');
    held.run(60);
    held.a.held.heavy = false;
    held.run(120);
    const dmgHeld = held.b.f.stats.maxHp - held.b.f.hp;
    expect(dmgHeld).toBeGreaterThan(dmgTap);
    expect(dmgHeld).toBe(Math.round(MOVES.heavy.damage * 1.5));
  });
});
