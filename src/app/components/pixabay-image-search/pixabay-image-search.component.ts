import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  selector: 'app-pixabay-image-search',
  imports: [FormsModule],
  templateUrl: './pixabay-image-search.component.html',
  styleUrl: './pixabay-image-search.component.scss'
})
export class PixabayImageSearchComponent {
  searchTerm = '';
  images: any[] = [];
  cdr = inject(ChangeDetectorRef)

  @Output() imageSelected = new EventEmitter<string>();
  @Output() closeDialog = new EventEmitter<void>();

  constructor(private http: HttpClient) {}

  searchImages() {
    const apiKey = '48774135-ef6cff025934c628b9572ed45';
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(this.searchTerm)}&image_type=photo`;
    this.http.get(url).subscribe((data: any) => {
      this.images = data.hits;
      this.cdr.detectChanges();
    });
  }

  selectImage(image: any) {
    this.imageSelected.emit(image.largeImageURL);
  }

  close() {
    this.closeDialog.emit();
  }
}
