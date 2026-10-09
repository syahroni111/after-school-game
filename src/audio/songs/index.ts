import type { SongId } from '../names';
import type { SongDef } from '../songTheory';
import { BOS } from './bos';
import { FESTIVAL } from './festival';
import { JUDUL } from './judul';
import { KILAS_BALIK } from './kilas_balik';
import { SEKOLAH } from './sekolah';
import { TEMPUR } from './tempur';

export const SONGS: Readonly<Record<SongId, SongDef>> = {
  judul: JUDUL,
  sekolah: SEKOLAH,
  tempur: TEMPUR,
  bos: BOS,
  kilas_balik: KILAS_BALIK,
  festival: FESTIVAL,
};
