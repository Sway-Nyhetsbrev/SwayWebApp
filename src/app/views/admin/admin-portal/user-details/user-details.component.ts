import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user';
import { Location } from '@angular/common'; 

@Component({
  selector: 'app-user-details',
  imports: [RouterLink],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent implements OnInit{
  activatedRoute = inject(ActivatedRoute)
  userService = inject(UserService)
  userId: string = "";
  user = signal<User | null>(null)
  location = inject(Location);
  isFetching = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.userService.getAllUsers();
    this.activatedRoute.params.subscribe(params => {
      this.userId = params['userId'];
    })
    this.loadUserDetails();
  }

  loadUserDetails() {
    this.isFetching.set(true);
    const users = this.userService.users();
    const userEmail = users?.find(u => u.id === this.userId)?.email;
  
    if (!userEmail) {
      console.error("User email is undefined. Cannot fetch user details.");
      this.errorMessage.set('Failed to fetch user details: Invalid user email.');
      this.isFetching.set(false);
      return; 
    }
  
    const subscription = this.userService.getOneUser(userEmail).subscribe({
      next: (value) => {
        this.user.set(value);
      },
      error: (err) => {
        console.error("ERROR :: userDetailsComponent :: loadUserDetails", err);
        this.errorMessage.set('Failed to fetch user details!');
      },
      complete: () => {
        this.isFetching.set(false);
      }
    });
  }
  goBack() {
    this.location.back();
  }
}
