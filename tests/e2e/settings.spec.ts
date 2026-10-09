import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { trackErrors, waitScene } from './helpers';

async function tap(page: Page, key: string, n = 1) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(110);
  }
}

const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('afterschool.settings.v1') ?? 'null'));

interface AudioProbe {
  ctx: { state: string } | null;
  musicEngine: { playing: string | null } | null;
}
const audioState = (page: Page) =>
  page.evaluate(() => {
    const a = (window as unknown as { __audio: AudioProbe }).__audio;
    return { state: a.ctx?.state ?? 'none', song: a.musicEngine?.playing ?? null };
  });

test('M9: Pengaturan menyimpan volume, skala, opsi, dan tombol; tetap setelah muat ulang', async ({
  page,
}) => {
  const t = trackErrors(page);
  await page.goto('/?scene=Settings&from=MainMenu');
  await waitScene(page, 'Settings');
  await page.waitForTimeout(400);
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.screenshot({ path: 'docs/screens/M9_settings.png' });
  await tap(page, 'ArrowLeft', 2); // MUSIK 60 -> 40
  await tap(page, 'ArrowDown'); // EFEK SUARA
  await tap(page, 'ArrowRight'); // 80 -> 90
  await tap(page, 'ArrowDown'); // SKALA LAYAR
  await tap(page, 'ArrowRight'); // 2X
  await tap(page, 'ArrowDown'); // KESULITAN nonaktif dilewati -> KOTAK HIT
  await tap(page, 'Enter'); // ya
  await tap(page, 'ArrowDown'); // KURANGI GUNCANGAN
  await tap(page, 'Enter');
  await tap(page, 'ArrowDown'); // KURANGI KILAT
  await tap(page, 'Enter');
  const s1 = await stored(page);
  expect(s1.musicVol).toBeCloseTo(0.4, 5);
  expect(s1.sfxVol).toBeCloseTo(0.9, 5);
  expect(s1.scale).toBe('2');
  expect(s1.showHitbox).toBe(true);
  expect(s1.reduceShake).toBe(true);
  expect(s1.reduceFlash).toBe(true);

  // Ubah tombol: PUKUL RINGAN -> X
  await tap(page, 'ArrowDown'); // UBAH TOMBOL
  await tap(page, 'Enter');
  await page.waitForTimeout(300);
  await tap(page, 'ArrowDown', 4); // PUKUL RINGAN
  await tap(page, 'Enter');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'docs/screens/M9_rebind.png' });
  await page.keyboard.press('KeyX');
  await page.waitForTimeout(300);
  const s2 = await stored(page);
  expect(s2.bindings.light).toEqual(['KeyX']);

  // Muat ulang: pengaturan tetap
  await page.goto('/?scene=Settings&from=MainMenu');
  await waitScene(page, 'Settings');
  const s3 = await stored(page);
  expect(s3.musicVol).toBeCloseTo(0.4, 5);
  expect(s3.bindings.light).toEqual(['KeyX']);
  // zoom 2X diterapkan pada host
  const w = await page.evaluate(() => document.getElementById('game')?.style.width);
  expect(w).toBe('960px');
  expect(t.errors).toEqual([]);
});

test('M9: audio hidup setelah input pertama, lagu sesuai layar, tanpa error konsol', async ({ page }) => {
  const t = trackErrors(page);
  await page.goto('/?debug=1&god=1&chapter=ch01&step=4&scene=Hub&location=halaman');
  await waitScene(page, 'Hub');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  expect(await audioState(page)).toEqual({ state: 'running', song: 'sekolah' });
  await page.goto('/?scene=Stage&screen=test&unlock=all');
  await waitScene(page, 'Stage');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(600);
  expect((await audioState(page)).state).toBe('running');
  expect(t.errors).toEqual([]);
});

test('M9: tab kehilangan fokus membuka Jeda; opsi kotak hit menggambar garis', async ({ page }) => {
  const t = trackErrors(page);
  await page.goto('/?scene=Stage&screen=test&unlock=all');
  await waitScene(page, 'Stage');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('afterschool.settings.v1') ?? '{}');
    s.showHitbox = true;
    localStorage.setItem('afterschool.settings.v1', JSON.stringify(s));
  });
  await page.reload();
  await waitScene(page, 'Stage');
  await page.waitForTimeout(1200);
  const cmds = await page.evaluate(() => {
    const st = (window as unknown as { __stage: { hitboxGfx: { commandBuffer: unknown[] } } }).__stage;
    return st.hitboxGfx.commandBuffer.length;
  });
  expect(cmds).toBeGreaterThan(0);
  await page.screenshot({ path: 'docs/screens/M9_hitbox.png' });
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(
    () => (window as unknown as { __game: Phaser.Game }).__game.scene.isActive('Pause'),
    null,
    { timeout: 5000 },
  );
  expect(t.errors).toEqual([]);
});
