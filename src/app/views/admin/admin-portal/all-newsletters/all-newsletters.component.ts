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
export class AllNewslettersComponent implements OnInit{
  newsletterService = inject(NewsletterService)
  newsletters = signal<newsletter[] | undefined>(undefined)
  userId = input.required<string>();
  errorMessage = signal('');
  isFetching = signal(false);
  currentNewsletters: any[] = [];
  currentPage = 1;
  pageSize = 9;
  totalNewsletters = 0;
  totalPages = 0;

  ngOnInit() {
    this.loadNewsletters(this.currentPage);
  }
  loadNewsletters(page: number) {
    this.isFetching.set(true);
    this.newsletterService.getAllNewsletters(page, this.pageSize).subscribe({
      next: (response) => {
        console.log("Received response:", response);

        if (response && Array.isArray(response.newsletters)) {
          this.newsletters.set(response.newsletters);
          console.log("Newsletters",this.newsletters())
          this.totalNewsletters = response.totalCount;
          this.totalPages = Math.ceil(this.totalNewsletters / this.pageSize);
  
          console.log('Total newsletters:', this.totalNewsletters);
          console.log('Total pages:', this.totalPages);
  
          this.currentNewsletters = response.newsletters; 
  
          console.log("User newsletters (current page):", this.currentNewsletters);
        } else {
          this.errorMessage.set("No newsletters found");
        }
      },
      error: (err) => {
        console.error("Error fetching newsletters:", err);
        this.errorMessage.set("Failed to load newsletters");
      },
      complete: () => {
        this.isFetching.set(false)
      },
    });
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNewsletters(this.currentPage);
    }
  }
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNewsletters(this.currentPage);
    }
  }
}
