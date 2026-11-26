import * as vetementRepository from '../repositories/vetement.repository.js';
import * as categorieRepository from '../repositories/categorie.repository.js';
import { ValidationError } from '../errors/ValidationError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { NOM_IMAGE, supprimerImage } from './image.service.js';
import { lirePagination } from './pagination.js';

const estIdValide = (id) => Number.isInteger(id) && id > 0;

const validerTailles = (tailles) => {
  if (!Array.isArray(tailles) || tailles.length === 0 || tailles.length > 20) {
    throw new ValidationError('Indique entre 1 et 20 tailles');
  }
  const vues = new Set();
  for (const t of tailles) {
    if (!t || typeof t.taille !== 'string' || t.taille.trim() === '' || t.taille.trim().length > 10) {
      throw new ValidationError('Chaque taille doit avoir un nom (10 caractères maximum)');
    }
    if (!Number.isInteger(t.stock) || t.stock < 0 || t.stock > 100000) {
      throw new ValidationError(`Le stock de la taille ${t.taille} doit être un nombre entier positif`);
    }
    if (vues.has(t.taille.trim())) {
      throw new ValidationError(`La taille ${t.taille} est en double`);
    }
    vues.add(t.taille.trim());
  }
};

const normaliser = (data) => ({
  ...data,
  tailles: data.tailles.map(t => ({ taille: t.taille.trim(), stock: t.stock })),
});

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
  validerTailles(data.tailles);
  const categories = await categorieRepository.findAll();
  if (!categories.includes(data.categorie)) {
    throw new ValidationError(`Catégorie inconnue : ${data.categorie}`);
  }
};

export const getVetements = async ({ categorie, recherche, tri, page, parPage } = {}) => {
  const triChoisi = tri ?? 'recent';
  if (!Object.hasOwn(vetementRepository.TRIS, triChoisi)) {
    throw new ValidationError(
      `Tri inconnu : ${triChoisi}. Valeurs acceptées : ${Object.keys(vetementRepository.TRIS).join(', ')}`
    );
  }
  const texte = typeof recherche === 'string' ? recherche.trim() : '';
  const filtres = { categorie, recherche: texte || undefined };
  if (page === undefined && parPage === undefined) {
    const vetements = await vetementRepository.findAll({ ...filtres, tri: triChoisi });
    return { vetements, total: vetements.length };
  }
  const { limite, decalage } = lirePagination({ page, parPage }, 12);
  const [vetements, total] = await Promise.all([
    vetementRepository.findAll({ ...filtres, tri: triChoisi, limite, decalage }),
    vetementRepository.compter(filtres),
  ]);
  return { vetements, total };
};

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
  const id = await vetementRepository.create(normaliser(data));
  return vetementRepository.findById(id);
};

export const updateVetement = async (id, data) => {
  const ancien = await trouverVetement(id);
  await validerVetement(data);
  const lignesModifiees = await vetementRepository.update(id, normaliser(data));
  if (lignesModifiees === 0) {
    throw new NotFoundError(`Aucun vêtement avec l'id ${id}`);
  }
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
