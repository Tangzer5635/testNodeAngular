import prisma from '../config/prisma.js';

const PUBLIC = { id: true, email: true, nom: true, role: true };

export const findByEmail = (email) =>
  prisma.utilisateur.findUnique({
    where: { email },
    select: { ...PUBLIC, motDePasseHash: true },
  });

export const create = async ({ email, nom, motDePasseHash }) => {
  try {
    return await prisma.utilisateur.create({
      data: { email, nom, motDePasseHash, role: 'client' },
      select: PUBLIC,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return undefined;
    }
    throw error;
  }
};
