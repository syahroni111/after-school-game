// Lagu festival (Epilog, Kredit): C major, 132 BPM, ceria. Progresi C | G | Am | F.
import { arp, bars, eighths } from '../songTheory';
import type { SongDef } from '../songTheory';

const arps = bars(arp('C4', 'E4', 'G4'), arp('G3', 'B3', 'D4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'));
const bass = bars(eighths('C3'), eighths('G2'), eighths('A2'), eighths('F2'));
const party = 'k h k h s h k h k h k h s h s h';

export const FESTIVAL: SongDef = {
  id: 'festival',
  bpm: 132,
  order: ['A', 'B'],
  sections: {
    A: {
      p1: bars(
        'E5 - G5 - E5 - C5 - E5 - G5 - C6 - - -',
        'D5 - G5 - B5 - G5 - D5 - G5 - B5 - - -',
        'C5 - E5 - A5 - E5 - C5 - E5 - A5 - - -',
        'A5 - C6 - A5 - F5 - A5 - C6 - F6 - - -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(party, party, party, party),
    },
    B: {
      p1: bars(
        'C6 - . C6 - B5 - A5 - G5 - . E5 - G5 -',
        'G5 - . G5 - A5 - B5 - D6 - - - B5 - G5',
        'A5 - . A5 - G5 - E5 - C5 - - - E5 - A5',
        'A5 - C6 - F6 - - - E6 - C6 - A5 - . .',
      ),
      p2: arps,
      tri: bass,
      noise: bars(party, party, party, party),
    },
  },
};
