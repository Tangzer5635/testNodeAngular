import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { enFrancais } from '../../testing/francais';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Fiche } from './fiche';
import { PanierService } from '../../services/panier';
import { Vetement } from '../../models/vetement';

const jean: Vetement = {
  id: 3, nom: 'Jean slim bleu', description: 'Coupe moderne', prix: 49.99, image: 'jean.jpg', categorie: 'pantalons',
  tailles: [{ taille: '36', stock: 0 }, { taille: '40', stock: 7 }, { taille: '44', stock: 2 }],
};

const afficher = async (vetement: Vetement) => {
  localStorage.clear();
  TestBed.configureTestingModule({
    imports: [Fiche],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      enFrancais,
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: String(vetement.id) }) } } },
    ],
  });
  const fixture = TestBed.createComponent(Fiche);
  TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith(`/vetements/${vetement.id}`)).flush(vetement);
  await fixture.whenStable();
  return { fixture, page: fixture.nativeElement as HTMLElement };
};

const bouton = (page: HTMLElement, texte: string) =>
  [...page.querySelectorAll<HTMLButtonElement>('.tailles button')].find(b => b.textContent?.trim() === texte)!;

describe('Fiche produit', () => {
  it('affiche le nom et le prix', async () => {
    const { page } = await afficher(jean);
    expect(page.querySelector('h1')?.textContent).toContain('Jean slim bleu');
    expect(page.querySelector('.prix')?.textContent).toContain('49,99');
  });

  it('désactive une taille épuisée', async () => {
    const { page } = await afficher(jean);
    expect(bouton(page, '36').disabled).toBe(true);
    expect(bouton(page, '40').disabled).toBe(false);
  });

  it("le bouton d'ajout attend le choix d'une taille", async () => {
    const { page } = await afficher(jean);
    const ajouter = page.querySelector<HTMLButtonElement>('button.ajouter')!;
    expect(ajouter.disabled).toBe(true);
    expect(ajouter.textContent).toContain('Choisis une taille');
  });

  it('prévient quand il reste peu de stock', async () => {
    const { fixture, page } = await afficher(jean);
    bouton(page, '44').click();
    await fixture.whenStable();
    expect(page.querySelector('.stock-faible')?.textContent).toContain('Plus que 2');
  });

  it("n'ajoute jamais plus que le stock au panier", async () => {
    const { fixture, page } = await afficher(jean);
    bouton(page, '44').click();
    await fixture.whenStable();
    const ajouter = page.querySelector<HTMLButtonElement>('button.ajouter')!;
    ajouter.click();
    await fixture.whenStable();
    ajouter.click();
    await fixture.whenStable();

    expect(TestBed.inject(PanierService).nombreArticles()).toBe(2);
    expect(ajouter.disabled).toBe(true);
    expect(ajouter.textContent).toContain('Tout le stock est dans ton panier');
  });

  it('affiche « épuisé » quand plus aucune taille n\'est disponible', async () => {
    const { page } = await afficher({ ...jean, tailles: [{ taille: 'M', stock: 0 }] });
    expect(page.querySelector('.alerte')?.textContent).toContain('épuisé');
    expect(page.querySelector('button.ajouter')).toBeNull();
  });
});
