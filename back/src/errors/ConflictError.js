// 409 Conflict : la demande est valide, mais impossible dans l'état actuel (stock insuffisant, commande déjà expédiée…)
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}
