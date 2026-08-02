import React, { useState, useMemo } from 'react';
import CheckTable from './CheckTable';
import CheckDocumentModal from './CheckDocumentModal';

const CheckTab = ({
  documents = [],
  loading,
  selectedBranchId,
  products = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalCheckOpen, setModalCheckOpen] = useState(false);

  const checkDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 5) return false;
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = doc.creator?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator) return false;
      }
      return true;
    });
  }, [documents, statusFilter, searchText]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <CheckTable
        documents={checkDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading}
        setModalCheckOpen={setModalCheckOpen}
        handleDeleteDocument={handleDeleteDocument}
      />

      <CheckDocumentModal
        open={modalCheckOpen}
        onClose={() => setModalCheckOpen(false)}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        products={products}
      />
    </div>
  );
};

export default CheckTab;
