import * as vetementRepository from '../repositories/vetement.repository.js';

export const getVetements = async (categorie) => {
    if (!categorie) {
        return await vetementRepository.findAll();
    }
    return await vetementRepository.findAllByCategorie(categorie);
};

export const getVetementById = async (id) => {
    if(id <= 0 || !Number.isInteger(id) || !id) {
        return null;
    }
    return await vetementRepository.findById(id) ?? null;
}