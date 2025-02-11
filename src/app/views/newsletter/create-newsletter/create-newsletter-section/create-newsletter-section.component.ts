import { AfterViewInit, Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { newsletterSection } from '../../../../models/newsletter';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { FileService } from '../../../../services/file.service';
import { FormsModule } from '@angular/forms';
import Quill from 'quill';
import { VideoHandler, ImageHandler } from 'ngx-quill-upload';

Quill.register('modules/imageHandler', ImageHandler);
Quill.register('modules/videoHandler', VideoHandler);
Quill.register('modules/font', {
  'bebas': 'Bebas Neue',
  'dm-sans': 'DM Sans',
  'inter': 'Inter',
  'poppins': 'Poppins',
  'roboto': 'Roboto',
  'roboto-mono': 'Roboto Mono',
  'roboto-slab': 'Roboto Slab',
  'oswald': 'Oswald'
});

@Component({
  selector: 'app-create-newsletter-section',
  standalone: true,
  imports: [FormsModule, QuillModule],
  templateUrl: './create-newsletter-section.component.html',
  styleUrls: ['./create-newsletter-section.component.scss'],
})
export class CreateNewsletterSectionComponent{
  private fileService = inject(FileService);
  isSaving = false;

  @ViewChild(QuillEditorComponent) quillEditor?: QuillEditorComponent;

  // Tar emot sektion från föräldern
  @Input() section: newsletterSection = { content: "", newsletterSectionImages: [] };

  // Event för att skicka ändringar till föräldern
  @Output() save = new EventEmitter<newsletterSection>();
  
  saveSection() {
    if (this.quillEditor?.quillEditor) {
      // Spara endast HTML-innehållet från Quill-editorn
      this.section.content = this.quillEditor.quillEditor.root.innerHTML;
      this.save.emit(this.section);
      this.isSaving = true;    
    }
    else {
      this.isSaving = false;
    }
  }

  // Konfiguration för Quill-editorn
  editorModules = {
    toolbar: {
      container: '#toolbar', // Använd vår egna toolbar-container
      handlers: {
        // Handler för den custom-knappen
        
      }
    },
    imageHandler: {
      upload: (file: Blob) => this.uploadSectionImage(file),
      accepts: ['png', 'jpg', 'jpeg', 'jfif'],
      allowDrop: true,
    },
  };

  // Hanterar uppladdning av bilder inuti Quill-editorn
  private uploadSectionImage(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      this.fileService.createAndUploadSectionImage(file).subscribe({
        next: (response) => {
          const imageUrl = response;
          this.section.newsletterSectionImages.push({ url: imageUrl, altText: 'Uploaded Image' });
          resolve(imageUrl);
        },
        error: (error) => reject(error),
      });
    });
  }
}