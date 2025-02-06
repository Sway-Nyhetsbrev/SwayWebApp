import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { UserService } from '../../../services/user.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-newsletter-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './newsletter-details.component.html',
  styleUrl: './newsletter-details.component.scss'
})
export class NewsletterDetailsComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService)
  userService = inject(UserService)
  sanitizer = inject(DomSanitizer);
  location = inject(Location)
  newsletter = signal<SafeResourceUrl | null>(null)
  newsletterId: string = "";
  userId: string = "";
  isFetching = signal(false);
  isUpdateing = signal(false);
  isRemoving = signal(false);
  statusMessage: string = '';
  statusClass: string = '';

  userRole = computed( () => {
    const users = this.userService.users();
    return users?.find(u => u.id === this.userId)?.role;
  })

  ngOnInit() {
    this.userService.getAllUsers();
    this.activatedRoute.params.subscribe(params => {
      this.newsletterId = params['newsletterId'];
      this.userId = params['userId'];
      this.loadNewsletterDetails();
    })
  }

  loadNewsletterDetails() {
    this.isFetching.set(true);
    this.newsletterService.getOneNewsletterPdf(this.newsletterId).subscribe({
      next: (value: any) => {
        console.log("Value:", value);
        if (value && value.fileUri) {
          const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(value.fileUri);
          this.newsletter.set(safeUrl);
        } else {
          console.error('Invalid fileUri received:', value);
          this.statusMessage = 'Invalid fileUri received.';
          this.statusClass = 'alert alert-danger';
        }
      },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching newsletter:', err);
          
          if (err.status === 404) {
            this.statusMessage = 'Newsletter not found (404).';
            this.statusClass = 'alert alert-warning';
          } else if (err.status === 400) {
            this.statusMessage = 'Bad request (400). Please check your request.';
            this.statusClass = 'alert alert-danger';
          } else {
            this.statusMessage = 'An unexpected error occurred.';
            this.statusClass = 'alert alert-danger';
          }
        },
        complete: () => {
          this.isFetching.set(false);
        }
      });;
  }

  loadDeleteNewsletterDetails() {
    this.isRemoving.set(true);
    if (this.newsletterId) {
      this.statusMessage = (
        'Are you sure that you want to remove this newsletter?' 
      );
      this.statusClass = 'alert alert-primary'
    }
  }

  deleteNewsletter() {
    this.newsletterService.removeNewsletter(this.newsletterId).subscribe({
      error: (err) => {
        console.error('Failed to remove newsletter', err);
        this.statusMessage = 'Failed to remove newsletter!';
        this.statusClass = 'alert alert-danger';
      },
    });

    this.newsletterService.removeNewsletterBlob(this.newsletterId).subscribe({
      next: () => {
        console.log('Newsletter was removed successfully');
        this.isRemoving.set(false);
        this.statusMessage = 'Newsletter was successfully removed!';
        this.statusClass = 'alert alert-success';
      },
      error: (err) => {
        console.error('Failed to remove newsletter', err);
        this.statusMessage = 'Failed to remove newsletterPdf!';
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
