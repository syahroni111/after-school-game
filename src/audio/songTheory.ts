// Teori musik murni untuk sequencer: nada ke frekuensi, pengurai pola, dan pembangun lini waktu lagu. Tanpa WebAudio.
import type { SongId } from './names';

/** Satu bagian lagu: empat jalur, setiap jalur berisi token dipisah spasi (satu token = satu not 1/16). */
export interface SectionDef {
  p1: string; // pulse utama (melodi)
  p2: string; // pulse kedua (arpeggio)
  tri: string; // triangle (bass)
  noise: string; // perkusi: k = kick, s = snare, h = hi-hat
}

export interface SongDef {
  id: SongId;
  bpm: number;
  sections: Readonly<Record<string, SectionDef>>;
  /** Urutan bagian; lagu berulang dari awal setelah bagian terakhir. */
  order: readonly string[];
}

export type Channel = keyof SectionDef;
export const CHANNELS: readonly Channel[] = ['p1', 'p2', 'tri', 'noise'];
export const STEPS_PER_BAR = 16;

export interface NoteEvent {
  step: number;
  /** Panjang dalam not 1/16. */
  len: number;
  /** Nomor MIDI untuk jalur nada; kode perkusi 'k' | 's' | 'h' untuk noise. */
  note: number | 'k' | 's' | 'h';
}

const SEMITONE: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE_RE = /^([A-G])(#|b)?(\d)$/;

export function noteToMidi(token: string): number | null {
  const m = NOTE_RE.exec(token);
  if (!m) return null;
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + (SEMITONE[m[1] as string] as number) + acc;
}

export const midiToHz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

const tokens = (s: string): string[] => s.trim().split(/\s+/).filter(Boolean);

/** Mengurai satu jalur. `.` = hening, `-` = perpanjang not sebelumnya. Mengembalikan null bila ada token tak sah. */
export function parseTrack(track: string, drums: boolean): NoteEvent[] | null {
  const out: NoteEvent[] = [];
  let last: NoteEvent | null = null;
  const all = tokens(track);
  for (let i = 0; i < all.length; i++) {
    const t = all[i] as string;
    if (t === '.') {
      last = null;
    } else if (t === '-') {
      if (!last || drums) return null;
      last.len++;
    } else if (drums) {
      if (t !== 'k' && t !== 's' && t !== 'h') return null;
      out.push({ step: i, len: 1, note: t });
      last = null;
    } else {
      const midi = noteToMidi(t);
      if (midi === null) return null;
      last = { step: i, len: 1, note: midi };
      out.push(last);
    }
  }
  return out;
}

export const trackLength = (track: string): number => tokens(track).length;

export interface Timeline {
  totalSteps: number;
  /** Peristiwa per jalur, diindeks menurut langkah awal. */
  events: Record<Channel, Map<number, NoteEvent>>;
}

/** Menggabungkan semua bagian berurutan menjadi satu lini waktu berulang. Melempar galat bila lagu tidak sah. */
export function buildTimeline(song: SongDef): Timeline {
  const events: Record<Channel, Map<number, NoteEvent>> = {
    p1: new Map(),
    p2: new Map(),
    tri: new Map(),
    noise: new Map(),
  };
  let offset = 0;
  for (const name of song.order) {
    const sec = song.sections[name];
    if (!sec) throw new Error(`${song.id}: bagian tidak ada: ${name}`);
    const len = trackLength(sec.p1);
    for (const ch of CHANNELS) {
      if (trackLength(sec[ch]) !== len)
        throw new Error(`${song.id}/${name}/${ch}: panjang ${trackLength(sec[ch])} != ${len}`);
      const evs = parseTrack(sec[ch], ch === 'noise');
      if (!evs) throw new Error(`${song.id}/${name}/${ch}: token tidak sah`);
      for (const e of evs) events[ch].set(offset + e.step, { ...e, step: offset + e.step });
    }
    offset += len;
  }
  return { totalSteps: offset, events };
}

export const stepSeconds = (bpm: number): number => 60 / bpm / 4;

// ---------- pembantu penulisan pola (setiap fungsi menghasilkan satu birama = 16 token) ----------
const rep = (s: string, n: number): string => Array(n).fill(s).join(' ');
/** Arpeggio tiga nada: a b c b, empat kali. */
export const arp = (a: string, b: string, c: string): string => rep(`${a} ${b} ${c} ${b}`, 4);
/** Not seperdelapan (nada, hening) delapan kali. */
export const eighths = (n: string): string => rep(`${n} .`, 8);
/** Not seperempat yang ditahan tiga perempat. */
export const quarters = (n: string): string => rep(`${n} - - .`, 4);
/** Not 1/16 terus-menerus. */
export const sixteenths = (n: string): string => rep(n, 16);
/** Gabungkan birama. */
export const bars = (...b: string[]): string => b.join(' ');
