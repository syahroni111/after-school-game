import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { activeScenes, playStory } from './bot';
import { trackErrors, waitScene } from './helpers';

interface HubInternals {
  player: { setPos(x: number, y: number): void };
  host: { dialog: { active: boolean } };
  menu: unknown;
  busy: boolean;
}
interface Prof {
  money: number;
  archives: string[];
  bonus: Record<string, number>;
  sideQuests: Record<string, string>;
  cleared: boolean;
}
const profile = (page: Page) => page.evaluate(() => JSON.parse(JSON.stringify((window as unknown as { __gs: { profile: unknown } }).__gs.profile))) as Promise<Prof>;

/** Dari Hub: bicara dengan pemberi misi, terima, lalu mainkan sampai kembali ke Hub. */
async function runQuest(page: Page, npc: { x: number; y: number }, onStage?: () => Promise<void>) {
  await page.evaluate((n) => (window as unknown as { __hub: HubInternals }).__hub.player.setPos(n.x - 30, n.y), npc);
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyE');
  let staged = false;
  for (let i = 0; i < 80 && !staged; i++) {
    const sc = await activeScenes(page);
    if (sc.includes('Stage')) {
      staged = true;
      break;
    }
    const st = await page.evaluate(() => {
      const h = (window as unknown as { __hub?: HubInternals }).__hub;
      return h ? { dialog: h.host.dialog.active, menu: h.menu !== null, busy: h.busy } : null;
    });
    if (st?.dialog || st?.menu) await page.keyboard.press('Enter'); // dialog lanjut / TERIMA
    else if (st && !st.busy && i % 4 === 0) await page.keyboard.press('KeyE'); // belum terpicu
    await page.waitForTimeout(220);
  }
  if (!staged) await page.screenshot({ path: 'test-results/quest_stuck.png' });
  expect(staged).toBe(true);
  await onStage?.();
  await playStory(page, { maxMs: 240_000, stopAt: ['Hub'] });
  await waitScene(page, 'Hub', 10_000);
  // skrip sukses/gagal diputar di Hub: lanjutkan dialog sampai selesai
  for (let i = 0; i < 30; i++) {
    const busy = await page.evaluate(() => (window as unknown as { __hub: HubInternals }).__hub.busy);
    if (!busy) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
}

test('M8: Cerita Sekolah BUKU YANG HILANG - gagal tanpa buku, sukses dengan buku, hadiah sekali', async ({ page }) => {
  test.setTimeout(480_000);
  const t = trackErrors(page);
  await page.goto('/?debug=1&god=1&fast=1&power=8&chapter=ch03&step=0&scene=Hub&location=perpustakaan');
  await waitScene(page, 'Hub');
  await page.waitForTimeout(500);
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.screenshot({ path: 'docs/screens/M8_hub_perpustakaan.png' });
  const money0 = (await profile(page)).money;

  // 1) menang semua layar tetapi tanpa mengambil buku: misi gagal, tanpa hadiah
  await runQuest(page, { x: 330, y: 192 });
  let p = await profile(page);
  expect(p.sideQuests.buku_hilang).toBeUndefined();
  expect(p.archives).not.toContain('arsip_03');
  const moneyAfterFight = p.money; // uang musuh tetap terhitung? misi bebas: ya
  expect(moneyAfterFight).toBeGreaterThanOrEqual(money0);

  // 2) ambil ketiga buku (dipalsukan lewat flag), menang: hadiah diberikan
  await runQuest(page, { x: 330, y: 192 }, async () => {
    await page.evaluate(() => {
      const f = (window as unknown as { __gs: { profile: { flags: Record<string, boolean> } } }).__gs.profile.flags;
      f.item_buku_1 = f.item_buku_2 = f.item_buku_3 = true;
    });
  });
  p = await profile(page);
  expect(p.sideQuests.buku_hilang).toBe('selesai');
  expect(p.archives).toContain('arsip_03');
  expect(p.bonus.kekuatan).toBe(1);
  await page.screenshot({ path: 'docs/screens/M8_quest_selesai.png' });

  // 3) pemberi tidak menawarkan lagi: bicara saja
  await page.evaluate(() => (window as unknown as { __hub: HubInternals }).__hub.player.setPos(300, 192));
  await page.waitForTimeout(500);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(400);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  }
  expect((await activeScenes(page)).includes('Stage')).toBe(false);
  expect((await profile(page)).bonus.kekuatan).toBe(1);
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});

test('M8: Mode Bebas dan Boss Rush terbuka setelah tamat', async ({ page }) => {
  test.setTimeout(540_000);
  const t = trackErrors(page);
  await page.goto('/?debug=1&god=1&fast=1&power=8&chapter=ch08&step=2&scene=Hub&location=halaman');
  await waitScene(page, 'Hub');
  await page.evaluate(() => {
    const g = (window as unknown as { __gs: { profile: { cleared: boolean; unlockedChars: string[] } } }).__gs;
    g.profile.cleared = true;
    g.profile.unlockedChars.push('B01_pemimpin_rival');
  });
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  // Menu jeda -> MODE BEBAS (indeks 3: LANJUTKAN, PETA, KARAKTER, MODE BEBAS)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
  }
  await page.keyboard.press('Enter');
  await waitScene(page, 'ModeSelect');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screens/M8_mode_select.png' });
  // MULAI BOSS RUSH: indeks 3
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
  }
  await page.keyboard.press('Enter');
  await waitScene(page, 'Stage', 20_000);
  const first = await page.evaluate(() => (window as unknown as { __stage: { screenDef: { id: string; spawns: { enemy: string }[] } } }).__stage.screenDef);
  expect(first.id.startsWith('rush_')).toBe(true);
  expect(first.spawns).toHaveLength(1);
  const prof0 = await profile(page);
  const money0 = prof0.money;
  await playStory(page, { maxMs: 480_000, stopAt: ['ModeSelect'] });
  const p = await profile(page);
  expect(p.money).toBe(money0); // tanpa uang dan tanpa hukuman
  expect(await activeScenes(page)).toContain('ModeSelect');
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});

test('M8: Duet Panji - meteran penuh + J dan K membuat Arga ikut mendorong', async ({ page }) => {
  const t = trackErrors(page);
  await page.goto('/?debug=1&god=1&fast=1&chapter=ch07&step=1');
  await waitScene(page, 'Stage');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  type S = { duetHits: number; state: string; ally: { state: string; move: { id: string } | null }; world: { fighters: { team: string }[] } };
  // lewati cutscene pembuka
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => {
      const s = (window as unknown as { __stage: { state: string; host: { dialog: { active: boolean } } } }).__stage;
      return { state: s.state, dialog: s.host.dialog.active };
    });
    if (st.state === 'fight') break;
    if (st.dialog) await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
  expect(await page.evaluate(() => (window as unknown as { __stage: S }).__stage.duetHits)).toBe(0);
  await page.evaluate(() => ((window as unknown as { __stage: S }).__stage.duetHits = 12));
  await page.keyboard.down('KeyJ');
  await page.keyboard.down('KeyK');
  await page.waitForTimeout(120);
  await page.keyboard.up('KeyJ');
  await page.keyboard.up('KeyK');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'docs/screens/M8_duet.png' });
  const after = await page.evaluate(() => (window as unknown as { __stage: S }).__stage.duetHits);
  expect(after).toBe(0); // meteran terpakai
  expect(t.errors).toEqual([]);
});

test('M8: tangkapan layar sepia (Bab 5) dan penonton (Bab 3)', async ({ page }) => {
  const t = trackErrors(page);
  for (const [chapter, step, name] of [['ch05', 1, 'M8_sepia'], ['ch03', 1, 'M8_penonton']] as const) {
    await page.goto(`/?debug=1&god=1&fast=1&chapter=${chapter}&step=${step}`);
    await waitScene(page, 'Stage');
    await page.locator('canvas').click({ position: { x: 20, y: 20 } });
    for (let i = 0; i < 40; i++) {
      const st = await page.evaluate(() => {
        const s = (window as unknown as { __stage: { state: string; host: { dialog: { active: boolean } } } }).__stage;
        return { state: s.state, dialog: s.host.dialog.active };
      });
      if (st.state === 'fight' && !st.dialog) break;
      if (st.dialog) await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `docs/screens/${name}.png` });
  }
  expect(t.errors).toEqual([]);
});
