import { useState, useEffect } from 'react';
import {
  School,
  Search,
  BarChart3,
  Users,
  GraduationCap,
  Activity,
  Loader2,
  ArrowLeft,
  Clock,
  Brain,
  CheckCircle2,
  BookOpen,
  Mail,
  Phone,
  Award,
  ClipboardList,
  X,
  ChevronRight,
} from 'lucide-react';
import adminDashboardService, { 
  School as SchoolType, 
  SchoolReport, 
  SchoolTeacher, 
  SchoolTeacherDetail,
  SchoolStudent
} from '../../services/adminDashboard.service';

interface SchoolsListProps {
  onBack: () => void;
  schools?: SchoolType[];
}

type ViewMode = 'list' | 'report' | 'teachers' | 'teacher-detail' | 'students';

export default function SchoolsList({ onBack, schools: propSchools }: SchoolsListProps) {
  const [schools, setSchools] = useState<SchoolType[]>(propSchools || []);
  const [loading, setLoading] = useState(!propSchools || propSchools.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  
  // Report state
  const [schoolReport, setSchoolReport] = useState<SchoolReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Teachers list state
  const [schoolTeachers, setSchoolTeachers] = useState<SchoolTeacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  
  // Teacher detail state
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolTeacher | null>(null);
  const [teacherDetail, setTeacherDetail] = useState<SchoolTeacherDetail | null>(null);
  const [loadingTeacherDetail, setLoadingTeacherDetail] = useState(false);
  
  // Students list state
  const [schoolStudents, setSchoolStudents] = useState<SchoolStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  useEffect(() => {
    if (!propSchools || propSchools.length === 0) {
      loadSchools();
    }
  }, [propSchools]);

  useEffect(() => {
    if (propSchools && propSchools.length > 0) {
      setSchools(propSchools);
      setLoading(false);
    }
  }, [propSchools]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getSchools();
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (school: SchoolType) => {
    setSelectedSchool(school);
    setViewMode('report');
    setLoadingReport(true);
    try {
      const report = await adminDashboardService.getSchoolReport({
        school_id: school.id,
        include_students: true,
        include_teachers: true,
        include_attendance: true,
        include_ai_usage: true,
      });
      setSchoolReport(report);
    } catch (err) {
      console.error('Failed to load school report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleViewTeachers = async (school: SchoolType) => {
    setSelectedSchool(school);
    setViewMode('teachers');
    setTeacherSearchTerm('');
    setLoadingTeachers(true);
    try {
      const data = await adminDashboardService.getSchoolTeachers(school.id);
      setSchoolTeachers(data.teachers);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleViewStudents = async (school: SchoolType, search: string = '') => {
    setSelectedSchool(school);
    setViewMode('students');
    setLoadingStudents(true);
    try {
      const data = await adminDashboardService.getSchoolStudentsList(school.id, search);
      setSchoolStudents(data.students);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Debounced student search
  useEffect(() => {
    if (viewMode === 'students' && selectedSchool) {
      const timer = setTimeout(() => {
        handleViewStudents(selectedSchool, studentSearchTerm);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [studentSearchTerm]);

  const handleViewTeacherDetail = async (teacher: SchoolTeacher) => {
    if (!selectedSchool) return;
    
    setSelectedTeacher(teacher);
    setLoadingTeacherDetail(true);
    try {
      const detail = await adminDashboardService.getSchoolTeacherDetail(selectedSchool.id, teacher.id);
      setTeacherDetail(detail);
      setViewMode('teacher-detail');
    } catch (err) {
      console.error('Failed to load teacher detail:', err);
    } finally {
      setLoadingTeacherDetail(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'teacher-detail') {
      setViewMode('teachers');
      setTeacherDetail(null);
      setSelectedTeacher(null);
    } else if (viewMode === 'teachers' || viewMode === 'report' || viewMode === 'students') {
      setViewMode('list');
      setSelectedSchool(null);
      setSchoolTeachers([]);
      setSchoolStudents([]);
      setSchoolReport(null);
      setTeacherSearchTerm('');
      setStudentSearchTerm('');
    } else {
      onBack();
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.udise_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter teachers by search term (local filtering)
  const filteredTeachers = schoolTeachers.filter(teacher =>
    teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
    teacher.employee_id.toLowerCase().includes(teacherSearchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'INACTIVE': return 'bg-gray-100 text-gray-600';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Render School List
  const renderSchoolList = () => (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search schools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Schools Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSchools.map(school => (
            <div
              key={school.id}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden group"
            >
              {/* School Header */}
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-5 cursor-pointer active:opacity-90"
                onClick={() => handleViewReport(school)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">{school.name}</h3>
                    <p className="text-blue-100 text-xs sm:text-sm mt-1">{school.udise_code}</p>
                  </div>
                  <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${getStatusColor(school.status)}`}>
                    {school.status}
                  </span>
                </div>
              </div>

              {/* School Stats */}
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                  {/* Students - clickable */}
                  <div 
                    className="text-center cursor-pointer hover:bg-emerald-50 active:bg-emerald-100 rounded-lg p-1.5 sm:p-2 transition-colors"
                    onClick={() => handleViewStudents(school)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl mx-auto mb-1 sm:mb-2">
                      <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{school.total_students}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Students</p>
                  </div>
                  
                  {/* Teachers - clickable */}
                  <div 
                    className="text-center cursor-pointer hover:bg-blue-50 active:bg-blue-100 rounded-lg p-1.5 sm:p-2 transition-colors"
                    onClick={() => handleViewTeachers(school)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl mx-auto mb-1 sm:mb-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{school.total_teachers}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Teachers</p>
                  </div>
                  
                  {/* AI Usage */}
                  <div className="text-center p-1.5 sm:p-2">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl mx-auto mb-1 sm:mb-2">
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{school.ai_quota_percentage}%</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">AI Usage</p>
                  </div>
                </div>

                {/* Location */}
                <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  <p className="line-clamp-1">{school.city}, {school.district}</p>
                  <p className="text-gray-500">{school.state}</p>
                </div>

                {/* AI Quota Bar */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 mb-1">
                    <span>AI Quota</span>
                    <span>{school.ai_quota_used}/{school.ai_quota_limit}</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        school.ai_quota_percentage > 80 ? 'bg-red-500' :
                        school.ai_quota_percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${school.ai_quota_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Actions - Responsive buttons */}
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleViewStudents(school)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 sm:py-2.5 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl hover:bg-emerald-100 active:bg-emerald-200 transition-colors font-medium text-xs sm:text-sm"
                  >
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Students</span>
                  </button>
                  <button
                    onClick={() => handleViewTeachers(school)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 sm:py-2.5 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors font-medium text-xs sm:text-sm"
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Teachers</span>
                  </button>
                  <button
                    onClick={() => handleViewReport(school)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 sm:py-2.5 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl hover:bg-indigo-100 active:bg-indigo-200 transition-colors font-medium text-xs sm:text-sm"
                  >
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Report</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredSchools.length === 0 && (
            <div className="col-span-full text-center py-16 sm:py-20 text-gray-500">
              <School className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium">No schools found</p>
              <p className="text-xs sm:text-sm">Try adjusting your search term</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  // Render Students List for a School - Mobile optimized with cards
  const renderStudentsList = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* School Info Header */}
      {selectedSchool && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <h2 className="text-xl sm:text-2xl font-bold line-clamp-2">{selectedSchool.name}</h2>
          <p className="text-emerald-100 mt-1 text-sm sm:text-base">{selectedSchool.udise_code} • Students</p>
          <p className="text-emerald-200 text-xs sm:text-sm mt-1 sm:mt-2">{selectedSchool.city}, {selectedSchool.state}</p>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by name or roll number..."
          value={studentSearchTerm}
          onChange={(e) => setStudentSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Students Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm sm:text-base text-gray-600">
          <span className="font-semibold text-gray-900">{schoolStudents.length}</span> students found
        </p>
      </div>

      {/* Students List */}
      {loadingStudents ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-600" />
        </div>
      ) : schoolStudents.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {schoolStudents.map(student => (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-500">Roll No: {student.roll_no}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                    {student.class_name}
                  </span>
                  <span className="text-xs text-gray-500 truncate ml-2">{student.school_name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Roll No.</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700">Class</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-700 hidden lg:table-cell">School</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schoolStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm md:text-base truncate max-w-[120px] md:max-w-none">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-gray-600 text-sm">{student.roll_no}</td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-blue-50 text-blue-700 rounded-lg text-xs md:text-sm font-medium">
                          {student.class_name}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-gray-500 text-xs md:text-sm hidden lg:table-cell">{student.school_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 sm:py-20 bg-white rounded-xl border border-gray-200">
          <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
          <p className="text-base sm:text-lg font-medium text-gray-700">No students found</p>
          <p className="text-xs sm:text-sm text-gray-500">
            {studentSearchTerm ? 'Try adjusting your search term' : 'This school has no students'}
          </p>
        </div>
      )}
    </div>
  );

  // Render Teachers List for a School
  const renderTeachersList = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* School Info Header */}
      {selectedSchool && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <h2 className="text-xl sm:text-2xl font-bold line-clamp-2">{selectedSchool.name}</h2>
          <p className="text-blue-100 mt-1 text-sm sm:text-base">{selectedSchool.udise_code} • Teachers</p>
          <p className="text-blue-200 text-xs sm:text-sm mt-1 sm:mt-2">{selectedSchool.city}, {selectedSchool.state}</p>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by name or employee ID..."
          value={teacherSearchTerm}
          onChange={(e) => setTeacherSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Teachers List */}
      {loadingTeachers ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredTeachers.map(teacher => (
            <div
              key={teacher.id}
              onClick={() => handleViewTeacherDetail(teacher)}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 active:bg-gray-50 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{teacher.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{teacher.employee_id}</p>
                  
                  {/* Subjects */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {teacher.subjects.slice(0, 2).map((subject, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                          subject.is_primary ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {subject.name}
                      </span>
                    ))}
                    {teacher.subjects.length > 2 && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] sm:text-xs">
                        +{teacher.subjects.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {teacher.classes_count} classes
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {teacher.attendance_marked_30_days} att.
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}

          {filteredTeachers.length === 0 && (
            <div className="col-span-full text-center py-16 sm:py-20 text-gray-500">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium">No teachers found</p>
              <p className="text-xs sm:text-sm">
                {teacherSearchTerm ? 'Try adjusting your search term' : 'This school has no teachers assigned'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Teacher Detail - Mobile optimized
  const renderTeacherDetail = () => {
    if (loadingTeacherDetail) {
      return (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (!teacherDetail) return null;

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Teacher Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold truncate">{teacherDetail.name}</h2>
              <p className="text-blue-100 text-sm sm:text-base">{teacherDetail.employee_id}</p>
              <p className="text-blue-200 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">{teacherDetail.school.name}</p>
            </div>
          </div>
        </div>

        {/* Contact & Info - Stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              Contact Information
            </h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">{teacherDetail.email}</span>
              </div>
              {teacherDetail.phone && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{teacherDetail.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              Qualifications
            </h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <p><span className="text-gray-500">Qualification:</span> <span className="font-medium">{teacherDetail.qualification || 'N/A'}</span></p>
              <p><span className="text-gray-500">Experience:</span> <span className="font-medium">{teacherDetail.experience_years} years</span></p>
              {teacherDetail.specialization && (
                <p><span className="text-gray-500">Specialization:</span> <span className="font-medium">{teacherDetail.specialization}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Subjects ({teacherDetail.subjects_count})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {teacherDetail.subjects.map((subject, idx) => (
              <div
                key={idx}
                className={`p-2.5 sm:p-3 rounded-lg ${
                  subject.is_primary ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <p className={`font-medium text-xs sm:text-sm ${subject.is_primary ? 'text-blue-700' : 'text-gray-700'}`}>
                  {subject.name}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{subject.years_teaching}y teaching</p>
                {subject.is_primary && (
                  <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] sm:text-xs rounded-full mt-1 sm:mt-2">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Classes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            Classes Assigned ({teacherDetail.classes_count})
          </h3>
          {teacherDetail.classes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {teacherDetail.classes.map((cls, idx) => (
                <div key={idx} className="p-2.5 sm:p-3 bg-emerald-50 rounded-lg">
                  <p className="font-medium text-emerald-700 text-xs sm:text-sm">{cls.class_name}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1">{cls.subject}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs sm:text-sm">No classes assigned</p>
          )}
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            Permissions
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
              teacherDetail.permissions.can_mark_attendance 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {teacherDetail.permissions.can_mark_attendance ? '✓' : '✗'} Attendance
            </span>
            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
              teacherDetail.permissions.can_assign_homework 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {teacherDetail.permissions.can_assign_homework ? '✓' : '✗'} Homework
            </span>
            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
              teacherDetail.permissions.can_grade_assignments 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {teacherDetail.permissions.can_grade_assignments ? '✓' : '✗'} Grading
            </span>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            Attendance Records Marked
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-amber-50 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-amber-700">
                {teacherDetail.attendance_summary.last_30_days_marked}
              </p>
              <p className="text-xs sm:text-sm text-amber-600">Last 30 Days</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-gray-700">
                {teacherDetail.attendance_summary.total_records_marked}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Total Records</p>
            </div>
          </div>

          {/* Recent Attendance Records - Horizontal scroll on mobile */}
          {teacherDetail.attendance_records.length > 0 && (
            <div className="mt-3 sm:mt-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Recent Records</h4>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-xs sm:text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 sm:px-3 py-2 text-left text-gray-600 font-medium">Date</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-gray-600 font-medium">Class</th>
                      <th className="px-2 sm:px-3 py-2 text-center text-emerald-600 font-medium">P</th>
                      <th className="px-2 sm:px-3 py-2 text-center text-red-600 font-medium">A</th>
                      <th className="px-2 sm:px-3 py-2 text-center text-amber-600 font-medium">L</th>
                      <th className="px-2 sm:px-3 py-2 text-center text-gray-600 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teacherDetail.attendance_records.slice(0, 10).map((record, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 text-gray-900 whitespace-nowrap">{record.date}</td>
                        <td className="px-2 sm:px-3 py-2 text-gray-600 whitespace-nowrap">{record.class}</td>
                        <td className="px-2 sm:px-3 py-2 text-center text-emerald-600 font-medium">{record.present}</td>
                        <td className="px-2 sm:px-3 py-2 text-center text-red-600 font-medium">{record.absent}</td>
                        <td className="px-2 sm:px-3 py-2 text-center text-amber-600 font-medium">{record.late}</td>
                        <td className="px-2 sm:px-3 py-2 text-center text-gray-700 font-medium">{record.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Homework Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            Homework Assigned
          </h3>
          <div className="bg-indigo-50 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-700">{teacherDetail.homework_assigned_count}</p>
            <p className="text-xs sm:text-sm text-indigo-600">Total Assignments</p>
          </div>
        </div>
      </div>
    );
  };

  // Render School Report Modal - Mobile optimized
  const renderSchoolReport = () => {
    if (!selectedSchool) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 text-white min-w-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">{selectedSchool.name}</h2>
                  <p className="text-blue-100 text-xs sm:text-sm truncate">{selectedSchool.udise_code} • School Report</p>
                </div>
              </div>
              <button
                onClick={() => setViewMode('list')}
                className="text-white/80 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-100px)]">
            {loadingReport ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
              </div>
            ) : schoolReport ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Generated: </span>{new Date(schoolReport.generated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div 
                    className="bg-emerald-50 rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-emerald-100 active:bg-emerald-200 transition-colors"
                    onClick={() => {
                      setViewMode('list');
                      handleViewStudents(selectedSchool);
                    }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-700">{schoolReport.total_students || 0}</p>
                        <p className="text-[10px] sm:text-xs text-emerald-600">Students</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="bg-blue-50 rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors"
                    onClick={() => {
                      setViewMode('list');
                      handleViewTeachers(selectedSchool);
                    }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700">{schoolReport.total_teachers || 0}</p>
                        <p className="text-[10px] sm:text-xs text-blue-600">Teachers</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-amber-700">{schoolReport.overall_attendance_rate || 0}%</p>
                        <p className="text-[10px] sm:text-xs text-amber-600">Attendance</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                        <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-purple-700">{schoolReport.total_ai_queries || 0}</p>
                        <p className="text-[10px] sm:text-xs text-purple-600">AI Queries</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">School Information</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500">School Name</p>
                      <p className="font-medium text-gray-900 truncate">{schoolReport.school_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">UDISE Code</p>
                      <p className="font-medium text-gray-900">{schoolReport.udise_code}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-900 truncate">{selectedSchool.city}, {selectedSchool.district}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">State</p>
                      <p className="font-medium text-gray-900">{selectedSchool.state}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 text-gray-500">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">Failed to load report data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleBack}
            className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
              {viewMode === 'teacher-detail' ? (
                <>
                  <Users className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Teacher Detail</span>
                </>
              ) : viewMode === 'teachers' ? (
                <>
                  <Users className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Teachers</span>
                </>
              ) : viewMode === 'students' ? (
                <>
                  <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">Students</span>
                </>
              ) : (
                <>
                  <School className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Schools</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-base text-gray-500 mt-0.5 sm:mt-1 truncate">
              {viewMode === 'teacher-detail' && selectedTeacher
                ? `${selectedTeacher.name}`
                : viewMode === 'teachers' && selectedSchool
                  ? `${filteredTeachers.length} teachers`
                  : viewMode === 'students' && selectedSchool
                    ? `${schoolStudents.length} students`
                    : `${schools.length} schools`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && renderSchoolList()}
      {viewMode === 'teachers' && renderTeachersList()}
      {viewMode === 'students' && renderStudentsList()}
      {viewMode === 'teacher-detail' && renderTeacherDetail()}
      {viewMode === 'report' && renderSchoolReport()}
    </div>
  );
}
