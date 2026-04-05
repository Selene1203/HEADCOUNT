// src/routes/auth.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = Router();

// ── POST /api/auth/login ─────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        department: true,
        programme: true,
        enrolledCourses: { include: { course: true } },
        assignedCourses: { include: { course: true } },
      },
    });

    if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) { res.status(401).json({ error: "Invalid email or password" }); return; }

    const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET as string,
  { expiresIn: "7d" }
);

    // Shape response to match your existing User interface in DataContext
    res.json({
      token,
      user: formatUser(user),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/auth/register ──────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, role, phone, studentId, staffId,
          departmentId, programmeId, yearOfStudy, courseIds } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Name, email, password and role are required" });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) { res.status(409).json({ error: "Email already registered" }); return; }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role,
        phone,
        studentId,
        staffId,
        departmentId,
        programmeId,
        yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
        // ✅ Atomically link courses on creation — same fix as DataContext
        ...(role === "student" && courseIds?.length > 0 && {
          enrolledCourses: {
            create: (courseIds as string[]).map(courseId => ({ courseId })),
          },
        }),
        ...(role === "lecturer" && courseIds?.length > 0 && {
          assignedCourses: {
            create: (courseIds as string[]).map(courseId => ({ courseId })),
          },
        }),
      },
      include: {
        department: true,
        programme: true,
        enrolledCourses: { include: { course: true } },
        assignedCourses: { include: { course: true } },
      },
    });

    const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET as string,
  { expiresIn: "7d" }
);

    res.status(201).json({ token, user: formatUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Helper: shape DB user to match your frontend User interface ──
function formatUser(user: any) {
  return {
    id:             user.id,
    name:           user.name,
    email:          user.email,
    role:           user.role,
    phone:          user.phone,
    studentId:      user.studentId,
    staffId:        user.staffId,
    departmentId:   user.departmentId,
    department:     user.department?.name,
    programmeId:    user.programmeId,
    programme:      user.programme?.name,
    yearOfStudy:    user.yearOfStudy,
    enrolledCourses: user.enrolledCourses?.map((e: any) => e.courseId) ?? [],
    assignedCourses: user.assignedCourses?.map((a: any) => a.courseId) ?? [],
  };
}

export default router;
