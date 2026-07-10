/**
 * TablePanel — Panel danh sách bàn (cột trái)
 * Hiển thị grid bàn với 4 trạng thái màu sắc rõ ràng:
 *   🟢 Trống | 🔵 Đặt bàn | 🟠 Có khách | 🔴 Dọn dẹp
 */
import { Spin } from 'antd';
import { getStatusConfig, TABLE_STATUS_CONFIG } from '../../data/tableConstants';

const TablePanel = ({ tables, selectedTable, onSelectTable, loading }) => {
  return (
    <aside className="pos-table-panel">
      {/* Header */}
      <div className="pos-table-panel-header">
        <div className="pos-table-panel-title">
          <span className="pos-table-panel-icon"></span>
          <span>Sơ đồ bàn</span>
        </div>
        <span className="pos-table-count">{tables.length} bàn</span>
      </div>

      {/* Legend */}
      <div className="pos-table-legend">
        {Object.entries(TABLE_STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="pos-legend-item">
            <span className="pos-legend-dot" style={{ background: cfg.dotColor }} />
            <span className="pos-legend-label">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Table Grid */}
      {loading ? (
        <div className="pos-table-loading">
          <Spin size="small" />
          <span>Đang tải...</span>
        </div>
      ) : (
        <div className="pos-table-grid">
          {tables.map((table) => {
            const cfg = getStatusConfig(table.status);
            const isSelected = selectedTable?.id === table.id;
            return (
              <button
                key={table.id}
                className={`pos-table-card ${isSelected ? 'pos-table-card--selected' : ''}`}
                style={{
                  '--t-color': cfg.textColor,
                  '--t-bg': cfg.bg,
                  '--t-border': cfg.border,
                  '--t-dot': cfg.dotColor,
                }}
                onClick={() => onSelectTable(table)}
                title={`${table.name} — ${cfg.label}`}
              >
                <div className="pos-table-card-name">{table.name}</div>
                <div
                  className="pos-table-card-badge"
                  style={{ color: cfg.textColor, background: cfg.bg, borderColor: cfg.border }}
                >
                  <span className="pos-table-card-dot" style={{ background: cfg.dotColor }} />
                  {cfg.label}
                </div>
              </button>
            );
          })}

          {tables.length === 0 && (
            <div className="pos-table-empty">
              <span></span>
              <p>Chưa có bàn nào</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default TablePanel;
