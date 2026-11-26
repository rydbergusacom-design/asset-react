import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QrPanel({ url, assetId, title }) {
  const canvasRef = useRef(null);

  const download = () => {
    const canvas = document.getElementById('react-qr-canvas');
    if (!canvas) {
      alert('QR not ready');
      return;
    }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${assetId || 'asset'}-QR.png`;
    a.click();
  };

  const print = () => {
    const canvas = document.getElementById('react-qr-canvas');
    if (!canvas) return;
    const src = canvas.toDataURL('image/png');
    const w = window.open('', '_blank', 'width=550,height=650');
    w.document.write(
      `<html><head><title>${assetId} QR</title></head><body style="text-align:center;font-family:Arial;padding:20px">
      <h3>Asset ID: ${assetId}</h3>
      <img src="${src}" width="250" height="250"/>
      <p>Scan to view asset information</p>
      </body></html>`
    );
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  if (!url) return null;

  return (
    <div className="qr-box">
      <h3>{title || `QR Code — ${assetId}`}</h3>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
        <QRCodeCanvas id="react-qr-canvas" value={url} size={220} level="H" includeMargin ref={canvasRef} />
      </div>
      <p style={{ fontSize: 13, color: '#667085' }}>Scan with a phone to view asset details.</p>
      <p style={{ fontSize: 12, margin: '8px 0 14px' }}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open public asset page
        </a>
      </p>
      <div className="btn-row" style={{ justifyContent: 'center' }}>
        <button type="button" className="primary-btn" onClick={download}>
          ⬇ Download
        </button>
        <button type="button" className="secondary-btn" onClick={print}>
          🖨 Print
        </button>
      </div>
    </div>
  );
}
