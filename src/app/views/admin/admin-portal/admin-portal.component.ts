import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';



@Component({
  selector: 'app-admin-portal',
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './admin-portal.component.html',
  styleUrl: './admin-portal.component.scss'
})
export class AdminPortalComponent implements OnInit {
  private router = inject(Router)
  private activeRoute = inject(ActivatedRoute);
  
  ngOnInit() {
    const userId = this.activeRoute.snapshot.params['userId'];
    if (userId) {
      this.router.navigate([`/admin-portal/${userId}/all-newsletters`]);
    }
  }
}
