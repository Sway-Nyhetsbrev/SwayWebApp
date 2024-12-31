import { Component, inject, OnInit, signal } from '@angular/core';
import { FileService } from '../../../services/file.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-latest-newsletter',
  standalone: true,
  imports: [],
  templateUrl: './latest-newsletter.component.html',
  styleUrls: ['./latest-newsletter.component.scss']
})
export class LatestNewsletterComponent implements OnInit {
  fileService = inject(FileService);
  sanitizer = inject(DomSanitizer);  // Inject DomSanitizer
  latestNewsletter = signal<Uint8Array | null>(null);
  isFetching = signal(false);
  errorMessage = signal('');
  pdfSrc: SafeResourceUrl | null = null;  // Use SafeResourceUrl

  ngOnInit() {
    this.isFetching.set(true);
    
    // Check if the saved newsletter exists
    const savedNewsletter = this.fileService.savedNewsletter;
    if (savedNewsletter && savedNewsletter.length > 0) {
      this.latestNewsletter.set(savedNewsletter);
      this.pdfSrc = this.createPdfSrc(savedNewsletter); // Create a blob URL for the PDF
    } else {
      this.errorMessage.set('No saved newsletter available.');
    }

    this.isFetching.set(false);
  }

  // Method to convert saved Uint8Array to a SafeResourceUrl
  private createPdfSrc(savedNewsletter: Uint8Array): SafeResourceUrl {
    const blob = new Blob([savedNewsletter], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);  // Sanitize the URL
  }
}