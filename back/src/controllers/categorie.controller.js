import * as categorieService from "../services/categorie.service.js";

export const getAll = async (req, res) => {
    try {
        const categories = await categorieService.getCategories();
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};