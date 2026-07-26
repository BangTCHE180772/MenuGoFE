// ─── Dashboard Constants ───────────────────────────────────────────────────
export const CHART_COLORS = {
  revenue: '#3b82f6',    // blue-500
  expense: '#ef4444',    // red-500
  profit: '#22c55e',     // green-500
  profitNeg: '#ef4444',  // red for negative profit
  profitMargin: '#f59e0b', // amber for margin %
  neutral: '#8b5cf6',    // purple
};

export const TIME_RANGES = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày qua', value: '7days' },
  { label: '30 ngày qua', value: '30days' },
  { label: 'Tháng này', value: 'thisMonth' },
  { label: 'Quý này', value: 'thisQuarter' },
  { label: 'Năm nay', value: 'thisYear' },
  { label: 'Tuỳ chỉnh', value: 'custom' },
];

// ─── Mock Data ─────────────────────────────────────────────────────────────
export const MOCK_KPI_TODAY = {
  revenue: { value: 12_500_000, prevValue: 10_800_000 },
  expense: { value: 5_200_000, prevValue: 4_900_000 },
  profit: { value: 7_300_000, prevValue: 5_900_000 },
  profitMargin: { value: 0.584, prevValue: 0.546 },
};

export const MOCK_KPI_OVERVIEW = {
  revenue: { value: 350_000_000, prevValue: 312_500_000 },
  expense: { value: 140_000_000, prevValue: 130_000_000 },
  profit: { value: 210_000_000, prevValue: 182_500_000 },
};

export const MOCK_TREND_DATA = [
  { date: '01/07', revenue: 11_200_000, expense: 4_500_000, profit: 6_700_000 },
  { date: '02/07', revenue: 9_800_000,  expense: 5_100_000, profit: 4_700_000 },
  { date: '03/07', revenue: 13_400_000, expense: 4_800_000, profit: 8_600_000 },
  { date: '04/07', revenue: 8_500_000,  expense: 5_600_000, profit: 2_900_000 },
  { date: '05/07', revenue: 14_200_000, expense: 4_200_000, profit: 10_000_000 },
  { date: '06/07', revenue: 10_900_000, expense: 5_800_000, profit: 5_100_000 },
  { date: '07/07', revenue: 12_500_000, expense: 5_200_000, profit: 7_300_000 },
];

export const MOCK_MONTHLY_DATA = [
  { month: 'T1', revenue: 280_000_000, expense: 110_000_000, profit: 170_000_000 },
  { month: 'T2', revenue: 310_000_000, expense: 120_000_000, profit: 190_000_000 },
  { month: 'T3', revenue: 295_000_000, expense: 118_000_000, profit: 177_000_000 },
  { month: 'T4', revenue: 340_000_000, expense: 135_000_000, profit: 205_000_000 },
  { month: 'T5', revenue: 320_000_000, expense: 128_000_000, profit: 192_000_000 },
  { month: 'T6', revenue: 380_000_000, expense: 145_000_000, profit: 235_000_000 },
  { month: 'T7', revenue: 350_000_000, expense: 140_000_000, profit: 210_000_000 },
  { month: 'T8', revenue: 0, expense: 0, profit: 0 },
  { month: 'T9', revenue: 0, expense: 0, profit: 0 },
  { month: 'T10', revenue: 0, expense: 0, profit: 0 },
  { month: 'T11', revenue: 0, expense: 0, profit: 0 },
  { month: 'T12', revenue: 0, expense: 0, profit: 0 },
];

export const MOCK_ORDER_SUMMARY = {
  total: 184,
  new: 32,
  paid: 124,
  unpaid: 18,
  cancelled: 10,
};

export const MOCK_CASHFLOW = [
  { id: 1, time: '09:15', type: 'in',  category: 'Thanh toán hóa đơn', amount: 2_450_000 },
  { id: 2, time: '09:42', type: 'in',  category: 'Thanh toán hóa đơn', amount: 890_000 },
  { id: 3, time: '10:05', type: 'out', category: 'Nhập hàng',          amount: -1_200_000 },
  { id: 4, time: '11:22', type: 'in',  category: 'Thanh toán hóa đơn', amount: 3_100_000 },
  { id: 5, time: '12:00', type: 'out', category: 'Điện nước',          amount: -450_000 },
  { id: 6, time: '13:30', type: 'out', category: 'Trả lương',          amount: -2_500_000 },
  { id: 7, time: '14:15', type: 'in',  category: 'Thu khác',           amount: 500_000 },
  { id: 8, time: '15:00', type: 'in',  category: 'Thanh toán hóa đơn', amount: 1_780_000 },
];

export const MOCK_ALERTS = [
  { id: 1, level: 'warning', message: '18 đơn chưa thanh toán' },
  { id: 2, level: 'warning', message: '2 nhân viên chưa chấm công hôm nay' },
  { id: 3, level: 'danger',  message: 'Chi phí hôm nay vượt trung bình 28%' },
  { id: 4, level: 'warning', message: '5 nguyên liệu sắp hết tồn kho' },
];

export const MOCK_MENU_SUMMARY = {
  totalItemsSold: 1253,
  prevTotalItemsSold: 1089,
  avgOrderValue: 235_000,
  prevAvgOrderValue: 217_600,
  completedBills: 124,
  prevCompletedBills: 110,
};
