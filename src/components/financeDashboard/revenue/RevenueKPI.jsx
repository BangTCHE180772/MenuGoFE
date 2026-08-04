import {
  Row,
  Col,
  Card,
  Statistic,
  Tooltip,
  Segmented,
  DatePicker,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  COLORS,
  MOCK_REVENUE_KPI,
  PERIOD_OPTIONS,
  PREV_PERIOD_OPTIONS,
} from "../constants";
import { formatVNDFull, calcGrowth } from "../../dashboard/utils";

const { RangePicker } = DatePicker;

const RevenueKPI = ({
  data = MOCK_REVENUE_KPI,
  loading = false,
  currentPeriod = "today",
  previousPeriod = "yesterday",
  onCurrentChange,
  onPreviousChange,
  currentCustom = null,
  previousCustom = null,
  onCurrentCustomChange,
  onPreviousCustomChange,
  avgDaily = 0,
  avgPerOrder = 0,
}) => {
  const growth = calcGrowth(data.current.value, data.previous.value);
  const isUp = growth !== null && growth >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        {/* Current Period */}
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              minHeight: 160,
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <div style={{ height: 80 }}>
              <Tooltip
                title={
                  <>
                    <div>
                      "<strong>Doanh thu </strong>kỳ hiện tại"
                    </div>
                    <strong>
                      Dùng để thay đổi dữ liệu của các biểu đồ bên dưới.
                    </strong>
                  </>
                }
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Kỳ hiện tại — {data.current.label}
                </div>
              </Tooltip>
              <Statistic
                value={data.current.value}
                formatter={(v) => formatVNDFull(v)}
                valueStyle={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: COLORS.revenue,
                }}
                prefix={<DollarOutlined />}
                loading={loading}
              />
              {growth !== null && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 16,
                    marginTop: 8,
                    background: isUp ? "#22c55e18" : "#ef444418",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isUp ? "#16a34a" : "#dc2626",
                  }}
                >
                  {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(growth).toFixed(1)}% so với kỳ trước
                </div>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <Segmented
                size="small"
                value={currentPeriod}
                onChange={onCurrentChange}
                options={PERIOD_OPTIONS}
              />
              {currentPeriod === "custom" && (
                <RangePicker
                  size="small"
                  value={currentCustom}
                  onChange={onCurrentCustomChange}
                  style={{ marginTop: 8, width: "100%" }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Previous Period */}
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              minHeight: 160,
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <div style={{ height: 80 }}>
              <Tooltip
                title={
                  <>
                    <div>
                      "<strong>Doanh thu </strong>kỳ trước"
                    </div>
                    <strong>Dùng để so sánh với kỳ hiện tại.</strong>
                  </>
                }
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Kỳ trước — {data.previous.label}
                </div>
              </Tooltip>
              <Statistic
                value={data.previous.value}
                formatter={(v) => formatVNDFull(v)}
                valueStyle={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "var(--color-text-secondary)",
                }}
                prefix={<DollarOutlined />}
                loading={loading}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <Segmented
                size="small"
                value={previousPeriod}
                onChange={onPreviousChange}
                options={PREV_PERIOD_OPTIONS}
              />
              {previousPeriod === "custom" && (
                <RangePicker
                  size="small"
                  value={previousCustom}
                  onChange={onPreviousCustomChange}
                  style={{ marginTop: 8, width: "100%" }}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Average Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Tooltip
              title={
                <>
                  Cho bạn biết trung bình một ngày có thể kiếm được bao nhiêu
                  <strong> Doanh Thu</strong>
                </>
              }
            >
              <Statistic
                title="Doanh thu (Trung Bình / Ngày)"
                value={avgDaily}
                formatter={(v) => formatVNDFull(v)}
                valueStyle={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.revenue,
                }}
                loading={loading}
              />
            </Tooltip>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Tooltip
              title={
                <>
                  Cho bạn biết trung bình một đơn có thể kiếm được bao nhiêu
                  <strong> Doanh Thu</strong>
                </>
              }
            >
              <Statistic
                title="Doanh thu (Trung Bình / Đơn)"
                value={avgPerOrder}
                formatter={(v) => formatVNDFull(v)}
                valueStyle={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.revenue,
                }}
                loading={loading}
              />
            </Tooltip>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RevenueKPI;
