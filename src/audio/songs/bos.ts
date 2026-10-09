// Lagu bos: D minor, 168 BPM, bass 1/16 yang menekan. Progresi Dm | Bb | Gm | A.
import { arp, bars, sixteenths } from '../songTheory';
import type { SongDef } from '../songTheory';

const arps = bars(
  arp('D4', 'F4', 'A4'),
  arp('Bb3', 'D4', 'F4'),
  arp('G3', 'Bb3', 'D4'),
  arp('A3', 'C#4', 'E4'),
);
const bass = bars(sixteenths('D2'), sixteenths('Bb1'), sixteenths('G2'), sixteenths('A2'));
const drive = 'k h k h s h k h k h k k s h s s';

export const BOS: SongDef = {
  id: 'bos',
  bpm: 168,
  order: ['A', 'B'],
  sections: {
    A: {
      p1: bars(
        'D5 - D5 - F5 - A5 - G5 - F5 - E5 - D5 -',
        'Bb4 - Bb4 - D5 - F5 - E5 - D5 - C5 - Bb4 -',
        'G4 - G4 - Bb4 - D5 - C5 - Bb4 - A4 - G4 -',
        'A4 - C#5 - E5 - A5 - G5 - E5 - C#5 - A4 -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(drive, drive, drive, drive),
    },
    B: {
      p1: bars(
        'D6 - C#6 - C6 - B5 - Bb5 - A5 - G#5 - G5 -',
        'F5 . F5 . F5 - . F5 . G5 . A5 - - - -',
        'D6 - C#6 - C6 - B5 - Bb5 - A5 - G#5 - G5 -',
        'A5 - - - E5 - - - A5 - - - E6 - - -',
      ),
      p2: arps,
      tri: bass,
      noise: bars(drive, drive, drive, drive),
    },
  },
};
