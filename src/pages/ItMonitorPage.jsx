import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MON_STATUSES, uniqueSorted, downloadCsv, qrPublicUrl } from '../utils/helpers';
import QrPanel from '../components/QrPanel';

const GROUPS = {
  Identity: ['Brand', 'Model', 'Nature', 'Asset State'],
  Specs: ['Size', 'Type', 'Service Tag', 'Serial Number', 'Refresh Rate'],
  Assignment: ['Company', 'Division', 'Location', 'Building'],
  Other: ['Remarks'],
};

const KEY_MAP = {
  Brand: 'brand', Model: 'model', Nature: 'nature', 'Asset State': 'asset_state',
  Size: 'size', Type: 'type', 'Service Tag': 'service_tag', 'Serial Number': 'serial_number',
  'Refresh Rate': 'refresh_rate', Company: 'company', Division: 'division',
  Location: 'location', Building: 'building', Remarks: 'remarks',
};

export default function ItMonitorPage() {
  const { baseUrl } = useAuth();
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({ total: 0, by_state: {}, by_brand: {}, by_size: {} });
  const [filter, setFilter] = useState('');
  const [stateF, setStateF] = useState('');
  const [brandF, setBrandF] = useState('');
  const [edit, setEdit] = useState(null);
  const [fields, setFields] = useState({});
  const [adding, setAdding] = useState(false);
  const [addId, setAddId] = useState('');
  const [addFields, setAddFields] = useState({});
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [list, st] = await Promise.all([api('mon_list'), api('mon_stats')]);
      if (st.missing_table) {
        setError('Run it_monitor_import.sql first.');
        return;
      }
      setAssets(list.assets || []);
      setStats(st);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    let r = assets;
    if (stateF) r = r.filter((a) => a['Asset State'] === stateF);
    if (brandF) r = r.filter((a) => a.Brand === brandF);
    const q = filter.toLowerCase().trim();
    if (q) {
      r = r.filter((a) =>
        [a.ID, a.Brand, a.Model, a['Serial Number'], a['Service Tag'], a.Size]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return r;
  }, [assets, filter, stateF, brandF]);

  const openEdit = async (id) => {
    const res = await api('mon_get', { id });
    const f = {};
    Object.values(GROUPS).flat().forEach((n) => { f[n] = res.asset[n] ?? ''; });
    setFields(f);
    setEdit(id);
  };

  const saveEdit = async () => {
    await api('mon_update', { id: edit, fields });
    setEdit(null);
    await load();
  };

  const del = async (id) => {
    if (!confirm(`Delete monitor ${id}?`)) return;
    await api('mon_delete', { id });
    await load();
  };

  const startAdd = () => {
    setAddFields({ Nature: 'Monitor', Company: 'Rydberg', Division: 'Kolkata', 'Asset State': 'In Use' });
    setAddId('');
    setAdding(true);
  };

  const saveAdd = async () => {
    if (!addId.trim()) return alert('Asset Code required');
    const payload = { id: addId.trim() };
    Object.entries(addFields).forEach(([name, val]) => {
      const k = KEY_MAP[name];
      if (k) payload[k] = val;
    });
    const res = await api('mon_save', payload);
    setAdding(false);
    await load();
    setQr({ id: res.id, url: qrPublicUrl(baseUrl, res.id, 'IT_MONITOR') });
  };

  const formFields = (values, setValues) =>
    Object.entries(GROUPS).map(([gname, keys]) => (
      <div key={gname}>
        <h4 style={{ margin: '14px 0 8px', color: '#0b2d5c' }}>{gname}</h4>
        <div className="form-grid">
          {keys.map((name) => (
            <div key={name} className={name === 'Remarks' || name === 'Model' || name === 'Serial Number' ? 'full' : ''}>
              <label>{name}</label>
              {name === 'Asset State' ? (
                <select value={values[name] || ''} onChange={(e) => setValues((f) => ({ ...f, [name]: e.target.value }))}>
                  {MON_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <input value={values[name] || ''} onChange={(e) => setValues((f) => ({ ...f, [name]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
      </div>
    ));

  return (
    <div className="card">
      <h2>🖥 IT Monitor Assets</h2>
      <p className="small-note">Monitor inventory (RG-MON-xxx).</p>
      {error && <div className="message error">{error}</div>}
      <div className="dashboard-grid">
        <div className="dashboard-card"><div className="small">Total</div><div className="big">{stats.total}</div></div>
        <div className="dashboard-card"><div className="small">In Use</div><div className="big">{stats.by_state?.['In Use'] || 0}</div></div>
        <div className="dashboard-card"><div className="small">Stock / Standby</div><div className="big">{(stats.by_state?.['In Stock'] || 0) + (stats.by_state?.['In Standby'] || 0)}</div></div>
        <div className="dashboard-card"><div className="small">Other</div><div className="big">{Math.max(0, (stats.total || 0) - (stats.by_state?.['In Use'] || 0) - (stats.by_state?.['In Stock'] || 0) - (stats.by_state?.['In Standby'] || 0))}</div></div>
      </div>
      <div className="dashboard-actions">
        <button type="button" onClick={load}>↻ Refresh</button>
        <button type="button" onClick={() => downloadCsv(`it-monitors-${new Date().toISOString().slice(0, 10)}.csv`, assets)}>⬇ Export CSV</button>
        <button type="button" className="primary-btn" onClick={startAdd}>➕ Add Monitor</button>
      </div>

      {adding && (
        <div className="edit-panel">
          <div className="section-head"><h3>Add Monitor</h3><button type="button" className="secondary-btn" onClick={() => setAdding(false)}>✖</button></div>
          <div className="form-grid"><div><label>Asset Code *</label><input value={addId} onChange={(e) => setAddId(e.target.value.toUpperCase())} placeholder="e.g. RG-MON-003" /></div></div>
          {formFields(addFields, setAddFields)}
          <div className="btn-row"><button type="button" className="primary-btn" onClick={saveAdd}>Save &amp; Generate QR</button></div>
        </div>
      )}
      {edit && (
        <div className="edit-panel">
          <div className="section-head"><h3>Edit {edit}</h3><button type="button" className="secondary-btn" onClick={() => setEdit(null)}>✖</button></div>
          {formFields(fields, setFields)}
          <div className="btn-row"><button type="button" className="primary-btn" onClick={saveEdit}>Save Changes</button></div>
        </div>
      )}

      <div className="dashboard-filters">
        <input className="search-box" style={{ marginBottom: 0 }} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by ID, brand, serial…" />
        <select value={stateF} onChange={(e) => setStateF(e.target.value)}>
          <option value="">All States</option>
          {uniqueSorted(assets.map((a) => a['Asset State'])).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={brandF} onChange={(e) => setBrandF(e.target.value)}>
          <option value="">All Brands</option>
          {uniqueSorted(assets.map((a) => a.Brand)).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Asset Code</th><th>Brand</th><th>Model</th><th>Size</th><th>Serial</th><th>State</th><th>Type</th><th>Action</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.ID}>
                <td><b>{a.ID}</b></td>
                <td>{a.Brand || '—'}</td>
                <td>{a.Model || '—'}</td>
                <td>{a.Size || '—'}</td>
                <td style={{ fontSize: 12 }}>{(a['Serial Number'] || '—').slice(0, 28)}</td>
                <td><span className="badge">{a['Asset State']}</span></td>
                <td>{a.Type || '—'}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => openEdit(a.ID)}>Edit</button>
                  <button type="button" className="edit-btn" onClick={() => setQr({ id: a.ID, url: qrPublicUrl(baseUrl, a.ID, 'IT_MONITOR') })}>🔲</button>
                  <button type="button" className="danger-btn" onClick={() => del(a.ID)}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8}>No monitors match.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="dashboard-table-wrap">
        <h3>By Brand</h3>
        <table className="dashboard-table">
          <thead><tr><th>Brand</th><th>Count</th></tr></thead>
          <tbody>
            {Object.entries(stats.by_brand || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {qr && <QrPanel url={qr.url} assetId={qr.id} title={`QR — ${qr.id} (Monitor)`} />}
    </div>
  );
}
