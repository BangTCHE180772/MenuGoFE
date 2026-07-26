// ─── Dashboard Constants ───────────────────────────────────────────────────
export const CHART_COLORS = {
  revenue: "#3b82f6", // blue-500
  expense: "#ef4444", // red-500
  profit: "#22c55e", // green-500
  profitNeg: "#ef4444", // red for negative profit
  profitMargin: "#f59e0b", // amber for margin %
  neutral: "#8b5cf6", // purple
};

export const TIME_RANGES = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày qua", value: "7days" },
  { label: "30 ngày qua", value: "30days" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Quý này", value: "thisQuarter" },
  { label: "Năm nay", value: "thisYear" },
  { label: "Tuỳ chỉnh", value: "custom" },
];

// ─── Empty/Reset Mock Data ──────────────────────────────────────────────────
export const MOCK_KPI_TODAY = {
  revenue: { value: 0, prevValue: 0 },
  expense: { value: 0, prevValue: 0 },
  profit: { value: 0, prevValue: 0 },
  profitMargin: { value: 0, prevValue: 0 },
};

export const MOCK_KPI_OVERVIEW = {
  revenue: { value: 0, prevValue: 0 },
  expense: { value: 0, prevValue: 0 },
  profit: { value: 0, prevValue: 0 },
};

export const MOCK_TREND_DATA = [];

export const MOCK_MONTHLY_DATA = [];

export const MOCK_ORDER_SUMMARY = {
  total: 0,
  new: 0,
  paid: 0,
  unpaid: 0,
  cancelled: 0,
};

export const MOCK_CASHFLOW = [];

export const MOCK_ALERTS = [];

export const MOCK_MENU_SUMMARY = {
  totalItemsSold: 0,
  prevTotalItemsSold: 0,
  avgOrderValue: 0,
  prevAvgOrderValue: 0,
  completedBills: 0,
  prevCompletedBills: 0,
};
