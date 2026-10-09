// Lagu Waktu Bebas / sekolah: C major, 104 BPM, santai. Progresi C | Am | F | G.
import { arp, bars, quarters } from '../songTheory';
import type { SongDef } from '../songTheory';

const arps = bars(arp('C4', 'E4', 'G4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('G3', 'B3', 'D4'));
const bass = bars(quarters('C3'), quarters('A2'), quarters('F2'), quarters('G2'));
const easy = 'k . . . . . h . s . . . . . h .';

export const SEKOLAH: SongDef = {
  id: 'sekolah',
  bpm: 104,
  order: ['A', 'B'],
  sections: {
    A: {
      p1: bars(
        'E5 - - - G5 - E5 - D5 - - - C5 - - -',
        'C5 - - - E5 - A5 - G5 - - - E5 - - -',
        'A5 - - - G5 - F5 - E5 - - - C5 - D5 -',
        'D5 - - - F5 - G5 - B4 - - - D5 - - -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(easy, easy, easy, easy),
    },
    B: {
      p1: bars(
        'G5 - E5 - C5 - E5 - G5 - - - A5 - G5 -',
        'A5 - - - E5 - - - C5 - E5 - A5 - - -',
        'F5 - A5 - C6 - - - A5 - F5 - A5 - G5 -',
        'G5 - F5 - D5 - B4 - D5 - - - G5 - - -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(easy, easy, easy, easy),
    },
  },
};
