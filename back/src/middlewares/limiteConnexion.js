import { rateLimit } from 'express-rate-limit';

export const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' },
});
