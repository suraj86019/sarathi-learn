import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import StudentRegisterPage from '@/pages/StudentRegisterPage';
import StudentDashboard from '@/pages/student/Dashboard';
import TeacherDashboard from '@/pages/teacher/Dashboard';
import AdminDashboard from '@/pages/admin/Dashboard';
import SuperAdminDashboard from '@/pages/superadmin/Dashboard';
import AIMachineDashboard from '@/pages/ai/MachineDashboard';
import NotFoundPage from '@/pages/NotFoundPage';

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/student" element={<StudentRegisterPage />} />

            {/* Student Routes */}
            <Route path="/student/*" element={<StudentDashboard />} />

            {/* Teacher Routes */}
            <Route path="/teacher/*" element={<TeacherDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminDashboard />} />

            {/* Super Admin Routes */}
            <Route path="/super-admin/*" element={<SuperAdminDashboard />} />

            {/* AI Machine Routes */}
            <Route path="/ai-machine/*" element={<AIMachineDashboard />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

