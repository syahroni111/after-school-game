// Validasi data dunia selain bab: Arsip, Kantin/Dojo, hub (NPC dan titik interaksi), Cerita Sekolah.
import { ARCHIVES, ARCHIVE_IDS } from './archives';
import { hasCharAnim, stageNames } from './assetIndex';
import { CHAPTERS } from './chapters';
import type { ChapterDef } from './chapters';
import { CHARACTERS } from './characters';
import { walkCmds } from './cutscene';
import { DOJO_MOVES } from './dojo';
import { ENEMIES } from './enemies';
import { HUB_LOCATIONS } from './hub';
import { FOODS } from './items';
import { isLocation } from './locations';
import { SIDE_QUESTS } from './sidequests';
import { STAGES } from './stages';
import { PLANNED_CHAPTERS, checkText, validateAll, validateCommands, validateScreen } from './validateContent';

const CHAPTER_FLAG = /^ch\d\d_selesai$/;
const MAX_ARCHIVE_LINES = 4;
const MAX_ARCHIVE_CHARS = 46;

export function validateArchives(): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const a of ARCHIVES) {
    if (ids.has(a.id)) errs.push(`arsip ganda: ${a.id}`);
    ids.add(a.id);
    checkText(a.title, `arsip ${a.id} judul`, errs);
    if (a.lines.length === 0 || a.lines.length > MAX_ARCHIVE_LINES) errs.push(`arsip ${a.id}: jumlah baris ${a.lines.length} (1..${MAX_ARCHIVE_LINES})`);
    for (const l of a.lines) {
      checkText(l, `arsip ${a.id}`, errs);
      if (l.length > MAX_ARCHIVE_CHARS) errs.push(`arsip ${a.id}: baris terlalu panjang (${l.length} > ${MAX_ARCHIVE_CHARS}): ${l}`);
    }
  }
  return errs;
}

export function validateShop(): string[] {
  const errs: string[] = [];
  for (const f of FOODS) {
    for (const t of [f.name, f.effect, f.first.label]) checkText(t, `makanan ${f.id}`, errs);
    if (f.price <= 0) errs.push(`makanan ${f.id}: harga tidak valid`);
  }
  for (const m of DOJO_MOVES) {
    for (const t of [m.label, m.desc]) checkText(t, `dojo ${m.id}`, errs);
    if (m.requires && !CHAPTER_FLAG.test(m.requires)) errs.push(`dojo ${m.id}: syarat bukan flag bab: ${m.requires}`);
  }
  return errs;
}

export function validateHub(): string[] {
  const errs: string[] = [];
  const locs = new Set<string>();
  for (const loc of HUB_LOCATIONS) {
    const w = `hub ${loc.id}`;
    if (locs.has(loc.id)) errs.push(`${w}: lokasi ganda`);
    locs.add(loc.id);
    if (!isLocation(loc.id)) errs.push(`${w}: bukan lokasi yang dikenal`);
    if (!STAGES.some((x) => x.id === loc.stage)) errs.push(`${w}: stage tidak dikenal: ${loc.stage}`);
    checkText(loc.label, `${w} label`, errs);
    const npcIds = new Set<string>();
    for (const n of loc.npcs) {
      const nw = `${w}/${n.id}`;
      if (npcIds.has(n.id)) errs.push(`${nw}: id NPC ganda`);
      npcIds.add(n.id);
      if (!CHARACTERS[n.char]) errs.push(`${nw}: karakter tidak dikenal: ${n.char}`);
      else {
        if (n.idle && !hasCharAnim(n.char, n.idle)) errs.push(`${nw}: tidak punya animasi ${n.idle}`);
        if (!hasCharAnim(n.char, 'idle_berdiri')) errs.push(`${nw}: tidak punya animasi idle_berdiri`);
      }
      if (n.x < 14 || n.x > 466 || n.y < 162 || n.y > 264) errs.push(`${nw}: posisi di luar area jalan (${n.x},${n.y})`);
      if (n.talk.length === 0 || n.talk.every((t) => t.requires)) errs.push(`${nw}: harus punya percakapan bawaan (tanpa requires)`);
      for (const t of n.talk) {
        if (t.requires && !CHAPTER_FLAG.test(t.requires)) errs.push(`${nw}: requires bukan flag bab: ${t.requires}`);
        errs.push(...validateCommands(t.script, nw));
      }
      if (n.action === 'dojo' && loc.id !== 'gimnasium') errs.push(`${nw}: Dojo hanya di gimnasium`);
      if (n.action === 'shop') errs.push(`${nw}: Kantin dibuka lewat titik interaksi, bukan NPC`);
      if (n.quest && !SIDE_QUESTS.some((q) => q.id === n.quest && q.location === loc.id && q.giver === n.id)) {
        errs.push(`${nw}: misi ${n.quest} tidak cocok dengan data misi`);
      }
    }
    for (const sp of loc.spots ?? []) {
      checkText(sp.label, `${w}/${sp.id}`, errs);
      if (sp.action === 'shop' && loc.id !== 'kantin') errs.push(`${w}/${sp.id}: Kantin hanya di kantin`);
    }
  }
  if (!locs.has('halaman')) errs.push('hub: lokasi halaman (bawaan) tidak ada');
  return errs;
}

export function validateQuests(): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const q of SIDE_QUESTS) {
    const w = `misi ${q.id}`;
    if (ids.has(q.id)) errs.push(`${w}: id ganda`);
    ids.add(q.id);
    checkText(q.title, `${w} judul`, errs);
    checkText(q.rule, `${w} aturan`, errs);
    if (!CHAPTER_FLAG.test(q.requires)) errs.push(`${w}: requires bukan flag bab: ${q.requires}`);
    const loc = HUB_LOCATIONS.find((l) => l.id === q.location);
    const giver = loc?.npcs.find((n) => n.id === q.giver);
    if (!giver) errs.push(`${w}: pemberi ${q.giver} tidak ada di ${q.location}`);
    else if (giver.quest !== q.id) errs.push(`${w}: NPC pemberi tidak menunjuk misi ini`);
    if (q.screens.length === 0) errs.push(`${w}: tanpa layar`);
    for (const sc of q.screens) {
      errs.push(...validateScreen(sc));
      if (!sc.free) errs.push(`${w}/${sc.id}: layar misi harus free: true (tokoh pilihan)`);
      if (sc.timeLimit !== undefined && sc.timeLimit <= 0) errs.push(`${w}/${sc.id}: timeLimit tidak valid`);
      if (sc.escort && !ENEMIES[sc.escort]) errs.push(`${w}/${sc.id}: sekutu kawalan tidak dikenal: ${sc.escort}`);
      for (const pk of sc.pickups ?? []) {
        if (pk.x < 10 || pk.x > 470 || pk.y < 162 || pk.y > 264) errs.push(`${w}/${sc.id}: pickup ${pk.id} di luar area`);
      }
    }
    for (const [name, script] of [['intro', q.intro], ['success', q.success], ['fail', q.fail]] as const) {
      errs.push(...validateCommands(script, `${w}.${name}`));
    }
    if (!ARCHIVE_IDS.includes(q.reward.archive)) errs.push(`${w}: arsip hadiah tidak dikenal: ${q.reward.archive}`);
    if (q.reward.money <= 0) errs.push(`${w}: hadiah uang tidak valid`);
    if (q.reward.stat) checkText(q.reward.stat.label, `${w} stat`, errs);
  }
  return errs;
}

/** Setiap arsip harus bisa didapat tepat di satu tempat: penanda di stage, hadiah misi, atau giveArchive. */
export function validateArchiveCoverage(chapters: readonly ChapterDef[]): string[] {
  const where = new Map<string, string[]>();
  const add = (id: string, at: string) => where.set(id, [...(where.get(id) ?? []), at]);
  for (const ch of chapters) {
    for (const sc of ch.screens) {
      for (const pk of sc.pickups ?? []) if (pk.kind !== 'buku') add(pk.id, `${ch.id}/${sc.id} penanda`);
      for (const script of [sc.before, sc.during, sc.after]) {
        if (script) walkCmds(script, (c) => c.c === 'giveArchive' && add(c.id, `${ch.id}/${sc.id} giveArchive`));
      }
    }
  }
  for (const q of SIDE_QUESTS) add(q.reward.archive, `misi ${q.id}`);
  const errs: string[] = [];
  for (const id of ARCHIVE_IDS) {
    const w = where.get(id) ?? [];
    if (w.length === 0) errs.push(`arsip ${id} tidak bisa didapat di mana pun`);
    else if (w.length > 1) errs.push(`arsip ${id} didapat di lebih dari satu tempat: ${w.join(', ')}`);
  }
  for (const id of where.keys()) if (!ARCHIVE_IDS.includes(id)) errs.push(`arsip tidak dikenal dirujuk: ${id}`);
  return errs;
}

/** Semua stage di paket harus dipakai: layar cerita, layar misi, atau lokasi hub. */
export function validateStageCoverage(chapters: readonly ChapterDef[]): string[] {
  const used = new Set<string>();
  for (const ch of chapters) for (const sc of ch.screens) used.add(sc.stage);
  for (const q of SIDE_QUESTS) for (const sc of q.screens) used.add(sc.stage);
  for (const l of HUB_LOCATIONS) used.add(l.stage);
  return stageNames()
    .filter((n) => !used.has(n))
    .map((n) => `stage tidak dipakai di mana pun: ${n}`);
}

/** Setiap lokasi hub selain halaman harus dibuka oleh skrip cerita, kalau tidak Cerita Sekolah di sana tak terjangkau. */
export function validateLocationUnlocks(chapters: readonly ChapterDef[]): string[] {
  const opened = new Set<string>(['halaman']);
  for (const ch of chapters) {
    for (const sc of ch.screens) {
      for (const script of [sc.before, sc.during, sc.after]) {
        if (script) walkCmds(script, (c) => c.c === 'unlock' && c.what.startsWith('location:') && opened.add(c.what.slice(9)));
      }
    }
  }
  return HUB_LOCATIONS.filter((l) => !opened.has(l.id)).map((l) => `lokasi hub tidak pernah dibuka cerita: ${l.id}`);
}

/** Semua pemeriksaan konten (dipakai tools/validate-content.mjs dan test). */
export function validateEverything(): string[] {
  const errs = [...validateAll(), ...validateArchives(), ...validateShop(), ...validateHub(), ...validateQuests()];
  if (CHAPTERS.length >= PLANNED_CHAPTERS.length) errs.push(...validateArchiveCoverage(CHAPTERS), ...validateStageCoverage(CHAPTERS), ...validateLocationUnlocks(CHAPTERS));
  return errs;
}
