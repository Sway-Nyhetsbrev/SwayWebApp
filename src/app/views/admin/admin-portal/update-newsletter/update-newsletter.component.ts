import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../../services/newsletter.service';
import { newsletter, newsletterSection } from '../../../../models/newsletter';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from '../../../newsletter/create-newsletter/create-newsletter-section/create-newsletter-section.component';

@Component({
  selector: 'app-update-newsletter',
  imports: [NgClass, FormsModule, DatePipe ,CreateNewsletterSectionComponent],
  templateUrl: './update-newsletter.component.html',
  styleUrl: './update-newsletter.component.scss'
})
export class UpdateNewsletterComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService)
  newsletterId = "";
  newsletter = signal<newsletter | undefined>(undefined);
  statusMessage = "";
  statusClass = "";
  showSection = false;

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.newsletterId = params['newsletterId'];
      this.loadNewsletterDetails();
    });
  }

  loadNewsletterDetails() {
    const subscription = this.newsletterService.getOneNewsletter(this.newsletterId).subscribe({
      next: (response) => {
        this.newsletter.set(response);
      },
      error(err) {
        
      },
      complete: () => {
        
      },
    })
  }

  updateNewsletter() {
  }

  updateTheme(theme: string) {
    if (this.newsletter()) {
      console.log("Selected theme: ", theme);
      this.newsletter()!.theme?.className == theme
      console.log("Updated theme: ", this.newsletter()?.theme);
    }
  }

  updateSection(updatedSection: newsletterSection) {
  }

  toggleSection() {
    this.showSection = !this.showSection;
    console.log(this.showSection);
  }
}
