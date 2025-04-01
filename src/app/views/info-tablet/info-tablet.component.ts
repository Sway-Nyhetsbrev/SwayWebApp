import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../services/newsletter.service';
import { DatePipe, NgStyle } from '@angular/common';
import { NewsletterSectionBase } from '../newsletter/create-newsletter/create-newsletter-section/newsletter-section-base';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-info-tablet',
  imports: [FormsModule, NgStyle],
  templateUrl: './info-tablet.component.html',
  styleUrl: './info-tablet.component.scss'
})
export class InfoTabletComponent extends NewsletterSectionBase implements OnInit{
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService);
  newsletterId = "";
  sectionChecked = false;

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.newsletterId = params['newsletterId'];
      this.loadNewsletterDetails();
    });
  }

  loadNewsletterDetails() {
      const datePipe = new DatePipe('en-US');
      const subscription = this.newsletterService.getOneNewsletter(this.newsletterId).subscribe({
        next: (response) => {
          console.log("newsletterDetails", response);
          if (response.releaseDate) {
            const formattedDate = datePipe.transform(response.releaseDate, 'yyyy-MM-dd');
            if (formattedDate) {
              response.releaseDate = formattedDate;
            }
          }
          this.newsletter.set(response);
        },
        error: (error) => {
          this.statusMessage = 'Unable to load newsletter!';
          this.statusClass = 'alert alert-danger';
          console.log("Can't load newsletterdetails", error);
        },
      });
      this.destroyRef.onDestroy(() => {
        subscription.unsubscribe();
      });
  }

  async publishNewsletter() {
    if (this.newsletter()!.title && this.newsletter()!.releaseDate) {
      // Pre-validate the sections before sending the update
      const sectionsValid = await this.validateSections();

      if (!sectionsValid) {
        // If any section is too large, abort the update
        return;
      }

      try {
        const subscription = this.newsletterService.publishNewsletter(this.newsletter()).subscribe({
          next: (response) => {
            this.statusMessage = 'Newsletter was updated!';
            this.statusClass = 'alert alert-success';
            if (response.id !== "") {
              this.newsletter()!.id = response.id;
            }
          },
          error: (err) => {
            this.statusMessage = 'Newsletter update failed!';
            this.statusClass = 'alert alert-danger';
          }
        });
      } catch (error) {
        this.statusMessage = 'Newsletter update failed!';
        this.statusClass = 'alert alert-danger';
      }
    }
  }

  sectionsToSend() {
    this.sectionChecked = !this.sectionChecked;
    console.log("Checked section", this.sectionChecked);
  }
}
