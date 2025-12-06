import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  School,
  Settings,
  Activity,
  UserPlus,
  UserCog,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  Database,
  Globe,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Home,
  LogOut,
  LayoutDashboard,
  UserCheck,
  UserX,
  Key,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  GraduationCap,
  Briefcase,
  Award,
  Target,
  Zap,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  CloudOff,
  Bot,
  FileText,
  ClipboardList,
  PieChart,
  LineChart,
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import CreateAdminModal from '@/components/CreateAdminModal';
import CreateTeacherModal from '@/components/CreateTeacherModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);

  const sidebarNavItems = [
    { name: 'Overview', icon: <LayoutDashboard className="h-5 w-5" />, id: 'overview' },
    { name: 'User Management', icon: <Users className="h-5 w-5" />, id: 'users' },
    { name: 'School Management', icon: <School className="h-5 w-5" />, id: 'schools' },
    { name: 'Access Control', icon: <Key className="h-5 w-5" />, id: 'access' },
    { name: 'Platform Analytics', icon: <BarChart2 className="h-5 w-5" />, id: 'analytics' },
    { name: 'System Settings', icon: <Settings className="h-5 w-5" />, id: 'settings' },
  ];

  // Mock data for users
  const users = [
    { id: 1, name: 'Rajesh Kumar', role: 'Admin', school: 'DPS Delhi', status: 'active', email: 'rajesh@dps.edu', phone: '+91 98765 43210', joinDate: '2024-01-15' },
    { id: 2, name: 'Priya Sharma', role: 'Teacher', school: 'Kendriya Vidyalaya', status: 'active', email: 'priya@kv.edu', phone: '+91 98765 43211', joinDate: '2024-02-20' },
    { id: 3, name: 'Amit Patel', role: 'Admin', school: 'Govt High School', status: 'pending', email: 'amit@ghs.edu', phone: '+91 98765 43212', joinDate: '2024-03-10' },
    { id: 4, name: 'Sneha Reddy', role: 'Teacher', school: 'St. Xavier School', status: 'active', email: 'sneha@xavier.edu', phone: '+91 98765 43213', joinDate: '2024-02-05' },
    { id: 5, name: 'Vikram Singh', role: 'Admin', school: 'Modern Public School', status: 'suspended', email: 'vikram@mps.edu', phone: '+91 98765 43214', joinDate: '2024-01-25' },
  ];

  // Mock data for schools
  const schools = [
    { id: 1, name: 'DPS Delhi', udise: 'DL001234', district: 'Central Delhi', students: 1250, teachers: 45, admins: 2, status: 'active', plan: 'Premium' },
    { id: 2, name: 'Kendriya Vidyalaya', udise: 'DL005678', district: 'South Delhi', students: 980, teachers: 38, admins: 1, status: 'active', plan: 'Standard' },
    { id: 3, name: 'Govt High School', udise: 'DL009012', district: 'East Delhi', students: 750, teachers: 28, admins: 1, status: 'pending', plan: 'Basic' },
    { id: 4, name: 'St. Xavier School', udise: 'DL003456', district: 'West Delhi', students: 1100, teachers: 42, admins: 2, status: 'active', plan: 'Premium' },
  ];

  // Chart data
  const platformGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Schools',
        data: [45, 52, 58, 65, 73, 82],
        borderColor: 'rgba(245, 158, 11, 1)', // amber-500
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Users',
        data: [1200, 1450, 1700, 2100, 2500, 2950],
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const userDistributionData = {
    labels: ['Super Admins', 'Admins', 'Teachers', 'Students'],
    datasets: [
      {
        data: [5, 82, 645, 2218],
        backgroundColor: [
          'rgba(217, 119, 6, 0.8)', // amber-600
          'rgba(59, 130, 246, 0.8)', // blue-500
          'rgba(34, 197, 94, 0.8)', // green-500
          'rgba(168, 85, 247, 0.8)', // purple-500
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const activityLog = [
    { time: '2 mins ago', user: 'Super Admin', action: 'Created new admin for DPS Delhi', type: 'create' },
    { time: '15 mins ago', user: 'Admin (KV)', action: 'Added 5 new teachers', type: 'update' },
    { time: '1 hour ago', user: 'Super Admin', action: 'Approved Govt High School registration', type: 'approve' },
    { time: '2 hours ago', user: 'Super Admin', action: 'Suspended user: Vikram Singh', type: 'suspend' },
    { time: '3 hours ago', user: 'Admin (DPS)', action: 'Updated school profile', type: 'update' },
    { time: 'Yesterday', user: 'Super Admin', action: 'System backup completed', type: 'system' },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 text-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-center mb-8">
            <Shield className="h-10 w-10 mr-3 text-amber-300" />
            <div>
              <h1 className="text-2xl font-bold">Super Admin</h1>
              <p className="text-xs text-amber-200">Master Control</p>
            </div>
          </div>
          <nav>
            <ul>
              {sidebarNavItems.map((item) => (
                <li key={item.id} className="mb-2">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center w-full text-amber-100 hover:text-white hover:bg-amber-700 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === item.id ? 'bg-amber-700 text-white shadow-lg' : ''
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3 text-base font-medium">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="absolute bottom-0 w-64 p-6 border-t border-amber-700">
          <div className="mb-4 p-3 bg-amber-800 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Super Admin</p>
                <p className="text-xs text-amber-200">Full Access</p>
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center text-amber-100 hover:text-white hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Home className="h-5 w-5" />
            <span className="ml-3">Back to Home</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Super Admin Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1">Complete platform control & management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="flex items-center bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
              >
                <ShieldCheck className="h-5 w-5 mr-2" /> Create Admin
              </button>
              <button
                onClick={() => setShowCreateTeacherModal(true)}
                className="flex items-center bg-green-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200"
              >
                <GraduationCap className="h-5 w-5 mr-2" /> Create Teacher
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-amber-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm font-medium">Total Schools</p>
                    <School className="h-8 w-8 text-amber-500 opacity-70" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">82</p>
                  <p className="text-xs text-green-600 mt-1">+12 this month</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm font-medium">Total Users</p>
                    <Users className="h-8 w-8 text-blue-500 opacity-70" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">2,950</p>
                  <p className="text-xs text-green-600 mt-1">+450 this month</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm font-medium">Active Sessions</p>
                    <Activity className="h-8 w-8 text-green-500 opacity-70" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">1,247</p>
                  <p className="text-xs text-blue-600 mt-1">Real-time</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm font-medium">Pending Approvals</p>
                    <AlertTriangle className="h-8 w-8 text-purple-500 opacity-70" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">15</p>
                  <p className="text-xs text-orange-600 mt-1">Requires attention</p>
                </div>
              </section>

              {/* Charts Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Platform Growth</h3>
                  <Line data={platformGrowthData} options={{ maintainAspectRatio: true, aspectRatio: 2.5 }} />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">User Distribution</h3>
                  <Doughnut data={userDistributionData} />
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Super Admins:</span>
                      <span className="font-semibold">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admins:</span>
                      <span className="font-semibold">82</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teachers:</span>
                      <span className="font-semibold">645</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-semibold">2,218</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Activity Log */}
              <section className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
                  <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">View All</button>
                </div>
                <div className="space-y-3">
                  {activityLog.map((log, index) => (
                    <div key={index} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`p-2 rounded-full mr-3 ${
                        log.type === 'create' ? 'bg-green-100' :
                        log.type === 'update' ? 'bg-blue-100' :
                        log.type === 'approve' ? 'bg-purple-100' :
                        log.type === 'suspend' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {log.type === 'create' && <UserPlus className="h-4 w-4 text-green-600" />}
                        {log.type === 'update' && <Edit className="h-4 w-4 text-blue-600" />}
                        {log.type === 'approve' && <CheckCircle className="h-4 w-4 text-purple-600" />}
                        {log.type === 'suspend' && <XCircle className="h-4 w-4 text-red-600" />}
                        {log.type === 'system' && <Server className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm">{log.action}</p>
                        <p className="text-xs text-gray-500 mt-1">by {log.user} • {log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-500">Manage admins and teachers across all schools</p>
                </div>
                <div className="flex space-x-3">
                  <button className="flex items-center bg-white text-gray-700 px-4 py-2 rounded-lg shadow border border-gray-200 hover:bg-gray-50">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </button>
                  <button className="flex items-center bg-white text-gray-700 px-4 py-2 rounded-lg shadow border border-gray-200 hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" /> Export
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or school..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">School</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-amber-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{user.school}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="text-gray-700">{user.phone}</p>
                              <p className="text-gray-500 text-xs">Joined: {user.joinDate}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center w-fit px-3 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-green-100 text-green-700' :
                              user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {user.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {user.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {user.status === 'suspended' && <XCircle className="h-3 w-3 mr-1" />}
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                                <Edit className="h-4 w-4" />
                              </button>
                              {user.status === 'active' && (
                                <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Suspend">
                                  <Lock className="h-4 w-4" />
                                </button>
                              )}
                              {user.status === 'suspended' && (
                                <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Activate">
                                  <Unlock className="h-4 w-4" />
                                </button>
                              )}
                              {user.status === 'pending' && (
                                <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Approve">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* School Management Tab */}
          {activeTab === 'schools' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">School Management</h3>
                  <p className="text-sm text-gray-500">Manage all registered schools on the platform</p>
                </div>
                <button className="flex items-center bg-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-amber-700">
                  <Plus className="h-5 w-5 mr-2" /> Add School
                </button>
              </div>

              {/* Schools Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {schools.map((school) => (
                  <div key={school.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{school.name}</h4>
                        <p className="text-sm text-gray-500">UDISE: {school.udise}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                        {school.district}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2 text-amber-500" />
                        Plan: <span className="font-semibold ml-1">{school.plan}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-amber-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{school.students}</p>
                        <p className="text-xs text-gray-500">Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{school.teachers}</p>
                        <p className="text-xs text-gray-500">Teachers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{school.admins}</p>
                        <p className="text-xs text-gray-500">Admins</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        <Eye className="h-4 w-4 mr-2" /> View
                      </button>
                      <button className="flex-1 flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </button>
                      <button className="flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Access Control Tab */}
          {activeTab === 'access' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Access Control & Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border-2 border-amber-200 rounded-xl hover:border-amber-400 transition-all">
                  <Shield className="h-12 w-12 text-amber-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Super Admin</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full Platform Access</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Create/Delete Users</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Manage All Schools</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> System Settings</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Analytics Access</li>
                  </ul>
                </div>

                <div className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 transition-all">
                  <ShieldCheck className="h-12 w-12 text-blue-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Admin</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> School Management</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Add/Remove Teachers</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Student Management</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> AI Quota Control</li>
                    <li className="flex items-center"><XCircle className="h-4 w-4 mr-2 text-red-500" /> No System Access</li>
                  </ul>
                </div>

                <div className="p-6 border-2 border-green-200 rounded-xl hover:border-green-400 transition-all">
                  <UserCheck className="h-12 w-12 text-green-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Teacher</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Class Management</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Attendance Marking</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Content Upload</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Student Reports</li>
                    <li className="flex items-center"><XCircle className="h-4 w-4 mr-2 text-red-500" /> No Admin Access</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
                <div className="flex items-start">
                  <ShieldAlert className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Role Management Guidelines</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Super Admins have complete control over the platform</li>
                      <li>• Admins can only manage their assigned schools</li>
                      <li>• Teachers have limited access to their classes only</li>
                      <li>• All role changes are logged for security audit</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={showCreateAdminModal}
        onClose={() => setShowCreateAdminModal(false)}
        onSuccess={() => {
          // Refresh user list or show success message
          console.log('Admin created successfully');
        }}
      />

      {/* Create Teacher Modal */}
      <CreateTeacherModal
        isOpen={showCreateTeacherModal}
        onClose={() => setShowCreateTeacherModal(false)}
        onSuccess={() => {
          // Refresh user list or show success message
          console.log('Teacher created successfully');
        }}
      />
    </div>
  );
};

export default SuperAdminDashboard;

