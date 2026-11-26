import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LAP_STATUSES, uniqueSorted, downloadCsv, qrPublicUrl } from '../utils/helpers';
import QrPanel from '../components/QrPanel';

const GROUPS = {
  Identity: ['Hostname', 'Nature', 'Asset State'],
  Assignment: ['Employee Code', 'Employee Name', 'Contact No', 'Company', 'Division'],
  Location: ['Location', 'Building'],
  Hardware: [
    'Motherboard', 'Model', 'CPU Serial', 'Processor',
    'RAM1 Capacity', 'RAM1 Model', 'RAM1 Category', 'RAM1 Part No',
    'RAM2 Capacity', 'RAM2 Model', 'RAM2 Category', 'RAM2 Part No',
    'SSD', 'SSD Model', 'SSD Serial', 'HDD', 'HDD Model', 'HDD Serial', 'Graphics Card',
  ],
  Network: ['Domain/Workgroup', 'LAN MAC', 'WIFI MAC'],
  Monitor: ['Monitor1 Make', 'Monitor1 Model', 'Monitor1 Service Tag', 'Monitor1 Serial', 'Monitor1 Size'],
  Software: ['Operating System', 'Product Key'],
  Other: ['Remarks'],
};

const KEY_MAP = {
  Hostname: 'hostname', Nature: 'nature', 'Asset State': 'asset_state',
  'Employee Code': 'employee_code', 'Employee Name': 'employee_name', 'Contact No': 'contact_no',
  Company: 'company', Division: 'division', Location: 'location', Building: 'building',
  Motherboard: 'motherboard', Model: 'model', 'CPU Serial': 'cpu_serial', Processor: 'processor',
  'RAM1 Capacity': 'ram1_capacity', 'RAM1 Model': 'ram1_model', 'RAM1 Category': 'ram1_category', 'RAM1 Part No': 'ram1_part',
  'RAM2 Capacity': 'ram2_capacity', 'RAM2 Model': 'ram2_model', 'RAM2 Category': 'ram2_category', 'RAM2 Part No': 'ram2_part',
  SSD: 'ssd', 'SSD Model': 'ssd_model', 'SSD Serial': 'ssd_serial',
  HDD: 'hdd', 'HDD Model': 'hdd_model', 'HDD Serial': 'hdd_serial', 'Graphics Card': 'graphics_card',
  'Domain/Workgroup': 'domain_workgroup', 'LAN MAC': 'lan_mac', 'WIFI MAC': 'wifi_mac',
  'Monitor1 Make': 'monitor1_make', 'Monitor1 Model': 'monitor1_model',
  'Monitor1 Service Tag': 'monitor1_service_tag', 'Monitor1 Serial': 'monitor1_serial', 'Monitor1 Size': 'monitor1_size',
  'Operating System': 'os', 'Product Key': 'product_key', Remarks: 'remarks',
};

export default function ItLaptopPage() {
  const { baseUrl } = useAuth();
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({ total: 0, by_state: {}, by_building: {}, by_os: {} });
  const [filter, setFilter] = useState('');
  const [stateF, setStateF] = useState('');
  const [buildingF, setBuildingF] = useState('');
  const [edit, setEdit] = useState(null);
  const [fields, setFields] = useState({});
  const [adding, setAdding] = useState(false);
  const [addId, setAddId] = useState('');
  const [addFields, setAddFields] = useState({});
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [list, st] = await Promise.all([api('lap_list'), api('lap_stats')]);
      if (st.missing_table) {
        setError('Run it_laptop_import.sql first.');
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
    if (buildingF) r = r.filter((a) => a.Building === buildingF);
    const q = filter.toLowerCase().trim();
    if (q) {
      r = r.filter((a) =>
        [a.ID, a.Hostname, a['Employee Name'], a.Building, a.Model, a['Operating System']]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return r;
  }, [assets, filter, stateF, buildingF]);

  const openEdit = async (id) => {
    const res = await api('lap_get', { id });
    const f = {};
    Object.values(GROUPS).flat().forEach((n) => { f[n] = res.asset[n] ?? ''; });
    setFields(f);
    setEdit(id);
  };

  const saveEdit = async () => {
    await api('lap_update', { id: edit, fields });
    setEdit(null);
    await load();
  };

  const del = async (id) => {
    if (!confirm(`Delete laptop ${id}?`)) return;
    await api('lap_delete', { id });
    await load();
  };

  const startAdd = () => {
    setAddFields({ Nature: 'Laptop', Company: 'Rydberg', Division: 'Kolkata', 'Asset State': 'In Use' });
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
    const res = await api('lap_save', payload);
    setAdding(false);
    await load();
    setQr({ id: res.id, url: qrPublicUrl(baseUrl, res.id, 'IT_LAPTOP') });
  };

  const formFields = (values, setValues) =>
    Object.entries(GROUPS).map(([gname, keys]) => (
      <div key={gname}>
        <h4 style={{ margin: '14px 0 8px', color: '#0b2d5c' }}>{gname}</h4>
        <div className="form-grid">
          {keys.map((name) => (
            <div key={name} className={name === 'Remarks' || name === 'Processor' || name === 'Model' ? 'full' : ''}>
              <label>{name}</label>
              {name === 'Asset State' ? (
                <select value={values[name] || ''} onChange={(e) => setValues((f) => ({ ...f, [name]: e.target.value }))}>
                  {LAP_STATUSES.map((s) => <option key={s}>{s}</option>)}
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
      <h2>💻 IT Laptop Assets</h2>
      <p className="small-note">Laptop inventory (RYD-LAP-xxx).</p>
      {error && <div className="message error">{error}</div>}
      <div className="dashboard-grid">
        <div className="dashboard-card"><div className="small">Total</div><div className="big">{stats.total}</div></div>
        <div className="dashboard-card"><div className="small">In Use</div><div className="big">{stats.by_state?.['In Use'] || 0}</div></div>
        <div className="dashboard-card"><div className="small">WFH</div><div className="big">{stats.by_state?.WFH || 0}</div></div>
        <div className="dashboard-card"><div className="small">Other</div><div className="big">{Math.max(0, (stats.total || 0) - (stats.by_state?.['In Use'] || 0) - (stats.by_state?.WFH || 0))}</div></div>
      </div>
      <div className="dashboard-actions">
        <button type="button" onClick={load}>↻ Refresh</button>
        <button type="button" onClick={() => downloadCsv(`it-laptops-${new Date().toISOString().slice(0, 10)}.csv`, assets)}>⬇ Export CSV</button>
        <button type="button" className="primary-btn" onClick={startAdd}>➕ Add Laptop</button>
      </div>

      {adding && (
        <div className="edit-panel">
          <div className="section-head"><h3>Add Laptop</h3><button type="button" className="secondary-btn" onClick={() => setAdding(false)}>✖</button></div>
          <div className="form-grid"><div><label>Asset Code *</label><input value={addId} onChange={(e) => setAddId(e.target.value.toUpperCase())} placeholder="e.g. RYD-LAP-010" /></div></div>
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
        <input className="search-box" style={{ marginBottom: 0 }} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" />
        <select value={stateF} onChange={(e) => setStateF(e.target.value)}>
          <option value="">All States</option>
          {uniqueSorted(assets.map((a) => a['Asset State'])).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={buildingF} onChange={(e) => setBuildingF(e.target.value)}>
          <option value="">All Buildings</option>
          {uniqueSorted(assets.map((a) => a.Building)).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Asset Code</th><th>Hostname</th><th>Employee</th><th>Building</th><th>State</th><th>Model</th><th>OS</th><th>Action</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.ID}>
                <td><b>{a.ID}</b></td>
                <td>{a.Hostname || '—'}</td>
                <td>{a['Employee Name'] || '—'}</td>
                <td>{a.Building || '—'}</td>
                <td><span className="badge">{a['Asset State']}</span></td>
                <td>{a.Model || '—'}</td>
                <td>{a['Operating System'] || '—'}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => openEdit(a.ID)}>Edit</button>
                  <button type="button" className="edit-btn" onClick={() => setQr({ id: a.ID, url: qrPublicUrl(baseUrl, a.ID, 'IT_LAPTOP') })}>🔲</button>
                  <button type="button" className="danger-btn" onClick={() => del(a.ID)}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8}>No laptops match.</td></tr>}
          </tbody>
        </table>
      </div>
      {qr && <QrPanel url={qr.url} assetId={qr.id} title={`QR — ${qr.id} (IT Laptop)`} />}
    </div>
  );
}
