import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminReportList from '../../components/reports/AdminReportList';
import AdminReportsMap from '../../components/reports/AdminReportsMap';

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
          <div className="p-6 bg-white shadow rounded-xl">Tasks Section</div>
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