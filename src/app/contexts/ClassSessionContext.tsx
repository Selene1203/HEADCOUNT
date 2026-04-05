/// <reference types="vite/client" />
import {
  createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode,
} from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export type SessionPhase =
  | "idle"
  | "class_started"
  | "attendance"
  | "late"
  | "ended";

export type ClassDuration = 50 | 110; // minutes

export interface ClassSession {
  id: string;
  courseId: string;
  date: string;
  code: string;
  classStartedAt: number;
  attendanceStartedAt: number | null;
  phase: SessionPhase;
  durationMinutes?: ClassDuration;
}

interface ClassSessionContextValue {
  session: ClassSession | null;
  phase: SessionPhase;
  classSecondsLeft: number;
  attendanceSecondsLeft: number;
  classDuration: ClassDuration;
  setClassDuration: (d: ClassDuration) => void;
  beginClass: (courseId: string, token: string) => Promise<void>;
  openAttendance: (token: string) => Promise<void>;
  submitCode: (code: string, studentId: string, token: string) => Promise<"present" | "late" | "invalid" | "closed">;
  endClass: (token: string) => Promise<void>;
  fetchActiveSession: (courseId: string, token: string) => Promise<void>;
  manualMark: (studentId: string, status: "present" | "late" | "absent", token: string) => Promise<void>;
}

const ATTENDANCE_WINDOW = 15 * 60;

const ClassSessionContext = createContext<ClassSessionContextValue | null>(null);

export const ClassSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]                             = useState<ClassSession | null>(null);
  const [phase, setPhase]                                 = useState<SessionPhase>("idle");
  const [classSecondsLeft, setClassSecondsLeft]           = useState(0);
  const [attendanceSecondsLeft, setAttendanceSecondsLeft] = useState(0);
  const [classDuration, setClassDuration]                 = useState<ClassDuration>(50);
  const tickRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const justEndedRef = useRef(false);

  const getDurationSeconds = useCallback((s: ClassSession) => {
    return (s.durationMinutes ?? classDuration) * 60;
  }, [classDuration]);

  const recompute = useCallback((s: ClassSession) => {
    const now          = Date.now();
    const elapsed      = Math.floor((now - s.classStartedAt) / 1000);
    const totalSeconds = getDurationSeconds(s);
    const classLeft    = Math.max(0, totalSeconds - elapsed);

    let currentPhase: SessionPhase = s.phase;
    let attLeft = 0;

    if (classLeft === 0) {
      currentPhase = "ended";
    } else if (s.attendanceStartedAt) {
      const attElapsed = Math.floor((now - s.attendanceStartedAt) / 1000);
      attLeft          = Math.max(0, ATTENDANCE_WINDOW - attElapsed);
      currentPhase     = attLeft > 0 ? "attendance" : "late";
    } else {
      currentPhase = "class_started";
    }

    setPhase(currentPhase);
    setClassSecondsLeft(classLeft);
    setAttendanceSecondsLeft(attLeft);

    return currentPhase;
  }, [getDurationSeconds]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!session || session.phase === "ended") return;

    recompute(session);
    tickRef.current = setInterval(() => {
      const p = recompute(session);
      if (p === "ended") clearInterval(tickRef.current!);
    }, 1000);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [session, recompute]);

  const beginClass = useCallback(async (courseId: string, token: string) => {
    const res = await fetch(`${API}/attendance/session/begin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId, durationMinutes: classDuration }),
    });
    if (!res.ok) throw new Error("Failed to begin class");
    const data: ClassSession = await res.json();
    justEndedRef.current = false;
    setSession({ ...data, durationMinutes: classDuration });
  }, [classDuration]);

  const openAttendance = useCallback(async (token: string) => {
    if (!session) return;
    const res = await fetch(`${API}/attendance/session/${session.id}/open`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to open attendance");
    const data: ClassSession = await res.json();
    setSession({ ...data, durationMinutes: session.durationMinutes ?? classDuration });
  }, [session, classDuration]);

  const submitCode = useCallback(async (
    code: string, studentId: string, token: string
  ): Promise<"present" | "late" | "invalid" | "closed"> => {
    const res = await fetch(`${API}/attendance/session/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, studentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return err.result ?? "invalid";
    }
    const data = await res.json();
    return data.result;
  }, []);

  const endClass = useCallback(async (token: string) => {
    if (!session) return;
    await fetch(`${API}/attendance/session/${session.id}/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    justEndedRef.current = true;
    setSession(null);
    setPhase("idle");
    setClassSecondsLeft(0);
    setAttendanceSecondsLeft(0);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [session]);

  const fetchActiveSession = useCallback(async (courseId: string, token: string) => {
    if (justEndedRef.current) return;
    const res = await fetch(`${API}/attendance/session/active?courseId=${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data: ClassSession | null = await res.json();
    if (data && data.phase !== "ended") {
      setSession(data);
      if (data.durationMinutes) setClassDuration(data.durationMinutes);
    }
  }, []);

  // Manual mark: lecturer marks a student directly
  const manualMark = useCallback(async (
    studentId: string,
    status: "present" | "late" | "absent",
    token: string
  ) => {
    if (!session) return;
    await fetch(`${API}/attendance/session/${session.id}/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ studentId, status }),
    });
  }, [session]);

  return (
    <ClassSessionContext.Provider value={{
      session, phase, classSecondsLeft, attendanceSecondsLeft,
      classDuration, setClassDuration,
      beginClass, openAttendance, submitCode, endClass, fetchActiveSession, manualMark,
    }}>
      {children}
    </ClassSessionContext.Provider>
  );
};

export const useClassSession = () => {
  const ctx = useContext(ClassSessionContext);
  if (!ctx) throw new Error("useClassSession must be used within ClassSessionProvider");
  return ctx;
};

export function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}