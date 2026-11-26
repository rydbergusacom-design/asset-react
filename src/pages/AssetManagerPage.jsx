import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { STATUSES } from '../utils/helpers';

function normalize(x) {
  const r = x.row;
  const pick = (...names) => {
    for (const n of names) if (r[n] != null && String(r[n]).trim() !== '') return String(r[n]).trim();
    return '';
  };
  return {
    table: x.table,
    label: x.label,
    id: pick('ID'),
    item: pick('Item Name'),
    category: pick('Category') || x.label,
    office: pick('Office'),
    location: pick('Location'),
    room: pick('Room Location'),
    quantity: pick('Quantity') || '1',
    status: pick('Status') || 'Active',
    createdBy: pick('Created By') || '—',
    updatedBy: pick('Updated By') || '—',
    raw: r,
  };
}

export default function AssetManagerPage() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [edit, setEdit] = useState(null);
  const [fields, setFields] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);

  const load = async () => {
    const res = await api('list_assets');
    setRows((res.assets || []).map(normalize));
  };

  useEffect(() => {
    load().catch((e) => {
      setMsg(e.message);
      setErr(true);
    });
  }, []);

  const visible = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((a) =>
      [a.id, a.item, a.office, a.location, a.room, a.category, a.status].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }, [rows, filter]);

  const openEdit = async (table, id) => {
    try {
      const res = await api('get_asset', { table, id });
      setEdit({ table, id, columns: res.columns || [] });
      const f = {};
      (res.columns || []).forEach((c) => {
        f[c.name] = res.asset[c.name] ?? '';
      });
      setFields(f);
      setMsg('');
    } catch (e) {
      alert(e.message);
    }
  };

  const save = async () => {
    try {
      await api('update_asset', { table: edit.table, id: edit.id, fields });
      setMsg('Updated ' + edit.id);
      setErr(false);
      setEdit(null);
      await load();
    } catch (e) {
      setMsg(e.message);
      setErr(true);
    }
  };

  const del = async (table, id) => {
    if (!confirm(`Delete asset ${id}?`)) return;
    try {
      await api('delete_asset', { table, id });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="card">
      <h2>Asset Management</h2>
      <p className="small-note">Edit or delete assets in the central registry.</p>
      <input
        className="search-box"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by ID, item, office, location…"
      />
      {edit && (
        <div className="edit-panel">
          <div className="section-head">
            <h3>Edit {edit.id}</h3>
            <button type="button" className="secondary-btn" onClick={() => setEdit(null)}>✖ Close</button>
          </div>
          <div className="form-grid">
            {edit.columns.map((c) => (
              <div key={c.name} className={c.name === 'Remarks' ? 'full' : ''}>
                <label>{c.name}{c.required ? ' *' : ''}</label>
                {c.name === 'Status' ? (
                  <select value={fields[c.name] || ''} onChange={(e) => setFields((f) => ({ ...f, [c.name]: e.target.value }))}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    value={fields[c.name] ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, [c.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button type="button" className="primary-btn" onClick={save}>Save Changes</button>
            <button type="button" className="secondary-btn" onClick={() => setEdit(null)}>Cancel</button>
          </div>
          {msg && <div className={`message ${err ? 'error' : 'success'}`}>{msg}</div>}
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset ID</th><th>Item</th><th>Category</th><th>Office</th><th>Location</th>
              <th>Room</th><th>Qty</th><th>Status</th><th>Source</th><th>By</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.table + a.id}>
                <td><b>{a.id}</b></td>
                <td>{a.item}</td>
                <td>{a.category}</td>
                <td>{a.office}</td>
                <td>{a.location}</td>
                <td>{a.room}</td>
                <td>{a.quantity}</td>
                <td><span className="badge">{a.status}</span></td>
                <td>{a.label}</td>
                <td style={{ fontSize: 11 }}>{a.createdBy} / {a.updatedBy}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => openEdit(a.table, a.id)}>Edit</button>
                  <button type="button" className="danger-btn" onClick={() => del(a.table, a.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!visible.length && <tr><td colSpan={11}>No assets.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
