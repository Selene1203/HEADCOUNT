import { useState, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, X, BookOpen, Users, User } from "lucide-react";
import { useData } from "../contexts/DataContext";
import type { Course } from "../contexts/DataContext";

type CourseFormKey = "name" | "code" | "description" | "year" | "credits" | "maxEnrollment";

export default function CoursesPage() {
  const { courses, departments, users, addCourse, updateCourse, deleteCourse } = useData();

  const [search, setSearch]         = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [modal, setModal]           = useState<"add" | "edit" | null>(null);
  const [selected, setSelected]     = useState<Course | null>(null);
  const [error, setError]           = useState("");

  const [form, setForm] = useState({
    name: "", code: "", description: "",
    departmentId: "", year: "1", credits: "3", maxEnrollment: "30",
  });

  const filtered = useMemo(() => courses.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || c.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  }), [courses, search, deptFilter]);

  const enrolledCount = (courseId: string) =>
    users.filter(u => u.role === "student" && (u.enrolledCourses ?? []).includes(courseId)).length;

  const lecturerName = (lecturerId?: string) => {
    if (!lecturerId) return null;
    return users.find(u => u.id === lecturerId)?.name ?? null;
  };

  const openAdd = () => {
    setForm({ name: "", code: "", description: "", departmentId: "", year: "1", credits: "3", maxEnrollment: "30" });
    setError(""); setModal("add");
  };

  const openEdit = (course: Course) => {
    setSelected(course);
    setForm({
      name: course.name, code: course.code, description: course.description ?? "",
      departmentId: course.departmentId ?? "", year: String(course.year ?? 1),
      credits: String(course.credits ?? 3), maxEnrollment: String(course.maxEnrollment ?? 30),
    });
    setError(""); setModal("edit");
  };

  const handleSave = () => {
    if (!form.name.trim()) { setError("Course name is required."); return; }
    if (!form.code.trim()) { setError("Course code is required."); return; }
    if (!form.departmentId) { setError("Please select a department."); return; }
    const dept = departments.find(d => d.id === form.departmentId);
    const payload: Omit<Course, "id"> = {
      name: form.name.trim(), code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      departmentId: form.departmentId, department: dept?.name,
      year: Number(form.year), credits: Number(form.credits), maxEnrollment: Number(form.maxEnrollment),
    };
    if (modal === "add") addCourse(payload);
    else if (modal === "edit" && selected) updateCourse(selected.id, payload);
    setModal(null);
  };

  const handleDelete = (course: Course) => {
    const enrolled = enrolledCount(course.id);
    const msg = enrolled > 0
      ? `${course.name} has ${enrolled} enrolled student${enrolled !== 1 ? "s" : ""}. Delete anyway?`
      : `Delete ${course.name}?`;
    if (window.confirm(msg)) deleteCourse(course.id);
  };

  const groupedCourses = useMemo(() => {
    const map: Record<string, { deptName: string; byYear: Record<number, Course[]> }> = {};
    filtered.forEach(c => {
      const dId = c.departmentId ?? "unknown";
      if (!map[dId]) map[dId] = { deptName: c.department ?? dId, byYear: {} };
      const y = c.year ?? 0;
      if (!map[dId].byYear[y]) map[dId].byYear[y] = [];
      map[dId].byYear[y].push(c);
    });
    return map;
  }, [filtered]);

  const inputCls = "w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500";

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{courses.length} course{courses.length !== 1 ? "s" : ""} total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-primary)' }}>
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code, or department…"
            className={`pl-9 pr-4 py-2.5 ${inputCls}`} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className={inputCls + " text-gray-600 dark:text-slate-300"}>
          <option value="" className="bg-white dark:bg-slate-900">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900">{d.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No courses found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCourses).map(([deptId, { deptName, byYear }]) => (
            <div key={deptId}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 pb-1 border-b border-gray-200 dark:border-slate-700">{deptName}</h2>
              <div className="space-y-4">
                {Object.keys(byYear).sort().map(yearKey => (
                  <div key={yearKey}>
                    <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">Year {yearKey}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {byYear[Number(yearKey)].map(course => {
                        const count    = enrolledCount(course.id);
                        const lecturer = lecturerName(course.lecturerId);
                        return (
                          <div key={course.id}
                            className="bg-white dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:border-[var(--theme-primary)]/40 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-xs font-mono bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-600/40 px-2 py-0.5 rounded">{course.code}</span>
                              <div className="flex gap-1">
                                <button onClick={() => openEdit(course)}
                                  className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => handleDelete(course)}
                                  className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm leading-snug">{course.name}</p>
                            {course.description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2">{course.description}</p>}
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 space-y-1">
                              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
                                <span className="flex items-center gap-1"><Users size={11} /> {count} / {course.maxEnrollment ?? "∞"} students</span>
                                <span>{course.credits} credits</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                                <User size={11} />
                                {lecturer
                                  ? <span className="font-medium" style={{ color: 'var(--theme-primary)' }}>{lecturer}</span>
                                  : <span className="italic">No lecturer assigned</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{modal === "add" ? "Add Course" : "Edit Course"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-2 rounded-lg">{error}</p>}
              {([
                { label: "Course Name *", key: "name" as CourseFormKey,        placeholder: "Introduction to Computer Science" },
                { label: "Course Code *", key: "code" as CourseFormKey,        placeholder: "CS1001" },
                { label: "Description",   key: "description" as CourseFormKey, placeholder: "Optional description" },
              ]).map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Department *</label>
                <select value={form.departmentId} onChange={e => setForm(prev => ({ ...prev, departmentId: e.target.value }))} className={inputCls}>
                  <option value="" className="bg-white dark:bg-slate-900">-- Select department --</option>
                  {departments.map(d => <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900">{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Year</label>
                  <select value={form.year} onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))} className={inputCls}>
                    {[1,2,3,4].map(y => <option key={y} value={y} className="bg-white dark:bg-slate-900">Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Credits</label>
                  <input type="number" min={1} max={10} value={form.credits}
                    onChange={e => setForm(prev => ({ ...prev, credits: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Max Students</label>
                  <input type="number" min={1} value={form.maxEnrollment}
                    onChange={e => setForm(prev => ({ ...prev, maxEnrollment: e.target.value }))} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--theme-primary)' }}>
                {modal === "add" ? "Add Course" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}