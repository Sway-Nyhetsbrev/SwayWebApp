import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';


@Component({
  selector: 'app-user',
  imports: [],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent{
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
