import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      
    // Försök att hämta användarens roll från authService eller från localStorage
    let loggedUser = this.authService.loggedUser();
    
    if (!loggedUser) {
      // Om det inte finns någon användare i authService, försök att hämta från localStorage
      const storedUser = localStorage.getItem('loggedUser');
      if (storedUser) {
        loggedUser = JSON.parse(storedUser);
      }
    }

    // Om användaren har rollen 'Admin', tillåt åtkomst, annars omdirigera
    if (loggedUser?.role?.role === 'Admin') {
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}