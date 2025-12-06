# Frontend Setup Guide

## 🚀 Quick Start

### 1. Install Node.js

Make sure you have Node.js 18+ installed:

```bash
node --version
# Should be v18 or higher
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### 2. Install Dependencies

```bash
cd frontend
npm install
```

This will install all required packages (~150MB, takes 2-3 minutes).

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your API URLs
# VITE_API_BASE_URL=http://localhost:8000/api
# VITE_AI_BASE_URL=http://localhost:8001
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## 📦 What's Installed

### Core Libraries
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite 5.4** - Lightning-fast dev server
- **React Router 6.26** - Client-side routing

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **Lucide React** - Beautiful icons
- **clsx + tailwind-merge** - Class name utilities

### Data & State Management
- **TanStack Query 5.56** - Server state management
- **Zustand 4.5** - Client state management
- **Axios 1.7** - HTTP client

### Forms & Validation
- **React Hook Form 7.53** - Form management
- **Zod 3.23** - Schema validation
- **@hookform/resolvers** - Form validation bridge

### PWA & Offline
- **vite-plugin-pwa** - Progressive Web App support
- **workbox-window** - Service worker utilities

### Developer Experience
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TS-specific linting

---

## 🎨 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run preview          # Preview production build

# Building
npm run build            # Build for production
npm run type-check       # Check TypeScript types

# Code Quality
npm run lint             # Lint code with ESLint
npm run format           # Format code with Prettier
```

---

## 📁 Project Structure

```
frontend/
├── public/                      # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   └── (to be created)
│   ├── pages/                  # Page components
│   │   ├── HomePage.tsx        ✅ Landing page
│   │   ├── LoginPage.tsx       ✅ Login for all roles
│   │   ├── NotFoundPage.tsx    ✅ 404 page
│   │   ├── student/
│   │   │   └── Dashboard.tsx   ✅ Student dashboard
│   │   ├── teacher/
│   │   │   └── Dashboard.tsx   ✅ Teacher dashboard
│   │   └── admin/
│   │       └── Dashboard.tsx   ✅ Admin dashboard
│   ├── services/
│   │   └── api.ts              ✅ API client with auth
│   ├── hooks/                  # Custom React hooks
│   │   └── (to be created)
│   ├── utils/
│   │   └── cn.ts               ✅ Class name utility
│   ├── types/
│   │   └── index.ts            ✅ TypeScript types
│   ├── contexts/
│   │   └── AuthContext.tsx     ✅ Authentication context
│   ├── assets/                 # Images, fonts
│   ├── App.tsx                 ✅ Root component
│   ├── main.tsx                ✅ Entry point
│   └── index.css               ✅ Global styles
├── index.html                  ✅ HTML template
├── vite.config.ts              ✅ Vite configuration
├── tailwind.config.js          ✅ Tailwind configuration
├── tsconfig.json               ✅ TypeScript config
├── package.json                ✅ Dependencies
└── README.md                   ✅ Documentation
```

---

## 🔐 Authentication Flow

### Student Login
1. Enter UDISE Student ID
2. Enter Date of Birth
3. Click Login
4. Redirect to `/student/dashboard`

### Teacher Login
1. Enter Employee ID or Phone
2. Enter Password
3. Click Login
4. Redirect to `/teacher/dashboard`

### Admin Login
1. Enter School UDISE Code
2. Enter Password
3. Click Login
4. Redirect to `/admin/dashboard`

---

## 🌐 API Integration

The frontend is configured to work with:

- **Django Backend**: `http://localhost:8000/api`
- **AI Service**: `http://localhost:8001`

### API Client Features
✅ Automatic token refresh
✅ Request/response interceptors
✅ Error handling
✅ TypeScript types
✅ Separate AI client

### Making API Calls

```typescript
import { api } from '@/services/api';

// GET request
const response = await api.get<User>('/users/me/');

// POST request
const response = await api.post<AuthResponse>('/auth/login/', {
  identifier: 'student123',
  date_of_birth: '2010-01-01'
});
```

---

## 📱 PWA Features

### Configured
- ✅ Service worker registration
- ✅ Offline news caching
- ✅ Install to home screen
- ✅ App manifest
- ✅ Icons (192x192, 512x512)

### To Add
- 🔲 Push notifications
- 🔲 Background sync
- 🔲 Offline form submission

---

## 🎨 Styling Guide

### Tailwind CSS
Use utility classes for styling:

```tsx
<div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg hover:bg-blue-700">
  Content
</div>
```

### Custom Colors
```tsx
// Primary blue (government theme)
bg-primary-600    // #2563eb
text-primary-700  // #1d4ed8

// Secondary pink (accents)
bg-secondary-500  // #ec4899
```

### Responsive Design
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  Responsive width
</div>
```

---

## 🚧 To Be Implemented

### Student Features
- 🔲 AI Chat interface with streaming
- 🔲 News feed with offline support
- 🔲 Class schedule view
- 🔲 Profile management
- 🔲 Homework submissions

### Teacher Features
- 🔲 Attendance marking
- 🔲 Class scheduling
- 🔲 Student reports
- 🔲 AI chat insights
- 🔲 Content upload

### Admin Features
- 🔲 User management
- 🔲 School analytics
- 🔲 AI quota management
- 🔲 Announcements
- 🔲 Reports export

### Common Features
- 🔲 Real-time notifications
- 🔲 Dark mode
- 🔲 Multi-language support (Hindi/English)
- 🔲 Accessibility improvements
- 🔲 Loading states
- 🔲 Error boundaries

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Check types
npm run type-check

# Restart TypeScript server in VS Code
Cmd+Shift+P > "TypeScript: Restart TS Server"
```

### Vite Cache Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## 📚 Next Steps

1. **Run the frontend**: `npm run dev`
2. **Open browser**: http://localhost:3000
3. **Start building**: Check `src/pages/` for examples
4. **Add components**: Create reusable components in `src/components/`
5. **Connect to backend**: Make sure Django is running on port 8000

---

## 🎯 Development Tips

1. **Hot Reload**: Changes auto-reload instantly
2. **TypeScript**: Let types guide you - hover for docs
3. **Tailwind**: Use IntelliSense for class names
4. **React DevTools**: Install browser extension
5. **Console**: Check for errors and warnings

---

**Happy Coding! 🚀**


