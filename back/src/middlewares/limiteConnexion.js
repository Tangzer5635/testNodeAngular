import { rateLimit } from 'express-rate-limit';

// Contre les attaques par force brute sur /login :
// 10 tentatives ratées maximum par adresse IP, sur 15 minutes.
export const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true, // une connexion réussie ne compte pas
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' },
});
