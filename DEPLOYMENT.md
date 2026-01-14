# CampusBuzz Deployment Guide for nuwebspace

## What to Upload

You need to upload **TWO** sets of files:

### 1. Frontend (React Build) - Upload to root `/nu/`

Upload the **contents** of the `dist/` folder:
```
dist/
├── index.html        → Upload to /nu/index.html
└── assets/
    ├── index-*.js    → Upload to /nu/assets/
    ├── icon-*.png    → Upload to /nu/assets/
    └── manifest-*.json → Upload to /nu/assets/
```

**Plus** these static files from your project root:
```
/assets/                → Upload entire folder to /nu/assets/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-amber-removebg-preview.png
    └── icon-teal-removebg-preview.png

manifest.json           → Upload to /nu/manifest.json
service-worker.js       → Upload to /nu/service-worker.js
```

### 2. Backend (PHP) - Upload to `/nu/`

```
/backend/               → Upload entire folder to /nu/backend/
    ├── auth.php
    ├── config.php        (create from config.example.php with your DB credentials)
    ├── db_connection.php
    ├── messages.php
    ├── notifications.php
    ├── posts.php
    ├── search.php
    ├── upload.php
    ├── users.php
    └── ... other PHP files

/auth/                  → Upload entire folder to /nu/auth/
    ├── microsoft-login.php
    ├── microsoft-config.php  (create from example with your credentials)
    ├── google-login.php
    └── ... other auth files

/uploads/               → Create empty folder at /nu/uploads/
```

---

## Final Directory Structure on nuwebspace

```
/nu/
├── index.html              ← React app entry (from dist/)
├── manifest.json           ← PWA manifest
├── service-worker.js       ← PWA service worker
├── assets/
│   ├── index-BBp0iI3w.js   ← React bundle (from dist/assets/)
│   ├── manifest-*.json     ← (from dist/assets/)
│   ├── icon-192.png        ← (from /assets/)
│   ├── icon-512.png        ← (from /assets/)
│   ├── icon-amber-*.png    ← (from /assets/)
│   └── icon-teal-*.png     ← (from /assets/)
├── backend/                ← PHP API files
│   ├── auth.php
│   ├── config.php
│   ├── db_connection.php
│   └── ...
├── auth/                   ← OAuth files
│   ├── microsoft-login.php
│   ├── microsoft-config.php
│   └── ...
└── uploads/                ← User uploads directory (empty, writable)
```

---

## Quick Upload Steps

1. **Build the project** (already done):
   ```bash
   npm run build
   ```

2. **Upload via CyberDuck/FTP**:
   - First, upload `dist/index.html` as `/nu/index.html` (overwrite existing)
   - Upload `dist/assets/*` to `/nu/assets/`
   - Upload `/assets/*` to `/nu/assets/` (merge with above)
   - Upload `/manifest.json` and `/service-worker.js` to `/nu/`
   - Upload `/backend/` folder to `/nu/backend/`
   - Upload `/auth/` folder to `/nu/auth/`
   - Make sure `/nu/uploads/` exists and is writable

3. **Set permissions**:
   - `/nu/uploads/` needs to be writable (chmod 755 or 777)

4. **Test**:
   - Visit your nuwebspace URL
   - Login should work
   - Posts should load
   - Images should display

---

## Files NOT to Upload (already in .gitignore)

- `node_modules/` - Never upload
- `src/` - Development source, not needed in production
- `package.json`, `package-lock.json` - Not needed
- `vite.config.js`, `eslint.config.js` - Development only
- `.git/` - Version control
- `*.pdf` - Assignment documents
- `config.php` files - Should already be on server with correct credentials
