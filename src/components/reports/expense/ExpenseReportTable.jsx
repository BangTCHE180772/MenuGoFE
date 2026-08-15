import React from "react";
import { Table, Tag, Typography } from "antd";

const { Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0,
  );

/**
 * Expense Report Component: ExpenseReportTable
 * Bảng báo cáo chi phí chi tiết ERP (Có Search, Sort, Filter, Pagination & Click row -> Expense Detail Drawer).
 */
const ExpenseReportTable = ({
  data = [],
  loading = false,
  onSelectExpense,
  pagination,
  onTableChange,
}) => {
  const columns = [
    {
      title: "Mã Phiếu Chi",
      dataIndex: "expenseCode",
      key: "expenseCode",
      width: 120,
      sorter: (a, b) => a.expenseCode.localeCompare(b.expenseCode),
      render: (text) => (
        <strong style={{ color: "#ef4444", cursor: "pointer" }}>{text}</strong>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 100,
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Giờ",
      dataIndex: "time",
      key: "time",
      width: 80,
    },

    {
      title: "Nhà Cung Cấp / Đối tác",
      dataIndex: "supplier",
      key: "supplier",
      width: 180,
      render: (s) => s || "-",
    },
    {
      title: "Người Tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 140,
    },
    {
      title: "Giá Trị Chi",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 140,
      sorter: (a, b) => a.amount - b.amount,
      render: (v) => (
        <strong style={{ color: "#dc2626", fontSize: 14 }}>
          {formatVND(v)}
        </strong>
      ),
    },
    {
      title: "Ghi chú / Nội dung",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: () => <Tag color="success">Đã chi tiền</Tag>,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      size="middle"
      bordered
      scroll={{ x: 1200 }}
      pagination={
        pagination ?? {
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} chứng từ chi`,
        }
      }
      onChange={onTableChange}
      onRow={(record) => ({
        onClick: () => onSelectExpense?.(record),
        style: { cursor: "pointer" },
      })}
    />
  );
};

export default ExpenseReportTable;
