import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User, UserUpdateModel } from '../models/user';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  httpClient = inject(HttpClient)
  users = signal<User[] | undefined>(undefined);

  // Skapa användare - returnerar ett Observable
  createUser(user: User): Observable<User | undefined> {
    return this.httpClient.post<User>('https://userprovider20250119171348.azurewebsites.net/api/users/Create', user)
      .pipe(
        catchError((error) => {
          console.error('Error creating user:', error);
          return throwError(() => new Error('Failed to create user'));
        })
      );
  }

  // Hämta en användare
  getOneUser(userEmail: string): Observable<User | null> {
    return this.httpClient.get<User>(`https://userprovider20250119171348.azurewebsites.net/api/users/GetOneUser/${userEmail}`)
  }

  // Hämta alla användare
  getAllUsers() {
    return this.httpClient.get<User[]>('https://userprovider20250119171348.azurewebsites.net/api/users/GetAllUsers')
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
  updateUser(updatedUser: UserUpdateModel): Observable<User | null> {
    return this.httpClient.put<any>(`https://userprovider20250119171348.azurewebsites.net/api/users/UpdateUser`, updatedUser)
  }

  //Remove User
  removeUser(userEmail: string) {
    return this.httpClient.delete<User>(`https://userprovider20250119171348.azurewebsites.net/api/users/DeleteUser?userEmail=${userEmail}`)
  }
}