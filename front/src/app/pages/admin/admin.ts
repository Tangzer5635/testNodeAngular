import { Component, inject, signal } from '@angular/core';
import { VetementService } from '../../services/vetement';
import { Vetement } from '../../models/vetement';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-admin',
  imports: [CurrencyPipe],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private vetementService = inject(VetementService);
  protected vetements = signal<Vetement[]>([]);

  constructor() {
    this.vetementService.getAll().subscribe(data => this.vetements.set(data));
  }

  editVetement  (id: number, updatedVetement: Vetement) {
    this.vetementService.update(id, updatedVetement).subscribe({
      next: (data) => {
        const updatedVetements = this.vetements().map(vetement =>
          vetement.id === id ? data : vetement
        );
        this.vetements.set(updatedVetements);
      },
      error: err => {
        console.error('Error updating vetement:', err);
      }
    });
  }

  deleteVetement(id: number) {
    this.vetementService.delete(id).subscribe({
      next: () => {
        const updatedVetements = this.vetements().filter(vetement => vetement.id !== id);
        this.vetements.set(updatedVetements);
      },
      error: err => {
        console.error('Error deleting vetement:', err);
      }
    }); 
  }
}