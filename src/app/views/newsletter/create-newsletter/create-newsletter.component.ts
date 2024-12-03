import { Component, inject } from '@angular/core';
import { newsletter, newsletterSection } from '../../../models/newsletter';
import { FormsModule } from '@angular/forms'
import { CreateNewsletterSectionComponent } from './create-newsletter-section/create-newsletter-section.component';
import { NgClass } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-create-newsletter',
  standalone: true,
  imports: [FormsModule, CreateNewsletterSectionComponent, NgClass],
  templateUrl: './create-newsletter.component.html',
  styleUrl: './create-newsletter.component.scss'
})
export class CreateNewsletterComponent {
  showSection = false;
  selectedTheme = 'default-theme'; 

  sanitizer = inject(DomSanitizer)
  
  newsletter: newsletter = {
    title: '',
    author: '',
    releaseDate: new Date(),
    userId: '',
    sections: [],
  }

  toggleSection() {
    this.showSection = !this.showSection;
    console.log(this.showSection)
  }

  saveSection(section: newsletterSection) {
    if (section.content) {
      this.newsletter.sections.push(section);  // Lägg till sektionen i listan
      console.log('Sektioner:', this.newsletter.sections);
      this.showSection = false;  // Dölj formuläret efter att sektionen sparats
    } else {
      console.log('Sektionen är inte fullständig.');
    }
  }

  saveNewsletter() {
    console.log('Saved Newsletter:', this.newsletter);
    // Skicka data till backend.
  }

  getSanitizedContent(content: string) {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
