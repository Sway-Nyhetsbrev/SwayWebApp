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

  /* 
   * Saves the newsletter.
   * Checks if the user is logged in, validates the newsletter title, release date, and sections.
   * If valid, creates the newsletter and triggers PDF generation.
   */
  async saveNewsletter() {
    const loggedUser = this.authService.getLoggedUser();
    if (!loggedUser) {
      console.error('User is not logged in.');
      return;
    }
    
    this.newsletter()!.userId = loggedUser.id;
    this.newsletter()!.author = loggedUser.email;
  
    const { title, releaseDate, sections } = this.newsletter()!;
    if (!title || !releaseDate) {
      this.statusMessage = 'Please add a title and release date';
      this.statusClass = 'alert alert-warning';
      this.cdr.detectChanges();
      return;
    }
  
    if (sections.length === 0 || sections.some(section => !section.content.trim())) {
      this.statusMessage = 'Please add at least one section with content!';
      this.statusClass = 'alert alert-warning';
      this.cdr.detectChanges();
      return;
    }
    
    const sectionsValid = await this.validateSections();
    if (!sectionsValid) {
      return;
    }
  
    try {
      const subscription = this.newsletterService.createNewsletter(this.newsletter()).subscribe({
        next: (response) => {
          this.statusMessage = 'Newsletter was created!';
          this.statusClass = 'alert alert-success';
          
          console.log("Response", response);

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
  
  /* 
   * Generates a PDF from the newsletter.
   * Converts each section to an image and uploads the resulting PDF.
   */
  async saveAsPdf(newsletterId: string) {
    console.log("saveAsPdf is called for id:", newsletterId);
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
        this.statusClass = 'alert alert-warning';
        console.error('Error creating PDF:', error);
      }
    }
  }

  /* 
   * Handles theme changes.
   * Updates the newsletter theme and triggers change detection.
   */
  onThemeChanged(theme: any) {
    this.newsletter()!.theme = theme;
    this.cdr.detectChanges();
  }
}