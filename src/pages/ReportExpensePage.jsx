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
  DollarOutlined,
  SearchOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import ReportFilter from "../components/reports/common/ReportFilter";
import ExportToolbar from "../components/reports/common/ExportToolbar";
import SummaryFooter from "../components/reports/common/SummaryFooter";

import ExpenseSummaryCards from "../components/reports/expense/ExpenseSummaryCards";
import ExpenseCharts from "../components/reports/expense/ExpenseCharts";
import ExpenseReportTable from "../components/reports/expense/ExpenseReportTable";
import ExpenseDetailDrawer from "../components/reports/expense/ExpenseDetailDrawer";
import ExpenseCompareModal from "../components/reports/expense/ExpenseCompareModal";

import { getBranchDashboardStats } from "../api/dashboardApi";
import { useBranch } from "../context/BranchContext";

const { Title, Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0
  );

// ─── Map BE CashFlowList → Expense Bills ────────────────────────────────────
const mapCashFlowToExpenses = (cashFlowList = []) => {
  return cashFlowList
    .filter((cf) => cf.type === "out") // Chỉ lấy các khoản Chi
    .map((cf, idx) => {
      const timeVal = cf.time || "";
      const parsedTime = timeVal.length > 5 ? dayjs(timeVal) : null;
      const dateStr = parsedTime ? parsedTime.format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY");
      const timeStr = parsedTime ? parsedTime.format("HH:mm") : timeVal;
      const amount  = Math.abs(cf.amount || 0);

      return {
        id:          String(cf.id || idx + 1),
        expenseCode: `PC${String(Math.abs(cf.id || idx + 1)).padStart(6, "0")}`,
        date:        dateStr,
        time:        timeStr,
        category:    cf.category || "Chi phí khác",
        supplier:    "Hệ thống",
        createdBy:   "Hệ thống",
        amount,
        notes:       `Phiếu chi tiền ${cf.category ? cf.category.toLowerCase() : "hoạt động"} ghi nhận từ hệ thống.`,
        status:      "Completed",
      };
    });
};

/**
 * Page: ReportExpensePage
 * Báo cáo Chi phí chuyên sâu — kết nối với dữ liệu thật của BE
 * Đường dẫn: /reports/expense
 */
const ReportExpensePage = () => {
  const { currentBranchId } = useBranch();
  const [loading, setLoading]         = useState(true);
  const [presetTime, setPresetTime]   = useState("this_month");
  const [dateRange, setDateRange]     = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [searchText, setSearchText]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedCreatedBy, setSelectedCreatedBy] = useState("all");

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [drawerVisible, setDrawerVisible]     = useState(false);
  const [isFullscreen, setIsFullscreen]       = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  // ── Dữ liệu thật từ BE ───────────────────────────────────────────────────
  const [beStats, setBeStats]           = useState(null);
  const [allExpenses, setAllExpenses]   = useState([]);
  const [trendData, setTrendData]       = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);
  const [topExpenseData, setTopExpenseData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [start, end] = dateRange;
      const startStr = start.format("YYYY-MM-DD");
      const endStr   = end.format("YYYY-MM-DD");

      const today = dayjs().startOf("day");
      const isToday = start.isSame(today, "day") && end.isSame(today, "day");

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
      const range = isToday ? "today" : (presetToRange[presetTime] || "custom");

      const res = await getBranchDashboardStats(range, startStr, endStr, currentBranchId);

      if (res?.data) {
        const data = res.data;
        setBeStats(data);
        setTotalRevenue(data.revenue || 0);

        // Map danh sách chi phí
        const expenses = mapCashFlowToExpenses(data.cashFlowList || []);
        setAllExpenses(expenses);

        // Map trend data
        if (data.dailyStats && data.dailyStats.length > 0) {
          setTrendData(
            data.dailyStats.map((s) => ({
              date:    s.date,
              expense: s.expense || 0,
            }))
          );
        } else {
          setTrendData([]);
        }

        // Map breakdown data (Theo nhóm danh mục)
        const categoriesMap = {};
        expenses.forEach((item) => {
          categoriesMap[item.category] = (categoriesMap[item.category] || 0) + item.amount;
        });
        const breakdown = Object.keys(categoriesMap).map((catName) => ({
          name:  catName,
          value: categoriesMap[catName],
        }));
        setBreakdownData(breakdown);

        // Map top expenses
        const sorted = [...expenses]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
          .map((item) => ({
            name: item.notes || item.category,
            amount: item.amount,
          }));
        setTopExpenseData(sorted);
      }
    } catch (err) {
      console.error("[ReportExpensePage] API error:", err);
      message.warning("Không thể tải dữ liệu chi phí. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, presetTime, currentBranchId]);

  useEffect(() => {
    fetchReportData();
  }, [currentBranchId, fetchReportData]);

  const handlePresetChange = (val) => {
    setPresetTime(val);
  };

  const handleResetFilters = () => {
    setPresetTime("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    setSearchText("");
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedCreatedBy("all");
  };

  // ── Client-side filtering ───────────────────────────────────────────────
  const filteredData = allExpenses.filter((item) => {
    const matchSearch =
      !searchText ||
      item.expenseCode.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category.toLowerCase().includes(searchText.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchText.toLowerCase());

    const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchSupplier = selectedSupplier === "all" || item.supplier === selectedSupplier;
    const matchCreatedBy = selectedCreatedBy === "all" || item.createdBy === selectedCreatedBy;

    return matchSearch && matchCategory && matchSupplier && matchCreatedBy;
  });

  // ── Tính toán số liệu tổng hợp ─────────────────────────────────────────
  const totalExpense = beStats?.expenses || 0;
  const avgExpense   = filteredData.length ? Math.round(totalExpense / filteredData.length) : 0;

  const daysInRange = Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
  const avgPerDay   = Math.round((beStats?.revenue || 0) / daysInRange);

  const dailyList = beStats?.dailyStats || [];
  const revenueValues = dailyList.map((d) => d.revenue || 0);
  const highestVal = revenueValues.length ? Math.max(...revenueValues) : (beStats?.revenue || 0);
  const lowestVal  = revenueValues.length ? Math.min(...revenueValues) : 0;

  // Lấy các option động cho category filter
  const categoryOptions = [
    { label: "Tất cả loại chi phí", value: "all" },
    ...breakdownData.map((b) => ({ label: b.name, value: b.name })),
  ];

  const columnDefs = [
    { title: "Mã Phiếu Chi", field: "expenseCode" },
    { title: "Ngày",         field: "date" },
    { title: "Giờ",         field: "time" },
    { title: "Loại Chi Phí", field: "category" },
    { title: "Nhà Cung Cấp", field: "supplier" },
    { title: "Người Tạo",    field: "createdBy" },
    { title: "Giá Trị Chi",  field: (r) => `-${formatVND(r.amount)}`, align: "right" },
    { title: "Ghi chú",      field: "notes" },
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
        <Breadcrumb.Item style={{ fontWeight: 600, color: "#ef4444" }}>
          <DollarOutlined /> Báo cáo Chi phí
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
            Báo Cáo Chi Phí Vận Hành & Đầu Vào
          </Title>
          <Text type="secondary">
            Theo dõi, phân tích toàn bộ các khoản chi mua hàng, lương thưởng, mặt bằng & điện nước
          </Text>
        </div>

        <ExportToolbar
          reportTitle="Bao_Cao_Chi_Phi"
          columnDefs={columnDefs}
          data={filteredData}
          summaryRow={[
            "Tổng cộng", "-", "-", "-", "-", "-",
            `-${formatVND(totalExpense)}`, "-",
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
          <ExpenseSummaryCards
            data={{
              totalExpense,
              avgExpense,
              avgExpensePerDay: avgPerDay,
              growthPct: 0,
              largestExpense: highestVal,
            }}
            onOpenCompare={() => setCompareModalVisible(true)}
          />

          {/* 2. Expense Charts */}
          <ExpenseCharts
            trendData={trendData}
            breakdownData={breakdownData}
            topExpenseData={topExpenseData}
          />

          {/* 3. Expense Report Table */}
          <div
            style={{
              background: "#ffffff",
              padding: 18,
              borderRadius: 10,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {/* Hàng 1: Tiêu đề + Khung tìm kiếm */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 12,
                gap: 12,
              }}
            >
              <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                Danh Sách Chứng Từ & Phiếu Chi Chi Tiết ({filteredData.length} chứng từ)
              </Title>

              <Input
                placeholder="Tìm mã phiếu chi, nhà cung cấp, ghi chú..."
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300, borderRadius: 6 }}
                allowClear
              />
            </div>

            {/* Hàng 2: Các bộ lọc */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
                gap: 8,
              }}
            >
              <Space wrap size="small">
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: 180 }}
                  options={categoryOptions}
                />

                <Tooltip title="Làm mới dữ liệu phiếu chi">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchReportData}
                    style={{ borderRadius: 6 }}
                  />
                </Tooltip>

                <Tooltip title="Xóa tất cả bộ lọc phiếu chi">
                  <Button onClick={handleResetFilters} style={{ borderRadius: 6 }}>
                    Đặt lại
                  </Button>
                </Tooltip>

                <ExportToolbar
                  reportTitle="Bao_Cao_Chi_Phi_Chi_Tiet"
                  columnDefs={columnDefs}
                  data={filteredData}
                  summaryRow={[
                    "Tổng cộng", "-", "-", "-", "-", "-",
                    `-${formatVND(totalExpense)}`, "-",
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
              <Empty description="Không có khoản chi phí nào ghi nhận trong kỳ được chọn" />
            ) : (
              <ExpenseReportTable
                data={filteredData}
                loading={loading}
                onSelectExpense={(exp) => {
                  setSelectedExpense(exp);
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
                  Danh Sách Chứng Từ & Phiếu Chi Chi Tiết ({filteredData.length} chứng từ)
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
            <ExpenseReportTable
              data={filteredData}
              loading={loading}
              onSelectExpense={(exp) => {
                setSelectedExpense(exp);
                setDrawerVisible(true);
              }}
            />
          </Modal>

          {/* 4. Footer ERP Summary */}
          <SummaryFooter
            totalRevenue={totalRevenue}
            totalExpense={totalExpense}
            netProfit={totalRevenue - totalExpense}
            avgPerDay={avgPerDay}
            highestVal={highestVal}
            lowestVal={lowestVal}
            variance={0}
          />
        </>
      )}

      {/* Expense Detail Drawer */}
      <ExpenseDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        expenseData={selectedExpense}
      />

      {/* Expense Compare Modal */}
      <ExpenseCompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
      />
    </div>
  );
};

export default ReportExpensePage;
