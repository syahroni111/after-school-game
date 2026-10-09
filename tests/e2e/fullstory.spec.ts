import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { playStory, activeScenes } from './bot';
import { trackErrors, waitScene } from './helpers';

const profile = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(JSON.stringify((window as unknown as { __gs: { profile: unknown } }).__gs.profile)),
  );

/** Lompat ke satu bab lewat cheat debug, mainkan dengan bot sampai Waktu Bebas (bab terakhir lewat Kredit). */
async function playChapter(page: Page, ch: string) {
  const t = trackErrors(page);
  await page.goto(`/?debug=1&god=1&fast=1&power=8&chapter=${ch}&step=0`);
  await waitScene(page, 'Stage', 30_000);
  let shot = 0;
  await playStory(page, {
    maxMs: 520_000,
    stopAt: ['Hub'],
    onScene: async (s) => {
      if (s === 'Stage' && shot < 2) {
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `docs/screens/M8_${ch}_${shot++}.png` });
      }
    },
  });
  expect(await activeScenes(page)).toContain('Hub');
  const p = await profile(page);
  expect(p.flags[`${ch}_selesai`]).toBe(true);
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
  return p;
}

interface P {
  flags: Record<string, unknown>;
  archives: string[];
  cleared: boolean;
  unlockedChars: string[];
  chapter: string;
}
const CHECKS: Record<string, (p: P) => void> = {
  ch02: (p) => expect(p.flags.tahu_festival).toBe(true),
  ch05: (p) => {
    expect(p.flags.tahu_kebenaran).toBe(true);
    expect(p.archives).toContain('arsip_08');
  },
  ch06: (p) => expect(p.flags.sekar_sekutu).toBe(true),
  ch07: (p) => expect(p.flags.haris_kalah).toBe(true),
  ch08: (p) => {
    expect(p.flags.tamat).toBe(true);
    expect(p.cleared).toBe(true);
    expect(p.unlockedChars).toContain('B01_pemimpin_rival');
    expect(p.chapter).toBe('tamat');
  },
};

for (const ch of ['ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08']) {
  test(`M8: ${ch} dimainkan sampai tamat bab (bot, cheat)`, async ({ page }) => {
    test.setTimeout(420_000);
    const p = (await playChapter(page, ch)) as P;
    CHECKS[ch]?.(p);
  });
}

test('M8: cerita utuh dari menu sampai tamat lewat Hub dan Peta (bot, god)', async ({ page }) => {
  test.setTimeout(2_700_000);
  const t = trackErrors(page);
  await page.goto('/?debug=1&god=1&fast=1&power=8');
  await waitScene(page, 'Title');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await waitScene(page, 'MainMenu');
  await page.keyboard.press('Enter'); // MULAI BARU
  await waitScene(page, 'SaveSelect');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // slot 1
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // NORMAL
  await waitScene(page, 'Stage', 20_000);
  await playStory(page, { maxMs: 2_500_000, stopAt: [], continueStory: true });
  const p = (await profile(page)) as P & {
    sideQuests: Record<string, string>;
    ranks: Record<string, string>;
  };
  expect(p.chapter).toBe('tamat');
  for (const id of ['prolog', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'])
    expect(p.flags[id === 'prolog' ? 'prolog_selesai' : `${id}_selesai`], id).toBe(true);
  expect(p.cleared).toBe(true);
  expect(p.unlockedChars).toContain('B01_pemimpin_rival');
  const loc = [
    'perpustakaan',
    'lapangan_basket',
    'ruang_musik',
    'ruang_osis',
    'parkir_sepeda',
    'kebun_sekolah',
    'kantin',
    'gimnasium',
  ];
  for (const l of loc) expect(p.flags[`loc_${l}`], l).toBe(true);
  await page.screenshot({ path: 'docs/screens/M8_tamat_hub.png' });
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});
