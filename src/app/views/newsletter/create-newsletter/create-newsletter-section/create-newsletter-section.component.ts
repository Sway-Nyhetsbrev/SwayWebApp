import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { newsletterSection } from '../../../../models/newsletter';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { FileService } from '../../../../services/file.service';
import Quill from 'quill';
import { VideoHandler, ImageHandler } from 'ngx-quill-upload';
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';

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
  imports: [FormsModule,QuillModule],
  templateUrl: './create-newsletter-section.component.html',
  styleUrls: ['./create-newsletter-section.component.scss'],
})
export class CreateNewsletterSectionComponent {
  private fileService = inject(FileService);
  isSaving = false;

  @ViewChild(QuillEditorComponent) quillEditor?: QuillEditorComponent;

  // Tar emot sektionen från föräldern
  @Input() section: newsletterSection = { content: "", newsletterSectionImages: [] };

  // Event för att skicka ändringar till föräldern
  @Output() save = new EventEmitter<newsletterSection>();

  saveSection() {
    if (this.quillEditor?.quillEditor) {
      const quillContent = this.quillEditor.quillEditor.root;
  
      // Visa en laddningsindikator eller inaktivera knappen under uppladdning
      this.isSaving = true;
  
      html2canvas(quillContent, {
        backgroundColor: null,
        logging: true,
        useCORS: true,
        scale: 4,
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Blob generated:', blob);
  
            // Ladda upp bilden
            this.uploadSection(blob).then((imageUrl) => {
              console.log('Image uploaded successfully:', imageUrl);
  
              // Uppdatera sektionen med den uppladdade bildens URL
              this.section.content = imageUrl;
  
              // Emitter för att meddela föräldern om att sektionen är sparad
              this.save.emit(this.section);
  
              // Återställ sparningens tillstånd
              this.isSaving = false;
            }).catch((error) => {
              console.error('Failed to upload image:', error);
              this.isSaving = false; // Återställ vid fel
            });
          } else {
            console.error('Failed to generate Blob from canvas');
            this.isSaving = false; // Återställ vid fel
          }
        }, 'image/png');
      }).catch((error) => {
        console.error('Error generating image from Quill content:', error);
        this.isSaving = false; // Återställ vid fel
      });
    }
  }
  
  // Konfiguration för Quill-editorn
  editorModules = {
    toolbar: [
      [{ font: ['bebas', 'dm-sans', 'inter', 'poppins', 'roboto', 'roboto-mono', 'roboto-slab', 'oswald'] }],
      [{'header': [1, 2, 3, 4, 5, 6, false]}],
      ['bold', 'italic', 'underline', 'strike'],
      [{background: []}, {color: []}],
      ['link', 'image'],
      ['code-block'],
      [{'header': 1}, {'header': 2}],
      [{list: 'ordered'}],
      [{'script': 'sub'}, {'script': 'super'}],     
      [{'indent': '-1'}, {'indent': '+1'}],         
      [{ 'align': [] }],
      [{'direction': 'rtl'}],                     

    ],
    imageHandler: {
      upload: (file: Blob) => this.uploadSectionImage(file),
      accepts: ['png', 'jpg', 'jpeg', 'jfif'],
      allowDrop: true,
    },
    
  };
  
  // Hanterar uppladdning av bilder
  private uploadSectionImage(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const subscription = this.fileService.createAndUploadSectionImage(file).subscribe({
        next: (response) => {
          const imageUrl = response;
          this.section.newsletterSectionImages.push({ url: imageUrl, altText: 'Uploaded Image' });
          resolve(imageUrl);
        },
        error: (error) => reject(error),
      });
    });
  }

    // Hanterar uppladdning av bilder
  private uploadSection(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const subscription = this.fileService.createAndUploadSection(file).subscribe({
        next: (response) => {
          const imageSectionUrl = response;
          this.section.content = imageSectionUrl;
          resolve(imageSectionUrl);
        },
        error: (error) => reject(error),
      });
    });
  }
}

