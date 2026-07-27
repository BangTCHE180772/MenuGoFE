import { useMemo } from "react";
import { Card, Skeleton, Tooltip, Tag, Popover } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import {
  formatVND,
  formatVNDFull,
  formatNumber,
  formatPercent,
  calcGrowth,
} from "./utils";

const KPICard = ({
  title,
  value,
  prevValue,
  icon,
  color = "#3b82f6",
  isPercent = false,
  fullFormat = false,
  countFormat = false,
  compareLabel = "So với kỳ trước",
  loading = false,
  onRefresh,
  isDemo = false,
  description,
}) => {
  const growth = useMemo(
    () => calcGrowth(value, prevValue),
    [value, prevValue],
  );
  const isPositive = growth !== null && growth >= 0;
  const formattedValue = isPercent
    ? formatPercent(value)
    : countFormat
      ? formatNumber(value)
      : fullFormat
        ? formatVNDFull(value)
        : formatVND(value);

  const valueFontSize = fullFormat || countFormat ? 20 : 26;

  return (
    <Card
      style={{
        borderRadius: 12,
        border: `1px solid var(--color-border)`,
        boxShadow: "var(--shadow-sm)",
        height: "100%",
        transition: "box-shadow 0.2s",
      }}
      styles={{ body: { padding: "20px 24px" } }}
      hoverable
      extra={
        onRefresh && (
          <Tooltip title="Làm mới">
            <ReloadOutlined
              style={{
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
              onClick={onRefresh}
            />
          </Tooltip>
        )
      }
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-secondary)",
            }}
          >
            {title}
          </span>
          {isDemo && (
            <Tag
              color="orange"
              style={{
                fontSize: 10,
                padding: "0 4px",
                lineHeight: "16px",
                margin: 0,
                opacity: 0.75,
              }}
            >
              Demo
            </Tag>
          )}
          {description && (
            <Popover
              title={
                <span style={{ fontWeight: 700, fontSize: 13 }}>{title}</span>
              }
              content={
                <div
                  style={{
                    maxWidth: 280,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "var(--color-text)",
                  }}
                >
                  {description}
                </div>
              }
              trigger="click"
              placement="bottomLeft"
            >
              <QuestionCircleOutlined
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  opacity: 0.6,
                  flexShrink: 0,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
              />
            </Popover>
          )}
        </span>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <span
              style={{
                fontSize: valueFontSize,
                fontWeight: 800,
                color: "var(--color-text)",
                lineHeight: 1,
                wordBreak: "break-all",
              }}
            >
              {formattedValue}
            </span>
          </div>

          {growth !== null ? (
            <Tooltip title={compareLabel}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: isPositive ? "#22c55e18" : "#ef444418",
                  fontSize: 12,
                  fontWeight: 700,
                  color: isPositive ? "#16a34a" : "#dc2626",
                  cursor: "default",
                }}
              >
                {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(growth).toFixed(1)}%
                <span
                  style={{
                    fontWeight: 400,
                    color: "var(--color-text-secondary)",
                    marginLeft: 2,
                  }}
                >
                  {compareLabel}
                </span>
              </div>
            </Tooltip>
          ) : (
            <span
              style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
            >
              Không có dữ liệu so sánh
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default KPICard;
