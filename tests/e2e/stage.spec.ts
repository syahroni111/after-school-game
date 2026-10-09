import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { trackErrors, waitScene } from './helpers';

interface Snap {
  state: string;
  px: number;
  py: number;
  pstate: string;
  hp: number;
  enemies: { x: number; y: number; dead: boolean; state: string; boss: boolean }[];
  fps: number;
  money: number;
}

const SNAP = `(() => {
  const s = window.__stage;
  const g = window.__game;
  return {
    state: s.state, px: s.player.x, py: s.player.y, pstate: s.player.state, hp: s.player.hp,
    enemies: s.world.fighters.filter((f) => f.team === 'enemy').map((f) => ({ x: f.x, y: f.y, dead: f.dead, state: f.state, boss: !!f.enemyDef?.boss })),
    fps: g.loop.actualFps, money: window.__money ? window.__money() : 0,
  };
})()`;

async function open(page: Page, query: string) {
  await page.goto(`/?scene=Stage&${query}`);
  await waitScene(page, 'Stage');
  await page.waitForFunction(() => !!(window as unknown as { __stage?: unknown }).__stage);
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
}

/** Bot sederhana: mendekati musuh terdekat dan memukul; setelah bersih, berjalan ke kanan. */
async function playBot(page: Page, opts: { maxMs: number; onMid?: (snap: Snap) => Promise<void> }) {
  const held = new Set<string>();
  const set = async (code: string, on: boolean) => {
    if (on && !held.has(code)) {
      held.add(code);
      await page.keyboard.down(code);
    } else if (!on && held.has(code)) {
      held.delete(code);
      await page.keyboard.up(code);
    }
  };
  const start = Date.now();
  let midDone = false;
  let bossSeen = false;
  let clearShot = false;
  let bossGateOk = true;
  const fpsSamples: number[] = [];
  let last: Snap | null = null;
  while (Date.now() - start < opts.maxMs) {
    const snap = (await page.evaluate(SNAP)) as Snap;
    last = snap;
    const done = await page.evaluate(
      () => (window as unknown as { __stageResult?: unknown }).__stageResult !== undefined,
    );
    if (done) break;
    const alive = snap.enemies.filter((e) => !e.dead);
    if (!bossSeen && snap.enemies.some((e) => e.boss)) {
      bossSeen = true;
      // Aturan: bos masuk saat sisa kroco <= 1.
      bossGateOk = alive.filter((e) => !e.boss).length <= 1;
    }
    if (alive.length >= 3 && !midDone && opts.onMid) {
      midDone = true;
      await opts.onMid(snap);
    }
    if (alive.length >= 2) fpsSamples.push(snap.fps);
    if (snap.state === 'clear') {
      if (!clearShot) {
        clearShot = true;
        await page.screenshot({ path: 'docs/screens/M4_clear.png' });
      }
      await set('ArrowRight', true);
      await set('ArrowLeft', false);
      await set('ArrowUp', false);
      await set('ArrowDown', false);
    } else if (alive.length > 0) {
      const t = alive.reduce((a, b) =>
        Math.abs(a.x - snap.px) + Math.abs(a.y - snap.py) * 2 <
        Math.abs(b.x - snap.px) + Math.abs(b.y - snap.py) * 2
          ? a
          : b,
      );
      const dx = t.x - snap.px;
      const dy = t.y - snap.py;
      await set('ArrowRight', dx > 22);
      await set('ArrowLeft', dx < -22);
      await set('ArrowDown', dy > 4);
      await set('ArrowUp', dy < -4);
      if (Math.abs(dx) <= 30 && Math.abs(dy) <= 8)
        await page.keyboard.press(Math.random() < 0.25 ? 'KeyK' : 'KeyJ');
    }
    await page.waitForTimeout(70);
  }
  for (const c of [...held]) await set(c, false);
  return { fpsSamples, last, bossSeen, bossGateOk };
}

test('M4: menang: 4 musuh + bos, LANJUT muncul setelah semua kalah, layar selesai', async ({ page }) => {
  test.setTimeout(240_000);
  const t = trackErrors(page);
  await open(page, 'screen=test&unlock=all&diff=mudah');
  // Pemain dibuat sangat tahan agar bot yang sederhana pasti menang; yang diuji adalah alur arena.
  await page.evaluate(() => {
    const s = (window as unknown as { __stage: { player: { hp: number; stats: { maxHp: number } } } })
      .__stage;
    s.player.stats = { ...s.player.stats, maxHp: 5000 };
    s.player.hp = 5000;
  });
  const { fpsSamples, bossSeen, bossGateOk } = await playBot(page, {
    maxMs: 150_000,
    onMid: async () => {
      await page.screenshot({ path: 'docs/screens/M4_fight.png' });
    },
  });
  const res = (await page.evaluate(
    () => (window as unknown as { __stageResult?: { win: boolean; stats: { kos: number } } }).__stageResult,
  )) as { win: boolean; stats: { kos: number } } | undefined;
  expect(res?.win).toBe(true);
  expect(res?.stats.kos).toBeGreaterThanOrEqual(5);
  expect(bossSeen).toBe(true);
  expect(bossGateOk).toBe(true);
  await page.screenshot({ path: 'docs/screens/M4_result.png' });
  const avg = fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, fpsSamples.length);
  console.log(`FPS rata-rata saat >=2 musuh di layar: ${avg.toFixed(1)} (n=${fpsSamples.length})`);
  expect(avg).toBeGreaterThan(30); // headless + GL perangkat lunak, bersaing dengan aplikasi lain
  expect(t.bad).toEqual([]);
  expect(t.errors).toEqual([]);
});

test('M4: kalah: HP habis -> layar kalah', async ({ page }) => {
  const t = trackErrors(page);
  await open(page, 'screen=kecil&diff=sulit');
  await page.evaluate(() => {
    const s = (window as unknown as { __stage: { player: { hp: number } } }).__stage;
    s.player.hp = 1;
  });
  await page.waitForFunction(
    () => (window as unknown as { __stageResult?: unknown }).__stageResult !== undefined,
    null,
    { timeout: 60_000 },
  );
  const res = (await page.evaluate(
    () => (window as unknown as { __stageResult: { win: boolean } }).__stageResult,
  )) as { win: boolean };
  expect(res.win).toBe(false);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/screens/M4_lose.png' });
  expect(t.errors).toEqual([]);
});
