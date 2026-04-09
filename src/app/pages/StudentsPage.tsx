// ... (imports remain the same, added Globe and Calendar to lucide-react)
import { Search, UserPlus, Edit2, Trash2, X, ChevronDown, BookOpen, Check, Globe, Calendar } from "lucide-react";

export default function StudentsPage() {
  // ... (auth and state remain same)
  const [courseSearch, setCourseSearch] = useState(""); // New search for enrollment modal

  // ... (handleSave and handlers remain same)

  // UPDATED: Logic to include cross-year and multi-dept courses
  const relevantCourses = useMemo(() => {
    if (!selected) return [];
    
    return courses.filter(c => {
      const isStandardMatch = c.departmentId === selected.departmentId && c.year === selected.yearOfStudy;
      const isCrossDeptMatch = c.isMultiDept;
      const isCrossYearMatch = c.isOpenYear && c.departmentId === selected.departmentId;
      
      const matchesFilter = isStandardMatch || isCrossDeptMatch || isCrossYearMatch;
      
      // Also apply local modal search
      const matchesSearch = c.name.toLowerCase().includes(courseSearch.toLowerCase()) || 
                            c.code.toLowerCase().includes(courseSearch.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [selected, courses, courseSearch]);

  // ... (Table rendering remains same)

  /* Course Enrollment Modal Update */
  return (
    <div className="space-y-5 p-6">
      {/* ... existing table code ... */}

      {modal === "courses" && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Course Enrollment</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {selected.name} · Year {selected.yearOfStudy}
                  </p>
                </div>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"><X size={16} /></button>
              </div>
              
              {/* New Search inside enrollment modal */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                  placeholder="Filter available courses..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
              {relevantCourses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No eligible courses found.</p>
              )}
              {relevantCourses.map(course => {
                const enrolled = courseEdit.includes(course.id);
                const isCrossDept = course.isMultiDept && course.departmentId !== selected.departmentId;
                const isCrossYear = course.isOpenYear && course.year !== selected.yearOfStudy;

                return (
                  <button key={course.id} type="button"
                    onClick={() => setCourseEdit(prev => enrolled ? prev.filter(id => id !== course.id) : [...prev, course.id])}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                      enrolled
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                        : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                    }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{course.name}</p>
                        {isCrossDept && <Globe size={12} className="text-purple-500" title="Cross-Departmental" />}
                        {isCrossYear && <Calendar size={12} className="text-amber-500" title="Cross-Year" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                        <span>{course.code}</span>
                        <span>•</span>
                        <span>Year {course.year}</span>
                        {isCrossDept && <span className="text-purple-500/80">· {course.department}</span>}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${enrolled ? "border-indigo-500 bg-indigo-500" : "border-gray-300 dark:border-slate-600"}`}>
                      {enrolled && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg py-2 text-sm text-gray-700 dark:text-slate-300">Cancel</button>
              <button onClick={handleSaveCourses} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: 'var(--theme-primary)' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
