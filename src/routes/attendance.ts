// src/routes/attendance.ts
import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// ✅ GET /api/attendance/all — returns all attendance in one request (admin + lecturer)
router.get("/all", async (req: AuthRequest, res: Response) => {
  if (req.userRole === "student") { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const records = await prisma.attendanceRecord.findMany({
      orderBy: { date: "desc" },
    });
    res.json(records.map(formatRecord));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/attendance/course/:courseId ────── lecturer + admin
router.get("/course/:courseId", async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { courseId: req.params.courseId },
      include: { student: true },
      orderBy: { date: "desc" },
    });
    res.json(records.map(formatRecord));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/attendance/student/:studentId ─── student + admin
router.get("/student/:studentId", async (req: AuthRequest, res: Response) => {
  if (req.userRole === "student" && req.userId !== req.params.studentId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: req.params.studentId },
      include: { course: true },
      orderBy: { date: "desc" },
    });
    res.json(records.map(formatRecord));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/attendance ─────────────────────── lecturer + admin
router.post("/", async (req: AuthRequest, res: Response) => {
  if (req.userRole === "student") { res.status(403).json({ error: "Forbidden" }); return; }
  const { courseId, studentId, date, status } = req.body;
  if (!courseId || !studentId || !date || !status) {
    res.status(400).json({ error: "courseId, studentId, date and status are required" }); return;
  }
  try {
    const record = await prisma.attendanceRecord.create({
      data: {
        courseId,
        studentId,
        date: new Date(date),
        status,
        markedById: req.userId!,
      },
    });
    res.status(201).json(formatRecord(record));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /api/attendance/:id ──────────────────── lecturer + admin
router.put("/:id", async (req: AuthRequest, res: Response) => {
  if (req.userRole === "student") { res.status(403).json({ error: "Forbidden" }); return; }
  const { status, date } = req.body;
  try {
    const record = await prisma.attendanceRecord.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(date   && { date: new Date(date) }),
      },
    });
    res.json(formatRecord(record));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

function formatRecord(record: any) {
  return {
    id:        record.id,
    courseId:  record.courseId,
    studentId: record.studentId,
    date:      record.date?.toISOString().split("T")[0],
    status:    record.status,
    markedBy:  record.markedById,
  };
}

export default router;