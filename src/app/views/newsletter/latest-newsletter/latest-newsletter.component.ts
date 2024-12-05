import { Component, inject, OnInit, signal } from '@angular/core';
import { NewsletterService } from '../../../services/newsletter.service';
import { newsletter } from '../../../models/newsletter';

@Component({
  selector: 'app-latest-newsletter',
  standalone: true,
  imports: [],
  templateUrl: './latest-newsletter.component.html',
  styleUrl: './latest-newsletter.component.scss'
})
export class LatestNewsletterComponent implements OnInit{
  newsletterService = inject(NewsletterService);
  latestNewsletter = signal<newsletter | null>(null);
  isFetching = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.isFetching.set(true);
    this.newsletterService.getLatestNewsletter().subscribe({
      next: (newsletterData) => {
        if (newsletterData) {
          this.latestNewsletter.set(newsletterData);
      }
      },
      error: (error) => {
        console.error('Error fetching latest newsletter:', error);
        this.errorMessage.set(error.error)
      },
      complete: () => {
        console.log('Latest newsletter has been fetched');
        this.isFetching.set(false);
      }
    });
  }
}
