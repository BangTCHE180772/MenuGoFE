import React, { useState, useEffect, useCallback } from "react";
import { Typography, Segmented, message, Space, Tag, Spin } from "antd";
import {
  DashboardOutlined,
  TableOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import HomeFilter from "../components/homePage/HomeFilter";
import HomeDashboard from "../components/homePage/HomeDashboard";
import HomeReport from "../components/homePage/HomeReport";
import { getBranchDashboardStats } from "../api/dashboardApi";
import { MOCK_DAILY_REPORT } from "../components/homePage/homeMockData";

const { Title, Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0
  );

// ─── MAP BE → ReportData ────────────────────────────────────────────────────
/**
 * BE Response (GET /api/Dashboard/branch-stats) JSON shape (camelCase):
 *
 * {
 *   revenue: double,           // Tổng Payment.Status=="Success" trong kỳ
 *   expenses: double,          // Tổng CashFlow Direction==2 (Chi) trong kỳ
 *   profit: double,
 *   completedBills: int,       // Số Payment thành công
 *   avgOrderValue: double,
 *   totalItemsSold: int,
 *
 *   orderSummary: {            // CHỈ CÓ KHI range=="today"
 *     new: int,                // Active && createdAt >= 1h trước
 *     paid: int,               // Status=="Paid"
 *     unpaid: int,             // Active && createdAt < 1h trước
 *     cancelled: int,
 *     total: int
 *   },
 *
 *   alerts: [{ level: "warning"|"danger", message: string }],
 *
 *   cashFlowList: [{           // Từ GetCashFlowListAsync: Payments + CashFlows
 *     id: long,
 *     time: "yyyy-MM-dd HH:mm",
 *     type: "in"|"out",
 *     category: string,        // "Thanh toán hóa đơn" | "Trả lương" | "Nhập hàng" | ...
 *     amount: double           // Chi: âm, Thu: dương
 *   }],
 *
 *   hourSlots: [{              // 4 khung giờ cố định (chỉ tính Paid)
 *     slot: "Sáng (6-11h)"|"Trưa (11-14h)"|"Chiều (14-18h)"|"Tối (18-22h)",
 *     value: double            // Doanh thu khung giờ đó
 *   }],
 *
 *   topDishes: [{ name: string, quantity: int }],   // Top 10 bán chạy nhất
 *   leastDishes: [{ name: string, quantity: int }], // Top 10 bán chậm nhất
 *
 *   dailyStats: [{             // Breakdown theo ngày (dùng khi range > 1 ngày)
 *     date: "dd/MM",
 *     revenue: double,
 *     expense: double,
 *     profit: double
 *   }],
 *
 *   paymentMethods: [{ name: string, value: double }],
 *   monthlyStats: [...]
 * }
 */
const mapBeToReportData = (beStats, dateStr) => {
  // ── KPIs (lấy thẳng từ BE, không tự tính lại)
  const revenue   = beStats.revenue   || 0;
  const expense   = beStats.expenses  || 0;
  const profit    = beStats.profit    || 0;
  const completedBills = beStats.completedBills || 0;

  // ── Biểu đồ xu hướng:
  //    Ưu tiên hourSlots (range=today), fallback dailyStats (range=custom/yesterday)
  let hourlyTrends;
  if (beStats.hourSlots && beStats.hourSlots.length > 0) {
    // hourSlots: 4 khung giờ, doanh thu từ Paid orders
    // Chart dùng dataKey="hour" cho XAxis, "revenue"/"expense"/"profit" cho Lines
    // expense & profit mỗi slot: ước tính tỷ lệ từ tổng ngày (không có data khung giờ chi tiết)
    const expenseRatio = revenue > 0 ? expense / revenue : 0;
    const profitRatio  = revenue > 0 ? profit  / revenue : 0;
    hourlyTrends = beStats.hourSlots.map((slot) => ({
      hour:    slot.slot,
      revenue: slot.value || 0,
      expense: Math.round((slot.value || 0) * expenseRatio),
      profit:  Math.round((slot.value || 0) * profitRatio),
      orders:  0,
    }));
  } else if (beStats.dailyStats && beStats.dailyStats.length > 0) {
    hourlyTrends = beStats.dailyStats.map((item) => ({
      hour:    item.date || "N/A",
      revenue: item.revenue || 0,
      expense: item.expense || 0,
      profit:  item.profit  || 0,
      orders:  0,
    }));
  } else {
    // Không có data thật → hiển thị 4 slot rỗng (không dùng mock)
    hourlyTrends = [
      { hour: "Sáng (6-11h)",   revenue: 0, expense: 0, profit: 0, orders: 0 },
      { hour: "Trưa (11-14h)",  revenue: 0, expense: 0, profit: 0, orders: 0 },
      { hour: "Chiều (14-18h)", revenue: 0, expense: 0, profit: 0, orders: 0 },
      { hour: "Tối (18-22h)",   revenue: 0, expense: 0, profit: 0, orders: 0 },
    ];
  }

  // ── TopDishes → topDishes cho chart TopDishes
  const topDishes =
    beStats.topDishes && beStats.topDishes.length > 0
      ? beStats.topDishes.map((d) => ({
          name:     d.name,
          quantity: d.quantity || 0,
          revenue:  beStats.completedBills > 0
            ? Math.round((beStats.avgOrderValue || 0) * (d.quantity || 0))
            : 0,
        }))
      : [];

  // ── CashFlowList → Tab Thu chi tài chính
  // CashFlowReportTable expects: { id, code, docCode, time, type("Thu"|"Chi"), person, note, amount }
  let cashFlowList = [];
  if (beStats.cashFlowList && beStats.cashFlowList.length > 0) {
    cashFlowList = beStats.cashFlowList.map((item, idx) => {
      const isIncome = item.type === "in";
      const timeStr  = item.time
        ? (item.time.length > 5
            ? dayjs(item.time).format("HH:mm")
            : item.time)
        : "00:00";
      return {
        id:      String(item.id || idx + 1),
        code:    `TC-${String(item.id || idx + 1).padStart(8, "0")}`,
        docCode: isIncome
          ? `CT-TN-${String(item.id || idx + 1).padStart(4, "0")}`
          : `CT-NK-${String((item.id || idx + 1) - 1000000).padStart(4, "0")}`,
        time:    timeStr,
        type:    isIncome ? "Thu" : "Chi",
        person:  item.category || "Hệ thống",
        note:    item.category || "Giao dịch",
        amount:  Math.abs(item.amount || 0),
      };
    });
  }

  // ── SalesTable → Tab Bán hàng (chỉ đơn ĐÃ THANH TOÁN)
  // Lấy từ cashFlowList loại "Thu" với category="Thanh toán hóa đơn"
  // Đây là các Payment thành công → đúng dữ liệu đã thanh toán
  const paidFlows = cashFlowList.filter((cf) => cf.type === "Thu");
  const salesList = paidFlows.length > 0
    ? paidFlows.map((cf, idx) => ({
        id:            String(idx + 1),
        billCode:      cf.docCode || `HD-${String(idx + 1).padStart(6, "0")}`,
        time:          cf.time,
        tableName:     "—",           // Payment không có thông tin bàn
        cashier:       "—",           // Payment không có thông tin thu ngân
        itemCount:     1,             // Payment không biết số món
        subtotal:      cf.amount,
        surcharge:     0,
        discount:      0,
        total:         cf.amount,
        paymentMethod: cf.person === "Thanh toán hóa đơn" ? "Hệ thống" : cf.person,
      }))
    : [];                              // Không có đơn đã thanh toán → bảng rỗng thật

  // ── InventoryTable → Tab Hàng hóa (sản phẩm bán được trong kỳ)
  // Dùng TopDishes + LeastDishes của BE, gộp lại tránh trùng
  // InventoryReportTable expects: { itemCode, itemName, qtySold, unitPrice, revenue, sharePct }
  let inventoryList = [];
  if (beStats.topDishes && beStats.topDishes.length > 0) {
    const topNames = new Set(beStats.topDishes.map((d) => d.name));
    const leastUnique = (beStats.leastDishes || []).filter((d) => !topNames.has(d.name));
    const allDishes = [...beStats.topDishes, ...leastUnique];
    const soldDishes = allDishes.filter((d) => (d.quantity || 0) > 0);

    if (soldDishes.length > 0) {
      const totalQty = soldDishes.reduce((acc, d) => acc + (d.quantity || 0), 0);
      // unitPrice ước tính = Doanh thu / Tổng số lượng bán
      const estimatedUnitPrice =
        totalQty > 0 && completedBills > 0
          ? Math.round(revenue / totalQty)
          : 0;

      const mapped = soldDishes.map((dish, idx) => {
        const dishRev = dish.quantity * estimatedUnitPrice;
        return {
          id:        String(idx + 1),
          itemCode:  `SP-${String(idx + 1).padStart(3, "0")}`,
          itemName:  dish.name,
          qtySold:   dish.quantity,
          unitPrice: estimatedUnitPrice,
          revenue:   dishRev,
          sharePct:  0, // tính sau
        };
      });

      const totalRev = mapped.reduce((acc, p) => acc + p.revenue, 0);
      inventoryList = mapped.map((p) => ({
        ...p,
        sharePct:
          totalRev > 0
            ? Number(((p.revenue / totalRev) * 100).toFixed(1))
            : 0,
      }));
    }
  }
  // inventoryList = [] nếu không có món nào bán ra trong kỳ

  return {
    dateStr: dateStr || dayjs().format("DD/MM/YYYY"),
    kpis: {
      revenue: {
        value:     revenue,
        formatted: formatVND(revenue),
        changePct: 0,
        isPositive: revenue >= 0,
      },
      expense: {
        value:     expense,
        formatted: formatVND(expense),
        changePct: 0,
        isPositive: true,
      },
      profit: {
        value:     profit,
        formatted: formatVND(profit),
        changePct: 0,
        isPositive: profit >= 0,
      },
      orders: {
        value:     completedBills,
        formatted: `${completedBills} đơn`,
        changePct: 0,
        isPositive: true,
      },
    },
    orderSummary:   beStats.orderSummary   || null,
    alerts:         beStats.alerts         || [],
    paymentMethods: beStats.paymentMethods || [],
    hourlyTrends,
    topDishes,
    salesList,
    cashFlowList,
    inventoryList,
  };
};

// ─── HomePage Component ──────────────────────────────────────────────────────
const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("DD/MM/YYYY"));
  const [loading, setLoading]           = useState(false);
  const [displayMode, setDisplayMode]   = useState("dashboard");
  const [reportData, setReportData]     = useState(MOCK_DAILY_REPORT);

  const fetchDashboardData = useCallback(async (dateStr) => {
    setLoading(true);
    try {
      const parsedDate = dayjs(dateStr, "DD/MM/YYYY");
      const isToday     = parsedDate.isSame(dayjs(), "day");
      const isYesterday = parsedDate.isSame(dayjs().subtract(1, "day"), "day");

      const range        = isToday ? "today" : isYesterday ? "yesterday" : "custom";
      const formattedStart = parsedDate.format("YYYY-MM-DD");
      const formattedEnd   = parsedDate.format("YYYY-MM-DD");

      const res = await getBranchDashboardStats(range, formattedStart, formattedEnd, null);

      if (res?.data) {
        console.log("[HomePage] BE response:", JSON.stringify(res.data, null, 2));
        setReportData(mapBeToReportData(res.data, dateStr));
      } else {
        setReportData({ ...MOCK_DAILY_REPORT, dateStr });
      }
    } catch (err) {
      console.warn("[HomePage] API error, sử dụng mock data:", err);
      setReportData({ ...MOCK_DAILY_REPORT, dateStr });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate, fetchDashboardData]);

  const handleDateChange = (newDate) => setSelectedDate(newDate);

  const handleResetFilter = () => {
    const todayStr = dayjs().format("DD/MM/YYYY");
    setSelectedDate(todayStr);
    message.info("Đã đặt lại bộ lọc về hôm nay");
  };

  return (
    <div style={{ width: "100%", paddingBottom: 24 }}>
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          flexWrap:       "wrap",
          gap:            16,
          marginBottom:   16,
          background:     "var(--color-surface)",
          padding:        "16px 20px",
          borderRadius:   "var(--border-radius)",
          boxShadow:      "var(--shadow-sm)",
        }}
      >
        <div>
          <Space align="center" size="small">
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              Báo cáo trong ngày
            </Title>
            <Tag
              color="orange"
              icon={<CalendarOutlined />}
              style={{ borderRadius: 6, fontSize: 13, padding: "2px 8px" }}
            >
              {reportData.dateStr}
            </Tag>
          </Space>
          <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            Tổng hợp chỉ số và nhật ký hoạt động kinh doanh hàng ngày
          </Text>
        </div>

        <Segmented
          value={displayMode}
          onChange={setDisplayMode}
          size="large"
          options={[
            {
              label: (
                <div style={{ padding: "4px 8px" }}>
                  <DashboardOutlined style={{ marginRight: 6 }} />
                  <span>Dashboard</span>
                </div>
              ),
              value: "dashboard",
            },
            {
              label: (
                <div style={{ padding: "4px 8px" }}>
                  <TableOutlined style={{ marginRight: 6 }} />
                  <span>Report</span>
                </div>
              ),
              value: "report",
            },
          ]}
        />
      </div>

      {/* ─── BỘ LỌC NGÀY ──────────────────────────────────────────────────── */}
      <HomeFilter
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedEmployee="all"
        onEmployeeChange={() => {}}
        onReset={handleResetFilter}
      />

      {/* ─── NỘI DUNG ─────────────────────────────────────────────────────── */}
      <Spin spinning={loading} tip="Đang tải dữ liệu từ máy chủ...">
        {displayMode === "dashboard" ? (
          <HomeDashboard data={reportData} />
        ) : (
          <HomeReport data={reportData} />
        )}
      </Spin>
    </div>
  );
};

export default HomePage;
