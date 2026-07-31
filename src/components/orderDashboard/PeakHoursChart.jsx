import React from "react";
import { Card, Row, Col, Tooltip, Popover } from "antd";
import { QuestionCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";

const formatVND = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

const PeakHoursChart = ({
  peakHours = [],
  heatmapData = [],
  peakHourStats = {},
  loading = false,
  currentLabel = "Kỳ hiện tại",
}) => {
  // Peak Hour Card values
  const {
    peakHour = "Chưa có",
    peakHourCount = 0,
    peakHourRevenue = 0,
  } = peakHourStats;

  // Extract unique dishes and hours for Heatmap Grid
  const dishes = Array.from(new Set(heatmapData.map((d) => d.dish)));
  const hours = Array.from(new Set(heatmapData.map((d) => d.hour)));

  // Find max value in heatmap to calculate relative opacity
  const maxVal = Math.max(...heatmapData.map((d) => d.val), 1);

  const getHeatmapColor = (dish, hour) => {
    const entry = heatmapData.find((d) => d.dish === dish && d.hour === hour);
    const val = entry ? entry.val : 0;
    if (val === 0) return { bg: "var(--color-bg)", text: "var(--color-text-secondary)", val };
    const ratio = val / maxVal;
    const opacity = 0.15 + ratio * 0.8;
    return {
      bg: `rgba(59, 130, 246, ${opacity})`,
      text: opacity > 0.65 ? "#fff" : "var(--color-text)",
      val,
    };
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Peak Hours Column Chart */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            loading={loading}
            title={
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>🕐 Khung giờ Cao điểm (Peak Hours)</span>
                  <Popover
                    content={
                      <div style={{ maxWidth: 300 }}>
                        <p><strong>Ý nghĩa:</strong> Thống kê số lượng đơn hàng theo từng khung giờ trong ngày.</p>
                        <p><strong>Cách đọc:</strong> Khung giờ nào có cột cao nhất chứng tỏ đó là thời điểm lượng khách tập trung đông nhất trong ngày.</p>
                      </div>
                    }
                    title="💡 Hướng dẫn khung giờ vàng"
                    trigger="click"
                  >
                    <QuestionCircleOutlined style={{ color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }} />
                  </Popover>
                </div>
                <div style={{ fontSize: 11, fontWeight: 550, color: "var(--color-text-secondary)" }}>
                  Kỳ báo cáo: <strong>{currentLabel}</strong>
                </div>
              </div>
            }
            style={{
              borderRadius: 12,
              boxShadow: "var(--shadow-sm)",
              border: "1px solid var(--color-border)",
              height: "100%",
            }}
          >
            {peakHours.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={peakHours} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <ChartTooltip
                    formatter={(v) => [`${v} đơn`, "Số lượng đơn"]}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      boxShadow: "var(--shadow-md)",
                    }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Heatmap Grid & Peak Hour KPI summary */}
        <Col xs={24} lg={12}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
            {/* Peak Hour Statistics Card */}
            <Card
              bordered={false}
              loading={loading}
              style={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "#fff",
              }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ClockCircleOutlined style={{ fontSize: 20, color: "#3b82f6" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>TỔNG QUAN GIỜ CAO ĐIỂM</span>
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 550 }}>
                  Kỳ báo cáo: {currentLabel}
                </span>
              </div>
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Giờ cao điểm nhất</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: "#3b82f6" }}>{peakHour}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Số đơn trung bình</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: "#fff" }}>{peakHourCount} đơn</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Doanh thu dự kiến</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: "#22c55e" }}>{formatVND(peakHourRevenue)}</div>
                </Col>
              </Row>
            </Card>

            {/* Heat-style Grid Card */}
            <Card
              bordered={false}
              loading={loading}
              title={
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>🔥 Mật độ Gọi món theo Giờ (Dishes by Hour Heatmap)</span>
                    <Popover
                      content={
                        <div style={{ maxWidth: 300 }}>
                          <p><strong>Ý nghĩa:</strong> Biểu thị tần suất/số lượng món ăn được gọi theo từng khung giờ cụ thể.</p>
                          <p><strong>Cách đọc:</strong> Ô càng đậm màu xanh thể hiện món ăn đó được gọi càng nhiều trong khung giờ tương ứng.</p>
                        </div>
                      }
                      title="💡 Hướng dẫn bản đồ nhiệt món ăn"
                      trigger="click"
                    >
                      <QuestionCircleOutlined style={{ color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }} />
                    </Popover>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 550, color: "var(--color-text-secondary)" }}>
                    Kỳ báo cáo: <strong>{currentLabel}</strong>
                  </div>
                </div>
              }
              style={{
                borderRadius: 12,
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
                flexGrow: 1,
              }}
              styles={{ body: { padding: 12 } }}
            >
              {heatmapData.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
                  Chưa có dữ liệu
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 6, fontWeight: 650, color: "var(--color-text-secondary)" }}>Tên Món</th>
                        {hours.map((h, i) => (
                          <th key={i} style={{ textAlign: "center", padding: 6, fontWeight: 650, color: "var(--color-text-secondary)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dishes.map((dish, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, padding: 6, width: 140, color: "var(--color-text)" }}>{dish}</td>
                          {hours.map((hour, hIdx) => {
                            const { bg, text, val } = getHeatmapColor(dish, hour);
                            return (
                              <td key={hIdx} style={{ padding: 0 }}>
                                <Tooltip title={`${dish} vào lúc ${hour}: ${val} phần`}>
                                  <div
                                    style={{
                                      background: bg,
                                      color: text,
                                      textAlign: "center",
                                      padding: "8px 4px",
                                      borderRadius: 6,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      transition: "transform 0.2s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                  >
                                    {val}
                                  </div>
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PeakHoursChart;
