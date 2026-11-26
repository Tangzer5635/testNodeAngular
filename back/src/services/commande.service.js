import { transaction } from '../config/db.js';
import * as commandeRepository from '../repositories/commande.repository.js';
import { ValidationError } from '../errors/ValidationError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { ConflictError } from '../errors/ConflictError.js';

export const QUANTITE_MAX = 10;

const TRANSITIONS = {
  en_attente: ['expediee', 'annulee'],
  expediee: [],
  annulee: [],
};

const LIBELLES = { en_attente: 'en attente', expediee: 'expédiée', annulee: 'annulée' };

const estTexte = (valeur, min, max) =>
  typeof valeur === 'string' && valeur.trim().length >= min && valeur.trim().length <= max;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validerClient = (client) => {
  if (!client || typeof client !== 'object') {
    throw new ValidationError('Les informations du client sont obligatoires');
  }
  if (!estTexte(client.nom, 2, 100)) {
    throw new ValidationError('Le nom doit faire entre 2 et 100 caractères');
  }
  if (!estTexte(client.email, 3, 200) || !EMAIL.test(client.email.trim())) {
    throw new ValidationError("L'adresse email n'est pas valide");
  }
  if (!estTexte(client.adresse, 5, 300)) {
    throw new ValidationError("L'adresse de livraison doit faire entre 5 et 300 caractères");
  }
  return { nom: client.nom.trim(), email: client.email.trim(), adresse: client.adresse.trim() };
};

const validerLignes = (lignes) => {
  if (!Array.isArray(lignes) || lignes.length === 0 || lignes.length > 50) {
    throw new ValidationError('Le panier doit contenir entre 1 et 50 lignes');
  }
  const regroupees = new Map();
  for (const l of lignes) {
    if (!l || !Number.isInteger(l.vetementId) || l.vetementId <= 0 ||
        typeof l.taille !== 'string' || l.taille === '' ||
        !Number.isInteger(l.quantite) || l.quantite < 1) {
      throw new ValidationError('Ligne de panier invalide');
    }
    const cle = `${l.vetementId}|${l.taille}`;
    const quantite = (regroupees.get(cle)?.quantite ?? 0) + l.quantite;
    if (quantite > QUANTITE_MAX) {
      throw new ValidationError(`${QUANTITE_MAX} exemplaires maximum par article et par taille`);
    }
    regroupees.set(cle, { vetementId: l.vetementId, taille: l.taille, quantite });
  }
  return [...regroupees.values()].sort((a, b) => a.vetementId - b.vetementId || a.taille.localeCompare(b.taille));
};

export const passerCommande = async (data, utilisateur) => {
  const client = validerClient(
    utilisateur ? { ...data?.client, email: utilisateur.email } : data?.client
  );
  const lignes = validerLignes(data?.lignes);

  return transaction(async (db) => {
    const lignesCompletes = [];
    for (const ligne of lignes) {
      const stock = await commandeRepository.verrouillerStock(db, ligne.vetementId, ligne.taille);
      if (!stock) {
        throw new ConflictError(`Un article de ton panier n'existe plus (taille ${ligne.taille})`);
      }
      if (stock.stock < ligne.quantite) {
        throw new ConflictError(
          stock.stock === 0
            ? `« ${stock.nom} » en taille ${ligne.taille} est épuisé`
            : `Il ne reste que ${stock.stock} « ${stock.nom} » en taille ${ligne.taille}`
        );
      }
      await commandeRepository.retirerDuStock(db, ligne.vetementId, ligne.taille, ligne.quantite);
      lignesCompletes.push({ ...ligne, nom: stock.nom, prix: stock.prix });
    }
    return commandeRepository.create(db, client, lignesCompletes, utilisateur?.sub ?? null);
  });
};

export const getCommandesDe = async (utilisateurId) => commandeRepository.findAll({ utilisateurId });

export const getCommandes = async ({ statut } = {}) => {
  if (statut !== undefined && !Object.hasOwn(TRANSITIONS, statut)) {
    throw new ValidationError(`Statut inconnu : ${statut}`);
  }
  return commandeRepository.findAll({ statut });
};

export const changerStatut = async (id, statut) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new NotFoundError(`Aucune commande avec l'id ${id}`);
  }
  if (typeof statut !== 'string' || !Object.hasOwn(TRANSITIONS, statut)) {
    throw new ValidationError(`Statut inconnu. Valeurs acceptées : ${Object.keys(TRANSITIONS).join(', ')}`);
  }

  return transaction(async (db) => {
    const commande = await commandeRepository.verrouillerCommande(db, id);
    if (!commande) {
      throw new NotFoundError(`Aucune commande avec l'id ${id}`);
    }
    if (!TRANSITIONS[commande.statut].includes(statut)) {
      throw new ConflictError(
        `Une commande ${LIBELLES[commande.statut]} ne peut pas passer à « ${LIBELLES[statut]} »`
      );
    }
    if (statut === 'annulee') {
      await commandeRepository.remettreEnStock(db, id);
    }
    await commandeRepository.changerStatut(db, id, statut);
    return commandeRepository.findById(id, db);
  });
};
