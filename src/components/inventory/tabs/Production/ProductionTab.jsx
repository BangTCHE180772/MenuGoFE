import React, { useState, useMemo } from 'react';
import ProductionSidebar from './ProductionSidebar';
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

  const productionDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 6) return false;
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
      <ProductionSidebar statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <ProductionTable
        documents={productionDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        setModalProductionOpen={setModalProductionOpen}
        handleDeleteDocument={handleDeleteDocument}
      />

      <ProductionDocumentModal
        open={modalProductionOpen}
        onClose={() => setModalProductionOpen(false)}
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
