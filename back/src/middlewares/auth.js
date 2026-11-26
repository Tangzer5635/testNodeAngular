import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ForbiddenError } from '../errors/ForbiddenError.js';

const lireJeton = (req) => {
  try {
    return jwt.verify(req.headers.authorization.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new UnauthorizedError('Jeton invalide ou expiré');
  }
};

const aUnJeton = (req) => req.headers.authorization?.startsWith('Bearer ') ?? false;

export const verifierToken = (req, res, next) => {
  if (!aUnJeton(req)) {
    throw new UnauthorizedError('Authentification requise');
  }
  req.utilisateur = lireJeton(req);
  next();
};

export const tokenOptionnel = (req, res, next) => {
  if (aUnJeton(req)) {
    req.utilisateur = lireJeton(req);
  }
  next();
};

export const exigerRole = (role) => (req, res, next) => {
  if (req.utilisateur?.role !== role) {
    throw new ForbiddenError('Accès réservé');
  }
  next();
};

export const admin = [verifierToken, exigerRole('admin')];
