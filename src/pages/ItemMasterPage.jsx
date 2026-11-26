import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { CATEGORY_DEFAULTS, uniqueSorted } from '../utils/helpers';

export default function ItemMasterPage() {
  const [masters, setMasters] = useState({ offices: [], items: [], locations: [] });
  const [itemForm, setItemForm] = useState({ name: '', prefix: '', next: 1, category: '' });
  const [officeName, setOfficeName] = useState('');
  const [locForm, setLocForm] = useState({ office: '', name: '' });
  const [msg, setMsg] = useState({});
  const [view, setView] = useState(null);

  const load = async () => {
    const data = await api('masters');
    setMasters({ offices: data.offices || [], items: data.items || [], locations: data.locations || [] });
  };

  useEffect(() => {
    load().catch((e) => setMsg({ item: e.message }));
  }, []);

  const flash = (key, text, isErr = false) => setMsg((m) => ({ ...m, [key]: { text, err: isErr } }));

  const addItem = async () => {
    try {
      await api('item_add', itemForm);
      flash('item', 'Item added');
      setItemForm({ name: '', prefix: '', next: 1, category: '' });
      await load();
    } catch (e) {
      flash('item', e.message, true);
    }
  };

  const toggleItem = async (name, active) => {
    await api('item_active', { name, active: active ? 0 : 1 });
    await load();
  };

  const deleteItem = async (name) => {
    if (!confirm(`Delete item "${name}"?`)) return;
    try {
      await api('item_delete', { name });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const addOffice = async () => {
    try {
      await api('office_add', { name: officeName });
      flash('office', 'Office added');
      setOfficeName('');
      await load();
    } catch (e) {
      flash('office', e.message, true);
    }
  };

  const toggleOffice = async (name, active) => {
    await api('office_active', { name, active: active ? 0 : 1 });
    await load();
  };

  const deleteOffice = async (name) => {
    if (!confirm(`Delete office "${name}"?`)) return;
    try {
      await api('office_delete', { name });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const addLocation = async () => {
    try {
      await api('location_add', locForm);
      flash('location', 'Location added');
      setLocForm((f) => ({ ...f, name: '' }));
      await load();
    } catch (e) {
      flash('location', e.message, true);
    }
  };

  const toggleLocation = async (office, name, active) => {
    await api('location_active', { office, name, active: active ? 0 : 1 });
    await load();
  };

  const deleteLocation = async (office, name) => {
    if (!confirm(`Delete location "${name}"?`)) return;
    try {
      await api('location_delete', { office, name });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const openView = async (type, name, office = '') => {
    try {
      const res = await api('master_view', { type, name, office });
      setView(res);
    } catch (e) {
      alert(e.message);
    }
  };

  const cats = uniqueSorted(CATEGORY_DEFAULTS.concat(masters.items.map((i) => i.Category || '')));

  return (
    <div className="card">
      <h2>Item Master</h2>
      <p className="small-note">Add or deactivate items. Existing Asset IDs and QR links are never rewritten.</p>

      {view && (
        <div className="edit-panel">
          <div className="section-head">
            <h3>{view.title}</h3>
            <button type="button" className="secondary-btn" onClick={() => setView(null)}>✖ Close</button>
          </div>
          <ul style={{ marginBottom: 12, paddingLeft: 18 }}>
            {(view.info || []).map(([k, v]) => (
              <li key={k}><b>{k}:</b> {v}</li>
            ))}
          </ul>
          {view.truncated && <p className="small-note">Showing first 500 assets.</p>}
          <div className="table-wrap">
            <table className="data-table" style={{ minWidth: 600 }}>
              <thead>
                <tr><th>ID</th><th>Item</th><th>Category</th><th>Office</th><th>Location</th><th>Qty</th><th>Brand</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(view.assets || []).map((a) => (
                  <tr key={a.ID}>
                    <td>{a.ID}</td><td>{a['Item Name']}</td><td>{a.Category}</td>
                    <td>{a.Office}</td><td>{a.Location}</td><td>{a.Quantity}</td>
                    <td>{a.Brand || '—'}</td><td>{a.Status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="form-grid">
        <div><label>Item Name</label><input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div><label>Prefix</label><input value={itemForm.prefix} onChange={(e) => setItemForm((f) => ({ ...f, prefix: e.target.value.toUpperCase() }))} /></div>
        <div><label>Next Number</label><input type="number" min={1} value={itemForm.next} onChange={(e) => setItemForm((f) => ({ ...f, next: e.target.value }))} /></div>
        <div>
          <label>Category</label>
          <input list="catList" value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))} />
          <datalist id="catList">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
      </div>
      <button type="button" className="primary-btn" onClick={addItem}>➕ Add Item</button>
      {msg.item && <div className={`message ${msg.item.err ? 'error' : 'success'}`}>{msg.item.text}</div>}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr><th>Item</th><th>Prefix</th><th>Category</th><th>Next #</th><th>Next ID</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {masters.items.map((i) => (
              <tr key={i['Item Name']}>
                <td>{i['Item Name']}</td>
                <td>{i.Prefix}</td>
                <td>{i.Category}</td>
                <td>{i['Next Number']}</td>
                <td>{i.Prefix}-{i['Next Number']}</td>
                <td className={+i.Active === 1 ? 'status-on' : 'status-off'}>{+i.Active === 1 ? 'Active' : 'Inactive'}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => openView('item', i['Item Name'])}>View</button>
                  <button type="button" className="secondary-btn" onClick={() => toggleItem(i['Item Name'], +i.Active === 1)}>
                    {+i.Active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" className="danger-btn" onClick={() => deleteItem(i['Item Name'])}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="sub-title">Location Master</h2>
      <div className="form-grid">
        <div>
          <label>Office</label>
          <select value={locForm.office} onChange={(e) => setLocForm((f) => ({ ...f, office: e.target.value }))}>
            <option value="">Select Office</option>
            {masters.offices.map((o) => (
              <option key={o['Office Name']} value={o['Office Name']}>{o['Office Name']}</option>
            ))}
          </select>
        </div>
        <div><label>Location Name</label><input value={locForm.name} onChange={(e) => setLocForm((f) => ({ ...f, name: e.target.value }))} /></div>
      </div>
      <button type="button" className="primary-btn" onClick={addLocation}>➕ Add Location</button>
      {msg.location && <div className={`message ${msg.location.err ? 'error' : 'success'}`}>{msg.location.text}</div>}
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table className="data-table" style={{ minWidth: 520 }}>
          <thead><tr><th>Office</th><th>Location</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {masters.locations.map((l) => (
              <tr key={l['Office Name'] + l['Location Name']}>
                <td>{l['Office Name']}</td>
                <td>{l['Location Name']}</td>
                <td className={+l.Active === 1 ? 'status-on' : 'status-off'}>{+l.Active === 1 ? 'Active' : 'Inactive'}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => openView('location', l['Location Name'], l['Office Name'])}>View</button>
                  <button type="button" className="secondary-btn" onClick={() => toggleLocation(l['Office Name'], l['Location Name'], +l.Active === 1)}>
                    {+l.Active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" className="danger-btn" onClick={() => deleteLocation(l['Office Name'], l['Location Name'])}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="sub-title">Office Master</h2>
      <div className="form-grid">
        <div><label>Office Name</label><input value={officeName} onChange={(e) => setOfficeName(e.target.value)} /></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
          <button type="button" className="primary-btn" onClick={addOffice}>➕ Add Office</button>
        </div>
      </div>
      {msg.office && <div className={`message ${msg.office.err ? 'error' : 'success'}`}>{msg.office.text}</div>}
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table className="data-table" style={{ minWidth: 420 }}>
          <thead><tr><th>Office</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {masters.offices.map((o) => (
              <tr key={o['Office Name']}>
                <td>{o['Office Name']}</td>
                <td className={+o.Active === 1 ? 'status-on' : 'status-off'}>{+o.Active === 1 ? 'Active' : 'Inactive'}</td>
                <td>
                  <button type="button" className="edit-btn" onClick={() => openView('office', o['Office Name'])}>View</button>
                  <button type="button" className="secondary-btn" onClick={() => toggleOffice(o['Office Name'], +o.Active === 1)}>
                    {+o.Active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" className="danger-btn" onClick={() => deleteOffice(o['Office Name'])}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
