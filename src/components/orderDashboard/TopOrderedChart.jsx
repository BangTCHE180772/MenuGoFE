import React from "react";
import { Card, Row, Col, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";

const TopOrderedChart = ({
  monthlyTop = [],
  monthlyLeast = [],
  topDishName = "Món chủ lực",
  leastDishName = "Món bán chậm",
  loading = false,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Most Ordered Dish by Month */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            loading={loading}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  📈 Món Bán chạy nhất theo Tháng: <strong style={{ color: "#22c55e" }}>{topDishName}</strong>
                </span>
                <Popover
                  content={
                    <div style={{ maxWidth: 300 }}>
                      <p><strong>Tên món:</strong> {topDishName}</p>
                      <p><strong>Ý nghĩa:</strong> Thống kê sản lượng tiêu thụ của món ăn bán chạy số một qua từng tháng (T1 = Tháng 1, T2 = Tháng 2, ...).</p>
                      <p><strong>Cách đọc:</strong> Hover vào cột **T1** thấy **320 phần** nghĩa là trong Tháng 1, món bán chạy nhất này đạt doanh số 320 suất bán.</p>
                    </div>
                  }
                  title="💡 Món bán chạy nhất theo tháng"
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
            }}
          >
            {monthlyTop.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyTop} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <ChartTooltip
                    formatter={(v) => [`${v} phần/suất`, `Món: ${topDishName}`]}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      boxShadow: "var(--shadow-md)",
                    }}
                  />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Least Ordered Dish by Month */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            loading={loading}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  📉 Món ít được gọi nhất theo Tháng: <strong style={{ color: "#ef4444" }}>{leastDishName}</strong>
                </span>
                <Popover
                  content={
                    <div style={{ maxWidth: 300 }}>
                      <p><strong>Tên món:</strong> {leastDishName}</p>
                      <p><strong>Ý nghĩa:</strong> Thống kê sản lượng của những món ăn/đồ uống bán chậm nhất theo từng tháng (T1 = Tháng 1, T2 = Tháng 2, ...).</p>
                      <p><strong>Cách đọc:</strong> Hover vào cột **T1** thấy **15 phần** nghĩa là trong Tháng 1, món bán chậm nhất này chỉ bán được vỏn vẹn 15 suất.</p>
                    </div>
                  }
                  title="💡 Món bán ít nhất theo tháng"
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
            }}
          >
            {monthlyLeast.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyLeast} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <ChartTooltip
                    formatter={(v) => [`${v} phần/suất`, `Món: ${leastDishName}`]}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      boxShadow: "var(--shadow-md)",
                    }}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TopOrderedChart;
