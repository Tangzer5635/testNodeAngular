import * as vetementRepository from '../repositories/vetement.repository.js';
import * as categorieRepository from '../repositories/categorie.repository.js';
import { ValidationError } from '../errors/ValidationError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

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
  if (data.image !== undefined && typeof data.image !== 'string') {
    throw new ValidationError("L'image doit être un nom de fichier");
  }
  if (!Array.isArray(data.tailles) || !data.tailles.every(t => typeof t === 'string')) {
    throw new ValidationError('Les tailles doivent être une liste de textes');
  }
  const categories = await categorieRepository.findAll();
  if (!categories.includes(data.categorie)) {
    throw new ValidationError(`Catégorie inconnue : ${data.categorie}`);
  }
};

export const getVetements = async (categorie) => {
  if (!categorie) {
    return vetementRepository.findAll();
  }
  return vetementRepository.findAllByCategorie(categorie);
};

export const getVetementById = async (id) => {
  if (!estIdValide(id)) {
    return null;
  }
  return (await vetementRepository.findById(id)) ?? null;
};

export const createVetement = async (data) => {
  await validerVetement(data);
  const id = await vetementRepository.create(data);
  return vetementRepository.findById(id);
};

export const updateVetement = async (id, data) => {
  if (!estIdValide(id)) {
    throw new NotFoundError('Aucun vêtement avec cet identifiant');
  }
  await validerVetement(data);
  const lignesModifiees = await vetementRepository.update(id, data);
  if (lignesModifiees === 0) {
    throw new NotFoundError(`Aucun vêtement avec l'id ${id}`);
  }
  return vetementRepository.findById(id);
};

export const deleteVetement = async (id) => {
  if (!estIdValide(id)) {
    throw new NotFoundError('Aucun vêtement avec cet identifiant');
  }
  const lignesSupprimees = await vetementRepository.remove(id);
  if (lignesSupprimees === 0) {
    throw new NotFoundError(`Aucun vêtement avec l'id ${id}`);
  }
};