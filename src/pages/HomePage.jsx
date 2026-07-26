import React, { useState, useEffect } from 'react';
import { Divider, Spin } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import ExecutiveSummary from '../components/dashboard/ExecutiveSummary';
import OverviewSection from '../components/dashboard/OverviewSection';
import { getBranchDashboardStats } from '../api/branchApi';

const HomePage = () => {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  // Global loading state for real API data (can be extended)
  const [statsLoading, setStatsLoading] = useState(false);

  return (
    <div
      className="dashboard-page"
      style={{
        minHeight: '100%',
        background: 'var(--color-bg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      {/* Welcome line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              color: 'var(--color-text)',
              letterSpacing: '-0.4px',
            }}
          >
            Xin chào, {user?.name ?? 'bạn'} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 0 }}>
            Dashboard chi nhánh — cập nhật dữ liệu hoạt động hôm nay
          </p>
        </div>
      </div>

      {/* ─── Executive Summary ────────────────────────────────────────────── */}
      <ExecutiveSummary loading={statsLoading} />

      {/* ─── Divider ──────────────────────────────────────────────────────── */}
      <Divider style={{ margin: '0', borderColor: 'var(--color-border)' }} />

      {/* ─── Overview ─────────────────────────────────────────────────────── */}
      <OverviewSection loading={statsLoading} />
    </div>
  );
};

export default HomePage;
