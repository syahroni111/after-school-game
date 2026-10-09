// Memilih gambar latar, overlay warna, dan hujan untuk kombinasi stage + cuaca/waktu (murni).
import { STAGES, WEATHER_TINT } from '../data/stages';
import type { TintDef, Weather } from '../data/stages';

export interface BackdropPlan {
  /** Key tekstur latar (stage dasar atau varian cuaca). */
  key: string;
  /** Overlay warna (sore/malam bila tidak ada gambar varian). */
  tint: TintDef | null;
  /** Pasang overlay hujan beranimasi. */
  rain: boolean;
  /** Efek lingkungan (bendera/pohon) cocok dengan gambar ini (hanya gambar dasar/cerah). */
  envMatches: boolean;
}

/** Fallback bila stage tidak punya gambar untuk cuaca itu. */
const FALLBACK_TINT: Readonly<Partial<Record<Weather, TintDef>>> = {
  ...WEATHER_TINT,
  berawan: { color: 0x6a7a90, alpha: 0.12 },
  hujan: { color: 0x2a3a58, alpha: 0.28 },
};

export function planBackdrop(stageId: string, weather: Weather | undefined, forceRain = false): BackdropPlan {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) throw new Error(`Stage tidak dikenal: ${stageId}`);
  const base = `stage:${stageId}`;
  if (!weather) return { key: base, tint: null, rain: forceRain, envMatches: true };
  if (stage.weather.includes(weather)) {
    return {
      key: `${base}:${weather}`,
      tint: null,
      rain: forceRain || weather === 'hujan',
      envMatches: weather === 'cerah',
    };
  }
  return {
    key: base,
    tint: FALLBACK_TINT[weather] ?? null,
    rain: forceRain || weather === 'hujan',
    envMatches: true,
  };
}
