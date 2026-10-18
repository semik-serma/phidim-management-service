import api from './api';
import { extractRecords } from './ledger';

function unwrap(response) {
  if (response?.data?.success === false) throw new Error(response.data.message || 'Request failed.');
  if (response && response.data !== undefined) {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  }
  return response;
}

/**
 * Fetch all users (Admin only)
 */
export async function getAdminUsers() {
  const response = await api.get('/admin/users');
  const data = unwrap(response);
  return extractRecords(data, 'users');
}

/**
 * Create a new user (Admin only)
 * @param {Object} userData - { full_name, email, password, role }
 */
export async function createAdminUser(userData) {
  const response = await api.post('/admin/users', userData);
  return unwrap(response);
}

/**
 * Update user's role (Admin only)
 * @param {string} userId
 * @param {string} role - 'admin' | 'staff' | 'accountant'
 */
export async function updateUserRole(userId, role) {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return unwrap(response);
}

/**
 * Delete a user account (Admin only)
 * @param {string} userId
 */
export async function deleteAdminUser(userId) {
  const response = await api.delete(`/admin/users/${userId}`);
  return unwrap(response);
}
