import * as authService from '../services/auth.service.js';

export const login = async (req, res) => {
  const { email, motDePasse } = req.body ?? {};
  const resultat = await authService.connexion(email, motDePasse);
  res.json(resultat);
};

export const inscription = async (req, res) => {
  const resultat = await authService.inscription(req.body);
  res.status(201).json(resultat);
};
