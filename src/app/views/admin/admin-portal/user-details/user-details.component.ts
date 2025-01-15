import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { User, UserUpdateModel } from '../../../../models/user';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-details',
  imports: [FormsModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export class UserDetailsComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  userService = inject(UserService);
  userId: string = '';
  user = signal<User | null>(null);
  enteredRole: string = "";
  location = inject(Location);
  isFetching = signal(false);
  isUpdateing = signal(false);
  statusMessage: string = '';
  statusClass: string = '';

  ngOnInit() {
    this.userService.getAllUsers();
    this.activatedRoute.params.subscribe((params) => {
      this.userId = params['userId'];
    });
    this.loadUserDetails();
  }

  loadUserDetails() {
    this.isFetching.set(true);
    const users = this.userService.users();
    const userEmail = users?.find((u) => u.id === this.userId)?.email;

    if (!userEmail) {
      console.error('User email is undefined. Cannot fetch user details.');
      this.statusMessage = (
        'Failed to fetch user details: Invalid user email.'
      );
      this.statusClass = 'alert alert-danger'
      this.isFetching.set(false);
      return;
    }

    const subscription = this.userService.getOneUser(userEmail).subscribe({
      next: (value) => {
        this.user.set(value);
      },
      error: (err) => {
        console.error('ERROR :: userDetailsComponent :: loadUserDetails', err);
        this.statusMessage = ('Failed to fetch user details!');
        this.statusClass = 'alert alert-danger'
      },
      complete: () => {
        this.isFetching.set(false);
      },
    });
  }

  loadUpdateDetails() {
    this.isUpdateing.set(true);
    const currentUser = this.user();
    if (currentUser && currentUser.role) {
      this.enteredRole = currentUser.role.role;
    }
  }

  updateUser() {
    const currentUser = this.user();
    if (!currentUser) {
      console.error('User is null. Cannot update.');
      return;
    }
    if (currentUser.role?.role == this.enteredRole) {
      this.statusMessage = ('Change to a new role!');
      this.statusClass = 'alert alert-warning'
      return;
    }
    console.log("Entered role:", this.enteredRole)
    const updatedUser: UserUpdateModel = {
      email: currentUser.email,
      userName: currentUser.userName,
      role: this.enteredRole,
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: (updatedUser) => {
        console.log('User updated successfully', updatedUser);
        this.loadUserDetails();
      },
      error: (err) => {
        console.error('Failed to update user', err);
        this.statusMessage = ("Failed to update user!")
        this.statusClass = 'alert alert-danger'
      },
      complete: () => {
        this.isUpdateing.set(false);
        this.statusMessage = ("User was updated successfully!");
        this.statusClass = 'alert alert-success'
      },
    });
  }

  goBack() {
    this.location.back();
  }
}
