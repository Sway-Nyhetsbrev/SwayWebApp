import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { newsletterSectionVideos } from '../../models/newsletter';

@Component({
  selector: 'app-pixabay-video-search',
  imports: [FormsModule],
  templateUrl: './pixabay-video-search.component.html',
  styleUrl: './pixabay-video-search.component.scss'
})
export class PixabayVideoSearchComponent {
  searchTerm = '';
  videos: any[] = [];
  currentPage = 1;
  totalPages = 1;
  cdr = inject(ChangeDetectorRef);

  newsletterVideos: newsletterSectionVideos[] = [];

  @Output() videoSelected = new EventEmitter<newsletterSectionVideos>();
  @Output() closeDialog = new EventEmitter<void>();

  constructor(private http: HttpClient) {}

  searchVideos(page: number = 1) {
    const apiKey = '48774135-ef6cff025934c628b9572ed45';
    const perPage = 20;
    const url = `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(this.searchTerm)}&page=${page}&per_page=${perPage}`;
    
    this.http.get(url).subscribe((data: any) => {
      this.videos = data.hits;
      this.totalPages = Math.ceil(data.totalHits / perPage);
      this.currentPage = page;
  
      // Uppdatera newsletterVideos med video och thumbnail
      this.newsletterVideos = this.videos.map((video: any) => {
        return {
          url: video.videos.large.url,
          title: video.tags,
          thumbnail: video.videos.large.thumbnail
        };
      });

      this.cdr.detectChanges();
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.searchVideos(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.searchVideos(this.currentPage - 1);
    }
  }

  selectVideo(video: any) {
    // Skicka den valda videon till föräldern
    this.videoSelected.emit({
      url: video.videos.large.url,
      thumbnail: video.videos.large.thumbnail,
      title: video.tags
    });
  }

  close() {
    this.closeDialog.emit();
  }
}
