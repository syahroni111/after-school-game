import type { Page } from '@playwright/test';

export const activeScenes = (page: Page) =>
  page.evaluate(() => (window as unknown as { __game: Phaser.Game }).__game.scene.getScenes(true).map((s) => s.scene.key));

interface StageProbe {
  state: string;
  inCutscene: boolean;
  host: { dialog: { active: boolean } };
  player: { x: number; y: number };
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

export interface BotOptions {
  maxMs: number;
  /** Bot berhenti saat salah satu scene ini aktif (setelah menekan lanjut di Hasil). */
  stopAt: string[];
  /** Cerita utuh: dari Hub berjalan ke Peta dan memilih LANJUTKAN CERITA sampai profil bab = tamat. */
  continueStory?: boolean;
  /** Dipanggil sekali per scene baru yang terlihat. */
  onScene?: (scene: string) => Promise<void>;
}

/** Bot cerita sederhana: mendekati musuh terdekat dan memukul, menutup dialog, melewati Hasil dan Kredit. */
export async function playStory(page: Page, o: BotOptions): Promise<Set<string>> {
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
  let lastLog = 0;
  while (Date.now() - start < o.maxMs) {
    const scenes = await activeScenes(page);
    for (const s of scenes) {
      if (!seen.has(s)) {
        seen.add(s);
        await o.onScene?.(s);
      }
    }
    if (process.env.BOT_LOG && Date.now() - lastLog > 8000) {
      lastLog = Date.now();
      const id = await page.evaluate(() => {
        const st = (window as unknown as { __stage?: { screenDef?: { id: string }; state: string; inCutscene: boolean; player: { x: number; y: number; state: string; hp: number }; world: { fighters: { team: string; x: number; y: number; hp: number; dead: boolean; state: string; charKey: string }[] } } }).__stage;
        if (!st) return null;
        return JSON.stringify({ id: st.screenDef?.id, st: st.state, p: [st.player.x | 0, st.player.y | 0, st.player.state, st.player.hp | 0], f: st.world.fighters.map((x) => [x.team, x.x | 0, x.y | 0, x.hp | 0, x.dead, x.state]) });
      });
      console.log(Math.round((Date.now() - start) / 1000), scenes.join(','), id);
    }
    if (o.continueStory) {
      if (scenes.includes('Hub')) {
        const done = await page.evaluate(() => (window as unknown as { __gs: { profile: { chapter: string } } }).__gs.profile.chapter === 'tamat');
        if (done) break;
        await hold('ArrowRight', true);
        await page.waitForTimeout(100);
        continue;
      }
      if (scenes.includes('MapSelect')) {
        await hold('ArrowRight', false);
        await page.waitForTimeout(400);
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(150);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(600);
        continue;
      }
    } else if (scenes.some((s) => o.stopAt.includes(s))) break;
    if (scenes.includes('Result')) {
      await page.waitForTimeout(1200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      continue;
    }
    if (scenes.includes('Credits')) {
      await page.waitForTimeout(800);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      continue;
    }
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
    if (s.state === 'clear' || s.enemies.length === 0) {
      for (const c of ['ArrowLeft', 'ArrowUp', 'ArrowDown']) await hold(c, false);
      await hold('ArrowRight', true);
      if (s.state !== 'clear') await page.keyboard.press('KeyJ');
    } else {
      const tg = s.enemies.reduce((a, b) => (Math.abs(a.x - s.px) + Math.abs(a.y - s.py) * 2 < Math.abs(b.x - s.px) + Math.abs(b.y - s.py) * 2 ? a : b));
      const dx = tg.x - s.px;
      const dy = tg.y - s.py;
      await hold('ArrowRight', dx > 22);
      await hold('ArrowLeft', dx < -22);
      await hold('ArrowDown', dy > 4);
      await hold('ArrowUp', dy < -4);
      if (Math.abs(dx) <= 30 && Math.abs(dy) <= 8) await page.keyboard.press(Math.random() < 0.2 ? 'KeyK' : 'KeyJ');
    }
    await page.waitForTimeout(50);
  }
  for (const c of [...held]) await hold(c, false);
  return seen;
}
