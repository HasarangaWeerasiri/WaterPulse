import axios from 'axios';

const WATER_LOG_API_BASE_URL = 'http://localhost:5000/api/logs';

// WaterLog API wrapper used to create/update water quality logs.
export const waterLogApi = {
  async createLog(payload) {
    const response = await axios.post(WATER_LOG_API_BASE_URL + '/', payload);
    return response.data;
  },

  // Fetch all water logs (admin/authority can filter client-side)
  async getAllLogs() {
    const response = await axios.get(WATER_LOG_API_BASE_URL + '/');
    return response.data;
  },

  // Fetch all water logs in a specific region
  async getLogsByRegion(region) {
    const response = await axios.get(`${WATER_LOG_API_BASE_URL}/region/${encodeURIComponent(region)}`);
    return response.data;
  },

  async deleteLog(id) {
    const response = await axios.delete(`${WATER_LOG_API_BASE_URL}/${id}`);
    return response.data;
  },

  // Fetch analytics trends data
  async getAnalyticsTrends(region = null, months = 12) {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    params.append('months', months);
    const url = params.toString() ? `${WATER_LOG_API_BASE_URL}/analytics/trends?${params.toString()}` : `${WATER_LOG_API_BASE_URL}/analytics/trends`;
    const response = await axios.get(url);
    return response.data;
  },
};

export default waterLogApi;

