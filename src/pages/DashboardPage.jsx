import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uniqueSorted, qrPublicUrl, downloadCsv } from '../utils/helpers';
import QrPanel from '../components/QrPanel';

function normalize(x) {
  const r = x.row;
  const pick = (...names) => {
    for (const n of names) {
      if (r[n] != null && String(r[n]).trim() !== '') return String(r[n]).trim();
    }
    return '';
  };
  const q = Number(pick('Quantity') || 1);
  return {
    id: pick('ID') || '-',
    item: pick('Item Name', 'Item Type') || x.label,
    category: pick('Category') || x.label,
    office: pick('Office') || 'Not specified',
    location: pick('Location') || 'Not specified',
    room: pick('Room Location') || 'Not specified',
    quantity: Number.isFinite(q) && q > 0 ? q : 1,
    status: pick('Status') || 'Active',
    brand: pick('Brand') || '',
    source: x.table,
    label: x.label,
  };
}

function summary(rows, key) {
  const m = new Map();
  rows.forEach((a) => {
    const k = a[key] || 'Not specified';
    if (!m.has(k)) m.set(k, { records: 0, quantity: 0 });
    const o = m.get(k);
    o.records++;
    o.quantity += a.quantity;
  });
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export default function DashboardPage() {
  const { baseUrl } = useAuth();
  const [assets, setAssets] = useState([]);
  const [filters, setFilters] = useState({ office: '', category: '', item: '', location: '', room: '' });
  const [error, setError] = useState('');
  const [qr, setQr] = useState(null);

  const load = async () => {
    setError('');
    try {
      const res = await api('list_assets');
      setAssets((res.assets || []).map(normalize));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const { office, category, item, location, room } = filters;
    return assets.filter(
      (a) =>
        (!office || a.office === office) &&
        (!category || a.category === category) &&
        (!item || a.item === item) &&
        (!location || a.location === location) &&
        (!room || a.room === room)
    );
  }, [assets, filters]);

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="card">
      <h2>Asset Dashboard</h2>
      <p className="small-note">Live report from the central asset registry. IT stock is not included.</p>
      {error && <div className="message error">{error}</div>}
      <div className="dashboard-grid">
        <div className="dashboard-card"><div className="small">Asset Records</div><div className="big">{filtered.length}</div></div>
        <div className="dashboard-card"><div className="small">Total Quantity</div><div className="big">{filtered.reduce((s, a) => s + a.quantity, 0)}</div></div>
        <div className="dashboard-card"><div className="small">Offices</div><div className="big">{new Set(filtered.map((a) => a.office)).size}</div></div>
        <div className="dashboard-card"><div className="small">Locations</div><div className="big">{new Set(filtered.map((a) => a.location)).size}</div></div>
      </div>
      <div className="dashboard-filters">
        {[
          ['office', 'All Offices', uniqueSorted(assets.map((a) => a.office))],
          ['category', 'All Categories', uniqueSorted(assets.map((a) => a.category))],
          ['item', 'All Items', uniqueSorted(assets.map((a) => a.item))],
          ['location', 'All Locations', uniqueSorted(assets.map((a) => a.location))],
          ['room', 'All Rooms', uniqueSorted(assets.map((a) => a.room))],
        ].map(([key, label, values]) => (
          <select key={key} value={filters[key]} onChange={(e) => setF(key, e.target.value)}>
            <option value="">{label}</option>
            {values.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ))}
      </div>
      <div className="dashboard-actions">
        <button type="button" onClick={load}>↻ Refresh</button>
        <button type="button" onClick={() => setFilters({ office: '', category: '', item: '', location: '', room: '' })}>Clear Filters</button>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              `assets-${new Date().toISOString().slice(0, 10)}.csv`,
              filtered.map((a) => ({
                'Asset ID': a.id,
                Item: a.item,
                Category: a.category,
                Office: a.office,
                Location: a.location,
                Room: a.room,
                Quantity: a.quantity,
                Brand: a.brand,
                Status: a.status,
                Source: a.label,
              }))
            )
          }
        >
          ⬇ Export CSV
        </button>
      </div>
      {['category', 'office', 'item', 'location', 'room'].map((key) => (
        <div className="dashboard-table-wrap" key={key}>
          <h3 style={{ marginBottom: 8, textTransform: 'capitalize' }}>{key}-wise Summary</h3>
          <table className="dashboard-table">
            <thead>
              <tr><th>{key}</th><th>Records</th><th>Quantity</th></tr>
            </thead>
            <tbody>
              {summary(filtered, key).map(([n, x]) => (
                <tr key={n}><td>{n}</td><td>{x.records}</td><td>{x.quantity}</td></tr>
              ))}
              {!summary(filtered, key).length && (
                <tr><td colSpan={3}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
      <div className="dashboard-table-wrap">
        <h3 style={{ marginBottom: 8 }}>Asset List</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Asset ID</th><th>Item</th><th>Category</th><th>Office</th><th>Location</th>
              <th>Room</th><th>Qty</th><th>Brand</th><th>Status</th><th>QR</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id + a.source}>
                <td>{a.id}</td><td>{a.item}</td><td>{a.category}</td><td>{a.office}</td>
                <td>{a.location}</td><td>{a.room}</td><td>{a.quantity}</td>
                <td>{a.brand || '—'}</td><td>{a.status}</td>
                <td>
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() =>
                      setQr({
                        id: a.id,
                        url: qrPublicUrl(baseUrl, a.id, a.source === 'Asset_Registry' ? 'ASSET_REGISTRY' : a.source),
                      })
                    }
                  >
                    🔲
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={10}>No assets found.</td></tr>}
          </tbody>
        </table>
      </div>
      {qr && <QrPanel url={qr.url} assetId={qr.id} />}
    </div>
  );
}
