// Utilisé par `ng build` (production, image Docker) :
// URL relatives, nginx transmet /api et /images au conteneur du back.
export const environment = {
  apiUrl: '/api',
  imagesUrl: '/images',
};
