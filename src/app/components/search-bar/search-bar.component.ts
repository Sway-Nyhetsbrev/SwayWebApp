import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
  searchTerm: string = '';
  private searchSubject: Subject<string> = new Subject<string>();

  @Output() searchEvent = new EventEmitter<string>();

  constructor() {
    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.searchEvent.emit(term);
    });
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }
}