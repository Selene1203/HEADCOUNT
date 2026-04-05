// src/routes/logs.ts
import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// ── GET /api/logs ─────────────────────────────────── admin only
router.get("/", adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 1000, // cap at 1000 most recent
    });
    res.json(logs.map(formatLog));
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/logs ────────────────────────────────── any authenticated user
router.post("/", async (req: AuthRequest, res: Response) => {
  const { category, action, detail, severity, performedBy, performedByName, timestamp } = req.body;

  if (!category || !action || !detail || !performedBy || !performedByName) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }

  try {
    const log = await prisma.activityLog.create({
      data: {
        category,
        action,
        detail,
        severity: severity ?? "info",
        performedBy,
        performedByName,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });
    res.status(201).json(formatLog(log));
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/logs ──────────────────────────────── admin only (clear all)
router.delete("/", adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    await prisma.activityLog.deleteMany({});
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

function formatLog(log: any) {
  return {
    id:              log.id,
    category:        log.category,
    action:          log.action,
    detail:          log.detail,
    severity:        log.severity,
    performedBy:     log.performedBy,
    performedByName: log.performedByName,
    timestamp:       log.timestamp.toISOString(),
  };
}

export default router;
