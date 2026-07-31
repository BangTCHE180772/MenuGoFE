import {
  Card,
  Table,
  Input,
  Button,
  Empty,
  Skeleton,
  Tooltip,
  Tag,
} from "antd";
import { SearchOutlined, ExportOutlined } from "@ant-design/icons";
import { useState } from "react";
import { MOCK_REVENUE_TRANSACTIONS } from "../constants";
import { formatVNDFull } from "../../dashboard/utils";

const RevenueTransactionTable = ({
  data = MOCK_REVENUE_TRANSACTIONS,
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
      title: "Mã hóa đơn",
      dataIndex: "invoiceCode",
      key: "invoiceCode",
      width: 130,
    },
    { title: "Khách hàng", dataIndex: "customer", key: "customer", width: 140 },
    {
      title: "PT Thanh toán",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 155,
      render: (v) => <Tag color="blue">{v}</Tag>,
      filters: [
        { text: "Tiền mặt", value: "Tiền mặt" },
        { text: "Chuyển khoản / QR", value: "Chuyển khoản / QR" },
      ],
      onFilter: (val, record) => record.paymentMethod === val,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (v) => (
        <span style={{ fontWeight: 700, color: "#16a34a" }}>
          {formatVNDFull(v)}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    { title: "Thu ngân", dataIndex: "cashier", key: "cashier", width: 120 },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
  ];

  const handleExport = () => {
    // Placeholder for Excel export
    console.log("Export Revenue Transactions");
  };

  return (
    <Card
      title={
        <Tooltip
          title={
            <>
              <div>RevenueTransactionTable</div>
              <div>
                Thống kê toàn bộ giao dịch <strong>(Dòng tiền vào)</strong> trên
                hệ thống.
              </div>
            </>
          }
        >
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            {title || "🧾 Giao dịch Doanh thu"}
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
              onClick={handleExport}
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
            emptyText: <Empty description="Chưa có giao dịch doanh thu" />,
          }}
        />
      )}
    </Card>
  );
};

export default RevenueTransactionTable;
