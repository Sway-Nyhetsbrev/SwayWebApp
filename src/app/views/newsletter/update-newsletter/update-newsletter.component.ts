import { ChangeDetectorRef, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { newsletter, newsletterSection } from '../../../models/newsletter';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateNewsletterSectionComponent } from '../create-newsletter/create-newsletter-section/create-newsletter-section.component';
import { FileService } from '../../../services/file.service';
import { themeColorsMap } from '../../../models/themecolor';
import { DomSanitizer } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import { Location } from '@angular/common';

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
  location = inject(Location)
  newsletterId = "";
  statusMessage = "";
  statusClass = "";
  showSection = false;
  themeColorsMap: any;
  cdr = inject(ChangeDetectorRef)
 
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

  

  async updateNewsletter() {
    if (this.newsletter()!.title && this.newsletter()!.releaseDate) {
  
      try {
        const subscription = this.newsletterService.updateNewsletter(this.newsletter()).subscribe({
          next: (response) => {
            this.statusMessage = 'Newsletter was created!';
            this.statusClass = 'alert alert-success';
            
            if (response.id !== "") {
              this.newsletter()!.id = response.id;
              console.log('Created newsletter with ID:', this.newsletter()!.id);
              if (this.newsletter()!.id) {
                // Konvertera alla sektioner till bilder och skapa PDF
                this.updateAsPdf(this.newsletter()!.id);
              }
            }
          },
          error: (err) => {            
            this.statusMessage = 'Newsletter was not created!';
            this.statusClass = 'alert alert-danger';
            console.log('Newsletter was not created!', err);
          },complete: () => {
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
      this.cdr.detectChanges();
    }
  }

  async updateAsPdf(newsletterId: string) {
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
          this.newsletter()!.theme!.className,
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
      // this.cdr.detectChanges();
    } else {
      console.log('Sektionen är inte fullständig.');
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
      tempDiv.innerHTML = section.content;
      document.body.appendChild(tempDiv);
      try {
        const canvas = await html2canvas(tempDiv, {
          backgroundColor: null,
          logging: true,
          useCORS: true,
          scale: 4,
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

  // Starta redigering – vi sätter editingSection till den valda sektionen (referensjämförelse)
  editSection(section: newsletterSection) {
    this.editingSection = section;
    this.cdr.detectChanges();
  }

  // Avbryt redigering
  cancelEdit() {
    this.editingSection = null;
  }

  openNewSection() {
    this.showNewSection = true;
    this.newSection = { content: "", newsletterSectionImages: [] };
  }
  
  cancelNewSection() {
    this.showNewSection = false;
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

  goBack() {
    this.location.back();
  }
}
