import Phaser from 'phaser';
import { engine } from '../audio/Engine';
import { debug } from '../systems/Debug';
import { applyDisplay } from '../systems/Display';
import { input } from '../systems/InputManager';
import { game } from '../systems/GameState';
import { runner } from '../systems/ChapterRunner';
import { saves } from '../systems/SaveSystem';
import { settings } from '../systems/Settings';

/** Pintu masuk: memuat aset lewat Preload lalu menuju Title (atau scene tujuan: ?scene=NAMA, ?debug=1&chapter=ID). */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    if (!this.registry.get('assetsReady')) {
      this.scene.start('Preload');
      return;
    }
    settings.current = saves.loadSettings();
    input.bindings = settings.current.bindings;
    engine.applyVolumes();
    const host = document.getElementById('game');
    if (host) applyDisplay(this.game, host, settings.current.scale);
    const params = new URLSearchParams(window.location.search);
    const target = params.get('scene');
    if (debug.on && debug.chapter) {
      game.reset();
      if (runner.jumpTo(debug.chapter, debug.step) && !target) {
        runner.play(this);
        return;
      }
    }
    if (target && this.scene.get(target)) {
      this.scene.start(target, Object.fromEntries(params));
      return;
    }
    this.scene.start('Title');
  }
}
