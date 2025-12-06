# Sarathi Learn - Frontend

Modern React + TypeScript frontend for the Sarathi Learn government school platform.

## 🚀 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form validation
- **Lucide React** - Icons
- **PWA** - Offline support

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

## 🛠️ Development

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   ├── contexts/       # React contexts
│   ├── assets/         # Images, fonts, etc.
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## 🎨 Features

### Implemented
- ✅ Modern UI with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ Authentication context
- ✅ API service layer
- ✅ PWA support with offline caching
- ✅ Routing with React Router
- ✅ Form validation with Zod
- ✅ Toast notifications

### To Be Implemented
- 🔲 Student AI Chat interface
- 🔲 Teacher attendance marking
- 🔲 Admin dashboard
- 🔲 News feed with offline support
- 🔲 Live event streaming
- 🔲 Analytics dashboard
- 🔲 Real-time notifications

## 🔐 Authentication

The app supports three user roles:
- **Student**: Login with UDISE ID + DOB
- **Teacher**: Login with Employee ID/Phone + Password
- **Admin**: Login with UDISE Code + Password

## 🌐 Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_AI_BASE_URL=http://localhost:8001
VITE_ENVIRONMENT=development
```

## 📱 PWA Support

The app is configured as a Progressive Web App:
- Offline news caching
- Install to home screen
- Service worker for background sync
- Responsive design for all devices

## 🎯 Development Guidelines

1. **Components**: Create reusable components in `src/components/`
2. **Pages**: Route-level components go in `src/pages/`
3. **Types**: Define all types in `src/types/`
4. **API Calls**: Use the API service layer in `src/services/`
5. **Styling**: Use Tailwind utility classes
6. **State**: Use Zustand for global state, React Query for server state

## 🧪 Testing (Coming Soon)

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📚 Learn More

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/en/main)

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Write meaningful commit messages
4. Test your changes before committing

---

**Built with ❤️ for Indian Government Schools**


