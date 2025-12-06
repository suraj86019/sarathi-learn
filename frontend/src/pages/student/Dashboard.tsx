import { useState } from 'react';
import {
  Home,
  MessageSquare,
  Newspaper,
  Calendar,
  User,
  BookOpen,
  Bell,
  LogOut,
  Send,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const [activeMenu, setActiveMenu] = useState('chat');
  const [message, setMessage] = useState('');

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
            icon={<MessageSquare className="w-5 h-5" />}
            label="AI Chat"
            active={activeMenu === 'chat'}
            onClick={() => setActiveMenu('chat')}
          />
          <MenuItem
            icon={<Newspaper className="w-5 h-5" />}
            label="Daily News"
            active={activeMenu === 'news'}
            onClick={() => setActiveMenu('news')}
          />
          <MenuItem
            icon={<Calendar className="w-5 h-5" />}
            label="Schedule"
            active={activeMenu === 'schedule'}
            onClick={() => setActiveMenu('schedule')}
          />
          <MenuItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Homework"
            active={activeMenu === 'homework'}
            onClick={() => setActiveMenu('homework')}
          />
          <MenuItem
            icon={<User className="w-5 h-5" />}
            label="Profile"
            active={activeMenu === 'profile'}
            onClick={() => setActiveMenu('profile')}
          />
        </nav>

        {/* Student Info */}
        <div className="p-6 border-t border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold">Rahul Kumar</div>
              <div className="text-sm text-blue-200">Class 7-A</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AI Learning Buddy</h1>

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

        {/* Chat Area */}
        <main className="flex-1 flex flex-col p-8">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {/* AI Welcome Message */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-blue-50 rounded-2xl rounded-tl-none p-4 max-w-2xl">
                  <p className="text-gray-900">
                    Namaste! 🙏 I'm your AI Learning Buddy. I'm here to help you learn anything!
                    Ask me questions about Math, Science, History, or any subject you're curious about.
                  </p>
                </div>
              </div>

              {/* Student Message */}
              <div className="flex items-start space-x-3 justify-end">
                <div className="bg-gray-100 rounded-2xl rounded-tr-none p-4 max-w-2xl">
                  <p className="text-gray-900">
                    Can you explain photosynthesis in simple words?
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              </div>

              {/* AI Response */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-blue-50 rounded-2xl rounded-tl-none p-4 max-w-2xl">
                  <p className="text-gray-900 mb-3">
                    Great question! 🌱 Photosynthesis is how plants make their food. Think of it like cooking:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-900">
                    <li><strong>Ingredients:</strong> Sunlight, water, and carbon dioxide (CO₂)</li>
                    <li><strong>Process:</strong> Plants use chlorophyll (the green color) to catch sunlight</li>
                    <li><strong>Result:</strong> They make glucose (sugar) for energy and release oxygen for us!</li>
                  </ul>
                  <p className="mt-3 text-gray-900">
                    So plants are like tiny food factories powered by the sun! ☀️🌿
                  </p>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
              <button className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors">
                <Send className="w-6 h-6" />
              </button>
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
