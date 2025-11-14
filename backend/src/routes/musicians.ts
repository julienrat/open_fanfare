import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

const musicianSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  instrumentId: z.number().int().positive(),
  color: z.string().optional().nullable(),
  email: z
    .string()
    .email()
    .optional()
    .nullable()
    .transform((value) => (value ? value.toLowerCase() : value)),
  phone: z.string().optional().nullable(),
});

const generateRandomColor = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;

router.get("/", async (_req, res) => {
  const musicians = await prisma.musician.findMany({
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
    include: { 
      instrument: {
        include: { section: true }
      }
    },
  });
  res.json(musicians);
});

router.post("/", adminAuth, async (req, res) => {
  const parseResult = musicianSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const musician = await prisma.musician.create({
    data: parseResult.data,
    include: { 
      instrument: {
        include: { section: true }
      }
    },
  });

  res.status(201).json(musician);
});

router.put("/:id", adminAuth, async (req, res) => {
  const musicianId = Number(req.params.id);

  if (Number.isNaN(musicianId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const parseResult = musicianSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  try {
    const musician = await prisma.musician.update({
      where: { id: musicianId },
      data: parseResult.data,
      include: { 
        instrument: {
          include: { section: true }
        }
      },
    });
    res.json(musician);
  } catch (error) {
    res.status(404).json({ message: "Musicien introuvable" });
  }
});

const importSchema = z.object({
  csv: z.string().min(1),
  delimiter: z.enum([";", ","]).optional(),
  hasHeader: z.boolean().optional(),
});

router.post("/import", adminAuth, async (req, res) => {
  const parseResult = importSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const { csv, delimiter = ";", hasHeader = true } = parseResult.data;

  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!rows.length) {
    return res.status(400).json({ message: "Le contenu CSV est vide." });
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;

  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const trimmedDelimiter = delimiter.trim() || ";";

  for (const [index, row] of dataRows.entries()) {
    const parts = row.split(trimmedDelimiter).map((part) => part.trim());

    const [lastName, firstName, instrumentName, email, phone] = parts;

    if (!lastName || !firstName || !instrumentName) {
      summary.skipped += 1;
      summary.errors.push(
        `Ligne ${index + 1}: colonnes obligatoires manquantes (nom;prenom;instrument).`
      );
      continue;
    }

    try {
      const colorForInstrument = generateRandomColor();

      let instrument = await prisma.instrument.upsert({
        where: { name: instrumentName },
        update: {},
        create: { name: instrumentName, color: colorForInstrument },
      });

      if (!instrument.color) {
        instrument = await prisma.instrument.update({
          where: { id: instrument.id },
          data: { color: colorForInstrument },
        });
      }

      const musician = await prisma.musician.upsert({
        where: {
          musician_first_last: {
            firstName,
            lastName,
          },
        },
        update: {
          instrumentId: instrument.id,
          email: email?.toLowerCase() ?? null,
          phone: phone ?? null,
        },
        create: {
          firstName,
          lastName,
          instrumentId: instrument.id,
          email: email?.toLowerCase() ?? null,
          phone: phone ?? null,
        },
      });

      if (musician.createdAt.getTime() === musician.updatedAt.getTime()) {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push(
        `Ligne ${index + 1}: échec de l'import (${(error as Error).message}).`
      );
    }
  }

  res.json(summary);
});

router.delete("/:id", adminAuth, async (req, res) => {
  const musicianId = Number(req.params.id);

  if (Number.isNaN(musicianId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  try {
    await prisma.presence.deleteMany({ where: { musicianId } });
    await prisma.eventMusician.deleteMany({ where: { musicianId } });
    await prisma.musician.delete({ where: { id: musicianId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: "Musicien introuvable" });
  }
});

export default router;

