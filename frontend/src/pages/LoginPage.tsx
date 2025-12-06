import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, User, GraduationCap, Shield, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Prepare credentials based on role
      const credentials: any = {
        email: identifier.includes('@') ? identifier : undefined,
        phone: !identifier.includes('@') ? identifier : undefined,
      };

      // Students use date of birth, others use password
      if (role === 'STUDENT') {
        if (!dob) {
          setError('Date of birth is required for students');
          return;
        }
        credentials.date_of_birth = dob;
      } else {
        if (!password) {
          setError('Password is required');
          return;
        }
        credentials.password = password;
      }

      // Login
      await login(credentials);
      
      // Show success message
      toast.success('Login successful!');
      
      // Redirect based on role
      setTimeout(() => {
        switch (role) {
          case 'STUDENT':
            navigate('/student');
            break;
          case 'TEACHER':
            navigate('/teacher');
            break;
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'SUPER_ADMIN':
            navigate('/super-admin');
            break;
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Sarathi Learn</span>
          </Link>
        </div>
      </nav>

      {/* Login Content */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Branding */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold">Welcome Back!</h1>
                </div>

                <p className="text-blue-100 text-lg leading-relaxed">
                  Access your personalized dashboard and continue your learning journey with AI-powered education.
                </p>

                <div className="space-y-4 pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Learning</h3>
                      <p className="text-sm text-blue-200">Personalized education powered by AI</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Track Progress</h3>
                      <p className="text-sm text-blue-200">Monitor your academic journey</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Secure & Safe</h3>
                      <p className="text-sm text-blue-200">Your data is protected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Login to Portal
                  </h2>
                  <p className="text-gray-600">
                    Select your role and enter credentials
                  </p>
                </div>

                {/* Role Selector */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { role: 'STUDENT' as UserRole, icon: User, label: 'Student', color: 'blue' },
                    { role: 'TEACHER' as UserRole, icon: GraduationCap, label: 'Teacher', color: 'green' },
                    { role: 'ADMIN' as UserRole, icon: Shield, label: 'Admin', color: 'purple' },
                    { role: 'SUPER_ADMIN' as UserRole, icon: ShieldCheck, label: 'Super Admin', color: 'amber' },
                  ].map(({ role: r, icon: Icon, label, color }) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        role === r
                          ? color === 'blue' ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' :
                            color === 'green' ? 'bg-green-600 text-white border-green-600 shadow-lg scale-105' :
                            color === 'purple' ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105' :
                            'bg-amber-600 text-white border-amber-600 shadow-lg scale-105'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${role === r ? 'text-white' : 'text-gray-600'}`} />
                      <span className="text-sm font-semibold">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {role === 'STUDENT'
                        ? 'Email or Phone'
                        : role === 'TEACHER'
                        ? 'Email or Employee ID'
                        : role === 'ADMIN'
                        ? 'Email'
                        : 'Super Admin Email'}
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                      placeholder={
                        role === 'STUDENT'
                          ? 'Enter your email or phone'
                          : role === 'TEACHER'
                          ? 'Enter email or employee ID'
                          : role === 'ADMIN'
                          ? 'Enter your email'
                          : 'Enter super admin email'
                      }
                      required
                    />
                  </div>

                  {role === 'STUDENT' ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Students authenticate using their date of birth
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        placeholder="Enter your password"
                        required
                      />
                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="text-center text-sm text-gray-600">
                  {role === 'STUDENT' ? (
                    <p>
                      Don't have an account?{' '}
                      <Link to="/register/student" className="text-blue-600 hover:text-blue-800 font-semibold">
                        Register as Student
                      </Link>
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      {role === 'TEACHER' && 'Teachers are created by School Admins'}
                      {role === 'ADMIN' && 'Admins are created by Super Admins'}
                      {role === 'SUPER_ADMIN' && 'Super Admins are created via system command'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
