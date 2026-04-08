import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/user/LoginPage";
import { RegisterPage } from "./pages/user/RegisterPage";
import { HomePage } from "./pages/dashboard/HomePage";
import { AdminDashboard } from "./pages/dashboard/AdminDashboard";
import { AuthorityDashboard } from "./pages/dashboard/AuthorityDashboard";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { ReportCenter } from "./pages/citizen/ReportCenter";
import { ReportsMapPage } from "./pages/citizen/ReportsMapPage";

function RoleBasedRedirect() {
  const { user } = useAuth();
  const role = user?.role;
  if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
  if (role === "authority")
    return <Navigate to="/authority-dashboard" replace />;
  return <Navigate to="/home" replace />;
}

function App() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen text-[#164871] font-semibold tracking-widest text-sm">
        Loading...
      </div>
    );
  }

  // Pages where the navbar should float over the content (no top padding needed)
  const fullBleedRoutes = ["/", "/admin-dashboard", "/authority-dashboard"];
  const isFullBleed = fullBleedRoutes.includes(location.pathname);
  const showNavbar = !["/admin-dashboard", "/authority-dashboard"].includes(
    location.pathname,
  );

  return (
    <>
      {showNavbar && <Navbar />}
      {/* Only add top padding on non-fullbleed pages so content isn't hidden behind fixed navbar */}
      <div className={isFullBleed ? "" : "pt-24"}>
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={isAuthenticated ? <RoleBasedRedirect /> : <LandingPage />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/register"
            element={isAuthenticated ? <RoleBasedRedirect /> : <RegisterPage />}
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Citizen */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/map"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <ReportsMapPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Authority */}
          <Route
            path="/authority-dashboard"
            element={
              <ProtectedRoute allowedRoles={["authority"]}>
                <AuthorityDashboard />
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["citizen", "admin", "authority"]}>
                <ReportCenter />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <RoleBasedRedirect />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
