// src/routes/courses.ts
import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// ── GET /api/courses ─────────────────────────────── all roles
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: { department: true },
      orderBy: [{ departmentId: "asc" }, { year: "asc" }],
    });
    res.json(courses.map(formatCourse));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/courses ────────────────────────────── admin only
router.post("/", adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, code, description, departmentId, year, credits, maxEnrollment } = req.body;
  if (!name || !code) { res.status(400).json({ error: "Name and code are required" }); return; }
  try {
    const course = await prisma.course.create({
      data: { name, code: code.toUpperCase(), description, departmentId, year: Number(year), credits: Number(credits), maxEnrollment: Number(maxEnrollment) },
      include: { department: true },
    });
    res.status(201).json(formatCourse(course));
  } catch (e) {
    res.status(500).json({ error: "Course code may already exist" });
  }
});

// ── PUT /api/courses/:id ─────────────────────────── admin only
router.put("/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, code, description, departmentId, year, credits, maxEnrollment } = req.body;
  try {
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...(name         && { name }),
        ...(code         && { code: code.toUpperCase() }),
        ...(description  !== undefined && { description }),
        ...(departmentId && { departmentId }),
        ...(year         && { year: Number(year) }),
        ...(credits      && { credits: Number(credits) }),
        ...(maxEnrollment && { maxEnrollment: Number(maxEnrollment) }),
      },
      include: { department: true },
    });
    res.json(formatCourse(course));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/courses/:id ──────────────────────── admin only
router.delete("/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

function formatCourse(course: any) {
  return {
    id:           course.id,
    name:         course.name,
    code:         course.code,
    description:  course.description,
    departmentId: course.departmentId,
    department:   course.department?.name,
    year:         course.year,
    credits:      course.credits,
    maxEnrollment: course.maxEnrollment,
  };
}

export default router;
