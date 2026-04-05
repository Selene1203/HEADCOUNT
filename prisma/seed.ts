import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Departments ──────────────────────────────────────────────
  const [d1, d2, d3, d4] = await Promise.all([
    prisma.department.upsert({ where: { name: "Computer Science" }, update: {}, create: { id: "d1", name: "Computer Science" } }),
    prisma.department.upsert({ where: { name: "Mathematics" },      update: {}, create: { id: "d2", name: "Mathematics" } }),
    prisma.department.upsert({ where: { name: "Physics" },          update: {}, create: { id: "d3", name: "Physics" } }),
    prisma.department.upsert({ where: { name: "Administration" },   update: {}, create: { id: "d4", name: "Administration" } }),
  ]);
  console.log("✅ Departments seeded");

  // ── Programmes ───────────────────────────────────────────────
  // Create programmes without a departmentId — departments are linked via join table
  const [p1, p2, p3, p4, p5, p6] = await Promise.all([
    prisma.programme.upsert({ where: { name: "BSc Computer Science" },       update: {}, create: { id: "p1", name: "BSc Computer Science" } }),
    prisma.programme.upsert({ where: { name: "BSc Information Technology" }, update: {}, create: { id: "p2", name: "BSc Information Technology" } }),
    prisma.programme.upsert({ where: { name: "BSc Mathematics" },            update: {}, create: { id: "p3", name: "BSc Mathematics" } }),
    prisma.programme.upsert({ where: { name: "BSc Applied Mathematics" },    update: {}, create: { id: "p4", name: "BSc Applied Mathematics" } }),
    prisma.programme.upsert({ where: { name: "BSc Physics" },                update: {}, create: { id: "p5", name: "BSc Physics" } }),
    // ✅ Example of a multi-department programme
    prisma.programme.upsert({ where: { name: "BSc Mathematical Physics" },   update: {}, create: { id: "p6", name: "BSc Mathematical Physics" } }),
  ]);
  console.log("✅ Programmes seeded");

  // ── Programme ↔ Department links ─────────────────────────────
  const links = [
    { programmeId: p1.id, departmentId: d1.id }, // BSc CS → Computer Science
    { programmeId: p2.id, departmentId: d1.id }, // BSc IT → Computer Science
    { programmeId: p3.id, departmentId: d2.id }, // BSc Maths → Mathematics
    { programmeId: p4.id, departmentId: d2.id }, // BSc Applied Maths → Mathematics
    { programmeId: p5.id, departmentId: d3.id }, // BSc Physics → Physics
    // ✅ BSc Mathematical Physics appears in BOTH Mathematics AND Physics
    { programmeId: p6.id, departmentId: d2.id },
    { programmeId: p6.id, departmentId: d3.id },
  ];

  for (const link of links) {
    await prisma.programmeDepartment.upsert({
      where: { programmeId_departmentId: { programmeId: link.programmeId, departmentId: link.departmentId } },
      update: {},
      create: link,
    });
  }
  console.log("✅ Programme-Department links seeded");

  // ── Courses ──────────────────────────────────────────────────
  const courses = await Promise.all([
    prisma.course.upsert({ where: { code: "CS1001" }, update: {}, create: { id: "c1", name: "Introduction to Computer Science", code: "CS1001", departmentId: d1.id, year: 1, credits: 3, maxEnrollment: 30 } }),
    prisma.course.upsert({ where: { code: "MA1001" }, update: {}, create: { id: "c2", name: "Mathematics for Engineers",        code: "MA1001", departmentId: d2.id, year: 1, credits: 4, maxEnrollment: 40 } }),
    prisma.course.upsert({ where: { code: "CS2001" }, update: {}, create: { id: "c3", name: "Data Structures & Algorithms",     code: "CS2001", departmentId: d1.id, year: 2, credits: 3, maxEnrollment: 25 } }),
    prisma.course.upsert({ where: { code: "CS3001" }, update: {}, create: { id: "c4", name: "Database Management Systems",      code: "CS3001", departmentId: d1.id, year: 3, credits: 3, maxEnrollment: 30 } }),
    prisma.course.upsert({ where: { code: "PH1001" }, update: {}, create: { id: "c5", name: "Physics I",                        code: "PH1001", departmentId: d3.id, year: 1, credits: 4, maxEnrollment: 35 } }),
    prisma.course.upsert({ where: { code: "MA1002" }, update: {}, create: { id: "c6", name: "Calculus I",                       code: "MA1002", departmentId: d2.id, year: 1, credits: 4, maxEnrollment: 40 } }),
    prisma.course.upsert({ where: { code: "CS2002" }, update: {}, create: { id: "c7", name: "Operating Systems",                code: "CS2002", departmentId: d1.id, year: 2, credits: 3, maxEnrollment: 30 } }),
    prisma.course.upsert({ where: { code: "CS3002" }, update: {}, create: { id: "c8", name: "Software Engineering",             code: "CS3002", departmentId: d1.id, year: 3, credits: 3, maxEnrollment: 30 } }),
  ]);
  console.log("✅ Courses seeded");

  // ── Users ─────────────────────────────────────────────────────
  const adminHash    = await bcrypt.hash("admin123",    10);
  const lecturerHash = await bcrypt.hash("lecturer123", 10);
  const studentHash  = await bcrypt.hash("student123",  10);

  await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: {},
    create: { id: "admin1", name: "Admin User", email: "admin@university.edu", password: adminHash, role: "admin", staffId: "ADM001", departmentId: d4.id, phone: "+266 5000 0001" },
  });

  const l1 = await prisma.user.upsert({
    where: { email: "s.johnson@university.edu" },
    update: {},
    create: { id: "l1", name: "Dr. Sarah Johnson", email: "s.johnson@university.edu", password: lecturerHash, role: "lecturer", staffId: "e100000001", departmentId: d1.id, phone: "+266 5000 0002" },
  });

  const l2 = await prisma.user.upsert({
    where: { email: "m.brown@university.edu" },
    update: {},
    create: { id: "l2", name: "Prof. Michael Brown", email: "m.brown@university.edu", password: lecturerHash, role: "lecturer", staffId: "e100000002", departmentId: d2.id, phone: "+266 5000 0003" },
  });

  const l3 = await prisma.user.upsert({
    where: { email: "e.davis@university.edu" },
    update: {},
    create: { id: "l3", name: "Dr. Emily Davis", email: "e.davis@university.edu", password: lecturerHash, role: "lecturer", staffId: "e100000003", departmentId: d1.id, phone: "+266 5000 0004" },
  });

  const s1 = await prisma.user.upsert({
    where: { email: "alice@student.edu" },
    update: {},
    create: { id: "s1", name: "Alice Mokoena", email: "alice@student.edu", password: studentHash, role: "student", studentId: "s202312345", programmeId: p1.id, departmentId: d1.id, yearOfStudy: 1, phone: "+266 5800 0001" },
  });

  const s2 = await prisma.user.upsert({
    where: { email: "bob@student.edu" },
    update: {},
    create: { id: "s2", name: "Bob Ntšekhe", email: "bob@student.edu", password: studentHash, role: "student", studentId: "s202367890", programmeId: p3.id, departmentId: d2.id, yearOfStudy: 1, phone: "+266 5800 0002" },
  });
  console.log("✅ Users seeded");

  // ── Lecturer assignments ──────────────────────────────────────
  const lecturerAssignments = [
    { lecturerId: l1.id, courseId: "c1" },
    { lecturerId: l1.id, courseId: "c3" },
    { lecturerId: l2.id, courseId: "c2" },
    { lecturerId: l2.id, courseId: "c5" },
    { lecturerId: l2.id, courseId: "c6" },
    { lecturerId: l3.id, courseId: "c4" },
    { lecturerId: l3.id, courseId: "c7" },
  ];
  for (const a of lecturerAssignments) {
    await prisma.lecturerCourse.upsert({
      where: { lecturerId_courseId: { lecturerId: a.lecturerId, courseId: a.courseId } },
      update: {}, create: a,
    });
  }
  console.log("✅ Lecturer assignments seeded");

  // ── Student enrollments ───────────────────────────────────────
  const studentEnrollments = [
    { studentId: s1.id, courseId: "c1" },
    { studentId: s2.id, courseId: "c2" },
    { studentId: s2.id, courseId: "c6" },
  ];
  for (const e of studentEnrollments) {
    await prisma.studentCourse.upsert({
      where: { studentId_courseId: { studentId: e.studentId, courseId: e.courseId } },
      update: {}, create: e,
    });
  }
  console.log("✅ Student enrollments seeded");

  // ── Attendance ────────────────────────────────────────────────
  const attendanceRecords = [
    { id: "a1", courseId: "c1", studentId: s1.id, date: new Date("2026-03-10"), status: "present" as const, markedById: l1.id },
    { id: "a2", courseId: "c1", studentId: s1.id, date: new Date("2026-03-12"), status: "present" as const, markedById: l1.id },
    { id: "a3", courseId: "c1", studentId: s1.id, date: new Date("2026-03-14"), status: "absent"  as const, markedById: l1.id },
    { id: "a5", courseId: "c2", studentId: s2.id, date: new Date("2026-03-10"), status: "present" as const, markedById: l2.id },
    { id: "a6", courseId: "c2", studentId: s2.id, date: new Date("2026-03-12"), status: "late"    as const, markedById: l2.id },
  ];
  for (const r of attendanceRecords) {
    await prisma.attendanceRecord.upsert({
      where: { id: r.id }, update: {}, create: r,
    });
  }
  console.log("✅ Attendance seeded");

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });