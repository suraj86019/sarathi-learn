import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Sparkles,
  Calendar,
  BarChart3,
  Newspaper,
  School,
  UserCheck,
  Laptop
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Sarathi Learn</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Home
              </a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Features
              </a>
              <a href="#schools" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Schools
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Contact
              </a>
              <Link
                to="/login"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                Login to Portal
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 shadow-2xl">
                <div className="flex items-center justify-center space-x-8">
                  {/* Student 1 */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-orange-400 rounded-full mb-4 flex items-center justify-center">
                      <div className="w-16 h-16 bg-orange-300 rounded-full"></div>
                    </div>
                    <div className="w-16 h-20 bg-orange-500 rounded-t-full"></div>
                  </div>

                  {/* AI Robot */}
                  <div className="flex flex-col items-center -mt-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-12 h-12 text-blue-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="w-4 h-8 bg-white mt-2"></div>
                  </div>

                  {/* Student 2 */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-yellow-400 rounded-full mb-4 flex items-center justify-center">
                      <div className="w-16 h-16 bg-yellow-300 rounded-full"></div>
                    </div>
                    <div className="w-16 h-20 bg-yellow-500 rounded-t-full"></div>
                  </div>
                </div>

                {/* Laptop/Books */}
                <div className="mt-8 flex justify-center">
                  <div className="w-64 h-4 bg-blue-800 rounded-full"></div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
            </div>

            {/* Right - Content */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Empowering
                <br />
                <span className="text-blue-600">Government</span>
                <br />
                Schools with AI
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                AI-powered learning, attendance & national events — all in one platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#features"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Explore Features
                </a>
                <Link
                  to="/login"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
                >
                  Login to Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
            Our Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <FeatureCard
              icon={<Sparkles className="w-16 h-16 text-blue-600" />}
              number="1"
              title="AI Learning Buddy"
              description="Interactive daily AI classes"
            />

            {/* Feature 2 */}
            <FeatureCard
              icon={<UserCheck className="w-16 h-16 text-blue-600" />}
              number="2"
              title="Smart Attendance"
              description="Teachers mark attendance digitally"
            />

            {/* Feature 3 */}
            <FeatureCard
              icon={<Newspaper className="w-16 h-16 text-blue-600" />}
              number="3"
              title="Morning Digital Board"
              description="Latest news, education, and motivation"
            />

            {/* Feature 4 */}
            <FeatureCard
              icon={<Calendar className="w-16 h-16 text-blue-600" />}
              number="4"
              title="Event Live Mode"
              description="Watch CM/PM speeches on 15 Aug & 20 Jan"
            />

            {/* Feature 5 */}
            <FeatureCard
              icon={<BarChart3 className="w-16 h-16 text-blue-600" />}
              number="5"
              title="Analytics Dashboard"
              description="Track student progress and engagement"
            />

            {/* Feature 6 */}
            <FeatureCard
              icon={<School className="w-16 h-16 text-blue-600" />}
              number="6"
              title="Government Aligned"
              description="Built for UDISE-based school systems"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center transform rotate-6 shadow-xl">
                    <School className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">School onboarded</h3>
              <p className="text-gray-600">(via UDISE)</p>
              {/* Arrow */}
              <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center transform -rotate-6 shadow-xl">
                    <Users className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Teachers schedule</h3>
              <p className="text-gray-600">AI sessions</p>
              {/* Arrow */}
              <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center transform rotate-6 shadow-xl">
                    <Laptop className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Students learn and</h3>
              <p className="text-gray-600">interact with AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of schools using Sarathi Learn across India
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all shadow-lg"
            >
              Get Started Today
            </Link>
            <a
              href="#contact"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 transition-all border-2 border-white"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Sarathi Learn</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering government schools with AI-powered learning platform.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#schools" className="hover:text-white transition-colors">Schools</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Data Protection</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Ministry of Education</li>
                <li>Government of India</li>
                <li>contact@sarathilearn.gov.in</li>
                <li>+91 11 2345 6789</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>© 2024 Sarathi Learn. Government of India Initiative.</p>
            <p className="flex items-center space-x-2">
              <span>🇮🇳</span>
              <span>Aligned with NEP 2020</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100">
      {/* Number Badge */}
      <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
        {number}
      </div>
      
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{title}</h3>
      <p className="text-gray-600 text-center leading-relaxed">{description}</p>
    </div>
  );
}
