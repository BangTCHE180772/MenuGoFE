import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CheckTable from './CheckTable';
import CheckDocumentModal from './CheckDocumentModal';
import { getCheckDocuments } from '../../../../api/documentApi';

const CheckTab = ({
  documents = [],
  loading: parentLoading,
  selectedBranchId,
  products = [],
  fetchDocuments: parentFetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalCheckOpen, setModalCheckOpen] = useState(false);
  const [editDocumentId, setEditDocumentId] = useState(null);
  const [localDocs, setLocalDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCheckDocs = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await getCheckDocuments(selectedBranchId);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setLocalDocs(data);
    } catch (err) {
      console.error('Error fetching check documents:', err);
      setLocalDocs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchCheckDocs();
  }, [fetchCheckDocs]);

  const rawDocs = localDocs.length > 0 ? localDocs : documents;

  const checkDocuments = useMemo(() => {
    return rawDocs.filter((doc) => {
      const rawType = doc.type;
      const typeStr = String(rawType ?? '').toLowerCase();
      const isMatch =
        rawType === 10 ||
        rawType === 3 ||
        rawType === 5 ||
        typeStr.includes('check');
      if (!isMatch) return false;
      if (statusFilter !== 'ALL') {
        const isPending = doc.status === 0 || doc.status === 'Pending';
        const isCompleted = doc.status === 1 || doc.status === 'Completed';
        const isCancelled = doc.status === 2 || doc.status === 'Cancelled';
        if (statusFilter === 'Pending' && !isPending) return false;
        if (statusFilter === 'Completed' && !isCompleted) return false;
        if (statusFilter === 'Cancelled' && !isCancelled) return false;
      }
      if (searchText) {
        const lower = searchText.toLowerCase().trim();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = (doc.createdByName || doc.creatorName || doc.creator || doc.snapshotCreatedByName || '').toLowerCase().includes(lower);
        const matchNote = doc.note?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator && !matchNote) return false;
      }
      return true;
    });
  }, [rawDocs, statusFilter, searchText]);

  const handleOpenEdit = (docId) => {
    setEditDocumentId(docId);
    setModalCheckOpen(true);
  };

  const handleCloseModal = () => {
    setModalCheckOpen(false);
    setEditDocumentId(null);
  };

  const handleRefresh = () => {
    fetchCheckDocs();
    if (parentFetchDocuments) parentFetchDocuments(selectedBranchId);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <CheckTable
        documents={checkDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading || parentLoading}
        setModalCheckOpen={setModalCheckOpen}
        onEditDocument={handleOpenEdit}
        handleDeleteDocument={handleDeleteDocument}
        onRefresh={handleRefresh}
      />

      <CheckDocumentModal
        open={modalCheckOpen}
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

export default CheckTab;
