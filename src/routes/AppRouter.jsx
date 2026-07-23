import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROLES, useAuth } from '../context/AuthContext';

import AuthLayout from '../Layout/AuthLayout';
import MainLayout from '../Layout/MainLayout';
import DeviceLayout from '../Layout/DeviceLayout';

import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import DeviceRoute from './DeviceRoute';

import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import CashierPage from '../pages/CashierPage';
import OrderPage from '../pages/OrderPage';
import TableMapPage from '../pages/TableMapPage';
import WaiterStationPage from '../pages/WaiterStationPage';
import WaiterMobileSessionPage from '../pages/WaiterMobileSessionPage';
import BranchPage from "../pages/BranchPage";
import ReservationPage from '../pages/ReservationPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import ContractPage from '../pages/ContractPage';
import AccountPage from '../pages/AccountPage';
import WorkSchedulePage from '../pages/WorkSchedulePage';
import MyWorkSchedulePage from '../pages/MyWorkSchedulePage';
import ShiftPage from '../pages/ShiftPage';
import MenuManagementPage from '../pages/MenuManagementPage';
import KDSPage from '../pages/KDSPage';
import ChainPagae from '../pages/ChainPage';
import AttendancePage from '../pages/AttendancePage';


import CustomerOrderPage from '../pages/CustomerOrderPage';
import CustomerHomePage from '../pages/CustomerHomePage';
import VoucherPage from '../pages/VoucherPage';
import TableManagementPage from '../pages/TableManagementPage';
import { SignalRProvider } from '../context/SignalRContext';
import GlobalReservationListener from '../components/reservation/GlobalReservationListener';
import DeviceSetupPage from '../pages/DeviceSetupPage';
import DeviceManagementPage from '../pages/DeviceManagementPage';
import DeviceAuthPage from '../pages/DeviceAuthPage';

const AppRouter = () => {
  const { user, role } = useAuth();
  return (
    <BrowserRouter>
      <SignalRProvider>
        <GlobalReservationListener />
        <Routes>
          {/* ── Public: không cần đăng nhập ──────────────────────────── */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route path="/customer-home" element={<CustomerHomePage />} />
          <Route path="/customer" element={<CustomerHomePage />} />
          <Route path="/customer-order/:tableId" element={<CustomerOrderPage />} />

          {/* ── Device Route: cần device_token ─────────── */}
          <Route element={<DeviceRoute allowedTypes={[]} />}>
            <Route element={<DeviceLayout />}>
              {/* POS */}
              <Route path="/pos" element={<CashierPage />} />
              {/* Waiter */}
              <Route path="/station" element={<WaiterStationPage />} />
              {/* Kitchen */}
              <Route path="/kitchen" element={<KDSPage />} />
              {/* Attendance */}
              <Route path="/attendance" element={<AttendancePage />} />
            </Route>
          </Route>

          {/* ── Private Route: cho nhân viên/quản lý (trên điện thoại/web) ─────────── */}
          <Route element={<PrivateRoute />}>
            <Route path="/device-auth/:challengeId" element={<DeviceAuthPage />} />
            
            <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />

              {/* Mọi role đã đăng nhập đều xem được */}
              <Route
                path="/work-schedule"
                element={
                  ['Cashier', 'Chef', 'Waiter'].includes(role) ? (
                    <MyWorkSchedulePage />
                  ) : (
                    <WorkSchedulePage />
                  )
                }
              />
              {/* Chef, Manager, Owner, Admin */}
              <Route element={<RoleRoute allowedRoles={[ROLES.CHEF, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN]} />}>
                <Route path="/kds" element={<KDSPage />} />
              </Route>
              <Route path="/waiter-session" element={<WaiterMobileSessionPage />} />
              {/* Manager, Owner, Admin */}
              <Route element={<RoleRoute allowedRoles={[ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN]} />}>
                <Route path="/menu-management" element={<MenuManagementPage />} />
                <Route path="/vouchers" element={<VoucherPage />} />
                <Route path="/accounts" element={<AccountPage />} />
                <Route path="/tables" element={<TableManagementPage />} />
                <Route path="/device-management" element={<DeviceManagementPage />} />
                <Route path="/device-setup" element={<DeviceSetupPage />} />
                <Route path="/contracts" element={<ContractPage />} />
                <Route path="/shifts" element={<ShiftPage />} />
              </Route>

              {/* Owner, Admin */}
              <Route element={<RoleRoute allowedRoles={[ROLES.OWNER, ROLES.ADMIN]} />}>
                <Route path="/branches" element={<BranchPage />} />
                <Route path="/chains" element={<ChainPagae />} />
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
      </SignalRProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
