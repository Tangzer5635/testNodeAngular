import { Component, inject, signal } from '@angular/core';
import { VetementService } from '../../services/vetement';
import { Vetement } from '../../models/vetement';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-catalogue',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
})
export class Catalogue {
  private vetementService = inject(VetementService);
  protected vetements = signal<Vetement[]>([]);

  constructor() {
    this.vetementService.getAll().subscribe(data => this.vetements.set(data));
  }
}