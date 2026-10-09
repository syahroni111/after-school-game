import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { engine } from '../audio/Engine';
import { LOGICAL_W } from '../config';
import { DIFFICULTIES, DIFFICULTY } from '../data/difficulty';
import { applyDisplay } from '../systems/Display';
import { game } from '../systems/GameState';
import { input, REBINDABLE } from '../systems/InputManager';
import type { Action } from '../systems/InputManager';
import { labelsFor, rebind, resetBindings } from '../systems/Rebind';
import { saves } from '../systems/SaveSystem';
import { settings } from '../systems/Settings';
import type { ScaleSetting } from '../systems/Settings';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { showToast } from '../ui/Toast';

export interface SettingsInit {
  from?: string;
  fromData?: object;
  /** Dibuka di atas scene Pause (jeda): saat selesai, scene ini berhenti dan Pause dilanjutkan. */
  overlay?: boolean;
}

const SCALES: readonly ScaleSetting[] = ['auto', '2', '3', '4'];
const VOL_STEP = 0.1;
const ACTION_LABEL: Readonly<Record<string, string>> = {
  left: 'KIRI',
  right: 'KANAN',
  up: 'ATAS',
  down: 'BAWAH',
  light: 'PUKUL RINGAN',
  heavy: 'PUKUL BERAT',
  guard: 'TAHAN',
  dodge: 'HINDAR',
  special: 'JURUS',
  interact: 'INTERAKSI',
  pause: 'JEDA',
};

const onOff = (v: boolean): string => (v ? 'YA' : 'TIDAK');
const pct = (v: number): string => String(Math.round(v * 100));

/** Pengaturan: volume musik/efek, skala layar, kesulitan, kotak hit, kurangi guncangan/kilat, ubah tombol. Tersimpan otomatis. */
export class SettingsScene extends Phaser.Scene {
  private menu!: Menu;
  private data0: SettingsInit = {};
  private objs: Phaser.GameObjects.GameObject[] = [];
  private capturing: Action | null = null;
  private hint!: PixelText;

  constructor() {
    super('Settings');
  }

  create(data: SettingsInit): void {
    this.data0 = data;
    this.cameras.main.setBackgroundColor(0x121a2e);
    this.cameras.main.fadeIn(150, 0, 0, 0);
    this.capturing = null;
    input.clear();
    this.showMain(0);
  }

  private clearView(): void {
    this.menu?.destroy();
    for (const o of this.objs) o.destroy();
    this.objs = [];
  }

  private persist(): void {
    saves.saveSettings(settings.current);
  }

  private showMain(start: number): void {
    this.clearView();
    const s = settings.current;
    const inGame = this.data0.from !== undefined && this.data0.from !== 'MainMenu';
    const setVol = (key: 'musicVol' | 'sfxVol', d: number): void => {
      s[key] = Math.min(1, Math.max(0, Math.round((s[key] + d) * 10) / 10));
      engine.applyVolumes();
      this.persist();
      if (key === 'sfxVol') audio.sfx('hit_mid');
    };
    const toggle = (key: 'showHitbox' | 'reduceShake' | 'reduceFlash') => (): void => {
      s[key] = !s[key];
      this.persist();
    };
    const cycleScale = (d: number): void => {
      s.scale = SCALES[(SCALES.indexOf(s.scale) + d + SCALES.length) % SCALES.length] as ScaleSetting;
      const host = document.getElementById('game');
      if (host) applyDisplay(this.game, host, s.scale);
      this.persist();
    };
    const cycleDiff = (d: number): void => {
      const cur = DIFFICULTIES.indexOf(game.profile.difficulty);
      game.profile.difficulty = DIFFICULTIES[
        (cur + d + DIFFICULTIES.length) % DIFFICULTIES.length
      ] as typeof game.profile.difficulty;
    };
    const items: MenuItem[] = [
      {
        label: () => `MUSIK: ${pct(s.musicVol)}`,
        onLeft: () => setVol('musicVol', -VOL_STEP),
        onRight: () => setVol('musicVol', VOL_STEP),
        onSelect: () => setVol('musicVol', s.musicVol >= 1 ? -1 : VOL_STEP),
      },
      {
        label: () => `EFEK SUARA: ${pct(s.sfxVol)}`,
        onLeft: () => setVol('sfxVol', -VOL_STEP),
        onRight: () => setVol('sfxVol', VOL_STEP),
        onSelect: () => setVol('sfxVol', s.sfxVol >= 1 ? -1 : VOL_STEP),
      },
      {
        label: () => `SKALA LAYAR: ${s.scale === 'auto' ? 'OTOMATIS' : `${s.scale}X`}`,
        onLeft: () => cycleScale(-1),
        onRight: () => cycleScale(1),
        onSelect: () => cycleScale(1),
      },
      {
        label: () =>
          inGame
            ? `KESULITAN: ${DIFFICULTY[game.profile.difficulty].label}`
            : 'KESULITAN: DIPILIH SAAT MULAI',
        disabled: !inGame,
        onLeft: () => cycleDiff(-1),
        onRight: () => cycleDiff(1),
        onSelect: () => cycleDiff(1),
      },
      {
        label: () => `TAMPILKAN KOTAK HIT: ${onOff(s.showHitbox)}`,
        onSelect: toggle('showHitbox'),
        onLeft: toggle('showHitbox'),
        onRight: toggle('showHitbox'),
      },
      {
        label: () => `KURANGI GUNCANGAN: ${onOff(s.reduceShake)}`,
        onSelect: toggle('reduceShake'),
        onLeft: toggle('reduceShake'),
        onRight: toggle('reduceShake'),
      },
      {
        label: () => `KURANGI KILAT LAYAR: ${onOff(s.reduceFlash)}`,
        onSelect: toggle('reduceFlash'),
        onLeft: toggle('reduceFlash'),
        onRight: toggle('reduceFlash'),
      },
      { label: 'UBAH TOMBOL', onSelect: () => this.showKeys(0) },
      { label: 'KEMBALI', onSelect: () => this.leave() },
    ];
    const w = 330;
    const x = (LOGICAL_W - w) / 2;
    this.objs = [...addPanel(this, x, 16, w, 238, 'PENGATURAN')];
    this.menu = new Menu(this, {
      x: x + 24,
      y: 44,
      items,
      width: w - 44,
      depth: 110,
      startIndex: start,
      onBack: () => this.leave(),
      onMove: () => audio.sfx('ui_move'),
    });
  }

  private showKeys(start: number): void {
    this.clearView();
    const s = settings.current;
    const items: MenuItem[] = REBINDABLE.map((a) => ({
      label: () => `${(ACTION_LABEL[a] ?? a).padEnd(14)}${labelsFor(s.bindings, a)}`,
      onSelect: () => this.beginCapture(a),
    }));
    items.push({
      label: 'KEMBALIKAN BAWAAN',
      onSelect: () => {
        s.bindings = resetBindings();
        input.bindings = s.bindings;
        this.persist();
        showToast(this, 'TOMBOL DIKEMBALIKAN', 1500, COLORS.good);
      },
    });
    items.push({ label: 'KEMBALI', onSelect: () => this.showMain(7) });
    const w = 330;
    const x = (LOGICAL_W - w) / 2;
    this.objs = [...addPanel(this, x, 12, w, 246, 'UBAH TOMBOL')];
    this.hint = new PixelText(this, x + 16, 236, 'PILIH AKSI LALU TEKAN TOMBOL BARU. ESC BATAL.', {
      color: COLORS.dim,
    }).setDepth(120);
    this.objs.push(this.hint);
    this.menu = new Menu(this, {
      x: x + 24,
      y: 36,
      items,
      width: w - 44,
      depth: 110,
      lineHeight: 15,
      startIndex: start,
      onBack: () => this.showMain(7),
      onMove: () => audio.sfx('ui_move'),
    });
  }

  private beginCapture(action: Action): void {
    this.capturing = action;
    this.hint.setText(`TEKAN TOMBOL BARU UNTUK ${ACTION_LABEL[action] ?? action}...`).setTint(COLORS.gold);
    const handler = (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.capturing = null;
      if (e.code !== 'Escape') {
        const next = rebind(settings.current.bindings, action, e.code);
        if (next) {
          settings.current.bindings = next;
          input.bindings = next;
          this.persist();
          audio.sfx('ui_confirm');
        } else audio.sfx('ui_back');
      }
      input.clear();
      const idx = REBINDABLE.indexOf(action);
      this.time.delayedCall(60, () => this.showKeys(idx));
    };
    window.addEventListener('keydown', handler, { once: true, capture: true });
  }

  private leave(): void {
    this.persist();
    const d = this.data0;
    if (d.overlay) {
      this.scene.stop();
      this.scene.resume(d.from ?? 'Pause');
      return;
    }
    this.scene.start(d.from ?? 'MainMenu', d.fromData);
  }

  override update(): void {
    if (this.capturing) return;
    this.menu.update();
  }
}

export { SettingsScene as Settings };
