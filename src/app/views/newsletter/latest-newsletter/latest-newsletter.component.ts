import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NewsletterService } from '../../../services/newsletter.service';

@Component({
  selector: 'app-latest-newsletter',
  standalone: true,
  imports: [],
  templateUrl: './latest-newsletter.component.html',
  styleUrls: ['./latest-newsletter.component.scss']
})
export class LatestNewsletterComponent implements OnInit {
  newsletterService = inject(NewsletterService);
  sanitizer = inject(DomSanitizer);
  latestNewsletter = signal<SafeResourceUrl | null>(null);
  isFetching = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.isFetching.set(true);
    this.newsletterService.getLatestNewsletter().subscribe({
    next: (value: any) => {
      console.log("Value:", value);
      if (value && value.fileUri) {
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(value.fileUri);
        this.latestNewsletter.set(safeUrl);
      } else {
        console.error('Invalid fileUri received:', value);
        this.errorMessage.set('Invalid fileUri received.');
      }
    },
    error: (err) => {
      console.error('Error fetching newsletter:', err);
      this.errorMessage.set('Failed to fetch the latest newsletter');
    },
    complete: () => {
      this.isFetching.set(false);
    }
    });
  }
}