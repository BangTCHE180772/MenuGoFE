import { useState } from 'react';
import { Tabs, Typography } from 'antd';
import { TableOutlined, ShoppingCartOutlined, BookOutlined } from '@ant-design/icons';
import OrderPage from './OrderPage';
import TableMapPage from './TableMapPage';
import ReservationPage from './ReservationPage';

const { Title } = Typography;

/**
 * Màn hình Thu Ngân (POS) - POS Hub
 * Đóng vai trò là trung tâm cho cashier điều hướng giữa 3 chức năng chính.
 */
const CashierPage = () => {
  const [activeTab, setActiveTab] = useState('orders');

  const items = [
    {
      key: 'table-map',
      label: (
        <span style={{ fontSize: '16px', padding: '0 12px' }}>
          <TableOutlined /> Sơ đồ bàn
        </span>
      ),
      children: <TableMapPage isPosHub={true} />,
    },
    {
      key: 'orders',
      label: (
        <span style={{ fontSize: '16px', padding: '0 12px' }}>
          <ShoppingCartOutlined /> Bán hàng
        </span>
      ),
      children: <OrderPage isPosHub={true} />,
    },
    {
      key: 'reservations',
      label: (
        <span style={{ fontSize: '16px', padding: '0 12px' }}>
          <BookOutlined /> Đặt bàn
        </span>
      ),
      children: <ReservationPage isPosHub={true} />,
    },
  ];

  return (
    <div style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
          .pos-hub-tabs .ant-tabs-content-holder {
            flex-grow: 1;
            overflow: hidden;
            background: #fff;
          }
          .pos-hub-tabs .ant-tabs-content {
            height: 100%;
          }
          .pos-hub-tabs .ant-tabs-tabpane {
            height: 100%;
            overflow: auto;
          }
        `}
      </style>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        size="large"
        type="card"
        tabBarStyle={{ marginBottom: 0, padding: '16px 16px 0 16px', backgroundColor: '#f0f2f5' }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        className="pos-hub-tabs"
      />
    </div>
  );
};

export default CashierPage;
