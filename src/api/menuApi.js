import axiosInstance from './axiosInstance';

// ─── Menu ────────────────────────────────────────────────────────────────────
export const getAllMenus = () =>
  axiosInstance.get('/api/Menu');

export const getMenuById = (id) =>
  axiosInstance.get(`/api/Menu/${id}`);

export const getMenuProducts = (menuId) =>
  axiosInstance.get(`/api/Menu/${menuId}/products`);

export const getAllGroups = () =>
  axiosInstance.get('/api/Group/sellable');

export const searchProductsOData = async (searchText = '', groupId = null) => {
  let filterClauses = ['IsSellable eq true'];

  if (searchText) {
    filterClauses.push(`contains(Name, '${searchText}')`);
  }

  if (groupId && groupId !== 'all') {
    filterClauses.push(`GroupId eq ${groupId}`);
  }

  let query = '';
  if (filterClauses.length > 0) {
    query = `?$filter=${filterClauses.join(' and ')}&$expand=Group&$top=50`;
  } else {
    query = `?$expand=Group&$top=50`;
  }

  const response = await axiosInstance.get(`/odata/ProductOData${query}`);
  return response.data;
};
