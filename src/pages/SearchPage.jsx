import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { qrPublicUrl } from '../utils/helpers';
import QrPanel from '../components/QrPanel';

export default function SearchPage() {
  const { baseUrl } = useAuth();
  const [id, setId] = useState('');
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [qr, setQr] = useState(null);

  const search = async () => {
    setResult(null);
    setQr(null);
    if (!id.trim()) {
      setMsg('Please enter an Asset ID.');
      setErr(true);
      return;
    }
    setMsg('Searching…');
    setErr(false);
    try {
      const res = await api('search', { id: id.trim() });
      setResult(res);
      setMsg('Asset found.');
      setErr(false);
    } catch (e) {
      setMsg(e.message);
      setErr(true);
    }
  };

  const genQr = () => {
    if (!result?.asset?.ID) return;
    const cat = result.table === 'Asset_Registry' ? 'ASSET_REGISTRY' : result.table;
    setQr({ id: result.asset.ID, url: qrPublicUrl(baseUrl, result.asset.ID, cat) });
  };

  return (
    <div className="card">
      <h2>Search Asset</h2>
      <label>Asset ID</label>
      <input
        value={id}
        onChange={(e) => setId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && search()}
        placeholder="Example: AC-1 or RYD-CPU-001"
      />
      <button className="primary-btn" type="button" onClick={search} style={{ width: '100%' }}>
        Search Asset
      </button>
      {msg && <div className={`message ${err ? 'error' : 'success'}`}>{msg}</div>}
      {result?.asset && (
        <div style={{ marginTop: 16 }}>
          <div className="edit-panel">
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#0b2d5c' }}>
              Category: {result.category}
            </div>
            {Object.entries(result.asset).map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '38% 62%', borderBottom: '1px solid #e8edf2' }}>
                <div style={{ padding: 10, background: '#f6f8fa', fontWeight: 600 }}>{k}</div>
                <div style={{ padding: 10 }}>{v == null || v === '' ? '—' : String(v)}</div>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button type="button" className="primary-btn" onClick={genQr}>
              🔲 Generate QR
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setId('');
                setResult(null);
                setQr(null);
                setMsg('');
              }}
            >
              Search Another
            </button>
          </div>
          {qr && <QrPanel url={qr.url} assetId={qr.id} />}
        </div>
      )}
    </div>
  );
}
