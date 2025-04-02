import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../services/newsletter.service';
import { NgClass } from '@angular/common';
import { NewsletterSectionBase } from '../newsletter/create-newsletter/create-newsletter-section/newsletter-section-base';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-info-tablet',
  imports: [FormsModule, NgClass],
  templateUrl: './info-tablet.component.html',
  styleUrl: './info-tablet.component.scss'
})
export class InfoTabletComponent extends NewsletterSectionBase implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService);
  newsletterId = "";
  selectedSections: string[] = [];
  savedSections: boolean[] = [];

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.newsletterId = params['newsletterId'];
      this.loadNewsletterDetails();
    });
  }

  loadNewsletterDetails() {
    const subscription = this.newsletterService.fetchNewsletterSections(this.newsletterId).subscribe({
      next: (response) => {
        console.log("newsletterSection response", response);
        this.selectedSections = response;
        this.savedSections = new Array(response.length).fill(false);
      },
      error: (error) => {
        this.statusMessage = 'Unable to load newsletter!';
        this.statusClass = 'alert alert-danger';
        console.log("Can't load newsletter details", error);
      },
    });
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  toggleSection(index: number) {
    this.savedSections[index] = !this.savedSections[index];
  }

  async publishNewsletter() {
    if (this.newsletter()!.title && this.newsletter()!.releaseDate) {
      const sectionsValid = await this.validateSections();
      if (!sectionsValid) {
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
}