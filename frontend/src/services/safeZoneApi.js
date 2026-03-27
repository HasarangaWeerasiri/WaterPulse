import axios from "axios";

const SAFE_ZONE_API_BASE_URL = "http://localhost:5000/api/safe-zones";

export const safeZoneApi = {
  async getAllSafeZones() {
    const response = await axios.get(`${SAFE_ZONE_API_BASE_URL}/all`);
    return response.data;
  },

  async createSafeZone(payload) {
    const response = await axios.post(`${SAFE_ZONE_API_BASE_URL}/`, payload);
    return response.data;
  },

  async updateSafeZone(id, payload) {
    const response = await axios.put(
      `${SAFE_ZONE_API_BASE_URL}/${id}`,
      payload,
    );
    return response.data;
  },

  async getSafeZoneWeather(id) {
    const response = await axios.get(`${SAFE_ZONE_API_BASE_URL}/${id}/weather`);
    return response.data;
  },

  async deleteSafeZone(id) {
    const response = await axios.delete(`${SAFE_ZONE_API_BASE_URL}/${id}`);
    return response.data;
  },
};

export default safeZoneApi;
