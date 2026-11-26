import * as vetementService from "../services/vetement.service.js";

export const getAll = async (req, res) => {
    try {
        const vetements = await vetementService.getVetements(req.query.categorie);
        res.json(vetements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const getById = async (req, res) => {
    try {
        const vetement = await vetementService.getVetementById(Number(req.params.id));
        if (!vetement) {
            return res.status(404).json({ message: 'Vêtement non trouvé' });
        }
        res.json(vetement);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}