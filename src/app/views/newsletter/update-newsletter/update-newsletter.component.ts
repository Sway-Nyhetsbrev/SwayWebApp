import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { newsletter, newsletterSection } from '../../../models/newsletter';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from '../create-newsletter/create-newsletter-section/create-newsletter-section.component';
import { FileService } from '../../../services/file.service';
import { HttpErrorResponse } from '@angular/common/http';
import { themeColorsMap } from '../../../models/themecolor';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-update-newsletter',
  imports: [NgClass, FormsModule, DatePipe, CreateNewsletterSectionComponent],
  templateUrl: './update-newsletter.component.html',
  styleUrl: './update-newsletter.component.scss'
})
export class UpdateNewsletterComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService)
  destroyRef = inject(DestroyRef);
  fileService = inject(FileService)
  sanitizer = inject(DomSanitizer);
  newsletterId = "";
  newsletter = signal<newsletter | undefined>(undefined);
  statusMessage = "";
  statusClass = "";
  showSection = false;
  themeColorsMap: any;
  cdr = inject(ChangeDetectorRef)
 

  // Håller reda på vilken sektion som för närvarande redigeras (om någon)
  editingSection: newsletterSection | null = null;

  // För nya sektioner kan du använda en separat flagga om du vill
  showNewSection = false;

  newSection: newsletterSection = { content: "", newsletterSectionImages: [] };


  ngOnInit() {
    console.log('themeColorsMap:', themeColorsMap); // Kontrollera om themeColorsMap är tillgänglig här
    this.activatedRoute.params.subscribe((params) => {
      this.newsletterId = params['newsletterId'];
      this.loadNewsletterDetails();
    });
  }

  loadNewsletterDetails() {
    const datePipe = new DatePipe('en-US');
    const subscription = this.newsletterService.getOneNewsletter(this.newsletterId).subscribe({
      next: (response) => {

      // Verifiera att temat finns i themeColorsMap
      const theme = themeColorsMap[response.theme!.className] || response.theme;
      response.theme = { ...theme, ...response.theme };

      // Använd DatePipe för att formatera releaseDate till yyyy-MM-dd
      console.log("ReleaseDate:", response.releaseDate)
      if (response.releaseDate) {
        const formattedDate = datePipe.transform(response.releaseDate, 'yyyy-MM-dd');
        if (formattedDate) {
          response.releaseDate = formattedDate;
        } else {
          console.error('DatePipe returned null for releaseDate:', response.releaseDate);
        }
      }
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
            this.statusMessage = 'Newsletter was updated!';
            this.statusClass = 'alert alert-success';
            console.log('Newsletter was updated!', response);
            this.newsletterId == response.id;
            this.updateAsPdf(this.newsletterId);
          },
          error: (error) => {
            this.statusMessage = 'Newsletter was not updated!';
            this.statusClass = 'alert alert-danger';
            console.log('Newsletter was not updated!', error);
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

  async updateAsPdf(newsletterId: string) {
    // Check if the newsletter's title and sections are filled
    if (this.newsletter()?.title && this.newsletter()!.sections.length > 0) {
      const sectionsContent = this.newsletter()!.sections.map(section => section.content);  
      
      try {
        // Wait for the PDF removal to complete
        await new Promise<void>((resolve, reject) => {
          const subscription = this.newsletterService.removeNewsletterBlob(newsletterId).subscribe({
            next: () => resolve(),
            error: (err: HttpErrorResponse) => {
              console.error('Error removing existing PDF:', err);
              reject(err);
            }
          });
          this.destroyRef.onDestroy(() => subscription.unsubscribe());
        });
  
        // Create and upload the new PDF
        const pdfUrl$ = await this.fileService.createAndUploadPdf(this.newsletter()!.title, sectionsContent, this.newsletter()!.theme!.className!, newsletterId);
        
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
      // Om sektionen inte redan finns i listan (då vi lägger till en ny) så pushar vi den
      if (!this.newsletter()!.sections.includes(section)) {
        this.newsletter()!.sections.push(section);
        console.log('Ny sektion tillagd:', section);
      } else {
        console.log('Sektion uppdaterad:', section);
      }
      // Rensa redigeringsläge och eventuellt dölja den nya sektionens editor
      this.editingSection = null;
      this.showNewSection = false;
      this.cdr.detectChanges();
    } else {
      console.log('Sektionen är inte fullständig.');
    }
  }

  // Starta redigering – vi sätter editingSection till den valda sektionen (referensjämförelse)
  editSection(section: newsletterSection) {
    this.editingSection = section;
    this.cdr.detectChanges();
  }
  // Avbryt redigering
  cancelEdit() {
    this.editingSection = null;
    this.cdr.detectChanges();
  }

  openNewSection() {
    this.showNewSection = true;
    this.newSection = { content: "", newsletterSectionImages: [] };
    this.cdr.detectChanges();
  }
  
  cancelNewSection() {
    this.showNewSection = false;
    this.cdr.detectChanges();
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
      this.cdr.detectChanges();
    }
  }
}
