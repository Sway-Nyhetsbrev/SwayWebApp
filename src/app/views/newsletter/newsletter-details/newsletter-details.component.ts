import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { newsletter } from '../../../models/newsletter';
import { User } from '../../../models/user';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-newsletter-details',
  standalone: true,
  imports: [],
  templateUrl: './newsletter-details.component.html',
  styleUrl: './newsletter-details.component.scss'
})
export class NewsletterDetailsComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService)
  userService = inject(UserService)
  newsletterId: string = "";
  newsletterDetails: newsletter | undefined;
  userId: string = "";
  user: User | undefined;

  userRole = computed( () => {
    const users = this.userService.users();
    return users?.find(u => u.id === this.userId)?.role;
  })

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.newsletterId = params['newsletterId'];
      this.userId = params['userId'];
      this.loadNewsletterDetails();
    })
  }

  loadNewsletterDetails() {
    
  }
}
