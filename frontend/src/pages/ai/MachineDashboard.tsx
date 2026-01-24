import { useState } from 'react';
import {
  Home,
  Cpu,
  Activity,
  Database,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Server,
  Shield,
  Bell,
  LogOut,
  Play,
  Pause,
  RotateCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIMachineDashboard() {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [aiStatus, setAiStatus] = useState<'running' | 'paused'>('running');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-900 to-indigo-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-purple-700">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
              <Cpu className="w-6 h-6 text-purple-900" />
            </div>
            <div>
              <div className="text-xl font-bold">AI Machine</div>
              <div className="text-xs text-purple-200">Control Panel</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <MenuItem
            icon={<Home className="w-5 h-5" />}
            label="Overview"
            active={activeMenu === 'overview'}
            onClick={() => setActiveMenu('overview')}
          />
          <MenuItem
            icon={<Activity className="w-5 h-5" />}
            label="Performance"
            active={activeMenu === 'performance'}
            onClick={() => setActiveMenu('performance')}
          />
          <MenuItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="Active Sessions"
            active={activeMenu === 'sessions'}
            onClick={() => setActiveMenu('sessions')}
          />
          <MenuItem
            icon={<Database className="w-5 h-5" />}
            label="Usage & Quotas"
            active={activeMenu === 'usage'}
            onClick={() => setActiveMenu('usage')}
          />
          <MenuItem
            icon={<Shield className="w-5 h-5" />}
            label="Safety & Moderation"
            active={activeMenu === 'safety'}
            onClick={() => setActiveMenu('safety')}
          />
          <MenuItem
            icon={<DollarSign className="w-5 h-5" />}
            label="Cost Tracking"
            active={activeMenu === 'cost'}
            onClick={() => setActiveMenu('cost')}
          />
          <MenuItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={activeMenu === 'settings'}
            onClick={() => setActiveMenu('settings')}
          />
        </nav>

        {/* System Status */}
        <div className="p-6 border-t border-purple-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-purple-200">System Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Online</span>
            </div>
          </div>
          <div className="text-xs text-purple-300">
            <div>Model: GPT-3.5-Turbo</div>
            <div>Version: v1.2.4</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">AI System Dashboard</h1>
              <div className="flex items-center space-x-2">
                {aiStatus === 'running' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-semibold">Running</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-600 font-semibold">Paused</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
          {/* Quick Actions */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => setAiStatus(aiStatus === 'running' ? 'paused' : 'running')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
                aiStatus === 'running'
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {aiStatus === 'running' ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause AI Service</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Resume AI Service</span>
                </>
              )}
            </button>
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md">
              <RotateCw className="w-5 h-5" />
              <span>Restart Services</span>
            </button>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<MessageSquare className="w-10 h-10 text-blue-600" />}
              value="1,247"
              label="Total Queries Today"
              trend="+12%"
              trendUp={true}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<Users className="w-10 h-10 text-green-600" />}
              value="89"
              label="Active Sessions"
              trend="+5"
              trendUp={true}
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<Zap className="w-10 h-10 text-yellow-600" />}
              value="234ms"
              label="Avg Response Time"
              trend="-18ms"
              trendUp={false}
              bgColor="bg-yellow-50"
            />
            <StatCard
              icon={<CheckCircle className="w-10 h-10 text-purple-600" />}
              value="99.8%"
              label="Success Rate"
              trend="+0.2%"
              trendUp={true}
              bgColor="bg-purple-50"
            />
          </div>

          {/* Charts & Metrics */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Token Usage */}
            <MetricCard title="Token Usage (Last 24h)">
              <div className="space-y-4">
                <UsageBar label="Input Tokens" value={156000} max={200000} color="bg-blue-600" />
                <UsageBar label="Output Tokens" value={89000} max={150000} color="bg-green-600" />
                <UsageBar label="Total Tokens" value={245000} max={350000} color="bg-purple-600" />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
                <span className="text-gray-600">Daily Quota</span>
                <span className="font-semibold text-gray-900">245K / 350K</span>
              </div>
            </MetricCard>

            {/* Request Volume */}
            <MetricCard title="Request Volume">
              <div className="h-48 flex items-end justify-around">
                {[
                  { hour: '00', value: 45 },
                  { hour: '04', value: 12 },
                  { hour: '08', value: 89 },
                  { hour: '12', value: 156 },
                  { hour: '16', value: 203 },
                  { hour: '20', value: 167 },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1 mx-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                      style={{ height: `${(item.value / 250) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{item.hour}h</span>
                  </div>
                ))}
              </div>
            </MetricCard>
          </div>

          {/* School-wise Usage */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">School-wise Usage</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">School</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold">Queries</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold">Tokens Used</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold">Quota</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { school: 'DPS Delhi', queries: 342, tokens: 45230, quota: 80, status: 'active' },
                    { school: 'Kendriya Vidyalaya', queries: 289, tokens: 38950, quota: 65, status: 'active' },
                    { school: 'Govt High School', queries: 156, tokens: 21340, quota: 35, status: 'active' },
                    { school: 'St. Xavier School', queries: 98, tokens: 13200, quota: 22, status: 'warning' },
                  ].map((school, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{school.school}</td>
                      <td className="py-3 px-4 text-center text-gray-900">{school.queries}</td>
                      <td className="py-3 px-4 text-center text-gray-900">
                        {school.tokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                school.quota > 70
                                  ? 'bg-green-600'
                                  : school.quota > 40
                                  ? 'bg-yellow-600'
                                  : 'bg-orange-600'
                              }`}
                              style={{ width: `${school.quota}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{school.quota}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            school.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {school.status === 'active' ? 'Active' : 'Warning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Health & Logs */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* System Health */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">System Health</h2>
              <div className="space-y-4">
                <HealthMetric label="API Response" value="Healthy" status="success" />
                <HealthMetric label="Database Connection" value="Connected" status="success" />
                <HealthMetric label="Cache Server" value="Running" status="success" />
                <HealthMetric label="Rate Limiter" value="Active" status="success" />
                <HealthMetric label="Content Filter" value="Online" status="success" />
              </div>
            </div>

            {/* Recent Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-3">
                <LogItem
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                  message="AI session completed - Student ID: 12345"
                  time="2 mins ago"
                />
                <LogItem
                  icon={<AlertCircle className="w-5 h-5 text-orange-600" />}
                  message="Rate limit warning - School XYZ"
                  time="5 mins ago"
                />
                <LogItem
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                  message="Content filter blocked inappropriate query"
                  time="8 mins ago"
                />
                <LogItem
                  icon={<Server className="w-5 h-5 text-blue-600" />}
                  message="Model updated to v1.2.4"
                  time="15 mins ago"
                />
                <LogItem
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                  message="Daily backup completed successfully"
                  time="1 hour ago"
                />
              </div>
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
        active ? 'bg-purple-800 border-l-4 border-white' : 'hover:bg-purple-800/50'
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
  trend,
  trendUp,
  bgColor,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend: string;
  trendUp: boolean;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className={`${bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-600 text-sm mb-2">{label}</div>
      <div className={`flex items-center text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-blue-600'}`}>
        <TrendingUp className={`w-4 h-4 mr-1 ${!trendUp && 'transform rotate-180'}`} />
        <span>{trend}</span>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
      {children}
    </div>
  );
}

// Usage Bar Component
function UsageBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-600">
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

// Health Metric Component
function HealthMetric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error';
}) {
  const statusColors = {
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600',
  };

  const statusIcons = {
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-700">{label}</span>
      <div className={`flex items-center space-x-2 ${statusColors[status]}`}>
        {statusIcons[status]}
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  );
}

// Log Item Component
function LogItem({ icon, message, time }: { icon: React.ReactNode; message: string; time: string }) {
  return (
    <div className="flex items-start space-x-3 py-2">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

