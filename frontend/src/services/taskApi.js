import axios from 'axios';

const TASK_API_BASE_URL = 'http://localhost:5000/api/tasks';

// Task API wrapper used by admin (create task) and authority (view assigned tasks).
export const taskApi = {
  async getTasks() {
    const response = await axios.get(`${TASK_API_BASE_URL}/`);
    return response.data;
  },

  async getTaskById(id) {
    const response = await axios.get(`${TASK_API_BASE_URL}/${id}`);
    return response.data;
  },

  async createTask(payload) {
    const response = await axios.post(TASK_API_BASE_URL + '/', payload);
    return response.data;
  },

  async getMyTasks() {
    const response = await axios.get(`${TASK_API_BASE_URL}/my-tasks`);
    return response.data;
  },

  async updateTask(id, payload) {
    const response = await axios.put(`${TASK_API_BASE_URL}/${id}`, payload);
    return response.data;
  },

  async updateTaskStatus(id, status) {
    const response = await axios.patch(`${TASK_API_BASE_URL}/${id}/status`, { status });
    return response.data;
  },

  async deleteTask(id) {
    const response = await axios.delete(`${TASK_API_BASE_URL}/${id}`);
    return response.data;
  },

  async getAuthorities() {
    const response = await axios.get(`${TASK_API_BASE_URL}/authorities`);
    return response.data;
  },
};

export default taskApi;

