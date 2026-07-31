import React from 'react';
import ReportSidebar from './ReportSidebar';

const ReportTab = ({ documents = [], partners = [], cashFlows = [] }) => {
  const totalDocCount = documents.length;
  const totalPartners = partners.length;
  const totalCashFlows = cashFlows.length;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ReportSidebar />
      <div style={{ flex: 1, padding: 16, background: '#ffffff', overflow: 'auto' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          Báo cáo Tổng quan Kho hàng & Giao dịch
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 16, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Tổng chứng từ kho</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>{totalDocCount}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Phiếu nhập, xuất, chuyển, kiểm kho</div>
          </div>

          <div style={{ padding: 16, borderRadius: 8, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Nhà cung cấp & Đối tác</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#9333ea', marginTop: 4 }}>{totalPartners}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Đang hợp tác trong hệ thống</div>
          </div>

          <div style={{ padding: 16, borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Giao dịch sổ quỹ</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#059669', marginTop: 4 }}>{totalCashFlows}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Phiếu thu/chi đã ghi nhận</div>
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Thông tin hệ thống ERP MenuGo</h3>
          <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            Chào mừng bạn đến với mô đun Quản lý kho hàng & Giao dịch ERP. Bạn có thể sử dụng thanh điều hướng phía trên để truy cập nhanh các tính năng:
            Nhập kho, Trả hàng nhập, Kiểm kho, Xuất hủy, Chuyển hàng, Sản xuất, Quản lý đối tác, Danh mục món ăn, Hóa đơn và Sổ quỹ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
