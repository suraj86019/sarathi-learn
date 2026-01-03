import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  School as SchoolIcon,
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  User,
  Clock,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import superAdminDashboardService, {
  SchoolDetail,
  SchoolTeacher,
  SchoolStudent,
  SchoolAdmin,
  SchoolClass,
} from '../../services/superAdminDashboard.service';

type ActiveTab = 'overview' | 'teachers' | 'students' | 'admins' | 'classes';

export default function SchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  useEffect(() => {
    if (schoolId) {
      loadSchoolDetail();
    }
  }, [schoolId]);

  const loadSchoolDetail = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getSchoolDetail(schoolId!);
      setSchool(data);
    } catch (err) {
      console.error('Failed to load school:', err);
      toast.error('Failed to load school details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SchoolIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">School Not Found</h2>
          <button
            onClick={() => navigate('/super-admin', { state: { section: 'schools' } })}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            Back to Schools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin', { state: { section: 'schools' } })}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{school.name}</h1>
              <p className="text-sm text-gray-500">UDISE: {school.udise_code}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(school.status)}`}>
              {school.status}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'teachers', label: 'Teachers', icon: GraduationCap, count: school.actual_teachers },
              { id: 'students', label: 'Students', icon: Users, count: school.actual_students },
              { id: 'admins', label: 'Admins', icon: Shield, count: school.actual_admins },
              { id: 'classes', label: 'Classes', icon: BookOpen, count: school.classes_count },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-amber-200' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && <OverviewTab school={school} />}
        {activeTab === 'teachers' && <TeachersTab schoolId={schoolId!} />}
        {activeTab === 'students' && <StudentsTab schoolId={schoolId!} />}
        {activeTab === 'admins' && <AdminsTab schoolId={schoolId!} />}
        {activeTab === 'classes' && <ClassesTab schoolId={schoolId!} />}
      </main>
    </div>
  );
}


// ========== OVERVIEW TAB ==========

function OverviewTab({ school }: { school: SchoolDetail }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Students" value={school.actual_students} color="bg-blue-500" />
        <StatCard icon={<GraduationCap className="w-6 h-6" />} label="Teachers" value={school.actual_teachers} color="bg-green-500" />
        <StatCard icon={<Shield className="w-6 h-6" />} label="Admins" value={school.actual_admins} color="bg-purple-500" />
        <StatCard icon={<BookOpen className="w-6 h-6" />} label="Classes" value={school.classes_count || school.classes?.length || 0} color="bg-orange-500" />
      </div>

      {/* School Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem icon={<Mail className="w-5 h-5" />} label="Email" value={school.contact_email || 'Not provided'} />
          <InfoItem icon={<Phone className="w-5 h-5" />} label="Phone" value={school.contact_phone || 'Not provided'} />
          <InfoItem icon={<MapPin className="w-5 h-5" />} label="Address" value={`${school.address}, ${school.city}`} />
          <InfoItem icon={<MapPin className="w-5 h-5" />} label="District" value={`${school.district}, ${school.state} - ${school.pincode}`} />
          <InfoItem icon={<User className="w-5 h-5" />} label="Principal" value={school.principal_name || 'Not provided'} />
          <InfoItem icon={<Award className="w-5 h-5" />} label="Board" value={school.board || 'Not specified'} />
          <InfoItem icon={<Award className="w-5 h-5" />} label="Plan" value={school.plan_type} />
          <InfoItem icon={<Calendar className="w-5 h-5" />} label="Established" value={school.established_date || 'Not specified'} />
        </div>
      </div>

      {/* Classes List */}
      {school.classes && school.classes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Classes</h3>
          <div className="flex flex-wrap gap-2">
            {school.classes.map((cls, i) => (
              <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-amber-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}


// ========== TEACHERS TAB ==========

function TeachersTab({ schoolId }: { schoolId: string }) {
  const [teachers, setTeachers] = useState<SchoolTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolTeacher | null>(null);

  useEffect(() => {
    loadTeachers();
  }, [page]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getSchoolTeachers(schoolId, page, 12, searchQuery || undefined);
      setTeachers(data.teachers || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load teachers:', err);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTeachers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-gray-900 text-white rounded-xl">
          Search
        </button>
      </div>

      {/* Teachers Grid */}
      {teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <PersonCard
              key={teacher.id}
              person={teacher}
              type="teacher"
              onClick={() => setSelectedTeacher(teacher)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No teachers found" />
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination page={page} pagination={pagination} setPage={setPage} />
      )}

      {/* Detail Modal */}
      {selectedTeacher && (
        <PersonDetailModal
          person={selectedTeacher}
          type="teacher"
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}


// ========== STUDENTS TAB ==========

function StudentsTab({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<SchoolStudent | null>(null);

  useEffect(() => {
    loadStudents();
  }, [page]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getSchoolStudents(schoolId, page, 12, searchQuery || undefined);
      setStudents(data.students || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadStudents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-gray-900 text-white rounded-xl">
          Search
        </button>
      </div>

      {/* Students Grid */}
      {students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <PersonCard
              key={student.id}
              person={student}
              type="student"
              onClick={() => setSelectedStudent(student)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No students found" />
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination page={page} pagination={pagination} setPage={setPage} />
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <PersonDetailModal
          person={selectedStudent}
          type="student"
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}


// ========== ADMINS TAB ==========

function AdminsTab({ schoolId }: { schoolId: string }) {
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null);

  useEffect(() => {
    loadAdmins();
  }, [page]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getSchoolAdmins(schoolId, page, 12, searchQuery || undefined);
      setAdmins(data.admins || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load admins:', err);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadAdmins();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-gray-900 text-white rounded-xl">
          Search
        </button>
      </div>

      {/* Admins Grid */}
      {admins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((admin) => (
            <PersonCard
              key={admin.id}
              person={admin}
              type="admin"
              onClick={() => setSelectedAdmin(admin)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No admins found" />
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination page={page} pagination={pagination} setPage={setPage} />
      )}

      {/* Detail Modal */}
      {selectedAdmin && (
        <PersonDetailModal
          person={selectedAdmin}
          type="admin"
          onClose={() => setSelectedAdmin(null)}
        />
      )}
    </div>
  );
}


// ========== CLASSES TAB ==========

function ClassesTab({ schoolId }: { schoolId: string }) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await superAdminDashboardService.getSchoolClasses(schoolId);
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {cls.grade}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">Section: {cls.section || 'N/A'}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Academic Year: {cls.academic_year}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No classes found" />
      )}
    </div>
  );
}


// ========== SHARED COMPONENTS ==========

function PersonCard({ person, type, onClick }: {
  person: SchoolTeacher | SchoolStudent | SchoolAdmin;
  type: 'teacher' | 'student' | 'admin';
  onClick: () => void;
}) {
  const getGradient = () => {
    switch (type) {
      case 'teacher': return 'from-green-500 to-emerald-600';
      case 'student': return 'from-blue-500 to-indigo-600';
      case 'admin': return 'from-purple-500 to-violet-600';
    }
  };

  const getSubtext = () => {
    if (type === 'teacher') return (person as SchoolTeacher).qualification || 'Teacher';
    if (type === 'student') return (person as SchoolStudent).class_name || 'Student';
    if (type === 'admin') return (person as SchoolAdmin).designation || 'Admin';
    return '';
  };

  const getId = () => {
    if (type === 'teacher') return (person as SchoolTeacher).employee_id;
    if (type === 'student') return (person as SchoolStudent).roll_no;
    if (type === 'admin') return (person as SchoolAdmin).employee_id;
    return '';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${getGradient()} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
          {person.first_name?.charAt(0)}{person.last_name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{person.full_name}</h3>
          <p className="text-sm text-gray-500 truncate">{getSubtext()}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${person.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {person.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{person.email}</span>
        </p>
        {person.phone && (
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{person.phone}</span>
          </p>
        )}
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>ID: {getId()}</span>
        </p>
      </div>
    </div>
  );
}

function PersonDetailModal({ person, type, onClose }: {
  person: SchoolTeacher | SchoolStudent | SchoolAdmin;
  type: 'teacher' | 'student' | 'admin';
  onClose: () => void;
}) {
  const getGradient = () => {
    switch (type) {
      case 'teacher': return 'from-green-50 to-emerald-50';
      case 'student': return 'from-blue-50 to-indigo-50';
      case 'admin': return 'from-purple-50 to-violet-50';
    }
  };

  const getAvatarGradient = () => {
    switch (type) {
      case 'teacher': return 'from-green-500 to-emerald-600';
      case 'student': return 'from-blue-500 to-indigo-600';
      case 'admin': return 'from-purple-500 to-violet-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`p-6 border-b border-gray-100 bg-gradient-to-r ${getGradient()}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${getAvatarGradient()} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
                {person.first_name?.charAt(0)}{person.last_name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{person.full_name}</h2>
                <p className="text-sm text-gray-500 capitalize">{type}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <DetailItem icon={<Mail className="w-5 h-5" />} label="Email" value={person.email} />
          {person.phone && <DetailItem icon={<Phone className="w-5 h-5" />} label="Phone" value={person.phone} />}
          
          {type === 'teacher' && (
            <>
              <DetailItem icon={<User className="w-5 h-5" />} label="Employee ID" value={(person as SchoolTeacher).employee_id} />
              <DetailItem icon={<Award className="w-5 h-5" />} label="Qualification" value={(person as SchoolTeacher).qualification || 'N/A'} />
              <DetailItem icon={<Clock className="w-5 h-5" />} label="Experience" value={`${(person as SchoolTeacher).experience_years} years`} />
            </>
          )}
          
          {type === 'student' && (
            <>
              <DetailItem icon={<User className="w-5 h-5" />} label="Roll Number" value={(person as SchoolStudent).roll_no} />
              <DetailItem icon={<BookOpen className="w-5 h-5" />} label="Class" value={(person as SchoolStudent).class_name || 'N/A'} />
              <DetailItem icon={<User className="w-5 h-5" />} label="UDISE ID" value={(person as SchoolStudent).udise_student_id} />
            </>
          )}
          
          {type === 'admin' && (
            <>
              <DetailItem icon={<User className="w-5 h-5" />} label="Employee ID" value={(person as SchoolAdmin).employee_id} />
              <DetailItem icon={<Award className="w-5 h-5" />} label="Designation" value={(person as SchoolAdmin).designation || 'Admin'} />
              {(person as SchoolAdmin).is_primary && (
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Primary Admin
                </span>
              )}
            </>
          )}
          
          <DetailItem icon={<Calendar className="w-5 h-5" />} label="Joined" value={new Date(person.created_at).toLocaleDateString()} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

function Pagination({ page, pagination, setPage }: {
  page: number;
  pagination: any;
  setPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={!pagination.has_previous}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-600">
        Page {pagination.page} of {pagination.total_pages}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={!pagination.has_next}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

