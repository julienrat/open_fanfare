import express from "express";
import cors from "cors";
import { appConfig } from "./config";
import { requireAppPassword } from "./middleware/appAuth";
import instrumentsRouter from "./routes/instruments";
import musiciansRouter from "./routes/musicians";
import eventsRouter from "./routes/events";
import statusesRouter from "./routes/statuses";
import sectionsRouter from "./routes/sections";

export const createApp = () => {
  const app = express();

  // Configuration CORS pour accepter plusieurs origines localhost
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    appConfig.corsOrigin
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Autoriser les requêtes sans origine (comme Postman) ou les origines autorisées
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: false,
    })
  );

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Routes protégées par mot de passe
  app.use("/api/instruments", requireAppPassword, instrumentsRouter);
  app.use("/api/musicians", requireAppPassword, musiciansRouter);
  app.use("/api/events", requireAppPassword, eventsRouter);
  app.use("/api/statuses", requireAppPassword, statusesRouter);
  app.use("/api/sections", requireAppPassword, sectionsRouter);

  return app;
};

