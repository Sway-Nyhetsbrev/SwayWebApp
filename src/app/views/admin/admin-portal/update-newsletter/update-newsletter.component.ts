import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../../services/newsletter.service';
import { newsletter, newsletterSection } from '../../../../models/newsletter';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from '../../../newsletter/create-newsletter/create-newsletter-section/create-newsletter-section.component';
import { FileService } from '../../../../services/file.service';
import { HttpErrorResponse } from '@angular/common/http';
import { themeColorsMap } from '../../../../models/themecolor';

@Component({
  selector: 'app-update-newsletter',
  imports: [NgClass, FormsModule, DatePipe ,CreateNewsletterSectionComponent],
  templateUrl: './update-newsletter.component.html',
  styleUrl: './update-newsletter.component.scss'
})
export class UpdateNewsletterComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService)
  destroyRef = inject(DestroyRef);
  fileService = inject(FileService)
  newsletterId = "";
  newsletter = signal<newsletter | undefined>(undefined);
  statusMessage = "";
  statusClass = "";
  showSection = false;
  themeColorsMap: any;
  changeDetectorRef = inject(ChangeDetectorRef)
  
  ngOnInit() {
    console.log('themeColorsMap:', themeColorsMap); // Kontrollera om themeColorsMap är tillgänglig här
    this.activatedRoute.params.subscribe((params) => {
      this.newsletterId = params['newsletterId'];
      this.loadNewsletterDetails();
    });
  }

  loadNewsletterDetails() {
    const subscription = this.newsletterService.getOneNewsletter(this.newsletterId).subscribe({
      next: (response) => {
      // Verifiera att temat finns i themeColorsMap

      const theme = themeColorsMap[response.theme!.className] || response.theme;
      response.theme = { ...theme, ...response.theme }; // Prioritera backend-värden
      this.newsletter.set(response);
      console.log('Loaded theme:', this.newsletter()?.theme);
      },
      error: (error) => {
        this.statusMessage = 'Unable to load newsletter!';
        this.statusClass = 'alert alert-danger';
        console.log('Newsletter was not uploaded', error)
      },
    });
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  updateNewsletter() {
    if (this.newsletter()?.title && this.newsletter()?.releaseDate) {
      console.log("updatedNewsletter::", this.newsletter())
      const subscription = this.newsletterService.updateNewsletter(this.newsletter()!)
        .subscribe({
          next: (response) => {
            this.statusMessage = 'Newsletter was created!';
            this.statusClass = 'alert alert-success';
            console.log('Newsletter was created!', response);

            this.newsletterId == response.id;
            this.saveAsPdf(this.newsletterId);    
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
    } 
    else {
      this.statusMessage = 'Newslettertitle or release date missing!';
      this.statusClass = 'alert alert-warning';
    }
  }

  async saveAsPdf(newsletterId: string) {
    // Check if the newsletter's title and sections are filled
    if (this.newsletter()?.title && this.newsletter()!.sections.length > 0) {
      const sectionsContent = this.newsletter()!.sections.map(section => section.content);  // Extract content from each section
      const sectionsImages = this.newsletter()!.sections.map(section => section.newsletterSectionImages);  // Extract images from each section
      
      try {
        // Wait for the PDF removal to complete
        await new Promise<void>((resolve, reject) => {
          const subscription = this.newsletterService.removeNewsletterPdf(newsletterId).subscribe({
            next: () => resolve(),
            error: (err: HttpErrorResponse) => {
              console.error('Error removing existing PDF:', err);
              reject(err);
            }
          });
          this.destroyRef.onDestroy(() => subscription.unsubscribe());
        });
  
        // Create and upload the new PDF
        const pdfUrl$ = await this.fileService.createAndUploadPdf(this.newsletter()!.title, sectionsContent, sectionsImages, this.newsletter()!.theme!.className!, newsletterId);
        
        pdfUrl$.subscribe({
          next: (pdfUrl) => {
            // If successful, update the status message
            console.log('PDF uploaded:', pdfUrl);
          },
          error: (error) => {
            // Catch any errors and handle them
            this.statusMessage = 'Error uploading PDF!';
            this.statusClass = 'alert alert-danger';
            console.error('Error uploading PDF:', error);
          }
        });
  
      } catch (error) {
        // Catch any errors that occur when creating the PDF
        this.statusMessage = 'Error creating PDF!';
        this.statusClass = 'alert alert-danger';
        console.error('Error creating PDF:', error);
      }
    } else {
      // If title or sections are missing, show a warning
      this.statusMessage = 'Please ensure the newsletter has a title and at least one section.';
      this.statusClass = 'alert alert-warning';
    }
  }

  saveSection(section: newsletterSection) {
    if (section.content) {
      this.newsletter()?.sections.push(section);
      console.log('Sektioner:', this.newsletter()?.sections);
      this.showSection = false;
    }
    else {
      console.log('Sektionen är inte fullständig.');
    }
  }

  removeSection(section: newsletterSection) {
    if (section != null) {
      // Hitta indexet för sektionen baserat på dess id
      const index = this.newsletter()?.sections.findIndex(s => s === section);
  
      // Om sektionen finns (index > -1)
      if (index !== undefined && index !== -1) {
        // Ta bort sektionen från listan
        this.newsletter()?.sections.splice(index, 1);
        console.log('Sektion borttagen:', section);
      }
    } 
  }

  toggleSection() {
    this.showSection = !this.showSection;
    console.log(this.showSection);
  }

  onThemeClick(themeClassName: string): void {
    console.log('Theme clicked:', themeClassName);
  
    // Kontrollera att themeColorsMap finns
    if (!themeColorsMap) {
      console.error('themeColorsMap is undefined!');
      return;
    }
  
    // Kontrollera att tema finns i themeColorsMap
    const selectedTheme = themeColorsMap[themeClassName];
  
    if (!selectedTheme) {
      console.error('Theme not found in themeColorsMap:', themeClassName);
      this.statusMessage = `Theme '${themeClassName}' not found!`;
      this.statusClass = 'alert alert-warning';
      return;
    }
  
    if (this.newsletter()) {
      // Uppdatera temat
      this.newsletter()!.theme!.className = themeClassName;
      this.newsletter()!.theme = { ...this.newsletter()!.theme, ...selectedTheme };
      this.changeDetectorRef.detectChanges();
    }
  }
}
