import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';

import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';

import './index.css';
import App from './App.jsx';

// ─── Ant Design theme: màu thương hiệu MenuGo ─────────────────────────────
const antdTheme = {
  token: {
    colorPrimary: '#E8442A',
    colorLink: '#E8442A',
    borderRadius: 8,
    fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <AntdApp>
        <AuthProvider>
          <DeviceProvider>
            <App />
          </DeviceProvider>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
);
