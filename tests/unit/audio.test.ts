import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SFX_NAMES, SONG_IDS } from '../../src/audio/names';
import { SFX_RECIPES } from '../../src/audio/sfxRecipes';
import { SONGS } from '../../src/audio/songs';
import {
  STEPS_PER_BAR,
  buildTimeline,
  midiToHz,
  noteToMidi,
  parseTrack,
  stepSeconds,
} from '../../src/audio/songTheory';

describe('teori nada', () => {
  it('nada ke MIDI dan frekuensi', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Bb3')).toBe(58);
    expect(noteToMidi('H4')).toBeNull();
    expect(midiToHz(69)).toBeCloseTo(440, 5);
    expect(midiToHz(81)).toBeCloseTo(880, 5);
  });
  it('pengurai: titik hening, strip memperpanjang, token liar ditolak', () => {
    expect(parseTrack('C4 - - . E4', false)).toEqual([
      { step: 0, len: 3, note: 60 },
      { step: 4, len: 1, note: 64 },
    ]);
    expect(parseTrack('- C4', false)).toBeNull();
    expect(parseTrack('C4 X', false)).toBeNull();
    expect(parseTrack('k . s h', true)?.map((e) => e.note)).toEqual(['k', 's', 'h']);
    expect(parseTrack('C4', true)).toBeNull();
  });
  it('durasi langkah menurut tempo', () => {
    expect(stepSeconds(120)).toBeCloseTo(0.125, 6);
  });
});

describe('efek suara', () => {
  it('setiap nama SFX punya resep yang sah', () => {
    for (const n of SFX_NAMES) {
      const r = SFX_RECIPES[n];
      expect(r, n).toBeDefined();
      expect(r.dur, n).toBeGreaterThan(0.01);
      expect(r.dur, n).toBeLessThanOrEqual(1);
      expect(r.vol, n).toBeGreaterThan(0);
      expect(r.vol, n).toBeLessThanOrEqual(0.6);
      expect(r.f0 > 0 || (r.noise ?? 0) > 0, n).toBe(true);
      for (const [at, mult] of r.arp ?? []) {
        expect(at).toBeGreaterThan(0);
        expect(mult).toBeGreaterThan(0);
      }
    }
    expect(Object.keys(SFX_RECIPES).sort()).toEqual([...SFX_NAMES].sort());
  });
});

describe('lagu', () => {
  it('ada enam lagu untuk semua id', () => {
    expect(Object.keys(SONGS).sort()).toEqual([...SONG_IDS].sort());
    expect(SONG_IDS).toHaveLength(6);
  });
  for (const id of SONG_IDS) {
    it(`${id}: semua bagian sah, jalur sama panjang, kelipatan birama`, () => {
      const song = SONGS[id];
      expect(song.id).toBe(id);
      expect(song.bpm).toBeGreaterThanOrEqual(60);
      expect(song.bpm).toBeLessThanOrEqual(190);
      const tl = buildTimeline(song); // melempar bila tidak sah
      expect(tl.totalSteps % STEPS_PER_BAR).toBe(0);
      expect(tl.totalSteps).toBeGreaterThanOrEqual(STEPS_PER_BAR * 8);
      for (const ch of ['p1', 'p2', 'tri', 'noise'] as const)
        expect(tl.events[ch].size, ch).toBeGreaterThan(0);
      // melodi dalam rentang pendengaran wajar
      for (const e of tl.events.p1.values()) {
        expect(e.note).toBeGreaterThanOrEqual(55);
        expect(e.note).toBeLessThanOrEqual(96);
      }
    });
  }
  it('tidak ada dua lagu yang sama persis', () => {
    const sig = SONG_IDS.map((id) => JSON.stringify(SONGS[id].sections));
    expect(new Set(sig).size).toBe(sig.length);
  });
});

describe('nama SFX di kode', () => {
  it('semua nama SFX yang ditulis di kode ada di daftar (nama tak dikenal diam-diam tidak berbunyi)', () => {
    const used = new Set<string>();
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (p.endsWith('.ts')) {
          const src = readFileSync(p, 'utf8');
          for (const m of src.matchAll(
            /type: 'sfx', name: (?:\w+ === [^?]+\? )?'([a-z_]+)'(?: : '([a-z_]+)')?/g,
          ))
            for (const g of [m[1], m[2]]) if (g) used.add(g);
          for (const m of src.matchAll(/\bsfx: '([a-z_]+)'/g)) used.add(m[1] as string);
          for (const m of src.matchAll(/audio\.sfx\('([a-z_]+)'\)/g)) used.add(m[1] as string);
          for (const m of src.matchAll(/c: 'sfx', name: '([a-z_]+)'/g)) used.add(m[1] as string);
        }
      }
    };
    walk('src');
    expect(used.size).toBeGreaterThan(8);
    const unknown = [...used].filter((n) => !(SFX_NAMES as readonly string[]).includes(n));
    expect(unknown).toEqual([]);
  });
});
