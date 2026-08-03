import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  Typography,
  Skeleton,
  Empty,
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
  RiseOutlined,
  SearchOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import ReportFilter from "../components/reports/common/ReportFilter";
import ExportToolbar from "../components/reports/common/ExportToolbar";
import SummaryFooter from "../components/reports/common/SummaryFooter";

import ProfitSummaryCards from "../components/reports/profit/ProfitSummaryCards";
import ProfitCharts from "../components/reports/profit/ProfitCharts";
import ProfitReportTable from "../components/reports/profit/ProfitReportTable";
import ProfitCompareModal from "../components/reports/profit/ProfitCompareModal";

import { getBranchDashboardStats } from "../api/dashboardApi";

const { Title, Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

/**
 * Page: ProfitReportPage
 * Báo cáo Lợi nhuận chuyên sâu — kết nối với dữ liệu thật từ Backend
 * Đường dẫn: /reports/profit
 */
const ReportProfitPage = () => {
  const [loading, setLoading]         = useState(true);
  const [presetTime, setPresetTime]   = useState("this_month");
  const [dateRange, setDateRange]     = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [searchText, setSearchText]   = useState("");
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [isFullscreen, setIsFullscreen]               = useState(false);

  // ── Dữ liệu thật từ BE ───────────────────────────────────────────────────
  const [beStats, setBeStats]                 = useState(null);
  const [tableData, setTableData]             = useState([]);
  const [trendData, setTrendData]             = useState([]);
  const [waterfallData, setWaterfallData]     = useState([]);
  const [distributionData, setDistributionData] = useState([]);

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

      const res = await getBranchDashboardStats(range, startStr, endStr, null);

      if (res?.data) {
        const data = res.data;
        setBeStats(data);

        // 1. Phân tích theo mốc thời gian (bảng chi tiết): Lấy từ dailyStats hoặc hourSlots
        let list = [];
        if (data.dailyStats && data.dailyStats.length > 0) {
          list = data.dailyStats.map((s, idx) => {
            const rev = s.revenue || 0;
            const exp = s.expense || 0;
            const prof = s.profit || 0;
            return {
              id:           `PFT-${idx + 1}`,
              timeLabel:    s.date || "N/A",
              revenue:      rev,
              expense:      exp,
              profit:       prof,
              marginPct:    rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0,
              costRatioPct: rev > 0 ? Number(((exp / rev) * 100).toFixed(1)) : 0,
            };
          });
        } else if (data.hourSlots && data.hourSlots.length > 0) {
          const totalRev = data.revenue || 0;
          const totalExp = data.expenses || 0;
          const expRatio = totalRev > 0 ? totalExp / totalRev : 0;

          list = data.hourSlots.map((s, idx) => {
            const rev = s.value || 0;
            const exp = Math.round(rev * expRatio);
            const prof = rev - exp;
            return {
              id:           `PFT-${idx + 1}`,
              timeLabel:    s.slot || "N/A",
              revenue:      rev,
              expense:      exp,
              profit:       prof,
              marginPct:    rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0,
              costRatioPct: rev > 0 ? Number(((exp / rev) * 100).toFixed(1)) : 0,
            };
          });
        }
        setTableData(list);

        // 2. Trend Data cho ProfitCharts
        setTrendData(
          list.map((item) => ({
            date:    item.timeLabel,
            revenue: item.revenue,
            expense: item.expense,
            profit:  item.profit,
          }))
        );

        // 3. Waterfall Data cho Cơ cấu hình thành lợi nhuận
        const flowList = data.cashFlowList || [];
        const costCategories = {};
        flowList
          .filter((cf) => cf.type === "out")
          .forEach((cf) => {
            costCategories[cf.category || "Chi phí khác"] =
              (costCategories[cf.category || "Chi phí khác"] || 0) + Math.abs(cf.amount || 0);
          });

        const waterfall = [
          { name: "Tổng Doanh Thu", amount: data.revenue || 0, isTotal: true },
          ...Object.keys(costCategories).map((cat) => ({
            name:   cat,
            amount: -costCategories[cat],
            isCost: true,
          })),
          { name: "Lợi Nhuận Ròng", amount: data.profit || 0, isProfit: true },
        ];
        setWaterfallData(waterfall);

        // 4. Phân bổ lợi nhuận (Distribution Histogram)
        // Chia mốc lợi nhuận theo các nhóm
        const ranges = [
          { range: "< 1M",      min: -Infinity, max: 1000000,   count: 0 },
          { range: "1M - 5M",   min: 1000000,   max: 5000000,   count: 0 },
          { range: "5M - 10M",  min: 5000000,   max: 10000000,  count: 0 },
          { range: "10M - 50M", min: 10000000,  max: 50000000,  count: 0 },
          { range: "> 50M",     min: 50000000,  max: Infinity,  count: 0 },
        ];
        list.forEach((item) => {
          const prof = item.profit;
          const match = ranges.find((r) => prof >= r.min && prof < r.max);
          if (match) match.count += 1;
        });
        setDistributionData(ranges.filter((r) => r.count > 0));
      }
    } catch (err) {
      console.error("[ReportProfitPage] API error:", err);
      message.warning("Không thể tải dữ liệu lợi nhuận. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, presetTime]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handlePresetChange = (val) => {
    setPresetTime(val);
  };

  const handleResetFilters = () => {
    setPresetTime("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    setSearchText("");
  };

  // Client-side filtering
  const filteredData = tableData.filter((item) => {
    return !searchText || item.timeLabel.toLowerCase().includes(searchText.toLowerCase());
  });

  // Calculate Summary Totals
  const totalRevenue = beStats?.revenue || 0;
  const totalExpense = beStats?.expenses || 0;
  const netProfit    = beStats?.profit || 0;

  const daysInRange = Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
  const avgPerDay   = Math.round(netProfit / daysInRange);

  const highestVal = filteredData.reduce((max, c) => Math.max(max, c.profit), 0);
  const lowestVal  = filteredData.length
    ? filteredData.reduce((min, c) => Math.min(min, c.profit), filteredData[0].profit)
    : 0;

  // Điểm hòa vốn ước tính
  const breakEvenTarget = 40000000; // mục tiêu điểm hòa vốn giả định
  const breakEvenPercent =
    breakEvenTarget > 0 ? Number(((totalRevenue / breakEvenTarget) * 100).toFixed(1)) : 0;

  const columnDefs = [
    { title: "Mốc Thời Gian", field: "timeLabel" },
    { title: "Doanh Thu", field: (r) => formatVND(r.revenue), align: "right" },
    { title: "Chi Phí",   field: (r) => `-${formatVND(r.expense)}`, align: "right" },
    { title: "Lợi Nhuận Ròng", field: (r) => `+${formatVND(r.profit)}`, align: "right" },
    { title: "Tỷ Suất Lợi Nhuận", field: (r) => `${r.marginPct}%`, align: "right" },
    { title: "Tỷ Lệ Chi Phí", field: (r) => `${r.costRatioPct}%`, align: "right" },
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
        <Breadcrumb.Item style={{ fontWeight: 600, color: "#10b981" }}>
          <RiseOutlined /> Báo cáo Lợi nhuận
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
            Báo Cáo Lợi Nhuận & Hiệu Quả Kinh Doanh
          </Title>
          <Text type="secondary">
            Phân tích tỷ suất lợi nhuận ròng, điểm hòa vốn và biến động tài chính theo chu kỳ thời gian
          </Text>
        </div>

        <ExportToolbar
          reportTitle="Bao_Cao_Loi_Nhuan"
          columnDefs={columnDefs}
          data={filteredData}
          summaryRow={[
            "Tổng cộng",
            formatVND(totalRevenue),
            `-${formatVND(totalExpense)}`,
            `+${formatVND(netProfit)}`,
            `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`,
            `${totalRevenue > 0 ? ((totalExpense / totalRevenue) * 100).toFixed(1) : 0}%`,
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
          <ProfitSummaryCards
            data={{
              profit:       netProfit,
              profitMargin: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0,
              costRatio:    totalRevenue > 0 ? Number(((totalExpense / totalRevenue) * 100).toFixed(1)) : 0,
              breakEvenPct: breakEvenPercent,
              growthPct:    0,
            }}
            onOpenCompare={() => setCompareModalVisible(true)}
          />

          {/* 2. Profit Charts */}
          <ProfitCharts
            trendData={trendData}
            waterfallData={waterfallData}
            distributionData={distributionData}
            breakEvenInfo={{
              target:  breakEvenTarget,
              current: totalRevenue,
              percent: breakEvenPercent,
            }}
          />

          {/* 3. Profit Report Table */}
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
                Bảng Phân Tích Lợi Nhuận Theo Mốc Thời Gian ({filteredData.length} dòng)
              </Title>

              <Space wrap size="small">
                <Input
                  placeholder="Tìm mốc thời gian..."
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 220, borderRadius: 6 }}
                  allowClear
                />

                <Tooltip title="Làm mới dữ liệu lợi nhuận">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchReportData}
                    style={{ borderRadius: 6 }}
                  />
                </Tooltip>

                <Tooltip title="Xóa bộ lọc tìm kiếm">
                  <Button onClick={handleResetFilters} style={{ borderRadius: 6 }}>
                    Đặt lại
                  </Button>
                </Tooltip>

                <ExportToolbar
                  reportTitle="Bao_Cao_Phan_Tich_Loi_Nhuan"
                  columnDefs={columnDefs}
                  data={filteredData}
                  summaryRow={[
                    "Tổng cộng",
                    formatVND(totalRevenue),
                    `-${formatVND(totalExpense)}`,
                    `+${formatVND(netProfit)}`,
                    `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`,
                    `${totalRevenue > 0 ? ((totalExpense / totalRevenue) * 100).toFixed(1) : 0}%`,
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
              <Empty description="Không có dữ liệu lợi nhuận nào trong kỳ được chọn" />
            ) : (
              <ProfitReportTable
                data={filteredData}
                loading={loading}
                presetTime={presetTime}
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
                  Bảng Phân Tích Lợi Nhuận Theo Mốc Thời Gian ({filteredData.length} dòng)
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
            <ProfitReportTable
              data={filteredData}
              loading={loading}
              presetTime={presetTime}
            />
          </Modal>

          {/* 4. Footer ERP Summary */}
          <SummaryFooter
            totalRevenue={totalRevenue}
            totalExpense={totalExpense}
            netProfit={netProfit}
            avgPerDay={avgPerDay}
            highestVal={highestVal}
            lowestVal={lowestVal}
            variance={0}
          />
        </>
      )}

      {/* So Sánh Modal */}
      <ProfitCompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
      />
    </div>
  );
};

export default ReportProfitPage;
