import React, { useState, useMemo } from "react";
import { Table, Input, Select, Button, Space, Tag, Card, Dropdown, Tooltip, message } from "antd";
import {
  SearchOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PrinterOutlined,
  DownloadOutlined,
  DownOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { exportToExcelCSV, printReportTable } from "./exportUtils";

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

const cashFlowColumnDefs = [
  { title: "Mã giao dịch", field: "code" },
  { title: "Loại", field: "type", align: "center" },
  { title: "Người nộp / nhận", field: "person" },
  { title: "Nội dung", field: "note" },
  { title: "Giá trị", field: (r) => `${r.type === "Thu" ? "+" : "-"}${formatVND(r.amount)}`, align: "right" },
  { title: "Mã chứng từ", field: "docCode" },
  { title: "Thời gian", field: "time" },
];

/**
 * Component Báo Cáo Thu Chi Chi Tiết
 * Hỗ trợ Fullscreen mode, Horizontal Scroll, Export Dropdown, Search, Filter Loại Thu/Chi, Sort, Phân trang
 */
const CashFlowReportTable = ({ data = [] }) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchText.toLowerCase()) ||
        item.person.toLowerCase().includes(searchText.toLowerCase()) ||
        item.note.toLowerCase().includes(searchText.toLowerCase()) ||
        item.docCode.toLowerCase().includes(searchText.toLowerCase());

      const matchType = typeFilter === "all" || item.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [data, searchText, typeFilter]);

  const totals = useMemo(() => {
    let totalCount = filteredData.length;
    let netAmount = 0;

    filteredData.forEach((item) => {
      const amt = Number(item.amount || 0);
      if (item.type === "Thu") {
        netAmount += amt;
      } else if (item.type === "Chi") {
        netAmount -= amt;
      }
    });

    return {
      totalCount,
      netAmount,
    };
  }, [filteredData]);

  const handleExportExcel = () => {
    exportToExcelCSV("Bao_Cao_Thu_Chi", cashFlowColumnDefs, filteredData, [
      `Tổng: ${totals.totalCount} giao dịch`,
      "-",
      "-",
      "-",
      `${totals.netAmount >= 0 ? "+" : ""}${formatVND(totals.netAmount)}`,
      "-",
      "-",
    ]);
  };

  const handleExportPDF = () => {
    printReportTable("BÁO CÁO THU CHI TÀI CHÍNH IN/PDF", cashFlowColumnDefs, filteredData, [
      `Tổng: ${totals.totalCount} giao dịch`,
      "-",
      "-",
      "-",
      `${totals.netAmount >= 0 ? "+" : ""}${formatVND(totals.netAmount)}`,
      "-",
      "-",
    ]);
  };

  const handlePrint = () => {
    printReportTable("BÁO CÁO THU CHI TÀI CHÍNH", cashFlowColumnDefs, filteredData, [
      `Tổng: ${totals.totalCount} giao dịch`,
      "-",
      "-",
      "-",
      `${totals.netAmount >= 0 ? "+" : ""}${formatVND(totals.netAmount)}`,
      "-",
      "-",
    ]);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success("Đã làm mới dữ liệu báo cáo thu chi");
    }, 300);
  };

  const exportMenuItems = [
    {
      key: "excel",
      icon: <FileExcelOutlined style={{ color: "#16a34a" }} />,
      label: "Xuất file Excel (.csv / .xlsx)",
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
      label: "In báo cáo (Mở giao diện máy in)",
      onClick: handlePrint,
    },
  ];

  const columns = [
    {
      title: "Mã giao dịch",
      dataIndex: "code",
      key: "code",
      width: 160,
      render: (text) => <strong style={{ color: "#1e293b" }}>{text}</strong>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      align: "center",
      render: (type) => (
        <Tag
          color={type === "Thu" ? "success" : "error"}
          style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
        >
          {type === "Thu" ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {type}
        </Tag>
      ),
    },
    {
      title: "Người nộp / nhận",
      dataIndex: "person",
      key: "person",
      width: 220,
    },
    {
      title: "Nội dung",
      dataIndex: "note",
      key: "note",
      width: 260,
    },
    {
      title: "Giá trị",
      dataIndex: "amount",
      key: "amount",
      width: 160,
      align: "right",
      sorter: (a, b) => a.amount - b.amount,
      render: (val, record) => (
        <strong
          style={{
            color: record.type === "Thu" ? "#10b981" : "#ef4444",
            fontSize: 14,
          }}
        >
          {record.type === "Thu" ? "+" : "-"}{formatVND(val)}
        </strong>
      ),
    },
    {
      title: "Mã chứng từ",
      dataIndex: "docCode",
      key: "docCode",
      width: 160,
      render: (text) => <span style={{ fontFamily: "monospace", color: "#64748b" }}>{text}</span>,
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 120,
      sorter: (a, b) => a.time.localeCompare(b.time),
    },
  ];

  return (
    <Card
      bordered={false}
      style={
        isFullscreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1200,
              borderRadius: 0,
              overflow: "auto",
              background: "#ffffff",
              padding: 24,
            }
          : {
              borderRadius: "var(--border-radius)",
              boxShadow: "var(--shadow-sm)",
              background: "var(--color-surface)",
            }
      }
      bodyStyle={{ padding: 16 }}
    >
      {/* Complete Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space wrap size="middle">
          <Input
            placeholder="Tìm theo Mã, Người nộp/nhận, Nội dung..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "Tất cả Loại" },
              { value: "Thu", label: "Phiếu Thu (+)" },
              { value: "Chi", label: "Phiếu Chi (-)" },
            ]}
          />
        </Space>

        <Space wrap>
          {/* Refresh Data Button */}
          <Tooltip title="Tải lại dữ liệu">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>

          {/* Export Dropdown Button */}
          <Dropdown
            menu={{ items: exportMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
            getPopupContainer={(trigger) => trigger.parentElement}
          >
            <Button type="primary" icon={<DownloadOutlined />} style={{ borderRadius: 8 }}>
              Xuất dữ liệu / In <DownOutlined />
            </Button>
          </Dropdown>

          {/* Fullscreen Toggle Button */}
          <Tooltip title={isFullscreen ? "Thoát toàn màn hình" : "Phóng to toàn màn hình"}>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Table with Horizontal Scroll Support & Top Summary Row */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        sticky
        loading={loading}
        scroll={{ x: "max-content", y: isFullscreen ? "calc(100vh - 220px)" : undefined }}
        summary={() => (
          <Table.Summary fixed="top">
            <Table.Summary.Row
              style={{
                background: totals.netAmount >= 0 ? "#ecfdf5" : "#fef2f2",
                fontWeight: 700,
                borderBottom: `2px solid ${totals.netAmount >= 0 ? "#10b981" : "#ef4444"}`,
              }}
            >
              <Table.Summary.Cell index={0}>
                <span style={{ color: "#047857", fontWeight: 700 }}>
                  Tổng: {totals.totalCount} giao dịch
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <strong
                  style={{
                    color: totals.netAmount >= 0 ? "#10b981" : "#ef4444",
                    fontSize: 15,
                  }}
                >
                  {totals.netAmount >= 0 ? "+" : ""}{formatVND(totals.netAmount)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={6}>-</Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
        pagination={{
          defaultPageSize: 10,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} giao dịch`,
        }}
        size="middle"
      />
    </Card>
  );
};

export default CashFlowReportTable;
