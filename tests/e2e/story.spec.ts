import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { trackErrors, waitScene } from './helpers';

const activeScenes = (page: Page) =>
  page.evaluate(() => (window as unknown as { __game: Phaser.Game }).__game.scene.getScenes(true).map((s) => s.scene.key));

/** Menu: Title -> MainMenu -> MULAI BARU -> slot 1 -> kesulitan NORMAL -> cerita dimulai. */
async function startNewGame(page: Page) {
  await page.goto('/');
  await waitScene(page, 'Title');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'docs/screens/M6_title.png' });
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await waitScene(page, 'MainMenu');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screens/M6_mainmenu.png' });
  await page.keyboard.press('Enter'); // MULAI BARU
  await waitScene(page, 'SaveSelect');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/screens/M6_saveselect.png' });
  await page.keyboard.press('Enter'); // slot 1 (kosong)
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); // kesulitan NORMAL (indeks awal)
  await waitScene(page, 'Stage', 20_000);
}

interface StageProbe {
  state: string;
  inCutscene: boolean;
  host: { dialog: { active: boolean } };
  player: { x: number; y: number; hp: number; combo: number };
  world: { fighters: { team: string; x: number; y: number; dead: boolean }[] };
}

const probe = (page: Page) =>
  page.evaluate(() => {
    const s = (window as unknown as { __stage?: StageProbe }).__stage;
    if (!s) return null;
    return {
      state: s.state,
      cut: s.inCutscene,
      dialog: s.host.dialog.active,
      px: s.player.x,
      py: s.player.y,
      enemies: s.world.fighters.filter((f) => f.team === 'enemy' && !f.dead).map((f) => ({ x: f.x, y: f.y })),
    };
  });

test('M6: menu -> mulai baru -> dialog pertama muncul (tanpa cheat)', async ({ page }) => {
  const t = trackErrors(page);
  await startNewGame(page);
  // Kartu judul lalu dialog pertama: tunggu kotak dialog aktif.
  await page.waitForFunction(
    () => (window as unknown as { __stage?: StageProbe }).__stage?.host.dialog.active === true,
    null,
    { timeout: 30_000 },
  );
  await page.waitForTimeout(1600); // efek ketik
  await page.screenshot({ path: 'docs/screens/M6_dialog_narasi.png' });
  await page.keyboard.press('Enter'); // selesaikan ketik
  await page.keyboard.press('Enter'); // lanjut ke dialog berikutnya (Raka)
  await page.waitForTimeout(1800);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  // Dialog bicara tokoh dengan potret.
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'docs/screens/M6_dialog_potret.png' });
  expect(await page.evaluate(() => localStorage.getItem('afterschool.save.v1.0') !== null)).toBe(true);
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});

test('M6: Prolog dan Bab 1 dimainkan sampai tamat bab dan tersimpan (bot, cheat ?debug=1)', async ({ page }) => {
  test.setTimeout(600_000);
  const t = trackErrors(page);
  await page.goto('/?debug=1&god=1&fast=1&power=8');
  await waitScene(page, 'Title');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await waitScene(page, 'MainMenu');
  await page.keyboard.press('Enter');
  await waitScene(page, 'SaveSelect');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await waitScene(page, 'Stage', 20_000);

  const held = new Set<string>();
  const hold = async (code: string, on: boolean) => {
    if (on && !held.has(code)) {
      held.add(code);
      await page.keyboard.down(code);
    } else if (!on && held.has(code)) {
      held.delete(code);
      await page.keyboard.up(code);
    }
  };
  const seen = new Set<string>();
  const start = Date.now();
  let shots = 0;
  while (Date.now() - start < 540_000) {
    const scenes = await activeScenes(page);
    for (const s of scenes) seen.add(s);
    if (scenes.includes('Result')) {
      await page.waitForTimeout(1200);
      if (shots < 3) await page.screenshot({ path: `docs/screens/M6_result_${shots++}.png` });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      if ((await activeScenes(page)).includes('MainMenu')) break;
      continue;
    }
    if (scenes.includes('MainMenu')) break;
    if (!scenes.includes('Stage')) {
      await page.waitForTimeout(100);
      continue;
    }
    const s = await probe(page);
    if (!s) continue;
    if (s.dialog) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(60);
      continue;
    }
    if (s.cut) {
      await page.waitForTimeout(80);
      continue;
    }
    if (s.state === 'clear') {
      for (const c of ['ArrowLeft', 'ArrowUp', 'ArrowDown']) await hold(c, false);
      await hold('ArrowRight', true);
    } else if (s.enemies.length > 0) {
      const tg = s.enemies.reduce((a, b) => (Math.abs(a.x - s.px) + Math.abs(a.y - s.py) * 2 < Math.abs(b.x - s.px) + Math.abs(b.y - s.py) * 2 ? a : b));
      const dx = tg.x - s.px;
      const dy = tg.y - s.py;
      await hold('ArrowRight', dx > 22);
      await hold('ArrowLeft', dx < -22);
      await hold('ArrowDown', dy > 4);
      await hold('ArrowUp', dy < -4);
      if (Math.abs(dx) <= 30 && Math.abs(dy) <= 8) await page.keyboard.press(Math.random() < 0.2 ? 'KeyK' : 'KeyJ');
    } else {
      // Tanpa musuh (mis. tutorial gerak): berjalan ke kanan.
      for (const c of ['ArrowLeft', 'ArrowUp', 'ArrowDown']) await hold(c, false);
      await hold('ArrowRight', true);
    }
    await page.waitForTimeout(50);
  }
  for (const c of [...held]) await hold(c, false);

  expect(seen.has('Result')).toBe(true);
  expect(await activeScenes(page)).toContain('MainMenu');
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('afterschool.save.v1.0') ?? 'null'));
  expect(save?.profile.chapter).toBe('ch02'); // Bab 1 selesai -> bab berikutnya
  expect(save?.profile.step).toBe(0);
  expect(save?.profile.flags.prolog_selesai).toBe(true);
  expect(save?.profile.flags.ch01_selesai).toBe(true);
  expect(save?.profile.moves.counter).toBe(true);
  expect(save?.profile.unlockedChars).toContain('A02_sahabat');
  expect(save?.profile.money).toBeGreaterThan(3000);
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});
