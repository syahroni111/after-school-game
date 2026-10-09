import { describe, expect, it } from 'vitest';
import { ARCHIVES } from '../../src/data/archives';
import { bossRushScreens, freePlayScreens, playableChapters } from '../../src/data/modes';
import { CHAPTERS } from '../../src/data/chapters';
import { SIDE_QUESTS, questById } from '../../src/data/sidequests';
import { addArchive } from '../../src/systems/Progression';
import { newProfile } from '../../src/systems/Profile';
import { booksComplete, completeQuest, questState, requiredBooks } from '../../src/systems/Quests';

const quest = (id: string) => questById(id) as NonNullable<ReturnType<typeof questById>>;

describe('Cerita Sekolah', () => {
  it('terkunci sampai bab syaratnya selesai, lalu tersedia, lalu selesai', () => {
    const p = newProfile();
    const q = quest('buku_hilang');
    expect(questState(p, q)).toBe('terkunci');
    p.flags[q.requires] = true;
    expect(questState(p, q)).toBe('tersedia');
    completeQuest(p, q);
    expect(questState(p, q)).toBe('selesai');
  });

  it('misi buku butuh ketiga buku', () => {
    const p = newProfile();
    const q = quest('buku_hilang');
    expect(requiredBooks(q)).toEqual(['buku_1', 'buku_2', 'buku_3']);
    expect(booksComplete(p, q)).toBe(false);
    p.flags.item_buku_1 = p.flags.item_buku_2 = true;
    expect(booksComplete(p, q)).toBe(false);
    p.flags.item_buku_3 = true;
    expect(booksComplete(p, q)).toBe(true);
    expect(booksComplete(p, quest('proposal_osis'))).toBe(true); // tanpa buku
  });

  it('hadiah (uang, arsip, statistik) diberikan tepat sekali', () => {
    const p = newProfile();
    const q = quest('pengganggu_lapangan');
    const before = p.money;
    const toasts = completeQuest(p, q);
    expect(toasts).toContain('ARSIP SEJARAH BARU');
    expect(p.money).toBe(before + q.reward.money);
    expect(p.archives).toContain(q.reward.archive);
    expect(p.bonus.stamina).toBe(5);
    expect(completeQuest(p, q)).toEqual([]);
    expect(p.money).toBe(before + q.reward.money);
    expect(p.bonus.stamina).toBe(5);
  });

  it('keenam misi punya hadiah arsip berbeda', () => {
    expect(SIDE_QUESTS).toHaveLength(6);
    expect(new Set(SIDE_QUESTS.map((q) => q.reward.archive)).size).toBe(6);
  });
});

describe('Arsip lengkap', () => {
  it('flag arsip_lengkap menyala saat ke-12 arsip terkumpul', () => {
    const p = newProfile();
    ARCHIVES.slice(0, ARCHIVES.length - 1).forEach((a) => addArchive(p, a.id));
    expect(p.flags.arsip_lengkap).toBeUndefined();
    const last = ARCHIVES[ARCHIVES.length - 1];
    expect(addArchive(p, (last as { id: string }).id)).toBe(true);
    expect(p.flags.arsip_lengkap).toBe(true);
    expect(addArchive(p, (last as { id: string }).id)).toBe(false);
  });
  it('ada 12 arsip', () => expect(ARCHIVES).toHaveLength(12));
});

describe('Mode Bebas dan Boss Rush', () => {
  it('layar mode bebas tanpa cutscene, uang, dan sekutu', () => {
    for (const ch of playableChapters(CHAPTERS)) {
      for (const s of freePlayScreens(ch)) {
        expect(s.spawns.length).toBeGreaterThan(0);
        expect(s.free && s.practice && s.noMoney).toBe(true);
        expect(s.before ?? s.during ?? s.after ?? s.allyArga ?? s.escort).toBeFalsy();
        expect(s.playerChar).toBeUndefined();
      }
    }
  });
  it('boss rush memuat setiap bos cerita sekali, berurutan, satu bos per layar', () => {
    const rush = bossRushScreens(CHAPTERS);
    const expected = CHAPTERS.flatMap((c) => c.screens.flatMap((s) => s.spawns.filter((sp) => sp.boss).map((sp) => sp.enemy)));
    expect(rush.map((s) => s.spawns[0]?.enemy)).toEqual(expected);
    expect(rush.every((s) => s.spawns.length === 1)).toBe(true);
    expect(rush.length).toBeGreaterThanOrEqual(7);
    expect(new Set(rush.map((s) => s.id)).size).toBe(rush.length);
  });
});

describe('Seluruh cerita', () => {
  it('Prolog sampai Epilog berantai tanpa putus dan berakhir di ch08', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(['ch00', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08']);
    CHAPTERS.slice(0, -1).forEach((c, i) => expect(c.next).toBe(CHAPTERS[i + 1]?.id));
    expect(CHAPTERS[CHAPTERS.length - 1]?.next).toBeUndefined();
  });
  it('Bab 5 sepia dimainkan sebagai Hendra muda; Bab 7 punya duet dengan Arga', () => {
    const ch5 = CHAPTERS.find((c) => c.id === 'ch05')?.screens.filter((s) => s.spawns.length > 0) ?? [];
    expect(ch5.length).toBeGreaterThan(0);
    expect(ch5.every((s) => s.filter === 'sepia' && s.playerChar === 'A03_murid_pendiam')).toBe(true);
    const ch7 = CHAPTERS.find((c) => c.id === 'ch07')?.screens ?? [];
    expect(ch7.every((s) => s.duet && s.allyArga)).toBe(true);
    expect(ch7.some((s) => s.spawns.some((sp) => sp.enemy === 'haris' && sp.boss))).toBe(true);
  });
});
