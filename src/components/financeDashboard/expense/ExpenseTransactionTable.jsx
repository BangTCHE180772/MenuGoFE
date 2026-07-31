import { Card, Table, Input, Button, Empty, Skeleton, Tooltip } from "antd";
import { SearchOutlined, ExportOutlined } from "@ant-design/icons";
import { useState } from "react";
import { MOCK_EXPENSE_TRANSACTIONS } from "../constants";
import { formatVNDFull } from "../../dashboard/utils";

const ExpenseTransactionTable = ({
  data = MOCK_EXPENSE_TRANSACTIONS,
  loading = false,
  onRowClick,
  title,
}) => {
  const [search, setSearch] = useState("");
  const filtered = data.filter((item) =>
    Object.values(item).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 120,
      sorter: (a, b) => String(a.date).localeCompare(b.date),
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 100,
      sorter: (a, b) => String(a.time).localeCompare(b.time),
    },
    {
      title: "Loại chi phí",
      dataIndex: "category",
      key: "category",
      width: 140,
      filters: [
        { text: "Nguyên liệu", value: "Nguyên liệu" },
        { text: "Lương", value: "Lương" },
        { text: "Điện", value: "Điện" },
        { text: "Nước", value: "Nước" },
        { text: "Thuê mặt bằng", value: "Thuê mặt bằng" },
        { text: "Khác", value: "Khác" },
      ],
      onFilter: (val, record) => record.category === val,
    },
    {
      title: "Phiếu nhập",
      dataIndex: "importReceipt",
      key: "importReceipt",
      width: 130,
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplier",
      key: "supplier",
      width: 140,
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (v) => (
        <span style={{ fontWeight: 700, color: "#dc2626" }}>
          {formatVNDFull(v)}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    { title: "Ghi chú", dataIndex: "note", key: "note", ellipsis: true },
  ];

  return (
    <Card
      title={
        <Tooltip
          title={
            <>
              <div>ExpenseTransactionTable</div>
              <div>
                Thống kê toàn bộ giao dịch <strong>(Dòng tiền ra)</strong> trên
                hệ thống.
              </div>
            </>
          }
        >
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            {title || "🧾 Giao dịch Chi phí"}
          </span>
        </Tooltip>
      }
      extra={
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
            size="small"
            allowClear
          />
          <Tooltip title="Xuất Excel">
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={() => console.log("Export Expense")}
            >
              Export
            </Button>
          </Tooltip>
        </div>
      }
      style={{
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `Tổng ${t} giao dịch`,
          }}
          size="small"
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onClick: () => onRowClick?.(record),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: <Empty description="Chưa có giao dịch chi phí" />,
          }}
        />
      )}
    </Card>
  );
};

export default ExpenseTransactionTable;
