import { Component, EventEmitter, Output, output } from '@angular/core';
import { newsletterSection } from '../../../../models/newsletter';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { CreateNewsletterSectionImageComponent } from "../create-newsletter-section-image/create-newsletter-section-image.component";

@Component({
  selector: 'app-create-newsletter-section',
  standalone: true,
  imports: [FormsModule, QuillModule, CreateNewsletterSectionImageComponent],
  templateUrl: './create-newsletter-section.component.html',
  styleUrl: './create-newsletter-section.component.scss'
})
export class CreateNewsletterSectionComponent {
  @Output() sectionCreated = new EventEmitter<newsletterSection>();

  newsletterSection: newsletterSection = {
    header: '',
    content: '',
    newsletterSectionImages: [],
  }

  addSectionImage() {
    this.newsletterSection.newsletterSectionImages.push({
      url: '',
      alt: '',
    })
  }
  
  addSection() {
    this.sectionCreated.emit({ ...this.newsletterSection });
    this.newsletterSection = {header:'', content: '', newsletterSectionImages: []}
  }
}
