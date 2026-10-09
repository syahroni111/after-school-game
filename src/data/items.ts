// Makanan Kantin (GDD §6). Pembelian PERTAMA setiap jenis memberi bonus statistik permanen.
import type { StatBonus } from '../systems/Profile';

export interface FoodDef {
  id: string;
  name: string;
  price: number;
  /** Pemulihan HP: angka, atau 'penuh'. */
  heal: number | 'penuh';
  /** Buff sementara untuk layar berikutnya. */
  buff?: 'kuat';
  /** Bonus permanen pada pembelian pertama. */
  first: { stat: keyof StatBonus; amount: number; label: string };
  /** Teks efek (kapital). */
  effect: string;
}

export const FOODS: readonly FoodDef[] = [
  { id: 'gorengan', name: 'GORENGAN', price: 1000, heal: 15, first: { stat: 'kekuatan', amount: 1, label: 'KEKUATAN NAIK 1' }, effect: 'HP PULIH 15' },
  { id: 'es_teh', name: 'ES TEH MANIS', price: 1500, heal: 20, first: { stat: 'stamina', amount: 5, label: 'STAMINA NAIK 5' }, effect: 'HP PULIH 20, STAMINA PENUH' },
  { id: 'roti_bakar', name: 'ROTI BAKAR', price: 3000, heal: 40, first: { stat: 'ketahanan', amount: 1, label: 'KETAHANAN NAIK 1' }, effect: 'HP PULIH 40' },
  { id: 'nasi_goreng', name: 'NASI GORENG', price: 6000, heal: 'penuh', first: { stat: 'hpMaks', amount: 10, label: 'HP MAKS NAIK 10' }, effect: 'HP PENUH' },
  { id: 'susu_kotak', name: 'SUSU KOTAK', price: 2500, heal: 0, buff: 'kuat', first: { stat: 'kecepatan', amount: 1, label: 'KECEPATAN NAIK 1' }, effect: 'KUAT 20 DETIK DI LAYAR BERIKUT' },
];

export const foodById = (id: string): FoodDef | undefined => FOODS.find((f) => f.id === id);
