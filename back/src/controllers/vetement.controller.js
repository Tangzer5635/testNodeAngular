import * as vetementService from '../services/vetement.service.js';

// Pas de try/catch ici : depuis Express 5, une erreur levée dans une fonction async
// est transmise automatiquement au gestionnaire d'erreurs global (src/middlewares/erreurs.js).

export const getAll = async (req, res) => {
  const vetements = await vetementService.getVetements(req.query.categorie);
  res.json(vetements);
};

export const getById = async (req, res) => {
  const vetement = await vetementService.getVetementById(Number(req.params.id));
  if (!vetement) {
    return res.status(404).json({ message: 'Vêtement non trouvé' });
  }
  res.json(vetement);
};

export const create = async (req, res) => {
  const vetement = await vetementService.createVetement(req.body);
  res.status(201).json(vetement);
};

export const update = async (req, res) => {
  const vetement = await vetementService.updateVetement(Number(req.params.id), req.body);
  res.json(vetement);
};

export const remove = async (req, res) => {
  await vetementService.deleteVetement(Number(req.params.id));
  res.status(204).end();
};
