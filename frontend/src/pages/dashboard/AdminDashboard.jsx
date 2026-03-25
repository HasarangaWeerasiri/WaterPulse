import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminReportList from '../../components/reports/AdminReportList';
import AdminReportsMap from '../../components/reports/AdminReportsMap';
import reportApi from '../../services/reportApi';
import taskApi from '../../services/taskApi';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'authority',
    phoneNumber: '',
    city: '',
    district: ''
  });

  const [message, setMessage] = useState('');

  // Task assignment (admin -> authority)
  const [pendingReports, setPendingReports] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loadingTaskForm, setLoadingTaskForm] = useState(false);

  const [selectedReportId, setSelectedReportId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [taskSubmitError, setTaskSubmitError] = useState('');
  const [taskSubmitSuccess, setTaskSubmitSuccess] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/create-admin-authority', formData);
      setMessage(`✓ ${formData.role} created successfully: ${response.data.user.email}`);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'authority',
        phoneNumber: '',
        city: '',
        district: ''
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.message || 'Failed to create'}`);
    }
  };

  const refreshPendingReportsAndAuthorities = async () => {
    setLoadingTaskForm(true);
    setTaskSubmitError('');
    setTaskSubmitSuccess('');
    try {
      const [pending, auths] = await Promise.all([
        reportApi.getPendingReports(),
        taskApi.getAuthorities(),
      ]);

      setPendingReports(Array.isArray(pending) ? pending : []);
      setAuthorities(Array.isArray(auths?.authorities) ? auths.authorities : []);
      const firstAuthorityId = Array.isArray(auths?.authorities) && auths.authorities.length
        ? auths.authorities[0]._id
        : '';
      setAssignedTo(firstAuthorityId);
    } catch (err) {
      setTaskSubmitError(err?.response?.data?.message || 'Failed to load task assignment data');
      setPendingReports([]);
      setAuthorities([]);
      setAssignedTo('');
    } finally {
      setLoadingTaskForm(false);
    }
  };

  useEffect(() => {
    refreshPendingReportsAndAuthorities();
  }, []);

  const handleSelectReport = (reportId) => {
    setSelectedReportId(reportId);
    const report = pendingReports.find((r) => r._id === reportId);
    setPriority('medium');
    setTaskTitle(report ? `Investigate: ${report.title}` : '');
    setTaskDescription('');
    setDueDate('');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskSubmitError('');
    setTaskSubmitSuccess('');

    if (!selectedReportId) return setTaskSubmitError('Please select a report');
    if (!assignedTo) return setTaskSubmitError('Please select an authority');
    if (!taskTitle.trim()) return setTaskSubmitError('Task title is required');

    setSubmittingTask(true);
    try {
      await taskApi.createTask({
        reportId: selectedReportId,
        assignedTo,
        priority,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        dueDate: dueDate || undefined,
      });

      setTaskSubmitSuccess('Task created successfully. The report is now marked as In Progress.');
      setSelectedReportId('');
      setTaskTitle('');
      setTaskDescription('');
      setDueDate('');

      await refreshPendingReportsAndAuthorities();
    } catch (err) {
      setTaskSubmitError(err?.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const tabs = ['overview', 'create', 'reports', 'tasks', 'map'];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#eef2ff] to-[#f8fafc]">

      {/* Sidebar */}
      <div className="flex flex-col w-64 p-6 bg-white shadow-xl">
        <h1 className="text-2xl font-bold text-[#00569c] mb-10">WaterPulse</h1>

        <div className="space-y-3">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                activeTab === tab
                  ? 'bg-[#00569c] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}

          {/* Logout — sits just below MAP with a small gap */}
          <div className="pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-2 px-4 py-3 font-medium text-white transition bg-red-500 rounded-lg hover:bg-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">

        <h2 className="mb-6 text-3xl font-bold text-gray-800">
          Welcome, {user?.firstName}
        </h2>

        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 transition bg-white shadow rounded-xl hover:shadow-lg">System running smoothly</div>
            <div className="p-6 transition bg-white shadow rounded-xl hover:shadow-lg">Active users online</div>
            <div className="p-6 transition bg-white shadow rounded-xl hover:shadow-lg">Role: {user?.role}</div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-3xl p-8 bg-white shadow-xl rounded-xl">
            <h2 className="text-2xl font-bold text-[#00569c] mb-6">Create Admin or Authority Account</h2>

            {message && (
              <div className={`mb-4 p-4 rounded-lg ${
                message.includes('✓') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={message.includes('✓') ? 'text-green-700' : 'text-red-700'}>{message}</p>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="firstName" value={formData.firstName} onChange={handleCreateChange} placeholder="First Name" className="input" required />
                <input name="lastName"  value={formData.lastName}  onChange={handleCreateChange} placeholder="Last Name"  className="input" required />
              </div>
              <input type="email"    name="email"    value={formData.email}    onChange={handleCreateChange} placeholder="Email"    className="input" required />
              <input type="password" name="password" value={formData.password} onChange={handleCreateChange} placeholder="Password" className="input" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleCreateChange} placeholder="Phone Number" className="input" />
                <select name="role" value={formData.role} onChange={handleCreateChange} className="input">
                  <option value="authority">Authority</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="city"     value={formData.city}     onChange={handleCreateChange} placeholder="City"     className="input" />
                <input name="district" value={formData.district} onChange={handleCreateChange} placeholder="District" className="input" />
              </div>
              <button className="w-full py-3 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition">
                Create Account
              </button>
            </form>
          </div>
        )}

        {activeTab === 'reports' && <AdminReportList />}

        {activeTab === 'tasks' && (
          <div className="p-6 bg-white shadow rounded-xl">
            <h3 className="text-2xl font-bold text-[#00569c] mb-4">Create Task (Admin)</h3>

            {loadingTaskForm ? (
              <div className="p-4 text-gray-600">Loading pending reports and authorities...</div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-4">
                {taskSubmitError && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-700">{taskSubmitError}</p>
                  </div>
                )}
                {taskSubmitSuccess && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-green-700">{taskSubmitSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Report</label>
                  <select
                    className="input"
                    value={selectedReportId}
                    onChange={(e) => handleSelectReport(e.target.value)}
                  >
                    <option value="">Select a pending report</option>
                    {pendingReports.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title} {r.address ? `(${r.address})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Assign To</label>
                    <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                      <option value="">Select authority</option>
                      {authorities.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.firstName} {a.lastName} ({a.location?.district || 'Unknown district'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Priority</label>
                    <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Task Title</label>
                  <input
                    className="input"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g., Investigate contamination report"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Description (optional)</label>
                  <textarea
                    className="input"
                    style={{ height: 110 }}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Add any notes for the authority team..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Due Date (optional)</label>
                    <input
                      type="date"
                      className="input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={submittingTask}
                      className="w-full py-3 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submittingTask ? 'Creating...' : 'Create Task'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="p-2">
            <AdminReportsMap />
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          outline: none;
          transition: 0.3s;
        }
        .input:focus {
          border-color: #00569c;
          box-shadow: 0 0 0 2px rgba(0,86,156,0.2);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;