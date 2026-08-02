import React, { useState, useMemo } from "react";
import { Table, Input, Button, Space, Progress, Card, Dropdown, Tooltip, message } from "antd";
import {
  SearchOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
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

const inventoryColumnDefs = [
  { title: "Mã món", field: "itemCode" },
  { title: "Tên món ăn / sản phẩm", field: "itemName" },
  { title: "Số lượng bán", field: (r) => `${r.qtySold} phần`, align: "center" },
  { title: "Giá bán", field: (r) => formatVND(r.unitPrice), align: "right" },
  { title: "Doanh thu", field: (r) => formatVND(r.revenue), align: "right" },
  { title: "Tỷ trọng doanh thu", field: (r) => `${r.sharePct}%`, align: "center" },
];

/**
 * Component Báo Cáo Hàng Hóa Chi Tiết
 * Hỗ trợ Fullscreen mode, Horizontal Scroll, Export Dropdown, Search, Sort, Tỷ Trọng %, Phân trang
 */
const InventoryReportTable = ({ data = [] }) => {
  const [searchText, setSearchText] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.itemCode.toLowerCase().includes(searchText.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data, searchText]);

  const totals = useMemo(() => {
    let itemCount = filteredData.length;
    let totalQtySold = 0;
    let totalUnitPrice = 0;
    let totalRevenue = 0;

    filteredData.forEach((item) => {
      totalQtySold += Number(item.qtySold || 0);
      totalUnitPrice += Number(item.unitPrice || 0);
      totalRevenue += Number(item.revenue || 0);
    });

    return {
      itemCount,
      totalQtySold,
      totalUnitPrice,
      totalRevenue,
    };
  }, [filteredData]);

  const handleExportExcel = () => {
    exportToExcelCSV("Bao_Cao_San_Pham_Hang_Hoa", inventoryColumnDefs, filteredData, [
      `Tổng: ${totals.itemCount} món`,
      "-",
      `${totals.totalQtySold} phần`,
      formatVND(totals.totalUnitPrice),
      formatVND(totals.totalRevenue),
      "100%",
    ]);
  };

  const handleExportPDF = () => {
    printReportTable("BÁO CÁO SẢN PHẨM & HÀNG HÓA IN/PDF", inventoryColumnDefs, filteredData, [
      `Tổng: ${totals.itemCount} món`,
      "-",
      `${totals.totalQtySold} phần`,
      formatVND(totals.totalUnitPrice),
      formatVND(totals.totalRevenue),
      "100%",
    ]);
  };

  const handlePrint = () => {
    printReportTable("BÁO CÁO SẢN PHẨM & HÀNG HÓA BÁN RA", inventoryColumnDefs, filteredData, [
      `Tổng: ${totals.itemCount} món`,
      "-",
      `${totals.totalQtySold} phần`,
      formatVND(totals.totalUnitPrice),
      formatVND(totals.totalRevenue),
      "100%",
    ]);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success("Đã làm mới dữ liệu báo cáo hàng hóa");
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
      title: "Mã món",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 140,
      render: (text) => <strong style={{ color: "#1e293b" }}>{text}</strong>,
    },
    {
      title: "Tên món ăn / sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      width: 240,
      render: (text) => <span style={{ fontWeight: 600, color: "#334155" }}>{text}</span>,
    },
    {
      title: "Số lượng bán",
      dataIndex: "qtySold",
      key: "qtySold",
      width: 150,
      align: "center",
      sorter: (a, b) => a.qtySold - b.qtySold,
      render: (val) => <strong style={{ fontSize: 14 }}>{val} phần</strong>,
    },
    {
      title: "Giá bán",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 140,
      align: "right",
      render: (val) => formatVND(val),
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      width: 160,
      align: "right",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (val) => (
        <strong style={{ color: "var(--color-primary)", fontSize: 14 }}>{formatVND(val)}</strong>
      ),
    },
    {
      title: "Tỷ trọng doanh thu",
      dataIndex: "sharePct",
      key: "sharePct",
      width: 220,
      sorter: (a, b) => a.sharePct - b.sharePct,
      render: (pct) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Progress
            percent={pct}
            size="small"
            strokeColor="var(--color-primary)"
            style={{ flex: 1, margin: 0 }}
          />
        </div>
      ),
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
            placeholder="Tìm theo Mã món, Tên món..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
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
                background: "#eff6ff",
                fontWeight: 700,
                borderBottom: "2px solid #3b82f6",
              }}
            >
              <Table.Summary.Cell index={0}>
                <span style={{ color: "#1d4ed8", fontWeight: 700 }}>
                  Tổng: {totals.itemCount} món
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="center">
                <strong style={{ color: "#1e293b", fontSize: 14 }}>
                  {totals.totalQtySold} phần
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <strong style={{ color: "#334155" }}>
                  {formatVND(totals.totalUnitPrice)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <strong style={{ color: "var(--color-primary)", fontSize: 15 }}>
                  {formatVND(totals.totalRevenue)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Progress
                    percent={100}
                    size="small"
                    strokeColor="#10b981"
                    style={{ flex: 1, margin: 0 }}
                  />
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
        pagination={{
          defaultPageSize: 10,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} món ăn/sản phẩm`,
        }}
        size="middle"
      />
    </Card>
  );
};

export default InventoryReportTable;
