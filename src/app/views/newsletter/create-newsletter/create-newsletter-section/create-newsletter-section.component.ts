import { Component, DestroyRef, EventEmitter, inject, Input, Output } from '@angular/core';
import { newsletterSection, newsletterSectionImages } from '../../../../models/newsletter';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { FileService } from '../../../../services/file.service';
import Quill from 'quill';
import { VideoHandler, ImageHandler } from 'ngx-quill-upload';

Quill.register('modules/imageHandler', ImageHandler);
Quill.register('modules/videoHandler', VideoHandler);

@Component({
  selector: 'app-create-newsletter-section',
  standalone: true,
  imports: [FormsModule, QuillModule],
  templateUrl: './create-newsletter-section.component.html',
  styleUrl: './create-newsletter-section.component.scss'
})

export class CreateNewsletterSectionComponent {
  private fileService = inject(FileService)
  private destroyRef = inject(DestroyRef)

  @Input() newsletterSection: newsletterSection = {
    content: '',
    newsletterSectionImages: []
  };

  @Output() save = new EventEmitter<newsletterSection>();

  section: newsletterSection = {
    content: '',
    newsletterSectionImages: []
  };

  newsletterSectionImage: newsletterSectionImages = {
    url: '',
    altText: '',
  };

  saveSection() {
    if (this.section.content) {
      this.save.emit(this.section);
    }
  }
  
  editorModules = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, 3, false] }], 
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      [{ 'color': [] }],
      ['link', 'image'],
    ],
    imageHandler: {
      upload: (newsletterSectionImage: BlobPart) => {
        return new Promise((resolve, reject) => {
          console.log(newsletterSectionImage);
          const subscription = this.fileService.createAndUploadImage(newsletterSectionImage)
            .subscribe({
              next: (response) => {
                console.log('Image was created!', response);
                const imageUrl = response; 
                
                this.newsletterSectionImage.url = imageUrl;
                this.newsletterSectionImage.altText = 'Uploaded Image'; 
                this.section.newsletterSectionImages.push(this.newsletterSectionImage);
  
                resolve(response);
              },
              error: (error) => {
                console.log('Image was not created!', error);
                reject(error);
              }
            });
  
          this.destroyRef.onDestroy(() => {
            subscription.unsubscribe();
          });
        });
      },
      accepts: ['png', 'jpg', 'jpeg', 'jfif']
    }    
  };
}

