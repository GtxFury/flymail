import { useAuthStore } from '@/stores/auth';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<any>('/auth/me'),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Domains
export const domainsApi = {
  list: () => request<any[]>('/domains'),

  get: (id: string) => request<any>(`/domains/${id}`),

  create: (domain: string) =>
    request<any>('/domains', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    }),

  verify: (id: string) =>
    request<{ verified: boolean; message: string }>(`/domains/${id}/verify`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/domains/${id}`, {
      method: 'DELETE',
    }),
};

// Addresses
export const addressesApi = {
  list: () => request<any[]>('/addresses'),

  listByDomain: (domainId: string) =>
    request<any[]>(`/addresses/domain/${domainId}`),

  create: (data: { localPart: string; domainId: string }) =>
    request<any>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/addresses/${id}`, {
      method: 'DELETE',
    }),
};

// Emails
export interface EmailsQuery {
  addressId?: string;
  isRead?: boolean;
  isStarred?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const emailsApi = {
  list: (query: EmailsQuery = {}) => {
    const params = new URLSearchParams();
    if (query.addressId) params.set('addressId', query.addressId);
    if (query.isRead !== undefined) params.set('isRead', String(query.isRead));
    if (query.isStarred !== undefined) params.set('isStarred', String(query.isStarred));
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    return request<{
      emails: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/emails?${params}`);
  },

  get: (id: string) => request<any>(`/emails/${id}`),

  update: (id: string, data: { isRead?: boolean; isStarred?: boolean }) =>
    request<any>(`/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/emails/${id}`, {
      method: 'DELETE',
    }),

  unreadCount: () => request<{ unreadCount: number }>('/emails/stats/unread'),
};

// Config
export const configApi = {
  get: () => request<{ mxHostname: string }>('/config'),
};

// Admin
export interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { domains: number };
}

export interface Settings {
  id: string;
  allowPublicRegister: boolean;
}

export interface SystemStats {
  users: number;
  domains: number;
  addresses: number;
  emails: number;
}

export const adminApi = {
  // Users
  listUsers: () => request<User[]>('/admin/users'),

  createUser: (data: { email: string; password: string; name?: string; isAdmin?: boolean }) =>
    request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: { name?: string; isAdmin?: boolean; isActive?: boolean; password?: string }) =>
    request<User>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    }),

  // Settings
  getSettings: () => request<Settings>('/admin/settings'),

  updateSettings: (data: { allowPublicRegister?: boolean }) =>
    request<Settings>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Stats
  getStats: () => request<SystemStats>('/admin/stats'),
};
