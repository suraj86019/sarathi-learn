import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Search,
  X,
  Loader2,
  Tag,
} from 'lucide-react';
import subjectService, { Subject } from '../../services/subject.service';

type SubjectCategory = 'CORE' | 'ELECTIVE' | 'VOCATIONAL' | 'EXTRA_CURRICULAR';

type SubjectItem = {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  description?: string;
  isActive: boolean;
};

interface SubjectsListProps {
  onBack: () => void;
}

const categoryColors: Record<SubjectCategory, string> = {
  CORE: 'bg-blue-100 text-blue-700 border-blue-200',
  ELECTIVE: 'bg-green-100 text-green-700 border-green-200',
  VOCATIONAL: 'bg-purple-100 text-purple-700 border-purple-200',
  EXTRA_CURRICULAR: 'bg-amber-100 text-amber-700 border-amber-200',
};

const categoryLabels: Record<SubjectCategory, string> = {
  CORE: 'Core',
  ELECTIVE: 'Elective',
  VOCATIONAL: 'Vocational',
  EXTRA_CURRICULAR: 'Extra-Curricular',
};

export default function SubjectsList({ onBack }: SubjectsListProps) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory | 'ALL'>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectList, setSubjectList] = useState<SubjectItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newSubject, setNewSubject] = useState<Omit<SubjectItem, 'id' | 'isActive'>>({
    name: '',
    code: '',
    category: 'CORE',
    description: '',
  });

  const categories: SubjectCategory[] = ['CORE', 'ELECTIVE', 'VOCATIONAL', 'EXTRA_CURRICULAR'];

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const response = await subjectService.getSubjects();
      setSubjectList(response.results.map((s: Subject) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
        description: s.description,
        isActive: s.is_active,
      })));
      setError(null);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjectList.filter(subject => {
    const matchesCategory = selectedCategory === 'ALL' || subject.category === selectedCategory;
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim() || !newSubject.code.trim()) return;

    try {
      setLoading(true);
      await subjectService.createSubject({
        name: newSubject.name,
        code: newSubject.code.trim().toUpperCase(),
        category: newSubject.category,
        description: newSubject.description,
        is_active: true,
      });
      setNewSubject({ name: '', code: '', category: 'CORE', description: '' });
      setShowCreateForm(false);
      await loadSubjects();
    } catch (err) {
      console.error('Failed to create subject:', err);
      setError('Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;
    try {
      setLoading(true);
      await subjectService.updateSubject(editingSubject.id, {
        name: editingSubject.name,
        code: editingSubject.code,
        category: editingSubject.category,
        description: editingSubject.description,
        is_active: editingSubject.isActive,
      });
      setEditingSubject(null);
      await loadSubjects();
    } catch (err) {
      console.error('Failed to update subject:', err);
      setError('Failed to update subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        setLoading(true);
        await subjectService.deleteSubject(subjectId);
        await loadSubjects();
      } catch (err) {
        console.error('Failed to delete subject:', err);
        setError('Failed to delete subject');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActive = async (subjectId: string) => {
    const subject = subjectList.find(s => s.id === subjectId);
    if (!subject) return;
    
    try {
      await subjectService.updateSubject(subjectId, {
        is_active: !subject.isActive,
      });
      setSubjectList(prev =>
        prev.map(sub =>
          sub.id === subjectId ? { ...sub, isActive: !sub.isActive } : sub
        )
      );
    } catch (err) {
      console.error('Failed to toggle subject status:', err);
      setError('Failed to toggle subject status');
    }
  };

  const getCategoryStats = () => {
    return categories.map(cat => ({
      category: cat,
      count: subjectList.filter(s => s.category === cat).length,
    }));
  };

  if (loading && subjectList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && subjectList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadSubjects}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-600" />
              Subjects Management
            </h1>
            <p className="text-sm text-gray-500">Create and manage subjects for your school</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Subject
        </button>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {getCategoryStats().map(stat => (
          <div
            key={stat.category}
            onClick={() => setSelectedCategory(stat.category)}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === stat.category ? 'ring-2 ring-amber-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Tag className={`w-5 h-5 ${
                stat.category === 'CORE' ? 'text-blue-600' :
                stat.category === 'ELECTIVE' ? 'text-green-600' :
                stat.category === 'VOCATIONAL' ? 'text-purple-600' :
                'text-amber-600'
              }`} />
              <span className="text-2xl font-bold text-gray-900">{stat.count}</span>
            </div>
            <p className="text-sm text-gray-600">{categoryLabels[stat.category]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SubjectCategory | 'ALL')}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{categoryLabels[cat]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Subjects</h2>
          <span className="text-sm text-gray-500">{filteredSubjects.length} subjects</span>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No subjects found</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
            >
              Add your first subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map(subject => (
              <div
                key={subject.id}
                className={`border rounded-xl p-4 transition-all ${
                  subject.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${categoryColors[subject.category]}`}>
                      {categoryLabels[subject.category]}
                    </span>
                    {!subject.isActive && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingSubject(subject)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{subject.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Code: {subject.code}</p>
                {subject.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{subject.description}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleActive(subject.id)}
                    className={`text-sm font-medium ${
                      subject.isActive
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {subject.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Subject Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Subject</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewSubject(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., Physics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewSubject(prev => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., PHY"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newSubject.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setNewSubject(prev => ({
                      ...prev,
                      category: e.target.value as SubjectCategory,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newSubject.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setNewSubject(prev => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder="Brief description of the subject"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Subject</h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingSubject(prev =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={editingSubject.code}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingSubject(prev =>
                      prev ? { ...prev, code: e.target.value.toUpperCase() } : null
                    )
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editingSubject.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setEditingSubject(prev =>
                      prev ? { ...prev, category: e.target.value as SubjectCategory } : null
                    )
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingSubject.description || ''}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingSubject(prev =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateSubject}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

