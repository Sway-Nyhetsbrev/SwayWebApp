import { inject, Injectable } from '@angular/core';
import { newsletter } from '../models/newsletter';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
private httpClient = inject(HttpClient);

  createNewsletter(newsletter: any): Observable<any>  {
    return this.httpClient.post<newsletter>('https://localhost:7264/api/Newsletter/create', newsletter)
    // return this.httpClient.post<newsletter>('https://newsletterprovider20250119174340.azurewebsites.net/api/Newsletter/create', newsletter)
  }

  getOneNewsletter(newsletterId: string) {
    return this.httpClient.get<newsletter>(`https://localhost:7264/api/Newsletter/${newsletterId}`)
    // return this.httpClient.get<newsletter>(`https://newsletterprovider20250119174340.azurewebsites.net/api/Newsletter/${newsletterId}`)

  }

  getOneNewsletterPdf(newsletterId: string) {
    return this.httpClient.get<any>(`http://localhost:7126/api/FetchOneFile?newsletterId=${newsletterId}`)
  }

  getLatestNewsletter() {
    return this.httpClient.get<any>('http://localhost:7126/api/latest-file')
  }

  getOneUsersNewsletters(userId: string, page: number, pageSize: number) {
    return this.httpClient.get<any>(`https://localhost:7264/api/Newsletter/usersNewsletters/${userId}?page=${page}&pageSize=${pageSize}`);
    // return this.httpClient.get<any>(`https://newsletterprovider20250119174340.azurewebsites.net/api/Newsletter/usersNewsletters/${userId}?page=${page}&pageSize=${pageSize}`);
  }

  getAllNewsletters(page: number, pageSize: number) {
    return this.httpClient.get<any>(`https://localhost:7264/api/Newsletter/?page=${page}&pageSize=${pageSize}`)
    // return this.httpClient.get<any>(`https://newsletterprovider20250119174340.azurewebsites.net/api/Newsletter/?page=${page}&pageSize=${pageSize}`)
  }
  
  updateNewsletter(newsletter: any) {
    return this.httpClient.put<newsletter>('https://localhost:7264/api/Newsletter/update', newsletter)
    // return this.httpClient.put<newsletter>('https://newsletterprovider20250119174340.azurewebsites.net/api/Newsletter/update', newsletter)
  }

  removeNewsletter(newsletterId: string) {
    return this.httpClient.delete<newsletter>(`https://localhost:7264/api/Newsletter/${newsletterId}`)
    // return this.httpClient.delete<newsletter>(`https://newsletterprovider20250119174340.azurewebsites.net/api/Newsletter/${newsletterId}`)
  }

  removeNewsletterBlob(newsletterId: string) {
    return this.httpClient.delete<string>(`http://localhost:7126/api/DeleteNewsletterFile?newsletterId=${newsletterId}`, { responseType: 'text' as 'json' });
  }

  publishNewsletter(newsletter: any): Observable<any>  {
    return this.httpClient.post<newsletter>('https://localhost:7264/api/Newsletter/create', newsletter)
     //return this.httpClient.post<newsletter>('https://newsletterprovider20250119174340.azurewebsites.net/api/Newsletter/create', newsletter)
  }

  fetchNewsletterSections(newsletterId: string)  {
    return this.httpClient.get<any>(`http://localhost:7126/api/FetchNewsletterSections?newsletterId=${newsletterId}`)
     
  }
}
