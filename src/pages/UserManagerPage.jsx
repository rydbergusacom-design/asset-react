import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function UserManagerPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id: '', password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);

  const load = async () => {
    const res = await api('users_list');
    setUsers(res.users || []);
  };

  useEffect(() => {
    load().catch((e) => {
      setMsg(e.message);
      setErr(true);
    });
  }, []);

  const create = async () => {
    if (form.password !== form.confirm) {
      setMsg('Passwords do not match.');
      setErr(true);
      return;
    }
    try {
      await api('user_create', { user_id: form.user_id, password: form.password });
      setMsg('User created.');
      setErr(false);
      setForm({ user_id: '', password: '', confirm: '' });
      await load();
    } catch (e) {
      setMsg(e.message);
      setErr(true);
    }
  };

  const changePassword = async (userId) => {
    const password = prompt(`New password for ${userId} (min 8 chars):`);
    if (!password) return;
    try {
      await api('user_password', { user_id: userId, password });
      alert('Password updated.');
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleActive = async (userId, currentlyActive) => {
    if (userId === me) {
      alert('You cannot deactivate your own account.');
      return;
    }
    try {
      await api('user_active', { user_id: userId, active: currentlyActive ? 0 : 1 });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="card">
      <h2>👤 User Management</h2>
      <p className="small-note">Create users and set passwords. Passwords are stored as secure hashes.</p>
      <div className="form-grid">
        <div>
          <label>User ID</label>
          <input value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))} autoComplete="off" />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="new-password" />
        </div>
        <div>
          <label>Confirm Password</label>
          <input type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} autoComplete="new-password" />
        </div>
      </div>
      <div className="btn-row">
        <button type="button" className="primary-btn" onClick={create}>➕ Create User</button>
        <button type="button" className="secondary-btn" onClick={load}>↻ Refresh</button>
      </div>
      {msg && <div className={`message ${err ? 'error' : 'success'}`}>{msg}</div>}
      <div className="table-wrap" style={{ marginTop: 20 }}>
        <table className="data-table" style={{ minWidth: 600 }}>
          <thead>
            <tr><th>User ID</th><th>Status</th><th>Created</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u['User ID']}>
                <td><b>{u['User ID']}</b>{u['User ID'] === me ? ' (you)' : ''}</td>
                <td className={+u.Active === 1 ? 'status-on' : 'status-off'}>{+u.Active === 1 ? 'Active' : 'Inactive'}</td>
                <td>{u['Created At'] || '—'}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => changePassword(u['User ID'])}>Set Password</button>
                  <button type="button" className="secondary-btn" onClick={() => toggleActive(u['User ID'], +u.Active === 1)}>
                    {+u.Active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
