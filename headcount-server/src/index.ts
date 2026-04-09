// src/index.ts
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import logRoutes from "./routes/logs"
import jwt from "jsonwebtoken";

import authRoutes              from "./routes/auth";
import userRoutes              from "./routes/users";
import courseRoutes            from "./routes/courses";
import attendanceRoutes        from "./routes/attendance";
import attendanceSessionRoutes from "./routes/attendanceSession";
import staticRoutes            from "./routes/static";
import settingsRoutes          from "./routes/settings";

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
app.use("/api/settings", settingsRoutes);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Helpers ───────────────────────────────────────────────────

function formatProgramme(p: any) {
  // Use the first linked department as the primary departmentId
  const firstDept = p.departments?.[0];
  return {
    id:           p.id,
    name:         p.name,
    departmentId: firstDept?.departmentId ?? null,
    department:   firstDept?.department?.name ?? null,
    departmentIds: p.departments?.map((d: any) => d.departmentId) ?? [],
    departments:   p.departments?.map((d: any) => ({ id: d.departmentId, name: d.department?.name })) ?? [],
  };
}

// ── Public routes (no auth — needed for registration page) ───

app.get("/api/departments/public", async (_req, res) => {
  try {
    const data = await prisma.department.findMany({ orderBy: { name: "asc" } });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/programmes/public", async (_req, res) => {
  try {
    const data = await prisma.programme.findMany({
      include: { departments: { include: { department: true } } },
      orderBy: { name: "asc" },
    });
    res.json(data.map(formatProgramme));
  } catch { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/courses/public", async (_req, res) => {
  try {
    const data = await prisma.course.findMany({
      include: { department: true },
      orderBy: [{ departmentId: "asc" }, { year: "asc" }],
    });
    res.json(data.map(c => ({
      id: c.id, name: c.name, code: c.code,
      description: c.description, departmentId: c.departmentId,
      department: c.department?.name, year: c.year,
      credits: c.credits, maxEnrollment: c.maxEnrollment,
    })));
  } catch { res.status(500).json({ error: "Server error" }); }
});

// ── Authenticated department routes ──────────────────────────

app.get("/api/departments", async (req, res) => {
  try {
    const data = await prisma.department.findMany({ orderBy: { name: "asc" } });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/departments", async (req, res) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }
  try {
    const dept = await prisma.department.create({ data: { name } });
    res.status(201).json(dept);
  } catch { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/departments/:id", async (req, res) => {
  const { name } = req.body;
  try {
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: { name } });
    res.json(dept);
  } catch { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/departments/:id", async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

// ── Authenticated programme routes ───────────────────────────

app.get("/api/programmes", async (_req, res) => {
  try {
    const data = await prisma.programme.findMany({
      include: { departments: { include: { department: true } } },
      orderBy: { name: "asc" },
    });
    res.json(data.map(formatProgramme));
  } catch { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/programmes", async (req, res) => {
  const { name, departmentIds, departmentId } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }
 
  // Accept either departmentIds (array) or departmentId (legacy single string)
  const deptIds: string[] = Array.isArray(departmentIds)
    ? departmentIds
    : departmentId ? [departmentId] : [];
 
  try {
    const prog = await prisma.programme.create({
      data: {
        name,
        ...(deptIds.length > 0 && {
          departments: {
            create: deptIds.map(id => ({ departmentId: id })),
          },
        }),
      },
      include: { departments: { include: { department: true } } },
    });
    res.status(201).json(formatProgramme(prog));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/programmes/:id", async (req, res) => {
  const { name, departmentIds, departmentId } = req.body;
 
  // Accept either departmentIds (array) or departmentId (legacy single string)
  const deptIds: string[] = Array.isArray(departmentIds)
    ? departmentIds
    : departmentId ? [departmentId] : [];
 
  try {
    await prisma.programme.update({
      where: { id: req.params.id },
      data: { name },
    });
 
    if (deptIds.length > 0) {
      // Replace all department links
      await prisma.programmeDepartment.deleteMany({
        where: { programmeId: req.params.id },
      });
      await prisma.programmeDepartment.createMany({
        data: deptIds.map(id => ({ programmeId: req.params.id, departmentId: id })),
        skipDuplicates: true,
      });
    }
 
    const updated = await prisma.programme.findUnique({
      where: { id: req.params.id },
      include: { departments: { include: { department: true } } },
    });
    res.json(formatProgramme(updated));
  } catch (e: any) {
      if (e.code === 'P2002') {
        res.status(400).json({ error: "A programme with that name already exists." });
        return;
      }
    res.status(500).json({ error: "Server error" });
  }
    });
 
app.delete("/api/programmes/:id", async (req, res) => {
  try {
    await prisma.programme.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

// ── Authenticated routes ─────────────────────────────────────
app.use("/api/auth",                authRoutes);
app.use("/api/users",               userRoutes);
app.use("/api/courses",             courseRoutes);
app.use("/api/logs",                logRoutes);
app.use("/api/attendance/session",  attendanceSessionRoutes);
app.use("/api/attendance",          attendanceRoutes);
app.use("/api",                     staticRoutes);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});
