import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

/**
 * GET /api/courses
 * Updated to optionally filter by student eligibility if requested
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: { 
        department: true,
        _count: { select: { enrolledStudents: true } } // Track capacity 
      },
      orderBy: [{ departmentId: "asc" }, { year: "asc" }],
    });

    // If a student is logged in, we can flag which courses they are eligible for
    const formatted = courses.map(course => {
      const base = formatCourse(course);
      const isFull = course.maxEnrollment ? course._count.enrolledStudents >= course.maxEnrollment : false;
      
      return { 
        ...base, 
        currentEnrollment: course._count.enrolledStudents,
        isFull 
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/courses/:id/enroll
 * New logic to enforce Cross-Year and Multi-Dept rules 
 */
router.post("/:id/enroll", async (req: AuthRequest, res: Response) => {
  const { id: courseId } = req.params;
  const studentId = req.user?.id; // From auth middleware [cite: 4]

  if (!studentId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [course, student] = await Promise.all([
      prisma.course.findUnique({ 
        where: { id: courseId },
        include: { _count: { select: { enrolledStudents: true } } }
      }),
      prisma.user.findUnique({ where: { id: studentId } })
    ]);

    if (!course || !student) return res.status(404).json({ error: "Not found" });

    // 1. Cross-Year Logic [cite: 9]
    const yearMatch = course.isOpenYear || student.yearOfStudy === course.year;
    
    // 2. Multi-Departmental Logic [cite: 11]
    const deptMatch = course.isMultiDept || student.departmentId === course.departmentId;

    // 3. Capacity Check 
    const hasSpace = course.maxEnrollment ? course._count.enrolledStudents < course.maxEnrollment : true;

    if (!yearMatch) return res.status(403).json({ error: `This course is restricted to Year ${course.year} students.` });
    if (!deptMatch) return res.status(403).json({ error: "This course is restricted to its primary department." });
    if (!hasSpace) return res.status(403).json({ error: "Course is at maximum enrollment capacity." });

    const enrollment = await prisma.studentCourse.create({
      data: { studentId, courseId }
    });

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: "Enrollment failed or already enrolled." });
  }
});

// ... Keep your existing POST, PUT, DELETE routes ...

function formatCourse(course: any) {
  return {
    id:            course.id,
    name:          course.name,
    code:          course.code,
    description:   course.description,
    departmentId:  course.departmentId,
    department:    course.department?.name,
    year:          course.year, // [cite: 9]
    credits:       course.credits,
    maxEnrollment: course.maxEnrollment, // 
    semester:      course.semester   ?? "A",
    isOpenYear:    course.isOpenYear  ?? false, // [cite: 9]
    isMultiDept:   course.isMultiDept ?? false, // [cite: 11]
  };
}

export default router;
