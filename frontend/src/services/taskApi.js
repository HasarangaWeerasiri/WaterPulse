import axios from 'axios';

const TASK_API_BASE_URL = 'http://localhost:5000/api/tasks';

// Task API wrapper for admin and authority users
// Handles all task-related API operations
export const taskApi = {
  async getTasks() {
    const response = await axios.get(`${TASK_API_BASE_URL}/`);
    return response.data;
  },

  async getTaskById(id) {
    const response = await axios.get(`${TASK_API_BASE_URL}/${id}`);
    return response.data;
  },

  // Admin: Create a new task
  async createTask(payload) {
    const response = await axios.post(TASK_API_BASE_URL + '/', payload);
    return response.data;
  },

  // Authority: Get tasks assigned to current user
  async getMyTasks() {
    const response = await axios.get(`${TASK_API_BASE_URL}/my-tasks`);
    return response.data;
  },

  // Admin: Get all tasks with optional filters
  async getAllTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.reportId) params.append('reportId', filters.reportId);
    
    const url = params.toString() ? `${TASK_API_BASE_URL}?${params.toString()}` : TASK_API_BASE_URL;
    const response = await axios.get(url);
    return response.data;
  },

  // Update task fields (admin only)
  async updateTask(id, payload) {
    const response = await axios.put(`${TASK_API_BASE_URL}/${id}`, payload);
    return response.data;
  },

  // Update task status (admin and authority)
  // For cancellation, can include cancellationReason (authority) or reassignTo (admin)
  async updateTaskStatus(id, status, additionalData = {}) {
    const payload = { status, ...additionalData };
    const response = await axios.put(`${TASK_API_BASE_URL}/${id}/status`, payload);
    return response.data;
  },

  // Delete task (admin only)
  async deleteTask(id) {
    const response = await axios.delete(`${TASK_API_BASE_URL}/${id}`);
    return response.data;
  },

  // Get all authorities for task assignment dropdown
  async getAuthorities() {
    const response = await axios.get(`${TASK_API_BASE_URL}/authorities`);
    return response.data;
  },
};

export default taskApi;

