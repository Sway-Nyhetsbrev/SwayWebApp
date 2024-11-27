import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  isLoggedIn: boolean = false;

  authService = inject(AuthService);
  router = inject(Router)

  ngOnInit() {
    this.checkLoginStatus();
  }

  login() {
    this.authService.login().then(() => {
      this.checkLoginStatus();
      if (this.isLoggedIn) {
        this.router.navigate(['/newsletter']);
      }
    }).catch(err => {
      console.error('Login failed', err);
    });
  }

  logout() {
    this.authService.logout();
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = !!this.authService.getAccount();
  }
}
