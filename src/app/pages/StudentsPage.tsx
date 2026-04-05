import { useState, useMemo } from "react";
import { Search, UserPlus, Edit2, Trash2, X, ChevronDown, BookOpen, Check } from "lucide-react";
import { useData } from "../contexts/DataContext";
import type { User } from "../contexts/DataContext";

export default function StudentsPage() {
  const {
    users, courses, programmes, departments,
    addUser, updateUser, deleteUser,
    enrollStudentInCourse, unenrollStudentFromCourse,
  } = useData();

  const students = useMemo(() => users.filter(u => u.role === "student"), [users]);

  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<"add" | "edit" | "courses" | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [error, setError]       = useState("");
  const [courseEdit, setCourseEdit] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", email: "", password: "", studentId: "",
    programmeId: "", yearOfStudy: "1", phone: "",
  });

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.programme ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ name: "", email: "", password: "student123", studentId: "", programmeId: "", yearOfStudy: "1", phone: "" });
    setError("");
    setModal("add");
  };

  const openEdit = (s: User) => {
    setSelected(s);
    setForm({
      name: s.name, email: s.email, password: s.password,
      studentId: s.studentId ?? "", programmeId: s.programmeId ?? "",
      yearOfStudy: String(s.yearOfStudy ?? 1), phone: s.phone ?? "",
    });
    setError("");
    setModal("edit");
  };

  const openCourses = (s: User) => {
    setSelected(s);
    setCourseEdit(s.enrolledCourses ?? []);
    setModal("courses");
  };

  const handleSave = () => {
    if (!form.name.trim())  { setError("Name is required.");  return; }
    if (!form.email.trim()) { setError("Email is required."); return; }

    const prog = programmes.find(p => p.id === form.programmeId);
    // Support both old departmentId and new departmentIds
    const deptId = (prog as any)?.departmentIds?.[0] ?? (prog as any)?.departmentId;
    const dept   = departments.find(d => d.id === deptId);

    const updates = {
      name: form.name, email: form.email, password: form.password,
      studentId: form.studentId, phone: form.phone,
      programmeId: form.programmeId, programme: prog?.name,
      departmentId: dept?.id, department: dept?.name,
      yearOfStudy: Number(form.yearOfStudy),
    };

    if (modal === "add") {
      addUser({ ...updates, role: "student", enrolledCourses: [] });
    } else if (modal === "edit" && selected) {
      updateUser(selected.id, updates);
    }
    setModal(null);
  };

  const handleSaveCourses = () => {
    if (!selected) return;
    const current = selected.enrolledCourses ?? [];
    current.filter(id => !courseEdit.includes(id)).forEach(id => unenrollStudentFromCourse(selected.id, id));
    courseEdit.filter(id => !current.includes(id)).forEach(id => enrollStudentInCourse(selected.id, id));
    setModal(null);
  };

  const handleDelete = (s: User) => {
    if (window.confirm(`Remove ${s.name}?`)) deleteUser(s.id);
  };

  const relevantCourses = useMemo(() => {
    if (!selected) return courses;
    return courses.filter(c =>
      c.departmentId === selected.departmentId && c.year === selected.yearOfStudy
    );
  }, [selected, courses]);

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{students.length} registered student{students.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: 'var(--theme-primary)' }}>
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, student ID, or programme…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/40 border-b border-gray-100 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Student ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Programme</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Year</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Enrolled Courses</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 dark:text-slate-500">No students found.</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs text-white"
                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs">{s.studentId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800 dark:text-slate-200 text-xs font-medium">{s.programme ?? "—"}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{s.department ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {s.yearOfStudy
                      ? <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">Year {s.yearOfStudy}</span>
                      : <span className="text-gray-400 dark:text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openCourses(s)}
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: 'var(--theme-primary)' }}>
                      <BookOpen size={13} />
                      {s.enrolledCourses?.length ?? 0} course{(s.enrolledCourses?.length ?? 0) !== 1 ? "s" : ""}
                      <ChevronDown size={13} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} title="Edit"
                        className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(s)} title="Delete"
                        className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{modal === "add" ? "Add Student" : "Edit Student"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-2 rounded-lg">{error}</p>}

              {[
                { label: "Full Name *", key: "name",      placeholder: "Alice Mokoena" },
                { label: "Email *",     key: "email",     placeholder: "alice@student.edu" },
                { label: "Student ID",  key: "studentId", placeholder: "s202312345" },
                { label: "Phone",       key: "phone",     placeholder: "+266 5800 0001" },
                { label: "Password",    key: "password",  placeholder: "student123" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
                  <input value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Programme</label>
                <select value={form.programmeId}
                  onChange={e => setForm(prev => ({ ...prev, programmeId: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="" className="bg-white dark:bg-slate-900">-- Select programme --</option>
                  {programmes.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Year of Study</label>
                <select value={form.yearOfStudy}
                  onChange={e => setForm(prev => ({ ...prev, yearOfStudy: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {[1, 2, 3, 4].map(y => <option key={y} value={y} className="bg-white dark:bg-slate-900">Year {y}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 text-white rounded-lg py-2 text-sm font-medium"
                style={{ backgroundColor: 'var(--theme-primary)' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Enrollment Modal */}
      {modal === "courses" && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Course Enrollment</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {selected.name} · {selected.programme} · Year {selected.yearOfStudy}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
              {relevantCourses.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No courses for this student's department and year.</p>
              )}
              {relevantCourses.map(course => {
                const enrolled = courseEdit.includes(course.id);
                return (
                  <button key={course.id} type="button"
                    onClick={() => setCourseEdit(prev => enrolled ? prev.filter(id => id !== course.id) : [...prev, course.id])}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                      enrolled
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                        : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800/40"
                    }`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{course.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{course.code} · Year {course.year}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${enrolled ? "border-indigo-500 bg-indigo-500" : "border-gray-300 dark:border-slate-600"}`}>
                      {enrolled && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleSaveCourses}
                className="flex-1 text-white rounded-lg py-2 text-sm font-medium"
                style={{ backgroundColor: 'var(--theme-primary)' }}>
                Save Enrollment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}