import { inject, Injectable } from '@angular/core';
import { newsletter } from '../models/newsletter';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
private httpClient = inject(HttpClient);

  createNewsletter(newsletter: any): Observable<any>  {
    return this.httpClient.post<newsletter>('https://localhost:7264/api/Newsletter/create', newsletter)
    .pipe(
      catchError((error) => {
        console.error('Error creating newsletter:', error);
        return throwError(() => new Error('Failed to create newsletter'));
      })
    );
  }

  getOneNewsletter(id: string) {

  }

  getOneNewsletterPdf(id: string) {
    
  }

  getLatestNewsletter() {
    return this.httpClient.get<any>('http://localhost:7126/api/latest-file')
  }

  getOneUsersNewsletters(userId: string, page: number, pageSize: number) {
    return this.httpClient.get<any>(`https://localhost:7264/api/Newsletter/usersNewsletters/${userId}?page=${page}&pageSize=${pageSize}`);
  }

  getAllNewsletters() {
    
  }
  
  updateNewsletter(newsletter: newsletter) {
    
  }

  removeNewsletter(newsletterId: string) {
    
  }
}
