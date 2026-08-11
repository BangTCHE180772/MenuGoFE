import React, { useState, useEffect } from 'react';
import { Badge, Popover, List, Typography, Button, Space, Tag } from 'antd';
import { BellOutlined, CheckCircleOutlined, WarningOutlined, InfoCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getUnreadCount, getRecentNotifications, markAsRead } from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      if (res.data) {
        setUnreadCount(res.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getRecentNotifications();
      if (res.data) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Lắng nghe SignalR để update khi có thông báo mới (cả Operational và WorkSchedule)
  useEffect(() => {
    const handleUpdate = () => {
      fetchUnreadCount();
      if (popoverVisible) {
        fetchNotifications();
      }
    };

    window.addEventListener('work-schedule-updated', handleUpdate);
    window.addEventListener('notification-updated', handleUpdate); // For future generic updates

    return () => {
      window.removeEventListener('work-schedule-updated', handleUpdate);
      window.removeEventListener('notification-updated', handleUpdate);
    };
  }, [popoverVisible]);

  const handleVisibleChange = (visible) => {
    setPopoverVisible(visible);
    if (visible) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await markAsRead(item.id);
        fetchUnreadCount();
        setNotifications(prev => 
          prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark as read', error);
      }
    }

    setPopoverVisible(false);

    if (item.redirectUrl) {
      navigate(item.redirectUrl);
    }
  };

  const getIconForType = (type, priority) => {
    if (type === 'Operational' && priority === 'Critical') return <WarningOutlined style={{ color: '#ff4d4f' }} />;
    if (type === 'Inventory') return <ShopOutlined style={{ color: '#faad14' }} />;
    if (type === 'Quality') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    return <InfoCircleOutlined style={{ color: '#1677ff' }} />;
  };

  const content = (
    <div style={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
      <List
        loading={loading}
        dataSource={notifications}
        locale={{ emptyText: 'Không có thông báo mới' }}
        renderItem={(item) => (
          <List.Item
            className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
            style={{ 
              cursor: 'pointer', 
              padding: '12px',
              backgroundColor: item.isRead ? 'transparent' : '#f0f5ff',
              borderBottom: '1px solid #f0f0f0',
              transition: 'background-color 0.3s'
            }}
            onClick={() => handleNotificationClick(item)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = item.isRead ? 'transparent' : '#f0f5ff'}
          >
            <List.Item.Meta
              avatar={getIconForType(item.type, item.priority)}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text strong={!item.isRead} style={{ fontSize: '14px', marginBottom: 4, display: 'block' }}>
                    {item.title}
                  </Text>
                  {item.isImportant && <Tag color="error">Quan trọng</Tag>}
                </div>
              }
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: 8 }}>
                    {item.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dayjs(item.createdAt).fromNow()}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
      {notifications.length > 0 && (
        <div style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px solid #f0f0f0' }}>
          <Button type="link" onClick={() => { setPopoverVisible(false); navigate('/notifications'); }}>
            Xem tất cả thông báo
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title="Thông báo"
      trigger="click"
      open={popoverVisible}
      onOpenChange={handleVisibleChange}
      placement="bottomRight"
    >
      <Badge count={unreadCount} overflowCount={99} size="small" style={{ cursor: 'pointer' }}>
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: '20px', color: '#595959' }} />} 
          className="notification-bell-btn"
          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
        />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;
