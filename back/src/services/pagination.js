import { ValidationError } from '../errors/ValidationError.js';

const entier = (valeur, defaut, min, max, message) => {
  if (valeur === undefined || valeur === '') {
    return defaut;
  }
  const nombre = Number(valeur);
  if (!Number.isInteger(nombre) || nombre < min || nombre > max) {
    throw new ValidationError(message);
  }
  return nombre;
};

export const lirePagination = ({ page, parPage }, defaut) => {
  const numero = entier(page, 1, 1, 100000, 'La page doit être un nombre entier à partir de 1');
  const taille = entier(parPage, defaut, 1, 100, 'Le nombre par page doit être compris entre 1 et 100');
  return { limite: taille, decalage: (numero - 1) * taille };
};
