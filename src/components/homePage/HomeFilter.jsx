import React from "react";
import { Card, DatePicker, Select, Button, Space, Typography } from "antd";
import { FilterOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { INITIAL_MOCK_EMPLOYEES } from "./homeMockData";

const { Text } = Typography;

/**
 * Component Sidebar Bộ Lọc Báo Cáo
 * Hỗ trợ chọn Ngày báo cáo, Chọn Nhân tạo và Nút Áp dụng / Đặt lại
 */
const HomeFilter = ({
  selectedDate,
  onDateChange,
  selectedEmployee,
  onEmployeeChange,
  onApply,
  onReset,
  loading = false,
}) => {
  return (
    <Card
      title={
        <Space style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: 16 }}>
          <FilterOutlined />
          <span>Bộ lọc báo cáo</span>
        </Space>
      }
      bordered={false}
      style={{
        borderRadius: "var(--border-radius)",
        boxShadow: "var(--shadow-sm)",
        background: "var(--color-surface)",
      }}
      bodyStyle={{ padding: 18 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Filter Ngày */}
        <div>
          <Text strong style={{ display: "block", marginBottom: 6, color: "#374151" }}>
            Thời gian báo cáo
          </Text>
          <DatePicker
            value={selectedDate ? dayjs(selectedDate, "DD/MM/YYYY") : dayjs()}
            onChange={(date, dateString) => onDateChange(dateString || dayjs().format("DD/MM/YYYY"))}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{ width: "100%", borderRadius: 8, height: 38 }}
          />
        </div>

        {/* Filter Người tạo / Nhân viên */}
        <div>
          <Text strong style={{ display: "block", marginBottom: 6, color: "#374151" }}>
            Người tạo / Nhân viên
          </Text>
          <Select
            value={selectedEmployee || "all"}
            onChange={onEmployeeChange}
            options={INITIAL_MOCK_EMPLOYEES}
            style={{ width: "100%" }}
            size="large"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={onApply}
            block
            style={{
              height: 40,
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(232, 68, 42, 0.2)",
            }}
          >
            Áp dụng
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            block
            style={{
              height: 38,
              borderRadius: 8,
              color: "#4b5563",
            }}
          >
            Đặt lại
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HomeFilter;
