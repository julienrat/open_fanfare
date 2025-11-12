import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../prisma";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

const statusSchema = z.object({
  label: z.string().min(1),
  color: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

router.get("/", async (_req, res) => {
  const statuses = await prisma.attendanceStatus.findMany({
    orderBy: [
      { isDefault: "desc" },
      { label: "asc" },
    ],
  });
  res.json(statuses);
});

router.post("/", adminAuth, async (req, res) => {
  const parseResult = statusSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const { isDefault = false, ...rest } = parseResult.data;

  const status = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (isDefault) {
      await tx.attendanceStatus.updateMany({
        data: { isDefault: false },
      });
    }

    return tx.attendanceStatus.create({
      data: {
        ...rest,
        isDefault,
      },
    });
  });

  res.status(201).json(status);
});

router.put("/:id", adminAuth, async (req, res) => {
  const statusId = Number(req.params.id);

  if (Number.isNaN(statusId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const parseResult = statusSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const { isDefault, ...rest } = parseResult.data;

  try {
    const status = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (typeof isDefault === "boolean" && isDefault) {
        await tx.attendanceStatus.updateMany({
          data: { isDefault: false },
        });
      }

      return tx.attendanceStatus.update({
        where: { id: statusId },
        data: {
          ...rest,
          ...(typeof isDefault === "boolean" ? { isDefault } : {}),
        },
      });
    });

    res.json(status);
  } catch (error) {
    res.status(404).json({ message: "Statut introuvable" });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  const statusId = Number(req.params.id);

  if (Number.isNaN(statusId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  try {
    await prisma.attendanceStatus.delete({ where: { id: statusId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: "Statut introuvable" });
  }
});

export default router;

