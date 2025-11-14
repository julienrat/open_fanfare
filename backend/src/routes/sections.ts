import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

const sectionSchema = z.object({
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
  const sections = await prisma.section.findMany({
    orderBy: { name: "asc" },
  });
  res.json(sections);
});

router.post("/", adminAuth, async (req, res) => {
  const parseResult = sectionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const { name, color } = parseResult.data;

  const section = await prisma.section.create({
    data: {
      name,
      color: color ?? generateRandomColor(),
    },
  });

  res.status(201).json(section);
});

router.put("/:id", adminAuth, async (req, res) => {
  const sectionId = Number(req.params.id);

  if (Number.isNaN(sectionId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const parseResult = sectionSchema
    .pick({ name: true, color: true })
    .partial()
    .safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  try {
    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        ...parseResult.data,
        ...(parseResult.data.color === null ? { color: generateRandomColor() } : {}),
      },
    });
    res.json(section);
  } catch (error) {
    res.status(404).json({ message: "Section introuvable" });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  const sectionId = Number(req.params.id);

  if (Number.isNaN(sectionId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  try {
    await prisma.section.delete({ where: { id: sectionId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: "Section introuvable" });
  }
});

export default router;
