import React from "react";
import { Card, Row, Col, Tooltip, Popover, Segmented, DatePicker } from "antd";
import {
  ShoppingCartOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import OrderTrendChart from "./OrderTrendChart";

const { RangePicker } = DatePicker;

// Helper to calculate percentage change
const getChangeText = (curr, prev) => {
  if (prev === 0) return curr > 0 ? "▲ 100%" : "0%";
  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100);
  if (pct > 0) return `▲ ${pct}%`;
  if (pct < 0) return `▼ ${Math.abs(pct)}%`;
  return "0%";
};

const getChangeColor = (curr, prev, inverse = false) => {
  if (prev === 0) return curr > 0 ? "#22c55e" : "var(--color-text-secondary)";
  const diff = curr - prev;
  if (diff > 0) return inverse ? "#ef4444" : "#22c55e";
  if (diff < 0) return inverse ? "#22c55e" : "#ef4444";
  return "var(--color-text-secondary)";
};

const PERIOD_OPTIONS = [
  { label: "Hôm nay", value: "today" },
  { label: "Tuần này", value: "thisWeek" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Năm nay", value: "thisYear" },
  { label: "Tùy chọn", value: "custom" },
];

const PREV_PERIOD_OPTIONS = [
  { label: "Hôm qua", value: "yesterday" },
  { label: "Tuần trước", value: "lastWeek" },
  { label: "Tháng trước", value: "lastMonth" },
  { label: "Năm trước", value: "lastYear" },
  { label: "Tùy chọn", value: "custom" },
];

const OrderOverview = ({
  current = {},
  previous = {},
  currentSizeStats = {},
  previousSizeStats = {},
  trendData = {},
  naturalPreviousStats = {},
  naturalPrevLabel = "Hôm qua",
  loading = false,
  compare = false,
  currentPeriod = "today",
  previousPeriod = "yesterday",
  currentSizePeriod = "today",
  previousSizePeriod = "yesterday",
  onCurrentPeriodChange,
  onPreviousPeriodChange,
  onCurrentSizePeriodChange,
  onPreviousSizePeriodChange,
  currentCustom = null,
  previousCustom = null,
  currentSizeCustom = null,
  previousSizeCustom = null,
  onCurrentCustomChange,
  onPreviousCustomChange,
  onCurrentSizeCustomChange,
  onPreviousSizeCustomChange,
  currentLabel = "Hôm nay",
  prevLabel = "Hôm qua",
  currentSizeLabel = "Hôm nay",
  prevSizeLabel = "Hôm qua",
}) => {
  // Main KPIs (Current)
  const {
    total = 0,
    new: newVal = 0,
    serving = 0,
    paid = 0,
    unpaid = 0,
  } = current;

  // Main KPIs (Previous)
  const prevTotal = previous.total ?? 0;
  const prevNew = previous.new ?? 0;
  const prevServing = previous.serving ?? 0;
  const prevPaid = previous.paid ?? 0;
  const prevUnpaid = previous.unpaid ?? 0;

  // Value & Size KPIs (Current)
  const {
    aov = 0,
    avgItems = 0,
    maxOrderVal = 0,
    maxOrderNo = "N/A",
    minOrderVal = 0,
    minOrderNo = "N/A",
  } = currentSizeStats;

  // Value & Size KPIs (Previous)
  const prevAov = previousSizeStats.aov ?? 0;
  const prevAvgItems = previousSizeStats.avgItems ?? 0;
  const prevMaxOrderVal = previousSizeStats.maxOrderVal ?? 0;
  const prevMaxOrderNo = previousSizeStats.maxOrderNo ?? "N/A";
  const prevMinOrderVal = previousSizeStats.minOrderVal ?? 0;
  const prevMinOrderNo = previousSizeStats.minOrderNo ?? "N/A";

  // Horizontal Stacked Bar Math (Current)
  const sumStatuses = newVal + serving + paid + unpaid || 1;
  const newPct = Math.round((newVal / sumStatuses) * 100);
  const servingPct = Math.round((serving / sumStatuses) * 100);
  const paidPct = Math.round((paid / sumStatuses) * 100);
  const unpaidPct = 100 - newPct - servingPct - paidPct; // Ensure sum is exactly 100%

  const formatVND = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

  const kpisCurrent = [
    {
      title: "Tổng đơn hàng (Total)",
      value: total,
      prevValue: prevTotal,
      icon: <ShoppingCartOutlined style={{ fontSize: 24, color: "#3b82f6" }} />,
      tooltip: "Ý nghĩa: Tất cả hóa đơn đã khởi tạo (bao gồm cả chưa thanh toán).",
    },
    {
      title: "Đơn hàng mới (New)",
      value: newVal,
      prevValue: prevNew,
      icon: <PlusCircleOutlined style={{ fontSize: 24, color: "#a855f7" }} />,
      tooltip: "Ý nghĩa: Khách vừa đặt bàn hoặc gọi món mới chưa qua chế biến.",
    },
    {
      title: "Đang phục vụ (Serving)",
      value: serving,
      prevValue: prevServing,
      icon: <SyncOutlined spin={!loading && serving > 0} style={{ fontSize: 22, color: "#eab308" }} />,
      tooltip: "Ý nghĩa: Khách đang ăn uống hoặc bếp đang làm món.",
    },
    {
      title: "Đã thanh toán (Paid)",
      value: paid,
      prevValue: prevPaid,
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: "#22c55e" }} />,
      tooltip: "Ý nghĩa: Doanh thu thực tế đã ghi nhận vào két.",
    },
    {
      title: "Chưa thanh toán (Unpaid)",
      value: unpaid,
      prevValue: prevUnpaid,
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: "#ef4444" }} />,
      tooltip: "Ý nghĩa: Bàn chuẩn bị thanh toán hoặc có công nợ.",
    },
  ];

  const kpisPrevious = [
    {
      title: "Tổng đơn hàng (Total)",
      value: prevTotal,
      icon: <ShoppingCartOutlined style={{ fontSize: 24, color: "#94a3b8" }} />,
      tooltip: "Ý nghĩa: Tổng số lượng đơn hàng phát sinh trong kỳ so sánh.",
    },
    {
      title: "Đơn hàng mới (New)",
      value: prevNew,
      icon: <PlusCircleOutlined style={{ fontSize: 24, color: "#94a3b8" }} />,
      tooltip: "Ý nghĩa: Đơn hàng chuẩn bị bếp trong kỳ so sánh.",
    },
    {
      title: "Đang phục vụ (Serving)",
      value: prevServing,
      icon: <SyncOutlined style={{ fontSize: 22, color: "#94a3b8" }} />,
      tooltip: "Ý nghĩa: Đơn hàng đang được dọn lên trong kỳ so sánh.",
    },
    {
      title: "Đã thanh toán (Paid)",
      value: prevPaid,
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: "#94a3b8" }} />,
      tooltip: "Ý nghĩa: Hóa đơn đã thanh toán hoàn thành trong kỳ so sánh.",
    },
    {
      title: "Chưa thanh toán (Unpaid)",
      value: prevUnpaid,
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: "#94a3b8" }} />,
      tooltip: "Ý nghĩa: Bàn chưa thực hiện thanh toán hóa đơn trong kỳ so sánh.",
    },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 1. Horizontal Stacked Bar (At the top of Section 1) */}
      <Card
        bordered={false}
        loading={loading}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              📊 Vòng đời Trạng thái Đơn hàng (Order Lifecycle Status) — Kỳ hiện tại — {currentLabel}
            </span>
            <Popover
              content={
                <div style={{ maxWidth: 300 }}>
                  <p><strong>Ý nghĩa:</strong> Thanh phân tích hiển thị tỷ lệ phần trăm giữa các trạng thái đơn hàng hiện tại.</p>
                  <p><strong>Cách đọc:</strong> Nhìn tỷ lệ màu sắc đại diện cho Mới (Tím), Đang phục vụ (Vàng), Đã thanh toán (Xanh lá), Chưa thanh toán (Đỏ) để nắm bắt nhanh luồng vận hành của quán.</p>
                </div>
              }
              title="💡 Hướng dẫn trạng thái đơn"
              trigger="click"
            >
              <QuestionCircleOutlined style={{ color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }} />
            </Popover>
          </div>
        }
        style={{
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--color-border)",
          marginBottom: 20,
        }}
        styles={{ body: { padding: "16px 24px" } }}
      >
        <div style={{ display: "flex", height: 18, borderRadius: 9, overflow: "hidden", background: "var(--color-border)", margin: "8px 0" }}>
          {newVal > 0 && (
            <Tooltip title={`Mới: ${newVal} đơn (${newPct}%)`}>
              <div style={{ width: `${newPct}%`, background: "#a855f7", transition: "all 0.3s" }} />
            </Tooltip>
          )}
          {serving > 0 && (
            <Tooltip title={`Đang phục vụ: ${serving} đơn (${servingPct}%)`}>
              <div style={{ width: `${servingPct}%`, background: "#eab308", transition: "all 0.3s" }} />
            </Tooltip>
          )}
          {paid > 0 && (
            <Tooltip title={`Đã thanh toán: ${paid} đơn (${paidPct}%)`}>
              <div style={{ width: `${paidPct}%`, background: "#22c55e", transition: "all 0.3s" }} />
            </Tooltip>
          )}
          {unpaid > 0 && (
            <Tooltip title={`Chưa thanh toán: ${unpaid} đơn (${unpaidPct}%)`}>
              <div style={{ width: `${unpaidPct}%`, background: "#ef4444", transition: "all 0.3s" }} />
            </Tooltip>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#a855f7" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>Mới: <strong>{newVal}</strong> ({newPct}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>Đang phục vụ: <strong>{serving}</strong> ({servingPct}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>Đã thanh toán: <strong>{paid}</strong> ({paidPct}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>Chưa thanh toán: <strong>{unpaid}</strong> ({unpaidPct}%)</span>
          </div>
        </div>
      </Card>

      {/* 2. 5 Main KPIs Container — Current Period */}
      <Card
        bordered={false}
        loading={loading}
        style={{
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--color-border)",
          marginBottom: 20,
          background: "var(--color-surface)",
        }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span>Kỳ hiện tại — {currentLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Segmented
              size="small"
              value={currentPeriod}
              onChange={onCurrentPeriodChange}
              options={PERIOD_OPTIONS}
            />
            {currentPeriod === "custom" && (
              <RangePicker
                size="small"
                value={currentCustom}
                onChange={onCurrentCustomChange}
                style={{ width: 200 }}
                format="DD/MM/YYYY"
              />
            )}
          </div>
        </div>

        <Row gutter={[12, 12]}>
          {kpisCurrent.map((k, i) => (
            <Col xs={24} sm={12} md={8} lg={{ flex: "1 1 0%" }} key={i}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: 10,
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  height: 110,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 550 }}>
                    {k.title.split(" (")[0]}
                  </span>
                  <Tooltip title={k.tooltip}>
                    <QuestionCircleOutlined style={{ fontSize: 10, color: "var(--color-text-secondary)", cursor: "pointer" }} />
                  </Tooltip>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", lineHeight: "28px" }}>
                    {k.value.toLocaleString()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, marginTop: 2 }}>
                    <span style={{ fontWeight: 700, color: getChangeColor(k.value, k.prevValue) }}>
                      {getChangeText(k.value, k.prevValue)}
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>vs {prevLabel}</span>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 3. 5 Main KPIs Container — Previous Period */}
      {compare && (
        <Card
          bordered={false}
          loading={loading}
          style={{
            borderRadius: 12,
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--color-border)",
            marginBottom: 24,
            background: "var(--color-surface)",
          }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} />
              <span>Kỳ trước — {prevLabel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Segmented
                size="small"
                value={previousPeriod}
                onChange={onPreviousPeriodChange}
                options={PREV_PERIOD_OPTIONS}
              />
              {previousPeriod === "custom" && (
                <RangePicker
                  size="small"
                  value={previousCustom}
                  onChange={onPreviousCustomChange}
                  style={{ width: 200 }}
                  format="DD/MM/YYYY"
                />
              )}
            </div>
          </div>

          <Row gutter={[12, 12]}>
            {kpisPrevious.map((k, i) => (
              <Col xs={24} sm={12} md={8} lg={{ flex: "1 1 0%" }} key={i}>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: 10,
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    height: 110,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 550 }}>
                      {k.title.split(" (")[0]}
                    </span>
                    <Tooltip title={k.tooltip}>
                      <QuestionCircleOutlined style={{ fontSize: 10, color: "var(--color-text-secondary)", cursor: "pointer" }} />
                    </Tooltip>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text-secondary)", lineHeight: "28px" }}>
                      {k.value.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 2 }}>
                      Dữ liệu kỳ trước
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 4. Order Trend Chart (Directly below Kỳ trước — Hôm qua) */}
      <OrderTrendChart
        trendData={trendData}
        currentStats={current}
        previousStats={previous}
        naturalPreviousStats={naturalPreviousStats}
        naturalPrevLabel={naturalPrevLabel}
        loading={loading}
        compare={compare}
        currentPeriod={currentPeriod}
        currentLabel={currentLabel}
        prevLabel={prevLabel}
      />

      {/* 5. 4 Small KPI Cards Container — Current Period */}
      <Card
        bordered={false}
        loading={loading}
        style={{
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--color-border)",
          marginBottom: 20,
          background: "var(--color-surface)",
        }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span>Giá trị & Quy mô đơn hàng — Kỳ hiện tại — {currentSizeLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Segmented
              size="small"
              value={currentSizePeriod}
              onChange={onCurrentSizePeriodChange}
              options={PERIOD_OPTIONS}
            />
            {currentSizePeriod === "custom" && (
              <RangePicker
                size="small"
                value={currentSizeCustom}
                onChange={onCurrentSizeCustomChange}
                style={{ width: 200 }}
                format="DD/MM/YYYY"
              />
            )}
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: 16, borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", height: 110 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                Giá trị Đơn hàng Trung bình (AOV)
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)" }}>
                {formatVND(aov)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: getChangeColor(aov, prevAov) }}>
                  {getChangeText(aov, prevAov)}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>vs {prevSizeLabel}</span>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: 16, borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", height: 110 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                Số món trung bình / Đơn hàng
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)" }}>
                {avgItems.toFixed(1)} món
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: getChangeColor(avgItems, prevAvgItems) }}>
                  {getChangeText(avgItems, prevAvgItems)}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>vs {prevSizeLabel}</span>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: 16, borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", height: 110 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                Đơn hàng cao nhất (Highest)
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>
                {formatVND(maxOrderVal)}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                Mã đơn: <strong style={{ color: "var(--color-text)" }}>{maxOrderNo}</strong>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: 16, borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", height: 110 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                Đơn hàng thấp nhất (Lowest)
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>
                {formatVND(minOrderVal)}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                Mã đơn: <strong style={{ color: "var(--color-text)" }}>{minOrderNo}</strong>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 6. 4 Small KPI Cards Container — Previous Period */}
      {compare && (
        <Card
          bordered={false}
          loading={loading}
          style={{
            borderRadius: 12,
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--color-border)",
            marginBottom: 20,
            background: "var(--color-surface)",
          }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} />
              <span>Giá trị & Quy mô đơn hàng — Kỳ trước — {prevSizeLabel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Segmented
                size="small"
                value={previousSizePeriod}
                onChange={onPreviousSizePeriodChange}
                options={PREV_PERIOD_OPTIONS}
              />
              {previousSizePeriod === "custom" && (
                <RangePicker
                  size="small"
                  value={previousSizeCustom}
                  onChange={onPreviousSizeCustomChange}
                  style={{ width: 200 }}
                  format="DD/MM/YYYY"
                />
              )}
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 10, background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", height: 110 }}>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                  Giá trị Đơn hàng Trung bình (AOV)
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-secondary)" }}>
                  {formatVND(prevAov)}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                  Dữ liệu kỳ trước
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 10, background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", height: 110 }}>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                  Số món trung bình / Đơn hàng
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-secondary)" }}>
                  {prevAvgItems.toFixed(1)} món
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                  Dữ liệu kỳ trước
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 10, background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", height: 110 }}>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                  Đơn hàng cao nhất (Highest)
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#94a3b8" }}>
                  {formatVND(prevMaxOrderVal)}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                  Mã đơn: <strong style={{ color: "var(--color-text-secondary)" }}>{prevMaxOrderNo}</strong>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 10, background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", height: 110 }}>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
                  Đơn hàng thấp nhất (Lowest)
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#94a3b8" }}>
                  {formatVND(prevMinOrderVal)}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                  Mã đơn: <strong style={{ color: "var(--color-text-secondary)" }}>{prevMinOrderNo}</strong>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default OrderOverview;
