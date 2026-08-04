import { Card, Table, Empty, Skeleton, Tooltip } from "antd";
import { MOCK_TOP_EXPENSES } from "../constants";
import { formatVNDFull } from "../../dashboard/utils";

const TopExpenseTable = ({ data = MOCK_TOP_EXPENSES, loading = false, title }) => {
  const columns = [
    { title: "#", dataIndex: "rank", key: "rank", width: 50, render: (v) => <span style={{ fontWeight: 700 }}>{v}</span> },
    { title: "Loại chi phí", dataIndex: "category", key: "category", width: 140 },
    { title: "Mô tả", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "Số tiền", dataIndex: "amount", key: "amount", width: 160,
      render: (v) => <span style={{ fontWeight: 700, color: "#dc2626" }}>{formatVNDFull(v)}</span>,
      sorter: (a, b) => a.amount - b.amount,
      defaultSortOrder: "descend",
    },
    { title: "Ngày", dataIndex: "date", key: "date", width: 120 },
  ];

  return (
    <Card
      title={
        <Tooltip title="Giúp nhận diện nhanh các khoản chi lớn.">
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title || "🔝 Top 10 khoản Chi phí lớn nhất"}</span>
        </Tooltip>
      }
      style={{ borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 4 }} /></div>
      ) : (
        <Table
          columns={columns} dataSource={data}
          pagination={false} size="small" scroll={{ x: 600 }}
          locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
        />
      )}
    </Card>
  );
};

export default TopExpenseTable;
