import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from './config';
import { setupAudio } from './audio/Engine';
import { Boot } from './scenes/Boot';
import { Preload } from './scenes/Preload';
import { AnimViewer } from './scenes/dev/AnimViewer';
import { CombatSandbox } from './scenes/dev/CombatSandbox';
import { DebugMenu } from './scenes/dev/DebugMenu';
import { GameOver } from './scenes/GameOver';
import { Pause } from './scenes/Pause';
import { Result } from './scenes/Result';
import { Archive } from './scenes/Archive';
import { ModeSelect } from './scenes/ModeSelect';
import { Credits } from './scenes/Credits';
import { Settings } from './scenes/Settings';
import { applyDisplay } from './systems/Display';
import { settings } from './systems/Settings';
import { Dojo } from './scenes/Dojo';
import { Hub } from './scenes/Hub';
import { MapSelect } from './scenes/MapSelect';
import { Shop } from './scenes/Shop';
import { MainMenu } from './scenes/MainMenu';
import { SaveSelect } from './scenes/SaveSelect';
import { Stage } from './scenes/Stage';
import { Title } from './scenes/Title';
import { input } from './systems/InputManager';

const BLOCKED_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

function buildGameConfig(scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    width: LOGICAL_W,
    height: LOGICAL_H,
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: 'wrap' },
    input: { gamepad: false },
    audio: { noAudio: true },
    scene: scenes,
  };
}

function start(): void {
  const host = document.getElementById('game');
  if (!host) throw new Error('#game tidak ditemukan');

  // Cegah halaman ikut scroll saat panah/spasi ditekan (penting di iframe itch.io).
  window.addEventListener('keydown', (e) => {
    if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
  });

  input.attach();
  setupAudio();
  const game = new Phaser.Game(
    buildGameConfig([
      Boot,
      Preload,
      Title,
      MainMenu,
      SaveSelect,
      Credits,
      Stage,
      Pause,
      Result,
      GameOver,
      Hub,
      MapSelect,
      Shop,
      Dojo,
      Archive,
      ModeSelect,
      Settings,
      AnimViewer,
      CombatSandbox,
      DebugMenu,
    ]),
  );
  const relayout = (): void => applyDisplay(game, host, settings.current.scale);
  relayout();
  window.addEventListener('resize', relayout);
  document.addEventListener('fullscreenchange', relayout);

  game.events.once(Phaser.Core.Events.READY, () => {
    const canvas = game.canvas;
    canvas.tabIndex = 0;
    canvas.addEventListener('pointerdown', () => canvas.focus());
    canvas.focus();
    // Tab kehilangan fokus: pertarungan otomatis dijeda agar pemain tidak kalah saat pergi.
    game.events.on(Phaser.Core.Events.BLUR, () => {
      const stage = game.scene.getScene('Stage') as unknown as { requestPause?: () => void } | null;
      if (stage && game.scene.isActive('Stage')) stage.requestPause?.();
    });
  });

  (window as unknown as { __game: Phaser.Game }).__game = game;
}

start();
