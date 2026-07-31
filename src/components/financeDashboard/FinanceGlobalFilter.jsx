import { Segmented, DatePicker, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { FINANCE_FILTERS } from "./constants";

const { RangePicker } = DatePicker;

const FinanceGlobalFilter = ({
  value = "thisMonth",
  onChange,
  customDates = null,
  onCustomDatesChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "12px 16px",
        background: "var(--color-surface)",
        borderRadius: 10,
        border: "1px solid var(--color-border)",
      }}
    >
      <Tooltip title="Chọn khoảng thời gian để lọc toàn bộ Dashboard — tất cả KPI, biểu đồ và bảng sẽ cập nhật theo">
        <QuestionCircleOutlined
          style={{ color: "var(--color-text-secondary)", fontSize: 14 }}
        />
      </Tooltip>
      <Segmented
        value={value}
        onChange={onChange}
        options={FINANCE_FILTERS.map((f) => ({
          label: f.label,
          value: f.value,
        }))}
        size="middle"
      />
      {value === "custom" && (
        <RangePicker
          value={customDates}
          onChange={onCustomDatesChange}
          size="middle"
          style={{ marginLeft: 4 }}
        />
      )}
    </div>
  );
};

export default FinanceGlobalFilter;
