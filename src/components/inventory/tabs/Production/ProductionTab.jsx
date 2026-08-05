import React, { useState, useMemo } from 'react';
import ProductionTable from './ProductionTable';
import ProductionDocumentModal from './ProductionDocumentModal';

const ProductionTab = ({
  documents = [],
  loading,
  selectedBranchId,
  products = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalProductionOpen, setModalProductionOpen] = useState(false);
  const [editDocumentId, setEditDocumentId] = useState(null);

  const productionDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const isProd = doc.type === 6 || doc.type === 'Production';
      if (!isProd) return false;

      if (statusFilter !== 'ALL') {
        const docStatusStr = String(doc.status);
        if (statusFilter === 'Pending' && docStatusStr !== '0' && docStatusStr !== 'Pending') return false;
        if (statusFilter === 'Completed' && docStatusStr !== '1' && docStatusStr !== 'Completed') return false;
        if (statusFilter === 'Cancelled' && docStatusStr !== '2' && docStatusStr !== 'Cancelled' && docStatusStr !== 'Canceled') return false;
      }

      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = (doc.createdByName || doc.snapshotCreatedByName || doc.currentCreatedByName || doc.creator || doc.creatorName)?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator) return false;
      }
      return true;
    });
  }, [documents, statusFilter, searchText]);

  const handleOpenEdit = (docId) => {
    setEditDocumentId(docId);
    setModalProductionOpen(true);
  };

  const handleCloseModal = () => {
    setModalProductionOpen(false);
    setEditDocumentId(null);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ProductionTable
        documents={productionDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading}
        setModalProductionOpen={setModalProductionOpen}
        onEditDocument={handleOpenEdit}
        handleDeleteDocument={handleDeleteDocument}
        onRefresh={() => fetchDocuments && selectedBranchId && fetchDocuments(selectedBranchId)}
      />

      <ProductionDocumentModal
        open={modalProductionOpen}
        editDocumentId={editDocumentId}
        onClose={handleCloseModal}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        products={products}
      />
    </div>
  );
};

export default ProductionTab;
