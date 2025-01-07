import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnInit, signal } from '@angular/core';
import { User } from '../models/user';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  httpClient = inject(HttpClient)
  users = signal<User[] | undefined>(undefined);

  // Skapa användare - returnerar ett Observable
  createUser(user: User): Observable<User | undefined> {
    return this.httpClient.post<User>('https://localhost:7270/api/Users/Create', user)
      .pipe(
        catchError((error) => {
          console.error('Error creating user:', error);
          return throwError(() => new Error('Failed to create user'));
        })
      );
  }

  // Hämta en användare
  getOneUser(userEmail: string): Observable<User | null> {
    return this.httpClient.get<User>(`https://localhost:7270/api/Users/GetOneUser/${userEmail}`)
  }

  // Hämta alla användare
  getAllUsers() {
    this.httpClient.get<User[] | undefined>('https://localhost:7270/api/Users/GetAllUsers')
      .subscribe({
        next: (fetchedUsers) => {
          this.users.set(fetchedUsers);
        },
        error: (error) => {
          console.error('Error fetching all users:', error);
        }
      });
  }

  // Uppdatera användare
  updateUser(userId: string, user: User): Observable<User | null> {
    return this.httpClient.put<User>(`https://localhost:7270/api/Users/UpdateUser/${userId}`, user)
  }
}