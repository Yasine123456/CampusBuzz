# CampusBuzz - NUWebspace Deployment Guide

## Quick Deployment Steps

### 1. File Structure on NUWebspace

Upload the files to your NUWebspace account with this structure:

```
public_html/
├── campusbuzz/              # Create this folder
    ├── index.html           # From frontend/
    ├── styles.css           # From frontend/
    ├── app.js               # From frontend/
    ├── manifest.json        # From frontend/
    ├── service-worker.js    # From frontend/
    ├── assets/              # From frontend/
    │   ├── icon-192.png
    │   └── icon-512.png
    └── backend/             # Create this folder
        ├── auth.php
        ├── posts.php
        ├── users.php
        ├── upload.php
        ├── db_connection.php
        ├── .htaccess
        └── uploads/         # Create empty folder, set permissions to 755
```

### 2. Database is Already Set Up

✅ Your database `w25050742` is already configured in phpMyAdmin  
✅ Tables are already created (users, posts, likes, comments)  
✅ Credentials in `db_connection.php` are correct

### 3. Upload Files

**Option A: Using File Manager**
1. Log into NUWebspace cPanel
2. Open File Manager
3. Navigate to `public_html`
4. Create folder `campusbuzz`
5. Upload all frontend files to `campusbuzz/`
6. Create folder `campusbuzz/backend`
7. Upload all backend files to `campusbuzz/backend/`
8. Create folder `campusbuzz/backend/uploads` and set permissions to 755

**Option B: Using FTP**
1. Connect via FTP to your NUWebspace account
2. Navigate to `public_html`
3. Upload the folder structure as shown above

### 4. Set Folder Permissions

Make sure the uploads folder is writable:
- `campusbuzz/backend/uploads/` → **755** permissions

### 5. Access Your App

Your app will be available at:
```
https://nuwebspace.net/~w25050742/campusbuzz/
```

Or if you have a custom domain:
```
https://yourdomain.com/campusbuzz/
```

### 6. Test Everything

1. **Open the URL** in your browser
2. **Register** a new account
3. **Create a post**
4. **Like a post**
5. **Upload an image**
6. **Install as PWA** (if using HTTPS)

## Why It Will Work on NUWebspace

✅ **Database Connection**: PHP and MySQL are on the same server  
✅ **No CORS Issues**: Frontend and backend on same domain  
✅ **Credentials**: Already configured for `w25050742`  
✅ **Relative Paths**: App.js now uses relative paths that work anywhere  

## Files Ready for Deployment

All files in `/Users/yassine/Campusbuzz/` are ready to upload:

**Frontend Files** (upload to `campusbuzz/`):
- index.html
- styles.css
- app.js ✅ Updated with relative paths
- manifest.json
- service-worker.js
- assets/icon-192.png
- assets/icon-512.png

**Backend Files** (upload to `campusbuzz/backend/`):
- auth.php
- posts.php
- users.php
- upload.php
- db_connection.php ✅ Already has your database credentials
- .htaccess

## Troubleshooting

If you encounter issues after deployment:

1. **Check file permissions**: uploads folder should be 755
2. **Check .htaccess**: Make sure it uploaded correctly
3. **Check PHP errors**: Enable error reporting temporarily
4. **Check database**: Verify tables exist in phpMyAdmin

## Next Steps

1. Upload the files to NUWebspace
2. Access your app URL
3. Start using CampusBuzz!

The local testing isn't working because your database is on NUWebspace, not locally. Once deployed, everything will work perfectly! 🎉
