import * as categorieService from '../services/categorie.service.js';

export const getAll = async (req, res) => {
  const categories = await categorieService.getCategories();
  res.json(categories);
};
