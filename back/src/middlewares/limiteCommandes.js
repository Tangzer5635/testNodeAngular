import { rateLimit } from 'express-rate-limit';

export const limiteCommandes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de commandes en peu de temps. Réessaie dans quelques minutes.' },
});
