import axios from 'axios';
import { API_URLS } from '../config/api.js';

// Base URL for contamination report APIs
const REPORT_API_BASE_URL = API_URLS.reports;

// Single-responsibility API wrapper for contamination reports
// This keeps networking concerns separate from UI components (SRP / DIP).
export const reportApi = {
  async createReport(payload) {
    const response = await axios.post(REPORT_API_BASE_URL + '/', payload);
    return response.data;
  },

  // Admin & authority: fetch reports that are waiting to be actioned
  async getPendingReports() {
    const response = await axios.get(REPORT_API_BASE_URL + '/pending');
    return response.data;
  },

  async getMyReports() {
    const response = await axios.get(REPORT_API_BASE_URL + '/my-reports');
    return response.data;
  },

  // Admin & authority: fetch all contamination reports
  async getAllReports() {
    const response = await axios.get(REPORT_API_BASE_URL + '/all');
    return response.data;
  },

  // Any authenticated user: fetch all confirmed reports (for citizen map)
  async getConfirmedReports() {
    const response = await axios.get(REPORT_API_BASE_URL + '/confirmed');
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
  // Admin & authority: update only the status field
  async updateReportStatus(id, status) {
    const response = await axios.put(`${REPORT_API_BASE_URL}/${id}/status`, { status });
    return response.data;
  },

  // Download a single report as PDF (returns a Blob)
  async downloadReportPdf(id) {
    const response = await axios.get(`${REPORT_API_BASE_URL}/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download all reports as a single PDF (returns a Blob)
  async downloadAllReportsPdf() {
    const response = await axios.get(`${REPORT_API_BASE_URL}/all/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportApi;
