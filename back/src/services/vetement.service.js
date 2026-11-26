import * as vetementRepository from '../repositories/vetement.repository.js';
import * as categorieRepository from '../repositories/categorie.repository.js';
import { ValidationError } from '../errors/ValidationError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { NOM_IMAGE, supprimerImage } from './image.service.js';

const estIdValide = (id) => Number.isInteger(id) && id > 0;

const validerVetement = async (data) => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Le corps de la requête doit être un objet JSON');
  }
  if (typeof data.nom !== 'string' || data.nom.trim() === '') {
    throw new ValidationError('Le nom est obligatoire');
  }
  if (typeof data.prix !== 'number' || !Number.isFinite(data.prix) || data.prix < 0) {
    throw new ValidationError('Le prix doit être un nombre positif');
  }
  if (data.description !== undefined && typeof data.description !== 'string') {
    throw new ValidationError('La description doit être un texte');
  }
  if (data.image !== undefined && data.image !== null && data.image !== '' &&
      (typeof data.image !== 'string' || !NOM_IMAGE.test(data.image))) {
    throw new ValidationError("L'image doit être un nom de fichier (JPEG, PNG ou WebP)");
  }
  if (!Array.isArray(data.tailles) || !data.tailles.every(t => typeof t === 'string')) {
    throw new ValidationError('Les tailles doivent être une liste de textes');
  }
  const categories = await categorieRepository.findAll();
  if (!categories.includes(data.categorie)) {
    throw new ValidationError(`Catégorie inconnue : ${data.categorie}`);
  }
};

export const getVetements = async ({ categorie, recherche, tri } = {}) => {
  const triChoisi = tri ?? 'recent';
  if (!Object.hasOwn(vetementRepository.TRIS, triChoisi)) {
    throw new ValidationError(
      `Tri inconnu : ${triChoisi}. Valeurs acceptées : ${Object.keys(vetementRepository.TRIS).join(', ')}`
    );
  }
  const texte = typeof recherche === 'string' ? recherche.trim() : '';
  return vetementRepository.findAll({
    categorie,
    recherche: texte || undefined,
    tri: triChoisi,
  });
};

// Lève NotFoundError (404) si l'id n'est pas valide ou si le vêtement n'existe pas
const trouverVetement = async (id) => {
  const vetement = estIdValide(id) ? await vetementRepository.findById(id) : undefined;
  if (!vetement) {
    throw new NotFoundError(`Aucun vêtement avec l'id ${id}`);
  }
  return vetement;
};

export const getVetementById = async (id) => trouverVetement(id);

export const createVetement = async (data) => {
  await validerVetement(data);
  const id = await vetementRepository.create(data);
  return vetementRepository.findById(id);
};

export const updateVetement = async (id, data) => {
  const ancien = await trouverVetement(id);
  await validerVetement(data);
  const lignesModifiees = await vetementRepository.update(id, data);
  if (lignesModifiees === 0) {
    throw new NotFoundError(`Aucun vêtement avec l'id ${id}`);
  }
  // L'image a été remplacée ou retirée : l'ancien fichier ne sert plus
  if (ancien.image && ancien.image !== data.image) {
    await supprimerImage(ancien.image);
  }
  return vetementRepository.findById(id);
};

export const deleteVetement = async (id) => {
  const vetement = await trouverVetement(id);
  const lignesSupprimees = await vetementRepository.remove(id);
  if (lignesSupprimees === 0) {
    throw new NotFoundError(`Aucun vêtement avec l'id ${id}`);
  }
  await supprimerImage(vetement.image);
};