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
  originalSectionContent: string | null = null;
  showNewSection: boolean = false;
  newSection: newsletterSection = { content: "", newsletterSectionImages: [] };

  editSection(section: newsletterSection): void {
    this.editingSection = section;
    this.originalSectionContent = section.content;
    this.cdr.detectChanges();
}

  cancelEdit(): void {
    if (this.editingSection && this.originalSectionContent !== null) {
      this.editingSection.content = this.originalSectionContent;
    }
    this.editingSection = null;
    this.originalSectionContent = null;
    this.cdr.detectChanges();
  }

  openNewSection(): void {
    this.newSection = { content: "", newsletterSectionImages: [] };
    this.showNewSection = true;
    this.cdr.detectChanges();
  }

  cancelNewSection(): void {
    this.showNewSection = false;
    this.cdr.detectChanges();
  }

  saveSection(section: newsletterSection): void {
    const plainText = section.content ? section.content.replace(/<[^>]+>/g, '').trim() : '';
    const hasImages = section.newsletterSectionImages && section.newsletterSectionImages.length > 0;
    const hasVideos = section.newsletterSectionVideos && section.newsletterSectionVideos.length > 0;
  
    if (plainText.length === 0 && !hasImages && !hasVideos) {
      this.statusMessage = "Please add content to the section!"
      this.statusClass = 'alert alert-warning';
      this.cdr.detectChanges();
      return;
    }
  
    this.statusMessage = '';
    this.statusClass = '';
  
    if (!this.newsletter()!.sections.includes(section)) {
      this.newsletter()!.sections.push(section);
      console.log('Ny sektion tillagd:', section);
    } 
    else {
      console.log('Sektion uppdaterad:', section);
    }
  
    this.editingSection = null;
    this.originalSectionContent = null;
    this.showNewSection = false;
    this.cdr.detectChanges();
  }

  removeSection(section: newsletterSection): void {
    const index = this.newsletter()?.sections.findIndex(s => s === section);
    if (index !== undefined && index !== -1) {
      this.newsletter()?.sections.splice(index, 1);
      console.log('Sektion borttagen:', section);
      this.cdr.detectChanges();
    }
  }

  clearStatusMessage(): void {
    const currentNewsletter = this.newsletter()!;
    const isTitleValid = currentNewsletter.title && currentNewsletter.title.trim().length > 0;

    let isReleaseDateValid = false;
    if (typeof currentNewsletter.releaseDate === 'string') {
      isReleaseDateValid = currentNewsletter.releaseDate.trim().length > 0;
    } 
    else if (currentNewsletter.releaseDate instanceof Date) {
      isReleaseDateValid = true;
    }

    const areSectionsValid =
      currentNewsletter.sections.length > 0 &&
      currentNewsletter.sections.every(section => {
        const plainText = section.content ? section.content.replace(/<[^>]+>/g, '').trim() : '';
        return plainText.length > 0;
      });
    
    if (isTitleValid && isReleaseDateValid && areSectionsValid) {
      this.statusMessage = '';
      this.statusClass = '';
      this.cdr.detectChanges();
    }
  }

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
          scale: 2,
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
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(tempDiv);
      }
    });
  }
}