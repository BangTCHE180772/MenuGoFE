// ─── Dashboard Utility Helpers ─────────────────────────────────────────────
export const formatVND = (value) => {
  if (value === null || value === undefined) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + ' tỷ';
  }
  if (abs >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + ' tr';
  }
  if (abs >= 1_000) {
    return (value / 1_000).toFixed(0) + 'k';
  }
  return value.toLocaleString('vi-VN') + 'đ';
};

export const formatVNDFull = (value) => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('vi-VN') + 'đ';
};

export const formatPercent = (value) => {
  return (value * 100).toFixed(1) + '%';
};

export const calcGrowth = (current, prev) => {
  if (!prev || prev === 0) return null;
  return ((current - prev) / prev) * 100;
};

export const growthLabel = (growth) => {
  if (growth === null) return null;
  const isPos = growth >= 0;
  const label = `${isPos ? '▲' : '▼'} ${Math.abs(growth).toFixed(1)}%`;
  return { label, isPos };
};
