import { rateLimit } from 'express-rate-limit';

const options = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
};

export const limiteConnexion = rateLimit({
  ...options,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' },
});

export const limiteInscription = rateLimit({
  ...options,
  limit: 10,
  message: { message: 'Trop de comptes créés depuis cette adresse. Réessaie plus tard.' },
});
