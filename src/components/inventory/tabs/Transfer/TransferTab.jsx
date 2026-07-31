import React, { useState, useMemo } from 'react';
import TransferSidebar from './TransferSidebar';
import TransferTable from './TransferTable';
import TransferDocumentModal from './TransferDocumentModal';
import { receiveTransferDocument } from '../../../../api/documentApi';

const TransferTab = ({
  documents = [],
  loading,
  selectedBranchId,
  branches = [],
  products = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalTransferOpen, setModalTransferOpen] = useState(false);

  const transferDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 3) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Pending' && doc.transferStatus !== 'Pending') return false;
        if (statusFilter === 'Completed' && doc.status !== 'Completed') return false;
      }
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = doc.creator?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator) return false;
      }
      return true;
    });
  }, [documents, statusFilter, searchText]);

  const handleReceiveTransfer = async (doc) => {
    if (!window.confirm(`Xác nhận nhận hàng chuyển cho mã phiếu ${doc.code}?`)) return;
    try {
      await receiveTransferDocument({ documentId: doc.id });
      alert('Đã nhận hàng chuyển thành công!');
      fetchDocuments(selectedBranchId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi nhận hàng chuyển.');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <TransferSidebar statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <TransferTable
        documents={transferDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        setModalTransferOpen={setModalTransferOpen}
        handleReceiveTransfer={handleReceiveTransfer}
        handleDeleteDocument={handleDeleteDocument}
      />

      <TransferDocumentModal
        open={modalTransferOpen}
        onClose={() => setModalTransferOpen(false)}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        branches={branches}
        products={products}
      />
    </div>
  );
};

export default TransferTab;
