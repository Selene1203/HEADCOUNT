import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const SEMESTER_KEY = "activeSemester";

// GET /api/settings/semester — any authenticated user can read
router.get("/semester", async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SEMESTER_KEY },
    });
    res.json({ semester: (setting?.value ?? "A") as "A" | "B" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/settings/semester — admin only
router.put("/semester", adminOnly, async (req: AuthRequest, res: Response) => {
  const { semester } = req.body;
  if (semester !== "A" && semester !== "B") {
    res.status(400).json({ error: "Semester must be A or B" });
    return;
  }
  try {
    await prisma.systemSetting.upsert({
      where:  { key: SEMESTER_KEY },
      update: { value: semester },
      create: { key: SEMESTER_KEY, value: semester },
    });
    res.json({ semester });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
