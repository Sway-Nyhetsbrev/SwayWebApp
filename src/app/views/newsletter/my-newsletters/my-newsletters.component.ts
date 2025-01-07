import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NewsletterService } from '../../../services/newsletter.service';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-my-newsletters',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-newsletters.component.html',
  styleUrls: ['./my-newsletters.component.scss']
})
export class MyNewslettersComponent implements OnInit {
  newsletterService = inject(NewsletterService);
  userService = inject(UserService)
  userId = input.required<string>();
  errorMessage = signal('');
  userNewsletters = signal<any[]>([]);
  currentNewsletters: any[] = [];
  currentPage = 1;
  pageSize = 9;
  totalNewsletters = 0;
  totalPages = 0;

  userName = computed( () => {
    const users = this.userService.users();
    return users?.find(u => u.id === this.userId())?.userName || users?.find(u => u.id === this.userId())?.email
  })

  ngOnInit() {
    this.userService.getAllUsers();
    this.loadNewsletters(this.userId(), this.currentPage);
  }

  loadNewsletters(userId: string, page: number) {
    this.newsletterService.getOneUsersNewsletters(userId, page, this.pageSize).subscribe({
      next: (response) => {
        console.log("Received response:", response);
  
        if (response && Array.isArray(response.newsletters)) {
          this.userNewsletters.set(response.newsletters);
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
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNewsletters(this.userId(), this.currentPage);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNewsletters(this.userId(), this.currentPage);
    }
  }
}
