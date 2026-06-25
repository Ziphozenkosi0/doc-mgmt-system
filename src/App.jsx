import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./lib/ProtectedRoute";
import RoleRoute from "./lib/RoleRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Approvals from "./pages/Approvals";
import Reports from "./pages/Reports";
import Layout from "./lib/layout";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <RoleRoute allowed={["admin"]}>
                <Layout>
                  <Upload />
                </Layout>
              </RoleRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <RoleRoute allowed={["admin", "reviewer", "manager", "finance_admin"]}>
                <Layout>
                  <Approvals />
                </Layout>
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute allowed={["admin", "finance_admin"]}>
                <Layout>
                  <Reports />
                </Layout>
              </RoleRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
