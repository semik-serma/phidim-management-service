import api from './api';

/**
 * Normalizes API response to return the actual payload
 */
function unwrap(response) {
  if (response && response.data !== undefined) {
    // If backend returns { success: true, message: '...', data: [...] }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  }
  return response;
}

/**
 * Creates a new transaction
 * @param {Object} transactionData - { transactionType, date, account, amount, reference, entryTime, enteredBy, description }
 */
export async function createTransaction(transactionData) {
  const payload = {
    ...transactionData,
    amount: Number(transactionData.amount),
  };
  const response = await api.post('/transaction/create-transaction', payload);
  return unwrap(response);
}

/**
 * Fetches all transactions
 */
export async function getTransactions() {
  const response = await api.get('/transaction/get-transactions');
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetches a single transaction by ID
 * @param {string} id - Transaction ObjectId
 */
export async function getTransactionById(id) {
  if (!id) throw new Error('Transaction ID is required');
  const response = await api.get(`/transaction/get-transactions/${id}`);
  return unwrap(response);
}

/**
 * Updates a transaction by ID
 * @param {string} id - Transaction ObjectId
 * @param {Object} transactionData - Updated fields
 */
export async function updateTransaction(id, transactionData) {
  if (!id) throw new Error('Transaction ID is required');
  const payload = {
    ...transactionData,
  };
  if (payload.amount !== undefined) {
    payload.amount = Number(payload.amount);
  }
  const response = await api.put(`/transaction/update-transactions/${id}`, payload);
  return unwrap(response);
}

/**
 * Deletes a transaction by ID
 * @param {string} id - Transaction ObjectId
 */
export async function deleteTransaction(id) {
  if (!id) throw new Error('Transaction ID is required');
  const response = await api.delete(`/transaction/delete-transactions/${id}`);
  return unwrap(response);
}

/**
 * Exports transactions to Excel (.xlsx)
 * User exports own transactions; Admin exports all or filtered transactions
 * @param {Object} filters
 */
export async function exportTransactionsToExcel(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });

  const query = params.toString();
  const response = await api.get(`/transaction/export/excel${query ? `?${query}` : ''}`, {
    responseType: 'blob',
  });

  return response.data;
}

const transactionApi = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportTransactionsToExcel,
};

export default transactionApi;
