import React, { useState, useEffect, useCallback } from 'react';
import { Popover, Badge, Button, List, Spin, Avatar, Typography, Divider } from 'antd';
import { BellOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../context/BranchContext';
import { useSignalR } from '../context/SignalRContext';
import { useAuth } from '../context/AuthContext';
import { getRecentNotifications, getUnreadCount, markAsRead } from '../api/notificationApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

const NotificationBell = ({ collapsed }) => {
  const [visible, setVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const { currentBranchId, branches } = useBranch();
  const { role } = useAuth();
  const connection = useSignalR();
  const navigate = useNavigate();

  // Load số lượng chưa đọc và thông báo gần nhất
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const countRes = await getUnreadCount(currentBranchId);
      setUnreadCount(countRes.count);

      const recentRes = await getRecentNotifications(currentBranchId);
      setNotifications(recentRes);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Đăng ký nhận thông báo Realtime qua SignalR
  useEffect(() => {
    if (connection) {
      const handleReceive = (payload) => {
        // Kiểm tra xem thông báo có thuộc chi nhánh hiện tại không (hoặc đang xem All Branches - currentBranchId = null)
        const isBelongsToBranch = !currentBranchId || payload.branchId === currentBranchId;
        
        if (isBelongsToBranch) {
          // Tăng badge unread
          setUnreadCount((prev) => prev + 1);
          // Tải lại danh sách
          loadData();
        }
      };

      connection.on('ReceiveNotification', handleReceive);
      return () => {
        connection.off('ReceiveNotification', handleReceive);
      };
    }
  }, [connection, currentBranchId, loadData]);

  const handleItemClick = async (item) => {
    try {
      if (!item.isRead) {
        await markAsRead(item.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
      setVisible(false);

      if (item.redirectUrl) {
        navigate(item.redirectUrl);
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái đọc:', err);
    }
  };

  const getNotifIcon = (type, isImportant) => {
    if (isImportant) return <Avatar style={{ backgroundColor: '#fff1f0', color: '#ff4d4f' }}>🔴</Avatar>;
    
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

  const popoverContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
        <Text strong style={{ fontSize: 16 }}>Thông báo mới nhận</Text>
        {unreadCount > 0 && <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />}
      </div>
      <Divider style={{ margin: '4px 0' }} />
      
      {loading && notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin size="small" /></div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 8px', color: '#8c8c8c' }}>
          <MessageOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
          Không có thông báo mới nào hôm nay.
        </div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '0 8px' }}>
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleItemClick(item)}
                style={{
                  cursor: 'pointer',
                  padding: '10px 8px',
                  borderRadius: 6,
                  transition: 'background 0.2s',
                  backgroundColor: item.isRead ? 'transparent' : '#f0f9ff',
                  marginBottom: 4,
                  borderBottom: '1px solid #f0f0f0'
                }}
                className="notif-item-hover"
              >
                <List.Item.Meta
                  avatar={getNotifIcon(item.type, item.isImportant)}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text strong={!item.isRead} style={{ fontSize: 13, color: '#262626', pr: 8 }}>
                        {item.title}
                      </Text>
                      {!item.isRead && <span style={{ width: 8, height: 8, backgroundColor: '#1890ff', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>
                        {item.message}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c8c8c' }}>
                        <span>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {dayjs(item.createdAt).fromNow()}
                        </span>
                        {!currentBranchId && item.branchName && (
                          <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                            {item.branchName}
                          </span>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
      
      <Divider style={{ margin: '4px 0' }} />
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <Button
          type="link"
          size="small"
          onClick={() => {
            setVisible(false);
            navigate('/notifications');
          }}
          style={{ width: '100%', fontWeight: 600 }}
        >
          Xem tất cả thông báo
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      title={null}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="rightTop"
      overlayClassName="notif-bell-popover"
      overlayStyle={{ zIndex: 1050 }}
    >
      <div className={`sidebar-notif-bell-wrapper ${collapsed ? 'collapsed' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Badge count={unreadCount} overflowCount={99} size="small" offset={[2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />}
            className="sidebar-notif-btn"
            title="Thông báo"
          />
        </Badge>
      </div>
    </Popover>
  );
};

export default NotificationBell;
