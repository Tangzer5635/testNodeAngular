import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  page = input.required<number>();
  nbPages = input.required<number>();
  changer = output<number>();

  protected numeros = computed(() => {
    const dernier = this.nbPages();
    const actuelle = this.page();
    const gardes = [...new Set([1, actuelle - 1, actuelle, actuelle + 1, dernier])]
      .filter(n => n >= 1 && n <= dernier)
      .sort((a, b) => a - b);
    const numeros: (number | null)[] = [];
    for (const n of gardes) {
      const precedent = numeros.at(-1);
      if (typeof precedent === 'number' && n - precedent === 2) {
        numeros.push(precedent + 1);
      } else if (typeof precedent === 'number' && n - precedent > 2) {
        numeros.push(null);
      }
      numeros.push(n);
    }
    return numeros;
  });

  protected aller(page: number) {
    if (page < 1 || page > this.nbPages() || page === this.page()) {
      return;
    }
    this.changer.emit(page);
    window.scrollTo({ top: 0 });
  }
}
