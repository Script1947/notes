// API service module for Daily Notes

const API_BASE = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('daily_notes_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('daily_notes_token', token);
  } else {
    localStorage.removeItem('daily_notes_token');
  }
};

/**
 * Common fetch wrapper with Auth token header
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Auth expired
    setAuthToken(null);
    window.dispatchEvent(new Event('auth_expired'));
  }

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.error) || response.statusText || 'An error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),

  // Notes
  getNotes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.tag) query.append('tag', params.tag);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.date) query.append('date', params.date);
    
    const queryString = query.toString();
    return apiRequest(`/notes${queryString ? `?${queryString}` : ''}`);
  },

  getCalendarSummary: () => apiRequest('/notes/calendar-summary'),
  getTags: () => apiRequest('/notes/tags'),
  getNote: (id) => apiRequest(`/notes/${id}`),

  createNote: (formData) => {
    return apiRequest('/notes', {
      method: 'POST',
      body: formData
    });
  },

  updateNote: (id, formData) => {
    return apiRequest(`/notes/${id}`, {
      method: 'PUT',
      body: formData
    });
  },

  deleteNote: (id) => {
    return apiRequest(`/notes/${id}`, {
      method: 'DELETE'
    });
  },

  deleteAttachment: (noteId, attachmentId) => {
    return apiRequest(`/notes/${noteId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
  },

  seedSampleNotes: () => {
    return apiRequest('/seed', { method: 'POST' });
  },

  // Export URLs (used for direct download link or trigger)
  getExportPdfUrl: () => `${API_BASE}/export/pdf`,
  getExportZipUrl: () => `${API_BASE}/export/zip`,

  downloadExport: async (type) => {
    const token = getAuthToken();
    const url = type === 'pdf' ? `${API_BASE}/export/pdf` : `${API_BASE}/export/zip`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download ${type.toUpperCase()} export`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = type === 'pdf' 
      ? `daily-notes-${new Date().toISOString().split('T')[0]}.pdf`
      : `daily-notes-backup-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }
};
