import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { ThemeColors } from '../../models/themecolor';
import { ThemeService } from '../../services/theme.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-theme-handler',
  imports: [FormsModule],
  templateUrl: './theme-handler.component.html',
  styleUrl: './theme-handler.component.scss'
})
export class ThemeHandlerComponent implements OnInit {
  private themeService = inject(ThemeService);
  showCreateTheme = false;
  dropdownOpen = false;
  
  // Skickar ut valt tema till föräldern
  @Output() themeChanged = new EventEmitter<ThemeColors>();

  themes: ThemeColors[] = [];

  newTheme: ThemeColors = {
    name: 'Default',
    backgroundStart: '#F5F5F7',
    backgroundEnd: '#F5F5F7',
    textColor: 'black'
  };

  ngOnInit(): void {
    this.loadThemes();
    this.themeChanged.emit({ ...this.newTheme });
  }

  loadThemes(): void {
    this.themeService.getAllNewslettersThemes().subscribe({
      next: (data) => {
        this.themes = data;
        console.log("loadThemes:", data);
      },
      error: (err) => console.error('Error fetching theme:', err)
    });
  }

  createTheme(): void {
    this.themeService.createNewsletterTheme(this.newTheme).subscribe({
      next: (createdTheme) => {
        this.themes.push(createdTheme);
        // Nollställ formuläret
        this.newTheme = {
          name: 'Default',
          backgroundStart: '#F5F5F7',
          backgroundEnd: '#F5F5F7',
          textColor: 'black'
        };
      },
      error: (err) => console.error('Error theme not created:', err)
    });
  }

  removeTheme(theme: ThemeColors): void {
    if (confirm(`Are you sure that you want to remove "${theme.name}"?`)) {
      this.themeService.removeNewsletterTheme(theme.name).subscribe({
        next: () => {
          this.themes = this.themes.filter(t => t.name !== theme.name);
        },
        error: (err) => console.error('Error removing theme:', err)
      });
    }
  }

  // Anropas när användaren klickar på ett tema – skickar ut valt tema till föräldern
  selectTheme(theme: ThemeColors): void {
    this.themeChanged.emit(theme);
    console.log("selectTheme:", theme);
  }

  trackTheme(index: number, theme: ThemeColors): string {
    console.log("trackTheme:", theme);
    return theme.name;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
  
  openCreateTheme(): void {
    this.showCreateTheme = true;
    this.dropdownOpen = false;
  }

  closeCreateTheme() {
    this.showCreateTheme = false;
  }
}