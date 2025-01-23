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

  @ViewChild(QuillEditorComponent) quillEditor?: QuillEditorComponent;

  // Tar emot sektionen från föräldern
  @Input() section: newsletterSection = { content: "", newsletterSectionImages: [] };

  // Event för att skicka ändringar till föräldern
  @Output() save = new EventEmitter<newsletterSection>();

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
      upload: (file: Blob) => this.uploadImage(file),
      accepts: ['png', 'jpg', 'jpeg', 'jfif'],
      allowDrop: true,
    },
  };

  saveSection() {
    if (this.quillEditor?.quillEditor) {
      const quillContent = this.quillEditor.quillEditor.root;
  
      html2canvas(quillContent, {
        backgroundColor: null,
        logging: true,
        useCORS: true,
        scale: 4,
      }).then((canvas) => {
        const imageUrl = canvas.toDataURL('image/png');
  
        console.log('Generated Base64 Image URL Length:', imageUrl.length);
        console.log('Base64 Preview:', imageUrl.slice(0, 50)); // Förhandsvisning för felsökning
  
        // Lägg till Base64-strängen till sektionen
        this.section.content = imageUrl;
  
        // Spara sektionen och vidarebefordra den
        this.save.emit(this.section);
      }).catch((error) => {
        console.error('Error generating image from Quill content:', error);
      });
    }
  }

  // Hanterar uppladdning av bilder
  private uploadImage(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const subscription = this.fileService.createAndUploadImage(file).subscribe({
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

