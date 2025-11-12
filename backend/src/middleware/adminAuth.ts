import { Request, Response, NextFunction } from "express";
import { appConfig } from "../config";

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const provided =
    req.headers["x-admin-secret"]?.toString() ??
    (typeof req.body === "object" && req.body !== null
      ? (req.body.adminSecret as string | undefined)
      : undefined) ??
    (typeof req.query.adminSecret === "string"
      ? req.query.adminSecret
      : undefined);

  if (!provided || provided !== appConfig.adminSecret) {
    return res.status(401).json({
      message: "Accès administrateur refusé",
    });
  }

  return next();
};

