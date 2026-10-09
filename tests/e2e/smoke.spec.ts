import { expect, test } from '@playwright/test';

test('M0/M1: canvas 480x270 zoom bulat, aset termuat tanpa 404 atau error konsol', async ({ page }) => {
  const errors: string[] = [];
  const bad: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.waitForFunction(
    () =>
      (window as unknown as { __game?: { registry: { get(k: string): unknown } } }).__game?.registry.get(
        'assetsReady',
      ) === true,
    null,
    { timeout: 30_000 },
  );
  await page.waitForTimeout(500);
  const info = await canvas.evaluate((c: HTMLCanvasElement) => ({
    w: c.width,
    h: c.height,
    cssW: c.getBoundingClientRect().width,
    cssH: c.getBoundingClientRect().height,
  }));
  expect(info.w).toBe(480);
  expect(info.h).toBe(270);
  expect(info.cssW % 480).toBe(0);
  expect(info.cssH % 270).toBe(0);
  const anim = await page.evaluate(() => {
    const g = (window as unknown as { __game: Phaser.Game }).__game;
    return { clip: g.anims.exists('A01_protagonis:pukulan_kait'), tex: g.textures.exists('stage:halaman') };
  });
  expect(anim).toEqual({ clip: true, tex: true });
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'docs/screens/M1_assets.png' });
});
