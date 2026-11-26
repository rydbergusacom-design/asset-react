# Asset QR Management — React SPA

Vite + React 18 app that uses the PHP API in `../api/`.

## Features

- Login / logout (session + CSRF)
- Add asset & generate QR (registry)
- Search, dashboard, asset management
- Item / office / location masters
- IT Desktops, Laptops, Monitors (CRUD, stats, CSV, QR)
- User management

## Setup

1. **PHP API**  
   - Copy `../api/` to your host (or point Apache/Nginx at it).  
   - Edit `api/config.php` (DB credentials, `CORS_ORIGINS`, `PUBLIC_BASE_URL`).  
   - Import SQL dumps as in the main project README.  
   - Keep original `index.php` public QR viewer for scan links.

2. **React**

```bash
cd react-app
npm install
```

3. **Dev**

- Run PHP on port 8080 (example: `php -S localhost:8080 -t /path/to/project`).
- Vite proxies `/api` → `http://localhost:8080` (see `vite.config.js`).

```bash
npm run dev
```

Open http://localhost:5173

4. **Production build**

```bash
npm run build
```

Serve `dist/` under the same domain as the API (or set `VITE_API_BASE` to the absolute API URL and ensure CORS + cookies work).

Optional env:

```env
VITE_API_BASE=https://yourdomain.com/api/index.php
```

## Auth flow

1. `POST ?action=session` → CSRF token + optional `user_id`
2. All other calls send `X-CSRF-Token` and cookies
3. On 401, app reloads session / shows login

## Project layout

```
src/
  api/client.js       # fetch wrapper
  context/AuthContext.jsx
  components/QrPanel.jsx
  pages/              # one page per menu section
  utils/helpers.js
```
