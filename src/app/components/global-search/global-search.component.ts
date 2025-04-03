import { Component, computed, input } from '@angular/core';
import { newsletter } from '../../models/newsletter';
import { User } from '../../models/user';
import { NewsletterService } from '../../services/newsletter.service';
import { UserService } from '../../services/user.service';
import { SearchBarComponent } from "../search-bar/search-bar.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-global-search',
  imports: [SearchBarComponent, RouterLink],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.scss'
})
export class GlobalSearchComponent {
  searchTerm: string = '';
  foundNewsletters: newsletter[] = [];
  foundUsers: User[] = [];
  isLoading: boolean = false;
  statusMessage: string = '';
  userId = input.required<string>();

  userName = computed(() => {
    const users = this.userService.users();
    return users?.find(u => u.id === this.userId())?.userName || users?.find(u => u.id === this.userId())?.email;
  });

  constructor(
    private newsletterService: NewsletterService,
    private userService: UserService
  ) {}

  onSearch(term: string): void {
    this.searchTerm = term;
    if (!term) {
      this.foundNewsletters = [];
      this.foundUsers = [];
      return;
    }

    this.isLoading = true;
    const lowerTerm = term.toLowerCase();

    this.newsletterService.getAllNewsletters(1, 100).subscribe({
      next: (response) => {
        if (response && Array.isArray(response.newsletters)) {
          const allNewsletters = response.newsletters;
          this.foundNewsletters = allNewsletters.filter((nl: newsletter) =>
            nl.title.toLowerCase().includes(lowerTerm)
          );
        } 
        else {
          this.statusMessage = 'No newsletter was found';
        }
      },
      error: () => {
        this.statusMessage = 'Error fetching newsletter';
      }
    });

    this.userService.getAllUsers();
    setTimeout(() => {
      const allUsers = this.userService.users() || [];
      this.foundUsers = allUsers.filter(user =>
        user.userName?.toLowerCase().includes(lowerTerm) ||
        user.email.toLowerCase().includes(lowerTerm)
      );
      this.statusMessage = this.foundUsers.length ? '' : 'Nothing was found';
      this.isLoading = false;
    }, 500);
  }
}
