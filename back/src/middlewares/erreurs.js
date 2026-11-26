import { ValidationError } from '../errors/ValidationError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ConflictError } from '../errors/ConflictError.js';
import { ForbiddenError } from '../errors/ForbiddenError.js';
import multer from 'multer';

export const routeIntrouvable = (req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
};

export const gestionnaireErreurs = (error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: "Le corps de la requête n'est pas un JSON valide" });
  }
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Image trop lourde (2 Mo maximum)' : "Envoi de l'image invalide";
    return res.status(400).json({ message });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ message: error.message });
  }
  if (error instanceof ForbiddenError) {
    return res.status(403).json({ message: error.message });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message });
  }
  if (error instanceof ConflictError) {
    return res.status(409).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Erreur serveur' });
};
