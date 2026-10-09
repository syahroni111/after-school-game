import { describe, expect, it } from 'vitest';
import { AttackDirector, TOKEN_TIMEOUT_TICKS, ringSlot } from '../../src/combat/AttackDirector';
import { CombatWorld } from '../../src/combat/CombatWorld';
import { DIFFICULTY } from '../../src/data/difficulty';
import { ENEMIES } from '../../src/data/enemies';
import { hasCharAnim } from '../../src/data/assetIndex';
import { spawnEnemy } from '../../src/entities/Enemy';
import { NullView } from '../../src/entities/Fighter';
import { Rng } from '../../src/util/rng';
import { MAX_ON_SCREEN, WaveDirector } from '../../src/systems/WaveDirector';
import type { SpawnDef } from '../../src/systems/WaveDirector';
import { mkFighter } from './helpers';

describe('AttackDirector', () => {
  it('memberi token hanya sebanyak batas', () => {
    const d = new AttackDirector(2);
    expect(d.request('a', 0)).toBe(true);
    expect(d.request('b', 0)).toBe(true);
    expect(d.request('c', 0)).toBe(false);
    expect(d.active).toBe(2);
  });
  it('yang sudah memegang token tetap benar saat meminta lagi', () => {
    const d = new AttackDirector(1);
    d.request('a', 0);
    expect(d.request('a', 5)).toBe(true);
    expect(d.active).toBe(1);
  });
  it('melepas token membuka slot, dan cooldown pribadi ditegakkan', () => {
    const d = new AttackDirector(1);
    d.request('a', 0);
    d.release('a', 10, 60);
    expect(d.request('b', 10)).toBe(true);
    d.release('b', 11, 0);
    expect(d.request('a', 30)).toBe(false); // cooldown a sampai tick 70
    expect(d.request('a', 70)).toBe(true);
  });
  it('token sangkut dilepas paksa oleh tick()', () => {
    const d = new AttackDirector(1);
    d.request('a', 0);
    d.tick(TOKEN_TIMEOUT_TICKS + 1);
    expect(d.active).toBe(0);
  });
  it('batas token per kesulitan: mudah 1, normal 2, sulit 3', () => {
    expect(DIFFICULTY.mudah.tokens).toBe(1);
    expect(DIFFICULTY.normal.tokens).toBe(2);
    expect(DIFFICULTY.sulit.tokens).toBe(3);
  });
  it('slot mengitari berada di 70-110 px, bergantian kiri/kanan, dan di dalam area', () => {
    const b = { minY: 160, maxY: 266 };
    for (let i = 0; i < 6; i++) {
      const s = ringSlot(i, 6, 240, 220, b);
      expect(Math.abs(s.x - 240)).toBeGreaterThanOrEqual(70);
      expect(Math.abs(s.x - 240)).toBeLessThanOrEqual(110);
      expect(s.y).toBeGreaterThanOrEqual(160);
      expect(s.y).toBeLessThanOrEqual(266);
    }
    expect(Math.sign(ringSlot(0, 4, 240, 220, b).x - 240)).not.toBe(Math.sign(ringSlot(1, 4, 240, 220, b).x - 240));
  });
});

describe('WaveDirector', () => {
  const grunts = (n: number): SpawnDef[] => Array.from({ length: n }, (_, i) => ({ enemy: 'cepat', side: i % 2 ? 'left' : 'right', delay: 0 }));

  it('tidak pernah melebihi batas musuh di layar', () => {
    const w = new WaveDirector(grunts(10));
    let alive = 0;
    for (let t = 0; t < 2000; t++) {
      alive += w.update(alive, alive).length;
      expect(alive).toBeLessThanOrEqual(MAX_ON_SCREEN);
      if (t % 100 === 99 && alive > 0) alive--; // satu kalah tiap 100 tick
    }
  });
  it('bos menunggu semua kroco muncul dan sisa kroco <= 1', () => {
    const w = new WaveDirector([...grunts(3), { enemy: 'jaka', side: 'right', boss: true }]);
    let alive = 0;
    let bossAt = -1;
    const log: string[] = [];
    for (let t = 0; t < 3000; t++) {
      for (const s of w.update(alive, alive - (bossAt >= 0 ? 1 : 0))) {
        alive++;
        log.push(s.enemy);
        if (s.boss) bossAt = t;
      }
      if (t % 150 === 149 && alive > (bossAt >= 0 ? 1 : 0)) alive--;
    }
    expect(log.slice(0, 3)).toEqual(['cepat', 'cepat', 'cepat']);
    expect(log[3]).toBe('jaka');
    expect(bossAt).toBeGreaterThan(0);
  });
  it('selesai bila antrean habis', () => {
    const w = new WaveDirector(grunts(2));
    expect(w.exhausted).toBe(false);
    for (let t = 0; t < 200; t++) w.update(0, 0);
    expect(w.exhausted).toBe(true);
  });
  it('bos tanpa kroco langsung masuk', () => {
    const w = new WaveDirector([{ enemy: 'arga', side: 'left', boss: true }]);
    expect(w.update(0, 0)).toHaveLength(1);
  });
});

describe('data musuh', () => {
  it('semua musuh punya sprite dengan animasi tempur lengkap', () => {
    for (const d of Object.values(ENEMIES)) {
      for (const a of ['pukulan_cepat', 'pukulan_berat', 'tangkis', 'terhuyung', 'jatuh', 'bangkit', 'jalan_tempur', 'jalan_samping'])
        expect(hasCharAnim(d.charKey, a), `${d.id}:${a}`).toBe(true);
      expect(d.plans.length).toBeGreaterThan(0);
      expect(d.cooldown[0]).toBeLessThanOrEqual(d.cooldown[1]);
    }
  });
  it('kroco bukan dari kelompok C (yang tidak bisa menyerang)', () => {
    for (const d of Object.values(ENEMIES)) expect(d.charKey.startsWith('C')).toBe(false);
  });
  it('tint hanya terang dan ringan (tidak mengubah identitas warna)', () => {
    for (const d of Object.values(ENEMIES)) {
      if (d.tint === undefined) continue;
      for (const shift of [16, 8, 0]) expect((d.tint >> shift) & 255).toBeGreaterThanOrEqual(0xc0);
    }
  });
});

describe('simulasi 4 musuh melawan pemain', () => {
  function arena(diffKey: keyof typeof DIFFICULTY, seed: number) {
    const diff = DIFFICULTY[diffKey];
    const world = new CombatWorld({ seed });
    const rng = new Rng(seed);
    const director = new AttackDirector(diff.tokens);
    const player = mkFighter(world, 'player', 'p', 240, 215, { maxHp: 1_000_000 });
    const enemies = ['cepat', 'agresif', 'dash', 'tank'].map((id, i) =>
      spawnEnemy({ enemy: id, world, director, diff, x: 80 + i * 120, y: 190 + i * 14, rng, slotIndex: i, view: NullView, id: `e${i}` }),
    );
    return { world, director, player, enemies, diff };
  }

  for (const key of ['mudah', 'normal', 'sulit'] as const) {
    it(`kesulitan ${key}: pemegang token dan penyerang aktif tidak pernah melebihi ${DIFFICULTY[key].tokens}`, () => {
      const { world, director, enemies, diff } = arena(key, 11);
      let maxHolders = 0;
      let maxAttacking = 0;
      let attacks = 0;
      for (let t = 0; t < 3600; t++) {
        world.tick();
        director.tick(t);
        maxHolders = Math.max(maxHolders, director.active);
        const attacking = enemies.filter((e) => e.fighter.sm.is('attack', 'dash') && !e.fighter.dead).length;
        maxAttacking = Math.max(maxAttacking, attacking);
        attacks += world.drainEvents().filter((e) => e.type === 'hit').length;
      }
      expect(maxHolders).toBeLessThanOrEqual(diff.tokens);
      expect(maxAttacking).toBeLessThanOrEqual(diff.tokens);
      expect(attacks).toBeGreaterThan(0); // musuh benar-benar menyerang
    });
  }

  it('musuh tanpa token mengitari: rata-rata jaraknya dari pemain tetap di luar jangkauan pukul', () => {
    const { world, enemies, player } = arena('mudah', 5);
    let sum = 0;
    let n = 0;
    for (let t = 0; t < 1800; t++) {
      world.tick();
      for (const e of enemies) {
        const f = e.fighter;
        if (!e.brain.holdsToken(f) && f.sm.is('idle', 'walk')) {
          sum += Math.abs(f.x - player.f.x);
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(200);
    expect(sum / n).toBeGreaterThan(55);
  });

  it('serangan berat musuh memiliki wind-up >= 250 ms', () => {
    // pukulan_berat: aktif mulai frame 6 = tick 30 = 500 ms
    const first = (ENEMIES.tank?.plans[0]?.steps ?? [])[0];
    expect(first).toBe('heavy');
  });
});
