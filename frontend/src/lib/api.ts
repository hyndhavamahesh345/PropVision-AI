const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    apiRequest<{ access_token: string; token_type: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiRequest<{ id: string; email: string; is_active: boolean }>('/auth/me'),

  // Properties
  getProperties: () => apiRequest<unknown[]>('/properties/'),
  createProperty: (data: unknown) =>
    apiRequest<unknown>('/properties/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProperty: (id: string) => apiRequest<unknown>(`/properties/${id}`),

  // Videos
  uploadVideo: (
    propertyId: string,
    file: File,
    onProgress?: (p: number) => void
  ): Promise<{ id: string; job_id: string }> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve({ id: 'vid-' + Date.now(), job_id: 'job-' + Date.now() });
        }
      }, 100);
    });
  },

  // Inspections
  getInspection: (jobId: string) => apiRequest<unknown>(`/inspections/${jobId}`),
  getInspections: (params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }) => {
    const q = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiRequest<unknown[]>(`/inspections/${q ? '?' + q : ''}`);
  },
  getInventory: (jobId: string) =>
    apiRequest<unknown>(`/inspections/${jobId}/inventory`),
  getDamages: (jobId: string) =>
    apiRequest<unknown>(`/inspections/${jobId}/damages`),
  retryInspection: (jobId: string) =>
    apiRequest<unknown>(`/inspections/${jobId}/retry`, { method: 'POST' }),

  // Reports
  getReport: (jobId: string) => apiRequest<unknown>(`/reports/${jobId}`),
  generateReport: (jobId: string) =>
    apiRequest<unknown>(`/reports/${jobId}/generate`, { method: 'POST' }),

  // Analytics
  getDashboard: () => apiRequest<unknown>('/analytics/dashboard'),
  getRoomDistribution: () => apiRequest<unknown[]>('/analytics/room-distribution'),
  getObjectFrequency: () => apiRequest<unknown[]>('/analytics/object-frequency'),

  // Chat
  sendChatMessage: (
    inspectionId: string,
    message: string,
    history: unknown[]
  ) =>
    apiRequest<{ response: string }>(`/chat/${inspectionId}`, {
      method: 'POST',
      body: JSON.stringify({
        inspection_id: inspectionId,
        message,
        history,
      }),
    }),
};

export function createWebSocket(jobId: string): WebSocket {
  return new WebSocket(`${WS_BASE}/jobs/${jobId}`);
}

export { API_BASE, WS_BASE };
