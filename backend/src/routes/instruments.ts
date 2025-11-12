import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

const instrumentSchema = z.object({
  name: z.string().min(1),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Couleur invalide")
    .optional()
    .nullable(),
});

const generateRandomColor = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;

router.get("/", async (_req, res) => {
  const instruments = await prisma.instrument.findMany({
    orderBy: { name: "asc" },
  });
  res.json(instruments);
});

router.post("/", adminAuth, async (req, res) => {
  const parseResult = instrumentSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const { name, color } = parseResult.data;

  const instrument = await prisma.instrument.create({
    data: {
      name,
      color: color ?? generateRandomColor(),
    },
  });

  res.status(201).json(instrument);
});

router.put("/:id", adminAuth, async (req, res) => {
  const instrumentId = Number(req.params.id);

  if (Number.isNaN(instrumentId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const parseResult = instrumentSchema
    .pick({ name: true, color: true })
    .partial()
    .safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  try {
    const instrument = await prisma.instrument.update({
      where: { id: instrumentId },
      data: {
        ...parseResult.data,
        ...(parseResult.data.color === null ? { color: generateRandomColor() } : {}),
      },
    });
    res.json(instrument);
  } catch (error) {
    res.status(404).json({ message: "Instrument introuvable" });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  const instrumentId = Number(req.params.id);

  if (Number.isNaN(instrumentId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  try {
    await prisma.instrument.delete({ where: { id: instrumentId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: "Instrument introuvable" });
  }
});

export default router;

