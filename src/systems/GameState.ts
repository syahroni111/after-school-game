import { newProfile } from './Profile';
import type { Profile } from './Profile';

/** Keadaan permainan yang sedang berjalan (satu per halaman). SaveSystem mengisi dan menyimpan `profile`. */
class GameState {
  profile: Profile = newProfile();
  slot = -1; // -1 = belum memilih slot (mode uji/dev)

  reset(): void {
    this.profile = newProfile();
    this.slot = -1;
  }
}

export const game = new GameState();
