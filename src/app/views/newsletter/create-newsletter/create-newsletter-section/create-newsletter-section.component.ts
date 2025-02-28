import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { newsletterSection } from '../../../../models/newsletter';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { FileService } from '../../../../services/file.service';
import { FormsModule } from '@angular/forms';
import Quill from 'quill';
import { VideoHandler, ImageHandler } from 'ngx-quill-upload';
import { PixabayImageSearchComponent } from '../../../../components/pixabay-image-search/pixabay-image-search.component';
import { PixabayVideoSearchComponent } from "../../../../components/pixabay-video-search/pixabay-video-search.component";

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
  imports: [FormsModule, QuillModule, PixabayImageSearchComponent, PixabayVideoSearchComponent],
  templateUrl: './create-newsletter-section.component.html',
  styleUrls: ['./create-newsletter-section.component.scss'],
})
export class CreateNewsletterSectionComponent{
  private fileService = inject(FileService);
  crd = inject(ChangeDetectorRef);
  isSaving = false;
  showPixabayImageSearch = false;
  showPixabayVideoSearch = false;

  @ViewChild(QuillEditorComponent) quillEditor?: QuillEditorComponent;

  // Tar emot sektion från föräldern
  @Input() section: newsletterSection = { content: "", newsletterSectionImages: [], newsletterSectionVideos: [] };

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
      container: '#toolbar', // Egen toolbar-container
      handlers: {
        customImage: () => this.openPixabayImageSearch(),
        customVideo: () => this.openPixabayVideoSearch(),
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

  openPixabayImageSearch() {
    this.showPixabayImageSearch = true;
    this.crd.detectChanges();
  }

  openPixabayVideoSearch() {
    this.showPixabayVideoSearch = true;
    this.crd.detectChanges();
  }

  insertImage(imageUrl: string) {
    this.section.newsletterSectionImages.push({ url: imageUrl, altText: 'Uploaded Image' });
    const quill = this.quillEditor?.quillEditor;
    const range = quill?.getSelection(true);
    if (range && quill) {
      quill.insertEmbed(range.index, 'image', imageUrl);
    } 
    else {
      const length = quill?.getLength() || 0;
      quill?.insertEmbed(length, 'image', imageUrl);
    }
    
  }

  insertVideo(video: any) {
    const quill = this.quillEditor?.quillEditor;
    const range = quill?.getSelection(true);
    if (range && quill) {
      quill.insertEmbed(range.index, 'video', video.url);
    } else {
      const length = quill?.getLength() || 0;
      quill?.insertEmbed(length, 'video', video.url);
    }

    if (!this.section.newsletterSectionVideos) {
      this.section.newsletterSectionVideos = [];
    }
    
    // Lägger till video med thumbnail till sektionen
    this.section.newsletterSectionVideos.push(video);

    this.crd.detectChanges();
  }
  
  handleImageClose() {
    this.showPixabayImageSearch = false;
    this.crd.detectChanges();
  }

  handleVideoClose() {
    this.showPixabayVideoSearch = false;
    this.crd.detectChanges();
  }

  handleVideoSelected(video: any) {
    const videoData = {
      url: video.url,
      title: video.title,
      thumbnail: video.thumbnail
    };
    this.insertVideo(videoData);
  }
}