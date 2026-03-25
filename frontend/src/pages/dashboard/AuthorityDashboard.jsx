import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import taskApi from '../../services/taskApi';
import waterLogApi from '../../services/waterLogApi';
import { StatusBadge } from '../../components/reports/StatusBadge';

export const AuthorityDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [myTasks, setMyTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState('');

  const [selectedTaskId, setSelectedTaskId] = useState('');

  // Water log creation form (for the selected assigned report)
  const defaultRegion = useMemo(() => {
    return user?.location?.district || user?.location?.city || '';
  }, [user?.location?.district, user?.location?.city]);

  const [region, setRegion] = useState('');
  const [phLevel, setPhLevel] = useState('');
  const [turbidity, setTurbidity] = useState('');
  const [contaminantsText, setContaminantsText] = useState('');
  const [creatingLog, setCreatingLog] = useState(false);
  const [logMessage, setLogMessage] = useState('');
  const [logError, setLogError] = useState('');

  const selectedTask = useMemo(
    () => myTasks.find((t) => t._id === selectedTaskId) || null,
    [myTasks, selectedTaskId]
  );

  useEffect(() => {
    setRegion(defaultRegion);
  }, [defaultRegion]);

  const refreshMyTasks = async () => {
    setTasksLoading(true);
    setTasksError('');
    try {
      const data = await taskApi.getMyTasks();
      setMyTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (err) {
      setTasksError(err?.response?.data?.message || 'Failed to load assigned tasks');
      setMyTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    refreshMyTasks();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">WaterPulse Authority</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome,</p>
                <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'manage'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manage Issues
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Authority Dashboard</h2>
              <p className="text-gray-600 mb-6">
                Monitor water-related issues, respond to citizen reports, and manage regional water infrastructure. You have authority-level access to {user?.location?.district || 'your district'}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-green-600 mb-2">📍 District</h3>
                  <p className="text-gray-600">{user?.location?.district || 'Assigned District'}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-600 mb-2">🚨 Pending Issues</h3>
                  <p className="text-gray-600">
                    {myTasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length} reports awaiting action
                  </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-purple-600 mb-2">✓ Resolved</h3>
                  <p className="text-gray-600">
                    {myTasks.filter((t) => t.reportId?.status === 'Resolved').length} resolved reports
                  </p>
                </div>
              </div>
            </div>

            {/* Authority Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 Infrastructure Maintenance</h3>
                <p className="text-gray-600 mb-4">Schedule and track maintenance in your district</p>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  Schedule Maintenance
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Region Reports</h3>
                <p className="text-gray-600 mb-4">View water quality and usage reports</p>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  View Reports
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📢 Broadcast Messages</h3>
                <p className="text-gray-600 mb-4">Send alerts to citizens in your district</p>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  Send Alert
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Citizen Feedback</h3>
                <p className="text-gray-600 mb-4">Review feedback from your region</p>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  View Feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Issues Tab */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Water Issues</h2>

            {tasksError && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {tasksError}
              </div>
            )}

            {tasksLoading ? (
              <div className="p-4 text-gray-600">Loading assigned reports...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {myTasks.length === 0 ? (
                    <div className="p-6 rounded-lg bg-gray-50 text-gray-600 text-sm">
                      No assigned tasks yet.
                    </div>
                  ) : (
                    myTasks.map((task) => {
                      const report = task.reportId;
                      const isSelected = task._id === selectedTaskId;
                      return (
                        <div
                          key={task._id}
                          className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                            isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {report?.title || 'Untitled report'}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              Task: <span className="font-medium">{task.status}</span> • Report:{' '}
                              {report?.status || 'Unverified'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskId(task._id);
                              setLogMessage('');
                              setLogError('');
                              setPhLevel('');
                              setTurbidity('');
                              setContaminantsText('');
                            }}
                            className={`px-4 py-2 rounded-lg transition text-sm ${
                              isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Log Water Sample'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Water log form */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Create Water Log</h3>

                  {!selectedTask ? (
                    <div className="text-sm text-gray-600">
                      Select an assigned report to create a water log.
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-1">Report Status</div>
                        <StatusBadge status={selectedTask.reportId?.status} />
                        <div className="text-xs text-gray-500 mt-2">
                          {selectedTask.reportId?.address || 'No address available'}
                        </div>
                      </div>

                      {logError && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                          {logError}
                        </div>
                      )}
                      {logMessage && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                          {logMessage}
                        </div>
                      )}

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setLogError('');
                          setLogMessage('');

                          if (!selectedTask.reportId?._id) return setLogError('Missing reportId');
                          if (!region.trim()) return setLogError('Region is required');
                          if (phLevel === '' || turbidity === '') return setLogError('pH Level and Turbidity are required');

                          const ph = Number(phLevel);
                          const turb = Number(turbidity);
                          if (Number.isNaN(ph) || Number.isNaN(turb)) return setLogError('pH Level and Turbidity must be numbers');

                          const contaminants = contaminantsText
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);

                          setCreatingLog(true);
                          try {
                            await waterLogApi.createLog({
                              region: region.trim(),
                              reportId: selectedTask.reportId._id,
                              phLevel: ph,
                              turbidity: turb,
                              contaminants,
                            });

                            setLogMessage('Water log created. Report status may be updated automatically.');
                            setPhLevel('');
                            setTurbidity('');
                            setContaminantsText('');
                            await refreshMyTasks();
                          } catch (err) {
                            setLogError(err?.response?.data?.message || 'Failed to create water log');
                          } finally {
                            setCreatingLog(false);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Region</label>
                            <input
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              placeholder="e.g., Colombo District"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">pH Level</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="14"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={phLevel}
                              onChange={(e) => setPhLevel(e.target.value)}
                              placeholder="0 - 14"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-semibold text-gray-700">Turbidity (NTU)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={turbidity}
                            onChange={(e) => setTurbidity(e.target.value)}
                            placeholder="e.g., 3.2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-semibold text-gray-700">
                            Contaminants (comma separated, optional)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={contaminantsText}
                            onChange={(e) => setContaminantsText(e.target.value)}
                            placeholder="e.g., Lead, E. coli, Iron"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={creatingLog}
                          className="w-full py-3 bg-[#164871] text-white font-semibold rounded-lg hover:bg-[#608A9A] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                        >
                          {creatingLog ? 'Submitting...' : 'Create Water Log'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
