import { Card, Progress, Tooltip, Skeleton, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { COLORS, MOCK_BREAK_EVEN } from "../constants";
import { formatVNDFull } from "../../dashboard/utils";

const BreakEvenProgress = ({ data = MOCK_BREAK_EVEN, loading = false }) => {
  const { currentRevenue, breakEvenPoint, remaining, percentage } = data;

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🎯 Điểm hòa vốn</span>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <p><strong>Ý nghĩa:</strong> So sánh doanh thu hiện tại của chi nhánh với mức doanh thu tối thiểu cần đạt để bù đắp toàn bộ chi phí phát sinh trong kỳ.</p>
                <p><strong>Cách đọc:</strong> Xem thanh tiến trình phần trăm. Nếu đạt 100%, chi nhánh đã đạt điểm hòa vốn (doanh thu = chi phí). Trên 100% nghĩa là bắt đầu sinh lời ròng.</p>
              </div>
            }
            title="💡 Hướng dẫn đọc biểu đồ"
            trigger="click"
          >
            <QuestionCircleOutlined style={{ color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }} />
          </Popover>
        </div>
      }
      style={{
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Tooltip title="Doanh thu hiện tại đã đạt được">
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Doanh thu hiện tại
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: COLORS.revenue,
                  }}
                >
                  {formatVNDFull(currentRevenue)}
                </div>
              </div>
            </Tooltip>
            <Tooltip title="Mức doanh thu cần đạt để hòa vốn (bù đắp toàn bộ chi phí)">
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Điểm hòa vốn
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--color-text)",
                  }}
                >
                  {formatVNDFull(breakEvenPoint)}
                </div>
              </div>
            </Tooltip>
          </div>

          <Progress
            percent={Math.min(percentage, 100)}
            strokeColor={{
              "0%": COLORS.expense,
              "50%": COLORS.profitMargin,
              "100%": COLORS.profit,
            }}
            trailColor="var(--color-border)"
            strokeWidth={16}
            style={{ marginBottom: 12 }}
            format={(p) => `${p.toFixed(0)}%`}
          />

          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              color: remaining > 0 ? COLORS.expense : COLORS.profit,
              fontWeight: 600,
            }}
          >
            {remaining > 0
              ? `Cần thêm ${formatVNDFull(remaining)} để đạt hòa vốn`
              : "🎉 Đã đạt hòa vốn!"}
          </div>
        </div>
      )}
    </Card>
  );
};

export default BreakEvenProgress;
