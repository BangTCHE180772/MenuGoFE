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
import BranchChatPage from '../pages/BranchChatPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import ContractPage from '../pages/ContractPage';
import MyContractPage from '../pages/MyContractPage';
import AccountPage from '../pages/AccountPage';
import MyProfilePage from '../pages/MyProfilePage';
import WorkSchedulePage from '../pages/WorkSchedulePage';
import MyWorkSchedulePage from '../pages/MyWorkSchedulePage';
import WorkScheduleSummaryPage from '../pages/WorkScheduleSummaryPage';
import ShiftPage from '../pages/ShiftPage';
import MenuManagementPage from '../pages/MenuManagementPage';
import KDSPage from '../pages/KDSPage';
import LeftoverPage from '../pages/LeftoverPage';
import ChainPage from '../pages/ChainPage';
import AttendancePage from '../pages/AttendancePage';
import PayrollPage from '../pages/PayrollPage';
import MyPayrollPage from '../pages/MyPayrollPage';
import SalaryDetailPage from '../pages/SalaryDetailPage';
import HolidayConfigPage from '../pages/HolidayConfigPage';


import CustomerOrderPage from '../pages/CustomerOrderPage';
import CustomerHomePage from '../pages/customer/CustomerHomePage';
import CustomerLoginPage from '../pages/customer/CustomerLoginPage';
import CustomerRegisterPage from '../pages/customer/CustomerRegisterPage';
import CustomerDashboardPage from '../pages/customer/CustomerDashboardPage';
import CustomerReservationPage from '../pages/customer/CustomerReservationPage';
import CustomerChatPage from '../pages/customer/CustomerChatPage';
import CustomerPrivateRoute from './CustomerPrivateRoute';
import VoucherPage from '../pages/VoucherPage';
import TableManagementPage from '../pages/TableManagementPage';
import { SignalRProvider } from '../context/SignalRContext';
import GlobalReservationListener from '../components/reservation/GlobalReservationListener';
import GlobalStockAlertListener from '../components/inventory/GlobalStockAlertListener';
import DeviceSetupPage from '../pages/DeviceSetupPage';
import DeviceManagementPage from '../pages/DeviceManagementPage';
import DeviceAuthPage from '../pages/DeviceAuthPage';
import ReportRevenuePage from '../pages/ReportRevenuePage';
import ReportExpensePage from '../pages/ReportExpensePage';
import ReportProfitPage from '../pages/ReportProfitPage';
import ReportInventoryPage from '../pages/ReportInventoryPage';
import ProductCatalogPage from '../pages/ProductCatalogPage';
import InventoryManagementPage from '../pages/InventoryManagementPage';
import CashFlowPage from '../pages/CashFlowPage';
import NotificationPage from '../pages/NotificationPage';

const AppRouter = () => {
  const { user, role } = useAuth();
  return (
    <BrowserRouter>
      <SignalRProvider>
        <GlobalReservationListener />
        <GlobalStockAlertListener />
        <Routes>
          {/* ── Public: không cần đăng nhập ──────────────────────────── */}
          <Route path="/" element={<Navigate to={(user || role) ? "/home" : "/welcome"} replace />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route path="/welcome" element={<CustomerHomePage />} />
          <Route path="/customer-order/:tableId" element={<CustomerOrderPage />} />
          <Route path="/customer/login" element={<CustomerLoginPage />} />
          <Route path="/customer/register" element={<CustomerRegisterPage />} />
          
          <Route element={<CustomerPrivateRoute />}>
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/customer/booking" element={<CustomerReservationPage />} />
            <Route path="/customer/chat" element={<CustomerChatPage />} />
          </Route>

          {/* ── Device Route: cần device_token ─────────── */}
          <Route element={<DeviceRoute />}>
            <Route element={<DeviceLayout />}>
              {/* POS */}
              <Route element={<DeviceRoute allowedTypes={['POS']} />}>
                <Route path="/pos" element={<CashierPage />} />
              </Route>
              {/* Waiter */}
              <Route element={<DeviceRoute allowedTypes={['Waiter']} />}>
                <Route path="/station" element={<WaiterStationPage />} />
              </Route>
              {/* Kitchen */}
              <Route element={<DeviceRoute allowedTypes={['Kitchen']} />}>
                <Route path="/kitchen" element={<KDSPage />} />
              </Route>
              {/* Attendance */}
              <Route element={<DeviceRoute allowedTypes={['Attendance']} />}>
                <Route path="/attendance" element={<AttendancePage />} />
              </Route>
            </Route>
          </Route>

          {/* ── Private Route: cho nhân viên/quản lý (trên điện thoại/web) ─────────── */}
          <Route element={<PrivateRoute />}>
            <Route path="/device-auth/:challengeId" element={<DeviceAuthPage />} />

            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route
                path="/home"
                element={
                  ['Admin', 'Owner', 'Manager', 'Quản trị viên', 'Chủ sở hữu', 'Quản lý'].includes(role) ||
                  [1, 2, 3].includes(user?.roleId) ? (
                    <HomePage />
                  ) : (
                    <Navigate to="/work-schedule" replace />
                  )
                }
              />
              <Route path="/my-profile" element={<MyProfilePage />} />
              <Route path="/notifications" element={<NotificationPage />} />

              {/* Mọi role đã đăng nhập đều xem được */}
              <Route
                path="/work-schedule"
                element={
                  ['Admin', 'Owner', 'Manager', 'Quản trị viên', 'Chủ sở hữu', 'Quản lý'].includes(role) ||
                  [1, 2, 3].includes(user?.roleId) ? (
                    <WorkSchedulePage />
                  ) : (
                    <MyWorkSchedulePage />
                  )
                }
              />
              <Route path="/my-work-schedule" element={<MyWorkSchedulePage />} />
              <Route
                path="/contracts"
                element={
                  ['Admin', 'Owner', 'Manager', 'Quản trị viên', 'Chủ sở hữu', 'Quản lý'].includes(role) ||
                  [1, 2, 3].includes(user?.roleId) ? (
                    <ContractPage />
                  ) : (
                    <MyContractPage />
                  )
                }
              />
              <Route path="/my-contract" element={<MyContractPage />} />
              <Route path="/my-payroll" element={<MyPayrollPage />} />

              <Route path="/waiter-session" element={<WaiterMobileSessionPage />} />
              {/* Manager, Owner, Admin */}
              <Route element={<RoleRoute allowedRoles={[ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN]} />}>
                <Route path="/product-catalog" element={<ProductCatalogPage />} />
                <Route path="/inventory-management" element={<InventoryManagementPage />} />
                <Route path="/cashflow" element={<CashFlowPage />} />
                <Route path="/menu-management" element={<MenuManagementPage />} />
                <Route path="/accounts" element={<AccountPage />} />
                <Route path="/tables" element={<TableManagementPage />} />
                <Route path="/vouchers" element={<VoucherPage />} />
                <Route path="/device-management" element={<DeviceManagementPage />} />
                <Route path="/device-setup" element={<DeviceSetupPage />} />
                <Route path="/contracts" element={<ContractPage />} />
                <Route path="/shifts" element={<ShiftPage />} />
                <Route path="/holiday-config" element={<HolidayConfigPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/salary-details" element={<SalaryDetailPage />} />
                <Route path="/work-schedule-summary" element={<WorkScheduleSummaryPage />} />
                <Route path="/reservations" element={<ReservationPage />} />
                <Route path="/chat" element={<BranchChatPage />} />
                <Route path="/reports/revenue" element={<ReportRevenuePage />} />
                <Route path="/reports/expense" element={<ReportExpensePage />} />
                <Route path="/reports/profit" element={<ReportProfitPage />} />
                <Route path="/reports/inventory" element={<ReportInventoryPage />} />
                <Route path="/inventoryreport" element={<ReportInventoryPage />} />
                <Route path="/leftover" element={<LeftoverPage />} />
                <Route path="/kds" element={<KDSPage />} />
              </Route>

              {/* Owner, Admin */}
              <Route element={<RoleRoute allowedRoles={[ROLES.OWNER, ROLES.ADMIN]} />}>
                <Route path="/branches" element={<BranchPage />} />
                <Route path="/chains" element={<ChainPage />} />
              </Route>

              {/* Admin only */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
                <Route path="/admin" element={<div className="page-placeholder">⚙️ Quản trị hệ thống — Coming Soon</div>} />
                <Route path="/orders" element={<OrderPage />} />
              <Route path="/table-map" element={<TableMapPage />} />
              <Route path="/cashier" element={<CashierPage />} />
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
