import React, { useState, useMemo, useEffect } from 'react';
import CustomerTable from './CustomerTable';
import PartnerModal from '../Partner/PartnerModal';
import { getPartnersByBranch, deletePartner } from '../../../../api/partnerApi';

const CustomerTab = ({ selectedBranchId }) => {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalCustomerOpen, setModalCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomers = async (branchId) => {
    if (!branchId) return;
    setLoading(true);
    try {
      // mode = 3 đại diện cho Khách hàng
      const data = await getPartnersByBranch(branchId, 3);
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchCustomers(selectedBranchId);
    }
  }, [selectedBranchId]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(lower);
        const matchPhone = c.phone?.toLowerCase().includes(lower);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [customers, searchText]);

  const handleAddSuccess = () => {
    if (selectedBranchId) {
      fetchCustomers(selectedBranchId);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setModalCustomerOpen(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      await deletePartner(customerId);
      if (selectedBranchId) {
        fetchCustomers(selectedBranchId);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Không thể xóa khách hàng lúc này!');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      {loading && customers.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
          Đang tải danh sách khách hàng...
        </div>
      ) : (
        <CustomerTable
          customers={filteredCustomers}
          searchText={searchText}
          setSearchText={setSearchText}
          setModalCustomerOpen={(open) => {
            if (open) setEditingCustomer(null);
            setModalCustomerOpen(open);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <PartnerModal
        open={modalCustomerOpen}
        onClose={() => {
          setModalCustomerOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={handleAddSuccess}
        selectedBranchId={selectedBranchId}
        editingPartner={editingCustomer ? { ...editingCustomer, type: 2 } : { type: 2 }}
      />
    </div>
  );
};

export default CustomerTab;
