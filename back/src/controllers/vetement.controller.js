import * as vetementService from '../services/vetement.service.js';
import { ValidationError } from '../errors/ValidationError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

const gererErreur = (error, res) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Erreur serveur' });
};

export const getAll = async (req, res) => {
  try {
    const vetements = await vetementService.getVetements(req.query.categorie);
    res.json(vetements);
  } catch (error) {
    gererErreur(error, res);
  }
};

export const getById = async (req, res) => {
  try {
    const vetement = await vetementService.getVetementById(Number(req.params.id));
    if (!vetement) {
      return res.status(404).json({ message: 'Vêtement non trouvé' });
    }
    res.json(vetement);
  } catch (error) {
    gererErreur(error, res);
  }
};

export const create = async (req, res) => {
  try {
    const vetement = await vetementService.createVetement(req.body);
    res.status(201).json(vetement);
  } catch (error) {
    gererErreur(error, res);
  }
};

export const update = async (req, res) => {
  try {
    const vetement = await vetementService.updateVetement(Number(req.params.id), req.body);
    res.json(vetement);
  } catch (error) {
    gererErreur(error, res);
  }
};

export const remove = async (req, res) => {
  try {
    await vetementService.deleteVetement(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    gererErreur(error, res);
  }
};