// Lagu kilas balik (Bab 5): D minor, 76 BPM, murung. Progresi Dm | Bb | F | C.
import { arp, bars, quarters } from '../songTheory';
import type { SongDef } from '../songTheory';

const arps = bars(
  arp('D4', 'F4', 'A4'),
  arp('Bb3', 'D4', 'F4'),
  arp('F3', 'A3', 'C4'),
  arp('C4', 'E4', 'G4'),
);
const bass = bars(quarters('D2'), quarters('Bb1'), quarters('F2'), quarters('C2'));
const sparse = 'k . . . . . . . . . k . . . . .';

export const KILAS_BALIK: SongDef = {
  id: 'kilas_balik',
  bpm: 76,
  order: ['A', 'B'],
  sections: {
    A: {
      p1: bars(
        'A4 - - - D5 - - - F5 - - - E5 - D5 -',
        'D5 - - - Bb4 - - - D5 - - - F5 - - -',
        'C5 - - - F5 - - - A5 - - - G5 - F5 -',
        'E5 - - - G5 - - - E5 - - - C5 - - -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(sparse, sparse, sparse, sparse),
    },
    B: {
      p1: bars(
        'F5 - - - A5 - - - D6 - - - C6 - A5 -',
        'Bb5 - - - A5 - G5 - F5 - - - D5 - - -',
        'C6 - - - A5 - - - F5 - - - A5 - C6 -',
        'G5 - - - E5 - - - C5 - - - E5 - G5 -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(sparse, sparse, sparse, sparse),
    },
  },
};
