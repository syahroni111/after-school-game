import { CH00 } from './ch00_prolog';
import { CH01 } from './ch01_kabar';
import { CH02 } from './ch02_panji';
import { CH03 } from './ch03_hujan';
import { CH04 } from './ch04_arga';
import { CH05 } from './ch05_kilas';
import { CH06 } from './ch06_jejak';
import { CH07 } from './ch07_atap';
import { CH08 } from './ch08_festival';
import type { ChapterDef } from './types';

export type { ChapterDef };

/** Semua bab, berurutan (Prolog sampai Epilog). */
export const CHAPTERS: readonly ChapterDef[] = [CH00, CH01, CH02, CH03, CH04, CH05, CH06, CH07, CH08];

export const chapterById = (id: string): ChapterDef | undefined => CHAPTERS.find((c) => c.id === id);
