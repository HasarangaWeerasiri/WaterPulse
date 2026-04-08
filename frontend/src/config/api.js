/**
 * API Configuration
 * Centralized API base URL configuration that uses environment variables
 * 
 * In Vite:
 * - Development: Uses VITE_API_BASE_URL or defaults to http://localhost:5000/api
 * - Production: Uses VITE_API_BASE_URL from .env.production
 */

const getApiBaseUrl = () => {
  // Try Vite environment variable first (recommended way)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback to process.env for backward compatibility
  if (process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }
  
  // Development default
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Sub-service URLs
export const API_URLS = {
  auth: `${API_BASE_URL}/auth`,
  reports: `${API_BASE_URL}/reports`,
  tasks: `${API_BASE_URL}/tasks`,
  waterLogs: `${API_BASE_URL}/logs`,
  safeZones: `${API_BASE_URL}/safe-zones`,
};

export default API_BASE_URL;
