// Lagu pertarungan biasa: A minor, 152 BPM. Progresi Am | F | C | G.
import { arp, bars, eighths } from '../songTheory';
import type { SongDef } from '../songTheory';

const arps = bars(arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('C4', 'E4', 'G4'), arp('G3', 'B3', 'D4'));
const bass = bars(eighths('A2'), eighths('F2'), eighths('C3'), eighths('G2'));
const rock = 'k . h . s . h . k . h k s . h h';

export const TEMPUR: SongDef = {
  id: 'tempur',
  bpm: 152,
  order: ['A', 'A', 'B', 'B'],
  sections: {
    A: {
      p1: bars(
        'E5 - . E5 - D5 C5 - A4 - - - C5 - D5 E5',
        'F5 - . F5 - E5 D5 - C5 - - - D5 - E5 F5',
        'G5 - . G5 - F5 E5 - C5 - - - E5 - G5 C6',
        'B5 - . A5 - G5 F5 - D5 - - - G5 - A5 B5',
      ),
      p2: arps,
      tri: bass,
      noise: bars(rock, rock, rock, rock),
    },
    B: {
      p1: bars(
        'A5 - - - E5 - - - A5 - G5 - E5 - D5 -',
        'C6 - - - A5 - - - F5 - A5 - C6 - A5 -',
        'G5 - - - E5 - - - G5 - C6 - B5 - G5 -',
        'D6 - - - B5 - - - G5 - B5 - D6 - - -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(rock, rock, rock, rock),
    },
  },
};
