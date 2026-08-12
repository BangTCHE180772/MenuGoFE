import React, { useState, useEffect, useCallback } from 'react';
import {
  Breadcrumb,
  Typography,
  Card,
  Input,
  Select,
  DatePicker,
  List,
  Tag,
  Button,
  Pagination,
  Empty,
  Skeleton,
  message,
  Space,
  Avatar
} from 'antd';
import {
  HomeOutlined,
  BellOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAsRead } from '../api/notificationApi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import '../styles/NotificationPage.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const NOTIFICATION_TYPES = [
  { value: 'All', label: 'Tất cả loại cảnh báo' },
  { value: 'Operational', label: 'Cảnh báo vận hành' },
  { value: 'ShelfLife', label: 'Hạn sử dụng nguyên liệu' },
  { value: 'Quality', label: 'Kiểm tra chất lượng & Hao hụt' },
  { value: 'Order', label: 'Hóa đơn & Đơn hàng' },
  { value: 'Inventory', label: 'Tồn kho nguyên liệu' },
  { value: 'Other', label: 'Cảnh báo khác' }
];

const DATE_PRESETS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: '7days', label: '7 ngày qua' },
  { value: '30days', label: '30 ngày qua' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'custom', label: 'Khoảng thời gian tự chọn' }
];

const NotificationPage = () => {
  const { currentBranchId, branches } = useBranch();
  const { role, user } = useAuth();
  const navigate = useNavigate();

  // Filters state
  const [datePreset, setDatePreset] = useState('today');
  const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [searchText, setSearchText] = useState('');
  
  // Data state
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Xử lý đổi Preset thời gian
  const handlePresetChange = (val) => {
    setDatePreset(val);
    const now = dayjs();
    if (val === 'today') {
      setDateRange([now.startOf('day'), now.endOf('day')]);
    } else if (val === 'yesterday') {
      const yesterday = now.subtract(1, 'day');
      setDateRange([yesterday.startOf('day'), yesterday.endOf('day')]);
    } else if (val === '7days') {
      setDateRange([now.subtract(6, 'day').startOf('day'), now.endOf('day')]);
    } else if (val === '30days') {
      setDateRange([now.subtract(29, 'day').startOf('day'), now.endOf('day')]);
    } else if (val === 'thisMonth') {
      setDateRange([now.startOf('month'), now.endOf('month')]);
    }
  };

  // Tải dữ liệu từ API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Xác định branchId để gửi lên API
      let branchIdParam = null;
      if (currentBranchId) {
        // Sidebar chọn branch cụ thể -> ép buộc lọc theo branch đó
        branchIdParam = currentBranchId;
      } else if (selectedBranch !== 'All') {
        // Sidebar chọn All Branches + Page chọn branch cụ thể
        branchIdParam = Number(selectedBranch);
      }

      const params = {
        branchId: branchIdParam,
        fromDate: dateRange[0]?.toISOString(),
        toDate: dateRange[1]?.toISOString(),
        type: selectedType === 'All' ? null : selectedType,
        search: searchText.trim() || null,
        page: currentPage,
        pageSize: pageSize
      };

      const res = await getNotifications(params);
      setNotifications(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử thông báo:', err);
      message.error(err.message || 'Không thể tải lịch sử thông báo.');
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, selectedBranch, dateRange, selectedType, searchText, currentPage, pageSize]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset page khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [currentBranchId, selectedBranch, datePreset, dateRange, selectedType, searchText]);

  const handleItemClick = async (item) => {
    try {
      if (!item.isRead) {
        await markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
      
      if (item.redirectUrl) {
        navigate(item.redirectUrl);
      }
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const getNotifIcon = (type, isImportant) => {
    if (isImportant) return <Avatar style={{ backgroundColor: '#fff1f0', color: '#ff4d4f' }} className="notif-pulse">🔴</Avatar>;

    switch (type) {
      case 'Inventory':
        return <Avatar style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}>📦</Avatar>;
      case 'Order':
        return <Avatar style={{ backgroundColor: '#f6ffed', color: '#52c41a' }}>🍽️</Avatar>;
      case 'Quality':
        return <Avatar style={{ backgroundColor: '#fff7e6', color: '#faad14' }}>🔍</Avatar>;
      case 'ShelfLife':
        return <Avatar style={{ backgroundColor: '#fff2e8', color: '#fa541c' }}>⏳</Avatar>;
      case 'Operational':
      default:
        return <Avatar style={{ backgroundColor: '#f9f0ff', color: '#722ed1' }}>⚠️</Avatar>;
    }
  };

  const getPriorityTag = (priority) => {
    if (priority === 'Critical') return <Tag color="error">Cực kỳ quan trọng</Tag>;
    if (priority === 'Warning') return <Tag color="warning">Cảnh báo</Tag>;
    return <Tag color="blue">Thông tin</Tag>;
  };

  return (
    <div className="notification-history-container">
      {/* ── BREADCRUMB ──────────────────────────────────────────────────────── */}
      <Breadcrumb style={{ marginBottom: 12 }}>
        <Breadcrumb.Item href="/home">
          <HomeOutlined /> Trang chủ
        </Breadcrumb.Item>
        <Breadcrumb.Item style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
          <BellOutlined /> Lịch sử thông báo
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="notif-header-section">
        <div className="notif-title-area">
          <Title level={3}>Nhật Ký Cảnh Báo & Thông Báo Hệ Thống</Title>
          <Text type="secondary">
            Xem lịch sử tất cả các cảnh báo tự động về kho nguyên liệu, hạn sử dụng, chấm công và chi phí vận hành chi tiết theo chi nhánh.
          </Text>
        </div>
      </div>

      {/* ── FILTER CARD ─────────────────────────────────────────────────────── */}
      <Card className="notif-filter-card">
        <div className="notif-filter-row">
          {/* Branch filter (Chỉ hiện nếu đang ở chế độ xem All Branches ở sidebar) */}
          {!currentBranchId && branches && branches.length > 0 && (
            <div className="notif-filter-item">
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Chi nhánh</span>
              <Select
                value={selectedBranch}
                onChange={setSelectedBranch}
                style={{ width: '100%' }}
                options={[
                  { value: 'All', label: 'Tất cả chi nhánh' },
                  ...branches.map((b) => ({ value: String(b.id), label: b.name }))
                ]}
              />
            </div>
          )}

          {/* Time range preset */}
          <div className="notif-filter-item">
            <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Mốc thời gian</span>
            <Select
              value={datePreset}
              onChange={handlePresetChange}
              style={{ width: '100%' }}
              options={DATE_PRESETS}
            />
          </div>

          {/* Custom Date Range Picker */}
          {datePreset === 'custom' && (
            <div className="notif-filter-item" style={{ minWidth: 280 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Khoảng ngày tự chọn</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [null, null])}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Type Category Filter */}
          <div className="notif-filter-item">
            <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Loại cảnh báo</span>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: '100%' }}
              options={NOTIFICATION_TYPES}
            />
          </div>

          {/* Search text */}
          <div className="notif-filter-item" style={{ minWidth: 240 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tìm kiếm nội dung</span>
            <Input
              placeholder="Nhập từ khóa tiêu đề, thông điệp..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
        </div>
      </Card>

      {/* ── NOTIFICATION LIST ───────────────────────────────────────────────── */}
      <Card className="notif-list-card">
        {loading && notifications.length === 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Skeleton avatar active paragraph={{ rows: 2 }} />
            <Skeleton avatar active paragraph={{ rows: 2 }} />
            <Skeleton avatar active paragraph={{ rows: 2 }} />
          </Space>
        ) : notifications.length === 0 ? (
          <Empty
            description={
              <div>
                <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 8 }}>
                  Không tìm thấy cảnh báo nào phù hợp.
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Không có cảnh báo hoạt động nào được ghi nhận tại chi nhánh trong khoảng thời gian đã chọn.
                </Text>
              </div>
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(item) => (
                <div
                  className={`notif-item ${item.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="notif-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {getNotifIcon(item.type, item.isImportant)}
                      <div>
                        <span className="notif-item-title">{item.title}</span>
                        {item.isImportant && (
                          <Tag className="notif-tag-important">Quan trọng</Tag>
                        )}
                        {getPriorityTag(item.priority)}
                      </div>
                    </div>
                    {!item.isRead && (
                      <span className="notif-unread-dot" />
                    )}
                  </div>
                  
                  <div className="notif-item-desc">
                    {item.message}
                  </div>

                  <div className="notif-item-meta">
                    <span className="notif-meta-point">
                      <ClockCircleOutlined />
                      {dayjs(item.createdAt).format('HH:mm - DD/MM/YYYY')} ({dayjs(item.createdAt).fromNow()})
                    </span>

                    {item.branchName && (
                      <span className="notif-meta-point" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        <ShopOutlined />
                        {item.branchName}
                      </span>
                    )}

                    {item.redirectUrl && (
                      <Button type="link" size="small" style={{ padding: 0, height: 'auto', fontSize: 12 }}>
                        Xem chi tiết & xử lý &rarr;
                      </Button>
                    )}
                  </div>
                </div>
              )}
            />

            {/* PAGINATION */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <Pagination
                current={currentPage}
                total={totalCount}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default NotificationPage;
