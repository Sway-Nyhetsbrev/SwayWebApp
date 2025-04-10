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

  createUser(user: User): Observable<User | undefined> {
    return this.httpClient.post<User>('https://userprovider20250119171348.azurewebsites.net/api/users/Create', user)
      .pipe(
        catchError((error) => {
          console.error('Error creating user:', error);
          return throwError(() => new Error('Failed to create user'));
        })
      );
  }

  getOneUser(userEmail: string): Observable<User | null> {
    return this.httpClient.get<User>(`https://userprovider20250119171348.azurewebsites.net/api/users/GetOneUser/${userEmail}`)
  }

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

  updateUser(updatedUser: UserUpdateModel): Observable<User | null> {
    return this.httpClient.put<any>(`https://userprovider20250119171348.azurewebsites.net/api/users/UpdateUser`, updatedUser)
  }

  removeUser(userEmail: string) {
    return this.httpClient.delete<User>(`https://userprovider20250119171348.azurewebsites.net/api/users/DeleteUser?userEmail=${userEmail}`)
  }
}