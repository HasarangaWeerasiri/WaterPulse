import axios from "axios";
import { API_URLS } from '../config/api.js';

const API_BASE_URL = API_URLS.safeZones;

const safeZoneApi = {
  // Get all safe zones
  getAllSafeZones: async () => {
    const response = await axios.get(`${API_BASE_URL}/all`);
    return response.data;
  },

  // Get safe zones created by the logged-in user
  getMyCreatedSafeZones: async () => {
    const response = await axios.get(`${API_BASE_URL}/my-zones`);
    return response.data;
  },

  // Get safe zones nearby a location
  getNearbySafeZones: async (lat, lng, maxDistance = 10000, limit = 5) => {
    const response = await axios.get(`${API_BASE_URL}/nearby`, {
      params: { lat, lng, maxDistance, limit },
    });
    return response.data;
  },

  // Get a single safe zone by ID
  getSafeZoneById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  // Get weather and contamination risk for a safe zone
  getSafeZoneWeather: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}/weather`);
    return response.data;
  },

  // Create a new safe zone
  createSafeZone: async (data) => {
    const response = await axios.post(`${API_BASE_URL}`, data);
    return response.data;
  },

  // Update a safe zone
  updateSafeZone: async (id, data) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  },

  // Delete a safe zone
  deleteSafeZone: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  },
};

export default safeZoneApi;
