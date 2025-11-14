import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

const eventBaseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  date: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  location: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  organizer: z.string().optional().nullable(),
});

router.get("/", async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      assignments: {
        include: {
          musician: {
            include: { 
              instrument: {
                include: { section: true }
              }
            },
          },
        },
        orderBy: {
          musician: {
            lastName: "asc",
          },
        },
      },
      presences: {
        include: {
          musician: { 
            include: { 
              instrument: {
                include: { section: true }
              }
            }
          },
          status: true,
        },
      },
    },
  });

  res.json(events);
});

router.get("/:id", async (req, res) => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      assignments: {
        include: {
          musician: {
            include: { 
              instrument: {
                include: { section: true }
              }
            },
          },
        },
      },
      presences: {
        include: {
          musician: { 
            include: { 
              instrument: {
                include: { section: true }
              }
            }
          },
          status: true,
        },
      },
    },
  });

  if (!event) {
    return res.status(404).json({ message: "Événement introuvable" });
  }

  res.json(event);
});

router.post("/", adminAuth, async (req, res) => {
  const parseResult = eventBaseSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const eventData = parseResult.data;

  const allMusicians = await prisma.musician.findMany({
    select: { id: true },
  });
  const selectedMusicianIds = allMusicians.map((musician) => musician.id);

  const event = await prisma.event.create({
    data: {
      ...eventData,
      assignments: selectedMusicianIds.length
        ? {
            create: selectedMusicianIds.map((musicianId) => ({
              musician: { connect: { id: musicianId } },
            })),
          }
        : undefined,
    },
    include: {
      assignments: {
        include: {
          musician: {
            include: { instrument: true },
          },
        },
      },
    },
  });

  res.status(201).json(event);
});

router.put("/:id", adminAuth, async (req, res) => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const parseResult = eventBaseSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const eventData = parseResult.data;

  try {
    const allMusicians = await prisma.musician.findMany({
      select: { id: true },
    });

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...eventData,
        assignments: {
          deleteMany: { eventId },
          ...(allMusicians.length
            ? {
                create: allMusicians.map((musician) => ({
                  musician: { connect: { id: musician.id } },
                })),
              }
            : {}),
        },
      },
      include: {
        assignments: {
          include: {
            musician: { include: { instrument: true } },
          },
        },
      },
    });

    res.json(event);
  } catch (error) {
    res.status(404).json({ message: "Événement introuvable" });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  try {
    await prisma.event.delete({ where: { id: eventId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: "Événement introuvable" });
  }
});

const presenceSchema = z.object({
  musicianId: z.number().int().positive().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  statusId: z.number().int().positive(),
  comment: z.string().optional().nullable(),
});

router.get("/:id/presences", async (req, res) => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const presences = await prisma.presence.findMany({
    where: { eventId },
    include: {
      musician: { include: { instrument: true } },
      status: true,
    },
  });

  res.json(presences);
});

router.post("/:id/presences", async (req, res) => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }

  const parseResult = presenceSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() });
  }

  const { musicianId, firstName, lastName, statusId, comment } =
    parseResult.data;

  let targetMusicianId = musicianId;

  if (!targetMusicianId) {
    if (!firstName || !lastName) {
      return res.status(400).json({
        message:
          "Merci de fournir l'identifiant du musicien OU son prénom et nom.",
      });
    }

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    const musician = await prisma.musician.findFirst({
      where: {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      },
    });

    if (!musician) {
      return res.status(404).json({
        message: "Musicien introuvable. Merci de contacter l'administration.",
      });
    }

    targetMusicianId = musician.id;
  }

  try {
    const presence = await prisma.presence.upsert({
      where: {
        presence_event_musician: {
          eventId,
          musicianId: targetMusicianId,
        },
      },
      update: {
        statusId,
        comment: comment ?? null,
        respondedAt: new Date(),
      },
      create: {
        eventId,
        musicianId: targetMusicianId,
        statusId,
        comment: comment ?? null,
      },
      include: {
        status: true,
        musician: { include: { instrument: true } },
      },
    });

    res.status(201).json(presence);
  } catch (error) {
    res.status(400).json({ message: "Impossible d'enregistrer la présence" });
  }
});

export default router;

