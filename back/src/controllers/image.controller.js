import { ValidationError } from '../errors/ValidationError.js';

export const envoyer = (req, res) => {
  if (!req.file) {
    throw new ValidationError('Aucun fichier reçu (champ « image » attendu)');
  }
  res.status(201).json({ image: req.file.filename });
};