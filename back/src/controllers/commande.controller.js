import * as commandeService from '../services/commande.service.js';

export const passer = async (req, res) => {
  const commande = await commandeService.passerCommande(req.body, req.utilisateur);
  res.status(201).json(commande);
};

export const getMiennes = async (req, res) => {
  const commandes = await commandeService.getCommandesDe(req.utilisateur.sub);
  res.json(commandes);
};

export const getAll = async (req, res) => {
  const { statut, page, tri, recherche, du, au } = req.query;
  const { commandes, total } = await commandeService.getCommandes({ statut, page, tri, recherche, du, au });
  res.set('X-Total-Count', String(total));
  res.json(commandes);
};

export const getCompteurs = async (req, res) => {
  const { recherche, du, au } = req.query;
  res.json(await commandeService.getCompteurs({ recherche, du, au }));
};

export const changerStatut = async (req, res) => {
  const commande = await commandeService.changerStatut(Number(req.params.id), req.body?.statut);
  res.json(commande);
};
