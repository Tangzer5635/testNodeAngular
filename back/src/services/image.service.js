import fs from 'node:fs/promises';
import path from 'node:path';
import { DOSSIER_UPLOADS } from '../middlewares/upload.js';

// Nom d'image autorisé : lettres, chiffres, tirets, puis une extension d'image.
// Empêche les noms comme « ../../index.js » (on ne sortira jamais du dossier des images).
export const NOM_IMAGE = /^[\w-]+\.(jpe?g|png|webp)$/i;

// Supprime une image envoyée par l'admin (dossier uploads).
// Les images de départ (public/images) ne sont pas dans ce dossier : elles ne sont jamais supprimées.
export const supprimerImage = async (nom) => {
  if (!nom || !NOM_IMAGE.test(nom)) {
    return;
  }
  try {
    await fs.rm(path.join(DOSSIER_UPLOADS, nom), { force: true });
  } catch (error) {
    // Le vêtement est déjà enregistré : un fichier impossible à supprimer ne doit pas faire échouer la requête
    console.error(`Impossible de supprimer l'image ${nom}`, error);
  }
};
