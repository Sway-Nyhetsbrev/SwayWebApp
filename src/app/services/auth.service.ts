import { Injectable } from '@angular/core';
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private msalInstance: PublicClientApplication;

  constructor() {
    // Definiera MSAL-konfigurationen direkt här
    const msalConfig = {
      auth: {
        clientId: '24a98435-464a-4df8-8a2c-6a9e0bde2611',  // Ersätt med din faktiska klient-ID
        authority: 'https://login.microsoftonline.com/76057efc-d10d-4c1f-a7b2-f9dfbf130080',  // Ersätt med din faktiska tenant-ID
        redirectUri: 'http://localhost:4200'  // Ersätt med din redirect URI
      }
    };

    this.msalInstance = new PublicClientApplication(msalConfig);
    
    this.msalInstance.initialize().then(() => {
      console.log("MSAL Initialization Complete");
    }).catch(err => {
      console.error('MSAL Initialization Failed', err);
    });
  }

  // Logga in användaren
  login() {
    this.msalInstance.loginPopup({
      scopes: ['User.Read']
    }).then((response: AuthenticationResult) => {
      console.log('Login success:', response);
    }).catch(error => {
      console.error('Login error:', error);
    });
  }

  // Logga ut användaren
  logout() {
    const account = this.msalInstance.getAllAccounts()[0];
    if (account) {
      this.msalInstance.logoutPopup({
        account: account
      }).then(() => {
        console.log('Logged out successfully');
      }).catch(error => {
        console.error('Logout error:', error);
      });
    }
  }

  // Hämta den autentiserade användaren
  getAccount(): AccountInfo | null {
    return this.msalInstance.getAllAccounts()[0] || null;
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