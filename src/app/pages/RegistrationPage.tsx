import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PasswordInput } from '../components/ui/password-input';
import { BookOpen, UserPlus, Check, AlertCircle, Loader2 } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";

const API = `${import.meta.env.VITE_API_URL}`;

const inputCls = "w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const selectCls = inputCls;

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { courses, programmes, departments } = useData();
  const { login } = useAuth();

  const [step, setStep]         = useState<1 | 2>(1);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "student" as "student" | "lecturer" | "admin",
    phone: "", studentId: "", programmeId: "", yearOfStudy: "1",
    staffId: "", departmentId: "", adminCode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    if (["programmeId", "yearOfStudy", "departmentId"].includes(e.target.name)) {
      setSelectedCourses([]);
    }
  };

  const selectedProgramme = useMemo(
    () => programmes.find(p => p.id === form.programmeId),
    [programmes, form.programmeId]
  );

  const studentDepartmentId = useMemo(() => {
    if (!selectedProgramme) return null;
    return selectedProgramme.departmentIds[0] ?? null;
  }, [selectedProgramme]);

  const studentDepartment = useMemo(
    () => departments.find(d => d.id === studentDepartmentId),
    [departments, studentDepartmentId]
  );

  const availableCourses = useMemo(() => {
    if (form.role === "student") {
      if (!studentDepartmentId || !form.yearOfStudy) return [];
      return courses.filter(c => c.departmentId === studentDepartmentId && c.year === Number(form.yearOfStudy));
    }
    if (form.role === "lecturer") {
      if (!form.departmentId) return [];
      return courses.filter(c => c.departmentId === form.departmentId);
    }
    return [];
  }, [form.role, form.yearOfStudy, form.departmentId, studentDepartmentId, courses]);

  const coursesByYear = useMemo(() => {
    const map: Record<number, typeof courses> = {};
    availableCourses.forEach(c => {
      const y = c.year ?? 0;
      if (!map[y]) map[y] = [];
      map[y].push(c);
    });
    return map;
  }, [availableCourses]);

  const getLecturerError = (current: string[], adding: string): string | null => {
    const candidate = courses.find(c => c.id === adding);
    if (!candidate) return null;
    if (current.length >= 4) return "A lecturer can teach at most 4 courses.";
    const yearCount = current.filter(id => courses.find(x => x.id === id)?.year === candidate.year).length;
    if (yearCount >= 2) return `At most 2 Year ${candidate.year} courses allowed.`;
    return null;
  };

  const toggleCourse = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(prev => prev.filter(id => id !== courseId));
      setError(""); return;
    }
    if (form.role === "lecturer") {
      const err = getLecturerError(selectedCourses, courseId);
      if (err) { setError(err); return; }
    }
    setError("");
    setSelectedCourses(prev => [...prev, courseId]);
  };

  const validateStep1 = (): string => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return "Valid email is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (form.role === "student") {
      if (!form.studentId.trim()) return "Student ID is required.";
      if (!/^s\d{9}$/.test(form.studentId)) return "Student ID must be sXXXXXXXXX (s + 9 digits).";
      if (!form.programmeId) return "Please select your programme.";
    }
    if (form.role === "lecturer") {
      if (!form.staffId.trim()) return "Staff ID is required.";
      if (!/^e\d{9}$/.test(form.staffId)) return "Staff ID must be eXXXXXXXXX (e + 9 digits).";
      if (!form.departmentId) return "Please select your department.";
    }
    if (form.role === "admin") {
      if (!form.staffId.trim()) return "Staff ID is required.";
      if (form.adminCode !== "NUL-ADMIN-2026") return "Invalid admin registration code.";
    }
    return "";
  };

  const handleStep1 = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    if (form.role === "admin") { handleRegister(); return; }
    setStep(2);
  };

  const handleRegister = async () => {
    if (form.role !== "admin" && selectedCourses.length === 0) {
      setError(`Please select at least one course to ${form.role === "student" ? "enroll in" : "teach"}.`);
      return;
    }
    const dept = form.role === "student"
      ? studentDepartment
      : departments.find(d => d.id === form.departmentId);

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          role: form.role, phone: form.phone,
          department: dept?.name, departmentId: dept?.id,
          ...(form.role === "student" && {
            studentId: form.studentId, programmeId: form.programmeId,
            programme: selectedProgramme?.name, yearOfStudy: Number(form.yearOfStudy),
          }),
          ...(form.role === "lecturer" && { staffId: form.staffId }),
          ...(form.role === "admin"    && { staffId: form.staffId }),
          courseIds: form.role !== "admin" ? selectedCourses : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      login(data.user, data.token);
      if (form.role === "admin")         navigate("/admin-dashboard");
      else if (form.role === "lecturer") navigate("/lecturer-dashboard");
      else                               navigate("/student-dashboard");
    } catch {
      setError("Cannot connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="bg-indigo-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen size={24} />
            <h1 className="text-xl font-bold">HEADCOUNT</h1>
          </div>
          <p className="text-indigo-200 text-sm">Create your account</p>
          {form.role !== "admin" && (
            <div className="flex items-center gap-2 mt-4">
              {[1, 2].map(s => (
                <div key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  step >= s ? "bg-white text-indigo-700" : "bg-white/20 text-indigo-100"
                }`}>
                  {step > s ? <Check size={12} /> : <span>{s}</span>}
                  {s === 1 ? "Personal Info" : form.role === "student" ? "Enroll Courses" : "Select Courses"}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">I am registering as</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["student", "lecturer", "admin"] as const).map(role => (
                    <button key={role} type="button"
                      onClick={() => { setForm(prev => ({ ...prev, role })); setSelectedCourses([]); setError(""); }}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                        form.role === role
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600"
                      }`}>{role}</button>
                  ))}
                </div>
              </div>

              <Field label="Full Name *"  name="name"  value={form.name}  onChange={handleChange} placeholder="e.g. Alice Mokoena" />
              <Field label="Email *"      name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
              <Field label="Phone"        name="phone" value={form.phone} onChange={handleChange} placeholder="+266 5000 0000" />

              {form.role === "student" && (
                <>
                  <Field label="Student ID * (sXXXXXXXXX)" name="studentId" value={form.studentId} onChange={handleChange} placeholder="s202312345" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Programme *</label>
                    <select name="programmeId" value={form.programmeId} onChange={handleChange} className={selectCls}>
                      <option value="" className="bg-white dark:bg-slate-900">-- Select programme --</option>
                      {programmes.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>)}
                    </select>
                    {studentDepartment && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Department: <strong>{studentDepartment.name}</strong></p>
                    )}
                    {selectedProgramme && selectedProgramme.departmentIds.length > 1 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        This programme spans multiple departments.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Year of Study *</label>
                    <select name="yearOfStudy" value={form.yearOfStudy} onChange={handleChange} className={selectCls}>
                      {[1, 2, 3, 4].map(y => <option key={y} value={y} className="bg-white dark:bg-slate-900">Year {y}</option>)}
                    </select>
                  </div>
                </>
              )}

              {form.role === "lecturer" && (
                <>
                  <Field label="Staff ID * (eXXXXXXXXX)" name="staffId" value={form.staffId} onChange={handleChange} placeholder="e100000001" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Department *</label>
                    <select name="departmentId" value={form.departmentId} onChange={handleChange} className={selectCls}>
                      <option value="" className="bg-white dark:bg-slate-900">-- Select department --</option>
                      {departments.filter(d => d.id !== "d4").map(d => <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900">{d.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {form.role === "admin" && (
                <>
                  <Field label="Staff ID *" name="staffId" value={form.staffId} onChange={handleChange} placeholder="ADM002" />
                  <Field label="Admin Registration Code *" name="adminCode" value={form.adminCode} onChange={handleChange} placeholder="Provided by IT department" />
                  <p className="text-xs text-gray-400 dark:text-slate-500">Contact IT for the admin registration code.</p>
                </>
              )}

              <PasswordField label="Password *" name="password" value={form.password} onChange={handleChange}
                placeholder="At least 6 characters" />
              <PasswordField label="Confirm Password *" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                placeholder="Repeat your password" />
              <button onClick={handleStep1}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors">
                {form.role === "admin" ? "Register as Admin" : "Next: Select Courses →"}
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white mb-1">
                  {form.role === "student" ? "Enroll in Courses" : "Select Courses to Teach"}
                </h2>
                {form.role === "student" && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Showing <strong className="text-gray-700 dark:text-slate-200">{studentDepartment?.name}</strong> · <strong className="text-gray-700 dark:text-slate-200">Year {form.yearOfStudy}</strong> courses
                  </p>
                )}
                {form.role === "lecturer" && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    Max 4 courses total · Max 2 per year · {selectedCourses.length}/4 selected
                  </div>
                )}
              </div>

              {availableCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">No courses found. Contact admin.</div>
              ) : form.role === "student" ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableCourses.map(course => {
                    const sel = selectedCourses.includes(course.id);
                    return (
                      <button key={course.id} type="button" onClick={() => toggleCourse(course.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          sel
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                            : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800/40"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{course.name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{course.code} · {course.credits} credits</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? "border-indigo-500 bg-indigo-500" : "border-gray-300 dark:border-slate-600"}`}>
                            {sel && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {Object.keys(coursesByYear).sort().map(yearKey => {
                    const year = Number(yearKey);
                    const yearCourses = coursesByYear[year];
                    const yearSelected = selectedCourses.filter(id => courses.find(c => c.id === id)?.year === year).length;
                    return (
                      <div key={year}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Year {year}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            yearSelected >= 2
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                              : "bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600/30"
                          }`}>
                            {yearSelected}/2
                          </span>
                        </div>
                        <div className="space-y-2">
                          {yearCourses.map(course => {
                            const sel = selectedCourses.includes(course.id);
                            const wouldExceed = !sel && getLecturerError(selectedCourses, course.id) !== null;
                            return (
                              <button key={course.id} type="button"
                                onClick={() => toggleCourse(course.id)} disabled={wouldExceed}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                                  sel
                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                                    : wouldExceed
                                    ? "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 opacity-50 cursor-not-allowed"
                                    : "border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 bg-white dark:bg-slate-800/40"
                                }`}>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{course.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">{course.code} · {course.credits} credits</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? "border-indigo-500 bg-indigo-500" : "border-gray-300 dark:border-slate-600"}`}>
                                  {sel && <Check size={12} className="text-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedCourses.length > 0 && (
                <p className="text-xs font-medium" style={{ color: 'var(--theme-primary, #4f46e5)' }}>
                  {selectedCourses.length} course{selectedCourses.length !== 1 ? "s" : ""} selected
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  ← Back
                </button>
                <button onClick={handleRegister} disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Registering...</>
                    : <><UserPlus size={16} /> Register</>}
                </button>
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = "text" }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
    </div>
  );
}

function PasswordField({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      <PasswordInput
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}