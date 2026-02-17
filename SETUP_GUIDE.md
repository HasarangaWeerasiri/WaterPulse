# WaterPulse - Complete Authentication System

A full-stack water management application with modern authentication, role-based access control, and intuitive dashboards for citizens, authorities, and administrators.

## 🚀 Features

### Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Bcrypt password hashing** with salt rounds for enhanced security
- **Role-based access control** (RBAC) with three roles:
  - **Citizen**: Regular users reporting water issues
  - **Authority**: Regional water authority officials
  - **Admin**: System administrators

### Frontend Pages
- **Login Page**: Unified login for all roles with demo credentials
- **Register Page**: Citizen registration with location details
- **Admin Dashboard**: User management and admin/authority creation
- **Authority Dashboard**: Issue management and regional alerts
- **Citizen Home**: Issue reporting and alert viewing

### UI/UX
- Modern, responsive design with **Tailwind CSS**
- Clean card-based layouts
- Role-specific dashboards with relevant features
- Real-time feedback and notifications

## 📋 Project Structure

```
WaterPulse/
├── backend/
│   ├── controllers/
│   │   └── authController.js      # Authentication logic
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification
│   ├── models/
│   │   └── user.js                 # User schema
│   ├── routes/
│   │   └── authRoutes.js           # Auth endpoints
│   ├── server.js                   # Express server
│   ├── seed.js                     # Dummy data script
│   ├── .env                        # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx      # Auth state management
    │   ├── components/
    │   │   └── ProtectedRoute.jsx   # Route protection
    │   ├── pages/
    │   │   ├── user/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   ├── dashboard/
    │   │   │   ├── HomePage.jsx
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   └── AuthorityDashboard.jsx
    │   │   └── UnauthorizedPage.jsx
    │   ├── App.jsx                  # Main app with routes
    │   ├── main.jsx                 # Entry point with providers
    │   └── index.css                # Tailwind styles
    └── package.json
```

## 🔒 Security Features

- **Password Hashing**: Bcryptjs with 10 salt rounds
- **JWT Tokens**: 7-day expiration with secure signature
- **Protected Routes**: Client-side route protection via ProtectedRoute component
- **Token Storage**: LocalStorage with Authorization headers
- **Environment Variables**: Sensitive data in .env files

## 📦 Backend Dependencies

```json
{
  "bcryptjs": "^2.4.3",        // Password hashing
  "cors": "^2.8.6",            // Cross-origin requests
  "dotenv": "^17.3.1",         // Environment variables
  "express": "^5.2.1",         // Web framework
  "jsonwebtoken": "^9.0.0",    // JWT token management
  "mongoose": "^9.2.1"         // MongoDB ODM
}
```

## 🎨 Frontend Dependencies

```json
{
  "@tailwindcss/vite": "^4.1.18",     // Tailwind CSS compiler
  "axios": "^1.6.5",                  // HTTP client
  "react": "^19.2.0",                 // UI library
  "react-dom": "^19.2.0",             // DOM rendering
  "react-router-dom": "^6.20.1",      // Routing
  "tailwindcss": "^4.1.18"            // CSS utility framework
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB (remote or local)

### 1. Environment Setup

**Backend (.env)**
```env
MONGO_URI=mongodb+srv://admin:password@cluster.mongodb.net/
PORT=5000
JWT_SECRET=your_super_secret_key_change_in_production
```

**Frontend**
- Uses `http://localhost:5000/api/auth` API base URL
- Update in `src/context/AuthContext.jsx` if needed

### 2. Backend Setup

```bash
cd backend
npm install

# Seed database with dummy data
npm run seed

# Start development server
npm start
```

Server runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

## 📝 Demo Credentials

Test the app with these pre-seeded accounts:

| Role      | Email              | Password     |
|-----------|------------------|--------------|
| Citizen   | citizen@test.com  | password123  |
| Authority | authority@test.com| password123  |
| Admin     | admin@test.com    | password123  |

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST   | /register | Register new citizen | No |
| POST   | /login | User login | No |
| POST   | /create-admin-authority | Create admin/authority | No* |
| GET    | /me | Get current user | Yes |

*Note: `/create-admin-authority` is currently public (for testing). In production, add admin auth middleware.

### Request/Response Examples

**Register**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phoneNumber": "+1-555-0100",
  "city": "New York",
  "district": "Manhattan"
}

Response:
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "citizen"
  }
}
```

**Login**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

**Get Current User**
```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer <token>

Response:
{
  "user": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "citizen",
    "location": { ... }
  }
}
```

## 🎯 Frontend Flow

### Authentication Flow
1. User visits app → redirected to `/login`
2. Login/Register → JWT token created and stored in localStorage
3. Token added to all API requests in `AuthContext`
4. Protected routes check `isAuthenticated` and `user.role`

### Route-based Redirects
- **Citizen** logs in → `/home` (Citizen Dashboard)
- **Authority** logs in → `/authority-dashboard` (Authority Dashboard)
- **Admin** logs in → `/admin-dashboard` (Admin Dashboard)
- Logout → Token removed and user redirected to `/login`

### Protected Routes
- `/home` - Citizens only
- `/admin-dashboard` - Admins only
- `/authority-dashboard` - Authorities only
- `/unauthorized` - Access denied page

## 🔄 User Model

```javascript
{
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  role: {
    type: String,
    enum: ['citizen', 'authority', 'admin'],
    default: 'citizen'
  },
  phoneNumber: { type: String },
  location: {
    city: String,
    district: String
  },
  joinedAt: { type: Date, default: Date.now }
}
```

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Ensure backend runs on `http://localhost:5000`
- Check CORS settings in `server.js`
- Verify frontend API URL in `AuthContext.jsx`

### Login fails
- Verify MongoDB connection in backend console
- Check credentials against seeded data
- Review error message in browser console

### Token expires
- Current JWT expires in 7 days
- Implement token refresh logic (future enhancement)
- Clear localStorage if stuck: `localStorage.clear()`

### Database seeding fails
- Verify MongoDB URI in `.env`
- Ensure MongoDB cluster is accessible
- Clear existing users data first

## 🚀 Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Token refresh mechanism
- [ ] User profile management
- [ ] Advanced role-based features
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] API rate limiting

## 📄 License

MIT License - Feel free to use this project for learning and development.

---

**Happy coding! 🎉**
