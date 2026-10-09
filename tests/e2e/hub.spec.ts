import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { trackErrors, waitScene } from './helpers';

interface GS {
  profile: {
    money: number;
    hp?: number;
    bonus: Record<string, number>;
    moves: Record<string, boolean>;
    flags: Record<string, unknown>;
    archives: string[];
    foodBought: Record<string, boolean>;
  };
}
const gs = <T>(page: Page, fn: (g: GS) => T) =>
  page.evaluate(`(${fn.toString()})(window.__gs)`) as Promise<T>;

/** Tekan tombol berulang dengan jeda: edge tombol dalam satu frame digabung oleh InputManager. */
async function tap(page: Page, key: string, n = 1) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(90);
  }
}

async function open(page: Page, query: string, scene: string) {
  await page.goto(`/?debug=1&chapter=ch01&step=4&money=20000&${query}`);
  await waitScene(page, scene);
  await page.waitForTimeout(500);
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
}

interface HubProbe {
  player: { x: number; y: number };
  host: { dialog: { active: boolean } };
}
const hubState = (page: Page) =>
  page.evaluate(() => {
    const h = (window as unknown as { __hub: HubProbe }).__hub;
    return { x: h.player.x, y: h.player.y, dialog: h.host.dialog.active };
  });

test('M7: Hub - berjalan bebas, bicara dengan NPC (Interaksi), peta, dan menu jeda', async ({ page }) => {
  const t = trackErrors(page);
  await open(page, 'scene=Hub&location=halaman', 'Hub');
  await page.screenshot({ path: 'docs/screens/M7_hub_halaman.png' });
  // Jalan ke Laras (330,188)
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => (window as unknown as { __hub: HubProbe }).__hub.player.y <= 192);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => (window as unknown as { __hub: HubProbe }).__hub.player.x >= 300);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('KeyE');
  await page.waitForFunction(
    () => (window as unknown as { __hub: HubProbe }).__hub.host.dialog.active === true,
    null,
    { timeout: 5000 },
  );
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'docs/screens/M7_hub_dialog.png' });
  await page.keyboard.press('Enter'); // selesaikan ketik
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter'); // tutup dialog
  await page.waitForFunction(
    () => (window as unknown as { __hub: HubProbe }).__hub.host.dialog.active === false,
  );
  await page.waitForTimeout(500);
  // Menu jeda
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/screens/M7_hub_menu.png' });
  await page.keyboard.press('Escape'); // tutup
  await page.waitForTimeout(300);
  expect((await hubState(page)).dialog).toBe(false);
  // Keluar kanan -> Peta
  await page.keyboard.down('ArrowRight');
  await waitScene(page, 'MapSelect', 20_000);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screens/M7_peta.png' });
  expect(t.errors).toEqual([]);
});

test('M7: Kantin - beli makanan mengubah statistik dan uang, bonus hanya sekali', async ({ page }) => {
  const t = trackErrors(page);
  await open(page, 'scene=Shop&from=Hub', 'Shop');
  expect(await gs(page, (g) => g.profile.money)).toBe(20000);
  await page.evaluate(() => ((window as unknown as { __gs: { slot: number } }).__gs.slot = 0)); // pakai slot 1 agar pembelian tersimpan
  await tap(page, 'Enter'); // GORENGAN
  await page.waitForTimeout(300);
  const a = await gs(page, (g) => ({
    money: g.profile.money,
    kek: g.profile.bonus.kekuatan,
    bought: g.profile.foodBought.gorengan,
  }));
  expect(a).toEqual({ money: 19000, kek: 1, bought: true });
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('afterschool.save.v1.0') ?? 'null'),
  );
  expect(saved?.profile.bonus.kekuatan).toBe(1);
  expect(saved?.profile.money).toBe(19000);
  await page.screenshot({ path: 'docs/screens/M7_kantin.png' });
  await tap(page, 'Enter'); // lagi: HP penuh -> ditolak
  await page.waitForTimeout(300);
  expect(await gs(page, (g) => g.profile.money)).toBe(19000);
  await tap(page, 'ArrowDown', 4); // SUSU KOTAK
  await tap(page, 'Enter');
  await page.waitForTimeout(300);
  const b = await gs(page, (g) => ({ money: g.profile.money, kec: g.profile.bonus.kecepatan }));
  expect(b).toEqual({ money: 16500, kec: 1 });
  expect(t.errors).toEqual([]);
});

test('M7: Dojo - beli jurus tersimpan, jurus terkunci ditolak, latih tanding tanpa risiko', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const t = trackErrors(page);
  await open(page, 'scene=Dojo&from=Hub&god=1&power=8&fast=1', 'Dojo');
  await tap(page, 'ArrowDown'); // PUKULAN BADAN
  await tap(page, 'Enter');
  await page.waitForTimeout(300);
  expect(await gs(page, (g) => ({ m: g.profile.money, badan: g.profile.moves.badan }))).toEqual({
    m: 16000,
    badan: true,
  });
  await page.screenshot({ path: 'docs/screens/M7_dojo.png' });
  await tap(page, 'ArrowDown'); // MAJU SELANGKAH (butuh ch02_selesai: belum ada)
  await tap(page, 'Enter');
  await page.waitForTimeout(300);
  expect(await gs(page, (g) => g.profile.moves.dash)).toBe(false);
  // Latih tanding Gilang (indeks 5)
  await tap(page, 'ArrowDown', 3);
  await tap(page, 'Enter');
  await waitScene(page, 'Stage', 15_000);
  const held = new Set<string>();
  const hold = async (c: string, on: boolean) => {
    if (on && !held.has(c)) {
      held.add(c);
      await page.keyboard.down(c);
    } else if (!on && held.has(c)) {
      held.delete(c);
      await page.keyboard.up(c);
    }
  };
  const start = Date.now();
  while (Date.now() - start < 120_000) {
    const sc = await page.evaluate(() =>
      (window as unknown as { __game: Phaser.Game }).__game.scene.getScenes(true).map((s) => s.scene.key),
    );
    if (sc.includes('Dojo') && !sc.includes('Stage')) break;
    const s = await page.evaluate(() => {
      const st = (
        window as unknown as {
          __stage?: {
            player: { x: number; y: number };
            world: { fighters: { team: string; x: number; y: number; dead: boolean }[] };
            state: string;
          };
        }
      ).__stage;
      return st
        ? {
            px: st.player.x,
            py: st.player.y,
            en: st.world.fighters
              .filter((f) => f.team === 'enemy' && !f.dead)
              .map((f) => ({ x: f.x, y: f.y })),
            state: st.state,
          }
        : null;
    });
    if (!s) {
      await page.waitForTimeout(100);
      continue;
    }
    if (s.state === 'clear') await hold('ArrowRight', true);
    else if (s.en.length) {
      const tg = s.en[0] as { x: number; y: number };
      await hold('ArrowRight', tg.x - s.px > 22);
      await hold('ArrowLeft', tg.x - s.px < -22);
      await hold('ArrowDown', tg.y - s.py > 4);
      await hold('ArrowUp', tg.y - s.py < -4);
      if (Math.abs(tg.x - s.px) <= 30 && Math.abs(tg.y - s.py) <= 8) await page.keyboard.press('KeyJ');
    }
    await page.waitForTimeout(60);
  }
  for (const c of [...held]) await hold(c, false);
  await waitScene(page, 'Dojo', 10_000);
  const after = await gs(page, (g) => ({
    m: g.profile.money,
    f: g.profile.flags.sparring_ch01,
    hp: g.profile.hp,
  }));
  expect(after.f).toBe(true);
  expect(after.m).toBe(16000 + 750);
  expect(after.hp).toBeUndefined(); // latih tanding tidak mengubah HP terbawa
  expect(t.errors).toEqual([]);
});

test('M7: Arsip - hanya yang ditemukan terbaca, sisanya ???', async ({ page }) => {
  const t = trackErrors(page);
  await open(page, 'scene=Archive&from=Hub', 'Archive');
  await gs(page, (g) => g.profile.archives.push('arsip_01', 'arsip_03'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/screens/M7_arsip.png' });
  expect(await gs(page, (g) => g.profile.archives.length)).toBe(2);
  expect(t.errors).toEqual([]);
});
