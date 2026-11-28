import prisma from '../config/prisma.js';

export const findAll = async () => {
  const categories = await prisma.categorie.findMany({ select: { nom: true }, orderBy: { nom: 'asc' } });
  return categories.map(c => c.nom);
};
