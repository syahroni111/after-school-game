// Pemetaan animasi: mana yang berulang (loop), dan nama animasi standar per state.
const LOOPING = new Set([
  'siap_tempur', 'kuda_kuda_netral', 'kuda_kuda_bertahan', 'kuda_kuda_jaga', 'kuda_kuda_menghindar',
  'jalan_tempur', 'bertahan', 'idle_berdiri', 'idle_napas', 'idle_lihat_sekitar', 'idle_geser_kuda_kuda',
  'jalan_samping', 'duduk', 'membaca', 'menoleh_ke_kejadian', 'main_basket',
  'jalan_bawah', 'jalan_atas', 'idle_depan', 'idle_belakang', 'lihat_sekitar_depan', 'bicara_depan',
  'jalan_bawah_bawa_kotak', 'pakai_loker', 'loop',
]);

export const isLoopingAnim = (anim: string): boolean => LOOPING.has(anim);
