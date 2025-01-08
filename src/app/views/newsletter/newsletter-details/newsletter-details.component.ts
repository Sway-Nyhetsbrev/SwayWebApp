import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { UserService } from '../../../services/user.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import JSZip from 'jszip';

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
  newsletters = signal<SafeResourceUrl[]| null>(null);
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
      next: async (response: Blob) => {
        try {
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(response);
  
          // Extrahera alla bilder och lagra som SafeResourceUrl
          const images: SafeResourceUrl[] = [];
          for (const fileName in zipContent.files) {
            const file = zipContent.files[fileName];
            if (!file.dir) {
              const content = await file.async('blob'); // Läs varje fil som en Blob
              const imageUrl = URL.createObjectURL(content);
              images.push(this.sanitizer.bypassSecurityTrustResourceUrl(imageUrl));
            }
          }
  
          // Spara bilder i signal eller visa på sidan
          if (images.length > 0) {
            this.newsletters.set(images); // Visa den första bilden (som exempel)
          } else {
            this.errorMessage.set('No images found in the ZIP file!');
          }
        } catch (error) {
          console.error("Error processing ZIP file:", error);
          this.errorMessage.set('Failed to process the ZIP file!');
        }
      },
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
