import { rateLimit } from 'express-rate-limit';

// Passer commande ne demande pas de compte : on limite pour éviter qu'un robot vide les stocks.
// 20 tentatives par adresse IP sur 15 minutes.
export const limiteCommandes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de commandes en peu de temps. Réessaie dans quelques minutes.' },
});
