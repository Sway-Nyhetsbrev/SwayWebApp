import { Component, inject, OnInit, signal } from '@angular/core';
import { NewsletterService } from '../../../services/newsletter.service';
import { AuthService } from '../../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-newsletters',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-newsletters.component.html',
  styleUrls: ['./my-newsletters.component.scss']
})
export class MyNewslettersComponent implements OnInit {
  newsletterService = inject(NewsletterService);
  authService = inject(AuthService);
  errorMessage = signal('');
  userNewsletters = signal<any[]>([]);
  currentNewsletters: any[] = [];
  currentPage = 1;
  pageSize = 9;
  totalNewsletters = 0;
  totalPages = 0;

  ngOnInit() {
    const loggedUser = this.authService.getLoggedUser();
    this.loadNewsletters(loggedUser!.id, this.currentPage);
  }

  loadNewsletters(userId: string, page: number) {
    this.newsletterService.getOneUsersNewsletters(userId, page, this.pageSize).subscribe({
      next: (response) => {
        console.log("Received response:", response);
        if (response && Array.isArray(response)) {
          this.userNewsletters.set(response);

          this.totalNewsletters = response.length;
          this.totalPages = Math.ceil(this.totalNewsletters / this.pageSize);

          const startIdx = (page - 1) * this.pageSize;
          const endIdx = startIdx + this.pageSize;
          this.currentNewsletters = response.slice(startIdx, endIdx);

          console.log("User newsletters (current page):", this.currentNewsletters);
          console.log("Total pages:", this.totalPages);
        } else {
          this.errorMessage.set("No newsletters found");
        }
      },
      error: (err) => {
        console.error("Error fetching newsletters:", err);
        this.errorMessage.set("Failed to load newsletters");
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      const loggedUser = this.authService.getLoggedUser();
      this.loadNewsletters(loggedUser!.id, this.currentPage);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      const loggedUser = this.authService.getLoggedUser();
      this.loadNewsletters(loggedUser!.id, this.currentPage);
    }
  }
}
