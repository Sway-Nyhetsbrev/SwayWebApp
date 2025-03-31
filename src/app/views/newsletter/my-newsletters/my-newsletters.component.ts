import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NewsletterService } from '../../../services/newsletter.service';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-my-newsletters',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-newsletters.component.html',
  styleUrls: ['./my-newsletters.component.scss']
})
export class MyNewslettersComponent implements OnInit {
  newsletterService = inject(NewsletterService);
  userService = inject(UserService);
  userId = input.required<string>();
  statusMessage: string = '';
  statusClass: string = '';
  isFetching = signal(false);
  userNewsletters = signal<any[]>([]);
  currentNewsletters: any[] = [];
  currentPage = 1;
  pageSize = 9;
  totalNewsletters = 0;
  totalPages = 0;

  userName = computed(() => {
    const users = this.userService.users();
    return users?.find(u => u.id === this.userId())?.userName || users?.find(u => u.id === this.userId())?.email;
  });

  /* 
   Initializes the component.
   Loads all users and fetches newsletters for the current user.
  */
  ngOnInit() {
    this.userService.getAllUsers();
    this.loadNewsletters(this.userId(), this.currentPage);
  }

  /* 
   Loads newsletters for a given user and page.
   Fetches newsletters from the service and updates pagination information.
  */
  loadNewsletters(userId: string, page: number) {
    this.isFetching.set(true);
    this.statusMessage = '';
    this.newsletterService.getOneUsersNewsletters(userId, page, this.pageSize).subscribe({
      next: (response) => {
        console.log("Received response:", response);
  
        if (response && Array.isArray(response.newsletters)) {
          if (response.newsletters.length > 0) {
            this.userNewsletters.set(response.newsletters);
            this.totalNewsletters = response.totalCount;
            this.totalPages = Math.ceil(this.totalNewsletters / this.pageSize);
            this.currentNewsletters = response.newsletters;
  
            console.log('Total newsletters:', this.totalNewsletters);
            console.log('Total pages:', this.totalPages);
          } else {
            this.statusMessage = "No newsletters found";
            this.statusClass = 'alert alert-warning';
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching newsletters:', err);
        if (err.status === 400) {
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
    });
  }

  /* 
   Advances to the next page if available.
   Increments the current page and reloads the newsletters.
  */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNewsletters(this.userId(), this.currentPage);
    }
  }

  /* 
   Goes back to the previous page if available.
   Decrements the current page and reloads the newsletters.
  */
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNewsletters(this.userId(), this.currentPage);
    }
  }
}
