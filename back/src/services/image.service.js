import fs from 'node:fs/promises';
import path from 'node:path';
import { DOSSIER_UPLOADS } from '../middlewares/upload.js';

export const NOM_IMAGE = /^[\w-]+\.(jpe?g|png|webp)$/i;

export const supprimerImage = async (nom) => {
  if (!nom || !NOM_IMAGE.test(nom)) {
    return;
  }
  try {
    await fs.rm(path.join(DOSSIER_UPLOADS, nom), { force: true });
  } catch (error) {
    console.error(`Impossible de supprimer l'image ${nom}`, error);
  }
};
