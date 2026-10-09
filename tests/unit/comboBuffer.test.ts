import { describe, expect, it } from 'vitest';
import { BUFFER_TICKS, COMBO_GAP_TICKS, ComboBuffer } from '../../src/combat/ComboBuffer';

describe('ComboBuffer', () => {
  it('buffer 150 ms = 9 tick, jeda kombo 350 ms = 21 tick', () => {
    expect(BUFFER_TICKS).toBe(9);
    expect(COMBO_GAP_TICKS).toBe(21);
  });
  it('tekanan dapat diambil dalam jendela buffer', () => {
    const b = new ComboBuffer();
    b.push('light', 100);
    expect(b.consume(109, (a) => a === 'light')).toBe('light');
    expect(b.size).toBe(0);
  });
  it('tekanan kedaluwarsa setelah jendela buffer', () => {
    const b = new ComboBuffer();
    b.push('light', 100);
    expect(b.consume(110, (a) => a === 'light')).toBeNull();
  });
  it('mengambil yang tertua yang cocok dan menyisakan yang lain', () => {
    const b = new ComboBuffer();
    b.push('light', 0);
    b.push('guard', 1);
    b.push('light', 2);
    expect(b.consume(3, (a) => a === 'guard')).toBe('guard');
    expect(b.consume(3, (a) => a === 'light')).toBe('light');
    expect(b.size).toBe(1);
  });
  it('TTL kustom memperpanjang jendela', () => {
    const b = new ComboBuffer();
    b.push('light', 0, 30);
    expect(b.has(25, (a) => a === 'light')).toBe(true);
    expect(b.has(31, (a) => a === 'light')).toBe(false);
  });
  it('clear mengosongkan', () => {
    const b = new ComboBuffer();
    b.push('heavy', 0);
    b.clear();
    expect(b.size).toBe(0);
  });
});
