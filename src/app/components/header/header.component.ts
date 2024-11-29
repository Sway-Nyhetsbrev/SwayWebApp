import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

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
  userService = inject(UserService);
  router = inject(Router);
  user = signal<User | null>(null);

  ngOnInit() {
    this.checkLoginStatus();
  }
  
  checkLoginStatus() {
    this.isLoggedIn = !!this.authService.getAccount();
    if (this.isLoggedIn) {
      const loggedUser = this.authService.getLoggedUser();
      if (loggedUser) {
        this.user.set(loggedUser);
        console.log("User in header:",this.user())
      }
    }
  }

  login() {
    this.authService.login().then(() => {
      this.checkLoginStatus();
    }).catch(err => {
      console.error('Login failed', err);
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['']);
    this.checkLoginStatus();
  }
}