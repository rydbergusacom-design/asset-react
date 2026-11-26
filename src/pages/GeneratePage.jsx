import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_DEFAULTS, STATUSES, uniqueSorted, qrPublicUrl } from '../utils/helpers';
import QrPanel from '../components/QrPanel';

export default function GeneratePage() {
  const { baseUrl } = useAuth();
  const [masters, setMasters] = useState({ offices: [], items: [], locations: [] });
  const [form, setForm] = useState({
    category: '',
    item: '',
    office: '',
    location: '',
    room: '',
    quantity: 1,
    status: 'Active',
    brand: '',
    serial: '',
    purchase_date: '',
    warranty: '',
    vendor: '',
    remarks: '',
  });
  const [previewId, setPreviewId] = useState('');
  const [qr, setQr] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadMasters = async () => {
    const data = await api('masters');
    setMasters({ offices: data.offices || [], items: data.items || [], locations: data.locations || [] });
  };

  useEffect(() => {
    loadMasters().catch((e) => {
      setMsg(e.message);
      setErr(true);
    });
  }, []);

  const categories = uniqueSorted(CATEGORY_DEFAULTS.concat(masters.items.map((i) => i.Category || '')));
  const items = masters.items.filter((i) => +i.Active === 1 && (!form.category || i.Category === form.category));
  const offices = masters.offices.filter((o) => +o.Active === 1);
  const locations = masters.locations.filter(
    (l) => +l.Active === 1 && l['Office Name'] === form.office
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form.item) {
      setPreviewId('');
      return;
    }
    const rec = masters.items.find((i) => i['Item Name'] === form.item);
    if (rec?.Category) set('category', rec.Category);
    api('preview_id', { item: form.item })
      .then((r) => setPreviewId(r.id || ''))
      .catch(() => setPreviewId(''));
  }, [form.item, masters.items]);

  const save = async () => {
    if (!form.item || !form.category || !form.office) {
      setMsg('Category, Item Name and Office are required.');
      setErr(true);
      return;
    }
    setBusy(true);
    setMsg('Creating asset…');
    setErr(false);
    try {
      const res = await api('save_asset', form);
      setQr({ id: res.id, url: qrPublicUrl(baseUrl, res.id, 'ASSET_REGISTRY') });
      setMsg(`Asset ${res.id} saved and QR generated.`);
      setErr(false);
      setForm((f) => ({ ...f, serial: '', remarks: '' }));
      await loadMasters();
    } catch (e) {
      setMsg(e.message);
      setErr(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Add Asset &amp; Generate QR Code</h2>
      <p className="small-note">Asset ID is reserved only when you save. Preview never increases the number.</p>
      <div className="form-grid">
        <div>
          <label>Category</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Item Name</label>
          <select value={form.item} onChange={(e) => set('item', e.target.value)}>
            <option value="">Select Item</option>
            {items.map((i) => (
              <option key={i['Item Name']} value={i['Item Name']}>{i['Item Name']}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Office</label>
          <select
            value={form.office}
            onChange={(e) => {
              set('office', e.target.value);
              set('location', '');
            }}
          >
            <option value="">Select Office</option>
            {offices.map((o) => (
              <option key={o['Office Name']} value={o['Office Name']}>{o['Office Name']}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Location (Room / Area)</label>
          <select value={form.location} onChange={(e) => set('location', e.target.value)}>
            <option value="">{form.office ? 'Select Location' : 'Select Office first'}</option>
            {locations.map((l) => (
              <option key={l['Location Name']} value={l['Location Name']}>{l['Location Name']}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Room / Spot (optional)</label>
          <input value={form.room} onChange={(e) => set('room', e.target.value)} placeholder="Leave empty to use Location" />
        </div>
        <div>
          <label>Quantity</label>
          <input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        </div>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Brand</label>
          <input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </div>
        <div>
          <label>Serial Number</label>
          <input value={form.serial} onChange={(e) => set('serial', e.target.value)} />
        </div>
        <div>
          <label>Purchase Date</label>
          <input type="date" value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} />
        </div>
        <div>
          <label>Warranty</label>
          <input value={form.warranty} onChange={(e) => set('warranty', e.target.value)} />
        </div>
        <div>
          <label>Vendor</label>
          <input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} />
        </div>
        <div className="full">
          <label>Remarks</label>
          <input value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </div>
        <div className="full">
          <label>Asset ID (preview)</label>
          <input value={previewId} readOnly placeholder="Automatic ID" />
        </div>
      </div>
      <button className="primary-btn" type="button" disabled={busy} onClick={save} style={{ width: '100%' }}>
        Save Asset &amp; Generate QR Code
      </button>
      {msg && <div className={`message ${err ? 'error' : 'success'}`}>{msg}</div>}
      {qr && <QrPanel url={qr.url} assetId={qr.id} title={`QR Code — ${qr.id}`} />}
    </div>
  );
}
