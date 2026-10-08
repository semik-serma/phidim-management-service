import api from './api';

function unwrap(response) {
  if (response && response.data !== undefined) {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  }
  return response;
}

/**
 * Creates a new bill
 * @param {Object} billData - { project, customer_name, phone_number, address, items, bill_date, role }
 */
export async function createBill(billData) {
  const response = await api.post('/bills/create-bill', billData);
  return unwrap(response);
}

/**
 * Fetches bills (scoped automatically on server: User gets own, Admin gets all)
 * @param {Object} filters - { role, userId, status, startDate, endDate, search }
 */
export async function getAllBills(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });

  const query = params.toString();
  const response = await api.get(`/bills/bills${query ? `?${query}` : ''}`);
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetches a single bill by ID
 * @param {string} id - Bill ObjectId
 */
export async function getBillById(id) {
  if (!id) throw new Error('Bill ID is required');
  const response = await api.get(`/bills/bill/${id}`);
  return unwrap(response);
}

/**
 * Deletes a bill by ID
 * @param {string} id - Bill ObjectId
 */
export async function deleteBill(id) {
  if (!id) throw new Error('Bill ID is required');
  const response = await api.delete(`/bills/bill/${id}`);
  return unwrap(response);
}

/**
 * Exports bills to Excel (.xlsx)
 * User exports own bills; Admin exports all or filtered bills
 * @param {Object} filters
 */
export async function exportBillsToExcel(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });

  const query = params.toString();
  const response = await api.get(`/bills/export/excel${query ? `?${query}` : ''}`, {
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Creates a secure time-limited share link for a bill
 * @param {string} id
 * @param {number} expiryDays
 */
export async function shareBill(id, expiryDays = 7) {
  if (!id) throw new Error('Bill ID is required');
  const response = await api.post(`/bills/bill/${id}/share`, { expiryDays });
  return unwrap(response);
}

/**
 * Fetches admin audit logs (Admin only)
 */
export async function getAdminLogs(params = {}) {
  const response = await api.get('/admin/logs', { params });
  return unwrap(response);
}

/**
 * Fetches users list for admin filters (Admin only)
 */
export async function getAdminUsers() {
  const response = await api.get('/admin/users');
  return unwrap(response);
}

const billApi = {
  createBill,
  getAllBills,
  getBillById,
  deleteBill,
  exportBillsToExcel,
  shareBill,
  getAdminLogs,
  getAdminUsers,
};

export default billApi;
