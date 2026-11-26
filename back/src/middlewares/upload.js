import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { ValidationError } from '../errors/ValidationError.js';

export const DOSSIER_UPLOADS = path.join(import.meta.dirname, '..', '..', 'uploads');

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const stockage = multer.diskStorage({
  destination: DOSSIER_UPLOADS,
  // Nom généré par le serveur : on ne réutilise JAMAIS le nom envoyé par le client
  filename: (req, fichier, rappel) => {
    rappel(null, `${crypto.randomUUID()}${EXTENSIONS[fichier.mimetype]}`);
  },
});

export const uploadImage = multer({
  storage: stockage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo maximum
  fileFilter: (req, fichier, rappel) => {
    if (EXTENSIONS[fichier.mimetype]) {
      rappel(null, true);
    } else {
      rappel(new ValidationError('Format accepté : JPEG, PNG ou WebP'));
    }
  },
}).single('image');