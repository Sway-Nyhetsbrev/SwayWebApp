import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { DatePipe, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from '../create-newsletter/create-newsletter-section/create-newsletter-section.component';
import { ThemeHandlerComponent } from "../../../components/theme-handler/theme-handler.component";
import { NewsletterSectionBase } from '../create-newsletter/create-newsletter-section/newsletter-section-base';

@Component({
  selector: 'app-update-newsletter',
  standalone: true,
  imports: [NgStyle, FormsModule, DatePipe, CreateNewsletterSectionComponent, ThemeHandlerComponent],
  templateUrl: './update-newsletter.component.html',
  styleUrl: './update-newsletter.component.scss'
})

export class UpdateNewsletterComponent extends NewsletterSectionBase implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService);
  newsletterId = "";

  /* 
   Initializes the component.
   Subscribes to route parameters and loads newsletter details.
  */
  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.newsletterId = params['newsletterId'];
      this.loadNewsletterDetails();
    });
  }
  
  /* 
   Loads the details of the newsletter.
   Formats the release date and sets the newsletter data.
  */
  loadNewsletterDetails() {
    const datePipe = new DatePipe('en-US');
    const subscription = this.newsletterService.getOneNewsletter(this.newsletterId).subscribe({
      next: (response) => {
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
      },
    });
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
  
  /* 
   Updates the newsletter.
   Validates the newsletter and its sections before sending the update.
   If successful, triggers the PDF update.
  */
  async updateNewsletter() {
    if (this.newsletter()!.title && this.newsletter()!.releaseDate) {
      // Pre-validate the sections before sending the update
      const sectionsValid = await this.validateSections();

      if (!sectionsValid) {
        // If any section is too large, abort the update
        return;
      }

      try {
        const subscription = this.newsletterService.updateNewsletter(this.newsletter()).subscribe({
          next: (response) => {
            this.statusMessage = 'Newsletter was updated!';
            this.statusClass = 'alert alert-success';
            if (response.id !== "") {
              this.newsletter()!.id = response.id;
              this.updateAsPdf(this.newsletter()!.id);
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
  
  /* 
   Updates the newsletter as a PDF.
   Converts newsletter sections to images and uploads the resulting PDF.
  */
  async updateAsPdf(newsletterId: string) {
    if (this.newsletter()!.title && this.newsletter()!.sections.length > 0) {
      try {
        const imageUrls = await Promise.all(
          this.newsletter()!.sections.map(section =>
            this.convertSectionToImage(section))
        );
  
        const pdfUrl$ = await this.fileService.createAndUploadPdf(
          this.newsletter()!.title,
          imageUrls,
          this.newsletter()!.theme!.name,
          newsletterId
        );
  
        pdfUrl$.subscribe({
          next: (pdfUrl) => console.log('PDF uploaded:', pdfUrl),
          error: (error) => {
            this.statusMessage = 'Error uploading PDF!';
            this.statusClass = 'alert alert-danger';
            console.error('Error uploading PDF:', error);
          }
        });
      } catch (error) {
        this.statusMessage = 'Error creating PDF!';
        this.statusClass = 'alert alert-danger';
        console.error('Error creating PDF:', error);
      }
    }
  }
  
  /* 
   Handles theme changes.
   Updates the newsletter theme and triggers change detection.
  */
  onThemeChanged(theme: any) {
    this.newsletter()!.theme = theme;
    this.cdr.detectChanges();
  }
}