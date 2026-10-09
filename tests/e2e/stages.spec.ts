import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { STAGES } from '../../src/data/stages';
import { trackErrors, waitScene } from './helpers';

async function openStage(page: Page, query: string) {
  await page.goto(`/?scene=Stage&${query}`);
  await waitScene(page, 'Stage');
  await page.waitForFunction(() => !!(window as unknown as { __stage?: unknown }).__stage);
  await page.waitForTimeout(450);
}

test('M5: semua 22 stage bisa dibuka tanpa 404 atau error konsol', async ({ page }) => {
  test.setTimeout(180_000);
  const t = trackErrors(page);
  expect(STAGES).toHaveLength(22);
  for (const s of STAGES) {
    await openStage(page, `stage=${s.id}&unlock=all`);
    const key = await page.evaluate(() =>
      (window as unknown as { __game: Phaser.Game }).__game.scene.isActive('Stage'),
    );
    expect(key, s.id).toBe(true);
  }
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});

const SHOTS: [string, string][] = [
  ['halaman', 'cerah'],
  ['halaman', 'hujan'],
  ['halaman', 'sore'],
  ['lapangan_basket', 'malam'],
  ['lorong_utama', 'malam'], // tanpa gambar varian: overlay biru gelap 45%
  ['gang_belakang', 'hujan'],
  ['atap', 'berawan'],
];
test('M5: tangkapan layar kombinasi cuaca dan waktu', async ({ page }) => {
  const t = trackErrors(page);
  for (const [stage, weather] of SHOTS) {
    await openStage(page, `stage=${stage}&weather=${weather}&unlock=all`);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `docs/screens/M5_${stage}_${weather}.png` });
  }
  expect(t.errors).toEqual([]);
});

test('M5: Jeda membekukan layar dan melanjutkan lagi', async ({ page }) => {
  const t = trackErrors(page);
  await openStage(page, 'screen=kecil&unlock=all');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('Escape');
  await waitScene(page, 'Pause');
  expect(
    await page.evaluate(() => (window as unknown as { __game: Phaser.Game }).__game.scene.isPaused('Stage')),
  ).toBe(true);
  const tick = await page.evaluate(
    () => (window as unknown as { __stage: { world: { tickCount: number } } }).__stage.world.tickCount,
  );
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(
      () => (window as unknown as { __stage: { world: { tickCount: number } } }).__stage.world.tickCount,
    ),
  ).toBe(tick);
  await page.screenshot({ path: 'docs/screens/M5_pause.png' });
  await page.keyboard.press('Enter'); // LANJUTKAN
  await page.waitForFunction(() =>
    (window as unknown as { __game: Phaser.Game }).__game.scene.isActive('Stage'),
  );
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(
      () => (window as unknown as { __stage: { world: { tickCount: number } } }).__stage.world.tickCount,
    ),
  ).toBeGreaterThan(tick);
  expect(t.errors).toEqual([]);
});

test('M5: layar Hasil (rank) setelah stage selesai dan menu debug', async ({ page }) => {
  const t = trackErrors(page);
  await openStage(page, 'stage=halaman&weather=cerah&unlock=all'); // tanpa musuh: langsung LANJUT
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.down('ArrowRight');
  await waitScene(page, 'Result', 40_000);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screens/M5_result.png' });
  await page.keyboard.press('Enter'); // LANJUT -> menu debug
  await waitScene(page, 'DebugMenu');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/screens/M5_debugmenu.png' });
  expect(t.errors).toEqual([]);
});

test('M5: Game Over (coba lagi / keluar)', async ({ page }) => {
  const t = trackErrors(page);
  await openStage(page, 'screen=kecil&diff=sulit');
  await page.evaluate(() => {
    (window as unknown as { __stage: { player: { hp: number } } }).__stage.player.hp = 1;
  });
  await waitScene(page, 'GameOver', 60_000);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/screens/M5_gameover.png' });
  await page.keyboard.press('Enter'); // COBA LAGI
  await waitScene(page, 'Stage');
  expect(t.errors).toEqual([]);
});
