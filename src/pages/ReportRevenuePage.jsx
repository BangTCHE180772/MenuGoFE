import React, { useState, useEffect } from "react";
import { Breadcrumb, Typography, Skeleton, Empty, Select, Col, Input, Button, Tooltip, Space, Modal } from "antd";
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

const { Title, Text } = Typography;

// Mock Generator cho Báo cáo Doanh thu
const MOCK_REVENUE_BILLS = Array.from({ length: 45 }, (_, i) => {
  const billNum = String(1001 + i).padStart(4, "0");
  const dishTotal = Math.round((150000 + Math.random() * 850000) / 1000) * 1000;
  const surcharge = i % 3 === 0 ? 20000 : 0;
  const discount = i % 4 === 0 ? 30000 : 0;
  const vat = Math.round(dishTotal * 0.08);
  const total = dishTotal + surcharge - discount + vat;

  const cashiers = ["Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường"];
  const methods = ["Tiền mặt", "Chuyển khoản / QR", "Thẻ Visa/Master"];

  return {
    id: `BILL-${billNum}`,
    billCode: `HD${billNum}`,
    date: dayjs().subtract(i % 15, "day").format("DD/MM/YYYY"),
    time: `${String(8 + (i % 14)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    customer: i % 5 === 0 ? `Khách VIP ${i}` : "Khách lẻ",
    tableName: `Bàn ${(i % 16) + 1}`,
    cashier: cashiers[i % cashiers.length],
    paymentMethod: methods[i % methods.length],
    dishTotal,
    surcharge,
    discount,
    vat,
    total,
    status: "Completed",
  };
});

/**
 * Page: RevenueReportPage
 * Báo cáo Doanh thu chuyên sâu cho quản lý / chủ nhà hàng.
 * Đường dẫn: /reports/revenue
 */
const ReportRevenuePage = () => {
  const [loading, setLoading] = useState(true);
  const [presetTime, setPresetTime] = useState("this_month");
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);
  const [searchText, setSearchText] = useState("");
  const [selectedCashier, setSelectedCashier] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");

  const [selectedBill, setSelectedBill] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // TODO: API Fetch Revenue Report Data (GET /api/v1/reports/revenue)
  useEffect(() => {
    fetchReportData();
  }, [presetTime, dateRange, selectedCashier, selectedMethod]);

  const fetchReportData = () => {
    setLoading(true);
    // TODO: Replace with real API call e.g. axios.get('/api/v1/reports/revenue', { params: { startDate, endDate, cashier, method } })
    setTimeout(() => {
      setLoading(false);
    }, 450);
  };

  const handleResetFilters = () => {
    setPresetTime("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    setSearchText("");
    setSelectedCashier("all");
    setSelectedMethod("all");
    fetchReportData();
  };

  // Client-side filtering
  const filteredData = MOCK_REVENUE_BILLS.filter((item) => {
    const matchSearch =
      !searchText ||
      item.billCode.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchText.toLowerCase()) ||
      item.cashier.toLowerCase().includes(searchText.toLowerCase());

    const matchCashier = selectedCashier === "all" || item.cashier === selectedCashier;
    const matchMethod = selectedMethod === "all" || item.paymentMethod === selectedMethod;

    return matchSearch && matchCashier && matchMethod;
  });

  // Calculate Summary Totals
  const totalRevenue = filteredData.reduce((acc, c) => acc + c.total, 0);
  const totalOrders = filteredData.length;
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const avgPerDay = Math.round(totalRevenue / 30);
  const highestVal = filteredData.reduce((max, c) => Math.max(max, c.total), 0);
  const lowestVal = filteredData.reduce((min, c) => Math.min(min, c.total), filteredData[0]?.total || 0);

  const columnDefs = [
    { title: "Mã Bill", field: "billCode" },
    { title: "Ngày", field: "date" },
    { title: "Thời gian", field: "time" },
    { title: "Khách hàng", field: "customer" },
    { title: "Thu ngân", field: "cashier" },
    { title: "Thanh toán", field: "paymentMethod" },
    { title: "Tiền món", field: (r) => `${r.dishTotal.toLocaleString()} đ`, align: "right" },
    { title: "Phụ thu", field: (r) => `${r.surcharge.toLocaleString()} đ`, align: "right" },
    { title: "Giảm giá", field: (r) => `-${r.discount.toLocaleString()} đ`, align: "right" },
    { title: "VAT", field: (r) => `${r.vat.toLocaleString()} đ`, align: "right" },
    { title: "Tổng tiền", field: (r) => `${r.total.toLocaleString()} đ`, align: "right" },
  ];

  // Component bộ lọc riêng cho Báo cáo Doanh Thu (Thu ngân & PTTT)
  const extraFilters = (
    <>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
          Thu ngân thanh toán
        </div>
        <Select
          value={selectedCashier}
          onChange={setSelectedCashier}
          style={{ width: "100%" }}
          options={[
            { label: "Tất cả thu ngân", value: "all" },
            { label: "Nguyễn Văn An", value: "Nguyễn Văn An" },
            { label: "Trần Thị Bình", value: "Trần Thị Bình" },
            { label: "Lê Hoàng Cường", value: "Lê Hoàng Cường" },
          ]}
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={6}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
          Phương thức thanh toán
        </div>
        <Select
          value={selectedMethod}
          onChange={setSelectedMethod}
          style={{ width: "100%" }}
          options={[
            { label: "Tất cả phương thức", value: "all" },
            { label: "Tiền mặt", value: "Tiền mặt" },
            { label: "Chuyển khoản / QR", value: "Chuyển khoản / QR" },
            { label: "Thẻ Visa/Master", value: "Thẻ Visa/Master" },
          ]}
        />
      </Col>
    </>
  );

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
            "Tổng cộng",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            `${totalRevenue.toLocaleString()} đ`,
          ]}
        />
      </div>

      {/* ── REPORT FILTER BAR ───────────────────────────────────────────────── */}
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
        <Empty description="Không tìm thấy dữ liệu hóa đơn doanh thu nào phù hợp với bộ lọc" />
      ) : (
        <>
          {/* 1. Summary KPI Cards + Compare Button */}
          <RevenueSummaryCards
            data={{
              totalRevenue,
              totalOrders,
              avgOrderValue,
              avgRevenuePerDay: avgPerDay,
              growthPct: 14.8,
            }}
            onOpenCompare={() => setCompareModalVisible(true)}
          />

          {/* 2. Revenue Charts (Xu hướng Line Chart + Tỷ trọng Pie Chart) */}
          <RevenueCharts />

          {/* 3. Report Data Table with Direct Toolbar Above Table */}
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
                Nhật Ký Hóa Đơn Doanh Thu Bán Hàng Chi Tiết ({filteredData.length} hóa đơn)
              </Title>

              {/* Toolbar Tích Hợp Trực Tiếp Ngay Trên Bảng: Tìm kiếm, Thu ngân, PTTT, Làm mới, Đặt lại, Xuất/In */}
              <Space wrap size="small">
                <Input
                  placeholder="Tìm kiếm mã bill, khách hàng, thu ngân..."
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 230, borderRadius: 6 }}
                  allowClear
                />

                <Select
                  value={selectedCashier}
                  onChange={setSelectedCashier}
                  style={{ width: 160 }}
                  options={[
                    { label: "Tất cả thu ngân", value: "all" },
                    { label: "Nguyễn Văn An", value: "Nguyễn Văn An" },
                    { label: "Trần Thị Bình", value: "Trần Thị Bình" },
                    { label: "Lê Hoàng Cường", value: "Lê Hoàng Cường" },
                  ]}
                />

                <Select
                  value={selectedMethod}
                  onChange={setSelectedMethod}
                  style={{ width: 170 }}
                  options={[
                    { label: "Tất cả PTTT", value: "all" },
                    { label: "Tiền mặt", value: "Tiền mặt" },
                    { label: "Chuyển khoản / QR", value: "Chuyển khoản / QR" },
                    { label: "Thẻ Visa/Master", value: "Thẻ Visa/Master" },
                  ]}
                />

                <Tooltip title="Làm mới bảng dữ liệu">
                  <Button icon={<ReloadOutlined />} onClick={fetchReportData} style={{ borderRadius: 6 }} />
                </Tooltip>

                <Tooltip title="Xóa tất cả bộ lọc tìm kiếm">
                  <Button onClick={handleResetFilters} style={{ borderRadius: 6 }}>
                    Đặt lại
                  </Button>
                </Tooltip>

                <ExportToolbar
                  reportTitle="Bao_Cao_Doanh_Thu_Chi_Tiet"
                  columnDefs={columnDefs}
                  data={filteredData}
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
                    "-",
                    `${totalRevenue.toLocaleString()} đ`,
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

            <RevenueReportTable
              data={filteredData}
              loading={loading}
              onSelectBill={(bill) => {
                setSelectedBill(bill);
                setDrawerVisible(true);
              }}
            />
          </div>

          {/* Fullscreen Table Modal */}
          <Modal
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>
                  Nhật Ký Hóa Đơn Doanh Thu Bán Hàng Chi Tiết ({filteredData.length} hóa đơn)
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
            totalExpense={112000000}
            netProfit={totalRevenue - 112000000}
            avgPerDay={avgPerDay}
            highestVal={highestVal}
            lowestVal={lowestVal}
            variance={14.8}
          />
        </>
      )}

      {/* Bill Detail Drawer */}
      <BillDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        billData={selectedBill}
      />

      {/* So Sánh Hiệu Quả Vận Hành Modal */}
      <RevenueCompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
      />
    </div>
  );
};

export default ReportRevenuePage;
