import { useState } from 'react';
import {
  Home,
  Users,
  Calendar,
  FileText,
  Upload,
  BookOpen,
  Bell,
  LogOut,
  CheckSquare,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const [activeMenu, setActiveMenu] = useState('attendance');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-blue-700">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-900" />
            </div>
            <span className="text-xl font-bold">Sarathi Learn</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <MenuItem
            icon={<CheckSquare className="w-5 h-5" />}
            label="Attendance"
            active={activeMenu === 'attendance'}
            onClick={() => setActiveMenu('attendance')}
          />
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="My Students"
            active={activeMenu === 'students'}
            onClick={() => setActiveMenu('students')}
          />
          <MenuItem
            icon={<Calendar className="w-5 h-5" />}
            label="Schedule"
            active={activeMenu === 'schedule'}
            onClick={() => setActiveMenu('schedule')}
          />
          <MenuItem
            icon={<FileText className="w-5 h-5" />}
            label="Reports"
            active={activeMenu === 'reports'}
            onClick={() => setActiveMenu('reports')}
          />
          <MenuItem
            icon={<Upload className="w-5 h-5" />}
            label="Content"
            active={activeMenu === 'content'}
            onClick={() => setActiveMenu('content')}
          />
        </nav>

        {/* Teacher Info */}
        <div className="p-6 border-t border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold">Mrs. Priya Singh</div>
              <div className="text-sm text-blue-200">Mathematics</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance - Class 7-A</h1>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
              </button>
              <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<Users className="w-10 h-10 text-blue-600" />}
              value="42"
              label="Total Students"
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<CheckSquare className="w-10 h-10 text-green-600" />}
              value="38"
              label="Present Today"
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<Clock className="w-10 h-10 text-orange-600" />}
              value="4"
              label="Absent"
              bgColor="bg-orange-50"
            />
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Today's Attendance</h2>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Mark All Present
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Save Attendance
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Roll No.</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Student Name</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { roll: 1, name: 'Rahul Kumar', status: 'present' },
                    { roll: 2, name: 'Priya Sharma', status: 'present' },
                    { roll: 3, name: 'Amit Patel', status: 'absent' },
                    { roll: 4, name: 'Anjali Singh', status: 'present' },
                    { roll: 5, name: 'Vikram Reddy', status: 'present' },
                  ].map((student) => (
                    <tr key={student.roll} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{student.roll}</td>
                      <td className="py-3 px-4 text-gray-900">{student.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            student.status === 'present'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {student.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                            P
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              <ActivityItem
                icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                activity="Class 7-A completed AI session on Algebra"
                time="2 hours ago"
              />
              <ActivityItem
                icon={<FileText className="w-5 h-5 text-blue-600" />}
                activity="Homework submitted by 35 students"
                time="5 hours ago"
              />
              <ActivityItem
                icon={<Users className="w-5 h-5 text-blue-600" />}
                activity="Parent meeting scheduled for next week"
                time="1 day ago"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Menu Item Component
function MenuItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors ${
        active ? 'bg-blue-800 border-l-4 border-white' : 'hover:bg-blue-800/50'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Stat Card Component
function StatCard({
  icon,
  value,
  label,
  bgColor,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className={`${bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({
  icon,
  activity,
  time,
}: {
  icon: React.ReactNode;
  activity: string;
  time: string;
}) {
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-gray-900">{activity}</p>
        <p className="text-gray-500 text-sm">{time}</p>
      </div>
    </div>
  );
}
