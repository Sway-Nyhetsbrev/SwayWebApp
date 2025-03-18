import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  selector: 'app-pixabay-image-search',
  imports: [FormsModule],
  templateUrl: './pixabay-image-search.component.html',
  styleUrl: './pixabay-image-search.component.scss'
})
export class PixabayImageSearchComponent {
  private http = inject(HttpClient)
  searchTerm = '';
  images: any[] = [];
  currentPage = 1;
  totalPages = 1;
  cdr = inject(ChangeDetectorRef);

  @Output() imageSelected = new EventEmitter<string>();
  @Output() closeDialog = new EventEmitter<void>();


  searchImages(page: number = 1) {
    const apiKey = '48774135-ef6cff025934c628b9572ed45';
    const perPage = 20;
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(this.searchTerm)}&page=${page}&per_page=${perPage}`;
    
    this.http.get(url).subscribe((data: any) => {
      this.images = data.hits;
      this.totalPages = Math.ceil(data.totalHits / perPage);
      this.currentPage = page;
      this.cdr.detectChanges();
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.searchImages(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.searchImages(this.currentPage - 1);
    }
  }

  selectImage(image: any) {
    this.imageSelected.emit(image.largeImageURL);
  }

  close() {
    this.closeDialog.emit();
  }
}

