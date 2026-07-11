import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

// Agent Reports API
export const agentReportsAPI = {
  create: (tenantId: string, data: FormData) =>
    axios.post(`${API_BASE}/agent-reports/${tenantId}/reports`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: (tenantId: string, params?: Record<string, any>) =>
    axios.get(`${API_BASE}/agent-reports/${tenantId}/reports`, { params }),
  getOne: (tenantId: string, reportId: string) =>
    axios.get(`${API_BASE}/agent-reports/${tenantId}/reports/${reportId}`),
  delete: (tenantId: string, reportId: string) =>
    axios.delete(`${API_BASE}/agent-reports/${tenantId}/reports/${reportId}`),
};

// Bid Orders API
export const bidOrdersAPI = {
  create: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/bids/${tenantId}/bids`, data),
  getAll: (tenantId: string, params?: Record<string, any>) =>
    axios.get(`${API_BASE}/bids/${tenantId}/bids`, { params }),
  update: (tenantId: string, bidId: string, data: any) =>
    axios.patch(`${API_BASE}/bids/${tenantId}/bids/${bidId}`, data),
  delete: (tenantId: string, bidId: string) =>
    axios.delete(`${API_BASE}/bids/${tenantId}/bids/${bidId}`),
};

// Payment Tracking API
export const paymentsAPI = {
  create: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/payments/${tenantId}/payments`, data),
  getAll: (tenantId: string, params?: Record<string, any>) =>
    axios.get(`${API_BASE}/payments/${tenantId}/payments`, { params }),
  update: (tenantId: string, paymentId: string, data: any) =>
    axios.patch(`${API_BASE}/payments/${tenantId}/payments/${paymentId}`, data),
};

// Offers API
export const offersAPI = {
  create: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/offers/${tenantId}/offers`, data),
  getAll: (tenantId: string, params?: Record<string, any>) =>
    axios.get(`${API_BASE}/offers/${tenantId}/offers`, { params }),
  update: (tenantId: string, offerId: string, data: any) =>
    axios.patch(`${API_BASE}/offers/${tenantId}/offers/${offerId}`, data),
  delete: (tenantId: string, offerId: string) =>
    axios.delete(`${API_BASE}/offers/${tenantId}/offers/${offerId}`),
};

// Currency API
export const currencyAPI = {
  getRate: (tenantId: string, from: string, to: string) =>
    axios.get(`${API_BASE}/currency/${tenantId}/currency/${from}/${to}`),
  setManualRate: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/currency/${tenantId}/currency`, data),
  getAllRates: (tenantId: string) =>
    axios.get(`${API_BASE}/currency/${tenantId}/currency`),
  convert: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/currency/${tenantId}/currency/convert`, data),
  updateRateMode: (tenantId: string, rateId: string, data: any) =>
    axios.patch(`${API_BASE}/currency/${tenantId}/currency/${rateId}`, data),
};

// Shop Assignment API
export const shopAssignmentAPI = {
  create: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/shop-assignments/${tenantId}/shop-assignments`, data),
  getAll: (tenantId: string, params?: Record<string, any>) =>
    axios.get(`${API_BASE}/shop-assignments/${tenantId}/shop-assignments`, { params }),
  complete: (tenantId: string, assignmentId: string) =>
    axios.patch(
      `${API_BASE}/shop-assignments/${tenantId}/shop-assignments/${assignmentId}/complete`
    ),
  delete: (tenantId: string, assignmentId: string) =>
    axios.delete(`${API_BASE}/shop-assignments/${tenantId}/shop-assignments/${assignmentId}`),
};

// Device Control API
export const deviceControlAPI = {
  register: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/device-control/${tenantId}/device-control`, data),
  getAll: (tenantId: string, params?: Record<string, any>) =>
    axios.get(`${API_BASE}/device-control/${tenantId}/device-control`, { params }),
  verify: (tenantId: string, deviceId: string) =>
    axios.patch(
      `${API_BASE}/device-control/${tenantId}/device-control/${deviceId}/verify`
    ),
  delete: (tenantId: string, deviceId: string) =>
    axios.delete(`${API_BASE}/device-control/${tenantId}/device-control/${deviceId}`),
};

// Company/INN API
export const companyAPI = {
  getCompanyInfo: (tenantId: string, inn: string) =>
    axios.get(`${API_BASE}/company/${tenantId}/company/${inn}`),
  createShopWithInn: (tenantId: string, data: any) =>
    axios.post(`${API_BASE}/company/${tenantId}/shops-with-inn`, data),
  syncCompanyInfo: (tenantId: string, shopId: string) =>
    axios.patch(`${API_BASE}/company/${tenantId}/shops/${shopId}/sync-company`),
};
