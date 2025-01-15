import { Component, DestroyRef, inject } from '@angular/core';
import { newsletter, newsletterSection } from '../../../models/newsletter';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from './create-newsletter-section/create-newsletter-section.component';
import { NgClass } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { NewsletterService } from '../../../services/newsletter.service';
import { AuthService } from '../../../services/auth.service';
import { FileService } from '../../../services/file.service';

@Component({
  selector: 'app-create-newsletter',
  standalone: true,
  imports: [FormsModule, CreateNewsletterSectionComponent, NgClass],
  templateUrl: './create-newsletter.component.html',
  styleUrl: './create-newsletter.component.scss',
})
export class CreateNewsletterComponent {
  showSection = false;
  selectedTheme = 'default-theme';
  sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private newsletterService = inject(NewsletterService);
  private destroyRef = inject(DestroyRef);
  private fileService = inject(FileService)

  statusMessage: string = '';
  statusClass: string = '';

  newsletter: newsletter = {
    id: '',
    title: '',
    author: '',
    releaseDate: new Date(),
    userId: '',
    sections: [],
  };

  toggleSection() {
    this.showSection = !this.showSection;
    console.log(this.showSection);
  }

  saveSection(section: newsletterSection) {
    if (section.content) {
      this.newsletter.sections.push(section); // Lägg till sektionen i listan
      console.log('Sektioner:', this.newsletter.sections);
      this.showSection = false; // Dölj formuläret efter att sektionen sparats
    } else {
      console.log('Sektionen är inte fullständig.');
    }
  }

  saveNewsletter() {
    // Kontrollera om användaren är inloggad och att loggedUser inte är null
    const loggedUser = this.authService.getLoggedUser();
    if (!loggedUser) {
      console.error('Användaren är inte inloggad.');
      return; // Avbryt om användaren inte är inloggad
    }

    // Sätt userId och author med användardata
    this.newsletter.userId = loggedUser.id;
    this.newsletter.author = loggedUser.email;

    console.log('Saved Newsletter:', this.newsletter);

    // Kontrollera att nyhetsbrevstiteln och releaseDate är ifyllda
    if (this.newsletter.title && this.newsletter.releaseDate) {
      const subscription = this.newsletterService.createNewsletter(this.newsletter)
        .subscribe({
          next: (response) => {
            this.statusMessage = 'Newsletter was created!';
            this.statusClass = 'alert alert-success';
            console.log('Newsletter was created!', response);

            this.newsletter.id = response.id; // Här sparar vi ID:t från backend
            this.saveAsPdf(this.newsletter.id);  // Skicka ID till saveAsPdf       
          },
          error: (error) => {
            this.statusMessage = 'Newsletter was not created!';
            this.statusClass = 'alert alert-danger';
            console.log('Newsletter was not created!', error);
          },
        });
      this.destroyRef.onDestroy(() => {
        subscription.unsubscribe();
      });
    } else {
      this.statusMessage = 'Newslettertitle or release date missing!';
      this.statusClass = 'alert alert-warning';
    }
  }

  async saveAsPdf(newsletterId: string) {
    // Check if the newsletter's title and sections are filled
    if (this.newsletter.title && this.newsletter.sections.length > 0) {
      const sectionsContent = this.newsletter.sections.map(section => section.content);  // Extract content from each section
      const sectionsImages = this.newsletter.sections.map(section => section.newsletterSectionImages);  // Extract images from each section
      
      try {
        // Await the promise returned by createAndUploadPdf, which will resolve to an Observable
        const pdfUrl$ = await this.fileService.createAndUploadPdf(this.newsletter.title, sectionsContent, sectionsImages, this.selectedTheme, newsletterId);
        
        // Now, subscribe to the Observable to get the actual result
        pdfUrl$.subscribe({
          next: (pdfUrl) => {
            // If successful, update the status message
            this.statusMessage = `PDF uploaded successfully!`;
            this.statusClass = 'alert alert-success';
            console.log('PDF uploaded:', pdfUrl);
          },
          error: (error) => {
            // Catch any errors and handle them
            this.statusMessage = 'Error uploading PDF!';
            this.statusClass = 'alert alert-danger';
            console.error('Error uploading PDF:', error);
          }
        });
        
      } catch (error) {
        // Catch any errors that occur when creating the PDF
        this.statusMessage = 'Error creating PDF!';
        this.statusClass = 'alert alert-danger';
        console.error('Error creating PDF:', error);
      }
    } else {
      // If title or sections are missing, show a warning
      this.statusMessage = 'Please ensure the newsletter has a title and at least one section.';
      this.statusClass = 'alert alert-warning';
    }
  }
  
}
