import * as categorieRepository from "../repositories/categorie.repository.js";

export const getCategories = async () => {
    return await categorieRepository.findAll();
};
