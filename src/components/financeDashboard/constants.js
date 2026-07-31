// ─── Finance Dashboard Constants & Mock Data ──────────────────────────────
// Color palette — CONSISTENT with HomePage dashboard
export const COLORS = {
  revenue: "#3b82f6",    // blue (same as HomePage)
  expense: "#ef4444",    // red
  profit: "#22c55e",     // green (same as HomePage)
  profitMargin: "#f59e0b", // amber/orange
  costRatio: "#8b5cf6",  // purple
  profitNeg: "#ef4444",  // red for negative profit
};

// ─── Filter Options ────────────────────────────────────────────────────────
export const FINANCE_FILTERS = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày", value: "7days" },
  { label: "30 ngày", value: "30days" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Quý này", value: "thisQuarter" },
  { label: "Năm nay", value: "thisYear" },
  { label: "Tùy chọn", value: "custom" },
  { label: "Từ khi thành lập", value: "allTime" },
];

export const PERIOD_OPTIONS = [
  { label: "Hôm nay", value: "today" },
  { label: "Tuần này", value: "thisWeek" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Năm nay", value: "thisYear" },
  { label: "Tùy chọn", value: "custom" },
];

export const PREV_PERIOD_OPTIONS = [
  { label: "Hôm qua", value: "yesterday" },
  { label: "Tuần trước", value: "lastWeek" },
  { label: "Tháng trước", value: "lastMonth" },
  { label: "Năm trước", value: "lastYear" },
  { label: "Tùy chọn", value: "custom" },
];

// ─── Mock Data — Minimal (all values at 0 or single entry) ─────────────────

// Overview: single data point
export const MOCK_OVERVIEW_DATA = [
  { period: "T1", revenue: 0, expense: 0, profit: 0, profitMargin: 0, costRatio: 0 },
];

// Detail Table: single row
export const MOCK_DETAIL_TABLE = [
  {
    key: "1",
    time: "Tháng 1",
    revenue: 0,
    revGrowth: null,
    expense: 0,
    expGrowth: null,
    profit: 0,
    profitGrowth: null,
    profitMargin: 0,
    marginGrowth: null,
    costRatio: 0,
    costGrowth: null,
  },
];

// Revenue tab
export const MOCK_REVENUE_KPI = {
  current: { value: 0, label: "Hôm nay" },
  previous: { value: 0, label: "Hôm qua" },
};

export const MOCK_REVENUE_COMPARISON = [
  { period: "00:00", current: 0, previous: 0 },
];

export const MOCK_REVENUE_TRANSACTIONS = [
  {
    key: "1",
    time: "—",
    invoiceCode: "—",
    customer: "—",
    paymentMethod: "—",
    amount: 0,
    cashier: "—",
    description: "Không có giao dịch",
  },
];

export const MOCK_PAYMENT_METHODS = [
  { name: "Tiền mặt", value: 0 },
  { name: "QR", value: 0 },
  { name: "Thẻ", value: 0 },
  { name: "Chuyển khoản", value: 0 },
];

export const MOCK_REVENUE_DISTRIBUTION = [
  { slot: "Sáng (6-11h)", value: 0 },
  { slot: "Trưa (11-14h)", value: 0 },
  { slot: "Chiều (14-18h)", value: 0 },
  { slot: "Tối (18-22h)", value: 0 },
];

// Expense tab
export const MOCK_EXPENSE_KPI = {
  current: { value: 0, label: "Hôm nay" },
  previous: { value: 0, label: "Hôm qua" },
};

export const MOCK_EXPENSE_COMPARISON = [
  { period: "00:00", current: 0, previous: 0 },
];

export const MOCK_EXPENSE_TRANSACTIONS = [
  {
    key: "1",
    time: "—",
    category: "—",
    importReceipt: "—",
    supplier: "—",
    createdBy: "—",
    amount: 0,
    note: "Không có giao dịch",
  },
];

export const MOCK_EXPENSE_BREAKDOWN = [
  { name: "Nguyên liệu", value: 0 },
  { name: "Lương", value: 0 },
  { name: "Điện", value: 0 },
  { name: "Nước", value: 0 },
  { name: "Thuê mặt bằng", value: 0 },
  { name: "Khác", value: 0 },
];

export const MOCK_EXPENSE_TREND = [
  { period: "T1", ingredients: 0, salary: 0, electricity: 0, water: 0, rent: 0, others: 0 },
];

export const MOCK_TOP_EXPENSES = [
  {
    key: "1",
    rank: 1,
    category: "—",
    description: "Không có dữ liệu",
    amount: 0,
    date: "—",
  },
];

// Profit tab
export const MOCK_PROFIT_KPI = {
  current: { value: 0, label: "Hôm nay" },
  previous: { value: 0, label: "Hôm qua" },
};

export const MOCK_PROFIT_COMPARISON = [
  { period: "00:00", current: 0, previous: 0 },
];

export const MOCK_PROFIT_TREND = [
  { period: "T1", profit: 0 },
];

export const MOCK_PROFIT_DISTRIBUTION = [
  { period: "T1", profit: 0 },
];

export const MOCK_BREAK_EVEN = {
  currentRevenue: 0,
  breakEvenPoint: 0,
  remaining: 0,
  percentage: 0,
};

export const MOCK_WATERFALL = [
  { name: "Doanh thu", value: 0, type: "revenue" },
  { name: "Nguyên liệu", value: 0, type: "cost" },
  { name: "Lương", value: 0, type: "cost" },
  { name: "Chi phí vận hành", value: 0, type: "cost" },
  { name: "Chi phí khác", value: 0, type: "cost" },
  { name: "Lợi nhuận", value: 0, type: "profit" },
];

// Payment method colors for donut
export const PAYMENT_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

// Expense breakdown colors for pie
export const EXPENSE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#06b6d4", "#8b5cf6", "#6b7280"];

// Expense category line colors
export const EXPENSE_CATEGORY_COLORS = {
  ingredients: "#ef4444",
  salary: "#f59e0b",
  electricity: "#3b82f6",
  water: "#06b6d4",
  rent: "#8b5cf6",
  others: "#6b7280",
};
