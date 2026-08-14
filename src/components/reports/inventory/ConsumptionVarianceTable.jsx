import React, { useState } from "react";
import { Table, Tag, Button, Card, Typography, Tooltip, Dropdown, Space, Input, Collapse, Empty } from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  AlertOutlined,
  DownOutlined,
  SearchOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { exportToExcelCSV, printReportTable } from "../../homePage/exportUtils";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ConsumptionVarianceTable = ({
  items = [],
  varianceThreshold = 5,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [searchText, setSearchText] = useState("");

  // 1. Lọc bất thường: |Sai số %| > 5%
  const abnormalItems = items.filter((item) => Math.abs(item.variancePercent || 0) > varianceThreshold);

  // 2. Tìm kiếm (case-insensitive) theo Tên hoặc Mã nguyên liệu
  const searchedItems = abnormalItems.filter((item) => {
    if (!searchText) return true;
    const term = searchText.toLowerCase();
    const nameMatch = (item.name || "").toLowerCase().includes(term);
    const idMatch = (item.id || "").toLowerCase().includes(term);
    return nameMatch || idMatch;
  });

  // 3. Sắp xếp mặc định: |Sai số %| giảm dần (DESC)
  const sortedData = [...searchedItems].sort((a, b) => {
    return Math.abs(b.variancePercent || 0) - Math.abs(a.variancePercent || 0);
  });

  // Đổi tiêu đề cột xuất/in
  const exportColumnDefs = [
    { title: "Mã NL", field: "id" },
    { title: "Tên nguyên liệu", field: "name" },
    { title: "Nhóm", field: "category" },
    { title: "Đơn vị", field: "unit" },
    { title: "Tồn đầu kỳ", field: (r) => `${(r.openingStock || 0).toLocaleString()} ${r.unit}`, align: "right" },
    { title: "Nhập", field: (r) => `${(r.import || 0).toLocaleString()} ${r.unit}`, align: "right" },
    { title: "Chuyển vào", field: (r) => `${(r.transferIn || 0).toLocaleString()} ${r.unit}`, align: "right" },
    { title: "Chuyển ra", field: (r) => `${(r.transferOut || 0).toLocaleString()} ${r.unit}`, align: "right" },
    { title: "Hệ thống ghi nhận tiêu thụ", field: (r) => `${(r.systemConsumption || 0).toLocaleString()} ${r.unit}`, align: "right" },
    { title: "Tiêu thụ định mức", field: (r) => `${(r.expectedConsumption || 0).toLocaleString()} ${r.unit}`, align: "right" },
    { title: "Chênh lệch", field: (r) => `${(r.variance || 0) > 0 ? "+" : ""}${(r.variance || 0).toLocaleString()} ${r.unit}`, align: "right" },
    { title: "Sai số (%)", field: (r) => `${(r.variancePercent || 0) > 0 ? "+" : ""}${r.variancePercent}%`, align: "center" },
    { title: "Tồn cuối", field: (r) => `${(r.closingStock || 0).toLocaleString()} ${r.unit}`, align: "right" },
  ];

  const handleExportExcel = () => {
    exportToExcelCSV("Bao_Cao_Tieu_Thu_Bat_Thuong", exportColumnDefs, sortedData);
  };

  const handleExportPDF = () => {
    printReportTable("Bao_Cao_Tieu_Thu_Bat_Thuong_IN_PDF", exportColumnDefs, sortedData);
  };

  const handlePrint = () => {
    printReportTable("Bao_Cao_Tieu_Thu_Bat_Thuong", exportColumnDefs, sortedData);
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

  const columns = [
    {
      title: "Nguyên liệu",
      dataIndex: "name",
      key: "name",
      minWidth: 160,
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
      title: "Tồn đầu",
      dataIndex: "openingStock",
      key: "openingStock",
      align: "right",
      render: (val, record) => (
        <span style={{ fontWeight: 500, color: "#475569" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Nhập",
      dataIndex: "import",
      key: "import",
      align: "right",
      render: (val, record) => (
        <span style={{ fontWeight: 500, color: "#16a34a" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Nhận (+)",
      dataIndex: "transferIn",
      key: "transferIn",
      align: "right",
      render: (val, record) => (
        <span style={{ fontWeight: 500, color: "#0ea5e9" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Gửi (-)",
      dataIndex: "transferOut",
      key: "transferOut",
      align: "right",
      render: (val, record) => (
        <span style={{ fontWeight: 500, color: "#f59e0b" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Hệ thống ghi nhận",
      dataIndex: "systemConsumption",
      key: "systemConsumption",
      align: "right",
      render: (val, record) => (
        <span style={{ fontWeight: 600, color: "#4f46e5" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Định mức",
      dataIndex: "expectedConsumption",
      key: "expectedConsumption",
      align: "right",
      render: (val, record) => (
        <span style={{ fontWeight: 600, color: "#2563eb" }}>
          {val.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: "Chênh lệch",
      dataIndex: "variance",
      key: "variance",
      align: "right",
      render: (val, record) => {
        const isPos = val > 0;
        return (
          <span style={{ fontWeight: 700, color: isPos ? "#dc2626" : "#2563eb" }}>
            {isPos ? "+" : ""}{val.toLocaleString()} {record.unit}
          </span>
        );
      },
    },
    {
      title: "Sai số (%)",
      dataIndex: "variancePercent",
      key: "variancePercent",
      align: "center",
      render: (val) => {
        const isPos = val > 0;
        return (
          <Tag
            color={isPos ? "error" : "processing"}
            style={{
              fontWeight: 700,
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 12,
            }}
          >
            <AlertOutlined style={{ marginRight: 4 }} />
            {isPos ? "+" : ""}{val}%
          </Tag>
        );
      },
    },
    {
      title: "Tồn cuối",
      dataIndex: "closingStock",
      key: "closingStock",
      align: "right",
      render: (val, record) => {
        const isZero = val === 0;
        return (
          <span style={{ fontWeight: 700, color: isZero ? "#dc2626" : "#16a34a" }}>
            {val.toLocaleString()} {record.unit}
          </span>
        );
      },
    },
  ];

  return (
    <Card
      style={{
        borderRadius: isFullscreen ? 0 : 16,
        marginBottom: isFullscreen ? 0 : 24,
        boxShadow: isFullscreen ? "none" : "0 2px 12px rgba(0,0,0,0.03)",
        border: isFullscreen ? "none" : "1px solid #e2e8f0",
      }}
      bodyStyle={{ padding: isFullscreen ? 16 : "20px 24px" }}
    >
      {/* Title */}
      {!isFullscreen && (
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
            🍽️ Báo cáo Tiêu thụ & Biến động Sai số Nguyên liệu (Abnormal Consumption Report)
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Giám sát mức độ bất thường về tiêu hao của các nguyên liệu có sai số tuyệt đối lớn hơn <strong>{varianceThreshold}%</strong>.
          </Text>
        </div>
      )}

      {/* 📖 Hướng dẫn đọc báo cáo */}
      <Collapse
        ghost
        style={{
          marginBottom: 16,
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <Panel
          header={
            <Space>
              <InfoCircleOutlined style={{ color: "#3b82f6" }} />
              <strong style={{ color: "#1e293b" }}>Cách đọc báo cáo (Nhấp để xem hướng dẫn)</strong>
            </Space>
          }
          key="1"
        >
          <div style={{ fontSize: 13, lineHeight: "1.6", color: "#475569" }}>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>Báo cáo chỉ hiển thị nguyên liệu có sai số vượt ngưỡng 5%.</li>
              <li>Sai số được tính dựa trên chênh lệch giữa lượng hệ thống ghi nhận tiêu thụ và lượng tiêu thụ định mức.</li>
              <li>Sai số dương (+) cho biết lượng hệ thống ghi nhận tiêu thụ cao hơn định mức.</li>
              <li>Sai số âm (-) cho biết lượng hệ thống ghi nhận tiêu thụ thấp hơn định mức.</li>
              <li>Các nguyên liệu được sắp xếp theo mức độ bất thường từ cao xuống thấp (dựa trên trị tuyệt đối của sai số %).</li>
              <li>Quản lý chi nhánh nên ưu tiên kiểm tra các nguyên liệu ở đầu bảng trước.</li>
              <li>Báo cáo là công cụ phát hiện bất thường, không tự kết luận nguyên nhân.</li>
            </ol>
            
            <div style={{ marginTop: 8, fontWeight: 600, color: "#1e293b" }}>
              📋 Giải thích các cột dữ liệu:
            </div>
            <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
              <li><strong>Tồn đầu</strong>: Tồn kho nguyên liệu tại thời điểm bắt đầu kỳ báo cáo (gồm cả lượng kết chuyển từ trước).</li>
              <li><strong>Nhập</strong>: Tổng lượng nguyên liệu nhập kho từ nhà cung cấp trong kỳ báo cáo.</li>
              <li><strong>Nhận (+)</strong>: Lượng nguyên liệu nhận chuyển kho từ các chi nhánh khác gửi đến.</li>
              <li><strong>Gửi (-)</strong>: Lượng nguyên liệu xuất chuyển kho gửi đến các chi nhánh khác.</li>
              <li><strong>Hệ thống ghi nhận</strong>: Tiêu thụ thực tế tính theo công thức: <code>Tồn đầu + Nhập + Nhận - Gửi - Tồn cuối</code>.</li>
              <li><strong>Định mức</strong>: Lượng tiêu hao lý thuyết tính theo hóa đơn bán hàng nhân với định lượng công thức món ăn (Recipe).</li>
              <li><strong>Chênh lệch</strong>: Lượng sai lệch giữa <code>Hệ thống ghi nhận - Định mức</code>.</li>
              <li><strong>Sai số (%)</strong>: Tỷ lệ chênh lệch phần trăm tính theo công thức: <code>(Chênh lệch / Định mức) * 100</code>.</li>
              <li><strong>Tồn cuối</strong>: Tồn kho thực tế còn lại tại thời điểm kết thúc kỳ báo cáo.</li>
            </ul>

            <div style={{ marginTop: 8, fontWeight: 600, color: "#dc2626" }}>
              * Lưu ý quan trọng:
            </div>
            <div style={{ paddingLeft: 8, fontStyle: "italic" }}>
              - "Sai số vượt ngưỡng chỉ là dấu hiệu cần kiểm tra, không đồng nghĩa với việc bếp làm thất thoát nguyên liệu."<br/>
              - "Hệ thống hiện ghi nhận mức tiêu thụ dựa trên dữ liệu tồn kho và định mức công thức; báo cáo không trực tiếp đo lượng nguyên liệu vật lý mà bếp đã sử dụng."
            </div>
          </div>
        </Panel>
      </Collapse>

      {/* Toolbar: Refresh, Search Box, Export/Print Actions, Fullscreen */}
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
          {/* Refresh Button */}
          <Tooltip title="Làm mới bảng">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>

          {/* Search Box */}
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />
        </div>

        {/* Right Actions */}
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

      {/* Empty State / Table */}
      {abnormalItems.length === 0 ? (
        <Empty
          description={
            <div style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>
              Không có nguyên liệu nào có sai số vượt ngưỡng 5%.
            </div>
          }
          style={{ padding: "40px 0" }}
        />
      ) : sortedData.length === 0 ? (
        <Empty
          description={
            <div style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>
              Tìm thấy 0 nguyên liệu bất thường.
            </div>
          }
          style={{ padding: "40px 0" }}
        />
      ) : (
        <div style={{ height: "450px", overflowY: "auto" }}>
          <Table
            columns={columns}
            dataSource={sortedData}
            rowKey="id"
            pagination={false}
            bordered={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      )}
    </Card>
  );
};

export default ConsumptionVarianceTable;
