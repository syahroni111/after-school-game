import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { trackErrors, waitScene } from './helpers';

interface Sandbox {
  world: { tickCount: number; hitstop: number; paused: boolean };
  player: { state: string; hp: number; x: number; y: number; combo: number; stamina: number };
  dummy: { state: string; hp: number; x: number };
  freezeOnHit: boolean;
  setFrozen(on: boolean): void;
}
const sb = <T>(page: Page, fn: (s: Sandbox) => T) =>
  page.evaluate(`(${fn.toString()})(window.__sandbox)`) as Promise<T>;

async function open(page: Page, query = '') {
  await page.goto(`/?scene=CombatSandbox${query}`);
  await waitScene(page, 'CombatSandbox');
  await page.waitForFunction(() => !!(window as unknown as { __sandbox?: unknown }).__sandbox);
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
}

async function walkToDummy(page: Page) {
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => {
    const s = (window as unknown as { __sandbox: Sandbox }).__sandbox;
    return s.dummy.x - s.player.x < 32;
  });
  await page.keyboard.up('ArrowRight');
}

test('M3: kombo, berat, efek, dan bertahan di sandbox (keyboard nyata)', async ({ page }) => {
  const t = trackErrors(page);
  await open(page);
  await walkToDummy(page);

  // Rantai kombo: J J J K
  const hp0 = await sb(page, (s) => s.dummy.hp);
  for (const wait of [450, 650, 650]) {
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(wait);
  }
  const hp1 = await sb(page, (s) => s.dummy.hp);
  expect(hp1).toBeLessThan(hp0);

  // Pukulan berat: bekukan saat mendarat untuk tangkapan layar.
  await sb(page, (s) => (s.freezeOnHit = true));
  await page.keyboard.press('KeyK');
  await page.waitForFunction(
    () => (window as unknown as { __sandbox: Sandbox }).__sandbox.world.paused,
    null,
    { timeout: 5000 },
  );
  await page.screenshot({ path: 'docs/screens/M3_heavy_hit.png' });
  await sb(page, (s) => s.setFrozen(false));
  await page.waitForTimeout(1500);
  expect(await sb(page, (s) => s.dummy.hp)).toBeLessThan(hp1);

  // Menghindar dan bertahan tidak membuat error.
  await page.keyboard.press('Space');
  await page.waitForTimeout(700);
  await page.keyboard.down('KeyL');
  await page.waitForTimeout(400);
  expect(await sb(page, (s) => s.player.state)).toBe('block');
  await page.keyboard.up('KeyL');
  await page.screenshot({ path: 'docs/screens/M3_sandbox.png' });
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});

test('M3: tangkis tepat waktu lalu serangan balik (boneka menyerang berkala)', async ({ page }) => {
  const t = trackErrors(page);
  await open(page, '&mode=jab');
  await walkToDummy(page);
  // Tekan guard sesaat sebelum boneka memukul (setiap 90 tick), lalu serang balik.
  const start = await sb(page, (s) => s.world.tickCount);
  expect(start).toBeGreaterThanOrEqual(0);
  let parried = false;
  for (let attempt = 0; attempt < 6 && !parried; attempt++) {
    await page.waitForFunction(
      () => {
        const s = (window as unknown as { __sandbox: Sandbox }).__sandbox;
        const m = s.world.tickCount % 90;
        return m >= 5 && m <= 6 && s.player.state !== 'hitstun';
      },
      null,
      { polling: 4, timeout: 5000 },
    );
    await page.keyboard.down('KeyL');
    await page.waitForTimeout(150);
    parried = (await sb(page, (s) => s.player.state)) === 'parry';
    if (parried) {
      await page.keyboard.press('KeyJ');
      await page.waitForTimeout(150);
    }
    await page.keyboard.up('KeyL');
    await page.waitForTimeout(600);
  }
  expect(parried).toBe(true);
  expect(t.errors).toEqual([]);
});
