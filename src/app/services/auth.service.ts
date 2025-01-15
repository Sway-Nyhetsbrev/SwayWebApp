import { inject, Injectable, signal } from '@angular/core';
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';
import { User } from '../models/user';
import { UserService } from './user.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedUser = signal<User | null>(null);
  private msalInstance: PublicClientApplication;
  userService = inject(UserService);
  router = inject(Router);

  constructor() {
    const msalConfig = {
      auth: {
        clientId: '24a98435-464a-4df8-8a2c-6a9e0bde2611',
        authority: 'https://login.microsoftonline.com/76057efc-d10d-4c1f-a7b2-f9dfbf130080',
        redirectUri: 'http://localhost:4200/'
      }
    };

    this.msalInstance = new PublicClientApplication(msalConfig);
    this.msalInstance.initialize().then(() => {
      console.log("MSAL Initialization Complete");
    }).catch(err => {
      console.error('MSAL Initialization Failed', err);
    });
  }

  // Logga in användaren och hämta användardata från backend eller skapa användaren
  async login(): Promise<void> {
    const response: AuthenticationResult = await this.msalInstance.loginPopup({ scopes: ['User.Read'] });
    console.log(response);
    const userEmail = response.account.username;
    const userName = response.account.name;
  
    try {
      if (userEmail) {
        // Försök att hämta användaren
        const data = await this.userService.getOneUser(userEmail).toPromise().catch((error: HttpErrorResponse) => {
          if (error.status === 404) {
            // Hantera 404-fel, användaren finns inte
            console.log('User not found, creating new user...');
            return null;
          } else {
            // Hantera andra typer av fel (t.ex. serverfel)
            console.error('An error occurred while fetching the user:', error);
            throw error;  // Kasta om felet för att hantera det på annat sätt
          }
        });
  
        if (data !== null) {
          this.loggedUser.set(data!);
          // Spara användardata i localStorage
          localStorage.setItem('loggedUser', JSON.stringify(data));
          this.router.navigate(['/latest-newsletter']);
        } else {
          const user: User = { email: userEmail, userName: userName, id: '' };
          const createdUser = await this.userService.createUser(user).toPromise();
          if (createdUser) {
            this.loggedUser.set(createdUser);
            // Spara användardata i localStorage
            localStorage.setItem('loggedUser', JSON.stringify(createdUser));
            this.router.navigate(['/latest-newsletter']);
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }
  // Logga ut användaren
  logout() {
    const account = this.msalInstance.getAllAccounts()[0];
    if (account) {
      this.msalInstance.logoutPopup({
        account: account
      }).then(() => {
        console.log('Logged out successfully');
        // Rensa localStorage vid utloggning
        localStorage.removeItem('loggedUser');
      }).catch(error => {
        console.error('Logout error:', error);
      });
    }
  }
  // Hämta den autentiserade användaren
  getAccount() {
    return this.msalInstance.getAllAccounts()[0] || null;
  }
  // Hämta användardata (senaste användaren)
  getLoggedUser(): User | null {
    if (!this.loggedUser()) {
      const storedUser = localStorage.getItem('loggedUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        if (!parsedUser.role) {
          parsedUser.role = { id: '', role: '' };
        }
        this.loggedUser.set(parsedUser);
      }
    }
    return this.loggedUser();
  }
  // Hämta åtkomsttoken
  getAccessToken(): Promise<string> {
    const request = {
      scopes: ['User.Read']
    };

    return this.msalInstance.acquireTokenSilent(request).then((response) => {
      return response.accessToken;
    }).catch(error => {
      console.error('Token acquisition failed', error);
      throw error;
    });
  }
}