import { Component } from '@angular/core';
import { CreateNewsletterSectionComponent } from './create-newsletter-section/create-newsletter-section.component';
import { newsletter, newsletterSection } from '../../../models/newsletter';
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-create-newsletter',
  standalone: true,
  imports: [CreateNewsletterSectionComponent, FormsModule],
  templateUrl: './create-newsletter.component.html',
  styleUrl: './create-newsletter.component.scss'
})
export class CreateNewsletterComponent {
  showSection = false;

  newsletter: newsletter = {
    title: '',
    description: '',
    author: '',
    releaseDate: new Date(),
    userId: '',
    sections: [],
  }

  toggleSection() {
    if(!this.showSection) {this.showSection = true}
    else {
      this.showSection = false;
    }
    console.log(this.showSection)
  }
  
  addSection(section: newsletterSection) {
    if(section.header != null && section.content != null) {
      this.newsletter.sections.push(section);
      this.showSection = false;
      console.log(this.showSection, this.newsletter.sections)
    }
  }

  saveNewsletter() {
    console.log('Saved Newsletter:', this.newsletter);
    // Skicka data till backend.
  }
  
}
