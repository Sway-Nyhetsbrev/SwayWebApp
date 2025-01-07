import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { UserService } from '../../../services/user.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  sanitizer = inject(DomSanitizer);
  newsletter = signal<SafeResourceUrl | null>(null);
  newsletterId: string = "";
  userId: string = "";
  isFetching = signal(false);
  errorMessage = signal('');

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
    this.isFetching.set(true);
    this.newsletterService.getOneNewsletterPdf(this.newsletterId).subscribe({
      next: (response) => {
        console.log("response:" + response)
        if (response && response.fileUri) {
          const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.fileUri);
          this.newsletter.set(safeUrl);
      }},
      error: (err) => {
        console.error("Error fetching newsletter:", err);
        this.errorMessage.set('Failed to fetch the newsletter!');
      },
      complete: () => {
        this.isFetching.set(false);
      },
    });
  }
}
