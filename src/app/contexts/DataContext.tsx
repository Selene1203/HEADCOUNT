import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
export type Role = "admin" | "lecturer" | "student";

export interface Department {
  id: string;
  name: string;
}

export interface Programme {
  id: string;
  name: string;
  departmentIds: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  studentId?: string;
  staffId?: string;
  department?: string;
  departmentId?: string;
  programme?: string;
  programmeId?: string;
  yearOfStudy?: number;
  phone?: string;
  enrolledCourses?: string[];
  assignedCourses?: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  department?: string;
  departmentId?: string;
  year?: number;
  credits?: number;
  lecturerId?: string;
  maxEnrollment?: number;
  semester?: "A" | "B";
  isOpenYear?: boolean;
  isMultiDept?: boolean;
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  studentId: string;
  date: string;
  status: "present" | "absent" | "late";
  markedBy: string;
}

interface DataContextValue {
  users: User[];
  courses: Course[];
  attendance: AttendanceRecord[];
  departments: Department[];
  programmes: Programme[];
  loading: boolean;
  activeSemester: "A" | "B";
  setActiveSemester: (s: "A" | "B") => Promise<void>;
  addUser: (user: Omit<User, "id">, courseIds?: string[]) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getCoursesByDepartmentAndYear: (departmentId: string, year: number) => Course[];
  enrollStudentInCourse: (studentId: string, courseId: string) => Promise<boolean>;
  unenrollStudentFromCourse: (studentId: string, courseId: string) => Promise<void>;
  assignLecturerToCourse: (lecturerId: string, courseId: string) => Promise<boolean>;
  unassignLecturerFromCourse: (lecturerId: string, courseId: string) => Promise<void>;
  addCourse: (course: Omit<Course, "id">) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addDepartment: (name: string) => Promise<Department>;
  updateDepartment: (id: string, name: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addProgramme: (name: string, departmentIds: string[]) => Promise<Programme>;
  updateProgramme: (id: string, name: string, departmentIds: string[]) => Promise<void>;
  deleteProgramme: (id: string) => Promise<void>;
  addAttendance: (record: Omit<AttendanceRecord, "id">) => Promise<void>;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  getStudentAttendance: (studentUserId: string) => AttendanceRecord[];
  getCourseAttendance: (courseId: string) => AttendanceRecord[];
  getAttendanceSummary: (studentUserId: string) => {
    courseId: string; courseName: string; total: number;
    present: number; absent: number; late: number; percentage: number;
  }[];
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, user: authUser, updateCurrentUser } = useAuth();

  const [users, setUsers]                        = useState<User[]>([]);
  const [courses, setCourses]                    = useState<Course[]>([]);
  const [attendance, setAttendance]              = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments]            = useState<Department[]>([]);
  const [programmes, setProgrammes]              = useState<Programme[]>([]);
  const [loading, setLoading]                    = useState(true);
  const [activeSemester, setActiveSemesterState] = useState<"A" | "B">("A");

  const publicFetch = useCallback(async (path: string) => {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }, []);

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error ?? "Request failed");
    }
    return res.json();
  }, [token]);

  const writeLog = useCallback(async (
    category: string,
    action: string,
    detail: string,
    severity: "info" | "warning" | "error" = "info"
  ) => {
    if (!token || !authUser) return;
    try {
      await fetch(`${API}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          action,
          detail,
          severity,
          performedBy: authUser.id,
          performedByName: authUser.name,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch { /* silently fail */ }
  }, [token, authUser]);

  // Load public data on mount
  useEffect(() => {
    const loadPublic = async () => {
      try {
        const [d, p, c] = await Promise.all([
          publicFetch("/departments/public"),
          publicFetch("/programmes/public"),
          publicFetch("/courses/public"),
        ]);
        setDepartments(d);
        setProgrammes(normaliseProgrammes(p));
        setCourses(c);
      } catch (e) {
        console.error("Failed to load public data:", e);
      } finally {
        setLoading(false);
      }
    };
    loadPublic();
  }, []);

  // Load protected data after login
  useEffect(() => {
    if (!token || !authUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const [c, d, p, sem] = await Promise.all([
          apiFetch("/courses"),
          apiFetch("/departments"),
          apiFetch("/programmes"),
          apiFetch("/settings/semester"),
        ]);
        setCourses(c);
        setDepartments(d);
        setProgrammes(normaliseProgrammes(p));
        setActiveSemesterState(sem.semester ?? "A");

        if (authUser.role === "admin" || authUser.role === "lecturer") {
          const [u, a] = await Promise.all([
            apiFetch("/users"),
            apiFetch("/attendance/all"),
          ]);
          setUsers(u);
          setAttendance(a);
        } else if (authUser.role === "student") {
          const a = await apiFetch(`/attendance/student/${authUser.id}`);
          setAttendance(a);
          setUsers([authUser as User]);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, authUser?.id]);

  // ── Semester ──────────────────────────────────────────────────

  const setActiveSemester = useCallback(async (semester: "A" | "B") => {
    await apiFetch("/settings/semester", {
      method: "PUT",
      body: JSON.stringify({ semester }),
    });
    setActiveSemesterState(semester);
    await writeLog("user_management", "Semester Changed", `Active semester set to ${semester}`, "info");
  }, [apiFetch, writeLog]);

  // ── Users ─────────────────────────────────────────────────────

  const addUser = useCallback(async (userData: Omit<User, "id">, courseIds?: string[]): Promise<User> => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...userData, courseIds }),
    });
    const newUser: User = data.user;
    setUsers(prev => [...prev, newUser]);
    if (userData.role === "lecturer" && courseIds?.length) {
      setCourses(prev => prev.map(c =>
        courseIds.includes(c.id) ? { ...c, lecturerId: newUser.id } : c
      ));
    }
    await writeLog("user_management", "User Created", `${userData.role} account created for ${userData.name}`, "info");
    return newUser;
  }, [apiFetch, writeLog]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const updated = await apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    if (authUser?.id === id) updateCurrentUser(updates);
    await writeLog("user_management", "User Updated", `User ${updated.name} profile updated`, "info");
  }, [apiFetch, authUser, updateCurrentUser, writeLog]);

  const deleteUser = useCallback(async (id: string) => {
    const target = users.find(u => u.id === id);
    await apiFetch(`/users/${id}`, { method: "DELETE" });
    setUsers(prev => prev.filter(u => u.id !== id));
    await writeLog("user_management", "User Deleted", `User ${target?.name ?? id} was deleted`, "warning");
  }, [apiFetch, users, writeLog]);

  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

  const getCoursesByDepartmentAndYear = useCallback(
    (departmentId: string, year: number) =>
      courses.filter(c => c.departmentId === departmentId && c.year === year),
    [courses]
  );

  // ── Enrollment ────────────────────────────────────────────────

  const enrollStudentInCourse = useCallback(async (studentId: string, courseId: string): Promise<boolean> => {
    try {
      await apiFetch(`/users/${studentId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      setUsers(prev => prev.map(u =>
        u.id === studentId
          ? { ...u, enrolledCourses: [...(u.enrolledCourses ?? []), courseId] }
          : u
      ));
      if (authUser?.id === studentId) {
        updateCurrentUser({ enrolledCourses: [...(authUser.enrolledCourses ?? []), courseId] });
      }
      const student = users.find(u => u.id === studentId);
      const course  = courses.find(c => c.id === courseId);
      await writeLog("student_status", "Course Enrolled", `${student?.name ?? studentId} enrolled in ${course?.name ?? courseId}`, "info");
      return true;
    } catch { return false; }
  }, [apiFetch, authUser, updateCurrentUser, users, courses, writeLog]);

  const unenrollStudentFromCourse = useCallback(async (studentId: string, courseId: string) => {
    await apiFetch(`/users/${studentId}/enroll/${courseId}`, { method: "DELETE" });
    setUsers(prev => prev.map(u =>
      u.id === studentId
        ? { ...u, enrolledCourses: (u.enrolledCourses ?? []).filter(id => id !== courseId) }
        : u
    ));
    if (authUser?.id === studentId) {
      updateCurrentUser({ enrolledCourses: (authUser.enrolledCourses ?? []).filter(id => id !== courseId) });
    }
    const student = users.find(u => u.id === studentId);
    const course  = courses.find(c => c.id === courseId);
    await writeLog("student_status", "Course Unenrolled", `${student?.name ?? studentId} unenrolled from ${course?.name ?? courseId}`, "warning");
  }, [apiFetch, authUser, updateCurrentUser, users, courses, writeLog]);

  const assignLecturerToCourse = useCallback(async (lecturerId: string, courseId: string): Promise<boolean> => {
    try {
      await apiFetch(`/users/${lecturerId}/assign`, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      setUsers(prev => prev.map(u =>
        u.id === lecturerId
          ? { ...u, assignedCourses: [...new Set([...(u.assignedCourses ?? []), courseId])] }
          : u
      ));
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, lecturerId } : c));
      if (authUser?.id === lecturerId) {
        updateCurrentUser({ assignedCourses: [...new Set([...(authUser.assignedCourses ?? []), courseId])] });
      }
      const lecturer = users.find(u => u.id === lecturerId);
      const course   = courses.find(c => c.id === courseId);
      await writeLog("user_management", "Lecturer Assigned", `${lecturer?.name ?? lecturerId} assigned to ${course?.name ?? courseId}`, "info");
      return true;
    } catch { return false; }
  }, [apiFetch, authUser, updateCurrentUser, users, courses, writeLog]);

  const unassignLecturerFromCourse = useCallback(async (lecturerId: string, courseId: string) => {
    await apiFetch(`/users/${lecturerId}/assign/${courseId}`, { method: "DELETE" });
    setUsers(prev => prev.map(u =>
      u.id === lecturerId
        ? { ...u, assignedCourses: (u.assignedCourses ?? []).filter(id => id !== courseId) }
        : u
    ));
    setCourses(prev => prev.map(c =>
      c.id === courseId ? { ...c, lecturerId: undefined } : c
    ));
    if (authUser?.id === lecturerId) {
      updateCurrentUser({ assignedCourses: (authUser.assignedCourses ?? []).filter(id => id !== courseId) });
    }
    const lecturer = users.find(u => u.id === lecturerId);
    const course   = courses.find(c => c.id === courseId);
    await writeLog("user_management", "Lecturer Unassigned", `${lecturer?.name ?? lecturerId} unassigned from ${course?.name ?? courseId}`, "warning");
  }, [apiFetch, authUser, updateCurrentUser, users, courses, writeLog]);

  // ── Courses ───────────────────────────────────────────────────

  const addCourse = useCallback(async (courseData: Omit<Course, "id">): Promise<Course> => {
    const course = await apiFetch("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
    setCourses(prev => [...prev, course]);
    await writeLog("user_management", "Course Created", `Course ${courseData.name} (${courseData.code}) created`, "info");
    return course;
  }, [apiFetch, writeLog]);

  const updateCourse = useCallback(async (id: string, updates: Partial<Course>) => {
    const updated = await apiFetch(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setCourses(prev => prev.map(c => c.id === id ? updated : c));
    await writeLog("user_management", "Course Updated", `Course ${updated.name} was updated`, "info");
  }, [apiFetch, writeLog]);

  const deleteCourse = useCallback(async (id: string) => {
    const target = courses.find(c => c.id === id);
    await apiFetch(`/courses/${id}`, { method: "DELETE" });
    setCourses(prev => prev.filter(c => c.id !== id));
    await writeLog("user_management", "Course Deleted", `Course ${target?.name ?? id} was deleted`, "warning");
  }, [apiFetch, courses, writeLog]);

  // ── Departments ───────────────────────────────────────────────

  const addDepartment = useCallback(async (name: string): Promise<Department> => {
    const dept = await apiFetch("/departments", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setDepartments(prev => [...prev, dept]);
    await writeLog("user_management", "Department Created", `Department ${name} created`, "info");
    return dept;
  }, [apiFetch, writeLog]);

  const updateDepartment = useCallback(async (id: string, name: string) => {
    const updated = await apiFetch(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    setDepartments(prev => prev.map(d => d.id === id ? updated : d));
    await writeLog("user_management", "Department Updated", `Department updated to ${name}`, "info");
  }, [apiFetch, writeLog]);

  const deleteDepartment = useCallback(async (id: string) => {
    const target = departments.find(d => d.id === id);
    await apiFetch(`/departments/${id}`, { method: "DELETE" });
    setDepartments(prev => prev.filter(d => d.id !== id));
    await writeLog("user_management", "Department Deleted", `Department ${target?.name ?? id} deleted`, "warning");
  }, [apiFetch, departments, writeLog]);

  // ── Programmes ────────────────────────────────────────────────

  const addProgramme = useCallback(async (name: string, departmentIds: string[]): Promise<Programme> => {
    const prog = await apiFetch("/programmes", {
      method: "POST",
      body: JSON.stringify({ name, departmentIds }),
    });
    setProgrammes(prev => [...prev, normaliseProgramme(prog)]);
    await writeLog("user_management", "Programme Created", `Programme ${name} created`, "info");
    return normaliseProgramme(prog);
  }, [apiFetch, writeLog]);

  const updateProgramme = useCallback(async (id: string, name: string, departmentIds: string[]) => {
    const updated = await apiFetch(`/programmes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, departmentIds }),
    });
    setProgrammes(prev => prev.map(p => p.id === id ? normaliseProgramme(updated) : p));
    await writeLog("user_management", "Programme Updated", `Programme updated to ${name}`, "info");
  }, [apiFetch, writeLog]);

  const deleteProgramme = useCallback(async (id: string) => {
    const target = programmes.find(p => p.id === id);
    await apiFetch(`/programmes/${id}`, { method: "DELETE" });
    setProgrammes(prev => prev.filter(p => p.id !== id));
    await writeLog("user_management", "Programme Deleted", `Programme ${target?.name ?? id} deleted`, "warning");
  }, [apiFetch, programmes, writeLog]);

  // ── Attendance ────────────────────────────────────────────────

  const addAttendance = useCallback(async (record: Omit<AttendanceRecord, "id">) => {
    const created = await apiFetch("/attendance", {
      method: "POST",
      body: JSON.stringify(record),
    });
    setAttendance(prev => [...prev, created]);
    const course = courses.find(c => c.id === record.courseId);
    await writeLog("attendance", "Attendance Marked", `Attendance marked for ${course?.name ?? record.courseId} on ${record.date}`, "info");
  }, [apiFetch, courses, writeLog]);

  const updateAttendance = useCallback(async (id: string, updates: Partial<AttendanceRecord>) => {
    const updated = await apiFetch(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setAttendance(prev => prev.map(a => a.id === id ? updated : a));
    await writeLog("attendance", "Attendance Updated", `Attendance record ${id} updated`, "info");
  }, [apiFetch, writeLog]);

  const getStudentAttendance = useCallback(
    (studentUserId: string) => attendance.filter(a => a.studentId === studentUserId),
    [attendance]
  );

  const getCourseAttendance = useCallback(
    (courseId: string) => attendance.filter(a => a.courseId === courseId),
    [attendance]
  );

  const getAttendanceSummary = useCallback((studentUserId: string) => {
    const student = users.find(u => u.id === studentUserId);
    return (student?.enrolledCourses ?? []).map(courseId => {
      const course     = courses.find(c => c.id === courseId);
      const records    = attendance.filter(a => a.studentId === studentUserId && a.courseId === courseId);
      const present    = records.filter(r => r.status === "present").length;
      const absent     = records.filter(r => r.status === "absent").length;
      const late       = records.filter(r => r.status === "late").length;
      const total      = records.length;
      const percentage = total > 0
        ? Math.round(((present + (late * 0.5)) / total) * 100)
        : 0;
      return { courseId, courseName: course?.name ?? courseId, total, present, absent, late, percentage };
    });
  }, [users, courses, attendance]);

  return (
    <DataContext.Provider value={{
      users, courses, attendance, departments, programmes, loading,
      activeSemester, setActiveSemester,
      addUser, updateUser, deleteUser, getUserById,
      getCoursesByDepartmentAndYear,
      enrollStudentInCourse, unenrollStudentFromCourse,
      assignLecturerToCourse, unassignLecturerFromCourse,
      addCourse, updateCourse, deleteCourse,
      addDepartment, updateDepartment, deleteDepartment,
      addProgramme, updateProgramme, deleteProgramme,
      addAttendance, updateAttendance,
      getStudentAttendance, getCourseAttendance, getAttendanceSummary,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextValue => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};

function normaliseProgramme(p: any): Programme {
  return {
    id:            p.id,
    name:          p.name,
    departmentIds: Array.isArray(p.departmentIds)
      ? p.departmentIds
      : p.departmentId ? [p.departmentId] : [],
  };
}

function normaliseProgrammes(list: any[]): Programme[] {
  return list.map(normaliseProgramme);
}
