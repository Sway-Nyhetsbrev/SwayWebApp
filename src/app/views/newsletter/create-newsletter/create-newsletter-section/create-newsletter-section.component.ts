import { Component, EventEmitter, Input, Output } from '@angular/core';
import { newsletterSection, newsletterSectionImages } from '../../../../models/newsletter';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-create-newsletter-section',
  standalone: true,
  imports: [FormsModule, QuillModule],
  templateUrl: './create-newsletter-section.component.html',
  styleUrl: './create-newsletter-section.component.scss'
})
export class CreateNewsletterSectionComponent {
  @Input() newsletterSection: newsletterSection = {
    content: '',
    newsletterSectionImages: []
  };

  @Output() save = new EventEmitter<newsletterSection>();

  section: newsletterSection = {
    content: '',
    newsletterSectionImages: []
  };

  newsletterSectionImage: newsletterSectionImages = {
    url: '',
    alt: '',
  };

  saveSection() {
    if (this.section.content) {
      this.save.emit(this.section);
    }
  }
  
  editorModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'], // Stilering
      [{ list: 'ordered' }, { list: 'bullet' }], // Listor
      ['link', 'image'], // Länkar och bilder
      [{ 'background': [] }], // Bakgrundsfärg
    ],
  };

}
