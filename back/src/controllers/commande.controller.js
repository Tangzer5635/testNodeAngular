import * as commandeService from '../services/commande.service.js';

export const passer = async (req, res) => {
  const commande = await commandeService.passerCommande(req.body);
  res.status(201).json(commande);
};

export const getAll = async (req, res) => {
  const commandes = await commandeService.getCommandes({ statut: req.query.statut });
  res.json(commandes);
};

export const changerStatut = async (req, res) => {
  const commande = await commandeService.changerStatut(Number(req.params.id), req.body?.statut);
  res.json(commande);
};
