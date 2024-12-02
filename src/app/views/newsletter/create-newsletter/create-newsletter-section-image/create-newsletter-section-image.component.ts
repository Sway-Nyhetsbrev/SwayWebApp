import { Component, Input, input } from '@angular/core';
import { newsletterSectionImages } from '../../../../models/newsletter';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-newsletter-section-image',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-newsletter-section-image.component.html',
  styleUrl: './create-newsletter-section-image.component.scss'
})
export class CreateNewsletterSectionImageComponent {
  @Input() newsletterSectionImage: newsletterSectionImages = { url: '', alt: '' };
}
