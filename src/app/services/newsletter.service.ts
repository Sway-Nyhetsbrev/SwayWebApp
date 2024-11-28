import { inject, Injectable, signal } from '@angular/core';
import { newsletter } from '../models/newsletter';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
private httpClient = inject(HttpClient);

  createNewsletter(newsletter: newsletter) {

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
