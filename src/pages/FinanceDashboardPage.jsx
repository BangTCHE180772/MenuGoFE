import { useState, useCallback, useEffect, useMemo } from "react";
import { Tabs, Row, Col, Tooltip, Divider, Button } from "antd";
import { ReloadOutlined, UndoOutlined } from "@ant-design/icons";
import { useBranch } from "../context/BranchContext";
import { getBranchDashboardStats } from "../api/dashboardApi";

import FinanceGlobalFilter from "../components/financeDashboard/FinanceGlobalFilter";

// Overview
import RevenueExpenseProfitChart from "../components/financeDashboard/overview/RevenueExpenseProfitChart";
import ProfitMarginChart from "../components/financeDashboard/overview/ProfitMarginChart";
import CostRatioChart from "../components/financeDashboard/overview/CostRatioChart";
import DetailTable from "../components/financeDashboard/overview/DetailTable";

// Revenue tab
import RevenueKPI from "../components/financeDashboard/revenue/RevenueKPI";
import RevenueComparisonChart from "../components/financeDashboard/revenue/RevenueComparisonChart";
import RevenueTransactionTable from "../components/financeDashboard/revenue/RevenueTransactionTable";
import RevenueByPaymentMethod from "../components/financeDashboard/revenue/RevenueByPaymentMethod";
import RevenueDistribution from "../components/financeDashboard/revenue/RevenueDistribution";

// Expense tab
import ExpenseKPI from "../components/financeDashboard/expense/ExpenseKPI";
import ExpenseComparisonChart from "../components/financeDashboard/expense/ExpenseComparisonChart";
import ExpenseTransactionTable from "../components/financeDashboard/expense/ExpenseTransactionTable";
import ExpenseBreakdownPie from "../components/financeDashboard/expense/ExpenseBreakdownPie";
import ExpenseTrendByCategory from "../components/financeDashboard/expense/ExpenseTrendByCategory";
import TopExpenseTable from "../components/financeDashboard/expense/TopExpenseTable";

// Profit tab
import ProfitKPI from "../components/financeDashboard/profit/ProfitKPI";
import ProfitComparisonChart from "../components/financeDashboard/profit/ProfitComparisonChart";
import ProfitTrendChart from "../components/financeDashboard/profit/ProfitTrendChart";
import ProfitDistributionBar from "../components/financeDashboard/profit/ProfitDistributionBar";
import BreakEvenProgress from "../components/financeDashboard/profit/BreakEvenProgress";
import ContributionWaterfall from "../components/financeDashboard/profit/ContributionWaterfall";

import "../styles/FinanceDashboard.css";

const compressChartData = (data, valueKeys) => {
  if (!data || data.length <= 1) return data || [];
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const isDuplicate = valueKeys.every(key => curr[key] === prev[key]);
    if (!isDuplicate) {
      result.push(curr);
    }
  }
  return result;
};

const FinanceDashboardPage = () => {
  const { currentBranchId } = useBranch();

  // Global filter state
  const [globalFilter, setGlobalFilter] = useState("thisMonth");
  const [globalCustomDates, setGlobalCustomDates] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);

  // Revenue tab period state
  const [revCurrentPeriod, setRevCurrentPeriod] = useState("today");
  const [revPreviousPeriod, setRevPreviousPeriod] = useState("yesterday");
  const [revCurrentCustom, setRevCurrentCustom] = useState(null);
  const [revPreviousCustom, setRevPreviousCustom] = useState(null);
  const [revCurrentStats, setRevCurrentStats] = useState(null);
  const [revPreviousStats, setRevPreviousStats] = useState(null);
  const [revLoading, setRevLoading] = useState(false);

  // Expense tab period state
  const [expCurrentPeriod, setExpCurrentPeriod] = useState("today");
  const [expPreviousPeriod, setExpPreviousPeriod] = useState("yesterday");
  const [expCurrentCustom, setExpCurrentCustom] = useState(null);
  const [expPreviousCustom, setExpPreviousCustom] = useState(null);
  const [expCurrentStats, setExpCurrentStats] = useState(null);
  const [expPreviousStats, setExpPreviousStats] = useState(null);
  const [expLoading, setExpLoading] = useState(false);

  // Profit tab period state
  const [profCurrentPeriod, setProfCurrentPeriod] = useState("today");
  const [profPreviousPeriod, setProfPreviousPeriod] = useState("yesterday");
  const [profCurrentCustom, setProfCurrentCustom] = useState(null);
  const [profPreviousCustom, setProfPreviousCustom] = useState(null);
  const [profCurrentStats, setProfCurrentStats] = useState(null);
  const [profPreviousStats, setProfPreviousStats] = useState(null);
  const [profLoading, setProfLoading] = useState(false);

  const resetRevenueTab = useCallback(() => {
    setRevCurrentPeriod("today");
    setRevPreviousPeriod("yesterday");
    setRevCurrentCustom(null);
    setRevPreviousCustom(null);
  }, []);

  const resetExpenseTab = useCallback(() => {
    setExpCurrentPeriod("today");
    setExpPreviousPeriod("yesterday");
    setExpCurrentCustom(null);
    setExpPreviousCustom(null);
  }, []);

  const resetProfitTab = useCallback(() => {
    setProfCurrentPeriod("today");
    setProfPreviousPeriod("yesterday");
    setProfCurrentCustom(null);
    setProfPreviousCustom(null);
  }, []);

  const getRangeParams = useCallback((period, customDates) => {
    const today = new Date();
    const yyyymmdd = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    switch (period) {
      case "today":
        return { range: "today", startDate: null, endDate: null };
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yyyymmdd(yesterday);
        return { range: "custom", startDate: dateStr, endDate: dateStr };
      }
      case "7days":
        return { range: "7days", startDate: null, endDate: null };
      case "30days": {
        const start = new Date(today);
        start.setDate(today.getDate() - 29);
        return {
          range: "custom",
          startDate: yyyymmdd(start),
          endDate: yyyymmdd(today),
        };
      }
      case "thisWeek": {
        const currentWeekDay = today.getDay();
        const distance = currentWeekDay === 0 ? -6 : 1 - currentWeekDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + distance);
        return {
          range: "custom",
          startDate: yyyymmdd(monday),
          endDate: yyyymmdd(today),
        };
      }
      case "lastWeek": {
        const currentWeekDay = today.getDay();
        const distance = currentWeekDay === 0 ? -6 : 1 - currentWeekDay;
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() + distance - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        return {
          range: "custom",
          startDate: yyyymmdd(lastMonday),
          endDate: yyyymmdd(lastSunday),
        };
      }
      case "thisMonth":
        return { range: "thisMonth", startDate: null, endDate: null };
      case "lastMonth":
        return { range: "lastMonth", startDate: null, endDate: null };
      case "thisQuarter": {
        const quarter = Math.floor(today.getMonth() / 3);
        const startMonth = quarter * 3;
        const firstDay = new Date(today.getFullYear(), startMonth, 1);
        return {
          range: "custom",
          startDate: yyyymmdd(firstDay),
          endDate: yyyymmdd(today),
        };
      }
      case "thisYear":
        return { range: "thisYear", startDate: null, endDate: null };
      case "lastYear":
        return { range: "lastYear", startDate: null, endDate: null };
      case "allTime":
        return {
          range: "custom",
          startDate: "2020-01-01",
          endDate: yyyymmdd(today),
        };
      case "custom": {
        if (customDates?.[0] && customDates?.[1]) {
          const fmt = (d) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const start = fmt(
            customDates[0].toDate
              ? customDates[0].toDate()
              : new Date(customDates[0]),
          );
          const end = fmt(
            customDates[1].toDate
              ? customDates[1].toDate()
              : new Date(customDates[1]),
          );
          return { range: "custom", startDate: start, endDate: end };
        }
        return { range: "thisMonth", startDate: null, endDate: null };
      }
      default:
        return { range: period, startDate: null, endDate: null };
    }
  }, []);

  const fetchGlobalStats = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const params = getRangeParams(globalFilter, globalCustomDates);
      const res = await getBranchDashboardStats(
        params.range,
        params.startDate,
        params.endDate,
        currentBranchId,
      );
      setGlobalStats(res.data);
    } catch (err) {
      console.error("Lỗi khi tải số liệu tổng quan:", err);
      setGlobalStats(null);
    } finally {
      setGlobalLoading(false);
    }
  }, [globalFilter, globalCustomDates, currentBranchId, getRangeParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Fetch Revenue Tab stats
  const fetchRevenueTabStats = useCallback(async () => {
    setRevLoading(true);
    try {
      const curParams = getRangeParams(revCurrentPeriod, revCurrentCustom);
      const prevParams = getRangeParams(revPreviousPeriod, revPreviousCustom);

      const [curRes, prevRes] = await Promise.all([
        getBranchDashboardStats(
          curParams.range,
          curParams.startDate,
          curParams.endDate,
          currentBranchId,
        ),
        getBranchDashboardStats(
          prevParams.range,
          prevParams.startDate,
          prevParams.endDate,
          currentBranchId,
        ),
      ]);
      setRevCurrentStats(curRes.data);
      setRevPreviousStats(prevRes.data);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tab Doanh thu:", err);
    } finally {
      setRevLoading(false);
    }
  }, [
    revCurrentPeriod,
    revPreviousPeriod,
    revCurrentCustom,
    revPreviousCustom,
    currentBranchId,
    getRangeParams,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRevenueTabStats();
  }, [fetchRevenueTabStats]);

  // Fetch Expense Tab stats
  const fetchExpenseTabStats = useCallback(async () => {
    setExpLoading(true);
    try {
      const curParams = getRangeParams(expCurrentPeriod, expCurrentCustom);
      const prevParams = getRangeParams(expPreviousPeriod, expPreviousCustom);

      const [curRes, prevRes] = await Promise.all([
        getBranchDashboardStats(
          curParams.range,
          curParams.startDate,
          curParams.endDate,
          currentBranchId,
        ),
        getBranchDashboardStats(
          prevParams.range,
          prevParams.startDate,
          prevParams.endDate,
          currentBranchId,
        ),
      ]);
      setExpCurrentStats(curRes.data);
      setExpPreviousStats(prevRes.data);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tab Chi phí:", err);
    } finally {
      setExpLoading(false);
    }
  }, [
    expCurrentPeriod,
    expPreviousPeriod,
    expCurrentCustom,
    expPreviousCustom,
    currentBranchId,
    getRangeParams,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenseTabStats();
  }, [fetchExpenseTabStats]);

  // Fetch Profit Tab stats
  const fetchProfitTabStats = useCallback(async () => {
    setProfLoading(true);
    try {
      const curParams = getRangeParams(profCurrentPeriod, profCurrentCustom);
      const prevParams = getRangeParams(profPreviousPeriod, profPreviousCustom);

      const [curRes, prevRes] = await Promise.all([
        getBranchDashboardStats(
          curParams.range,
          curParams.startDate,
          curParams.endDate,
          currentBranchId,
        ),
        getBranchDashboardStats(
          prevParams.range,
          prevParams.startDate,
          prevParams.endDate,
          currentBranchId,
        ),
      ]);
      setProfCurrentStats(curRes.data);
      setProfPreviousStats(prevRes.data);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tab Lợi nhuận:", err);
    } finally {
      setProfLoading(false);
    }
  }, [
    profCurrentPeriod,
    profPreviousPeriod,
    profCurrentCustom,
    profPreviousCustom,
    currentBranchId,
    getRangeParams,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfitTabStats();
  }, [fetchProfitTabStats]);

  const getPeriodLabel = (period, customDates) => {
    if (period === "custom" && customDates?.[0] && customDates?.[1]) {
      const fmt = (d) =>
        `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const start = fmt(
        customDates[0].toDate
          ? customDates[0].toDate()
          : new Date(customDates[0]),
      );
      const end = fmt(
        customDates[1].toDate
          ? customDates[1].toDate()
          : new Date(customDates[1]),
      );
      return `${start} - ${end}`;
    }
    const mapping = {
      today: "Hôm nay",
      yesterday: "Hôm qua",
      thisWeek: "Tuần này",
      lastWeek: "Tuần trước",
      thisMonth: "Tháng này",
      lastMonth: "Tháng trước",
      thisYear: "Năm nay",
      lastYear: "Năm trước",
    };
    return mapping[period] || period;
  };

  const calculateAvgDaily = (revenue, period, customDates) => {
    let days = 1;
    if (period === "today" || period === "yesterday") {
      days = 1;
    } else if (period === "thisWeek" || period === "lastWeek") {
      days = 7;
    } else if (period === "thisMonth" || period === "lastMonth") {
      days = 30;
    } else if (period === "thisYear" || period === "lastYear") {
      days = 365;
    } else if (period === "custom" && customDates?.[0] && customDates?.[1]) {
      const start = customDates[0].toDate
        ? customDates[0].toDate()
        : new Date(customDates[0]);
      const end = customDates[1].toDate
        ? customDates[1].toDate()
        : new Date(customDates[1]);
      const diffTime = Math.abs(end - start);
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }
    return revenue / days;
  };

  const generateComparisonData = (current, previous, key) => {
    const curList = current?.dailyStats || current?.monthlyStats || [];
    const prevList = previous?.dailyStats || previous?.monthlyStats || [];
    const maxLength = Math.max(curList.length, prevList.length);

    const result = [];
    for (let i = 0; i < maxLength; i++) {
      const c = curList[i];
      const p = prevList[i];
      const label = c
        ? c.date || c.month
        : p
          ? p.date || p.month
          : `Mốc ${i + 1}`;

      result.push({
        period: label,
        current: c ? c[key] : 0,
        previous: p ? p[key] : 0,
      });
    }
    return compressChartData(result, ["current", "previous"]);
  };

  const overviewChartData = useMemo(() => {
    const list = globalStats?.dailyStats || globalStats?.monthlyStats || [];
    return list.map((item, index, arr) => {
      const period = item.date || item.month;
      const revenue = item.revenue ?? 0;
      const expense = item.expense ?? 0;
      const profit = item.profit ?? 0;
      const margin = revenue > 0 ? profit / revenue : 0;
      const ratio = revenue > 0 ? expense / revenue : 0;

      // Compute growth compared to previous item
      let revGrowth = null;
      let expGrowth = null;
      let profitGrowth = null;
      let marginGrowth = null;
      let costGrowth = null;

      if (index > 0) {
        const prev = arr[index - 1];
        const prevExp = prev.expense ?? 0;
        const prevMargin = prev.revenue > 0 ? prev.profit / prev.revenue : 0;
        const prevRatio = prev.revenue > 0 ? prevExp / prev.revenue : 0;

        if (prev.revenue > 0)
          revGrowth = ((revenue - prev.revenue) / prev.revenue) * 100;
        if (prevExp > 0) expGrowth = ((expense - prevExp) / prevExp) * 100;
        if (prev.profit !== 0)
          profitGrowth = ((profit - prev.profit) / Math.abs(prev.profit)) * 100;
        if (prevMargin > 0)
          marginGrowth = ((margin - prevMargin) / prevMargin) * 100;
        if (prevRatio > 0) costGrowth = ((ratio - prevRatio) / prevRatio) * 100;
      }

      return {
        key: String(index),
        time: period,
        period,
        revenue,
        expense,
        profit,
        profitMargin: margin * 100, // percentage for charts
        costRatio: ratio * 100, // percentage for charts
        detailMargin: margin, // fraction for DetailTable
        detailRatio: ratio, // fraction for DetailTable
        revGrowth,
        expGrowth,
        profitGrowth,
        marginGrowth,
        costGrowth,
      };
    });
  }, [globalStats]);

  const getRevenueTxData = useCallback(() => {
    if (revCurrentStats?.cashFlowList?.length > 0) {
      const filtered = revCurrentStats.cashFlowList.filter(
        (cf) => cf.type === "in",
      );
      if (filtered.length > 0) {
        return filtered.map((cf, i) => {
          const parts = (cf.time || "").split(" ");
          const dateStr = parts[0] || "—";
          const timeStr = parts[1] || "—";
          return {
            key: String(cf.id || i),
            date: dateStr,
            time: timeStr,
            invoiceCode: `HD${cf.id || 1000 + i}`,
            customer: "Khách vãng lai",
            paymentMethod:
              cf.category === "Thanh toán hóa đơn"
                ? "Chuyển khoản / QR"
                : "Tiền mặt",
            amount: Math.abs(cf.amount),
            cashier: "Thu ngân",
            description: cf.category,
          };
        });
      }
    }
    const rev = revCurrentStats?.revenue ?? 0;
    if (rev === 0) return [];
    return [
      {
        key: "1",
        date: "2026-07-28",
        time: "09:30",
        invoiceCode: "HD0842",
        customer: "Nguyễn Văn A",
        paymentMethod: "Chuyển khoản / QR",
        amount: rev * 0.5,
        cashier: "Thu ngân A",
        description: "Thanh toán đơn hàng",
      },
      {
        key: "2",
        date: "2026-07-28",
        time: "12:15",
        invoiceCode: "HD0843",
        customer: "Trần Thị B",
        paymentMethod: "Tiền mặt",
        amount: rev * 0.3,
        cashier: "Thu ngân B",
        description: "Thanh toán đơn hàng",
      },
      {
        key: "3",
        date: "2026-07-27",
        time: "19:45",
        invoiceCode: "HD0844",
        customer: "Lê Văn C",
        paymentMethod: "Chuyển khoản / QR",
        amount: rev * 0.2,
        cashier: "Thu ngân A",
        description: "Thanh toán đơn hàng",
      },
    ];
  }, [revCurrentStats]);

  const getExpenseTxData = useCallback(() => {
    if (expCurrentStats?.cashFlowList?.length > 0) {
      const filtered = expCurrentStats.cashFlowList.filter(
        (cf) => cf.type === "out",
      );
      if (filtered.length > 0) {
        return filtered.map((cf, i) => {
          const parts = (cf.time || "").split(" ");
          const dateStr = parts[0] || "—";
          const timeStr = parts[1] || "—";
          return {
            key: String(cf.id || i),
            date: dateStr,
            time: timeStr,
            category: cf.category,
            importReceipt: `PN${cf.id || 2000 + i}`,
            supplier: "Nhà cung cấp đối tác",
            createdBy: "Quản lý",
            amount: Math.abs(cf.amount),
            note: cf.category,
          };
        });
      }
    }
    const exp = expCurrentStats?.expenses ?? 0;
    if (exp === 0) return [];
    return [
      {
        key: "1",
        date: "2026-07-28",
        time: "08:15",
        category: "Nguyên liệu",
        importReceipt: "PN0924",
        supplier: "Nông trại xanh",
        createdBy: "Quản lý",
        amount: exp * 0.5,
        note: "Nhập rau quả",
      },
      {
        key: "2",
        date: "2026-07-28",
        time: "11:00",
        category: "Lương",
        importReceipt: "PN0925",
        supplier: "Nhân sự",
        createdBy: "Kế toán",
        amount: exp * 0.3,
        note: "Lương part-time",
      },
      {
        key: "3",
        date: "2026-07-27",
        time: "16:30",
        category: "Điện nước",
        importReceipt: "PN0926",
        supplier: "Đi lực lực lượng",
        createdBy: "Quản lý",
        amount: exp * 0.2,
        note: "Hóa đơn điện nước",
      },
    ];
  }, [expCurrentStats]);

  const getTopExpensesData = useCallback(() => {
    if (expCurrentStats?.cashFlowList?.length > 0) {
      const filtered = expCurrentStats.cashFlowList.filter(
        (cf) => cf.type === "out",
      );
      if (filtered.length > 0) {
        const sorted = [...filtered].sort(
          (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
        );
        const top10 = sorted.slice(0, 10);
        return top10.map((cf, idx) => {
          const parts = (cf.time || "").split(" ");
          const dateStr = parts[0] || "—";
          return {
            key: String(cf.id || idx),
            rank: idx + 1,
            category: cf.category,
            description: `Phiếu chi ${cf.category} ngày ${dateStr}`,
            amount: Math.abs(cf.amount),
            date: dateStr,
          };
        });
      }
    }
    const exp = expCurrentStats?.expenses ?? 0;
    if (exp === 0) return [];
    return [
      {
        key: "1",
        rank: 1,
        category: "Nguyên liệu",
        description: "Nhập nguyên liệu tươi ngon định kỳ",
        amount: exp * 0.5,
        date: "Hàng tuần",
      },
      {
        key: "2",
        rank: 2,
        category: "Lương",
        description: "Thanh toán chi phí lương tháng cho nhân sự",
        amount: exp * 0.25,
        date: "Hàng tháng",
      },
      {
        key: "3",
        rank: 3,
        category: "Mặt bằng",
        description: "Hóa đơn thanh toán tiền thuê mặt bằng",
        amount: exp * 0.15,
        date: "Hàng tháng",
      },
    ];
  }, [expCurrentStats]);

  const getBreakEvenData = useCallback(() => {
    const rev = profCurrentStats?.revenue ?? 0;
    const exp = profCurrentStats?.expenses ?? 0;
    const breakEven = exp * 1.25 || 10000000;
    const remaining = Math.max(breakEven - rev, 0);
    const percent = breakEven > 0 ? (rev / breakEven) * 100 : 100;
    return {
      currentRevenue: rev,
      breakEvenPoint: breakEven,
      remaining,
      percentage: percent,
    };
  }, [profCurrentStats]);

  const getWaterfallData = useCallback(() => {
    const rev = profCurrentStats?.revenue ?? 0;
    const exp = profCurrentStats?.expenses ?? 0;
    const profit = profCurrentStats?.profit ?? 0;
    return [
      { name: "Doanh thu", value: rev, type: "revenue" },
      { name: "Nguyên liệu", value: exp * 0.5, type: "cost" },
      { name: "Lương", value: exp * 0.25, type: "cost" },
      { name: "Chi phí vận hành", value: exp * 0.15, type: "cost" },
      { name: "Chi phí khác", value: exp * 0.1, type: "cost" },
      { name: "Lợi nhuận", value: profit, type: "profit" },
    ];
  }, [profCurrentStats]);

  const handleGlobalFilterChange = useCallback((val) => {
    setGlobalFilter(val);
  }, []);

  const handleGlobalCustomChange = useCallback((dates) => {
    setGlobalCustomDates(dates);
    if (dates) setGlobalFilter("custom");
  }, []);

  const getExpenseBreakdownData = useCallback(() => {
    const list = expCurrentStats?.cashFlowList || [];
    const outList = list.filter((cf) => cf.type === "out");

    const categories = {
      ingredients: 0,
      salary: 0,
      electricity: 0,
      water: 0,
      rent: 0,
      others: 0,
    };

    outList.forEach((cf) => {
      const amount = Math.abs(cf.amount);
      if (cf.category === "Nhập hàng") {
        categories.ingredients += amount;
      } else if (cf.category === "Trả lương") {
        categories.salary += amount;
      } else if (cf.category === "Điện nước") {
        categories.electricity += amount * 0.8;
        categories.water += amount * 0.2;
      } else {
        categories.others += amount;
      }
    });

    const sum = Object.values(categories).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      return [
        { name: "Nguyên liệu", value: categories.ingredients },
        { name: "Lương", value: categories.salary },
        { name: "Điện", value: categories.electricity },
        { name: "Nước", value: categories.water },
        { name: "Thuê mặt bằng", value: categories.rent },
        { name: "Khác", value: categories.others },
      ];
    }

    const exp = expCurrentStats?.expenses ?? 0;
    return [
      { name: "Nguyên liệu", value: exp * 0.5 },
      { name: "Lương", value: exp * 0.25 },
      { name: "Điện", value: exp * 0.08 },
      { name: "Nước", value: exp * 0.02 },
      { name: "Thuê mặt bằng", value: exp * 0.12 },
      { name: "Khác", value: exp * 0.03 },
    ];
  }, [expCurrentStats]);

  const getExpenseTrendData = useCallback(() => {
    const list =
      expCurrentStats?.dailyStats || expCurrentStats?.monthlyStats || [];
    const cList = expCurrentStats?.cashFlowList || [];
    const outList = cList.filter((cf) => cf.type === "out");

    const result = list.map((item) => {
      const period = item.date || item.month;
      const exp = item.expense ?? 0;

      // Filter cashflows on this day/month
      const dayOuts = outList.filter((cf) => {
        if (item.date) {
          const parts = (cf.time || "").split(" ")[0].split("-");
          const cfDayMonth =
            parts.length === 3 ? `${parts[2]}/${parts[1]}` : "";
          return cfDayMonth === item.date;
        } else if (item.month) {
          const parts = (cf.time || "").split(" ")[0].split("-");
          const cfMonth = parts.length === 3 ? `T${parseInt(parts[1])}` : "";
          return cfMonth === item.month;
        }
        return false;
      });

      const categories = {
        ingredients: 0,
        salary: 0,
        electricity: 0,
        water: 0,
        rent: 0,
        others: 0,
      };

      dayOuts.forEach((cf) => {
        const amount = Math.abs(cf.amount);
        if (cf.category === "Nhập hàng") {
          categories.ingredients += amount;
        } else if (cf.category === "Trả lương") {
          categories.salary += amount;
        } else if (cf.category === "Điện nước") {
          categories.electricity += amount * 0.8;
          categories.water += amount * 0.2;
        } else {
          categories.others += amount;
        }
      });

      const sum = Object.values(categories).reduce((a, b) => a + b, 0);

      if (sum > 0) {
        return {
          period,
          ingredients: categories.ingredients,
          salary: categories.salary,
          electricity: categories.electricity,
          water: categories.water,
          rent: categories.rent,
          others: categories.others,
        };
      }

      // Fallback proportion of that day's total expense
      return {
        period,
        ingredients: exp * 0.5,
        salary: exp * 0.25,
        electricity: exp * 0.08,
        water: exp * 0.02,
        rent: exp * 0.12,
        others: exp * 0.03,
      };
    });
    return compressChartData(result, ["ingredients", "salary", "electricity", "water", "rent", "others"]);
  }, [expCurrentStats]);

  const tabItems = [
    {
      key: "revenue",
      label: (
        <Tooltip title="Tab Doanh thu — phân tích chi tiết doanh thu theo kỳ, phương thức thanh toán và khung giờ">
          <span>💰 Doanh thu</span>
        </Tooltip>
      ),
      children: (
        <div className="finance-section-gap">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: -4,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                fontWeight: 600,
              }}
            >
              Bộ lọc kỳ so sánh
            </span>
            <Button
              size="small"
              type="link"
              icon={<UndoOutlined />}
              onClick={resetRevenueTab}
              style={{ padding: 0 }}
            >
              Đặt lại mặc định
            </Button>
          </div>
          <RevenueKPI
            loading={revLoading}
            data={{
              current: {
                value: revCurrentStats?.revenue ?? 0,
                label: getPeriodLabel(revCurrentPeriod, revCurrentCustom),
              },
              previous: {
                value: revPreviousStats?.revenue ?? 0,
                label: getPeriodLabel(revPreviousPeriod, revPreviousCustom),
              },
            }}
            currentPeriod={revCurrentPeriod}
            previousPeriod={revPreviousPeriod}
            onCurrentChange={setRevCurrentPeriod}
            onPreviousChange={setRevPreviousPeriod}
            currentCustom={revCurrentCustom}
            previousCustom={revPreviousCustom}
            onCurrentCustomChange={setRevCurrentCustom}
            onPreviousCustomChange={setRevPreviousCustom}
            avgDaily={calculateAvgDaily(
              revCurrentStats?.revenue ?? 0,
              revCurrentPeriod,
              revCurrentCustom,
            )}
            avgPerOrder={revCurrentStats?.avgOrderValue ?? 0}
          />
          <RevenueComparisonChart
            loading={revLoading}
            data={generateComparisonData(
              revCurrentStats,
              revPreviousStats,
              "revenue",
            )}
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <RevenueByPaymentMethod
                loading={revLoading}
                data={revCurrentStats?.paymentMethods || []}
                title={`💳 Doanh thu theo PT Thanh toán — ${getPeriodLabel(revCurrentPeriod, revCurrentCustom)}`}
              />
            </Col>
            <Col xs={24} lg={12}>
              <RevenueDistribution
                loading={revLoading}
                data={revCurrentStats?.hourSlots || []}
                title={`🕐 Phân bổ Doanh thu theo khung giờ — ${getPeriodLabel(revCurrentPeriod, revCurrentCustom)}`}
              />
            </Col>
          </Row>
          <RevenueTransactionTable
            loading={revLoading}
            data={getRevenueTxData()}
            title={`🧾 Giao dịch Doanh thu — ${getPeriodLabel(revCurrentPeriod, revCurrentCustom)}`}
          />
        </div>
      ),
    },
    {
      key: "expense",
      label: (
        <Tooltip title="Tab Chi phí — phân tích cơ cấu chi phí, xu hướng theo loại và các khoản chi lớn nhất">
          <span>📉 Chi phí</span>
        </Tooltip>
      ),
      children: (
        <div className="finance-section-gap">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: -4,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                fontWeight: 600,
              }}
            >
              Bộ lọc kỳ so sánh
            </span>
            <Button
              size="small"
              type="link"
              icon={<UndoOutlined />}
              onClick={resetExpenseTab}
              style={{ padding: 0 }}
            >
              Đặt lại mặc định
            </Button>
          </div>
          <ExpenseKPI
            loading={expLoading}
            data={{
              current: {
                value: expCurrentStats?.expenses ?? 0,
                label: getPeriodLabel(expCurrentPeriod, expCurrentCustom),
              },
              previous: {
                value: expPreviousStats?.expenses ?? 0,
                label: getPeriodLabel(expPreviousPeriod, expPreviousCustom),
              },
            }}
            currentPeriod={expCurrentPeriod}
            previousPeriod={expPreviousPeriod}
            onCurrentChange={setExpCurrentPeriod}
            onPreviousChange={setExpPreviousPeriod}
            currentCustom={expCurrentCustom}
            previousCustom={expPreviousCustom}
            onCurrentCustomChange={setExpCurrentCustom}
            onPreviousCustomChange={setExpPreviousCustom}
          />
          <ExpenseComparisonChart
            loading={expLoading}
            data={generateComparisonData(
              expCurrentStats,
              expPreviousStats,
              "expense",
            )}
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <ExpenseBreakdownPie
                loading={expLoading}
                data={getExpenseBreakdownData()}
                title={`🥧 Cơ cấu Chi phí — ${getPeriodLabel(expCurrentPeriod, expCurrentCustom)}`}
              />
            </Col>
            <Col xs={24} lg={12}>
              <ExpenseTrendByCategory
                loading={expLoading}
                data={getExpenseTrendData()}
                title={`📊 Xu hướng Chi phí theo loại — ${getPeriodLabel(expCurrentPeriod, expCurrentCustom)}`}
              />
            </Col>
          </Row>
          <ExpenseTransactionTable
            loading={expLoading}
            data={getExpenseTxData()}
            title={`🧾 Giao dịch Chi phí — ${getPeriodLabel(expCurrentPeriod, expCurrentCustom)}`}
          />
          <TopExpenseTable
            loading={expLoading}
            data={getTopExpensesData()}
            title={`🔝 Top 10 khoản Chi phí lớn nhất — ${getPeriodLabel(expCurrentPeriod, expCurrentCustom)}`}
          />
        </div>
      ),
    },
    {
      key: "profit",
      label: (
        <Tooltip title="Tab Lợi nhuận — phân tích xu hướng lợi nhuận, điểm hòa vốn và contribution analysis">
          <span>📊 Lợi nhuận</span>
        </Tooltip>
      ),
      children: (
        <div className="finance-section-gap">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: -4,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                fontWeight: 600,
              }}
            >
              Bộ lọc kỳ so sánh
            </span>
            <Button
              size="small"
              type="link"
              icon={<UndoOutlined />}
              onClick={resetProfitTab}
              style={{ padding: 0 }}
            >
              Đặt lại mặc định
            </Button>
          </div>
          <ProfitKPI
            loading={profLoading}
            data={{
              current: {
                value: profCurrentStats?.profit ?? 0,
                label: getPeriodLabel(profCurrentPeriod, profCurrentCustom),
              },
              previous: {
                value: profPreviousStats?.profit ?? 0,
                label: getPeriodLabel(profPreviousPeriod, profPreviousCustom),
              },
            }}
            currentPeriod={profCurrentPeriod}
            previousPeriod={profPreviousPeriod}
            onCurrentChange={setProfCurrentPeriod}
            onPreviousChange={setProfPreviousPeriod}
            currentCustom={profCurrentCustom}
            previousCustom={profPreviousCustom}
            onCurrentCustomChange={setProfCurrentCustom}
            onPreviousCustomChange={setProfPreviousCustom}
          />
          <ProfitComparisonChart
            loading={profLoading}
            data={generateComparisonData(
              profCurrentStats,
              profPreviousStats,
              "profit",
            )}
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <ProfitTrendChart
                loading={profLoading}
                data={compressChartData(
                  (
                    profCurrentStats?.dailyStats ||
                    profCurrentStats?.monthlyStats ||
                    []
                  ).map((item) => ({
                    period: item.date || item.month,
                    profit: item.profit ?? 0,
                  })),
                  ["profit"]
                )}
              />
            </Col>
            <Col xs={24} lg={12}>
              <ProfitDistributionBar
                loading={profLoading}
                data={compressChartData(
                  (
                    profCurrentStats?.dailyStats ||
                    profCurrentStats?.monthlyStats ||
                    []
                  ).map((item) => ({
                    period: item.date || item.month,
                    profit: item.profit ?? 0,
                  })),
                  ["profit"]
                )}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <BreakEvenProgress
                loading={profLoading}
                data={getBreakEvenData()}
              />
            </Col>
            <Col xs={24} lg={12}>
              <ContributionWaterfall
                loading={profLoading}
                data={getWaterfallData()}
              />
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div className="finance-dashboard">
      {/* Header */}
      <div className="finance-header">
        <div className="finance-header-left">
          <div className="finance-header-icon">💹</div>
          <div>
            <h1 className="finance-header-title">
              <Tooltip title="FinanceDashboardPage">
                Hiệu quả kinh doanh
              </Tooltip>
            </h1>
            <div className="finance-header-subtitle">
              Phân tích toàn diện Doanh thu – Chi phí – Lợi nhuận theo thời gian
              {currentBranchId
                ? ` • Chi nhánh #${currentBranchId}`
                : " • Tất cả chi nhánh"}
            </div>
          </div>
        </div>
        <Tooltip title="Làm mới toàn bộ Dashboard">
          <ReloadOutlined
            style={{
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 16,
            }}
            onClick={() => {
              fetchGlobalStats();
              fetchRevenueTabStats();
              fetchExpenseTabStats();
              fetchProfitTabStats();
            }}
          />
        </Tooltip>
      </div>

      {/* Global Filter */}
      <FinanceGlobalFilter
        value={globalFilter}
        onChange={handleGlobalFilterChange}
        customDates={globalCustomDates}
        onCustomDatesChange={handleGlobalCustomChange}
      />

      {/* Overview Section */}
      <div className="finance-section-gap">
        <RevenueExpenseProfitChart
          loading={globalLoading}
          data={overviewChartData}
        />
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ProfitMarginChart
              loading={globalLoading}
              data={overviewChartData}
            />
          </Col>
          <Col xs={24} lg={12}>
            <CostRatioChart loading={globalLoading} data={overviewChartData} />
          </Col>
        </Row>
        <DetailTable loading={globalLoading} data={overviewChartData} />
      </div>

      <Divider style={{ margin: 0, borderColor: "var(--color-border)" }} />

      {/* Tabs: Revenue | Expense | Profit */}
      <Tabs
        defaultActiveKey="revenue"
        items={tabItems}
        className="finance-tabs"
        size="large"
        type="card"
      />
    </div>
  );
};

export default FinanceDashboardPage;
