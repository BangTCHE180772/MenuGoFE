import { useState, useEffect, useCallback, useMemo } from 'react';
import { message, Spin, Select } from 'antd';
import { getAllTables, getTablesByBranch } from '../api/tableApi';
import { getAllBranches } from '../api/branchApi';
import { getTableOrderSummary, confirmOrderItem, updateCookingStatus } from '../api/tableMapApi';
import { cancelOrderDetail } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import { useSignalR } from '../context/SignalRContext';
import { getStatusConfig } from '../data/tableConstants';
import TableDetailPanel from '../components/tablemap/TableDetailPanel';
import '../styles/tablemap.css';

const TableMapPage = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedArea, setSelectedArea] = useState('all');
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);

  const { user } = useAuth();
  const connection = useSignalR();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await getAllBranches();
        const allBranches = res.data;
        
        let availableBranches = allBranches;
        if (user?.branchIds && user.branchIds.length > 0) {
          availableBranches = allBranches.filter(b => user.branchIds.includes(b.id));
        }
        
        setBranches(availableBranches);
        if (availableBranches.length > 0) {
          setSelectedBranch(availableBranches[0].id);
        }
      } catch (err) {
        message.error('Lỗi khi tải danh sách chi nhánh');
      }
    };
    fetchBranches();
  }, [user]);

  const loadTables = useCallback(async () => {
    if (!selectedBranch && branches.length > 0) return; // Wait until branch is selected
    setLoadingTables(true);
    try {
      const res = selectedBranch 
        ? await getTablesByBranch([selectedBranch])
        : await getAllTables();
      const data = res?.data;
      setTables(Array.isArray(data) ? data : []);
    } catch {
      message.error('Không thể tải danh sách bàn. Kiểm tra kết nối server.');
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  }, [selectedBranch, branches.length]);

  const loadOrderSummary = useCallback(async (tableId) => {
    setLoadingSummary(true);
    try {
      const res = await getTableOrderSummary(tableId);
      setOrderSummary(res.data);
      
      setTables(prev => prev.map(t => {
        if (t.id === tableId) {
          return { 
            ...t, 
            pendingCount: res.data.pendingConfirmCount,
            readyCount: res.data.readyToServeCount
          };
        }
        return t;
      }));
    } catch (err) {
      console.error(err);
      setOrderSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (connection) {
      const handleNotification = (data) => {
        if (data.tableId) {
          if (data.type === 'Payment') {
            loadTables();
          } else {
            setTables(prev => prev.map(t => {
              if (t.id === data.tableId) {
                return { ...t, isBlinking: true };
              }
              return t;
            }));
          }
          
          if (selectedTable?.id === data.tableId) {
            loadOrderSummary(data.tableId);
          }
        }
      };
      connection.on('ReceiveNotification', handleNotification);
      return () => connection.off('ReceiveNotification', handleNotification);
    }
  }, [connection, selectedTable, loadTables, loadOrderSummary]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    loadOrderSummary(table.id);
    setTables(prev => prev.map(t => t.id === table.id ? { ...t, isBlinking: false } : t));
  };

  const handleConfirmItem = async (orderDetailId) => {
    try {
      await confirmOrderItem(orderDetailId);
      message.success('Đã xác nhận món!');
      if (selectedTable) loadOrderSummary(selectedTable.id);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Xác nhận thất bại');
    }
  };

  const handleRejectItem = async (orderDetailId) => {
    try {
      await cancelOrderDetail(orderDetailId);
      message.success('Đã từ chối món!');
      if (selectedTable) loadOrderSummary(selectedTable.id);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Từ chối thất bại');
    }
  };

  const handleServeItem = async (orderDetailId) => {
    try {
      await updateCookingStatus(orderDetailId, 'Served');
      message.success('Đã phục vụ!');
      if (selectedTable) loadOrderSummary(selectedTable.id);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const areas = useMemo(() => {
    const areaMap = new Map();
    tables.forEach((t) => {
      if (t.areaId && t.areaName && !areaMap.has(t.areaId)) {
        areaMap.set(t.areaId, { id: t.areaId, name: t.areaName });
      }
    });
    return Array.from(areaMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (selectedArea === 'all') return tables;
    return tables.filter((t) => t.areaId === selectedArea);
  }, [tables, selectedArea]);

  return (
    <div className="tablemap-page">
      <div className="tablemap-left-col">
        <div className="tablemap-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h2>Sơ đồ Bàn</h2>
            {branches.length > 0 && (
              <Select
                style={{ width: 200 }}
                value={selectedBranch}
                onChange={val => setSelectedBranch(val)}
                placeholder="Chọn chi nhánh"
              >
                {branches.map(b => (
                  <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                ))}
              </Select>
            )}
          </div>
          <div className="tablemap-area-tabs">
            <button
              className={`tablemap-tab ${selectedArea === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedArea('all')}
            >
              Tất cả
            </button>
            {areas.map((area) => (
              <button
                key={area.id}
                className={`tablemap-tab ${selectedArea === area.id ? 'active' : ''}`}
                onClick={() => setSelectedArea(area.id)}
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>

        {loadingTables ? (
          <div className="tablemap-loading-full">
            <Spin size="large" />
            <p>Đang tải sơ đồ bàn...</p>
          </div>
        ) : (
          <div className="tablemap-grid">
            {filteredTables.map(table => {
              const cfg = getStatusConfig(table.status);
              const isSelected = selectedTable?.id === table.id;
              
              const badgeCount = (table.pendingCount || 0) + (table.readyCount || 0);
              const hasAlert = badgeCount > 0;

              return (
                <div
                  key={table.id}
                  className={`tablemap-card ${isSelected ? 'selected' : ''} ${hasAlert ? 'has-alert' : ''} ${table.isBlinking ? 'blinking' : ''}`}
                  style={{
                    borderColor: cfg.border,
                    backgroundColor: cfg.bg,
                    color: cfg.textColor
                  }}
                  onClick={() => handleSelectTable(table)}
                >
                  <div className="tablemap-card-name">{table.name}</div>
                  <div className="tablemap-card-status">
                    <span className="dot" style={{ backgroundColor: cfg.dotColor }}></span>
                    {cfg.label}
                  </div>
                  
                  {hasAlert && (
                    <div className="tablemap-card-badge">
                      {badgeCount}
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredTables.length === 0 && (
              <div className="tablemap-empty">Không có bàn nào</div>
            )}
          </div>
        )}
      </div>

      <div className="tablemap-right-col">
        <TableDetailPanel 
          table={selectedTable} 
          summary={orderSummary} 
          loading={loadingSummary}
          onConfirm={handleConfirmItem}
          onReject={handleRejectItem}
          onServe={handleServeItem}
          tables={tables}
          onPaymentSuccess={(tableId) => {
            loadTables();
            loadOrderSummary(tableId);
          }}
        />
      </div>
    </div>
  );
};

export default TableMapPage;
