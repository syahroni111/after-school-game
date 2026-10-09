import { expect, test } from '@playwright/test';
import { trackErrors, waitScene } from './helpers';

const SHOTS: [string, string, number][] = [
  ['pukulan_berat', 'A01_protagonis', 7],
  ['pukulan_cepat', 'A01_protagonis', 3],
  ['serangan_balik', 'B01_pemimpin_rival', 8],
  ['dorong', 'A02_sahabat', 5],
];

for (const [anim, char, frame] of SHOTS) {
  test(`M2: AnimViewer ${anim} frame aktif ${frame}`, async ({ page }) => {
    const t = trackErrors(page);
    await page.goto(`/?scene=AnimViewer&char=${char}&anim=${anim}&frame=${frame}&pause=1`);
    await waitScene(page, 'AnimViewer');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `docs/screens/M2_animviewer_${anim}.png` });
    expect(t.bad).toEqual([]);
    expect(t.errors).toEqual([]);
  });
}
