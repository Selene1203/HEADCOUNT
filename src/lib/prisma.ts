// src/lib/prisma.ts
// Single shared Prisma client instance used across all route files

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
