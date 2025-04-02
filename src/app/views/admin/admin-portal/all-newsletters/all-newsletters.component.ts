import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NewsletterService } from '../../../../services/newsletter.service';
import { newsletter } from '../../../../models/newsletter';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-all-newsletters',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './all-newsletters.component.html',
  styleUrl: './all-newsletters.component.scss'
})
export class AllNewslettersComponent implements OnInit {
  newsletterService = inject(NewsletterService);
  newsletters = signal<newsletter[] | undefined>(undefined);
  userId = input.required<string>();
  isFetching = signal(false);
  statusMessage: string = '';
  statusClass: string = '';
  currentNewsletters: any[] = [];
  currentPage = 1;
  pageSize = 9;
  totalNewsletters = 0;
  totalPages = 0;

  /* 
   Initializes the component.
   Loads the newsletters for the current page.
  */
  ngOnInit() {
    this.loadNewsletters(this.currentPage);
  }

  /* 
   Loads newsletters for a given page.
   Fetches newsletters from the service and updates pagination details.
  */
  loadNewsletters(page: number) {
    this.isFetching.set(true);
    this.newsletterService.getAllNewsletters(page, this.pageSize).subscribe({
      next: (response) => {
        console.log("Received response:", response);

        if (response && Array.isArray(response.newsletters)) {
          this.newsletters.set(response.newsletters);
          console.log("Newsletters", this.newsletters());
          this.totalNewsletters = response.totalCount;
          this.totalPages = Math.ceil(this.totalNewsletters / this.pageSize);

          console.log('Total newsletters:', this.totalNewsletters);
          console.log('Total pages:', this.totalPages);

          this.currentNewsletters = response.newsletters;

          console.log("User newsletters (current page):", this.currentNewsletters);
          if (this.currentNewsletters.length === 0) {
            this.statusMessage = "No newsletters available";
            this.statusClass = 'alert alert-warning';
          }
        } else {
          this.statusMessage = "No newsletters found";
          this.statusClass = 'alert alert-warning';
        }
      },
      error: (err) => {
        console.error("Error fetching newsletters:", err);
        this.statusMessage = "Failed to load newsletters";
        this.statusClass = 'alert alert-danger';
      },
      complete: () => {
        this.isFetching.set(false);
      },
    });
  }

  getFirstImage(newsletter: any): any {
    if (newsletter.sections && newsletter.sections.length) {
      for (const section of newsletter.sections) {
        if (section.newsletterSectionImages && section.newsletterSectionImages.length) {
          return section.newsletterSectionImages[0];
        }
      }
    }
    return null;
  }

  /* 
   Advances to the next page if available.
   Increments the current page and loads newsletters for that page.
  */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNewsletters(this.currentPage);
    }
  }

  /* 
   Returns to the previous page if available.
   Decrements the current page and loads newsletters for that page.
  */
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNewsletters(this.currentPage);
    }
  }
}
