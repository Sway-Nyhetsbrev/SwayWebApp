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
      
    let loggedUser = this.authService.loggedUser();
    
    if (!loggedUser) {
      const storedUser = localStorage.getItem('loggedUser');
      if (storedUser) {
        loggedUser = JSON.parse(storedUser);
      }
    }

    if (loggedUser?.role?.role === 'Admin') {
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}