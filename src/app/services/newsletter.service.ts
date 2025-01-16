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
  }

  getOneNewsletter(newsletterId: string) {
    return this.httpClient.get<newsletter>(`https://localhost:7264/api/Newsletter/${newsletterId}`)
  }

  getOneNewsletterPdf(newsletterId: string) {
    console.log("newsletterId:", newsletterId)
    return this.httpClient.get<Blob>(`http://localhost:7126/api/FetchOneFile?newsletterId=${newsletterId}`, {
      responseType: 'blob' as 'json',
    });
  }

  getLatestNewsletter() {
    return this.httpClient.get<any>('http://localhost:7126/api/latest-file')
  }

  getOneUsersNewsletters(userId: string, page: number, pageSize: number) {
    return this.httpClient.get<any>(`https://localhost:7264/api/Newsletter/usersNewsletters/${userId}?page=${page}&pageSize=${pageSize}`);
  }

  getAllNewsletters(page: number, pageSize: number) {
    return this.httpClient.get<any>(`https://localhost:7264/api/Newsletter?page=${page}&pageSize=${pageSize}`)
  }
  
  updateNewsletter(newsletter: newsletter) {
    
  }

  removeNewsletter(newsletterId: string) {
    return this.httpClient.delete<newsletter>(`https://localhost:7264/api/Newsletter/${newsletterId}`)
  }

  removeNewsletterPdf(newsletterId: string) {
    return this.httpClient.delete<string>(`http://localhost:7126/api/DeleteNewsletterFile?newsletterId=${newsletterId}`, { responseType: 'text' as 'json' });
  }
}
