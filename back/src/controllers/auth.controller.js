import * as authService from '../services/auth.service.js';

export const login = async (req, res) => {
  const { email, motDePasse } = req.body ?? {};
  const resultat = await authService.connexion(email, motDePasse);
  res.json(resultat);
};