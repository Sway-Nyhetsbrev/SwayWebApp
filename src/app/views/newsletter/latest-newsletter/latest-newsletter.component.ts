import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NewsletterService } from '../../../services/newsletter.service';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

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
  statusMessage = '';
  statusClass = '';

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
        this.statusMessage = 'Invalid fileUri received.';
        this.statusClass = 'alert alert-danger';
      }
    },
    error: (err: HttpErrorResponse) => {
      console.error('Error fetching newsletter:', err);
      
      if (err.status === 404) {
        this.statusMessage = 'Newsletter not found (404).';
        this.statusClass = 'alert alert-warning';
      } else if (err.status === 400) {
        this.statusMessage = 'Bad request (400). Please check your request.';
        this.statusClass = 'alert alert-danger';
      } else {
        this.statusMessage = 'An unexpected error occurred.';
        this.statusClass = 'alert alert-danger';
      }
    },
    complete: () => {
      this.isFetching.set(false);
    }
  });;
  }
}