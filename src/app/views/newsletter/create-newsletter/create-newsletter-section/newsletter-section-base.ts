import { ChangeDetectorRef, DestroyRef, inject, signal } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { FileService } from "../../../../services/file.service";
import { newsletter, newsletterSection } from "../../../../models/newsletter";
import html2canvas from "html2canvas";

const DEFAULT_THEME = {
  name: '',
  backgroundStart: '#ffffff',
  backgroundEnd: '#ffffff',
  textColor: '#000000'
};

export abstract class NewsletterSectionBase {
  sanitizer = inject(DomSanitizer);
  location = inject(Location);
  destroyRef = inject(DestroyRef);
  fileService = inject(FileService);
  cdr = inject(ChangeDetectorRef);
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
    theme: DEFAULT_THEME
  });

  editingSection: newsletterSection | null = null;
  showNewSection: boolean = false;
  newSection: newsletterSection = { content: "", newsletterSectionImages: [] };

  // Metod för att starta redigering av en sektion
  editSection(section: newsletterSection): void {
    this.editingSection = section;
    this.cdr.detectChanges();
  }

  // Avbryt redigering
  cancelEdit(): void {
    this.editingSection = null;
    this.cdr.detectChanges();
  }

  // Öppna editor för en ny sektion
  openNewSection(): void {
    this.newSection = { content: "", newsletterSectionImages: [] };
    this.showNewSection = true;
    this.cdr.detectChanges();
  }

  // Avbryt att skapa en ny sektion
  cancelNewSection(): void {
    this.showNewSection = false;
    this.cdr.detectChanges();
  }

  // Sparar en sektion. Om den inte finns i listan läggs den till, annars uppdateras den.
  saveSection(section: newsletterSection): void {
    if (section.content) {
      if (!this.newsletter()!.sections.includes(section)) {
        this.newsletter()!.sections.push(section);
        console.log('Ny sektion tillagd:', section);
      } else {
        console.log('Sektion uppdaterad:', section);
      }
      // Rensa redigeringsläge och stäng editorn
      this.editingSection = null;
      this.showNewSection = false;
      this.cdr.detectChanges();
    } else {
      console.log('Sektionen är inte fullständig.');
    }
  }

  // Tar bort en sektion från nyhetsbrevet
  removeSection(section: newsletterSection): void {
    const index = this.newsletter()?.sections.findIndex(s => s === section);
    if (index !== undefined && index !== -1) {
      this.newsletter()?.sections.splice(index, 1);
      console.log('Sektion borttagen:', section);
      this.cdr.detectChanges();
    }
  }

  // Konverterar en sektion till en bild-URL genom html2canvas
  convertSectionToImage(section: newsletterSection): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
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
          allowTaint: true,
        });
        canvas.toBlob((blob) => {
          if (blob) {
            // Använder FileService för att ladda upp blob och returnera URL
            this.fileService.createAndUploadSection(blob, this.newsletter()!.id).subscribe({
              next: (url) => resolve(url),
              error: (err) => reject(err)
            });
          } else {
            reject(new Error("Kunde inte generera blob från canvas"));
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(tempDiv);
      }
    });
  }
}