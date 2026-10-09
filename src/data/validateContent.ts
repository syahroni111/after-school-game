// Validasi konten cerita (murni): aturan teks, rujukan karakter/animasi/stage/musuh, dan konsistensi flag.
// Dipakai oleh tools/validate-content.mjs dan test unit.
import { isSfx, isSong } from '../audio/names';
import { isValidUnlock, parseUnlock } from '../systems/Progression';
import { findInvalidChars, wrapText } from '../util/text';
import { ARCHIVE_IDS } from './archives';
import { hasCharAnim, hasTexture } from './assetIndex';
import { CHAPTERS } from './chapters';
import type { ChapterDef } from './chapters';
import { CHARACTERS } from './characters';
import { EXPRESSIONS, walkCmds } from './cutscene';
import type { Cmd, WaitCond } from './cutscene';
import { DIALOG, dialogMaxChars } from './dialogLayout';
import { ENEMIES } from './enemies';
import { isLocation } from './locations';
import { portraitFor } from './portraits';
import { STAGES } from './stages';
import type { ScreenDef } from './stages';

const WAIT_CONDS: readonly WaitCond[] = ['move', 'hit', 'combo', 'guard', 'parry', 'dodge', 'counter', 'special', 'dash'];
const WEATHERS = ['cerah', 'berawan', 'hujan', 'sore', 'malam'];
/** Bab yang direncanakan (GDD §3). Bab 2 sampai Epilog ditulis di M8; test M8 memastikan semuanya ada. */
export const PLANNED_CHAPTERS = ['ch00', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'] as const;
const MAX_TITLE = 30;
const MAX_HINT = 60;
const MAX_NAME = 26;
/** Flag yang dibuat oleh kode game, bukan oleh skrip. */
const SYSTEM_FLAG = /^(loc_|dojo_|shop_|quest_|arsip_|item_|sparring_|ch\d\d_selesai$)/;

export interface FlagUse {
  set: Set<string>;
  read: Set<string>;
}

export function checkText(text: string, where: string, errs: string[]): void {
  const bad = findInvalidChars(text);
  if (bad.length) errs.push(`${where}: karakter tidak didukung font: ${bad.map((c) => JSON.stringify(c)).join(' ')} dalam "${text.slice(0, 40)}"`);
}

/** Memeriksa satu daftar perintah (termasuk cabang ifFlag). Mengisi `flags` bila diberikan. */
export function validateCommands(cmds: readonly Cmd[], where: string, flags?: FlagUse): string[] {
  const errs: string[] = [];
  const spawned = new Map<string, string>();
  let i = 0;
  walkCmds(cmds, (cmd) => {
    const at = `${where}#${++i}(${cmd.c})`;
    switch (cmd.c) {
      case 'say': {
        if (!cmd.text.trim()) errs.push(`${at}: teks kosong`);
        checkText(cmd.text, at, errs);
        if (cmd.name !== undefined) {
          checkText(cmd.name, `${at} nama`, errs);
          if (cmd.name.length > MAX_NAME) errs.push(`${at}: nama terlalu panjang`);
        }
        if (cmd.who !== 'narasi' && !CHARACTERS[cmd.who]) errs.push(`${at}: tokoh tidak dikenal: ${cmd.who}`);
        if (cmd.face !== undefined && !EXPRESSIONS.includes(cmd.face)) errs.push(`${at}: ekspresi tidak dikenal: ${cmd.face}`);
        const hasPortrait = cmd.who !== 'narasi' && portraitFor(cmd.who) !== null;
        const lines = wrapText(cmd.text, dialogMaxChars(hasPortrait));
        if (lines.length > DIALOG.maxLines) errs.push(`${at}: ${lines.length} baris (maks ${DIALOG.maxLines}) pada lebar ${dialogMaxChars(hasPortrait)} karakter: "${cmd.text.slice(0, 40)}"`);
        break;
      }
      case 'spawn':
        if (!CHARACTERS[cmd.char]) errs.push(`${at}: karakter tidak dikenal: ${cmd.char}`);
        else {
          spawned.set(cmd.id, cmd.char);
          if (cmd.anim && !hasCharAnim(cmd.char, cmd.anim)) errs.push(`${at}: ${cmd.char} tidak punya animasi ${cmd.anim}`);
        }
        break;
      case 'anim': {
        const char = cmd.id === 'player' ? 'A01_protagonis' : spawned.get(cmd.id);
        if (char && !hasCharAnim(char, cmd.anim)) errs.push(`${at}: ${char} tidak punya animasi ${cmd.anim}`);
        break;
      }
      case 'move':
        if (cmd.x < -80 || cmd.x > 560) errs.push(`${at}: x di luar jangkauan: ${cmd.x}`);
        if (cmd.y !== undefined && (cmd.y < 150 || cmd.y > 270)) errs.push(`${at}: y di luar area jalan: ${cmd.y}`);
        break;
      case 'wait':
        if (cmd.ms < 0 || cmd.ms > 20000) errs.push(`${at}: waktu tunggu tidak masuk akal: ${cmd.ms}`);
        break;
      case 'fade':
        if (cmd.ms !== undefined && (cmd.ms < 0 || cmd.ms > 5000)) errs.push(`${at}: durasi fade tidak masuk akal`);
        break;
      case 'setFlag':
        flags?.set.add(cmd.key);
        break;
      case 'ifFlag':
        flags?.read.add(cmd.key);
        break;
      case 'spawnWave':
        for (const s of cmd.spawns) if (!ENEMIES[s.enemy]) errs.push(`${at}: musuh tidak dikenal: ${s.enemy}`);
        break;
      case 'music':
        if (!isSong(cmd.song)) errs.push(`${at}: lagu tidak dikenal: ${cmd.song}`);
        break;
      case 'sfx':
        if (!isSfx(cmd.name)) errs.push(`${at}: sfx tidak dikenal: ${cmd.name}`);
        break;
      case 'giveMoney':
        if (!Number.isInteger(cmd.amount) || cmd.amount <= 0) errs.push(`${at}: jumlah uang tidak valid`);
        break;
      case 'giveArchive':
        if (ARCHIVE_IDS.length > 0 && !ARCHIVE_IDS.includes(cmd.id)) errs.push(`${at}: arsip tidak dikenal: ${cmd.id}`);
        break;
      case 'unlock': {
        if (!isValidUnlock(cmd.what)) errs.push(`${at}: unlock tidak valid: ${cmd.what}`);
        const u = parseUnlock(cmd.what);
        if (u?.kind === 'location' && !isLocation(u.id)) errs.push(`${at}: lokasi tidak dikenal: ${u.id}`);
        break;
      }
      case 'title':
        checkText(cmd.text, at, errs);
        if (cmd.text.length > MAX_TITLE) errs.push(`${at}: judul terlalu panjang`);
        if (cmd.sub !== undefined) checkText(cmd.sub, `${at} sub`, errs);
        break;
      case 'hint':
        checkText(cmd.text, at, errs);
        if (cmd.text.length > MAX_HINT) errs.push(`${at}: petunjuk terlalu panjang (${cmd.text.length} > ${MAX_HINT})`);
        break;
      case 'waitFor':
        if (!WAIT_CONDS.includes(cmd.cond)) errs.push(`${at}: syarat tidak dikenal: ${cmd.cond}`);
        if (cmd.times !== undefined && cmd.times < 1) errs.push(`${at}: times harus >= 1`);
        break;
      default:
        break;
    }
  });
  return errs;
}

export function validateScreen(s: ScreenDef, flags?: FlagUse): string[] {
  const errs: string[] = [];
  const w = `layar ${s.id}`;
  if (!STAGES.some((x) => x.id === s.stage)) errs.push(`${w}: stage tidak dikenal: ${s.stage}`);
  if (s.weather !== undefined && !WEATHERS.includes(s.weather)) errs.push(`${w}: cuaca tidak dikenal: ${s.weather}`);
  if (s.label !== undefined) checkText(s.label, `${w} label`, errs);
  if (s.music !== undefined && !isSong(s.music)) errs.push(`${w}: lagu tidak dikenal: ${s.music}`);
  if (s.playerChar !== undefined && !CHARACTERS[s.playerChar]) errs.push(`${w}: tokoh pemain tidak dikenal`);
  if (s.crowd !== undefined && !hasTexture('npc:formasi:' + s.crowd)) errs.push(w + ': formasi penonton tidak dikenal: ' + s.crowd);
  if (s.playerName !== undefined) checkText(s.playerName, w + ' playerName', errs);
  if (s.duet && !s.allyArga) errs.push(w + ': duet butuh allyArga');
  if (s.cutsceneOnly && s.spawns.length > 0) errs.push(`${w}: cutsceneOnly tidak boleh punya musuh`);
  if (s.cutsceneOnly && !s.before) errs.push(`${w}: cutsceneOnly tanpa skrip before`);
  for (const sp of s.spawns) if (!ENEMIES[sp.enemy]) errs.push(`${w}: musuh tidak dikenal: ${sp.enemy}`);
  const bosses = s.spawns.filter((x) => x.boss).length;
  if (bosses > 1) errs.push(`${w}: lebih dari satu bos`);
  for (const [name, script] of [['before', s.before], ['during', s.during], ['after', s.after]] as const) {
    if (script) errs.push(...validateCommands(script, `${w}.${name}`, flags));
  }
  return errs;
}

export function validateChapter(ch: ChapterDef, flags?: FlagUse): string[] {
  const errs: string[] = [];
  checkText(ch.title, `bab ${ch.id} judul`, errs);
  if (ch.screens.length === 0) errs.push(`bab ${ch.id}: tidak punya layar`);
  if (ch.next !== undefined && !CHAPTERS.some((c) => c.id === ch.next) && !(PLANNED_CHAPTERS as readonly string[]).includes(ch.next)) errs.push(`bab ${ch.id}: bab berikutnya tidak ada: ${ch.next}`);
  for (const s of ch.screens) errs.push(...validateScreen(s, flags));
  return errs;
}

/** Semua bab: aturan per bab, id layar unik, dan flag yang dibaca tetapi tidak pernah diset. */
export function validateAll(chapters: readonly ChapterDef[] = CHAPTERS): string[] {
  const errs: string[] = [];
  const flags: FlagUse = { set: new Set(), read: new Set() };
  const ids = new Set<string>();
  const chapterIds = new Set<string>();
  for (const ch of chapters) {
    if (chapterIds.has(ch.id)) errs.push(`id bab ganda: ${ch.id}`);
    chapterIds.add(ch.id);
    errs.push(...validateChapter(ch, flags));
    for (const s of ch.screens) {
      if (ids.has(s.id)) errs.push(`id layar ganda: ${s.id}`);
      ids.add(s.id);
    }
  }
  for (const k of flags.read) if (!flags.set.has(k) && !SYSTEM_FLAG.test(k)) errs.push(`flag dibaca tetapi tidak pernah diset: ${k}`);
  return errs;
}
