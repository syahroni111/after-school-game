import { describe, expect, it } from 'vitest';
import { ALL_UNLOCKED, Fighter } from '../../src/entities/Fighter';
import { PlayerController } from '../../src/entities/Player';
import { CombatWorld } from '../../src/combat/CombatWorld';
import { DEFAULT_KEYS, InputState, padActions } from '../../src/systems/InputManager';
import { STATS } from './helpers';

function fighter(): Fighter {
  const world = new CombatWorld();
  return new Fighter({
    id: 'p',
    team: 'player',
    charKey: 'A01_protagonis',
    x: 100,
    y: 200,
    stats: STATS,
    unlocks: ALL_UNLOCKED,
    host: world,
  });
}

describe('InputState', () => {
  it('tekan menghasilkan edge sekali per sample; ditahan tetap held', () => {
    const s = new InputState();
    s.keyDown('KeyJ');
    let f = s.sample();
    expect(f.pressed.has('light')).toBe(true);
    expect(f.held.has('light')).toBe(true);
    f = s.sample();
    expect(f.pressed.has('light')).toBe(false);
    expect(f.held.has('light')).toBe(true);
    s.keyUp('KeyJ');
    expect(s.sample().held.has('light')).toBe(false);
  });
  it('tekan dan lepas di antara dua sample tidak hilang (edge tetap terbaca)', () => {
    const s = new InputState();
    s.keyDown('KeyK');
    s.keyUp('KeyK');
    expect(s.sample().pressed.has('heavy')).toBe(true);
  });
  it('rebind mengganti tombol', () => {
    const s = new InputState({ ...DEFAULT_KEYS, light: ['KeyZ'] });
    s.keyDown('KeyJ');
    expect(s.sample().pressed.has('light')).toBe(false);
    s.keyDown('KeyZ');
    expect(s.sample().pressed.has('light')).toBe(true);
  });
  it('WASD dan panah sama-sama menggerakkan', () => {
    const s = new InputState();
    s.keyDown('KeyA');
    expect(s.sample().held.has('left')).toBe(true);
    s.keyUp('KeyA');
    s.keyDown('ArrowLeft');
    expect(s.sample().held.has('left')).toBe(true);
  });
  it('clear (kehilangan fokus) melepas semua tombol', () => {
    const s = new InputState();
    s.keyDown('KeyL');
    s.clear();
    expect(s.sample().held.size).toBe(0);
  });
  it('gamepad: pemetaan tombol standar dan stik analog', () => {
    const b = (i: number) => Array.from({ length: 16 }, (_, k) => k === i);
    expect(padActions({ buttons: b(2), axes: [0, 0] }).has('light')).toBe(true);
    expect(padActions({ buttons: b(3), axes: [0, 0] }).has('heavy')).toBe(true);
    expect(padActions({ buttons: b(5), axes: [0, 0] }).has('guard')).toBe(true);
    expect(padActions({ buttons: b(0), axes: [0, 0] }).has('dodge')).toBe(true);
    expect(padActions({ buttons: b(1), axes: [0, 0] }).has('special')).toBe(true);
    expect(padActions({ buttons: b(9), axes: [0, 0] }).has('pause')).toBe(true);
    expect(padActions({ buttons: b(99), axes: [-0.9, 0.9] })).toEqual(new Set(['left', 'down']));
    expect(padActions({ buttons: b(99), axes: [0.3, -0.3] }).size).toBe(0);
  });
  it('gamepad menghasilkan edge sekali per tekan', () => {
    const s = new InputState();
    const b = (i: number) => Array.from({ length: 16 }, (_, k) => k === i);
    s.setPad({ buttons: b(2), axes: [0, 0] });
    expect(s.sample().pressed.has('light')).toBe(true);
    s.setPad({ buttons: b(2), axes: [0, 0] });
    expect(s.sample().pressed.has('light')).toBe(false);
  });
});

describe('PlayerController', () => {
  const frame = (held: string[], pressed: string[]) =>
    ({ held: new Set(held), pressed: new Set(pressed) }) as never;

  it('J menghasilkan light; K menghasilkan heavy', () => {
    const c = new PlayerController();
    const f = fighter();
    expect(c.intent(frame(['light'], ['light']), f, 1).presses).toEqual(['light']);
    expect(c.intent(frame(['heavy'], ['heavy']), f, 100).presses).toEqual(['heavy']);
  });
  it('arah belakang + J = serangan badan (back-light)', () => {
    const c = new PlayerController();
    const f = fighter(); // menghadap kanan
    expect(c.intent(frame(['left', 'light'], ['light']), f, 1).presses).toEqual(['back-light']);
    expect(c.intent(frame(['right', 'light'], ['light']), f, 100).presses).toEqual(['light']);
  });
  it('J + K bersamaan (chord) = jurus spesial, bukan pukulan biasa', () => {
    const c = new PlayerController();
    const f = fighter();
    expect(c.intent(frame(['light', 'heavy'], ['light', 'heavy']), f, 1).presses).toEqual(['special']);
  });
  it('J lalu K dalam 3 tick juga dianggap chord', () => {
    const c = new PlayerController();
    const f = fighter();
    expect(c.intent(frame(['light'], ['light']), f, 10).presses).toEqual(['light']);
    expect(c.intent(frame(['light', 'heavy'], ['heavy']), f, 13).presses).toContain('special');
  });
  it('J dan K berjauhan bukan chord', () => {
    const c = new PlayerController();
    const f = fighter();
    c.intent(frame(['light'], ['light']), f, 10);
    expect(c.intent(frame(['heavy'], ['heavy']), f, 40).presses).toEqual(['heavy']);
  });
  it('dua kali arah depan dalam 220 ms = dash; arah belakang tidak', () => {
    const c = new PlayerController();
    const f = fighter();
    expect(c.intent(frame(['right'], ['right']), f, 10).dashPressed).toBe(false);
    expect(c.intent(frame(['right'], ['right']), f, 20).dashPressed).toBe(true);
    const c2 = new PlayerController();
    c2.intent(frame(['left'], ['left']), f, 10);
    expect(c2.intent(frame(['left'], ['left']), f, 18).dashPressed).toBe(false);
  });
  it('ketukan kedua terlalu lambat tidak memicu dash', () => {
    const c = new PlayerController();
    const f = fighter();
    c.intent(frame(['right'], ['right']), f, 10);
    expect(c.intent(frame(['right'], ['right']), f, 60).dashPressed).toBe(false);
  });
  it('guard dan hindar diteruskan; arah gerak dihitung dari held', () => {
    const c = new PlayerController();
    const f = fighter();
    const i = c.intent(frame(['guard', 'up', 'right'], ['guard', 'dodge']), f, 1);
    expect(i.presses).toEqual(expect.arrayContaining(['guard', 'dodge']));
    expect(i.guardHeld).toBe(true);
    expect(i.moveX).toBe(1);
    expect(i.moveY).toBe(-1);
  });
});
