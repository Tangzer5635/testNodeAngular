import * as vetementService from '../services/vetement.service.js';

export const getAll = async (req, res) => {
  const { categorie, recherche, tri, page, parPage } = req.query;
  const { vetements, total } = await vetementService.getVetements({ categorie, recherche, tri, page, parPage });
  res.set('X-Total-Count', String(total));
  res.json(vetements);
};

export const getById = async (req, res) => {
  const vetement = await vetementService.getVetementById(Number(req.params.id));
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
