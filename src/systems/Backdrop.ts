import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { BIRD_STAGES, BIRD_WEATHER, DECOR, PUDDLES } from '../data/decor';
import type { ScreenFilter, Weather } from '../data/stages';
import { planBackdrop } from './TimeWeather';

const DEPTH_BG = -10;
const DEPTH_DECOR = -9;
const DEPTH_RAIN = 18000;
const DEPTH_TINT = 19000;

export interface BackdropOpts {
  weather?: Weather;
  rain?: boolean;
  filter?: ScreenFilter;
  /** Formasi penonton (05_NPC/formasi) sebagai lapisan di atas latar. */
  crowd?: string;
}

/** Latar stage lengkap: gambar (varian cuaca), dekorasi beranimasi, burung, hujan, overlay warna, filter sepia. */
export class Backdrop {
  private readonly objs: Phaser.GameObjects.GameObject[] = [];
  private birdTimer?: Phaser.Time.TimerEvent;
  private sepiaOn = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly stage: string,
    opts: BackdropOpts = {},
  ) {
    const plan = planBackdrop(stage, opts.weather, opts.rain);
    this.objs.push(scene.add.image(0, 0, plan.key).setOrigin(0, 0).setDepth(DEPTH_BG));

    if (opts.crowd) this.objs.push(scene.add.image(0, 0, 'npc:formasi:' + opts.crowd).setOrigin(0, 0).setDepth(DEPTH_DECOR + 0.2));
    if (plan.envMatches) for (const d of DECOR[stage] ?? []) this.addLoop(d.fx, d.x, d.y);
    if (plan.rain) for (const [x, y] of PUDDLES[stage] ?? []) this.addLoop('genangan_beriak', x, y);
    if (BIRD_STAGES.has(stage) && BIRD_WEATHER.includes(opts.weather)) this.startBirds();

    if (plan.rain) {
      const rain = scene.add
        .sprite(0, 0, 'fx:overlay_hujan', 0)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_RAIN)
        .setAlpha(0.55);
      rain.play('fx:overlay_hujan:loop');
      this.objs.push(rain);
    }
    if (plan.tint) {
      this.objs.push(
        scene.add
          .rectangle(0, 0, LOGICAL_W, LOGICAL_H, plan.tint.color, plan.tint.alpha)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH_TINT),
      );
    }
    if (opts.filter === 'sepia') this.applySepia();
  }

  private addLoop(fx: string, x: number, y: number): void {
    const key = `fx:${fx}`;
    const s = this.scene.add.sprite(x, y, key, 0).setOrigin(0, 0).setDepth(DEPTH_DECOR);
    const total = this.scene.textures.get(key).frameTotal - 1;
    s.play({ key: `${key}:loop`, startFrame: Phaser.Math.Between(0, Math.max(0, total - 1)) });
    this.objs.push(s);
  }

  private startBirds(): void {
    const launch = () => {
      const y = Phaser.Math.Between(18, 64);
      const bird = this.scene.add
        .sprite(-16, y, 'fx:burung_terbang', 0)
        .setDepth(DEPTH_DECOR + 0.5)
        .setAlpha(0.8);
      bird.play('fx:burung_terbang:loop');
      this.objs.push(bird);
      this.scene.tweens.add({
        targets: bird,
        x: LOGICAL_W + 16,
        y: y + Phaser.Math.Between(-10, 10),
        duration: Phaser.Math.Between(9000, 14000),
        onUpdate: () => bird.setPosition(Math.floor(bird.x), Math.floor(bird.y)),
        onComplete: () => bird.destroy(),
      });
    };
    this.birdTimer = this.scene.time.addEvent({ delay: 7000, loop: true, callback: launch });
    this.scene.time.delayedCall(1200, launch);
  }

  /** Filter sepia (kilas balik, GDD §9). WebGL: color matrix; jika tak tersedia: overlay warna + vinyet. */
  private applySepia(): void {
    const cam = this.scene.cameras.main;
    try {
      if (this.scene.game.renderer.type === Phaser.WEBGL && cam.postFX) {
        cam.postFX.addColorMatrix().sepia();
        this.sepiaOn = true;
      }
    } catch {
      this.sepiaOn = false;
    }
    if (!this.sepiaOn) {
      this.objs.push(
        this.scene.add
          .rectangle(0, 0, LOGICAL_W, LOGICAL_H, 0x8a6a3a, 0.4)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH_TINT),
      );
    }
    this.objs.push(
      this.scene.add
        .image(0, 0, 'fx:vinyet_fokus')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_TINT + 1)
        .setAlpha(0.55),
    );
  }

  destroy(): void {
    this.birdTimer?.remove();
    for (const o of this.objs) o.destroy();
    this.objs.length = 0;
    if (this.sepiaOn) {
      try {
        this.scene.cameras.main.postFX.clear();
      } catch {
        // kamera sudah dibongkar saat scene berhenti; filter ikut hilang bersamanya
      }
    }
  }
}
