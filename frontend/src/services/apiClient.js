 
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

console.log("[DEBUG] API Base URL set to:", API_URL);

const apiClient = axios.create({
  baseURL: `${API_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto logout if 401 Unauthorized
      localStorage.removeItem('access_token');
      // Only redirect if not already on login/register to avoid loops
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return apiClient.post('token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  register: (userData) => apiClient.post('register', userData),
};


export const reconService = {
  fullRecon: (target) => apiClient.get(`recon/full/${target}`),
  getIpInfo: (target) => apiClient.get(`recon/ip/${target}`),
  getDnsInfo: (domain) => apiClient.get(`recon/dns/${domain}`),
  getHeaders: (target) => apiClient.get(`recon/headers/${target}`),
  osint: (target, category = 'all') => apiClient.get(
    `recon/osint?target=${encodeURIComponent(target)}&category=${category}`,
    { timeout: 40000 }
  ),
};

export const scanService = {
  startScan: (target, intensity) => apiClient.post(
    `scan/start?target=${encodeURIComponent(target)}&intensity=${intensity}`,
    null,
    { timeout: 180000 } // up to 3 minutes for deep scans
  ),
  getStatus: (id) => apiClient.get(`scan/status/${id}`),
  deleteScan: (id) => apiClient.delete(`scan/${id}`),
};

export const vulnService = {
  getFindings: (scanId) => apiClient.get(`vuln/findings/${scanId}`),
  getAllFindings: () => apiClient.get(`vuln/all`),
  getRecentFindings: (limit = 10) => apiClient.get(`vuln/recent?limit=${limit}`),
  getDashboardStats: () => apiClient.get('nexus/dashboard'),
  analyze: (ports) => apiClient.get(`vuln/analyze?ports=${ports}`),
};

export const aiService = {
  chat: (query, context) => apiClient.post('ai/chat', { query, context }),
  getScientificLab: () => apiClient.get('ai/scientific/lab'),
};

export const adminService = {
  getStats: () => apiClient.get('admin/stats'),
  getUsers: () => apiClient.get('admin/users'),
  updateStatus: (userId, isActive) => apiClient.put(`admin/users/${userId}/status`, { is_active: isActive }),
  updatePermissions: (userId, permissions) => apiClient.put(`admin/users/${userId}/permissions`, { permissions }),
};

export const reportsService = {
  download: (scanId, format) => apiClient.get(`reports/download/${scanId}?format=${format}`, { responseType: 'blob' }),
  delete: (scanId) => apiClient.delete(`reports/${scanId}`),
  getReportDetails: (scanId) => apiClient.get(`reports/details/${scanId}`),
  updateReport: (scanId, data) => apiClient.patch(`reports/${scanId}`, data),
  purgeAll: () => apiClient.delete(`reports/purge/all`),
};

export const notificationsService = {
  getLatest: () => apiClient.get('notifications/'),
  markAsRead: (id) => apiClient.patch(`notifications/read/${id}`),
  markAllRead: () => apiClient.patch('notifications/read-all'),
  purgeAll: () => apiClient.delete('notifications/purge'),
};

export const exploitService = {
  analyze: (findingId) => apiClient.get(`exploit/analyze/${findingId}`),
  run: (findingId, labMode = false) => apiClient.post(`exploit/run/${findingId}?lab_mode=${labMode}`),
};

export const nexusService = {
  getDashboard: () => apiClient.get('nexus/dashboard'),
  getVulnerabilities: () => apiClient.get('nexus/vulnerabilities'),
  getReportSummary: () => apiClient.get('nexus/report'),
  triggerExploitation: (findingId) => apiClient.post('nexus/exploitation', { finding_id: findingId }),
  chat: (payload) => apiClient.post('nexus/chat', payload),
};

export const attackPathService = {
  generateGraph: () => apiClient.get('attack-path/latest'),
  getAnalysis: (scanId) => apiClient.get(`attack-path/${scanId}`),
};

export default apiClient;
