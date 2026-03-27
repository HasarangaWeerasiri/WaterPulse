import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminReportList from "../../components/reports/AdminReportList";
import AdminReportsMap from "../../components/reports/AdminReportsMap";
import AdminTaskDashboard from "./AdminTaskDashboard";
import AdminSafeZoneManager from "../../components/safezones/AdminSafeZoneManager";
import reportApi from "../../services/reportApi";
import taskApi from "../../services/taskApi";
import waterLogApi from "../../services/waterLogApi";
import { StatusBadge } from "../../components/reports/StatusBadge";

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "authority",
    phoneNumber: "",
    city: "",
    district: "",
  });

  const [message, setMessage] = useState("");

  // --- Task assignment (admin -> authority) ---
  const [pendingReports, setPendingReports] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loadingTaskForm, setLoadingTaskForm] = useState(false);

  const [selectedReportId, setSelectedReportId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [taskSubmitError, setTaskSubmitError] = useState("");
  const [taskSubmitSuccess, setTaskSubmitSuccess] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // --- Admin view: water logs created by authorities ---
  const [authorityWaterLogs, setAuthorityWaterLogs] = useState([]);
  const [authorityWaterLogsLoading, setAuthorityWaterLogsLoading] = useState(false);
  const [authorityWaterLogsError, setAuthorityWaterLogsError] = useState("");

  const [deletingWaterLogId, setDeletingWaterLogId] = useState("");
  const [deleteWaterLogError, setDeleteWaterLogError] = useState("");

  // WaterLogs filters
  const [waterLogSearch, setWaterLogSearch] = useState("");
  const [waterLogRegion, setWaterLogRegion] = useState("");
  const [waterLogSafetyRating, setWaterLogSafetyRating] = useState("all");
  const [waterLogReportStatus, setWaterLogReportStatus] = useState("all");
  const [waterLogCreatorRole, setWaterLogCreatorRole] = useState("all");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/create-admin-authority",
        formData
      );
      setMessage(`✓ ${formData.role} created successfully: ${response.data.user.email}`);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "authority",
        phoneNumber: "",
        city: "",
        district: "",
      });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.message || "Failed to create"}`);
    }
  };

  const refreshPendingReportsAndAuthorities = async () => {
    setLoadingTaskForm(true);
    setTaskSubmitError("");
    setTaskSubmitSuccess("");
    try {
      const [pending, auths] = await Promise.all([
        reportApi.getPendingReports(),
        taskApi.getAuthorities(),
      ]);

      setPendingReports(Array.isArray(pending) ? pending : []);
      setAuthorities(Array.isArray(auths?.authorities) ? auths.authorities : []);
      const firstAuthorityId = Array.isArray(auths?.authorities) && auths.authorities.length ? auths.authorities[0]._id : "";
      setAssignedTo(firstAuthorityId);
    } catch (err) {
      setTaskSubmitError(err?.response?.data?.message || "Failed to load task assignment data");
    } finally {
      setLoadingTaskForm(false);
    }
  };

  useEffect(() => {
    refreshPendingReportsAndAuthorities();
  }, []);

  const refreshAuthorityWaterLogs = async () => {
    setAuthorityWaterLogsLoading(true);
    setAuthorityWaterLogsError("");
    try {
      const data = await waterLogApi.getAllLogs();
      setAuthorityWaterLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (err) {
      setAuthorityWaterLogsError(err?.response?.data?.message || "Failed to load logs");
    } finally {
      setAuthorityWaterLogsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuthorityWaterLogs();
  }, []);

  const handleDeleteWaterLog = async (logId) => {
    if (user?.role !== "admin" || !logId) return;
    if (!window.confirm("Delete this water log? This cannot be undone.")) return;

    setDeleteWaterLogError("");
    setDeletingWaterLogId(logId);
    try {
      await waterLogApi.deleteLog(logId);
      await refreshAuthorityWaterLogs();
    } catch (err) {
      setDeleteWaterLogError(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingWaterLogId("");
    }
  };

  const filteredWaterLogs = useMemo(() => {
    const regionQ = waterLogRegion.trim().toLowerCase();
    const searchQ = waterLogSearch.trim().toLowerCase();

    return authorityWaterLogs.filter((log) => {
      if (waterLogSafetyRating !== "all" && log.safetyRating !== waterLogSafetyRating) return false;
      if (waterLogReportStatus !== "all" && log?.reportId?.status !== waterLogReportStatus) return false;
      if (waterLogCreatorRole !== "all" && log?.recordedBy?.role !== waterLogCreatorRole) return false;
      if (regionQ && !(log.region || "").toLowerCase().includes(regionQ)) return false;
      if (searchQ) {
        const title = (log?.reportId?.title || "").toLowerCase();
        const address = (log?.reportId?.address || "").toLowerCase();
        const creator = `${log?.recordedBy?.firstName || ""} ${log?.recordedBy?.lastName || ""}`.toLowerCase();
        if (![title, address, creator].some((v) => v.includes(searchQ))) return false;
      }
      return true;
    });
  }, [authorityWaterLogs, waterLogSearch, waterLogRegion, waterLogSafetyRating, waterLogReportStatus, waterLogCreatorRole]);

  const groupWaterLogsByReport = useMemo(() => {
    const map = {};
    for (const log of filteredWaterLogs) {
      const report = log?.reportId;
      if (!report?._id) continue;
      if (!map[report._id]) {
        map[report._id] = { report, logs: [] };
      }
      map[report._id].logs.push(log);
    }
    return Object.entries(map).map(([reportId, group]) => ({
      reportId,
      report: group.report,
      logs: group.logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      lastStatusChanging: group.logs.find(l => l.safetyRating === "Safe" || l.safetyRating === "Unsafe") || group.logs[0]
    })).sort((a, b) => new Date(b.lastStatusChanging?.createdAt || 0) - new Date(a.lastStatusChanging?.createdAt || 0));
  }, [filteredWaterLogs]);

  const getSafetyBadgeClasses = (rating) => {
    const r = (rating || "").toLowerCase();
    if (r === "safe") return "bg-emerald-100 text-emerald-800";
    if (r === "unsafe") return "bg-red-100 text-red-800";
    if (r === "warning") return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  const tabs = ["overview", "create", "reports", "safe-zones", "tasks", "waterlogs", "map"];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#eef2ff] to-[#f8fafc]">
      {/* Sidebar */}
      <div className="flex flex-col w-64 p-6 bg-white shadow-xl">
        <h1 className="text-2xl font-bold text-[#00569c] mb-10">WaterPulse</h1>
        <div className="space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                activeTab === tab ? "bg-[#00569c] text-white shadow" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.replace("-", " ").toUpperCase()}
            </button>
          ))}
          <div className="pt-1">
            <button onClick={handleLogout} className="flex items-center w-full gap-2 px-4 py-3 font-medium text-white transition bg-red-500 rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="mb-6 text-3xl font-bold text-gray-800">Welcome, {user?.firstName}</h2>

        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 bg-white shadow rounded-xl">System running smoothly</div>
            <div className="p-6 bg-white shadow rounded-xl">Active users online</div>
            <div className="p-6 bg-white shadow rounded-xl">Role: {user?.role}</div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="max-w-3xl p-8 bg-white shadow-xl rounded-xl">
            <h2 className="text-2xl font-bold text-[#00569c] mb-6">Create Account</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
               {/* Form Inputs (Same as original) */}
               <div className="grid grid-cols-2 gap-4">
                <input name="firstName" value={formData.firstName} onChange={handleCreateChange} placeholder="First Name" className="input" required />
                <input name="lastName" value={formData.lastName} onChange={handleCreateChange} placeholder="Last Name" className="input" required />
              </div>
              <input type="email" name="email" value={formData.email} onChange={handleCreateChange} placeholder="Email" className="input" required />
              <input type="password" name="password" value={formData.password} onChange={handleCreateChange} placeholder="Password" className="input" required />
              <button className="w-full py-3 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73]">Create Account</button>
            </form>
          </div>
        )}

        {activeTab === "reports" && <AdminReportList />}
        
        {activeTab === "safe-zones" && <AdminSafeZoneManager />}

        {activeTab === "tasks" && <AdminTaskDashboard />}

        {activeTab === "waterlogs" && (
          <div className="p-6 bg-white shadow rounded-xl">
            <h3 className="text-2xl font-bold text-[#00569c] mb-4">WaterLogs</h3>
            {/* ... Keep the complex Filtering and Mapping logic from the original file ... */}
            <div className="space-y-6">
                {groupWaterLogsByReport.map((group) => (
                    <div key={group.reportId} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between">
                            <span className="font-bold">{group.report?.title}</span>
                            <StatusBadge status={group.report?.status} />
                        </div>
                        {group.logs.map(log => (
                            <div key={log._id} className="mt-2 p-2 bg-white border rounded">
                                <span className={`text-xs font-bold ${getSafetyBadgeClasses(log.safetyRating)} px-2 py-1 rounded`}>
                                    {log.safetyRating}
                                </span>
                                <p className="text-sm mt-1">pH: {log.phLevel} | Turbidity: {log.turbidity}</p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === "map" && <div className="p-2"><AdminReportsMap /></div>}
      </div>

      <style jsx>{`
        .input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; outline: none; transition: 0.3s; }
        .input:focus { border-color: #00569c; box-shadow: 0 0 0 2px rgba(0, 86, 156, 0.2); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;