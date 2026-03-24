import axios from 'axios';

// Base URL for contamination report APIs
const REPORT_API_BASE_URL = 'http://localhost:5000/api/reports';

// Single-responsibility API wrapper for contamination reports
// This keeps networking concerns separate from UI components (SRP / DIP).
export const reportApi = {
  async createReport(payload) {
    const response = await axios.post(REPORT_API_BASE_URL + '/', payload);
    return response.data;
  },

  async getMyReports() {
    const response = await axios.get(REPORT_API_BASE_URL + '/my-reports');
    return response.data;
  },

  async getReportById(id) {
    const response = await axios.get(`${REPORT_API_BASE_URL}/${id}`);
    return response.data;
  },

  async deleteReport(id) {
    const response = await axios.delete(`${REPORT_API_BASE_URL}/${id}`);
    return response.data;
  },

  async updateReport(id, payload) {
    const response = await axios.put(`${REPORT_API_BASE_URL}/${id}`, payload);
    return response.data;
  },
};

export default reportApi;
