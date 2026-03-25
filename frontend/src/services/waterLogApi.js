import axios from 'axios';

const WATER_LOG_API_BASE_URL = 'http://localhost:5000/api/logs';

// WaterLog API wrapper used to create/update water quality logs.
export const waterLogApi = {
  async createLog(payload) {
    const response = await axios.post(WATER_LOG_API_BASE_URL + '/', payload);
    return response.data;
  },
};

export default waterLogApi;

