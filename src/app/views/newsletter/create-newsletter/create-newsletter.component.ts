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
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-create-newsletter',
  standalone: true,
  imports: [FormsModule, CreateNewsletterSectionComponent, NgClass],
  templateUrl: './create-newsletter.component.html',
  styleUrls: ['./create-newsletter.component.scss'],
})
export class CreateNewsletterComponent {
  showSection = false;
  validateInput = false;
  selectedTheme = 'default-theme';
  sanitizer = inject(DomSanitizer);
  location = inject(Location);
  private authService = inject(AuthService);
  private newsletterService = inject(NewsletterService);
  private destroyRef = inject(DestroyRef);
  private fileService = inject(FileService);
  private cdr = inject(ChangeDetectorRef);
  
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

  // Håller reda på vilken sektion som för närvarande redigeras (om någon)
  editingSection: newsletterSection | null = null;
  // För nya sektioner kan du använda en separat flagga om du vill
  showNewSection = false;
  newSection: newsletterSection = { content: "", newsletterSectionImages: [] };

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

  // Sparfunktion – används både vid redigering och vid tillägg av ny sektion  
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

  // Om du vill lägga till en ny sektion
  openNewSection() {
    this.showNewSection = true;
    this.newSection = { content: "", newsletterSectionImages: [] };
    this.cdr.detectChanges();
  }
  
  cancelNewSection() {
    this.showNewSection = false;
    this.cdr.detectChanges();
  }

  selectTheme(theme: string) {
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
        const subscription = this.newsletterService.createNewsletter(this.newsletter()).subscribe({
          next: (response) => {
            this.statusMessage = 'Newsletter was created!';
            this.statusClass = 'alert alert-success';
            
            if (response.id !== "") {
              this.newsletter()!.id = response.id;
              console.log('Created newsletter with ID:', this.newsletter()!.id);
              if (this.newsletter()!.id) {
                // Konvertera alla sektioner till bilder och skapa PDF
                this.saveAsPdf(this.newsletter()!.id);
              }
            }
          },
          error: (err) => {            
            this.statusMessage = 'Newsletter was not created!';
            this.statusClass = 'alert alert-danger';
            console.log('Newsletter was not created!', err);
          },
          complete: () => {
            setTimeout(() => {
              this.goBack();
            }, 1000);              
          },
        });
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
      try {
        // För varje sektion: skapa ett temporärt element, rendera med html2canvas, konvertera till blob och ladda upp
        const imageUrls = await Promise.all(
          this.newsletter()!.sections.map(section => this.convertSectionToImage(section))
        );
  
        // Skapa och ladda upp PDF med de genererade bild-URL:erna
        const pdfUrl$ = await this.fileService.createAndUploadPdf(
          this.newsletter()!.title,
          imageUrls,
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

  private convertSectionToImage(section: newsletterSection): Promise<string> {
    return new Promise(async (resolve, reject) => {
      // Skapa ett temporärt element för att rendera sektionens innehåll
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px'; // Ange en lämplig bredd
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
  
      // Lägg till sektionens innehåll
      tempDiv.innerHTML = section.content;
  
      if (section.newsletterSectionVideos && section.newsletterSectionVideos.length > 0) {
        const video = section.newsletterSectionVideos[0]; // Tar första videon i listan
        
        const thumbnailUrl = video.thumbnail;
        const videoUrl = video.url;
  
        if (thumbnailUrl && videoUrl) {
          const imgElement = document.createElement('img');
          imgElement.src = thumbnailUrl;
          imgElement.style.width = '100%';
          imgElement.style.cursor = 'pointer';
  
          const linkElement = document.createElement('a');
          linkElement.href = videoUrl;
          linkElement.target = '_blank'; // Öppna länken i ett nytt fönster
          linkElement.textContent = 'Play Video'; // Lägg till text så att användaren kan se länken
          linkElement.appendChild(imgElement);
          tempDiv.appendChild(linkElement);
        }
      }
      document.body.appendChild(tempDiv);
  
      try {
        const canvas = await html2canvas(tempDiv, {
          backgroundColor: null,
          logging: true,
          useCORS: true,
          scale: 4,
          allowTaint: true,
        });
  
        canvas.toBlob((blob) => {
          if (blob) {
            this.fileService.createAndUploadSection(blob, this.newsletter()!.id).subscribe({
              next: (url) => resolve(url),
              error: (err) => reject(err)
            });
          } else {
            reject(new Error("Kunde inte generera blob från canvas"));
          }
        }, 'image/png');
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(tempDiv);
      }
    });
  }
  
  removeSection(section: newsletterSection) {
    if (section != null) {
      const index = this.newsletter()?.sections.findIndex(s => s === section);
      if (index !== undefined && index !== -1) {
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