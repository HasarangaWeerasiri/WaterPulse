import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminReportList from "../../components/reports/AdminReportList";
import AdminReportsMap from "../../components/reports/AdminReportsMap";
import AdminTaskDashboard from "./AdminTaskDashboard";
import SafeZoneList from "../../components/reports/SafeZoneList";
import SafeZonesMap from "../../components/reports/SafeZonesMap";
import TaskListSection from "../../components/tasks/TaskListSection";
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

  // Task assignment (admin -> authority)
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

  // Admin view: water logs created by authorities
  const [authorityWaterLogs, setAuthorityWaterLogs] = useState([]);
  const [authorityWaterLogsLoading, setAuthorityWaterLogsLoading] =
    useState(false);
  const [authorityWaterLogsError, setAuthorityWaterLogsError] = useState("");

  const [deletingWaterLogId, setDeletingWaterLogId] = useState("");
  const [deleteWaterLogError, setDeleteWaterLogError] = useState("");

  // WaterLogs filters (admin view)
  const [waterLogSearch, setWaterLogSearch] = useState("");
  const [waterLogRegion, setWaterLogRegion] = useState("");
  const [waterLogSafetyRating, setWaterLogSafetyRating] = useState("all"); // all | Safe | Warning | Unsafe
  const [waterLogReportStatus, setWaterLogReportStatus] = useState("all"); // all | Unverified | In Progress | Confirmed | Resolved | Spam
  const [waterLogCreatorRole, setWaterLogCreatorRole] = useState("all"); // all | authority | admin

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
        formData,
      );
      setMessage(
        `✓ ${formData.role} created successfully: ${response.data.user.email}`,
      );
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
      setMessage(
        `✗ Error: ${error.response?.data?.message || "Failed to create"}`,
      );
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
      setAuthorities(
        Array.isArray(auths?.authorities) ? auths.authorities : [],
      );
      const firstAuthorityId =
        Array.isArray(auths?.authorities) && auths.authorities.length
          ? auths.authorities[0]._id
          : "";
      setAssignedTo(firstAuthorityId);
    } catch (err) {
      setTaskSubmitError(
        err?.response?.data?.message || "Failed to load task assignment data",
      );
      setPendingReports([]);
      setAuthorities([]);
      setAssignedTo("");
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
      const logs = Array.isArray(data?.logs) ? data.logs : [];
      setAuthorityWaterLogs(logs);
    } catch (err) {
      setAuthorityWaterLogsError(
        err?.response?.data?.message || "Failed to load authority water logs",
      );
      setAuthorityWaterLogs([]);
    } finally {
      setAuthorityWaterLogsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuthorityWaterLogs();
  }, []);

  const handleDeleteWaterLog = async (logId) => {
    // Backend already restricts to admin, but we keep the UI consistent with requirement.
    if (user?.role !== "admin") return;
    if (!logId) return;

    const confirmed = window.confirm(
      "Delete this water log? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeleteWaterLogError("");
    setDeletingWaterLogId(logId);
    try {
      await waterLogApi.deleteLog(logId);
      await refreshAuthorityWaterLogs();
    } catch (err) {
      setDeleteWaterLogError(
        err?.response?.data?.message || "Failed to delete water log",
      );
    } finally {
      setDeletingWaterLogId("");
    }
  };

  const getSafetyBadgeClasses = (rating) => {
    const r = (rating || "").toLowerCase();
    if (r === "safe") return "bg-emerald-100 text-emerald-800";
    if (r === "unsafe") return "bg-red-100 text-red-800";
    if (r === "warning") return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  const filteredWaterLogs = useMemo(() => {
    const regionQ = waterLogRegion.trim().toLowerCase();
    const searchQ = waterLogSearch.trim().toLowerCase();

    return authorityWaterLogs.filter((log) => {
      if (
        waterLogSafetyRating !== "all" &&
        log.safetyRating !== waterLogSafetyRating
      )
        return false;

      if (
        waterLogReportStatus !== "all" &&
        log?.reportId?.status !== waterLogReportStatus
      )
        return false;

      if (
        waterLogCreatorRole !== "all" &&
        log?.recordedBy?.role !== waterLogCreatorRole
      )
        return false;

      if (regionQ) {
        const logRegion = (log.region || "").toLowerCase();
        if (!logRegion.includes(regionQ)) return false;
      }

      if (searchQ) {
        const title = (log?.reportId?.title || "").toLowerCase();
        const address = (log?.reportId?.address || "").toLowerCase();
        const creator =
          `${log?.recordedBy?.firstName || ""} ${log?.recordedBy?.lastName || ""}`.toLowerCase();
        if (![title, address, creator].some((v) => v.includes(searchQ)))
          return false;
      }

      return true;
    });
  }, [
    authorityWaterLogs,
    waterLogSearch,
    waterLogRegion,
    waterLogSafetyRating,
    waterLogReportStatus,
    waterLogCreatorRole,
  ]);

  const groupWaterLogsByReport = useMemo(() => {
    const map = {};
    for (const log of filteredWaterLogs) {
      const report = log?.reportId;
      const reportId = report?._id;
      if (!reportId) continue;
      if (!map[reportId]) {
        map[reportId] = {
          report,
          logs: [],
        };
      }
      map[reportId].logs.push(log);
    }

    for (const reportId of Object.keys(map)) {
      map[reportId].logs.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }

    // Sort report groups by the most recent status-changing log
    const groups = Object.entries(map).map(([reportId, group]) => {
      const logs = group.logs;
      const lastStatusChanging =
        logs.find(
          (l) => l.safetyRating === "Safe" || l.safetyRating === "Unsafe",
        ) ||
        logs[0] ||
        null;
      return {
        reportId,
        report: group.report,
        logs,
        lastStatusChanging,
      };
    });

    groups.sort(
      (a, b) =>
        new Date(b.lastStatusChanging?.createdAt || 0) -
        new Date(a.lastStatusChanging?.createdAt || 0),
    );
    return groups;
  }, [filteredWaterLogs]);

  const getWhatHappened = (log) => {
    if (!log) return "";
    const ph = log.phLevel;
    const turb = log.turbidity;

    if (log.safetyRating === "Unsafe") {
      const reasons = [];
      if (ph < 6.0 || ph > 9.0)
        reasons.push(`pH is ${ph} (outside safe range)`);
      if (turb > 10) reasons.push(`turbidity is ${turb} NTU (high)`);
      const reasonText = reasons.length
        ? reasons.join(" and ")
        : "water parameters indicate unsafe conditions";
      return `${reasonText}. This log verifies contamination risk. Report status: Confirmed.`;
    }

    if (log.safetyRating === "Safe") {
      return `pH and turbidity are within safe ranges. This log confirms the water is now clean. Report status: Resolved.`;
    }

    return `Mixed results (Warning). Report status is not automatically changed for Warning logs.`;
  };

  const handleSelectReport = (reportId) => {
    setSelectedReportId(reportId);
    const report = pendingReports.find((r) => r._id === reportId);
    setPriority("medium");
    setTaskTitle(report ? `Investigate: ${report.title}` : "");
    setTaskDescription("");
    setDueDate("");
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskSubmitError("");
    setTaskSubmitSuccess("");

    if (!selectedReportId) return setTaskSubmitError("Please select a report");
    if (!assignedTo) return setTaskSubmitError("Please select an authority");
    if (!taskTitle.trim()) return setTaskSubmitError("Task title is required");

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

      setTaskSubmitSuccess(
        "Task created successfully. The report is now marked as In Progress.",
      );
      setSelectedReportId("");
      setTaskTitle("");
      setTaskDescription("");
      setDueDate("");

      await refreshPendingReportsAndAuthorities();
    } catch (err) {
      setTaskSubmitError(
        err?.response?.data?.message || "Failed to create task",
      );
    } finally {
      setSubmittingTask(false);
    }
  };

  const tabs = [
    "overview",
    "create",
    "reports",
    "tasks",
    "safezones",
    "safezones-map",
    "waterlogs",
    "map",
  ];

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
                activeTab === tab
                  ? "bg-[#00569c] text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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

        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 transition bg-white shadow rounded-xl hover:shadow-lg">
              System running smoothly
            </div>
            <div className="p-6 transition bg-white shadow rounded-xl hover:shadow-lg">
              Active users online
            </div>
            <div className="p-6 transition bg-white shadow rounded-xl hover:shadow-lg">
              Role: {user?.role}
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="max-w-3xl p-8 bg-white shadow-xl rounded-xl">
            <h2 className="text-2xl font-bold text-[#00569c] mb-6">
              Create Admin or Authority Account
            </h2>

            {message && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  message.includes("✓")
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p
                  className={
                    message.includes("✓") ? "text-green-700" : "text-red-700"
                  }
                >
                  {message}
                </p>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleCreateChange}
                  placeholder="First Name"
                  className="input"
                  required
                />
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleCreateChange}
                  placeholder="Last Name"
                  className="input"
                  required
                />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleCreateChange}
                placeholder="Email"
                className="input"
                required
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleCreateChange}
                placeholder="Password"
                className="input"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleCreateChange}
                  placeholder="Phone Number"
                  className="input"
                />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleCreateChange}
                  className="input"
                >
                  <option value="authority">Authority</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleCreateChange}
                  placeholder="City"
                  className="input"
                />
                <input
                  name="district"
                  value={formData.district}
                  onChange={handleCreateChange}
                  placeholder="District"
                  className="input"
                />
              </div>
              <button className="w-full py-3 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition">
                Create Account
              </button>
            </form>
          </div>
        )}

        {activeTab === "reports" && <AdminReportList />}

        {activeTab === "tasks" && <TaskListSection />}

        {activeTab === "safezones" && (
          <div className="p-6 bg-white shadow rounded-xl">
            <h3 className="text-2xl font-bold text-[#00569c] mb-4">
              Safe Water Zones
            </h3>
            <SafeZoneList />
          </div>
        )}

        {activeTab === "safezones-map" && (
          <div className="p-2">
            <SafeZonesMap />
          </div>
        )}

        {activeTab === "waterlogs" && (
          <div className="p-6 bg-white shadow rounded-xl">
            <h3 className="text-2xl font-bold text-[#00569c] mb-4">
              WaterLogs
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Search
                </label>
                <input
                  className="input"
                  value={waterLogSearch}
                  onChange={(e) => setWaterLogSearch(e.target.value)}
                  placeholder="Title, address, creator..."
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Region
                </label>
                <input
                  className="input"
                  value={waterLogRegion}
                  onChange={(e) => setWaterLogRegion(e.target.value)}
                  placeholder="e.g., Colombo"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Safety
                </label>
                <select
                  className="input"
                  value={waterLogSafetyRating}
                  onChange={(e) => setWaterLogSafetyRating(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Safe">Safe</option>
                  <option value="Warning">Warning</option>
                  <option value="Unsafe">Unsafe</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Report Status
                </label>
                <select
                  className="input"
                  value={waterLogReportStatus}
                  onChange={(e) => setWaterLogReportStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Unverified">Unverified</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Spam">Spam</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Creator Role
                </label>
                <select
                  className="input"
                  value={waterLogCreatorRole}
                  onChange={(e) => setWaterLogCreatorRole(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="authority">Authority</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {deleteWaterLogError && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {deleteWaterLogError}
              </div>
            )}

            {authorityWaterLogsLoading ? (
              <div className="p-4 text-gray-600">Loading water logs...</div>
            ) : authorityWaterLogsError ? (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {authorityWaterLogsError}
              </div>
            ) : groupWaterLogsByReport.length === 0 ? (
              <div className="p-4 text-gray-600 text-sm">
                No water logs found for the selected filters.
              </div>
            ) : (
              <div className="space-y-6">
                {groupWaterLogsByReport.map((group) => (
                  <div
                    key={group.reportId}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {group.report?.title || "Untitled report"}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {group.report?.address || "No address"}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="text-xs text-gray-600">
                            Current report status:
                          </div>
                          <StatusBadge status={group.report?.status} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Water logs: {group.logs.length}
                        </div>
                        {group.lastStatusChanging && (
                          <div className="text-xs text-gray-600 mt-1">
                            Latest status change:{" "}
                            {group.lastStatusChanging.safetyRating}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {group.logs.map((log) => {
                        const expectedStatus =
                          log.safetyRating === "Unsafe"
                            ? "Confirmed"
                            : log.safetyRating === "Safe"
                              ? "Resolved"
                              : "Unchanged";

                        const isLastStatusChanging =
                          group.lastStatusChanging &&
                          group.lastStatusChanging._id === log._id;

                        return (
                          <div
                            key={log._id}
                            className={`p-3 rounded-lg border bg-white ${
                              isLastStatusChanging
                                ? "border-blue-300 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getSafetyBadgeClasses(log.safetyRating)}`}
                                  >
                                    {log.safetyRating}
                                  </span>
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    pH {log.phLevel}, turbidity {log.turbidity}{" "}
                                    NTU
                                  </div>
                                  {isLastStatusChanging && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-[#00569c] text-white">
                                      Latest status change
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-gray-600 mt-1">
                                  Creator (recorded by):{" "}
                                  <span className="font-semibold text-[#00569c]">
                                    {log.recordedBy?.firstName || "Unknown"}{" "}
                                    {log.recordedBy?.lastName || ""}
                                  </span>
                                  {log.recordedBy?.email
                                    ? ` • ${log.recordedBy.email}`
                                    : ""}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Region: {log.region || "—"} • Recorded at:{" "}
                                  {log.createdAt
                                    ? new Date(log.createdAt).toLocaleString()
                                    : "—"}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">
                                  Expected sync result
                                </div>
                                <div className="text-xs font-semibold text-gray-900">
                                  {expectedStatus}
                                </div>

                                {user?.role === "admin" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteWaterLog(log._id)
                                    }
                                    disabled={deletingWaterLogId === log._id}
                                    className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {deletingWaterLogId === log._id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="text-sm text-gray-700 mt-2">
                              {getWhatHappened(log)}
                            </div>

                            {Array.isArray(log.contaminants) &&
                              log.contaminants.length > 0 && (
                                <div className="text-xs text-gray-600 mt-2">
                                  Contaminants: {log.contaminants.join(", ")}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "map" && (
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
          box-shadow: 0 0 0 2px rgba(0, 86, 156, 0.2);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
