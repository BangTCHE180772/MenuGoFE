import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  Typography,
  Skeleton,
  Empty,
  Select,
  Col,
  Input,
  Button,
  Tooltip,
  Space,
  Modal,
  message,
} from "antd";
import {
  HomeOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  SearchOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import ReportFilter from "../components/reports/common/ReportFilter";
import ExportToolbar from "../components/reports/common/ExportToolbar";
import SummaryFooter from "../components/reports/common/SummaryFooter";

import RevenueSummaryCards from "../components/reports/revenue/RevenueSummaryCards";
import RevenueCharts from "../components/reports/revenue/RevenueCharts";
import RevenueReportTable from "../components/reports/revenue/RevenueReportTable";
import BillDetailDrawer from "../components/reports/revenue/BillDetailDrawer";
import RevenueCompareModal from "../components/reports/revenue/RevenueCompareModal";

import { getBranchDashboardStats } from "../api/dashboardApi";

const { Title, Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

// ─── Map BE CashFlowList → Revenue bills table ─────────────────────────────
// BE cashFlowList: [{ id, time:"yyyy-MM-dd HH:mm", type:"in"|"out", category, amount }]
// RevenueReportTable expects: { id, billCode, date, time, customer, tableName, cashier,
//   paymentMethod, dishTotal, surcharge, discount, vat, total, status }
const mapCashFlowToBills = (cashFlowList = []) => {
  return cashFlowList
    .filter((cf) => cf.type === "in") // chỉ lấy Thu (Payment thành công)
    .map((cf, idx) => {
      const timeVal = cf.time || "";
      const parsedTime = timeVal.length > 5 ? dayjs(timeVal) : null;
      const dateStr = parsedTime ? parsedTime.format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY");
      const timeStr = parsedTime ? parsedTime.format("HH:mm") : timeVal;
      const amount  = Math.abs(cf.amount || 0);

      return {
        id:            String(cf.id || idx + 1),
        billCode:      `HD${String(cf.id || idx + 1).padStart(6, "0")}`,
        date:          dateStr,
        time:          timeStr,
        customer:      "Khách lẻ",
        tableName:     "—",
        cashier:       cf.category === "Thanh toán hóa đơn" ? "Hệ thống" : cf.category,
        paymentMethod: "Hệ thống",   // BE Payment không lưu method riêng trong cashFlow
        dishTotal:     amount,
        surcharge:     0,
        discount:      0,
        vat:           0,
        total:         amount,
        status:        "Completed",
        _raw:          cf,           // giữ nguyên để debug
      };
    });
};

/**
 * Page: ReportRevenuePage
 * Báo cáo Doanh thu — kết nối với BE qua GET /api/Dashboard/branch-stats
 * Đường dẫn: /reports/revenue
 *
 * Nguồn dữ liệu từ BE:
 *  - KPI cards    ← beStats.revenue, completedBills, avgOrderValue
 *  - Trend chart  ← beStats.dailyStats [{ date, revenue, expense, profit }]
 *  - Pie chart    ← beStats.paymentMethods [{ name, value }]
 *  - Bills table  ← beStats.cashFlowList lọc type=="in"
 *  - SummaryFooter← beStats.revenue, expenses, profit
 */
const ReportRevenuePage = () => {
  const [loading, setLoading]         = useState(true);
  const [presetTime, setPresetTime]   = useState("this_month");
  const [dateRange, setDateRange]     = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [searchText, setSearchText]           = useState("");
  const [selectedMethod, setSelectedMethod]   = useState("all");
  const [isFullscreen, setIsFullscreen]       = useState(false);
  const [selectedBill, setSelectedBill]       = useState(null);
  const [drawerVisible, setDrawerVisible]     = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  // ── Raw data từ BE ──────────────────────────────────────────────────────
  const [beStats, setBeStats]           = useState(null);
  const [allBills, setAllBills]         = useState([]);   // toàn bộ bills từ BE
  const [trendData, setTrendData]       = useState([]);   // dailyStats
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);

  // ── Fetch từ BE ─────────────────────────────────────────────────────────
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [start, end] = dateRange;
      const startStr = start.format("YYYY-MM-DD");
      const endStr   = end.format("YYYY-MM-DD");

      // Xác định range param
      const today = dayjs().startOf("day");
      const isToday = start.isSame(today, "day") && end.isSame(today, "day");

      // Map preset key (snake_case từ ReportFilter) → range BE
      const presetToRange = {
        today:       "today",
        yesterday:   "yesterday",
        this_week:   "custom",
        last_week:   "custom",
        this_month:  "thisMonth",
        last_month:  "lastMonth",
        this_year:   "custom",
        custom:      "custom",
      };
      let range = isToday ? "today" : (presetToRange[presetTime] || "custom");

      const res = await getBranchDashboardStats(range, startStr, endStr, null);

      if (res?.data) {
        const data = res.data;
        setBeStats(data);

        // Bills table
        const bills = mapCashFlowToBills(data.cashFlowList || []);
        setAllBills(bills);

        // Trend chart: dailyStats → { date, revenue }
        if (data.dailyStats && data.dailyStats.length > 0) {
          setTrendData(
            data.dailyStats.map((s) => ({
              date:    s.date,
              revenue: s.revenue || 0,
              expense: s.expense || 0,
              profit:  s.profit  || 0,
            }))
          );
        } else {
          setTrendData([]);
        }

        // Pie chart: paymentMethods
        setPaymentMethodData(
          (data.paymentMethods || []).map((m) => ({
            name:  m.name,
            value: m.value || 0,
          }))
        );

        setTotalExpense(data.expenses || 0);
      }
    } catch (err) {
      console.error("[ReportRevenuePage] API error:", err);
      message.warning("Không thể tải dữ liệu doanh thu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, presetTime]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // ── Khi preset thay đổi → ReportFilter tự cập nhật dateRange (đã xử lý trong nó)
  // handlePresetChange chỉ cần nhận value và cập nhật state tương ứng
  const handlePresetChange = (val) => {
    setPresetTime(val);
    // ReportFilter tự gọi onDateRangeChange nên không cần set dateRange ở đây
  };

  const handleResetFilters = () => {
    setPresetTime("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    setSearchText("");
    setSelectedMethod("all");
  };

  // ── Client-side filter trên bảng ─────────────────────────────────────────
  const filteredData = allBills.filter((item) => {
    const matchSearch =
      !searchText ||
      item.billCode.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchText.toLowerCase()) ||
      item.cashier.toLowerCase().includes(searchText.toLowerCase());

    const matchMethod =
      selectedMethod === "all" || item.paymentMethod === selectedMethod;

    return matchSearch && matchMethod;
  });

  // ── Summary tính từ filteredData ─────────────────────────────────────────
  const totalRevenue   = beStats?.revenue || 0;
  const totalOrders    = beStats?.completedBills || 0;
  const avgOrderValue  = beStats?.avgOrderValue || 0;
  const profit         = beStats?.profit || 0;

  const daysInRange = Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
  const avgPerDay   = Math.round(totalRevenue / daysInRange);

  const dailyList = beStats?.dailyStats || [];
  const revenueValues = dailyList.map((d) => d.revenue || 0);
  const highestVal = revenueValues.length ? Math.max(...revenueValues) : totalRevenue;
  const lowestVal  = revenueValues.length ? Math.min(...revenueValues) : 0;

  // Danh sách PTTT từ BE (dùng cho dropdown filter)
  const methodOptions = [
    { label: "Tất cả phương thức", value: "all" },
    ...paymentMethodData.map((m) => ({ label: m.name, value: m.name })),
  ];

  const columnDefs = [
    { title: "Mã Bill",    field: "billCode" },
    { title: "Ngày",       field: "date" },
    { title: "Thời gian",  field: "time" },
    { title: "Khách hàng", field: "customer" },
    { title: "Thu ngân",   field: "cashier" },
    { title: "Thanh toán", field: "paymentMethod" },
    { title: "Tiền món",   field: (r) => formatVND(r.dishTotal), align: "right" },
    { title: "Phụ thu",    field: (r) => formatVND(r.surcharge), align: "right" },
    { title: "Giảm giá",   field: (r) => formatVND(r.discount),  align: "right" },
    { title: "VAT",        field: (r) => formatVND(r.vat),       align: "right" },
    { title: "Tổng tiền",  field: (r) => formatVND(r.total),     align: "right" },
  ];

  return (
    <div style={{ padding: "16px 24px", minHeight: "100vh", background: "#f8fafc" }}>
      {/* ── BREADCRUMB ──────────────────────────────────────────────────────── */}
      <Breadcrumb style={{ marginBottom: 12 }}>
        <Breadcrumb.Item href="/home">
          <HomeOutlined /> Trang chủ
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <BarChartOutlined /> Báo cáo
        </Breadcrumb.Item>
        <Breadcrumb.Item style={{ fontWeight: 600, color: "var(--color-primary)" }}>
          <ShoppingOutlined /> Báo cáo Doanh thu
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* ── HEADER TITLE & EXPORT ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
            Báo Cáo Doanh Thu Bán Hàng
          </Title>
          <Text type="secondary">
            Tra cứu, phân tích doanh thu chi tiết theo từng hóa đơn và phương thức thanh toán
          </Text>
        </div>

        <ExportToolbar
          reportTitle="Bao_Cao_Doanh_Thu"
          columnDefs={columnDefs}
          data={filteredData}
          summaryRow={[
            "Tổng cộng", "-", "-", "-", "-", "-", "-", "-", "-", "-",
            formatVND(totalRevenue),
          ]}
        />
      </div>

      {/* ── REPORT FILTER BAR ───────────────────────────────────────────────── */}
      <ReportFilter
        presetTime={presetTime}
        onPresetChange={handlePresetChange}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={fetchReportData}
        onResetFilters={handleResetFilters}
        loading={loading}
      />

      {/* ── LOADING SKELETON OR CONTENT ─────────────────────────────────────── */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          {/* 1. Summary KPI Cards */}
          <RevenueSummaryCards
            data={{
              totalRevenue,
              totalOrders,
              avgOrderValue,
              avgRevenuePerDay: avgPerDay,
              growthPct: 0,   // BE chưa có so sánh kỳ trước
            }}
            onOpenCompare={() => setCompareModalVisible(true)}
          />

          {/* 2. Revenue Charts (Trend + Pie PTTT) */}
          <RevenueCharts
            trendData={trendData}
            paymentMethodData={paymentMethodData}
          />

          {/* 3. Bills Table */}
          <div
            style={{
              background: "#ffffff",
              padding: 18,
              borderRadius: 10,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
                gap: 12,
              }}
            >
              <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                Nhật Ký Hóa Đơn Doanh Thu Bán Hàng Chi Tiết ({filteredData.length} hóa đơn)
              </Title>

              <Space wrap size="small">
                <Input
                  placeholder="Tìm kiếm mã bill, khách hàng, thu ngân..."
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 240, borderRadius: 6 }}
                  allowClear
                />

                <Select
                  value={selectedMethod}
                  onChange={setSelectedMethod}
                  style={{ width: 180 }}
                  options={methodOptions}
                />

                <Tooltip title="Làm mới dữ liệu từ máy chủ">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchReportData}
                    style={{ borderRadius: 6 }}
                  />
                </Tooltip>

                <Tooltip title="Xóa tất cả bộ lọc">
                  <Button onClick={handleResetFilters} style={{ borderRadius: 6 }}>
                    Đặt lại
                  </Button>
                </Tooltip>

                <ExportToolbar
                  reportTitle="Bao_Cao_Doanh_Thu_Chi_Tiet"
                  columnDefs={columnDefs}
                  data={filteredData}
                  summaryRow={[
                    "Tổng cộng", "-", "-", "-", "-", "-", "-", "-", "-", "-",
                    formatVND(totalRevenue),
                  ]}
                />

                <Tooltip title="Phóng to toàn màn hình">
                  <Button
                    icon={<FullscreenOutlined />}
                    onClick={() => setIsFullscreen(true)}
                    style={{ borderRadius: 6 }}
                  />
                </Tooltip>
              </Space>
            </div>

            {filteredData.length === 0 ? (
              <Empty description="Không có hóa đơn nào đã thanh toán trong kỳ được chọn" />
            ) : (
              <RevenueReportTable
                data={filteredData}
                loading={loading}
                onSelectBill={(bill) => {
                  setSelectedBill(bill);
                  setDrawerVisible(true);
                }}
              />
            )}
          </div>

          {/* Fullscreen Modal */}
          <Modal
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingRight: 24,
                }}
              >
                <span style={{ fontWeight: 800, fontSize: 16 }}>
                  Nhật Ký Hóa Đơn Doanh Thu ({filteredData.length} hóa đơn)
                </span>
                <Button
                  icon={<FullscreenExitOutlined />}
                  onClick={() => setIsFullscreen(false)}
                  style={{ borderRadius: 6 }}
                >
                  Thu nhỏ
                </Button>
              </div>
            }
            open={isFullscreen}
            onCancel={() => setIsFullscreen(false)}
            footer={null}
            width="96vw"
            style={{ top: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <RevenueReportTable
              data={filteredData}
              loading={loading}
              onSelectBill={(bill) => {
                setSelectedBill(bill);
                setDrawerVisible(true);
              }}
            />
          </Modal>

          {/* 4. Footer ERP Summary */}
          <SummaryFooter
            totalRevenue={totalRevenue}
            totalExpense={totalExpense}
            netProfit={profit}
            avgPerDay={avgPerDay}
            highestVal={highestVal}
            lowestVal={lowestVal}
            variance={0}
          />
        </>
      )}

      {/* Bill Detail Drawer */}
      <BillDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        billData={selectedBill}
      />

      {/* So Sánh Modal */}
      <RevenueCompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
      />
    </div>
  );
};

export default ReportRevenuePage;
