export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])
  );
}

export function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export const CATEGORY_DEFAULTS = [
  'AC / FAN & AIR',
  'OFFICE / ELECTRICAL APPLIANCES',
  'FURNITURE & OFFICE',
  'SAFETY',
  'OFFICE EQUIPMENT',
  'SECURITY & SURVEILLANCE',
  'IT & NETWORK',
  'DECORATION & MISC',
];

export const STATUSES = ['Active', 'In Repair', 'Damaged', 'Inactive', 'Disposed'];

export const IT_STATUSES = ['In Use', 'In Stock', 'In Standby', 'WFH', 'In Repair', 'Disposed'];
export const LAP_STATUSES = ['In Use', 'In Stock', 'In Standby', 'WFH', 'Issue', 'In Repair', 'Disposed'];
export const MON_STATUSES = ['In Use', 'In Stock', 'In Standby', 'WFH', 'Issue', 'In Repair', 'Disposed'];

export function qrPublicUrl(baseUrl, id, category) {
  const base = (baseUrl || window.location.origin + '/').replace(/\/?$/, '/');
  // Public page is still PHP index.php in typical deploy; React can host /public route too
  return `${base}index.php?asset=${encodeURIComponent(id)}&category=${encodeURIComponent(category)}`;
}

export function downloadCsv(filename, rows, keys) {
  if (!rows?.length) {
    alert('No data.');
    return;
  }
  const cols = keys || Object.keys(rows[0]);
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.map(cell).join(',')]
    .concat(rows.map((r) => cols.map((k) => cell(r[k])).join(',')))
    .join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
