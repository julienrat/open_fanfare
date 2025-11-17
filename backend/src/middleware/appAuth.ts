import type { Request, Response, NextFunction } from 'express'
import { appConfig } from '../config'

export function requireAppPassword(req: Request, res: Response, next: NextFunction) {
  const providedPassword = req.headers['x-app-password']

  if (providedPassword !== appConfig.appPassword) {
    return res.status(401).json({ error: 'Mot de passe incorrect' })
  }

  next()
}
