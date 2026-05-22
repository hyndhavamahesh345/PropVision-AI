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
  
  // Add cache-busting headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    // Add timestamp to URL to prevent caching
    'X-Request-ID': `${Date.now()}-${Math.random()}`,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
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
  uploadVideo: async (
    propertyId: string,
    file: File,
    onProgress?: (p: number) => void
  ): Promise<{ id: string; job_id: string; message?: string }> => {
    // Note: Standard fetch doesn't support upload progress. 
    // We simulate progress for UI purposes, but wait for actual fetch.
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) onProgress(progress);
        else clearInterval(interval);
      }, 500);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/inspections/upload?property_id=${propertyId}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error('Video upload failed');
    }
    
    if (onProgress) onProgress(100);
    return res.json();
  },

  // Inspections
  getInspection: (jobId: string) => {
    // Add timestamp to prevent caching
    const noCacheUrl = `/inspections/status/${jobId}?t=${Date.now()}`;
    return apiRequest<unknown>(noCacheUrl);
  },
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
