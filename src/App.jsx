import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/AdminLayout';
import GeneratePage from './pages/GeneratePage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import AssetManagerPage from './pages/AssetManagerPage';
import ItemMasterPage from './pages/ItemMasterPage';
import ItDesktopPage from './pages/ItDesktopPage';
import ItLaptopPage from './pages/ItLaptopPage';
import ItMonitorPage from './pages/ItMonitorPage';
import UserManagerPage from './pages/UserManagerPage';
import PublicAssetPage from './pages/PublicAssetPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/public" element={<PublicAssetPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/generate" replace />} />
        <Route path="generate" element={<GeneratePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assets" element={<AssetManagerPage />} />
        <Route path="masters" element={<ItemMasterPage />} />
        <Route path="it-desktops" element={<ItDesktopPage />} />
        <Route path="it-laptops" element={<ItLaptopPage />} />
        <Route path="it-monitors" element={<ItMonitorPage />} />
        <Route path="users" element={<UserManagerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
