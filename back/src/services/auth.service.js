import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ValidationError } from '../errors/ValidationError.js';
import * as utilisateurRepository from '../repositories/utilisateur.repository.js';

export const connexion = async (email, motDePasse) => {
    if (!email || !motDePasse || typeof email !== 'string' || typeof motDePasse !== 'string') {
        throw new ValidationError('Email et mot de passe sont requis');
    }
    const utilisateur = await utilisateurRepository.findByEmail(email); 
    const motDePasseValide = utilisateur && await bcrypt.compare(motDePasse, utilisateur.mot_de_passe_hash);
    if (!motDePasseValide) {
        throw new UnauthorizedError('Email ou mot de passe incorrect');
    }
    const token = jwt.sign({ sub: utilisateur.id, email: utilisateur.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN ?? '2h' });
    return { token };
}