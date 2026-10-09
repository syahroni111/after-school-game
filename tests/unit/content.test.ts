import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/data/chapters';
import { say, narasi } from '../../src/data/cutscene';
import type { Cmd } from '../../src/data/cutscene';
import { validateAll, validateChapter, validateCommands, validateScreen } from '../../src/data/validateContent';
import type { ScreenDef } from '../../src/data/stages';

const ok = (cmds: Cmd[]) => validateCommands(cmds, 't');

describe('validasi konten cerita', () => {
  it('semua bab yang ada lulus validasi', () => {
    expect(validateAll()).toEqual([]);
  });
  it('ada Prolog dan Bab 1, berurutan', () => {
    expect(CHAPTERS.map((c) => c.id).slice(0, 2)).toEqual(['ch00', 'ch01']);
  });

  describe('teks', () => {
    it('huruf kecil ditolak', () => {
      expect(ok([say('A01_protagonis', 'Halo semua')]).join()).toContain('karakter tidak didukung');
    });
    it('tanda kutip, kurung, titik koma, persen, dan elipsis ditolak', () => {
      for (const t of ['"HALO"', 'HALO (YA)', 'A; B', '50%', 'TUNGGU…']) expect(ok([narasi(t)]).length, t).toBeGreaterThan(0);
    });
    it('karakter font yang sah diterima', () => {
      expect(ok([say('A01_protagonis', "AYO, JANGAN MENYERAH! BISA? YA... 5 & 6 - 7/8: OK'")])).toEqual([]);
    });
    it('lebih dari 3 baris ditolak', () => {
      const long = 'KATA '.repeat(60).trim();
      expect(ok([say('A01_protagonis', long)]).join()).toContain('baris');
    });
    it('teks kosong ditolak', () => {
      expect(ok([say('A01_protagonis', '   ')]).join()).toContain('kosong');
    });
    it('judul dan petunjuk terlalu panjang ditolak', () => {
      expect(ok([{ c: 'title', text: 'A'.repeat(40) }]).length).toBe(1);
      expect(ok([{ c: 'hint', text: 'A'.repeat(70) }]).length).toBe(1);
    });
  });

  describe('rujukan', () => {
    it('tokoh, ekspresi, dan animasi yang tidak ada ditolak', () => {
      expect(ok([say('X99_tidak_ada', 'HALO')]).join()).toContain('tokoh tidak dikenal');
      expect(ok([say('A01_protagonis', 'HALO', 'senang' as never)]).join()).toContain('ekspresi');
      expect(ok([{ c: 'spawn', id: 'g', char: 'D01_guru', x: 100, y: 200, anim: 'pukulan_cepat' }]).join()).toContain('tidak punya animasi');
      expect(
        ok([
          { c: 'spawn', id: 'w', char: 'C03_kutu_buku', x: 100, y: 200 },
          { c: 'anim', id: 'w', anim: 'pukulan_berat' },
        ]).join(),
      ).toContain('tidak punya animasi');
    });
    it('musuh, sfx, lagu, dan unlock yang tidak valid ditolak', () => {
      expect(ok([{ c: 'spawnWave', spawns: [{ enemy: 'siluman', side: 'left' }] }]).join()).toContain('musuh');
      expect(ok([{ c: 'sfx', name: 'ledakan_nuklir' }]).join()).toContain('sfx');
      expect(ok([{ c: 'music', song: 'dangdut' }]).join()).toContain('lagu');
      expect(ok([{ c: 'unlock', what: 'move:terbang' }]).join()).toContain('unlock');
      expect(ok([{ c: 'unlock', what: 'char:C03_kutu_buku' }]).join()).toContain('unlock');
      expect(ok([{ c: 'unlock', what: 'location:bulan' }]).join()).toContain('lokasi');
    });
    it('perintah bersarang di ifFlag ikut diperiksa', () => {
      const e = ok([{ c: 'ifFlag', key: 'k', then: [say('A01_protagonis', 'halo')] }]);
      expect(e.length).toBeGreaterThan(0);
    });
    it('gerak di luar jangkauan ditolak', () => {
      expect(ok([{ c: 'move', id: 'player', x: 900 }]).length).toBe(1);
      expect(ok([{ c: 'move', id: 'player', x: 100, y: 20 }]).length).toBe(1);
    });
  });

  describe('layar dan bab', () => {
    const base: ScreenDef = { id: 'uji', stage: 'halaman', spawns: [] };
    it('stage, cuaca, musuh, lagu tidak dikenal ditolak', () => {
      expect(validateScreen({ ...base, stage: 'mars' }).join()).toContain('stage');
      expect(validateScreen({ ...base, weather: 'salju' as never }).join()).toContain('cuaca');
      expect(validateScreen({ ...base, spawns: [{ enemy: 'x', side: 'left' }] }).join()).toContain('musuh');
      expect(validateScreen({ ...base, music: 'x' }).join()).toContain('lagu');
    });
    it('cutsceneOnly tidak boleh punya musuh dan harus punya skrip', () => {
      expect(validateScreen({ ...base, cutsceneOnly: true }).join()).toContain('tanpa skrip');
      expect(validateScreen({ ...base, cutsceneOnly: true, before: [narasi('HALO')], spawns: [{ enemy: 'cepat', side: 'left' }] }).join()).toContain('tidak boleh punya musuh');
    });
    it('dua bos dalam satu layar ditolak', () => {
      const s: ScreenDef = { ...base, spawns: [{ enemy: 'jaka', side: 'left', boss: true }, { enemy: 'arga', side: 'right', boss: true }] };
      expect(validateScreen(s).join()).toContain('satu bos');
    });
    it('id layar ganda dan bab berikutnya yang tidak ada ditolak', () => {
      const ch = { id: 'x', title: 'UJI', screens: [base, base], next: 'tidak_ada' };
      expect(validateChapter(ch).join()).toContain('berikutnya');
      expect(validateAll([ch, { ...ch, id: 'y', next: undefined }]).join()).toContain('id layar ganda');
    });
    it('flag yang dibaca tetapi tidak pernah diset dilaporkan', () => {
      const s: ScreenDef = { ...base, id: 'f1', cutsceneOnly: true, before: [{ c: 'ifFlag', key: 'hantu', then: [narasi('A')] }] };
      expect(validateAll([{ id: 'z', title: 'Z', screens: [s] }]).join()).toContain('hantu');
      const s2: ScreenDef = { ...base, id: 'f2', cutsceneOnly: true, before: [{ c: 'setFlag', key: 'hantu' }, { c: 'ifFlag', key: 'hantu', then: [narasi('A')] }] };
      expect(validateAll([{ id: 'z2', title: 'Z', screens: [s2] }])).toEqual([]);
    });
  });
});
