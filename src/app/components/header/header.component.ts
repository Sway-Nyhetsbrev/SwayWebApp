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
  userService = inject(UserService)
  router = inject(Router)
  user = signal<User | null>(null); 
  

  ngOnInit() {
    this.checkLoginStatus();
  }

  login() {
    this.authService.login().then(() => {
      this.checkLoginStatus();
      if (this.isLoggedIn) {

        const loggedUser = this.authService.loggedUser();
        this.user.set(loggedUser);

        if (loggedUser) {
          this.userService.createUser(loggedUser).subscribe({
            next: (data: User | undefined) => {
              console.log('User signed in successfully:', data);
              this.router.navigate(['/latest-newsletter']);
            },
            error: (err) => {
              console.error('Error signing in user:', err);
            }
          });
        }
      }
    }).catch(err => {
      console.error('Login failed', err);
    });
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate([''])
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = !!this.authService.getAccount();
  }
}
