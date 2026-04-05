// src/routes/static.ts
import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();

// ── PROTECTED routes ─────────────────────────────────────────
router.use(authenticate);

// ── GET /api/departments ─────────────────────────── all roles
router.get("/departments", async (_req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    res.json(departments);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/departments ────────────────────────── admin only
router.post("/departments", adminOnly, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
  try {
    const dept = await prisma.department.create({ data: { name: name.trim() } });
    res.status(201).json(dept);
  } catch (e) {
    res.status(500).json({ error: "Department name may already exist" });
  }
});

// ── PUT /api/departments/:id ─────────────────────── admin only
router.put("/departments/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  try {
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: { name: name.trim() },
    });
    res.json(dept);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/departments/:id ──────────────────── admin only
router.delete("/departments/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Cannot delete department with existing users or courses" });
  }
});

// ── GET /api/programmes ──────────────────────────── all roles
router.get("/programmes", async (_req: AuthRequest, res: Response) => {
  try {
    const programmes = await prisma.programme.findMany({
      include: { departments: { include: { department: true } } },
      orderBy: { name: "asc" },
    });
    res.json(programmes.map(formatProgramme));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/programmes ─────────────────────────── admin only
router.post("/programmes", adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, departmentIds } = req.body;
  if (!name?.trim())           { res.status(400).json({ error: "Name is required" }); return; }
  if (!departmentIds?.length)  { res.status(400).json({ error: "At least one department is required" }); return; }
  try {
    const prog = await prisma.programme.create({
      data: {
        name: name.trim(),
        departments: {
          create: (departmentIds as string[]).map((id: string) => ({ departmentId: id })),
        },
      },
      include: { departments: { include: { department: true } } },
    });
    res.status(201).json(formatProgramme(prog));
  } catch (e) {
    res.status(500).json({ error: "Programme name may already exist" });
  }
});

// ── PUT /api/programmes/:id ──────────────────────── admin only
router.put("/programmes/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, departmentIds } = req.body;
  try {
    // Delete existing links and recreate
    await prisma.programmeDepartment.deleteMany({ where: { programmeId: req.params.id } });
    const prog = await prisma.programme.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(departmentIds?.length && {
          departments: {
            create: (departmentIds as string[]).map((id: string) => ({ departmentId: id })),
          },
        }),
      },
      include: { departments: { include: { department: true } } },
    });
    res.json(formatProgramme(prog));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/programmes/:id ───────────────────── admin only
router.delete("/programmes/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.programme.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Cannot delete programme with existing students" });
  }
});

// ✅ Format programme to include departmentIds array
function formatProgramme(prog: any) {
  return {
    id:            prog.id,
    name:          prog.name,
    departmentIds: prog.departments.map((d: any) => d.departmentId),
    departments:   prog.departments.map((d: any) => ({ id: d.departmentId, name: d.department?.name })),
  };
}

export default router;