import { inject, Injectable, OnInit } from '@angular/core';
import { newsletter } from '../models/newsletter';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
private httpClient = inject(HttpClient);


  createNewsletter(newsletter: newsletter): Observable<newsletter | undefined>  {
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

  getLatestNewsletter() {
    return this.httpClient
      .get<any>('https://localhost:7264/api/Newsletter/latestNewsletter')
  }

  getOneUsersNewsletters(userId: string) {
    
  }

  getAllNewsletters() {
    
  }
  
  updateNewsletter(newsletter: newsletter) {
    
  }

  removeNewsletter(newsletterId: string) {
    
  }
}
