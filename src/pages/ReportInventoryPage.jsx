import React, { useState, useEffect, useCallback } from "react";
import { Breadcrumb, Typography, Skeleton, Empty, Button, message } from "antd";
import {
  HomeOutlined,
  BarChartOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import ReportFilter from "../components/reports/common/ReportFilter";
import ExportToolbar from "../components/reports/common/ExportToolbar";
import SummaryFooter from "../components/reports/common/SummaryFooter";

import InventoryOverviewCards from "../components/reports/inventory/InventoryOverviewCards";
import InventoryStatusChart from "../components/reports/inventory/InventoryStatusChart";
import ConsumptionVarianceTable from "../components/reports/inventory/ConsumptionVarianceTable";
import TopConsumptionVarianceChart from "../components/reports/inventory/TopConsumptionVarianceChart";
import ShelfLifeMonitoring from "../components/reports/inventory/ShelfLifeMonitoring";
import InventoryDetailTable from "../components/reports/inventory/InventoryDetailTable";
import OperationalAlerts from "../components/reports/inventory/OperationalAlerts";

import {
  MOCK_INVENTORY_STATS,
  MOCK_STATUS_CHART_DATA,
  MOCK_CONSUMPTION_ITEMS,
  TOP_CONSUMPTION_VARIANCE_DATA,
  MOCK_EXPIRING_INGREDIENTS,
  MOCK_INSPECTION_NEEDED_INGREDIENTS,
  MOCK_DETAIL_LEDGER_ITEMS,
  MOCK_OPERATIONAL_ALERTS,
} from "../components/reports/inventory/InventoryReportData";

const { Title, Text } = Typography;

/**
 * Page: InventoryReportPage
 * Báo cáo Nguyên liệu & Tiêu thụ Kho Chuyên sâu.
 * Đồng bộ 100% chuẩn format giao diện với RevenueReportPage (/reports/revenue).
 */
const ReportInventoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [presetTime, setPresetTime] = useState("this_month");
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Datasets
  const [statsData, setStatsData] = useState(MOCK_INVENTORY_STATS);
  const [statusChartData, setStatusChartData] = useState(MOCK_STATUS_CHART_DATA);
  const [consumptionItems, setConsumptionItems] = useState(MOCK_CONSUMPTION_ITEMS);
  const [topVarianceData, setTopVarianceData] = useState(TOP_CONSUMPTION_VARIANCE_DATA);
  const [expiringItems, setExpiringItems] = useState(MOCK_EXPIRING_INGREDIENTS);
  const [inspectionItems, setInspectionItems] = useState(MOCK_INSPECTION_NEEDED_INGREDIENTS);
  const [detailLedgerItems, setDetailLedgerItems] = useState(MOCK_DETAIL_LEDGER_ITEMS);
  const [alerts, setAlerts] = useState(MOCK_OPERATIONAL_ALERTS);

  const fetchReportData = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setConsumptionItems(MOCK_CONSUMPTION_ITEMS);
      setTopVarianceData(TOP_CONSUMPTION_VARIANCE_DATA);
      setStatsData(MOCK_INVENTORY_STATS);
      setLoading(false);
    }, 400);
  }, [presetTime, dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleResetFilters = () => {
    setPresetTime("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    message.info("Đã đặt lại thời gian về Tháng này.");
    fetchReportData();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Lỗi mở toàn màn hình:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const columnDefs = [
    { title: "Mã NL", field: "id" },
    { title: "Tên nguyên liệu", field: "name" },
    { title: "Nhóm", field: "category" },
    { title: "Đơn vị", field: "unit" },
    { title: "Đã nhập", field: (r) => `${r.importedQty} ${r.unit}`, align: "right" },
    { title: "Tồn kho", field: (r) => `${r.stockQty} ${r.unit}`, align: "right" },
    { title: "Đã tiêu thụ", field: (r) => `${r.consumedQty} ${r.unit}`, align: "right" },
    { title: "Tiêu hao vượt", field: (r) => `${r.excessQty} ${r.unit}`, align: "right" },
    { title: "Sai số (%)", field: (r) => `${r.variancePercent}%`, align: "center" },
  ];

  const totalImportedValue = statsData.totalValue || 0;

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
          <InboxOutlined /> Báo cáo Nguyên liệu
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
            Báo Cáo Nguyên Liệu & Tiêu Thụ Kho
          </Title>
          <Text type="secondary">
            Giám sát tồn kho, hao hụt nguyên liệu khi chế biến, hạn sử dụng & giao dịch kho theo thời gian thực
          </Text>
        </div>

        <ExportToolbar
          reportTitle="Bao_Cao_Nguyen_Lieu"
          columnDefs={columnDefs}
          data={consumptionItems}
          summaryRow={[
            "Tổng cộng",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
          ]}
        />
      </div>

      {/* ── REPORT FILTER BAR (Chuẩn theo RevenueReportPage) ─────────────────── */}
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
      ) : consumptionItems.length === 0 ? (
        <Empty description="Không tìm thấy dữ liệu nguyên liệu nào phù hợp với bộ lọc hiện tại." />
      ) : (
        <>
          {/* SECTION 1: INVENTORY OVERVIEW (KPI CARDS) */}
          <InventoryOverviewCards stats={statsData} />

          {/* SECTION 2: INVENTORY STATUS (HORIZONTAL STACKED BAR CHART) */}
          <InventoryStatusChart data={statusChartData} />

          {/* SECTION 3: CONSUMPTION REPORT (MAIN TABLE) */}
          <ConsumptionVarianceTable
            items={consumptionItems}
            varianceThreshold={statsData.varianceThresholdPercent}
            onRefresh={fetchReportData}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          {/* SECTION 4: TOP CONSUMPTION VARIANCE (BAR CHART) */}
          <TopConsumptionVarianceChart data={topVarianceData} />

          {/* SECTION 5: SHELF-LIFE MONITORING (2 CARDS) */}
          <ShelfLifeMonitoring
            expiringItems={expiringItems}
            inspectionItems={inspectionItems}
          />

          {/* SECTION 6: INVENTORY DETAIL REPORT (LEDGER TABLE) */}
          <InventoryDetailTable
            items={detailLedgerItems}
            onRefresh={fetchReportData}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          {/* SECTION 7: OPERATIONAL ALERTS (ALERT CARDS) */}
          <OperationalAlerts alerts={alerts} />

          {/* ── SUMMARY FOOTER ───────────────────────────────────────────── */}
          <SummaryFooter
            totalRevenue={totalImportedValue}
            totalExpense={Math.round(totalImportedValue * 0.4)}
            netProfit={Math.round(totalImportedValue * 0.6)}
            avgPerDay={Math.round(totalImportedValue / 30)}
            highestVal={totalImportedValue}
            lowestVal={0}
          />
        </>
      )}
    </div>
  );
};

export default ReportInventoryPage;
