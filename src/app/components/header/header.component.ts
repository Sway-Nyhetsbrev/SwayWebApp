import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

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

  ngOnInit() {
    this.checkLoginStatus();
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = !!this.authService.getAccount();
  }
}
