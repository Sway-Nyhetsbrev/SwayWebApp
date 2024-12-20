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

  saveAsPdf() {
    // Kontrollera om nyhetsbrevets titel och sektioner är ifyllda
    if (this.newsletter.title && this.newsletter.sections.length > 0) {
      const sectionsContent = this.newsletter.sections.map(section => section.content);  // Extrahera innehållet från varje sektion
      const sectionsImages = this.newsletter.sections.map(section => section.newsletterSectionImages);  // Extrahera bilder från varje sektion
      
      this.fileService.createAndUploadPdf(this.newsletter.title, sectionsContent, sectionsImages, this.selectedTheme)
        .subscribe({
          next: (pdfUrl) => {
            // Om uppladdningen lyckas, visa URL för den uppladdade PDF:en
            this.statusMessage = `PDF uploaded successfully! You can view it at: ${pdfUrl}`;
            this.statusClass = 'alert alert-success';
            console.log('PDF uploaded:', pdfUrl);
          },
          error: (error) => {
            // Logga fel och ge mer detaljerad feedback
            this.statusMessage = 'Error uploading PDF!';
            this.statusClass = 'alert alert-danger';
            console.error('Error uploading PDF:', error);
            if (error.status) {
              console.error('Error Status:', error.status); // Statuskod från servern
            }
            if (error.error) {
              console.error('Error Message:', error.error); // Felmeddelande från servern
            }
          }
        });
    } else {
      // Om titeln eller sektionerna saknas, visa ett felmeddelande
      this.statusMessage = 'Please ensure the newsletter has a title and at least one section.';
      this.statusClass = 'alert alert-warning';
    }
  }
}
