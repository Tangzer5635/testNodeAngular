import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

@Component({
  imports: [Pagination],
  template: '<app-pagination [page]="page()" [nbPages]="nbPages()" (changer)="choisie = $event" />',
})
class Hote {
  page = signal(1);
  nbPages = signal(1);
  choisie: number | null = null;
}

const afficher = async (page: number, nbPages: number) => {
  const fixture = TestBed.createComponent(Hote);
  fixture.componentInstance.page.set(page);
  fixture.componentInstance.nbPages.set(nbPages);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const contenu = () => [...element.querySelectorAll('.numeros > *')].map(e => e.textContent!.trim());
  const bouton = (texte: string) => [...element.querySelectorAll('button')].find(b => b.textContent!.trim() === texte)!;
  return { fixture, element, contenu, bouton };
};

describe('Pagination', () => {
  beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));

  it("ne s'affiche pas quand il n'y a qu'une page", async () => {
    const { element } = await afficher(1, 1);
    expect(element.querySelector('nav')).toBeNull();
  });

  it('montre toutes les pages quand il y en a peu', async () => {
    const { contenu } = await afficher(2, 4);
    expect(contenu()).toEqual(['1', '2', '3', '4']);
  });

  it('résume les longues listes autour de la page courante', async () => {
    const { contenu } = await afficher(75, 150);
    expect(contenu()).toEqual(['1', '…', '74', '75', '76', '…', '150']);
  });

  it('marque la page courante', async () => {
    const { element } = await afficher(3, 10);
    expect(element.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('3');
  });

  it('bloque Précédente sur la première page et Suivante sur la dernière', async () => {
    const premiere = await afficher(1, 5);
    expect(premiere.bouton('Précédente').disabled).toBe(true);
    expect(premiere.bouton('Suivante').disabled).toBe(false);
    const derniere = await afficher(5, 5);
    expect(derniere.bouton('Suivante').disabled).toBe(true);
  });

  it('envoie la page choisie et remonte en haut', async () => {
    const { fixture, bouton } = await afficher(1, 150);
    bouton('150').click();
    expect(fixture.componentInstance.choisie).toBe(150);
    expect(window.scrollTo).toHaveBeenCalled();
    bouton('Suivante').click();
    expect(fixture.componentInstance.choisie).toBe(2);
  });
});
