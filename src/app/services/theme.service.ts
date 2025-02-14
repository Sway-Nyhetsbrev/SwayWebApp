import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeColors } from '../models/themecolor';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
private httpClient = inject(HttpClient);

  createNewsletterTheme(themecolor: any): Observable<any>  {
    return this.httpClient.post<ThemeColors>('https://localhost:7264/api/NewsletterTheme/create', themecolor)
  }

  getOneNewsletterTheme(themeName: string) {
    return this.httpClient.get<ThemeColors>(`https://localhost:7264/api/NewsletterTheme/${themeName}`)
  }

  getAllNewslettersThemes() {
    return this.httpClient.get<any>('https://localhost:7264/api/NewsletterTheme')
  }

  removeNewsletterTheme(themeName: string) {
    return this.httpClient.delete<ThemeColors>(`https://localhost:7264/api/NewsletterTheme/${themeName}`)
  }
}
