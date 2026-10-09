import type { ScreenDef } from '../stages';

/** Satu bab cerita: daftar layar berurutan (cutscene + pertarungan). Simpan otomatis di tiap layar. */
export interface ChapterDef {
  id: string;
  title: string;
  /** Layar-layar bab, dimainkan berurutan. */
  screens: readonly ScreenDef[];
  /** Id bab berikutnya; kosong = akhir cerita. */
  next?: string;
  /** Setelah bab selesai pemain masuk Waktu Bebas (hub) sebelum bab berikutnya. */
  hub?: boolean;
}
