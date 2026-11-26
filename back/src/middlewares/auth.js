import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';

export const verifierToken = (req, res, next) => {
  const entete = req.headers.authorization;

  if (!entete || !entete.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentification requise');
  }

  const jeton = entete.slice(7);

  try {
    req.utilisateur = jwt.verify(jeton, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new UnauthorizedError('Jeton invalide ou expiré');
  }

  next();
};