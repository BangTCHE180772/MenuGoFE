import React, { useState } from "react";
import { Table, Tag, Input, Select, Button, Card, Typography, Tooltip, Dropdown, Space, message } from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  UndoOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  FilterOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  DownOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái kho" },
  { value: "Bình thường", label: "Bình thường" },
  { value: "Sắp hết", label: "Sắp hết" },
  { value: "Hết hàng", label: "Hết hàng" },
  { value: "Cần kiểm tra", label: "Cần kiểm tra" },
  { value: "Sắp hết hạn", label: "Sắp hết hạn" },
];

const ConsumptionVarianceTable = ({
  items = [],
  varianceThreshold = 10,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    message.info("Đã đặt lại bộ lọc bảng tiêu thụ.");
  };

  const handleExportExcel = () => {
    try {
      const headers = ["Mã NL", "Tên Nguyên Liệu", "Đơn Vị", "Đã Nhập", "Tồn Kho", "Đã Tiêu Thụ", "Tiêu Hao Vượt", "Sai Số (%)"];
      const rows = filteredItems.map((item) => [
        item.id,
        item.name,
        item.unit,
        item.importedQty,
        item.stockQty,
        item.consumedQty,
        item.excessQty,
        `${item.variancePercent}%`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Bao_Cao_Tieu_Thu_Nguyen_Lieu_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Đã xuất file Excel báo cáo tiêu thụ thành công!");
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi xuất file Excel.");
    }
  };

  const handleExportPDF = () => {
    message.info("Đang chuẩn bị file PDF báo cáo tiêu thụ...");
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handlePrint = () => {
    window.print();
  };

  const exportMenuItems = [
    {
      key: "excel",
      icon: <FileExcelOutlined style={{ color: "#16a34a" }} />,
      label: "Xuất Excel (.xlsx / .csv)",
      onClick: handleExportExcel,
    },
    {
      key: "pdf",
      icon: <FilePdfOutlined style={{ color: "#dc2626" }} />,
      label: "Xuất PDF (.pdf)",
      onClick: handleExportPDF,
    },
    {
      type: "divider",
    },
    {
      key: "print",
      icon: <PrinterOutlined style={{ color: "#2563eb" }} />,
      label: "In trang báo cáo",
      onClick: handlePrint,
    },
  ];

  const filteredItems = items.filter((item) => {
    const matchSearch =
      !searchText ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchText.toLowerCase()));

    const matchStatus = statusFilter === "all" || item.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: "Nguyên liệu",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      minWidth: 180,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{text}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Mã: {record.id} | Nhóm: {record.category || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Đã nhập",
      dataIndex: "importedQty",
      key: "importedQty",
      align: "right",
      sorter: (a, b) => a.importedQty - b.importedQty,
      render: (val, record) => (
        <span style={{ fontWeight: 600, color: "#334155" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stockQty",
      key: "stockQty",
      align: "right",
      sorter: (a, b) => a.stockQty - b.stockQty,
      render: (val, record) => {
        const isZero = val === 0;
        return (
          <span style={{ fontWeight: 700, color: isZero ? "#dc2626" : "#16a34a" }}>
            {val.toLocaleString()} {record.unit}
          </span>
        );
      },
    },
    {
      title: "Đã tiêu thụ",
      dataIndex: "consumedQty",
      key: "consumedQty",
      align: "right",
      sorter: (a, b) => a.consumedQty - b.consumedQty,
      render: (val, record) => (
        <span style={{ fontWeight: 700, color: "#2563eb" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Tiêu hao vượt",
      dataIndex: "excessQty",
      key: "excessQty",
      align: "right",
      sorter: (a, b) => a.excessQty - b.excessQty,
      render: (val, record) => {
        const isHigh = record.variancePercent > varianceThreshold;
        return (
          <span style={{ fontWeight: 700, color: isHigh ? "#dc2626" : "#475569" }}>
            {val.toLocaleString()} {record.unit}
          </span>
        );
      },
    },
    {
      title: "Sai số (%)",
      dataIndex: "variancePercent",
      key: "variancePercent",
      align: "center",
      sorter: (a, b) => a.variancePercent - b.variancePercent,
      render: (val) => {
        const isHigh = val > varianceThreshold;
        return (
          <Tag
            color={isHigh ? "error" : "success"}
            style={{
              fontWeight: 700,
              fontSize: 12,
              padding: "2px 10px",
              borderRadius: 12,
            }}
          >
            {isHigh ? <AlertOutlined style={{ marginRight: 4 }} /> : <CheckCircleOutlined style={{ marginRight: 4 }} />}
            {val}%
          </Tag>
        );
      },
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 16,
        marginBottom: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        border: "1px solid #e2e8f0",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
          🍽️ Báo cáo Tiêu thụ & Biến động Sai số Nguyên liệu (Consumption Report)
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Đã nhập ➔ Tồn kho ➔ Đã tiêu thụ (trừ tự động khi thanh toán order POS). Tiêu hao vượt = Đã tiêu thụ − Đã nhập. Ngưỡng sai số cảnh báo: <strong>{varianceThreshold}%</strong>.
        </Text>
      </div>

      {/* Toolbar: Search, Filter, Refresh, Reset, Export/PDF/Print Dropdown, Fullscreen */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          background: "#f8fafc",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, flex: 1 }}>
          {/* Search Input */}
          <Input
            placeholder="Tìm theo tên hoặc mã nguyên liệu..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240, borderRadius: 8 }}
            allowClear
          />

          {/* Status Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              <FilterOutlined style={{ marginRight: 4 }} />
              Trạng thái:
            </span>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              style={{ width: 180 }}
            />
          </div>

          {/* Refresh Button */}
          <Tooltip title="Làm mới bảng">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>

          {/* Reset Button */}
          <Button
            onClick={handleResetFilters}
            style={{ borderRadius: 8 }}
          >
            Đặt lại
          </Button>
        </div>

        {/* Right Toolbar Actions: Unified Export Excel / PDF / Print Dropdown & Fullscreen */}
        <Space size={8}>
          <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              style={{
                backgroundColor: "var(--color-primary)",
                borderColor: "var(--color-primary)",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Xuất / In <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
            </Button>
          </Dropdown>

          <Tooltip title={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={onToggleFullscreen}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Consumption Table */}
      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        pagination={{
          pageSize: 6,
          showSizeChanger: true,
          pageSizeOptions: ["6", "10", "20", "50"],
          showTotal: (total) => `Tổng số ${total} nguyên liệu`,
        }}
        bordered={false}
      />
    </Card>
  );
};

export default ConsumptionVarianceTable;
