import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsletterService } from '../../../services/newsletter.service';
import { UserService } from '../../../services/user.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import JSZip from 'jszip';
import { newsletter } from '../../../models/newsletter';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-newsletter-details',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './newsletter-details.component.html',
  styleUrl: './newsletter-details.component.scss'
})
export class NewsletterDetailsComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  newsletterService = inject(NewsletterService)
  userService = inject(UserService)
  sanitizer = inject(DomSanitizer);
  newsletters = signal<SafeResourceUrl[]| null>(null);
  newsletter = signal<newsletter | null>(null)
  newsletterId: string = "";
  userId: string = "";
  isFetching = signal(false);
  errorMessage = signal('');

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
      next: async (response: Blob) => {
        try {
          console.log("Response:", response)
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(response);
  
          // Extrahera alla bilder och lagra som SafeResourceUrl
          const images: SafeResourceUrl[] = [];
          for (const fileName in zipContent.files) {
            const file = zipContent.files[fileName];
            if (!file.dir) {
                const content = await file.async('blob');
                
                // Sätt MIME-typ för blobben
                const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
                const typedBlob = new Blob([content], { type: mimeType });
        
                const imageUrl = URL.createObjectURL(typedBlob);
                console.log('Blob type:', mimeType); // Logga MIME-typ
                console.log('Image URL:', imageUrl);
        
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
      }
    });
    this.newsletterService.getOneNewsletter(this.newsletterId).subscribe({
      next: async (response: newsletter) => {
        console.log("GetOneNewsletterResponse:",response)
        if (response != null) {
          this.newsletter.set(response);
        }
        else {
          this.errorMessage.set("No newsletter cound be found!")
        }    
      },
      error: (err) => {
        console.error('Error fetching newsletter:', err);
        this.errorMessage.set('Failed to fetch newsletter details!');
      },
      complete: () => {
        this.isFetching.set(false);
      }
    })
  }
}
