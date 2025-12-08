import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Loader2,
  School,
  Save,
} from 'lucide-react';
import classService, { ClassTemplate, SchoolClass } from '../../services/class.service';
import subjectService, { Subject } from '../../services/subject.service';

type SchoolType = {
  id: string;
  name: string;
};

interface ClassesListProps {
  onBack: () => void;
  schools: SchoolType[];
  selectedSchoolId?: string;
}

export default function ClassesList({ onBack, schools, selectedSchoolId }: ClassesListProps) {
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState<string>(selectedSchoolId || schools[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'school-classes' | 'class-subjects'>('school-classes');
  
  // Data
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);

  // School Classes Selection
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isSavingClasses, setIsSavingClasses] = useState(false);

  // Subject Selection for Class Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadClassTemplates();
    loadSubjects();
  }, []);

  // Load school classes when school changes
  useEffect(() => {
    if (activeSchoolId) {
      loadSchoolClasses();
    }
  }, [activeSchoolId]);

  // Update selected classes when school classes load
  useEffect(() => {
    // Get the class template IDs that are assigned to this school
    const assignedClassIds = schoolClasses.map(sc => sc.class_obj);
    setSelectedClassIds(assignedClassIds);
  }, [schoolClasses]);

  // Update selected subjects when template changes
  useEffect(() => {
    const selectedTemplate = classTemplates.find(c => c.id === selectedTemplateId);
    if (selectedTemplate) {
      setSelectedSubjectIds(selectedTemplate.subject_details?.map(s => s.id) || []);
    } else {
      setSelectedSubjectIds([]);
    }
  }, [selectedTemplateId, classTemplates]);

  const loadClassTemplates = async () => {
    setLoading(true);
    try {
      const response = await classService.getClasses();
      setClassTemplates(response.results);
    } catch (err) {
      console.error('Failed to load class templates:', err);
      setError('Failed to load class templates');
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolClasses = async () => {
    try {
      const classes = await classService.getSchoolClassesBySchool(activeSchoolId);
      setSchoolClasses(classes);
    } catch (err) {
      console.error('Failed to load school classes:', err);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getSubjects({ page: 1 });
      setSubjects(response.results);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  // Toggle class selection for school
  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  // Save school classes
  const handleSaveSchoolClasses = async () => {
    if (!activeSchoolId) return;

    setIsSavingClasses(true);
    try {
      // Get currently assigned class IDs
      const currentAssignedIds = schoolClasses.map(sc => sc.class_obj);

      // Find classes to add and remove
      const toAdd = selectedClassIds.filter(id => !currentAssignedIds.includes(id));
      const toRemove = schoolClasses.filter(sc => !selectedClassIds.includes(sc.class_obj));

      // Add new classes
      for (const classId of toAdd) {
        await classService.addClassToSchool({
          school: activeSchoolId,
          class_obj: classId,
          section: 'A',
          academic_year: '2024-2025',
        });
      }

      // Remove deselected classes
      for (const sc of toRemove) {
        await classService.removeClassFromSchool(sc.id);
      }

      await loadSchoolClasses();
    } catch (err: any) {
      console.error('Failed to save school classes:', err);
      alert(err.response?.data?.detail || 'Failed to save school classes');
    } finally {
      setIsSavingClasses(false);
    }
  };

  // Select/Deselect all classes
  const handleSelectAllClasses = () => {
    setSelectedClassIds(classTemplates.map(c => c.id));
  };

  const handleDeselectAllClasses = () => {
    setSelectedClassIds([]);
  };

  // Toggle subject selection for class template
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Save subjects for class template
  const handleSaveSubjects = async () => {
    if (!selectedTemplateId) return;

    const selectedTemplate = classTemplates.find(c => c.id === selectedTemplateId);
    if (!selectedTemplate) return;

    setIsSavingSubjects(true);
    try {
      const currentSubjectIds = selectedTemplate.subject_details?.map(s => s.id) || [];

      const toAdd = selectedSubjectIds.filter(id => !currentSubjectIds.includes(id));
      const toRemove = currentSubjectIds.filter(id => !selectedSubjectIds.includes(id));

      if (toAdd.length > 0) {
        await classService.addSubjects(selectedTemplateId, toAdd);
      }

      if (toRemove.length > 0) {
        await classService.removeSubjects(selectedTemplateId, toRemove);
      }

      await loadClassTemplates();
    } catch (err) {
      console.error('Failed to save subjects:', err);
      alert('Failed to save subjects');
    } finally {
      setIsSavingSubjects(false);
    }
  };

  const handleSelectAllSubjects = () => {
    setSelectedSubjectIds(subjects.map(s => s.id));
  };

  const handleDeselectAllSubjects = () => {
    setSelectedSubjectIds([]);
  };

  const currentSchool = schools.find(s => s.id === activeSchoolId);
  const selectedTemplate = classTemplates.find(c => c.id === selectedTemplateId);

  // Check if there are unsaved changes
  const hasUnsavedClassChanges = () => {
    const currentAssignedIds = schoolClasses.map(sc => sc.class_obj);
    const added = selectedClassIds.filter(id => !currentAssignedIds.includes(id));
    const removed = currentAssignedIds.filter(id => !selectedClassIds.includes(id));
    return added.length > 0 || removed.length > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Classes Management</h1>
            <p className="text-sm text-slate-500">Assign classes to schools and manage subjects</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('school-classes')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'school-classes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <School className="w-4 h-4 inline-block mr-2" />
          School Classes
        </button>
        <button
          onClick={() => setActiveTab('class-subjects')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'class-subjects'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4 inline-block mr-2" />
          Class Subjects
        </button>
      </div>

      {/* School Classes Tab */}
      {activeTab === 'school-classes' && (
        <div className="space-y-4">
          {/* School Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select School
            </label>
            <select
              value={activeSchoolId}
              onChange={(e) => setActiveSchoolId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
            >
              <option value="">Choose a school...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          {/* Classes Selection */}
          {activeSchoolId && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Select Classes for {currentSchool?.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedClassIds.length} of {classTemplates.length} classes selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllClasses}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAllClasses}
                    className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Classes Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                {classTemplates.map((cls) => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  const isAssigned = schoolClasses.some(sc => sc.class_obj === cls.id);
                  
                  return (
                    <button
                      key={cls.id}
                      onClick={() => toggleClassSelection(cls.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cls.grade_number}
                        </div>
                        <p className="text-sm font-medium text-slate-700">{cls.name}</p>
                        {isAssigned && !isSelected && (
                          <span className="text-xs text-red-500">Will remove</span>
                        )}
                        {!isAssigned && isSelected && (
                          <span className="text-xs text-green-500">Will add</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSchoolClasses}
                disabled={isSavingClasses || !hasUnsavedClassChanges()}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  hasUnsavedClassChanges()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSavingClasses ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Classes for {currentSchool?.name}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Currently Assigned Classes */}
          {activeSchoolId && schoolClasses.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 mb-3">
                Currently Assigned ({schoolClasses.length} classes)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {schoolClasses.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                      {sc.grade_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        Class {sc.grade_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {sc.section ? `Section ${sc.section}` : 'No section'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Class Subjects Tab */}
      {activeTab === 'class-subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Templates List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-3">
              Select Class to Manage Subjects
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {classTemplates.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedTemplateId(cls.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTemplateId === cls.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold ${
                      selectedTemplateId === cls.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cls.grade_number}
                    </div>
                    <p className="text-xs mt-1 text-slate-600">
                      {cls.subject_details?.length || 0} subj
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Subjects for {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedSubjectIds.length} subjects selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllSubjects}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllSubjects}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
                  {subjects.map((subj) => {
                    const isSelected = selectedSubjectIds.includes(subj.id);
                    return (
                      <label
                        key={subj.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubjectSelection(subj.id)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-700">{subj.name}</p>
                          <p className="text-xs text-slate-500">{subj.code} • {subj.category}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <button
                  onClick={handleSaveSubjects}
                  disabled={isSavingSubjects}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  {isSavingSubjects ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Subjects
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a class to manage its subjects</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
