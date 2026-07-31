import { Card, Table, Empty, Skeleton, Tooltip } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { COLORS, MOCK_DETAIL_TABLE } from "../constants";
import { formatVNDFull } from "../../dashboard/utils";

const GrowthTag = ({ growth, inverse = false }) => {
  if (growth === null || growth === undefined)
    return (
      <span style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>
        —
      </span>
    );
  const isUp = growth >= 0;
  const isGood = inverse ? !isUp : isUp;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: isGood ? COLORS.profit : COLORS.expense,
      }}
    >
      {isUp ? (
        <ArrowUpOutlined style={{ fontSize: 10 }} />
      ) : (
        <ArrowDownOutlined style={{ fontSize: 10 }} />
      )}{" "}
      {Math.abs(growth).toFixed(1)}%
    </span>
  );
};

const ValueCell = ({ value, growth, color, inverse = false }) => (
  <div>
    <div style={{ fontWeight: 700, fontSize: 13, color }}>
      {formatVNDFull(value)}
    </div>
    <GrowthTag growth={growth} inverse={inverse} />
  </div>
);

const PercentCell = ({ value, growth, color, inverse = false }) => (
  <div>
    <div style={{ fontWeight: 700, fontSize: 13, color }}>
      {(value * 100).toFixed(1)}%
    </div>
    <GrowthTag growth={growth} inverse={inverse} />
  </div>
);

const columns = [
  {
    title: "Thời gian",
    dataIndex: "time",
    key: "time",
    width: 120,
    fixed: "left",
    render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
  },
  {
    title: "Doanh thu",
    dataIndex: "revenue",
    key: "revenue",
    render: (v, r) => (
      <ValueCell value={v} growth={r.revGrowth} color={COLORS.revenue} />
    ),
    sorter: (a, b) => a.revenue - b.revenue,
  },
  {
    title: "Chi phí",
    dataIndex: "expense",
    key: "expense",
    render: (v, r) => (
      <ValueCell
        value={v}
        growth={r.expGrowth}
        color={COLORS.expense}
        inverse
      />
    ),
    sorter: (a, b) => a.expense - b.expense,
  },
  {
    title: "Lợi nhuận",
    dataIndex: "profit",
    key: "profit",
    render: (v, r) => (
      <ValueCell
        value={v}
        growth={r.profitGrowth}
        color={v >= 0 ? COLORS.profit : COLORS.profitNeg}
      />
    ),
    sorter: (a, b) => a.profit - b.profit,
  },
  {
    title: "Tỷ suất lợi nhuận",
    dataIndex: "profitMargin",
    key: "profitMargin",
    render: (v, r) => (
      <PercentCell
        value={v}
        growth={r.marginGrowth}
        color={COLORS.profitMargin}
      />
    ),
    sorter: (a, b) => a.profitMargin - b.profitMargin,
  },
  {
    title: "Tỷ lệ chi phí",
    dataIndex: "costRatio",
    key: "costRatio",
    render: (v, r) => (
      <PercentCell
        value={v}
        growth={r.costGrowth}
        color={COLORS.costRatio}
        inverse
      />
    ),
    sorter: (a, b) => a.costRatio - b.costRatio,
  },
];

const DetailTable = ({ data = MOCK_DETAIL_TABLE, loading = false }) => {
  const sortedData = [...data].reverse();

  return (
    <Card
      title={
        <Tooltip title="Bảng chi tiết từng mốc thời gian.">
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            📋 Bảng chi tiết theo mốc thời gian
          </span>
        </Tooltip>
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
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      ) : data.length === 0 ? (
        <Empty description="Chưa có dữ liệu" style={{ padding: 40 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={sortedData}
          pagination={false}
          size="small"
          scroll={{ x: 800, y: 500 }}
          style={{ fontSize: 13 }}
        />
      )}
    </Card>
  );
};

export default DetailTable;
