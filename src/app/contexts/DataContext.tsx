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
  role: Role;
  studentId?: string;
  staffId?: string;
  departmentId?: string;
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
  departmentId?: string;
  year?: number;
  maxEnrollment?: number;
  semester?: "A" | "B";
  isMultiDept?: boolean;
}

interface DataContextValue {
  users: User[];
  courses: Course[];
  departments: Department[];
  programmes: Programme[];
  loading: boolean;
  enrollStudentInCourse: (studentId: string, courseId: string) => Promise<boolean>;
  unenrollStudentFromCourse: (studentId: string, courseId: string) => Promise<void>;
  addUser: (user: Omit<User, "id" | "email" | "role"> & { email: string; role: string; password?: string }, courseIds?: string[]) => Promise<User>;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, user: authUser, updateCurrentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [d, p, c] = await Promise.all([
          apiFetch("/departments"),
          apiFetch("/programmes"),
          apiFetch("/courses"),
        ]);
        setDepartments(d);
        setProgrammes(p.map((prog: any) => ({
          ...prog,
          departmentIds: prog.departments?.map((d: any) => d.departmentId) || [prog.departmentId]
        })));
        setCourses(c);
        
        if (token && (authUser?.role === "admin" || authUser?.role === "lecturer")) {
          const u = await apiFetch("/users");
          setUsers(u);
        }
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, authUser?.id, apiFetch]);

  const enrollStudentInCourse = useCallback(async (studentId: string, courseId: string) => {
    try {
      await apiFetch(`/users/${studentId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });

      setUsers(prev => prev.map(u => u.id === studentId 
        ? { ...u, enrolledCourses: [...new Set([...(u.enrolledCourses || []), courseId])] } 
        : u
      ));

      if (authUser?.id === studentId) {
        updateCurrentUser({ enrolledCourses: [...new Set([...(authUser.enrolledCourses || []), courseId])] });
      }
      return true;
    } catch { return false; }
  }, [apiFetch, authUser, updateCurrentUser]);

  const unenrollStudentFromCourse = useCallback(async (studentId: string, courseId: string) => {
    try {
      await apiFetch(`/users/${studentId}/enroll/${courseId}`, { method: "DELETE" });
      setUsers(prev => prev.map(u => u.id === studentId 
        ? { ...u, enrolledCourses: (u.enrolledCourses || []).filter(id => id !== courseId) } 
        : u
      ));
      if (authUser?.id === studentId) {
        updateCurrentUser({ enrolledCourses: (authUser.enrolledCourses || []).filter(id => id !== courseId) });
      }
    } catch (e) { console.error(e); }
  }, [apiFetch, authUser, updateCurrentUser]);

  const addUser = useCallback(async (userData: any, courseIds?: string[]) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...userData, courseIds }),
    });
    setUsers(prev => [...prev, data.user]);
    return data.user;
  }, [apiFetch]);

  return (
    <DataContext.Provider value={{ 
      users, courses, departments, programmes, loading, 
      enrollStudentInCourse, unenrollStudentFromCourse, addUser 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
