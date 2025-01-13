import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-all-users',
  imports: [RouterLink],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.scss'
})
export class AllUsersComponent implements OnInit {
  userService = inject(UserService);
  users = this.userService.users;

  ngOnInit() {
    this.userService.getAllUsers();
    this.users()?.forEach(user => console.log(user))
  }


}
