import React from 'react';
import TableMapPage from './TableMapPage';
import DeviceQrCode from '../components/DeviceQrCode';
import { useDevice } from '../context/DeviceContext';

const WaiterStationPage = () => {
  const { deviceEmployee } = useDevice();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Cột trái: Sơ đồ bàn (Chiếm phần lớn diện tích) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TableMapPage isDeviceMode={true} />
      </div>

      {/* Cột phải: Khu vực quét mã QR nhận ca */}
      <div style={{ 
        width: '280px', 
        borderLeft: '1px solid #f0f0f0', 
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#1890ff' }}>Trạm Phục Vụ</h3>
          <p style={{ color: '#8c8c8c', margin: 0 }}>Dành cho nhân viên</p>
        </div>

        {/* Luôn hiển thị QR Code để nhân viên khác cũng có thể quét nhận ca mới */}
        <DeviceQrCode />

        {/* Thông tin nhân viên đang trực máy (nếu có) */}
        {deviceEmployee && (
          <div style={{ 
            marginTop: 40, 
            padding: 16, 
            backgroundColor: '#e6f7ff', 
            borderRadius: 8,
            width: '100%',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#0050b3', fontWeight: 'bold' }}>Đang trực máy:</p>
            <h4 style={{ margin: '8px 0 0 0', color: '#1890ff' }}>{deviceEmployee.name}</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterStationPage;
