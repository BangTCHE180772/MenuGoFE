import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ExportDeleteTable from './ExportDeleteTable';
import DisposalDocumentModal from './DisposalDocumentModal';
import { getExportDeleteDocuments } from '../../../../api/documentApi';

const ExportDeleteTab = ({
  documents = [],
  loading: parentLoading,
  selectedBranchId,
  products = [],
  fetchDocuments: parentFetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalExportOpen, setModalExportOpen] = useState(false);
  const [editDocumentId, setEditDocumentId] = useState(null);
  const [localDocs, setLocalDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchExportDeleteDocs = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await getExportDeleteDocuments(selectedBranchId);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setLocalDocs(data);
    } catch (err) {
      console.error('Error fetching export delete documents:', err);
      setLocalDocs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchExportDeleteDocs();
  }, [fetchExportDeleteDocs]);

  const rawDocs = localDocs.length > 0 ? localDocs : documents;

  const exportDeleteDocuments = useMemo(() => {
    return rawDocs.filter((doc) => {
      const rawType = doc.type;
      const typeStr = String(rawType ?? '').toLowerCase();
      const isMatch =
        rawType === 8 ||
        rawType === 7 ||
        rawType === 2 ||
        rawType === 5 ||
        typeStr.includes('export') ||
        typeStr.includes('delete');
      if (!isMatch) return false;
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
      if (searchText) {
        const lower = searchText.toLowerCase().trim();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = (doc.creatorName || doc.creator || doc.snapshotCreatedByName || '').toLowerCase().includes(lower);
        const matchNote = doc.note?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator && !matchNote) return false;
      }
      return true;
    });
  }, [rawDocs, statusFilter, searchText]);

  const handleOpenEdit = (docId) => {
    setEditDocumentId(docId);
    setModalExportOpen(true);
  };

  const handleCloseModal = () => {
    setModalExportOpen(false);
    setEditDocumentId(null);
  };

  const handleRefresh = () => {
    fetchExportDeleteDocs();
    if (parentFetchDocuments) parentFetchDocuments(selectedBranchId);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ExportDeleteTable
        documents={exportDeleteDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading || parentLoading}
        setModalExportOpen={setModalExportOpen}
        onEditDocument={handleOpenEdit}
        handleDeleteDocument={handleDeleteDocument}
        onRefresh={handleRefresh}
      />

      <DisposalDocumentModal
        open={modalExportOpen}
        editDocumentId={editDocumentId}
        onClose={handleCloseModal}
        onSuccess={() => {
          handleRefresh();
        }}
        branchId={selectedBranchId}
        products={products}
      />
    </div>
  );
};

export default ExportDeleteTab;
