import axios from 'axios';

const TASK_API_BASE_URL = 'http://localhost:5000/api/tasks';

// Task API wrapper used by admin (create task) and authority (view assigned tasks).
export const taskApi = {
  async createTask(payload) {
    const response = await axios.post(TASK_API_BASE_URL + '/', payload);
    return response.data;
  },

  async getMyTasks() {
    const response = await axios.get(`${TASK_API_BASE_URL}/my-tasks`);
    return response.data;
  },

  async getAuthorities() {
    const response = await axios.get(`${TASK_API_BASE_URL}/authorities`);
    return response.data;
  },
};

export default taskApi;

