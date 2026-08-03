import React, { useState, useMemo } from "react";
import { Table, Input, Select, Button, Space, Tag, Card, Dropdown, Tooltip, message } from "antd";
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

const salesColumnsDefs = [
  { title: "Mã Bill", field: "billCode" },
  { title: "Thời gian", field: "time" },
  { title: "Bàn", field: "tableName" },
  { title: "Thu ngân", field: "cashier" },
  { title: "SL Món", field: "itemCount", align: "center" },
  { title: "Tạm tính", field: (r) => formatVND(r.subtotal), align: "right" },
  { title: "Phụ thu", field: (r) => (r.surcharge > 0 ? formatVND(r.surcharge) : "-"), align: "right" },
  { title: "Giảm giá", field: (r) => (r.discount > 0 ? `-${formatVND(r.discount)}` : "-"), align: "right" },
  { title: "Thành tiền", field: (r) => formatVND(r.total), align: "right" },
  { title: "Phương thức thanh toán", field: "paymentMethod", align: "center" },
];

/**
 * Component Báo Cáo Bán Hàng Chi Tiết
 * Hỗ trợ Fullscreen mode, Horizontal Scroll, Export Dropdown, Search, Filter PTTT, Sort, Phân trang
 */
const SalesReportTable = ({ data = [] }) => {
  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.billCode.toLowerCase().includes(searchText.toLowerCase()) ||
        item.tableName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.cashier.toLowerCase().includes(searchText.toLowerCase());

      const matchPayment =
        paymentFilter === "all" || item.paymentMethod === paymentFilter;

      return matchSearch && matchPayment;
    });
  }, [data, searchText, paymentFilter]);

  const totals = useMemo(() => {
    let billCount = filteredData.length;
    let totalItemCount = 0;
    let totalSubtotal = 0;
    let totalSurcharge = 0;
    let totalDiscount = 0;
    let totalAmount = 0;

    filteredData.forEach((item) => {
      totalItemCount += Number(item.itemCount || 0);
      totalSubtotal += Number(item.subtotal || 0);
      totalSurcharge += Number(item.surcharge || 0);
      totalDiscount += Number(item.discount || 0);
      totalAmount += Number(item.total || 0);
    });

    return {
      billCount,
      totalItemCount,
      totalSubtotal,
      totalSurcharge,
      totalDiscount,
      totalAmount,
    };
  }, [filteredData]);

  const handleExportExcel = () => {
    exportToExcelCSV("Bao_Cao_Ban_Hang", salesColumnsDefs, filteredData, [
      `Tổng: ${totals.billCount} bill`,
      "-",
      "-",
      "-",
      `${totals.totalItemCount} món`,
      formatVND(totals.totalSubtotal),
      totals.totalSurcharge > 0 ? formatVND(totals.totalSurcharge) : "-",
      totals.totalDiscount > 0 ? `-${formatVND(totals.totalDiscount)}` : "-",
      formatVND(totals.totalAmount),
      "-",
    ]);
  };

  const handleExportPDF = () => {
    printReportTable("BÁO CÁO BÁN HÀNG CHI TIẾT IN/PDF", salesColumnsDefs, filteredData, [
      `Tổng: ${totals.billCount} bill`,
      "-",
      "-",
      "-",
      `${totals.totalItemCount} món`,
      formatVND(totals.totalSubtotal),
      totals.totalSurcharge > 0 ? formatVND(totals.totalSurcharge) : "-",
      totals.totalDiscount > 0 ? `-${formatVND(totals.totalDiscount)}` : "-",
      formatVND(totals.totalAmount),
      "-",
    ]);
  };

  const handlePrint = () => {
    printReportTable("BÁO CÁO BÁN HÀNG CHI TIẾT", salesColumnsDefs, filteredData, [
      `Tổng: ${totals.billCount} bill`,
      "-",
      "-",
      "-",
      `${totals.totalItemCount} món`,
      formatVND(totals.totalSubtotal),
      totals.totalSurcharge > 0 ? formatVND(totals.totalSurcharge) : "-",
      totals.totalDiscount > 0 ? `-${formatVND(totals.totalDiscount)}` : "-",
      formatVND(totals.totalAmount),
      "-",
    ]);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success("Đã làm mới dữ liệu báo cáo bán hàng");
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
      title: "Mã Bill",
      dataIndex: "billCode",
      key: "billCode",
      width: 150,
      render: (text) => <strong style={{ color: "#1e293b" }}>{text}</strong>,
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 110,
      sorter: (a, b) => a.time.localeCompare(b.time),
    },
    {
      title: "Bàn",
      dataIndex: "tableName",
      key: "tableName",
      width: 140,
    },
    {
      title: "Thu ngân",
      dataIndex: "cashier",
      key: "cashier",
      width: 150,
    },
    {
      title: "SL Món",
      dataIndex: "itemCount",
      key: "itemCount",
      width: 100,
      align: "center",
      sorter: (a, b) => a.itemCount - b.itemCount,
    },
    {
      title: "Tạm tính",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 130,
      align: "right",
      render: (val) => formatVND(val),
    },
    {
      title: "Phụ thu",
      dataIndex: "surcharge",
      key: "surcharge",
      width: 110,
      align: "right",
      render: (val) => (val > 0 ? formatVND(val) : "-"),
    },
    {
      title: "Giảm giá",
      dataIndex: "discount",
      key: "discount",
      width: 120,
      align: "right",
      render: (val) => (val > 0 ? <span style={{ color: "#ef4444" }}>-{formatVND(val)}</span> : "-"),
    },
    {
      title: "Thành tiền",
      dataIndex: "total",
      key: "total",
      width: 150,
      align: "right",
      sorter: (a, b) => a.total - b.total,
      render: (val) => <strong style={{ color: "var(--color-primary)", fontSize: 14 }}>{formatVND(val)}</strong>,
    },
    {
      title: "Phương thức thanh toán",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 190,
      align: "center",
      render: (method) => {
        let color = "blue";
        if (method === "Tiền mặt") color = "green";
        if (method === "Chuyển khoản / QR") color = "orange";
        if (method === "Thẻ Visa/Master") color = "purple";
        return <Tag color={color} style={{ borderRadius: 6, fontWeight: 500 }}>{method}</Tag>;
      },
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
            placeholder="Tìm theo Mã Bill, Bàn, Thu ngân..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, borderRadius: 8 }}
            allowClear
          />
          <Select
            value={paymentFilter}
            onChange={setPaymentFilter}
            style={{ width: 200 }}
            options={[
              { value: "all", label: "Tất cả PTTT" },
              { value: "Tiền mặt", label: "Tiền mặt" },
              { value: "Chuyển khoản / QR", label: "Chuyển khoản / QR" },
              { value: "Thẻ Visa/Master", label: "Thẻ Visa/Master" },
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

          {/* Reset Filters Button */}
          <Button
            onClick={() => {
              setSearchText("");
              setPaymentFilter("all");
            }}
            style={{ borderRadius: 8 }}
          >
            Đặt lại
          </Button>

          {/* Export & Print Dropdown Button */}
          <Dropdown
            menu={{ items: exportMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
            getPopupContainer={(trigger) => trigger.parentElement}
          >
            <Button type="primary" icon={<DownloadOutlined />} style={{ borderRadius: 8 }}>
              Xuất/In <DownOutlined />
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
                background: "#fff7ed",
                fontWeight: 700,
                borderBottom: "2px solid #fdba74",
              }}
            >
              <Table.Summary.Cell index={0}>
                <span style={{ color: "#c2410c", fontWeight: 700 }}>
                  Tổng: {totals.billCount} bill
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="center">
                <strong style={{ color: "#1e293b", fontSize: 14 }}>
                  {totals.totalItemCount} món
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <strong style={{ color: "#334155" }}>
                  {formatVND(totals.totalSubtotal)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                {totals.totalSurcharge > 0 ? formatVND(totals.totalSurcharge) : "-"}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                {totals.totalDiscount > 0 ? (
                  <span style={{ color: "#ef4444" }}>-{formatVND(totals.totalDiscount)}</span>
                ) : (
                  "-"
                )}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                <strong style={{ color: "var(--color-primary)", fontSize: 15 }}>
                  {formatVND(totals.totalAmount)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="center">
                -
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
        pagination={{
          defaultPageSize: 10,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
        }}
        size="middle"
      />
    </Card>
  );
};

export default SalesReportTable;
