import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getAllBranches } from '../api/branchApi';

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const { user, role, isAuthenticated } = useAuth();
  const [branches, setBranches] = useState([]);
  const [currentBranchId, setCurrentBranchId] = useState(null);

  // Load branch list for admin/owner
  useEffect(() => {
    const fetchBranches = async () => {
      if (isAuthenticated && ['Admin', 'Owner'].includes(role)) {
        try {
          const res = await getAllBranches();
          setBranches(res.data || []);
        } catch (error) {
          console.error('Lỗi khi lấy danh sách chi nhánh:', error);
        }
      } else {
        setBranches([]);
      }
    };
    fetchBranches();
  }, [role, isAuthenticated]);

  // Handle currentBranchId synchronization based on user / role
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentBranchId(null);
      return;
    }

    if (role === 'Manager') {
      if (user?.branchIds?.length > 0) {
        setCurrentBranchId(user.branchIds[0]);
      } else {
        setCurrentBranchId(null);
      }
    } else {
      // Owner / Admin
      const saved = localStorage.getItem('currentBranchId');
      if (saved) {
        setCurrentBranchId(parseInt(saved, 10));
      } else {
        setCurrentBranchId(null); // 'Tất cả chi nhánh'
      }
    }
  }, [user, role, isAuthenticated]);

  const selectBranch = (branchId) => {
    if (role === 'Manager') return; // Manager is locked

    setCurrentBranchId(branchId);
    if (branchId) {
      localStorage.setItem('currentBranchId', branchId.toString());
      const activeBranch = branches.find(b => b.id === branchId);
      localStorage.setItem('currentBranchStatus', activeBranch?.status || 'Hoạt động');
    } else {
      localStorage.removeItem('currentBranchId');
      localStorage.removeItem('currentBranchStatus');
    }
  };

  // Sync currentBranchStatus to localStorage whenever currentBranchId or branches list updates
  useEffect(() => {
    if (currentBranchId && branches.length > 0) {
      const activeBranch = branches.find(b => b.id === currentBranchId);
      if (activeBranch) {
        localStorage.setItem('currentBranchStatus', activeBranch.status || 'Hoạt động');
      }
    } else {
      localStorage.removeItem('currentBranchStatus');
    }
  }, [currentBranchId, branches]);

  const currentBranch = branches.find(b => b.id === currentBranchId);
  const isBranchInactive = currentBranch ? currentBranch.status === 'Ngừng kinh doanh' : false;

  return (
    <BranchContext.Provider value={{ currentBranchId, selectBranch, branches, isBranchInactive }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);
