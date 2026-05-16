// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const fmtMoney = (n) => {
  if (!n || isNaN(+n)) return '₱0';
  const v = +n;
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 10_000)    return `₱${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}K`;
  return `₱${Math.round(v).toLocaleString("en-PH")}`;
};
// Always formats as ₱X,XXX — parses strings, rounds to integer, never shows decimals
export const fmtPeso = (v) => `₱${Math.round(parseFloat(v) || 0).toLocaleString("en-PH")}`;
