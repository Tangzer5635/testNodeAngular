import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected auth = inject(AuthService);
  private router = inject(Router);

  protected nomBoutique = 'NodeAngular';
  protected annee = new Date().getFullYear();

  protected seDeconnecter() {
    this.auth.deconnexion();
    this.router.navigate(['/']);
  }
}