/**
 * Common formatting and calculation utilities used across dashboards
 */

export const formatVND = (val) => {
  if (val === null || val === undefined) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(val);
};

export const formatVNDFull = (val) => formatVND(val);

export const formatPercent = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return "0%";
  return `${Number(val).toFixed(decimals)}%`;
};

export const calcGrowth = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export const formatNumber = (val) => {
  if (val === null || val === undefined) return "0";
  return new Intl.NumberFormat("vi-VN").format(val);
};
