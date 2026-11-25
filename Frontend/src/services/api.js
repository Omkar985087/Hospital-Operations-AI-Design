import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
  },
});

/**
 * Extracts a human-readable error message from Axios / FastAPI responses.
 */
export function getErrorMessage(error, fallback = 'An unexpected error occurred.') {
  if (!error) return fallback;

  if (error.response) {
    const { data, status } = error.response;

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }

    if (Array.isArray(data?.detail) && data.detail.length > 0) {
      return data.detail
        .map((item) => {
          const field = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== 'body').join('.')
            : '';
          return field ? `${field}: ${item.msg}` : item.msg;
        })
        .join(' | ');
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    return `Server returned HTTP ${status}.`;
  }

  if (error.request) {
    return `Unable to reach the FastAPI backend at ${API_BASE_URL}. Please ensure the backend server is running.`;
  }

  return error.message || fallback;
}

/**
 * Pings GET / to check whether the FastAPI backend is reachable.
 */
export async function checkBackendHealth() {
  const startedAt = performance.now();
  const response = await apiClient.get('/', { timeout: 5000 });
  const latencyMs = Math.round(performance.now() - startedAt);
  return {
    ...response.data,
    latencyMs,
  };
}

export { apiClient };
export default apiClient;

