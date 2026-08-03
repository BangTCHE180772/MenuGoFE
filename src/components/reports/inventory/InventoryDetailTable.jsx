import React, { useState } from "react";
import { Table, Tag, Input, Select, Button, Card, Typography, Modal, Descriptions, Tooltip, Dropdown, Space, message } from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DownOutlined,
  ReloadOutlined,
  UndoOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const TRANSACTION_TYPES = [
  { value: "all", label: "Tất cả giao dịch" },
  { value: "Nhập kho", label: "Nhập kho" },
  { value: "Xuất kho (Bếp)", label: "Xuất kho (Bếp)" },
  { value: "Điều chỉnh", label: "Điều chỉnh" },
  { value: "Xuất hủy", label: "Xuất hủy" },
  { value: "Sản xuất", label: "Sản xuất" },
];

const InventoryDetailTable = ({ items = [], onRefresh, isFullscreen, onToggleFullscreen }) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleResetFilters = () => {
    setSearchText("");
    setTypeFilter("all");
    message.info("Đã đặt lại bộ lọc nhật ký giao dịch kho.");
  };

  const handleExportExcel = () => {
    try {
      const headers = [
        "Thời Gian",
        "Mã Phiếu",
        "Loại Giao Dịch",
        "Nguyên Liệu",
        "Số Lượng",
        "Đơn Vị",
        "Nhập Kho",
        "Xuất Kho",
        "Điều Chỉnh",
        "Người Tạo",
        "Ghi Chú",
      ];

      const rows = filteredItems.map((item) => [
        item.time,
        item.docCode,
        item.transactionType,
        item.ingredientName,
        item.quantity,
        item.unit,
        item.importQty || 0,
        item.exportQty || 0,
        item.adjustQty || 0,
        item.createdBy,
        item.note,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Bao_Cao_Chi_Tiet_Kho_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Đã xuất file báo cáo chi tiết kho!");
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi xuất dữ liệu.");
    }
  };

  const handleExportPDF = () => {
    message.info("Đang chuẩn bị file PDF nhật ký giao dịch kho...");
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
      label: "Xuất file Excel (.xlsx / .csv)",
      onClick: handleExportExcel,
    },
    {
      key: "pdf",
      icon: <FilePdfOutlined style={{ color: "#dc2626" }} />,
      label: "Xuất file PDF (.pdf)",
      onClick: handleExportPDF,
    },
    {
      type: "divider",
    },
    {
      key: "print",
      icon: <PrinterOutlined style={{ color: "#2563eb" }} />,
      label: "In nhật ký giao dịch",
      onClick: handlePrint,
    },
  ];

  const filteredItems = items.filter((item) => {
    const matchSearch =
      !searchText ||
      item.ingredientName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.docCode.toLowerCase().includes(searchText.toLowerCase()) ||
      item.createdBy.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchText.toLowerCase()));

    const matchType = typeFilter === "all" || item.transactionType === typeFilter;

    return matchSearch && matchType;
  });

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      sorter: (a, b) => a.time.localeCompare(b.time),
      width: 145,
      render: (text) => <span style={{ fontSize: 12, fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Mã phiếu",
      dataIndex: "docCode",
      key: "docCode",
      width: 115,
      render: (text, record) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 600, fontSize: 12 }}
          onClick={() => {
            setSelectedRecord(record);
            setModalVisible(true);
          }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Loại giao dịch",
      dataIndex: "transactionType",
      key: "transactionType",
      width: 140,
      render: (type) => {
        const typeConfig = {
          "Nhập kho": { color: "green", label: "Nhập kho" },
          "Xuất kho (Bếp)": { color: "blue", label: "Xuất kho (Bếp)" },
          "Điều chỉnh": { color: "purple", label: "Điều chỉnh" },
          "Xuất hủy": { color: "red", label: "Xuất hủy" },
          "Sản xuất": { color: "orange", label: "Sản xuất" },
        };
        const cfg = typeConfig[type] || { color: "default", label: type };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Nguyên liệu",
      dataIndex: "ingredientName",
      key: "ingredientName",
      width: 240,
      sorter: (a, b) => a.ingredientName.localeCompare(b.ingredientName),
      render: (text) => <strong style={{ color: "#0f172a", fontSize: 13 }}>{text}</strong>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      width: 110,
      render: (qty, record) => (
        <span style={{ fontWeight: 600 }}>
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: "Nhập kho (+)",
      dataIndex: "importQty",
      key: "importQty",
      align: "right",
      width: 120,
      render: (val, record) =>
        val > 0 ? (
          <span style={{ color: "#16a34a", fontWeight: 700 }}>
            +{val} {record.unit}
          </span>
        ) : (
          <span style={{ color: "#cbd5e1" }}>-</span>
        ),
    },
    {
      title: "Xuất kho (-)",
      dataIndex: "exportQty",
      key: "exportQty",
      align: "right",
      width: 120,
      render: (val, record) =>
        val > 0 ? (
          <span style={{ color: "#dc2626", fontWeight: 700 }}>
            -{val} {record.unit}
          </span>
        ) : (
          <span style={{ color: "#cbd5e1" }}>-</span>
        ),
    },
    {
      title: "Điều chỉnh (±)",
      dataIndex: "adjustQty",
      key: "adjustQty",
      align: "right",
      width: 120,
      render: (val, record) =>
        val !== 0 ? (
          <span style={{ color: val > 0 ? "#2563eb" : "#d97706", fontWeight: 700 }}>
            {val > 0 ? `+${val}` : val} {record.unit}
          </span>
        ) : (
          <span style={{ color: "#cbd5e1" }}>-</span>
        ),
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 170,
      render: (text) => <span style={{ color: "#334155", fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 220,
      ellipsis: true,
      render: (text) => <span style={{ fontStyle: "italic", color: "#64748b" }}>{text || "Không có"}</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: "#2563eb" }} />}
          onClick={() => {
            setSelectedRecord(record);
            setModalVisible(true);
          }}
        />
      ),
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
          📦 Báo cáo Chi tiết Nhật ký Giao dịch Kho (Inventory Detail Report)
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Nhật ký chi tiết các giao dịch xuất nhập tồn kho theo thời gian thực.
        </Text>
      </div>

      {/* Toolbar Ordered: 1. Search, 2. Filter, 3. Refresh, 4. Reset, 5. Export/Print, 6. Fullscreen */}
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
          {/* 1. Tìm kiếm (Search) */}
          <Input
            placeholder="Tìm theo mã phiếu, nguyên liệu, người tạo..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />

          {/* 2. Filter (Loại giao dịch) */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              <FilterOutlined style={{ marginRight: 4 }} />
              Giao dịch:
            </span>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              options={TRANSACTION_TYPES}
              style={{ width: 160 }}
            />
          </div>

          {/* 3. Làm mới (Refresh) */}
          <Tooltip title="Làm mới bảng">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>

          {/* 4. Đặt lại (Reset) */}
          <Button
            onClick={handleResetFilters}
            style={{ borderRadius: 8 }}
          >
            Đặt lại
          </Button>
        </div>

        {/* 5. Xuất / In Dropdown & 6. Fullscreen */}
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
              Xuất/In <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
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

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total) => `Tổng số ${total} giao dịch`,
        }}
        bordered={false}
        scroll={{ x: 1400 }}
      />

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EyeOutlined style={{ color: "#2563eb" }} />
            <span>Chi tiết giao dịch kho: {selectedRecord?.docCode}</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered size="small" style={{ marginTop: 12 }}>
            <Descriptions.Item label="Mã phiếu">{selectedRecord.docCode}</Descriptions.Item>
            <Descriptions.Item label="Thời gian">{selectedRecord.time}</Descriptions.Item>
            <Descriptions.Item label="Loại giao dịch">{selectedRecord.transactionType}</Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">{selectedRecord.createdBy}</Descriptions.Item>
            <Descriptions.Item label="Nguyên liệu">{selectedRecord.ingredientName}</Descriptions.Item>
            <Descriptions.Item label="Số lượng biến động">
              <strong>{selectedRecord.quantity} {selectedRecord.unit}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>
              {selectedRecord.note || "Không có ghi chú"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default InventoryDetailTable;
