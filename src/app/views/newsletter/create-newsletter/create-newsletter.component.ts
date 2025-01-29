import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { newsletter, newsletterSection } from '../../../models/newsletter';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from './create-newsletter-section/create-newsletter-section.component';
import { NgClass } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { NewsletterService } from '../../../services/newsletter.service';
import { AuthService } from '../../../services/auth.service';
import { FileService } from '../../../services/file.service';
import { themeColorsMap } from '../../../models/themecolor';
import { Location } from '@angular/common';
import Quill from 'quill';

@Component({
  selector: 'app-create-newsletter',
  standalone: true,
  imports: [FormsModule, CreateNewsletterSectionComponent, NgClass],
  templateUrl: './create-newsletter.component.html',
  styleUrl: './create-newsletter.component.scss',
})
export class CreateNewsletterComponent {
  showSection = false;
  validateInput = false;
  selectedTheme = 'default-theme';
  sanitizer = inject(DomSanitizer);
  location = inject(Location)
  private authService = inject(AuthService);
  private newsletterService = inject(NewsletterService);
  private destroyRef = inject(DestroyRef);
  private fileService = inject(FileService)
  private cdr = inject(ChangeDetectorRef)
  
  statusMessage: string = '';
  statusClass: string = '';
  validationClass: string = 'form-control';

  newsletter = signal<newsletter | undefined>({
    id: '',
    title: '',
    author: '',
    releaseDate: '',
    userId: '',
    sections: [],
    theme: themeColorsMap['default-theme']
  });

  toggleSection() {
    this.showSection = !this.showSection;
    console.log(this.showSection);
    // Manuellt trigga change detection
    this.cdr.detectChanges();
  }

  saveSection(section: newsletterSection) {
    if (section.content) {
      this.newsletter()!.sections.push(section); // Lägg till sektionen i listan
      console.log('Sektioner:', this.newsletter()!.sections);
      this.showSection = false; // Dölj formuläret efter att sektionen sparats

      // Manuellt trigga change detection
      this.cdr.detectChanges();
    } else {
      console.log('Sektionen är inte fullständig.');
    }
  }

  selectTheme(theme: string) {
    this.selectedTheme = theme;
    this.newsletter()!.theme = themeColorsMap[theme];
  }

  async saveNewsletter() {
    const loggedUser = this.authService.getLoggedUser();
    if (!loggedUser) {
      console.error('Användaren är inte inloggad.');
      return;
    }
  
    this.newsletter()!.userId = loggedUser.id;
    this.newsletter()!.author = loggedUser.email;
  
    if (this.newsletter()!.title && this.newsletter()!.releaseDate) {
      this.validateInput = false;
  
      try {
        const response = await this.newsletterService.createNewsletter(this.newsletter()).toPromise();
        this.statusMessage = 'Newsletter was created!';
        this.statusClass = 'alert alert-success';
        
        // Sätt ID för nyhetsbrevet här
        this.newsletter()!.id = response.id;
        console.log('Created newsletter with ID:', this.newsletter()!.id);
  
        // Kontrollera att ID finns innan vi anropar saveAsPdf
        if (this.newsletter()!.id) {
          // Anropa saveAsPdf enbart om ID är korrekt tilldelat
          await this.saveAsPdf(this.newsletter()!.id);
        }
  
        setTimeout(() => {
          this.goBack();
        }, 1000);
      } catch (error) {
        this.statusMessage = 'Newsletter was not created!';
        this.statusClass = 'alert alert-danger';
        console.log('Newsletter was not created!', error);
      }
    } else {
      this.statusMessage = 'Please ensure the newsletter has a title, release date and at least one section!';
      this.statusClass = 'alert alert-warning';
      this.validationClass = 'form-control validateText';
      this.validateInput = true;
      this.cdr.detectChanges();
    }
  }

  async saveAsPdf(newsletterId: string) {
    console.log("saveAsPdf anropas för id:", newsletterId); 
    if (this.newsletter()!.title && this.newsletter()!.sections.length > 0) {
      const sectionsHtml = this.newsletter()!.sections.map(section => {
        try {
          // Om innehållet är JSON, konvertera det till HTML med Quill
          const quillContent = JSON.parse(section.content);

          console.log("quillContent", quillContent.innerText);

          const tempQuill = new Quill(document.createElement('div'));
          tempQuill.setContents(quillContent);
          return tempQuill.root.innerHTML;
        } catch {
          // Om det redan är HTML, returnera som det är
          return section.content;
        }
      });
  
      try {
        const pdfUrl$ = await this.fileService.createAndUploadPdf(
          this.newsletter()!.title,
          sectionsHtml,
          this.selectedTheme,
          newsletterId
        );
  
        pdfUrl$.subscribe({
          next: (pdfUrl) => {
            console.log('PDF uploaded:', pdfUrl);
          },
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

  removeSection(section: newsletterSection) {
    if (section != null) {
      // Hitta indexet för sektionen baserat på dess id
      const index = this.newsletter()?.sections.findIndex(s => s === section);
  
      // Om sektionen finns (index > -1)
      if (index !== undefined && index !== -1) {
        // Ta bort sektionen från listan
        this.newsletter()?.sections.splice(index, 1);
        this.cdr.detectChanges();
        console.log('Sektion borttagen:', section);
      }
    } 
  }
  
  goBack() {
    this.location.back();
  }
}
