import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./lib/ProtectedRoute";
import RoleRoute from "./lib/RoleRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Approvals from "./pages/Approvals";
import Reports from "./pages/Reports";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <RoleRoute allowed={["admin"]}>
                <Upload />
              </RoleRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <RoleRoute allowed={["admin", "reviewer", "manager", "finance_admin"]}>
                <Approvals />
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute allowed={["admin", "finance_admin"]}>
                <Reports />
              </RoleRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
