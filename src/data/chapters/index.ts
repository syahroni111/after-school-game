import { CH00 } from './ch00_prolog';
import { CH01 } from './ch01_kabar';
import type { ChapterDef } from './types';

export type { ChapterDef };

/** Semua bab, berurutan. Bab 2 sampai Epilog ditambahkan di M8. */
export const CHAPTERS: readonly ChapterDef[] = [CH00, CH01];

export const chapterById = (id: string): ChapterDef | undefined => CHAPTERS.find((c) => c.id === id);
