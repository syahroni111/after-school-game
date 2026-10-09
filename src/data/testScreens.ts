// Layar uji untuk alat dev (?scene=Stage&screen=NAMA). Cerita sebenarnya ada di data/chapters/.
import type { ScreenDef } from './stages';

export const TEST_SCREENS: Readonly<Record<string, ScreenDef>> = {
  test: {
    id: 'test',
    stage: 'halaman',
    weather: 'cerah',
    spawns: [
      { enemy: 'cepat', side: 'right' },
      { enemy: 'agresif', side: 'left', delay: 20 },
      { enemy: 'tank', side: 'right', delay: 20 },
      { enemy: 'dash', side: 'left', delay: 20 },
      { enemy: 'jaka', side: 'right', boss: true },
    ],
  },
  kecil: {
    id: 'kecil',
    stage: 'halaman',
    weather: 'cerah',
    spawns: [
      { enemy: 'cepat', side: 'right' },
      { enemy: 'agresif', side: 'left', delay: 30 },
    ],
  },
  empat: {
    id: 'empat',
    stage: 'lapangan_basket',
    weather: 'sore',
    spawns: [
      { enemy: 'cepat', side: 'right', y: 200 },
      { enemy: 'agresif', side: 'left', y: 215 },
      { enemy: 'tank', side: 'right', y: 235 },
      { enemy: 'dash', side: 'left', y: 250 },
    ],
  },
};
