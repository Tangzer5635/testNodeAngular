import prisma from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.ts';

const CHAMPS = {
  id: true,
  utilisateurId: true,
  nomClient: true,
  email: true,
  adresse: true,
  total: true,
  statut: true,
  creeLe: true,
  lignes: {
    select: { vetementId: true, nom: true, taille: true, prixUnitaire: true, quantite: true },
    orderBy: { id: 'asc' },
  },
};

const versCommande = ({ total, lignes, ...commande }) => ({
  ...commande,
  total: total.toNumber(),
  lignes: lignes.map(l => ({ ...l, prixUnitaire: l.prixUnitaire.toNumber() })),
});

export const TRIS = {
  recent: [{ id: 'desc' }],
  ancien: [{ id: 'asc' }],
  montant_desc: [{ total: 'desc' }, { id: 'desc' }],
  montant_asc: [{ total: 'asc' }, { id: 'desc' }],
};

const JOUR = 24 * 60 * 60 * 1000;

const filtrer = ({ statut, utilisateurId, recherche, du, au }) => {
  const where = { statut, utilisateurId };
  if (recherche) {
    const texte = { contains: recherche, mode: 'insensitive' };
    where.OR = [{ nomClient: texte }, { email: texte }, { lignes: { some: { nom: texte } } }];
    const numero = recherche.match(/^(?:n°|#)?\s*(\d{1,9})$/i);
    if (numero) {
      where.OR.push({ id: Number(numero[1]) });
    }
  }
  if (du || au) {
    where.creeLe = {
      gte: du ? new Date(du) : undefined,
      lt: au ? new Date(new Date(au).getTime() + JOUR) : undefined,
    };
  }
  return where;
};

export const findAll = async ({ limite, decalage = 0, tri = 'recent', ...filtres } = {}) => {
  const commandes = await prisma.commande.findMany({
    where: filtrer(filtres),
    select: CHAMPS,
    orderBy: TRIS[tri],
    take: limite,
    skip: limite ? decalage : undefined,
  });
  return commandes.map(versCommande);
};

export const compter = (filtres = {}) => prisma.commande.count({ where: filtrer(filtres) });

export const compterParStatut = async ({ statut, ...filtres } = {}) => {
  const groupes = await prisma.commande.groupBy({
    by: ['statut'],
    where: filtrer(filtres),
    _count: { _all: true },
  });
  return groupes.map(g => ({ statut: g.statut, nombre: g._count._all }));
};

export const findById = async (id, db = prisma) => {
  const commande = await db.commande.findUnique({ where: { id }, select: CHAMPS });
  return commande ? versCommande(commande) : undefined;
};

export const trouverStock = (db, vetementId, taille) =>
  db.stock.findUnique({
    where: { vetementId_taille: { vetementId, taille } },
    select: { quantite: true, vetement: { select: { nom: true, prix: true } } },
  });

export const retirerDuStock = async (db, vetementId, taille, quantite) => {
  const { count } = await db.stock.updateMany({
    where: { vetementId, taille, quantite: { gte: quantite } },
    data: { quantite: { decrement: quantite } },
  });
  return count === 1;
};

export const create = async (db, client, lignes, utilisateurId) => {
  const total = lignes.reduce((somme, l) => somme.plus(l.prix.times(l.quantite)), new Prisma.Decimal(0));
  const commande = await db.commande.create({
    data: {
      utilisateurId,
      nomClient: client.nom,
      email: client.email,
      adresse: client.adresse,
      total,
      lignes: {
        create: lignes.map(l => ({
          vetementId: l.vetementId,
          nom: l.nom,
          taille: l.taille,
          prixUnitaire: l.prix,
          quantite: l.quantite,
        })),
      },
    },
    select: { id: true, total: true },
  });
  return { id: commande.id, total: commande.total.toNumber() };
};

export const trouverStatut = (db, id) => db.commande.findUnique({ where: { id }, select: { statut: true } });

export const changerStatut = async (db, id, ancien, nouveau) => {
  const { count } = await db.commande.updateMany({ where: { id, statut: ancien }, data: { statut: nouveau } });
  return count === 1;
};

export const remettreEnStock = async (db, commandeId) => {
  const lignes = await db.ligneCommande.findMany({
    where: { commandeId, vetementId: { not: null } },
    select: { vetementId: true, taille: true, quantite: true },
  });
  for (const { vetementId, taille, quantite } of lignes) {
    await db.stock.updateMany({ where: { vetementId, taille }, data: { quantite: { increment: quantite } } });
  }
};
