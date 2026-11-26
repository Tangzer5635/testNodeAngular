import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AdminCommandes } from './admin-commandes';
import { Commande, CompteursCommandes } from '../../models/commande';
import { enFrancais } from '../../testing/francais';

const commande = (id: number): Commande => ({
  id, utilisateurId: null, nomClient: `Client ${id}`, email: `c${id}@test.fr`, adresse: 'Lyon', total: 19.99,
  statut: 'en_attente', creeLe: '2026-11-20T10:00:00Z',
  lignes: [{ vetementId: 1, nom: 'T-shirt blanc classique', taille: 'M', prixUnitaire: 19.99, quantite: 1 }],
});

const COMPTEURS: CompteursCommandes = { en_attente: 57, expediee: 2738, annulee: 205, total: 3000 };

const ouvrir = async (url = '/admin/commandes') => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'admin/commandes', component: AdminCommandes }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      enFrancais,
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  const http = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  return { harness, http, router, page: harness.routeNativeElement as HTMLElement };
};

const repondre = (http: HttpTestingController, total: number, liste: Commande[], compteurs = COMPTEURS): TestRequest => {
  const requete = http.expectOne(r => r.url.endsWith('/commandes'));
  requete.flush(liste, { headers: { 'X-Total-Count': String(total) } });
  http.expectOne(r => r.url.endsWith('/commandes/compteurs')).flush(compteurs);
  return requete;
};

const attendre = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const bouton = (page: HTMLElement, selecteur: string, texte: string) =>
  [...page.querySelectorAll<HTMLButtonElement>(selecteur)].find(b => b.textContent?.includes(texte))!;

describe('Admin des commandes', () => {
  it('affiche les commandes en attente, leur nombre et la première page', async () => {
    const { harness, http, page } = await ouvrir();
    const requete = repondre(http, 57, Array.from({ length: 20 }, (_, i) => commande(57 - i)));
    await harness.fixture.whenStable();
    expect(requete.request.params.get('statut')).toBe('en_attente');
    expect(requete.request.params.get('page')).toBe('1');
    expect(page.querySelector('.compteur')?.textContent).toContain('57 commandes');
    expect(page.querySelectorAll('article').length).toBe(20);
    expect(page.querySelector('.pagination span')?.textContent).toContain('Page 1 sur 3');
  });

  it('affiche le nombre de commandes sur chaque statut', async () => {
    const { harness, http, page } = await ouvrir();
    repondre(http, 57, [commande(57)]);
    await harness.fixture.whenStable();
    expect(bouton(page, '.statuts button', 'En attente').textContent).toContain('57');
    expect(bouton(page, '.statuts button', 'Expédiées').textContent).toContain('2738');
    expect(bouton(page, '.statuts button', 'Toutes').textContent).toContain('3000');
  });

  it("passe à la page suivante et garde la page dans l'adresse", async () => {
    const { harness, http, page, router } = await ouvrir();
    repondre(http, 57, [commande(57)]);
    await harness.fixture.whenStable();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    bouton(page, '.pagination button', 'Suivante').click();
    await harness.fixture.whenStable();
    const requete = repondre(http, 57, [commande(37)]);
    await harness.fixture.whenStable();
    expect(requete.request.params.get('page')).toBe('2');
    expect(router.url).toContain('page=2');
    expect(page.querySelector('.pagination span')?.textContent).toContain('Page 2 sur 3');
  });

  it('revient à la page 1 quand on change de statut', async () => {
    const { harness, http, page } = await ouvrir('/admin/commandes?page=3');
    repondre(http, 57, [commande(17)]);
    await harness.fixture.whenStable();
    bouton(page, '.statuts button', 'Toutes').click();
    await harness.fixture.whenStable();
    const requete = repondre(http, 3000, [commande(3000)]);
    expect(requete.request.params.get('page')).toBe('1');
    expect(requete.request.params.has('statut')).toBe(false);
  });

  it('lance la recherche après la saisie', async () => {
    const { harness, http, page, router } = await ouvrir('/admin/commandes?page=2');
    repondre(http, 57, [commande(37)]);
    await harness.fixture.whenStable();
    const champ = page.querySelector<HTMLInputElement>('input.recherche')!;
    champ.value = 'dupont';
    champ.dispatchEvent(new Event('input'));
    http.expectNone(r => r.url.endsWith('/commandes'));
    await attendre(350);
    await harness.fixture.whenStable();
    const requete = repondre(http, 2, [commande(12), commande(4)]);
    await harness.fixture.whenStable();
    expect(requete.request.params.get('recherche')).toBe('dupont');
    expect(requete.request.params.get('page')).toBe('1');
    expect(router.url).toContain('recherche=dupont');
    expect(page.querySelector('.compteur')?.textContent).toContain('2 commandes');
  });

  it("reprend les filtres présents dans l'adresse", async () => {
    const { harness, http, page } = await ouvrir('/admin/commandes?statut=expediee&recherche=manteau&du=2025-12-01&au=2025-12-31&tri=montant_desc');
    const requete = repondre(http, 1, [commande(132)]);
    await harness.fixture.whenStable();
    const params = requete.request.params;
    expect([params.get('statut'), params.get('recherche'), params.get('du'), params.get('au'), params.get('tri')])
      .toEqual(['expediee', 'manteau', '2025-12-01', '2025-12-31', 'montant_desc']);
    const compteurs = http.match(() => true);
    expect(compteurs.length).toBe(0);
    expect(page.querySelector<HTMLInputElement>('input.recherche')!.value).toBe('manteau');
    expect(page.querySelector<HTMLSelectElement>('.outils select')!.value).toBe('montant_desc');
    expect(bouton(page, '.statuts button', 'Expédiées').classList).toContain('actif');
  });

  it('envoie la période et le tri choisis', async () => {
    const { harness, http, page } = await ouvrir();
    repondre(http, 57, [commande(57)]);
    await harness.fixture.whenStable();
    const [du] = page.querySelectorAll<HTMLInputElement>('.outils input[type=date]');
    du.value = '2026-01-01';
    du.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();
    expect(repondre(http, 10, [commande(57)]).request.params.get('du')).toBe('2026-01-01');
    await harness.fixture.whenStable();
    const tri = page.querySelector<HTMLSelectElement>('.outils select')!;
    tri.value = 'montant_asc';
    tri.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();
    const requete = repondre(http, 10, [commande(57)]);
    expect(requete.request.params.get('tri')).toBe('montant_asc');
    expect(requete.request.params.get('du')).toBe('2026-01-01');
  });

  it('efface les filtres mais garde le statut', async () => {
    const { harness, http, page } = await ouvrir('/admin/commandes?statut=annulee&recherche=zzz&tri=ancien');
    repondre(http, 0, [], { en_attente: 0, expediee: 0, annulee: 0, total: 0 });
    await harness.fixture.whenStable();
    expect(page.querySelector('.vide')?.textContent).toContain('Aucune commande ne correspond à ces filtres.');
    bouton(page, '.outils .effacer', 'Effacer').click();
    await harness.fixture.whenStable();
    const requete = repondre(http, 205, [commande(9)]);
    expect(requete.request.params.get('statut')).toBe('annulee');
    expect(requete.request.params.has('recherche')).toBe(false);
    expect(requete.request.params.get('tri')).toBe('recent');
    await harness.fixture.whenStable();
    expect(page.querySelector('.outils .effacer')).toBeNull();
  });

  it("n'affiche pas de pagination quand tout tient sur une page", async () => {
    const { harness, http, page } = await ouvrir();
    repondre(http, 3, [commande(3), commande(2), commande(1)]);
    await harness.fixture.whenStable();
    expect(page.querySelector('.pagination')).toBeNull();
  });

  it("affiche l'erreur renvoyée par le serveur", async () => {
    const { harness, http, page } = await ouvrir('/admin/commandes?du=2026-02-30');
    http.expectOne(r => r.url.endsWith('/commandes'))
      .flush({ message: 'La date « du » doit être au format AAAA-MM-JJ' }, { status: 400, statusText: 'Bad Request' });
    await harness.fixture.whenStable();
    expect(page.querySelector('.erreur')?.textContent).toContain('AAAA-MM-JJ');
  });
});
