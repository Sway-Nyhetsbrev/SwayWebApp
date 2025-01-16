import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../../services/newsletter.service';

@Component({
  selector: 'app-update-newsletter',
  imports: [],
  templateUrl: './update-newsletter.component.html',
  styleUrl: './update-newsletter.component.scss'
})
export class UpdateNewsletterComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService)
  newsletterId = "";

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.newsletterId = params['newsletterId'];
      this.loadNewsletterDetails();
    });
  }

  loadNewsletterDetails() {

  }
}
