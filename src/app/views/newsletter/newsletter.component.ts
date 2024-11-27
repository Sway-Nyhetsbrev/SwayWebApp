import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-newsletter',
  imports: [],
  templateUrl: './newsletter.component.html',
  styleUrl: './newsletter.component.scss'
})
export class NewsletterComponent {
  userService = inject(UserService);
  users = signal<User[] | null>(null);

  ngOnInit() {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
          this.users.set(data);
      },
      error: (err) => console.error('Error fetching users:', err),
      complete: () => console.log('User fetching completed'),
    });
  }
}

