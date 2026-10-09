import Phaser from 'phaser';
import { CombatWorld } from '../../combat/CombatWorld';
import type { Controller } from '../../combat/CombatWorld';
import { LOGICAL_H } from '../../config';
import { baseStats } from '../../data/characters';
import { ALL_UNLOCKED, Fighter, IDLE_INTENT } from '../../entities/Fighter';
import type { Intent } from '../../entities/Fighter';
import { PlayerController } from '../../entities/Player';
import { SpriteView } from '../../entities/SpriteView';
import { CombatPresenter } from '../../systems/CombatPresenter';
import { EffectPool } from '../../systems/EffectPool';
import { input } from '../../systems/InputManager';
import { ScreenFx } from '../../systems/ScreenFx';
import { PixelText } from '../../ui/PixelText';

type DummyMode = 'still' | 'jab' | 'heavy' | 'guard';
const MODES: DummyMode[] = ['still', 'jab', 'heavy', 'guard'];

const START_X = 150;
const START_Y = 222;

/** Alat dev: 1 stage + 1 musuh boneka (diam / menyerang berkala / bertahan) untuk menyetel rasa pertarungan. */
export class CombatSandbox extends Phaser.Scene {
  world!: CombatWorld;
  player!: Fighter;
  dummy!: Fighter;
  private dummyMode: DummyMode = 'still';
  private fx!: EffectPool;
  private screen!: ScreenFx;
  private presenter!: CombatPresenter;
  private hud!: PixelText;
  private debug!: Phaser.GameObjects.Graphics;
  private showBoxes = true;
  private playerTicks = 0;
  private controller = new PlayerController();
  /** Dipakai e2e: membekukan simulasi + animasi tepat saat pukulan mendarat, untuk tangkapan layar. */
  freezeOnHit = false;

  constructor() {
    super('CombatSandbox');
  }

  create(data: { mode?: string; hit?: string }): void {
    input.attach();
    if (import.meta.env.DEV) (window as unknown as { __sandbox?: CombatSandbox }).__sandbox = this;
    this.world = new CombatWorld({ seed: 3 });
    this.add.image(0, 0, 'stage:halaman').setOrigin(0, 0).setDepth(-1);
    this.fx = new EffectPool(this);
    this.screen = new ScreenFx(this);
    this.presenter = new CombatPresenter(this.world, this.fx, this.screen);
    this.debug = this.add.graphics().setDepth(9500);
    this.showBoxes = data.hit !== '0';
    if (MODES.includes(data.mode as DummyMode)) this.dummyMode = data.mode as DummyMode;

    this.spawn();
    this.hud = new PixelText(this, 4, 4, '', { color: 0xf6f7fa }).setDepth(30000);
    new PixelText(
      this,
      4,
      LOGICAL_H - 20,
      'WASD GERAK  J PUKUL  K BERAT  L TAHAN  SPASI HINDAR  I/J+K JURUS',
      { color: 0xffffff },
    ).setDepth(30000);
    new PixelText(this, 4, LOGICAL_H - 10, 'T MODE BONEKA  R ULANG  H KOTAK  2X MAJU = LARI', {
      color: 0xffffff,
    }).setDepth(30000);

    const kb = this.input.keyboard;
    kb?.on('keydown-T', () => {
      this.dummyMode = MODES[(MODES.indexOf(this.dummyMode) + 1) % MODES.length] as DummyMode;
    });
    kb?.on('keydown-R', () => this.spawn());
    kb?.on('keydown-H', () => (this.showBoxes = !this.showBoxes));
  }

  private spawn(): void {
    for (const f of [...this.world.fighters]) {
      f.view.destroy();
      this.world.remove(f);
    }
    this.fx.clear();
    this.playerTicks = 0;
    this.player = new Fighter({
      id: 'player',
      team: 'player',
      charKey: 'A01_protagonis',
      x: START_X,
      y: START_Y,
      facing: 1,
      stats: baseStats('A01_protagonis'),
      unlocks: ALL_UNLOCKED,
      host: this.world,
      view: new SpriteView(this, 'A01_protagonis'),
    });
    this.dummy = new Fighter({
      id: 'dummy',
      team: 'enemy',
      charKey: 'B04_rival_agresif',
      x: START_X + 70,
      y: START_Y,
      facing: -1,
      stats: { ...baseStats('B04_rival_agresif'), maxHp: 400 },
      unlocks: ALL_UNLOCKED,
      host: this.world,
      view: new SpriteView(this, 'B04_rival_agresif'),
    });
    this.world.add(this.player, this.playerController);
    this.world.add(this.dummy, this.dummyController);
  }

  private playerController: Controller = (self) => {
    this.playerTicks++;
    return this.controller.intent(input.sample(), self, this.playerTicks);
  };

  private dummyController: Controller = (self, world) => {
    const foe = world.nearestFoe(self);
    if (foe && self.canAct) self.facing = foe.x >= self.x ? 1 : -1;
    const close = !!foe && Math.abs(foe.x - self.x) < 32 && Math.abs(foe.y - self.y) <= 8;
    const base: Intent = { ...IDLE_INTENT };
    if (this.dummyMode === 'guard') return { ...base, guardHeld: true };
    if (this.dummyMode === 'jab' && close && world.tickCount % 90 === 0)
      return { ...base, presses: ['light'] };
    if (this.dummyMode === 'heavy' && close && world.tickCount % 120 === 0)
      return { ...base, presses: ['heavy'] };
    return base;
  };

  override update(_time: number, delta: number): void {
    this.world.advance(delta);
    const events = this.presenter.flush();
    if (this.freezeOnHit && events.some((e) => e.type === 'hit')) this.setFrozen(true);
    this.screen.update(delta);
    for (const f of this.world.fighters) (f.view as SpriteView).updateStatus(f);
    if (this.dummy.dead && this.dummy.removed) this.spawnDummyAgain();
    this.drawDebug();
    const p = this.player;
    const d = this.dummy;
    this.hud.setText(
      `RAKA ${p.state.toUpperCase()} ${p.animName}\nHP ${Math.ceil(p.hp)}${p.tempHp ? `+${p.tempHp}` : ''}  STA ${Math.floor(p.stamina)}  KOMBO ${p.combo}\nBONEKA ${this.dummyMode.toUpperCase()}  ${d.state.toUpperCase()}  HP ${Math.ceil(d.hp)}`,
    );
  }

  setFrozen(on: boolean): void {
    this.world.paused = on;
    if (on) this.anims.pauseAll();
    else {
      this.anims.resumeAll();
      this.freezeOnHit = false;
    }
  }

  private spawnDummyAgain(): void {
    const old = this.dummy;
    old.view.destroy();
    this.dummy = new Fighter({
      id: 'dummy',
      team: 'enemy',
      charKey: 'B04_rival_agresif',
      x: START_X + 70,
      y: START_Y,
      facing: -1,
      stats: { ...baseStats('B04_rival_agresif'), maxHp: 400 },
      unlocks: ALL_UNLOCKED,
      host: this.world,
      view: new SpriteView(this, 'B04_rival_agresif'),
    });
    this.world.add(this.dummy, this.dummyController);
  }

  private drawDebug(): void {
    const g = this.debug;
    g.clear();
    if (!this.showBoxes) return;
    for (const f of this.world.fighters) {
      const h = f.hurtbox();
      g.lineStyle(1, 0x40c070, 1).strokeRect(Math.floor(h.x) + 0.5, Math.floor(h.y) + 0.5, h.w, h.h);
      g.lineStyle(1, 0xe8c860, 0.6).lineBetween(
        Math.floor(f.x) - 6,
        Math.floor(f.y),
        Math.floor(f.x) + 6,
        Math.floor(f.y),
      );
      const a = f.activeHit();
      if (a) {
        g.fillStyle(0xe05050, 0.45).fillRect(Math.floor(a.rect.x), Math.floor(a.rect.y), a.rect.w, a.rect.h);
        g.lineStyle(1, 0xe05050, 1).strokeRect(
          Math.floor(a.rect.x) + 0.5,
          Math.floor(a.rect.y) + 0.5,
          a.rect.w,
          a.rect.h,
        );
      }
    }
  }
}
