# CampusBuzz - Campus Microblogging Platform

A Progressive Web Application (PWA) designed for university environments, providing a centralized, real-time timeline for campus updates and microblogging.

## Features

- 🎓 **Campus-Focused**: Designed specifically for university communities
- 📱 **Mobile-First**: Optimized for students on-the-go
- ⚡ **Real-Time Updates**: Live timeline with automatic polling
- 🎨 **Modern Design**: Vibrant glassmorphism UI with smooth animations
- 📴 **Offline Support**: PWA with service worker caching
- 🔐 **Secure Authentication**: Session-based auth with NUWebspace integration support
- 📸 **Image Sharing**: Upload and share images with posts
- ❤️ **Social Features**: Like and comment on posts

## Tech Stack

### Backend
- **PHP 7.4+** - Server-side logic
- **MariaDB** - Database
- **PDO** - Database abstraction layer
- **Session-based authentication**

### Frontend
- **Vanilla JavaScript** - No framework overhead
- **CSS3** - Modern styling with CSS variables
- **PWA** - Service Worker + Web App Manifest
- **Google Fonts** - Inter & Outfit typography

## Project Structure

```
Campusbuzz/
├── backend/
│   ├── auth.php           # Authentication endpoints
│   ├── posts.php          # Post management endpoints
│   ├── users.php          # User profile endpoints
│   ├── upload.php         # Image upload handler
│   ├── db_connection.php  # Database connection
│   ├── schema.sql         # Database schema
│   └── uploads/           # Uploaded images directory
├── frontend/
│   ├── index.html         # Main application
│   ├── styles.css         # Design system
│   ├── app.js             # Application logic
│   ├── manifest.json      # PWA manifest
│   ├── service-worker.js  # Service worker
│   └── assets/            # App icons
└── README.md
```

## Setup Instructions

### Prerequisites
- PHP 7.4 or higher
- MariaDB 10.3 or higher
- Web server (Apache/Nginx) or PHP built-in server
- Modern web browser

### Database Setup

1. Create a MariaDB database:
```sql
CREATE DATABASE campusbuzz;
```

2. Import the schema:
```bash
mysql -u root -p campusbuzz < backend/schema.sql
```

3. Update database credentials in `backend/db_connection.php`:
```php
$host = 'localhost';
$db   = 'campusbuzz';
$user = 'your_username';
$pass = 'your_password';
```

### Backend Setup

1. Start the PHP development server:
```bash
cd backend
php -S localhost:8000
```

Or configure your web server to serve the `backend` directory.

2. Ensure the `uploads` directory is writable:
```bash
chmod 755 uploads
```

### Frontend Setup

1. Serve the frontend directory:
```bash
cd frontend
python3 -m http.server 3000
```

Or use any static file server.

2. Update the API URL in `frontend/app.js` if needed:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

### NUWebspace Authentication Integration

The application includes placeholders for NUWebspace authentication. To integrate:

1. Open `backend/db_connection.php` and add your NUWebspace credentials:
```php
define('NUWEBSPACE_API_URL', 'https://your-nuwebspace-domain.com/api');
define('NUWEBSPACE_CLIENT_ID', 'your-client-id');
define('NUWEBSPACE_CLIENT_SECRET', 'your-client-secret');
define('NUWEBSPACE_REDIRECT_URI', 'http://localhost:3000/auth/callback');
```

2. Implement the OAuth flow in `backend/auth.php` following the TODO comments.

3. Enable the NUWebspace button in `frontend/index.html` by removing the `disabled` attribute.

## Usage

### First Time Setup

1. Open the application in your browser
2. Click "Register" to create an account
3. Fill in your username, email, and password
4. Start posting!

### Creating Posts

1. Type your message in the composer (max 500 characters)
2. Optionally add an image by clicking the image icon
3. Click "Post" to share with the campus

### Interacting with Posts

- **Like**: Click the heart icon
- **Comment**: Click the comment icon (coming soon)
- **Delete**: Click the trash icon on your own posts

### Installing as PWA

1. Open the app in Chrome/Edge
2. Look for the "Install" icon in the address bar
3. Click to install as a standalone app
4. Launch from your home screen or app drawer

## API Endpoints

### Authentication
- `POST /auth.php?action=register` - Register new user
- `POST /auth.php?action=login` - Login user
- `POST /auth.php?action=logout` - Logout user
- `GET /auth.php?action=verify` - Verify session

### Posts
- `GET /posts.php?action=list` - Get timeline posts
- `POST /posts.php?action=create` - Create new post
- `DELETE /posts.php?action=delete&id={id}` - Delete post
- `POST /posts.php?action=like` - Toggle like on post
- `GET /posts.php?action=comments&post_id={id}` - Get comments
- `POST /posts.php?action=comment` - Add comment

### Users
- `GET /users.php?id={id}` - Get user profile
- `PUT /users.php?id={id}` - Update user profile

### Upload
- `POST /upload.php` - Upload image

## Development

### Adding New Features

1. **Backend**: Add new endpoints in appropriate PHP files
2. **Frontend**: Update `app.js` with new functionality
3. **Styling**: Add styles to `styles.css` using CSS variables

### Database Migrations

To modify the database schema:

1. Update `backend/schema.sql`
2. Run the SQL commands manually or recreate the database

## Troubleshooting

### CORS Issues
- Ensure `db_connection.php` has correct CORS headers
- Check that credentials are included in fetch requests

### Database Connection Failed
- Verify MariaDB is running
- Check database credentials in `db_connection.php`
- Ensure database exists and schema is imported

### Images Not Uploading
- Check `backend/uploads/` directory exists and is writable
- Verify file size is under 5MB
- Ensure file type is JPEG, PNG, GIF, or WebP

### PWA Not Installing
- Serve over HTTPS (or localhost for development)
- Check service worker registration in browser DevTools
- Verify `manifest.json` is accessible

## Security Notes

⚠️ **This is a development version. Before deploying to production:**

1. Use HTTPS everywhere
2. Implement proper password hashing (already using `password_hash()`)
3. Add CSRF protection
4. Sanitize all user inputs
5. Implement rate limiting
6. Use prepared statements (already implemented)
7. Set up proper CORS policies
8. Add input validation on both client and server
9. Implement proper session management
10. Regular security audits

## License

This project is created for educational purposes.

## Support

For issues or questions, please refer to the design document or contact the development team.

---

Built with ❤️ for campus communities
