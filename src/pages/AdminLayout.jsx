import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/generate', label: '🔲 Add Asset & QR' },
  { to: '/search', label: '🔍 Search Asset' },
  { to: '/dashboard', label: '📊 Asset Dashboard' },
  { to: '/assets', label: '🛠️ Asset Management' },
  { to: '/masters', label: '⚙️ Item & Office Master' },
  { to: '/it-desktops', label: '💻 IT Desktops' },
  { to: '/it-laptops', label: '💻 IT Laptops' },
  { to: '/it-monitors', label: '🖥 IT Monitors' },
  { to: '/users', label: '👤 User Management' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="admin-header">
        <h1>Asset QR Management</h1>
        <p>QR Code Based Asset Management System (React)</p>
      </header>
      <div className="user-bar">
        <span>
          Logged in: <b>{user}</b>
        </span>
        <button type="button" onClick={() => logout()}>
          Logout
        </button>
      </div>
      <div className="admin-container">
        <nav className="menu">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={{ textDecoration: 'none' }}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {({ isActive }) => (
                <button type="button" className={isActive ? 'active' : undefined} style={{ width: '100%' }}>
                  {l.label}
                </button>
              )}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
