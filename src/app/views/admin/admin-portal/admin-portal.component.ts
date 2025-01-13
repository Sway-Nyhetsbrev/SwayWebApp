import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';



@Component({
  selector: 'app-admin-portal',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './admin-portal.component.html',
  styleUrl: './admin-portal.component.scss'
})
export class AdminPortalComponent implements OnInit {

  ngOnInit() {
  }
}
