import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ValidationError } from '../errors/ValidationError.js';
import { ConflictError } from '../errors/ConflictError.js';
import * as utilisateurRepository from '../repositories/utilisateur.repository.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normaliserEmail = (email) => email.trim().toLowerCase();

const creerJeton = (utilisateur) =>
  jwt.sign(
    { sub: utilisateur.id, email: utilisateur.email, nom: utilisateur.nom, role: utilisateur.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '2h' }
  );

export const connexion = async (email, motDePasse) => {
  if (!email || !motDePasse || typeof email !== 'string' || typeof motDePasse !== 'string') {
    throw new ValidationError('Email et mot de passe sont requis');
  }
  const utilisateur = await utilisateurRepository.findByEmail(normaliserEmail(email));
  const motDePasseValide = utilisateur && (await bcrypt.compare(motDePasse, utilisateur.motDePasseHash));
  if (!motDePasseValide) {
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }
  return { token: creerJeton(utilisateur) };
};

export const inscription = async (data) => {
  const { nom, email, motDePasse } = data ?? {};
  if (typeof nom !== 'string' || nom.trim().length < 2 || nom.trim().length > 100) {
    throw new ValidationError('Le nom doit faire entre 2 et 100 caractères');
  }
  if (typeof email !== 'string' || email.length > 200 || !EMAIL.test(email.trim())) {
    throw new ValidationError("L'adresse email n'est pas valide");
  }
  if (typeof motDePasse !== 'string' || motDePasse.length < 8 || motDePasse.length > 72) {
    throw new ValidationError('Le mot de passe doit faire entre 8 et 72 caractères');
  }
  if (!/[A-Za-z]/.test(motDePasse) || !/\d/.test(motDePasse)) {
    throw new ValidationError('Le mot de passe doit contenir au moins une lettre et un chiffre');
  }

  const utilisateur = await utilisateurRepository.create({
    nom: nom.trim(),
    email: normaliserEmail(email),
    motDePasseHash: await bcrypt.hash(motDePasse, 10),
  });
  if (!utilisateur) {
    throw new ConflictError('Un compte existe déjà avec cette adresse email');
  }
  return { token: creerJeton(utilisateur) };
};
