import type { CombatWorld } from '../combat/CombatWorld';
import type { WorldEvent } from '../combat/events';
import type { EffectPool } from './EffectPool';
import type { ScreenFx } from './ScreenFx';

/** Menerjemahkan kejadian simulasi menjadi efek visual/suara. Mengembalikan kejadian agar scene bisa bereaksi (skor, uang, KO). */
export class CombatPresenter {
  constructor(
    private readonly world: CombatWorld,
    private readonly fx: EffectPool,
    private readonly screen: ScreenFx,
    private readonly sfx: (name: string) => void = () => undefined,
  ) {}

  flush(): WorldEvent[] {
    const events = this.world.drainEvents();
    for (const e of events) {
      switch (e.type) {
        case 'fx':
          this.fx.play(e.name, e.x, e.y, e.flip);
          break;
        case 'shake':
          this.screen.shake(e.amount);
          break;
        case 'flash':
          this.screen.flash(e.alpha);
          break;
        case 'screenFx':
          this.screen.screen(e.name);
          break;
        case 'sfx':
          this.sfx(e.name);
          break;
        case 'text':
          this.fx.floatText(e.text, e.x, e.y, e.color);
          break;
        default:
          break;
      }
    }
    return events;
  }
}
