import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from '../context/AuthContext';

import AuthLayout from '../Layout/AuthLayout';
import MainLayout from '../Layout/MainLayout';
import CashierLayout from '../Layout/CashierLayout';

import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import DeviceRoute from './DeviceRoute';

import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import CashierPage from '../pages/CashierPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public: không cần đăng nhập ──────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* ── Device Route: cần device_token (màn thu ngân) ─────────── */}
        <Route element={<DeviceRoute />}>
          <Route element={<CashierLayout />}>
            <Route path="/cashier" element={<CashierPage />} />
          </Route>
        </Route>

        {/* ── Private: cần đăng nhập ────────────────────────────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />

            {/* Mọi role đã đăng nhập đều xem được */}
            <Route path="/work-schedule" element={<div className="page-placeholder">📅 Lịch làm việc — Coming Soon</div>} />

            {/* Manager, Owner, Admin */}
            <Route element={<RoleRoute allowedRoles={[ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN]} />}>
              <Route path="/orders"   element={<div className="page-placeholder">🛒 Đơn hàng — Coming Soon</div>} />
              <Route path="/accounts" element={<div className="page-placeholder">👥 Nhân sự — Coming Soon</div>} />
              <Route path="/tables"   element={<div className="page-placeholder">🪑 Bàn — Coming Soon</div>} />
            </Route>

            {/* Owner, Admin */}
            <Route element={<RoleRoute allowedRoles={[ROLES.OWNER, ROLES.ADMIN]} />}>
              <Route path="/branches" element={<div className="page-placeholder">🏪 Chi nhánh — Coming Soon</div>} />
              <Route path="/chains"   element={<div className="page-placeholder">🔗 Chuỗi — Coming Soon</div>} />
            </Route>

            {/* Admin only */}
            <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin" element={<div className="page-placeholder">⚙️ Quản trị hệ thống — Coming Soon</div>} />
            </Route>
          </Route>
        </Route>

        {/* ── Misc ──────────────────────────────────────────────────── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
