import axiosInstance from './axiosInstance';

// Get all branches
export const getAllBranches = () =>
  axiosInstance.get('/api/Branch');

// Get branch by specific ID
export const getBranchById = (id) =>
  axiosInstance.get(`/api/Branch/${id}`);

// Search branches with filtering, sorting and paging parameters
export const searchBranches = (dto) =>
  axiosInstance.get('/api/Branch/search', { params: dto });

// Create a new branch
export const createBranch = (data) =>
  axiosInstance.post('/api/Branch', data);

// Update an existing branch
export const updateBranch = (data) =>
  axiosInstance.put('/api/Branch', data);

// Delete an existing branch
export const deleteBranch = (id) =>
  axiosInstance.delete(`/api/Branch/${id}`);
