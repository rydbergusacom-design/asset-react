import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Optional React public view. Production usually keeps PHP index.php?asset= for QR links.
 * This page can be used if you serve React as the public host and rewrite QR URLs.
 * It expects a small public API: GET /api/index.php?action=public_asset&id=&category=
 * (not implemented in base API — keep using PHP public page for QR scans).
 */
export default function PublicAssetPage() {
  const [params] = useSearchParams();
  const asset = params.get('asset') || '';
  const category = params.get('category') || '';

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 520, textAlign: 'left' }}>
        <h2>Public asset view</h2>
        <p className="sub" style={{ textAlign: 'left' }}>
          QR codes point to the PHP public page (<code>index.php?asset=…</code>) so scans work without React.
        </p>
        <p>
          Requested: <b>{asset || '—'}</b>
          {category ? <> · category <b>{category}</b></> : null}
        </p>
        <p style={{ marginTop: 12, color: '#667085', fontSize: 13 }}>
          Deploy PHP <code>index.php</code> public handler (from the original app) next to the API for production QR links.
        </p>
      </div>
    </div>
  );
}
