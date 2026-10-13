import { getApiBaseUrl, getWsUrl } from '../config';

/**
 * Real API Client for future FastAPI backend integration
 * When VITE_DEMO_MODE=false, services interact through this client.
 */
class ApiClient {
  constructor() {
    this.token = localStorage.getItem('smartpark_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('smartpark_token', token);
    } else {
      localStorage.removeItem('smartpark_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        let errMessage = `API Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.detail) errMessage = errData.detail;
        } catch (_) {}
        throw new Error(errMessage);
      }
      return await response.json();
    } catch (err) {
      // Never silently fall back to fabricated data when demo mode is off!
      console.error(`API Request failed (${url}):`, err);
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(query ? `${endpoint}?${query}` : endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  connectWebSocket(path, onMessage, onError, onClose) {
    let wsUrl = getWsUrl();
    if (path && !wsUrl.endsWith(path)) {
      if (wsUrl.endsWith('/ws/live')) {
        wsUrl = wsUrl; // already points to main live stream
      } else {
        wsUrl = `${wsUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
      }
    }
    try {
      const socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.warn('Malformed WS message:', event.data);
        }
      };
      socket.onerror = onError;
      socket.onclose = onClose;
      return socket;
    } catch (e) {
      console.error('WebSocket connection error:', e);
      if (onError) onError(e);
      return null;
    }
  }
}

export const apiClient = new ApiClient();
