import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password) {
      setMsg('User ID and Password are required.');
      setErr(true);
      return;
    }
    setBusy(true);
    setMsg('Signing in…');
    setErr(false);
    try {
      await login(userId.trim(), password);
    } catch (ex) {
      setPassword('');
      setMsg(ex.message);
      setErr(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit} autoComplete="on">
        <h2>Admin Login</h2>
        <div className="sub">Asset QR Management (React)</div>
        <label htmlFor="loginUserId">User ID</label>
        <input
          id="loginUserId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          autoComplete="username"
          required
        />
        <label htmlFor="loginPassword">Password</label>
        <div className="password-wrap">
          <input
            id="loginPassword"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="toggle-pass"
            title="Show password"
            onMouseDown={() => setShowPass(true)}
            onMouseUp={() => setShowPass(false)}
            onMouseLeave={() => setShowPass(false)}
            onTouchStart={() => setShowPass(true)}
            onTouchEnd={() => setShowPass(false)}
          >
            👁
          </button>
        </div>
        <button className="primary-btn" type="submit" disabled={busy} style={{ width: '100%' }}>
          Login
        </button>
        {msg && <div className={`message ${err ? 'error' : 'success'}`}>{msg}</div>}
        <div className="login-footer">Authorized admin access only</div>
      </form>
    </div>
  );
}
