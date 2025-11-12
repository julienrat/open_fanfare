import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const statuses = [
    { label: "Présent", color: "#22c55e", isDefault: true },
    { label: "Absent", color: "#ef4444", isDefault: false },
    { label: "Peut-être", color: "#facc15", isDefault: false },
  ];

  for (const status of statuses) {
    await prisma.attendanceStatus.upsert({
      where: { label: status.label },
      update: status,
      create: status,
    });
  }

  const instruments = [
    { name: "Trompette", color: "#60a5fa" },
    { name: "Saxophone", color: "#f97316" },
    { name: "Tuba", color: "#a855f7" },
  ];

  for (const instrument of instruments) {
    await prisma.instrument.upsert({
      where: { name: instrument.name },
      update: instrument,
      create: instrument,
    });
  }

  const musicians = [
    {
      firstName: "Alice",
      lastName: "Dupont",
      email: "alice.dupont@example.com",
      phone: "+33601020304",
      instrumentName: "Trompette",
    },
    {
      firstName: "Bruno",
      lastName: "Martin",
      email: "bruno.martin@example.com",
      phone: "+33605060708",
      instrumentName: "Saxophone",
    },
    {
      firstName: "Claire",
      lastName: "Durand",
      email: "claire.durand@example.com",
      phone: "+33611121314",
      instrumentName: "Tuba",
    },
  ];

  for (const musician of musicians) {
    const instrument = await prisma.instrument.findUnique({
      where: { name: musician.instrumentName },
    });

    if (!instrument) continue;

    await prisma.musician.upsert({
      where: {
        musician_first_last: {
          firstName: musician.firstName,
          lastName: musician.lastName,
        },
      },
      update: {
        instrumentId: instrument.id,
        email: musician.email,
        phone: musician.phone,
      },
      create: {
        firstName: musician.firstName,
        lastName: musician.lastName,
        instrumentId: instrument.id,
        email: musician.email,
        phone: musician.phone,
      },
    });
  }

  const upcomingEventDate = new Date();
  upcomingEventDate.setDate(upcomingEventDate.getDate() + 7);
  upcomingEventDate.setHours(18, 0, 0, 0);

  const event = await prisma.event.upsert({
    where: {
      event_title_date: {
        title: "Concert de quartier",
        date: upcomingEventDate,
      },
    },
    update: {},
    create: {
      title: "Concert de quartier",
      date: upcomingEventDate,
      location: "Place de la République",
      organizer: "Ville de Paris",
      price: "Participation libre",
      description: "Concert en plein air",
    },
  });

  const allMusicians = await prisma.musician.findMany();

  for (const musician of allMusicians) {
    await prisma.eventMusician.upsert({
      where: {
        assignment_event_musician: {
          eventId: event.id,
          musicianId: musician.id,
        },
      },
      update: {},
      create: {
        eventId: event.id,
        musicianId: musician.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

