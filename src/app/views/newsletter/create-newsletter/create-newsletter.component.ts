import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from './create-newsletter-section/create-newsletter-section.component';
import { NgClass, NgStyle } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ThemeHandlerComponent } from "../../../components/theme-handler/theme-handler.component";
import { NewsletterSectionBase } from './create-newsletter-section/newsletter-section-base';
import { NewsletterService } from '../../../services/newsletter.service';

@Component({
  selector: 'app-create-newsletter',
  standalone: true,
  imports: [FormsModule, CreateNewsletterSectionComponent, NgStyle, ThemeHandlerComponent, NgClass],
  templateUrl: './create-newsletter.component.html',
  styleUrls: ['./create-newsletter.component.scss'],
})

export class CreateNewsletterComponent extends NewsletterSectionBase {
  private authService = inject(AuthService);
  private newsletterService = inject(NewsletterService);
  
  async saveNewsletter() {
    const loggedUser = this.authService.getLoggedUser();
    if (!loggedUser) {
      console.error('Användaren är inte inloggad.');
      return;
    }
  
    this.newsletter()!.userId = loggedUser.id;
    this.newsletter()!.author = loggedUser.email;
  
    const { title, releaseDate, sections } = this.newsletter()!;
    if (!title || !releaseDate) {
      this.statusMessage = 'Please add a title and releasedate';
      this.statusClass = 'alert alert-warning';
      this.cdr.detectChanges();
      return;
    }
  
    if (sections.length === 0 || sections.some(section => !section.content.trim())) {
      this.statusMessage = 'The newsletter has to contain one section';
      this.statusClass = 'alert alert-warning';
      this.cdr.detectChanges();
      return;
    }
  
    try {
      const subscription = this.newsletterService.createNewsletter(this.newsletter()).subscribe({
        next: (response) => {
          this.statusMessage = 'Newsletter was created!';
          this.statusClass = 'alert alert-success';
          if (response.id !== "") {
            this.newsletter()!.id = response.id;
            console.log('Created newsletter with ID:', this.newsletter()!.id);
            if (this.newsletter()!.id) {
              this.saveAsPdf(this.newsletter()!.id);
            }
          }
        },
        error: (err) => {
          this.statusMessage = 'Newsletter was not created!';
          this.statusClass = 'alert alert-danger';
          console.error('Newsletter was not created!', err);
        },
      });
    } catch (error) {
      this.statusMessage = 'Newsletter was not created!';
      this.statusClass = 'alert alert-danger';
      console.error('Newsletter was not created!', error);
    }
  }
  
  async saveAsPdf(newsletterId: string) {
    console.log("saveAsPdf anropas för id:", newsletterId);
    if (this.newsletter()!.title && this.newsletter()!.sections.length > 0) {
      try {
        const imageUrls = await Promise.all(
          this.newsletter()!.sections.map(section =>
            this.convertSectionToImage(section)
          )
        );
  
        const pdfUrl$ = await this.fileService.createAndUploadPdf(
          this.newsletter()!.title,
          imageUrls,
          this.newsletter()!.theme!.name!,
          newsletterId
        );
  
        pdfUrl$.subscribe({
          next: (pdfUrl) => {
            console.log('PDF uploaded:', pdfUrl);
          },
          error: (error) => {
            this.statusMessage = 'Error uploading PDF!';
            this.statusClass = 'alert alert-danger';
            console.error('Error uploading PDF:', error);
          }
        });
      } catch (error) {
        this.statusMessage = 'Error creating PDF!';
        this.statusClass = 'alert alert-danger';
        console.error('Error creating PDF:', error);
      }
    }
  }

  onThemeChanged(theme: any) {
    this.newsletter()!.theme = theme;
    this.cdr.detectChanges();
  }
}