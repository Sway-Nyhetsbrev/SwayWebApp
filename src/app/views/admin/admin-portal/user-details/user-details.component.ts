import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { User, UserUpdateModel } from '../../../../models/user';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-details',
  imports: [FormsModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export class UserDetailsComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  userService = inject(UserService);
  authService = inject(AuthService)
  loggedUserId = signal("");
  userId: string = '';
  user = signal<User | null>(null);
  enteredRole: string = "";
  location = inject(Location);
  isFetching = signal(false);
  isUpdateing = signal(false);
  isRemoving = signal(false);
  statusMessage: string = '';
  statusClass: string = '';

  ngOnInit() {
    this.userService.getAllUsers();
    const loggedUser = this.authService.getLoggedUser();
    if (loggedUser) {
      this.loggedUserId.set(loggedUser.id)
      console.log(loggedUser)
    }
    this.activatedRoute.params.subscribe((params) => {
      this.userId = params['userId'];
      this.loadUserDetails();
    });
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
        console.log('Current user:', this.user());
        console.log('Logged user ID:', this.loggedUserId());
      },
    });
  }

  loadUpdateDetails() {
    this.isUpdateing.set(true);
    if (this.user()?.id != this.loggedUserId()) {
      const currentUser = this.user();
      if (currentUser && currentUser.role) {
        this.enteredRole = currentUser.role.role;
      }
    }
    else {
      this.statusMessage = ("You can't update your own profile!");
      this.statusClass = 'alert alert-warning'
    }

  }

  loadRemoveDetails() {
    this.isRemoving.set(true);
    if (this.user()?.id != this.loggedUserId()) {
      this.statusMessage = (
        'Are you sure that you want to remove ' + this.user()?.email + '?' 
      );
      this.statusClass = 'alert alert-primary'
    }
    else {
      this.statusMessage = ("You can't remove your own profile!");
      this.statusClass = 'alert alert-warning'
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

  removeUser() {
    const userEmail = this.user()?.email;
  
    if (!userEmail) {
      console.error('User email is undefined. Cannot remove user.');
      this.statusMessage = 'Cannot remove user: Email is missing!';
      this.statusClass = 'alert alert-danger';
      return;
    }
  
    this.userService.removeUser(userEmail).subscribe({
      next: () => {
        console.log('User removed successfully');
        this.isRemoving.set(false);
        this.statusMessage = 'User was successfully removed!';
        this.statusClass = 'alert alert-success';
      },
      error: (err) => {
        console.error('Failed to remove user', err);
        this.statusMessage = 'Failed to remove user!';
        this.statusClass = 'alert alert-danger';
      },
      complete: () => {
        setTimeout(() => {
          this.goBack();
        }, 2000);
      },
    });
  }

  goBack() {
    this.location.back();
  }
}
