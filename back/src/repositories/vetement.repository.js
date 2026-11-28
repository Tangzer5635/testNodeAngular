import prisma from '../config/prisma.js';

const CHAMPS = {
  id: true,
  nom: true,
  prix: true,
  description: true,
  image: true,
  categorie: { select: { nom: true } },
  stocks: { select: { taille: true, quantite: true }, orderBy: { ordre: 'asc' } },
};

const versVetement = ({ prix, categorie, stocks, ...vetement }) => ({
  ...vetement,
  prix: prix.toNumber(),
  categorie: categorie.nom,
  tailles: stocks.map(s => ({ taille: s.taille, stock: s.quantite })),
});

export const TRIS = {
  recent: [{ id: 'desc' }],
  prix_asc: [{ prix: 'asc' }, { id: 'desc' }],
  prix_desc: [{ prix: 'desc' }, { id: 'desc' }],
  nom: [{ nom: 'asc' }, { id: 'desc' }],
};

const filtrer = ({ categorie, recherche }) => {
  const where = {};
  if (categorie) {
    where.categorie = { nom: categorie };
  }
  if (recherche) {
    where.OR = [
      { nom: { contains: recherche, mode: 'insensitive' } },
      { description: { contains: recherche, mode: 'insensitive' } },
    ];
  }
  return where;
};

const versStocks = (tailles) => tailles.map((t, i) => ({ taille: t.taille, quantite: t.stock, ordre: i + 1 }));

export const findAll = async ({ tri = 'recent', limite, decalage = 0, ...filtres } = {}) => {
  const vetements = await prisma.vetement.findMany({
    where: filtrer(filtres),
    select: CHAMPS,
    orderBy: TRIS[tri],
    take: limite,
    skip: limite ? decalage : undefined,
  });
  return vetements.map(versVetement);
};

export const compter = (filtres = {}) => prisma.vetement.count({ where: filtrer(filtres) });

export const findById = async (id) => {
  const vetement = await prisma.vetement.findUnique({ where: { id }, select: CHAMPS });
  return vetement ? versVetement(vetement) : undefined;
};

export const create = async ({ nom, prix, description, image, tailles, categorie }) => {
  const vetement = await prisma.vetement.create({
    data: {
      nom,
      prix,
      description,
      image,
      categorie: { connect: { nom: categorie } },
      stocks: { create: versStocks(tailles) },
    },
    select: { id: true },
  });
  return vetement.id;
};

export const update = (id, { nom, prix, description, image, tailles, categorie }) =>
  prisma.$transaction(async (tx) => {
    const existe = await tx.vetement.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      return 0;
    }
    await tx.vetement.update({
      where: { id },
      data: {
        nom,
        prix,
        description,
        image,
        categorie: { connect: { nom: categorie } },
        stocks: { deleteMany: {}, create: versStocks(tailles) },
      },
    });
    return 1;
  });

export const remove = async (id) => {
  const { count } = await prisma.vetement.deleteMany({ where: { id } });
  return count;
};
