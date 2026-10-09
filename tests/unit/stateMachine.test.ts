import { describe, expect, it } from 'vitest';
import { FighterStateMachine, TRANSITIONS } from '../../src/combat/FighterStateMachine';
import type { FState } from '../../src/combat/FighterStateMachine';

const ALL = Object.keys(TRANSITIONS) as FState[];

function at(state: FState): FighterStateMachine {
  const sm = new FighterStateMachine();
  sm.force(state);
  return sm;
}

describe('FighterStateMachine', () => {
  it('mulai dari idle', () => {
    expect(new FighterStateMachine().state).toBe('idle');
  });
  it('idle <-> walk', () => {
    const sm = new FighterStateMachine();
    expect(sm.go('walk', 'move')).toBe(true);
    expect(sm.go('idle', 'stop')).toBe(true);
  });
  it('idle -> attack dan attack -> attack (kombo)', () => {
    const sm = new FighterStateMachine();
    expect(sm.go('attack')).toBe(true);
    expect(sm.go('attack')).toBe(true);
    expect(sm.go('idle')).toBe(true);
  });
  it('attack tidak bisa langsung block (komit)', () => {
    const sm = at('attack');
    expect(sm.go('block')).toBe(false);
    expect(sm.state).toBe('attack');
  });
  it('block -> parry -> counter', () => {
    const sm = at('block');
    expect(sm.go('parry')).toBe(true);
    expect(sm.go('counter')).toBe(true);
    expect(sm.go('idle')).toBe(true);
  });
  it('counter hanya lewat parry (tidak dari idle atau block)', () => {
    expect(at('idle').go('counter')).toBe(false);
    expect(at('block').go('counter')).toBe(false);
  });
  it('parry tidak bisa dimasuki langsung dari idle', () => {
    expect(at('idle').go('parry')).toBe(false);
  });
  it('dodge boleh disambung ke serangan dan bertahan', () => {
    expect(at('dodge').go('attack')).toBe(true);
    expect(at('dodge').go('block')).toBe(true);
  });
  it('hitstun bisa kena lagi (hitstun -> hitstun)', () => {
    expect(at('hitstun').go('hitstun')).toBe(true);
  });
  it('rantai jatuh: knockback -> down -> getup -> idle', () => {
    const sm = at('knockback');
    expect(sm.go('down')).toBe(true);
    expect(sm.go('getup')).toBe(true);
    expect(sm.go('idle')).toBe(true);
  });
  it('knockback tidak bisa langsung idle atau getup', () => {
    expect(at('knockback').go('idle')).toBe(false);
    expect(at('knockback').go('getup')).toBe(false);
  });
  it('down harus lewat getup', () => {
    expect(at('down').go('idle')).toBe(false);
    expect(at('down').go('attack')).toBe(false);
  });
  it('ko tidak bisa berjalan, tetapi bisa di-revive ke idle', () => {
    expect(at('ko').go('walk')).toBe(false);
    expect(at('ko').go('idle')).toBe(true);
  });
  it('semua state boleh masuk cutscene', () => {
    for (const s of ALL) expect(at(s).can('cutscene'), s).toBe(true);
  });
  it('semua state tempur bisa menuju ko (dikalahkan); cutscene tidak', () => {
    for (const s of ALL) if (s !== 'ko' && s !== 'cutscene') expect(at(s).can('ko'), s).toBe(true);
  });
  it('tidak ada tujuan di tabel yang bukan state valid', () => {
    for (const s of ALL) for (const t of TRANSITIONS[s]) expect(ALL.includes(t), `${s}->${t}`).toBe(true);
  });
  it('perpindahan tercatat dengan penyebab, dan stateTick direset', () => {
    const sm = new FighterStateMachine();
    sm.advance();
    sm.advance();
    expect(sm.stateTick).toBe(2);
    sm.go('walk', 'tes-sebab');
    expect(sm.stateTick).toBe(0);
    expect(sm.log.at(-1)).toMatchObject({ from: 'idle', to: 'walk', cause: 'tes-sebab', tick: 2 });
  });
  it('perpindahan tidak sah tidak mengubah state maupun log', () => {
    const sm = at('down');
    const n = sm.log.length;
    sm.go('idle');
    expect(sm.log.length).toBe(n);
  });
  it('force melewati tabel tetapi tetap tercatat', () => {
    const sm = new FighterStateMachine();
    sm.force('down', 'paksa');
    expect(sm.state).toBe('down');
    expect(sm.log.at(-1)?.cause).toBe('paksa');
  });
  it('log dibatasi ukurannya', () => {
    const sm = new FighterStateMachine(5);
    for (let i = 0; i < 20; i++) sm.go(i % 2 ? 'idle' : 'walk');
    expect(sm.log.length).toBeLessThanOrEqual(5);
  });
});
