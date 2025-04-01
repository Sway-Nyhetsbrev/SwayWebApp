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

  /* 
   Enables editing of a newsletter section.
   Sets the section to be edited and stores its original content.
  */
  editSection(section: newsletterSection): void {
    this.editingSection = section;
    this.originalSectionContent = section.content;
    this.cdr.detectChanges();
  }

  /* 
   Cancels the current edit.
   Restores the original content of the section if available.
  */
  cancelEdit(): void {
    if (this.editingSection && this.originalSectionContent !== null) {
      this.editingSection.content = this.originalSectionContent;
    }
    this.editingSection = null;
    this.originalSectionContent = null;
    this.cdr.detectChanges();
  }

  /* 
   Opens the form to create a new section.
   Resets the new section content and displays the new section form.
  */
  openNewSection(): void {
    this.newSection = { content: "", newsletterSectionImages: [] };
    this.showNewSection = true;
    this.cdr.detectChanges();
  }

  /* 
   Cancels the creation of a new section.
   Hides the new section form.
  */
  cancelNewSection(): void {
    this.showNewSection = false;
    this.cdr.detectChanges();
  }

  /* 
   Saves a newsletter section.
   Validates the section content and images or videos, updates status messages,
   and adds or updates the section in the newsletter.
  */
  saveSection(section: newsletterSection): void {
    const plainText = section.content ? section.content.replace(/<[^>]+>/g, '').trim() : '';
    const hasImages = section.newsletterSectionImages && section.newsletterSectionImages.length > 0;
    const hasVideos = section.newsletterSectionVideos && section.newsletterSectionVideos.length > 0;

    if (plainText.length === 0 && !hasImages && !hasVideos) {
      this.statusMessage = "Please add content to the section!";
      this.statusClass = 'alert alert-warning';
      this.cdr.detectChanges();
      return;
    }

    this.statusMessage = '';
    this.statusClass = '';

    if (!this.newsletter()!.sections.includes(section)) {
      this.newsletter()!.sections.push(section);
      console.log('New section added:', section);
    } else {
      console.log('Section updated:', section);
    }

    this.editingSection = null;
    this.originalSectionContent = null;
    this.showNewSection = false;
    this.cdr.detectChanges();
  }

  /* 
   Removes a newsletter section.
   Finds the section in the newsletter and removes it from the list.
  */
  removeSection(section: newsletterSection): void {
    const index = this.newsletter()?.sections.findIndex(s => s === section);
    if (index !== undefined && index !== -1) {
      this.newsletter()?.sections.splice(index, 1);
      console.log('Section removed:', section);
      this.cdr.detectChanges();
    }
  }

  /* 
   Clears the status message if the newsletter is valid.
   Checks for a valid title, release date, and at least one section with content.
  */
  clearStatusMessage(): void {
    const currentNewsletter = this.newsletter()!;
    const isTitleValid = currentNewsletter.title && currentNewsletter.title.trim().length > 0;

    let isReleaseDateValid = false;
    if (typeof currentNewsletter.releaseDate === 'string') {
      isReleaseDateValid = currentNewsletter.releaseDate.trim().length > 0;
    } else if (currentNewsletter.releaseDate instanceof Date) {
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

  /* 
   Checks if a section's height exceeds the maximum allowed page height.
   Creates a temporary element with the section content to measure its height.
   Rejects if the height exceeds the limit.
  */
  private checkSectionHeight(section: newsletterSection): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.innerHTML = section.content;
      document.body.appendChild(tempDiv);
  
      const sectionHeight = tempDiv.offsetHeight;
      const maxPageHeight = 800;
  
      document.body.removeChild(tempDiv);
  
      if (sectionHeight > maxPageHeight) {
        return reject(new Error("One section is too big!"));
      }
      resolve();
    });
  }

  /* 
   Validates all sections of the newsletter.
   Checks each section's height and updates the status message if any section is too big.
  */
  async validateSections(): Promise<boolean> {
    try {
      await Promise.all(
        this.newsletter()!.sections.map(section => this.checkSectionHeight(section))
      );
      return true;
    } catch (error) {
      this.statusMessage = 'The section is too big!';
      this.statusClass = 'alert alert-warning';
      this.cdr.detectChanges();
      return false;
    }
  }

  /* 
   Converts a newsletter section to an image.
   Validates the section height, creates a temporary element to render the section content,
   converts it to a canvas, and uploads the generated image.
  */
  convertSectionToImage(section: newsletterSection): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.checkSectionHeight(section);
      } 
      catch (error) {
        return reject(error);
      }

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
            reject(new Error("Could not generate blob from canvas"));
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