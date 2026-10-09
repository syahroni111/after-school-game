import { describe, expect, it } from 'vitest';
import { computeZoom } from '../../src/config';

describe('computeZoom', () => {
  it('memakai kelipatan bulat terbesar yang muat', () => {
    expect(computeZoom(960, 540)).toBe(2);
    expect(computeZoom(1920, 1080)).toBe(4);
    expect(computeZoom(1919, 1079)).toBe(3);
  });
  it('dibatasi oleh sisi yang lebih sempit', () => {
    expect(computeZoom(2400, 600)).toBe(2);
  });
  it('tidak pernah di bawah 1', () => {
    expect(computeZoom(300, 100)).toBe(1);
  });
});
