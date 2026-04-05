// src/routes/users.ts
import { Router, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { authenticate, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// ── GET /api/users ─────────────── admin + lecturer (read-only for lecturer)
router.get("/", async (req: AuthRequest, res: Response) => {
  // ✅ Both admin and lecturer can fetch users
  if (req.userRole === "student") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        programme: true,
        enrolledCourses: true,
        assignedCourses: true,
      },
    });
    res.json(users.map(formatUser));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/users/:id ───────────────────── own profile or admin/lecturer
router.get("/:id", async (req: AuthRequest, res: Response) => {
  if (req.userRole === "student" && req.userId !== req.params.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { department: true, programme: true, enrolledCourses: true, assignedCourses: true },
    });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(formatUser(user));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /api/users/:id ───────────────────────────── admin only
router.put("/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, email, password, phone, studentId, staffId,
          departmentId, programmeId, yearOfStudy } = req.body;
  try {
    const data: any = { name, email, phone, studentId, staffId, departmentId, programmeId, yearOfStudy };
    if (password) data.password = await bcrypt.hash(password, 10);
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { department: true, programme: true, enrolledCourses: true, assignedCourses: true },
    });
    res.json(formatUser(user));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/users/:id ────────────────────────── admin only
router.delete("/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/users/:id/enroll ───────────────────── admin only
router.post("/:id/enroll", adminOnly, async (req: AuthRequest, res: Response) => {
  const { courseId } = req.body;
  try {
    await prisma.studentCourse.create({ data: { studentId: req.params.id, courseId } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Already enrolled or server error" });
  }
});

// ── DELETE /api/users/:id/enroll/:courseId ───────── admin only
router.delete("/:id/enroll/:courseId", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.studentCourse.delete({
      where: { studentId_courseId: { studentId: req.params.id, courseId: req.params.courseId } },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/users/:id/assign ───────────────────── admin only
router.post("/:id/assign", adminOnly, async (req: AuthRequest, res: Response) => {
  const { courseId } = req.body;
  try {
    await prisma.lecturerCourse.create({ data: { lecturerId: req.params.id, courseId } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Already assigned or server error" });
  }
});

// ── DELETE /api/users/:id/assign/:courseId ───────── admin only
router.delete("/:id/assign/:courseId", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.lecturerCourse.delete({
      where: { lecturerId_courseId: { lecturerId: req.params.id, courseId: req.params.courseId } },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

function formatUser(user: any) {
  return {
    id:              user.id,
    name:            user.name,
    email:           user.email,
    role:            user.role,
    phone:           user.phone,
    studentId:       user.studentId,
    staffId:         user.staffId,
    departmentId:    user.departmentId,
    department:      user.department?.name,
    programmeId:     user.programmeId,
    programme:       user.programme?.name,
    yearOfStudy:     user.yearOfStudy,
    enrolledCourses: user.enrolledCourses?.map((e: any) => e.courseId) ?? [],
    assignedCourses: user.assignedCourses?.map((a: any) => a.courseId) ?? [],
  };
}

export default router;