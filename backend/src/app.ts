import express from "express";
import cors from "cors";
import { appConfig } from "./config";
import instrumentsRouter from "./routes/instruments";
import musiciansRouter from "./routes/musicians";
import eventsRouter from "./routes/events";
import statusesRouter from "./routes/statuses";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: false,
    })
  );

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/instruments", instrumentsRouter);
  app.use("/api/musicians", musiciansRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/statuses", statusesRouter);

  return app;
};

