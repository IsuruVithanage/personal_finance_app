import axios from 'axios';

const api = axios.create({
    baseURL: 'https://ipmv-finance.hf.space/api', // FastAPI default address
    headers: {
        'Content-Type': 'application/json'
    }
});

// Accounts
export const getAccounts = () => api.get('/accounts/');
export const getAccount = (id) => api.get(`/accounts/${id}`);
export const createAccount = (data) => api.post('/accounts/', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Categories
export const getCategories = () => api.get('/categories/');
export const createCategory = (data) => api.post('/categories/', data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Transactions
export const getTransactions = (accountId = null) => {
    let url = '/transactions/';
    if (accountId) {
        url += `?account_id=${accountId}`;
    }
    return api.get(url);
};
export const createTransaction = (data) => api.post('/transactions/', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Debts
export const getDebts = () => api.get('/debts/');
export const createDebt = (data) => api.post('/debts/', data);
export const updateDebt = (id, data) => api.put(`/debts/${id}`, data);
export const payDebt = (id, data) => api.post(`/debts/${id}/pay`, data);
export const deleteDebt = (id) => api.delete(`/debts/${id}`);
export const splitBill = (data) => api.post('/debts/split', data);

// Dashboard Summaries
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getMonthlyReport = (months = 6) => api.get(`/dashboard/reports/monthly?months=${months}`);

// AI Insights
export const getAIInsights = () => api.get('/ai/insights');

export default api;
