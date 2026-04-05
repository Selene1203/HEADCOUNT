// src/routes/attendanceSession.ts
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionPhase = "class_started" | "attendance" | "late" | "ended";

interface ClassSession {
  id: string;
  courseId: string;
  date: string;                     // YYYY-MM-DD
  code: string;
  classStartedAt: number;           // epoch ms
  attendanceStartedAt: number | null;
  phase: SessionPhase;
}

// ─── In-memory session store ──────────────────────────────────────────────────
// Sessions live in memory (survive until server restart).
// Each course can only have one active session per day.

const sessions = new Map<string, ClassSession>();

const CLASS_MS = 50 * 60 * 1000; // 50 minutes
const ATT_MS   = 15 * 60 * 1000; // 15 minutes

const todayStr = () => new Date().toISOString().split("T")[0];

const makeCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Recompute phase based on timestamps (called before every response)
function syncPhase(s: ClassSession): ClassSession {
  // Don't overwrite a manually ended session
  if (s.phase === "ended") return s;
  
  const now = Date.now();
  if (now - s.classStartedAt >= CLASS_MS) {
    s.phase = "ended";
    return s;
  }
  if (s.attendanceStartedAt) {
    const attElapsed = now - s.attendanceStartedAt;
    s.phase = attElapsed < ATT_MS ? "attendance" : "late";
  }
  return s;
}
// Find the active session for a course today
function getActiveSession(courseId: string): ClassSession | null {
  for (const s of sessions.values()) {
    if (s.courseId === courseId && s.date === todayStr()) {
      syncPhase(s);
      if (s.phase !== "ended") return s;
    }
  }
  return null;
}

// Background ticker — syncs phases every 5 s so late/ended transitions happen
// even if no request comes in
setInterval(() => {
  for (const s of sessions.values()) syncPhase(s);
}, 5_000);

// ─── POST /api/attendance/session/begin ──────────────────────────────────────
// Lecturer begins a 50-minute class. Returns existing session if already started.
router.post("/begin", async (req: AuthRequest, res: Response) => {
  if (req.userRole === "student") { res.status(403).json({ error: "Forbidden" }); return; }

  const { courseId } = req.body as { courseId?: string };
  if (!courseId) { res.status(400).json({ error: "courseId is required" }); return; }

  try {
    // Return existing active session if there is one
    const existing = getActiveSession(courseId);
    if (existing) { res.json(existing); return; }

    const session: ClassSession = {
      id:                  uuidv4(),
      courseId,
      date:                todayStr(),
      code:                makeCode(),
      classStartedAt:      Date.now(),
      attendanceStartedAt: null,
      phase:               "class_started",
    };

    sessions.set(session.id, session);
    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/attendance/session/:id/open ───────────────────────────────────
// Lecturer opens the attendance window. Generates a fresh code + starts 15-min timer.
router.post("/:id/open", async (req: AuthRequest, res: Response) => {
  if (req.userRole === "student") { res.status(403).json({ error: "Forbidden" }); return; }

  const session = sessions.get(req.params.id);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  syncPhase(session);

  if (session.phase === "ended") { res.status(400).json({ error: "Class has ended" }); return; }

  // Already open — just return current state
  if (session.phase === "attendance" || session.phase === "late") {
    res.json(session); return;
  }

  session.attendanceStartedAt = Date.now();
  session.code                = makeCode(); // Fresh code every time
  session.phase               = "attendance";

  res.json(session);
});

// ─── POST /api/attendance/session/submit ─────────────────────────────────────
// Student submits a code. Saves attendance to DB as present or late.
router.post("/submit", async (req: AuthRequest, res: Response) => {
  const { code, studentId } = req.body as { code?: string; studentId?: string };
  if (!code || !studentId) {
    res.status(400).json({ error: "code and studentId are required" }); return;
  }

  // Find a session matching this code that is still open
  let matched: ClassSession | null = null;
  for (const s of sessions.values()) {
    syncPhase(s);
    if (
      s.code === code.toUpperCase() &&
      (s.phase === "attendance" || s.phase === "late")
    ) {
      matched = s;
      break;
    }
  }

  if (!matched) { res.status(400).json({ result: "invalid" }); return; }

  syncPhase(matched);
  if (matched.phase === "ended") { res.status(400).json({ result: "closed" }); return; }

  // Determine present vs late server-side
  const now        = Date.now();
  const attElapsed = matched.attendanceStartedAt
    ? now - matched.attendanceStartedAt
    : Infinity;
  const status = attElapsed <= ATT_MS ? "present" : "late";
  const dateStr = todayStr();

  try {
    // Check if already marked today for this course
    const existing = await prisma.attendanceRecord.findFirst({
      where: { courseId: matched.courseId, studentId, date: new Date(dateStr) },
    });

    if (existing) {
      // Don't downgrade present → late
      if (existing.status === "present") { res.json({ result: "present" }); return; }
      await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data:  { status },
      });
    } else {
      await prisma.attendanceRecord.create({
        data: {
          id:         uuidv4(),
          courseId:   matched.courseId,
          studentId,
          date:       new Date(dateStr),
          status,
          markedById: studentId,
        },
      });
    }

    res.json({ result: status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/attendance/session/:id/end ────────────────────────────────────
// Lecturer ends the class early.
router.post("/:id/end", (req: AuthRequest, res: Response) => {
  if (req.userRole === "student") { res.status(403).json({ error: "Forbidden" }); return; }

  const session = sessions.get(req.params.id);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  session.phase = "ended";
  res.json({ ok: true });
});

// ─── GET /api/attendance/session/active?courseId=xxx ─────────────────────────
// Lecturer or student polls for an active session for a course.
router.get("/active", (req: AuthRequest, res: Response) => {
  const { courseId } = req.query as { courseId?: string };
  if (!courseId) { res.status(400).json({ error: "courseId is required" }); return; }

  const session = getActiveSession(courseId);
  res.json(session ?? null);
});

export default router;
