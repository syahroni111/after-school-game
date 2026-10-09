// Lagu judul: C minor, 92 BPM, megah dan pelan. Progresi Cm | Ab | Eb | Bb.
import { arp, bars, quarters } from '../songTheory';
import type { SongDef } from '../songTheory';

const arps = bars(
  arp('C4', 'Eb4', 'G4'),
  arp('Ab3', 'C4', 'Eb4'),
  arp('Eb4', 'G4', 'Bb4'),
  arp('Bb3', 'D4', 'F4'),
);
const bass = bars(quarters('C3'), quarters('Ab2'), quarters('Eb3'), quarters('Bb2'));
const slow = 'k . . . s . . . k . . . s . h .';

export const JUDUL: SongDef = {
  id: 'judul',
  bpm: 92,
  order: ['A', 'B'],
  sections: {
    A: {
      p1: bars(
        'G4 - - - C5 - - - Eb5 - - - D5 - C5 -',
        'Ab4 - - - C5 - - - Eb5 - - - F5 - Eb5 -',
        'G4 - - - Bb4 - - - Eb5 - - - G5 - - -',
        'F5 - - - D5 - - - Bb4 - - - D5 - F5 -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(slow, slow, slow, slow),
    },
    B: {
      p1: bars(
        'C5 - Eb5 - G5 - - - C6 - - - Bb5 - G5 -',
        'Ab5 - - - G5 - F5 - Eb5 - - - F5 - G5 -',
        'Eb5 - G5 - Bb5 - - - G5 - Eb5 - D5 - Eb5 -',
        'D5 - F5 - Bb5 - - - A5 - F5 - D5 - . .',
      ),
      p2: arps,
      tri: bass,
      noise: bars(slow, slow, slow, slow),
    },
  },
};
