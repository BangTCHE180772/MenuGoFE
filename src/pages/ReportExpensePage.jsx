import React, { useState, useEffect } from "react";
import { Breadcrumb, Typography, Skeleton, Empty, Select, Col, Input, Button, Tooltip, Space, Modal } from "antd";
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

const { Title, Text } = Typography;

// Mock Generator cho Báo cáo Chi phí
const MOCK_EXPENSES = Array.from({ length: 35 }, (_, i) => {
  const expNum = String(2001 + i).padStart(4, "0");
  const categories = [
    "Nguyên liệu & Thực phẩm",
    "Lương nhân viên",
    "Thuê mặt bằng",
    "Điện, Nước & Gas",
    "Tiếp thị & Quảng cáo",
    "Chi phí khác",
  ];
  const suppliers = [
    "NPP Thực Phẩm Sạch Hải Đăng",
    "Công ty Điện Lực Thành Phố",
    "Đơn Vị Truyền Thông Marketing",
    "Công ty Cấp Nước Sạch",
    "Công ty Bất Động Sản Đô Thị",
  ];
  const creators = ["Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường"];

  const cat = categories[i % categories.length];
  let amount = Math.round((500000 + Math.random() * 5000000) / 10000) * 10000;
  if (cat === "Thuê mặt bằng") amount = 18000000;
  if (cat === "Lương nhân viên") amount = 32000000;

  return {
    id: `EXP-${expNum}`,
    expenseCode: `PC${expNum}`,
    date: dayjs().subtract(i % 20, "day").format("DD/MM/YYYY"),
    time: `${String(9 + (i % 10)).padStart(2, "0")}:${String((i * 11) % 60).padStart(2, "0")}`,
    category: cat,
    supplier: suppliers[i % suppliers.length],
    createdBy: creators[i % creators.length],
    amount,
    notes: `Chi tiền ${cat.toLowerCase()} theo hợp đồng và chứng từ kèm theo.`,
    status: "Completed",
  };
});

/**
 * Page: ExpenseReportPage
 * Báo cáo Chi phí chuyên sâu cho quản lý / chủ nhà hàng.
 * Đường dẫn: /reports/expense
 */
const ReportExpensePage = () => {
  const [loading, setLoading] = useState(true);
  const [presetTime, setPresetTime] = useState("this_month");
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedCreatedBy, setSelectedCreatedBy] = useState("all");

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  // TODO: API Fetch Expense Report Data (GET /api/v1/reports/expense)
  useEffect(() => {
    fetchReportData();
  }, [presetTime, dateRange, selectedCategory, selectedSupplier, selectedCreatedBy]);

  const fetchReportData = () => {
    setLoading(true);
    // TODO: Replace with real API call e.g. axios.get('/api/v1/reports/expense', { params: { startDate, endDate, category, supplier, createdBy } })
    setTimeout(() => {
      setLoading(false);
    }, 450);
  };

  const handleResetFilters = () => {
    setPresetTime("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    setSearchText("");
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedCreatedBy("all");
    fetchReportData();
  };

  // Client-side filtering
  const filteredData = MOCK_EXPENSES.filter((item) => {
    const matchSearch =
      !searchText ||
      item.expenseCode.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category.toLowerCase().includes(searchText.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchText.toLowerCase()) ||
      item.createdBy.toLowerCase().includes(searchText.toLowerCase());

    const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchSupplier = selectedSupplier === "all" || item.supplier === selectedSupplier;
    const matchCreatedBy = selectedCreatedBy === "all" || item.createdBy === selectedCreatedBy;

    return matchSearch && matchCategory && matchSupplier && matchCreatedBy;
  });

  // Calculate Summary Totals
  const totalExpense = filteredData.reduce((acc, c) => acc + c.amount, 0);
  const avgExpense = filteredData.length ? Math.round(totalExpense / filteredData.length) : 0;
  const avgPerDay = Math.round(totalExpense / 30);
  const highestVal = filteredData.reduce((max, c) => Math.max(max, c.amount), 0);
  const lowestVal = filteredData.reduce((min, c) => Math.min(min, c.amount), filteredData[0]?.amount || 0);

  const columnDefs = [
    { title: "Mã Phiếu Chi", field: "expenseCode" },
    { title: "Ngày", field: "date" },
    { title: "Giờ", field: "time" },
    { title: "Loại Chi Phí", field: "category" },
    { title: "Nhà Cung Cấp / Đối Tác", field: "supplier" },
    { title: "Người Tạo", field: "createdBy" },
    { title: "Giá Trị Chi", field: (r) => `-${r.amount.toLocaleString()} đ`, align: "right" },
    { title: "Ghi chú", field: "notes" },
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
            "Tổng cộng",
            "-",
            "-",
            "-",
            "-",
            "-",
            `-${totalExpense.toLocaleString()} đ`,
            "-",
          ]}
        />
      </div>

      {/* ── REPORT FILTER BAR (Có nút Đặt lại filter) ────────────────────── */}
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
        <Empty description="Không tìm thấy chứng từ chi phí nào phù hợp với bộ lọc" />
      ) : (
        <>
          {/* 1. Summary KPI Cards + Compare Button */}
          <ExpenseSummaryCards
            data={{
              totalExpense,
              avgExpense,
              avgExpensePerDay: avgPerDay,
              growthPct: -4.2,
              largestExpense: highestVal,
            }}
            onOpenCompare={() => setCompareModalVisible(true)}
          />

          {/* 2. Expense Charts (Đã bỏ Biến động Chi phí theo Danh mục) */}
          <ExpenseCharts />

          {/* 3. Report Data Table với Thanh Toolbar 2 Hàng (Hàng 1: Tiêu đề + Tìm kiếm; Hàng 2: Các bộ lọc & Xuất/In) */}
          <div style={{ background: "#ffffff", padding: 18, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {/* Hàng 1: Tiêu đề + Khung tìm kiếm đứng riêng 1 hàng */}
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

            {/* Hàng 2: Các bộ lọc còn lại & nút thao tác bên dưới khung tìm kiếm */}
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
                  style={{ width: 170 }}
                  options={[
                    { label: "Tất cả loại chi phí", value: "all" },
                    { label: "Nguyên liệu & Thực phẩm", value: "Nguyên liệu & Thực phẩm" },
                    { label: "Lương nhân viên", value: "Lương nhân viên" },
                    { label: "Thuê mặt bằng", value: "Thuê mặt bằng" },
                    { label: "Điện, Nước & Gas", value: "Điện, Nước & Gas" },
                    { label: "Tiếp thị & Quảng cáo", value: "Tiếp thị & Quảng cáo" },
                    { label: "Chi phí khác", value: "Chi phí khác" },
                  ]}
                />

                <Select
                  value={selectedSupplier}
                  onChange={setSelectedSupplier}
                  style={{ width: 180 }}
                  options={[
                    { label: "Tất cả NCC / Đối tác", value: "all" },
                    { label: "NPP Thực Phẩm Sạch Hải Đăng", value: "NPP Thực Phẩm Sạch Hải Đăng" },
                    { label: "Công ty Điện Lực Thành Phố", value: "Công ty Điện Lực Thành Phố" },
                    { label: "Đơn Vị Truyền Thông Marketing", value: "Đơn Vị Truyền Thông Marketing" },
                    { label: "Công ty Cấp Nước Sạch", value: "Công ty Cấp Nước Sạch" },
                    { label: "Công ty Bất Động Sản Đô Thị", value: "Công ty Bất Động Sản Đô Thị" },
                  ]}
                />

                <Select
                  value={selectedCreatedBy}
                  onChange={setSelectedCreatedBy}
                  style={{ width: 150 }}
                  options={[
                    { label: "Tất cả người tạo", value: "all" },
                    { label: "Nguyễn Văn An", value: "Nguyễn Văn An" },
                    { label: "Trần Thị Bình", value: "Trần Thị Bình" },
                    { label: "Lê Hoàng Cường", value: "Lê Hoàng Cường" },
                  ]}
                />

                <Tooltip title="Làm mới dữ liệu phiếu chi">
                  <Button icon={<ReloadOutlined />} onClick={fetchReportData} style={{ borderRadius: 6 }} />
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
                    "Tổng cộng",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    `-${totalExpense.toLocaleString()} đ`,
                    "-",
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

            <ExpenseReportTable
              data={filteredData}
              loading={loading}
              onSelectExpense={(exp) => {
                setSelectedExpense(exp);
                setDrawerVisible(true);
              }}
            />
          </div>

          {/* Fullscreen Expense Table Modal */}
          <Modal
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}>
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
            totalRevenue={284500000}
            totalExpense={totalExpense}
            netProfit={284500000 - totalExpense}
            avgPerDay={avgPerDay}
            highestVal={highestVal}
            lowestVal={lowestVal}
            variance={-4.2}
          />
        </>
      )}

      {/* Expense Detail Drawer */}
      <ExpenseDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        expenseData={selectedExpense}
      />

      {/* So Sánh Hiệu Quả Chi Phí Vận Hành Modal */}
      <ExpenseCompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
      />
    </div>
  );
};

export default ReportExpensePage;
