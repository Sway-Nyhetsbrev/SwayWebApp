import { Component, DestroyRef, inject } from '@angular/core';
import { newsletter, newsletterSection } from '../../../models/newsletter';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from './create-newsletter-section/create-newsletter-section.component';
import { NgClass } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { NewsletterService } from '../../../services/newsletter.service';
import { AuthService } from '../../../services/auth.service';

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

  getSanitizedContent(content: string) {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
