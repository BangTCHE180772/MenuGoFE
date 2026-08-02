import React, { useState, useMemo } from 'react';
import ImportReturnTable from './ImportReturnTable';
import ReturnDocumentModal from '../Import/ReturnDocumentModal';

/**
 * ImportReturnTab — Tab phiếu trả hàng nhập (Return Document).
 *
 * Dữ liệu: Lọc từ allDocuments (type === Return / type === 4).
 * Tạo phiếu trả: Dùng ReturnDocumentModal giống như bên ImportTab,
 *   nhưng từ tab này không có importDocument cụ thể →
 *   user cần chọn phiếu nhập gốc qua ImportTab.
 *
 * Để tạo phiếu trả hàng: Mở ImportTab → Click "Trả hàng" trên phiếu Nhập đã Completed.
 */
const ImportReturnTab = ({
  documents = [],
  loading,
  selectedBranchId,
  products = [],
  partners = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Lọc phiếu Trả hàng NCC (DocumentType.Return = 4 hoặc "Return")
  const returnDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const isReturn = doc.type === 2 || doc.type === 4 || doc.type === 'Return' || doc.type === 'CustomerReturn';
      if (!isReturn) return false;

      if (statusFilter !== 'ALL') {
        const docStatus = doc.status;
        if (statusFilter === 'Completed' && docStatus !== 1 && docStatus !== 'Completed') return false;
      }

      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = (doc.snapshotCreatedByName || doc.creator || '').toLowerCase().includes(lower);
        const matchPartner = (doc.partnerName || doc.snapshotPartnerName || '').toLowerCase().includes(lower);
        if (!matchCode && !matchCreator && !matchPartner) return false;
      }

      return true;
    });
  }, [documents, statusFilter, searchText]);

  const handleRefresh = () => {
    if (fetchDocuments && selectedBranchId) {
      fetchDocuments(selectedBranchId);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ImportReturnTable
        documents={returnDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading}
        onRefresh={handleRefresh}
        // Không truyền onOpenReturnModal vì tab này chỉ xem
        // Để tạo phiếu trả → phải vào ImportTab
      />
    </div>
  );
};

export default ImportReturnTab;
