import React, { useState, useEffect } from "react";
import { Breadcrumb, Typography, Skeleton, Empty, Input, Button, Tooltip, Space, Modal } from "antd";
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

const { Title, Text } = Typography;

/**
 * Generator dữ liệu linh hoạt theo Mốc Thời Gian (Year -> 12 rows, Month -> 30 rows, Week -> 7 rows, Day -> 24 rows)
 */
const generateProfitReportData = (presetTime) => {
  let length = 30;
  let labelPrefix = "Ngày ";

  if (presetTime === "today" || presetTime === "yesterday") {
    length = 24;
    labelPrefix = "Giờ ";
  } else if (presetTime === "this_week" || presetTime === "last_week") {
    length = 7;
    labelPrefix = "Thứ ";
  } else if (presetTime === "this_year") {
    length = 12;
    labelPrefix = "Tháng ";
  }

  const list = Array.from({ length }, (_, i) => {
    let label = `${labelPrefix}${i + 1}`;
    if (labelPrefix === "Thứ ") {
      label = i === 6 ? "Chủ Nhật" : `Thứ ${i + 2}`;
    } else if (labelPrefix === "Giờ ") {
      label = `${String(i).padStart(2, "0")}:00`;
    }

    const revenue = Math.round((4000000 + Math.random() * 12000000) / 10000) * 10000;
    const expense = Math.round((revenue * (0.32 + Math.random() * 0.15)) / 10000) * 10000;
    const profit = revenue - expense;
    const marginPct = Number(((profit / (revenue || 1)) * 100).toFixed(1));
    const costRatioPct = Number(((expense / (revenue || 1)) * 100).toFixed(1));

    return {
      id: `PFT-${i + 1}`,
      timeLabel: label,
      revenue,
      expense,
      profit,
      marginPct,
      costRatioPct,
    };
  });

  return list;
};

/**
 * Page: ProfitReportPage
 * Báo cáo Lợi nhuận chuyên sâu cho quản lý / chủ nhà hàng.
 * Đường dẫn: /reports/profit
 */
const ReportProfitPage = () => {
  const [loading, setLoading] = useState(true);
  const [presetTime, setPresetTime] = useState("this_month");
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);
  const [searchText, setSearchText] = useState("");
  const [tableData, setTableData] = useState([]);

  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // TODO: API Fetch Profit Report Data (GET /api/v1/reports/profit)
  useEffect(() => {
    fetchReportData();
  }, [presetTime, dateRange]);

  const fetchReportData = () => {
    setLoading(true);
    // TODO: Replace with real API call e.g. axios.get('/api/v1/reports/profit', { params: { preset: presetTime, startDate, endDate } })
    setTimeout(() => {
      const generated = generateProfitReportData(presetTime);
      setTableData(generated);
      setLoading(false);
    }, 450);
  };

  const handleResetFilters = () => {
    setPresetTime("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    setSearchText("");
    fetchReportData();
  };

  // Client-side filtering
  const filteredData = tableData.filter((item) => {
    return !searchText || item.timeLabel.toLowerCase().includes(searchText.toLowerCase());
  });

  // Calculate Summary Totals
  const totalRevenue = filteredData.reduce((acc, c) => acc + c.revenue, 0);
  const totalExpense = filteredData.reduce((acc, c) => acc + c.expense, 0);
  const netProfit = totalRevenue - totalExpense;
  const avgPerDay = filteredData.length ? Math.round(netProfit / filteredData.length) : 0;
  const highestVal = filteredData.reduce((max, c) => Math.max(max, c.profit), 0);
  const lowestVal = filteredData.reduce((min, c) => Math.min(min, c.profit), filteredData[0]?.profit || 0);

  const columnDefs = [
    { title: "Mốc Thời Gian", field: "timeLabel" },
    { title: "Doanh Thu", field: (r) => `${r.revenue.toLocaleString()} đ`, align: "right" },
    { title: "Chi Phí", field: (r) => `-${r.expense.toLocaleString()} đ`, align: "right" },
    { title: "Lợi Nhuận Ròng", field: (r) => `+${r.profit.toLocaleString()} đ`, align: "right" },
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
            `${totalRevenue.toLocaleString()} đ`,
            `-${totalExpense.toLocaleString()} đ`,
            `+${netProfit.toLocaleString()} đ`,
            `${((netProfit / (totalRevenue || 1)) * 100).toFixed(1)}%`,
            `${((totalExpense / (totalRevenue || 1)) * 100).toFixed(1)}%`,
          ]}
        />
      </div>

      {/* ── REPORT FILTER BAR (Có nút Đặt lại) ───────────────────────────────── */}
      <ReportFilter
        presetTime={presetTime}
        onPresetChange={setPresetTime}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={fetchReportData}
        onResetFilters={handleResetFilters}
        loading={loading}
      />

      {/* ── LOADING SKELETON OR CONTENT ────────────────────────────────────── */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : filteredData.length === 0 ? (
        <Empty description="Không tìm thấy dữ liệu lợi nhuận nào phù hợp với bộ lọc" />
      ) : (
        <>
          {/* 1. Summary KPI Cards + Compare Button */}
          <ProfitSummaryCards
            data={{
              profit: netProfit,
              profitMargin: Number(((netProfit / (totalRevenue || 1)) * 100).toFixed(1)),
              costRatio: Number(((totalExpense / (totalRevenue || 1)) * 100).toFixed(1)),
              breakEvenPct: 129.3,
              growthPct: 24.8,
            }}
            onOpenCompare={() => setCompareModalVisible(true)}
          />

          {/* 2. Profit Charts */}
          <ProfitCharts
            breakEvenInfo={{
              target: 220000000,
              current: totalRevenue,
              percent: Number(((totalRevenue / 220000000) * 100).toFixed(1)),
            }}
          />

          {/* 3. Report Data Table với Thanh Toolbar Tích Hợp Có Nút Xuất/In, Phóng to */}
          <div style={{ background: "#ffffff", padding: 18, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
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

              {/* Toolbar Tích Hợp: Tìm kiếm, Làm mới, Đặt lại, Xuất/In, Phóng to */}
              <Space wrap size="small">
                <Input
                  placeholder="Tìm mốc thời gian (ngày, giờ...)"
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 220, borderRadius: 6 }}
                  allowClear
                />

                <Tooltip title="Làm mới dữ liệu lợi nhuận">
                  <Button icon={<ReloadOutlined />} onClick={fetchReportData} style={{ borderRadius: 6 }} />
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
                    `${totalRevenue.toLocaleString()} đ`,
                    `-${totalExpense.toLocaleString()} đ`,
                    `+${netProfit.toLocaleString()} đ`,
                    `${((netProfit / (totalRevenue || 1)) * 100).toFixed(1)}%`,
                    `${((totalExpense / (totalRevenue || 1)) * 100).toFixed(1)}%`,
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

            <ProfitReportTable
              data={filteredData}
              loading={loading}
              presetTime={presetTime}
            />
          </div>

          {/* Fullscreen Table Modal */}
          <Modal
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}>
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
            variance={24.8}
          />
        </>
      )}

      {/* So Sánh Hiệu Quả Lợi Nhuận & Kinh Doanh Modal */}
      <ProfitCompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
      />
    </div>
  );
};

export default ReportProfitPage;
