import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PDFDocument, rgb } from 'pdf-lib';
import { Observable } from 'rxjs';
import { ThemeColors } from '../models/themecolor'
import { newsletterSectionImages } from '../models/newsletter';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  private httpClient = inject(HttpClient);

  // Skapa PDF med tema och ladda upp den via extern API
  createAndUploadPdf(title: string, sections: string[], images: newsletterSectionImages[][], theme: string): Observable<string> {
    return new Observable<string>((observer) => {
      // Skapa en PDF-dokument
      PDFDocument.create().then(async (pdfDoc) => {
        const page = pdfDoc.addPage([600, 800]);

        // Hämta färger baserat på tema
        const { backgroundStart, backgroundEnd, textColor } = this.getThemeColors(theme);

        // Simulera gradient med flera rektanglar
        const gradientSteps = 20;
        const stepHeight = page.getHeight() / gradientSteps;

        for (let i = 0; i < gradientSteps; i++) {
          const startColor = this.hexToRgb(backgroundStart);
          const endColor = this.hexToRgb(backgroundEnd);

          // Interpolera färger mellan start och slut
          const r = startColor[0] + ((endColor[0] - startColor[0]) / gradientSteps) * i;
          const g = startColor[1] + ((endColor[1] - startColor[1]) / gradientSteps) * i;
          const b = startColor[2] + ((endColor[2] - startColor[2]) / gradientSteps) * i;

          // Rita rektangeln för varje steg
          page.drawRectangle({
            x: 0,
            y: page.getHeight() - (i * stepHeight),
            width: page.getWidth(),
            height: stepHeight,
            color: rgb(r / 255, g / 255, b / 255), // Normera till 0-1
          });
        }

        // Lägg till titel
        const [rTitle, gTitle, bTitle] = this.hexToRgb(textColor).map(val => val / 255);
        page.drawText(title, {
          x: 50,
          y: 750,
          size: 24,
          color: rgb(rTitle, gTitle, bTitle),
        });

        // Lägg till sektioner
        let yOffset = 700;
        for (const section of sections) {
          page.drawText(section, {
            x: 50,
            y: yOffset,
            size: 12,
            color: rgb(rTitle, gTitle, bTitle),
          });
          yOffset -= 20;
        }
      
        // Spara PDF som bytes
        const pdfBytes = await pdfDoc.save();

        // Skapa FormData och bifoga PDF-filen
        const formData = new FormData();
        const fileBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        formData.append('file', fileBlob, fileName); // Bifoga filen som 'file'

        // Logga FormData innan uppladdning
      console.log('FormData:', formData);

      // Skicka FormData till API för uppladdning
      this.httpClient.post('http://localhost:7126/api/Upload?containerName=newsletterpdf', formData).subscribe({
        next: (response) => {
          const fileUrl = response ? (response as any).fileUrl : '';
          observer.next(fileUrl);
          observer.complete();
        },
        error: (error) => {
          // Logga det detaljerade felet från servern
          console.error('Error uploading PDF:', error);
          if (error.status) {
            console.error('Error Status:', error.status); // Kollar statuskoden
          }
          if (error.error) {
            console.error('Error Message:', error.error); // Detaljerat meddelande från servern
          }
          observer.error('Error uploading PDF: ' + error);
        }
      });
      }).catch(error => {
      observer.error('Error creating PDF: ' + error);
      });
      });
  }

  createAndUploadImage(newsletterSectionImage: BlobPart): Observable<string> {
    return new Observable<string>((observer) => {
      const formData = new FormData();
      
      // Skapa ett nytt filnamn baserat på ett unikt ID
      const uniqueFileName = `image_${Date.now()}.jpg`; // Eller använd någon annan logik för att skapa filnamn
  
      // Skapa en Blob från den faktiska filen
      const fileBlob = new Blob([newsletterSectionImage], { type: 'application/jpg' });
  
      // Lägg till filen med det nya unika filnamnet
      formData.append('file', fileBlob, uniqueFileName);
  
      console.log('Uploading file:', uniqueFileName);
  
      // Skicka FormData till API
      this.httpClient.post('http://localhost:7126/api/Upload?containerName=newsletterimages', formData).subscribe({
        next: (response) => {
          console.log('Server response:', response);
          
          // Kontrollera om servern skickar tillbaka en korrekt filväg
          const fileUrl = response ? (response as any).filePath : '';
          if (fileUrl) {
            console.log('Uploaded image URL:', fileUrl);
            observer.next(fileUrl);
            observer.complete();
          } else {
            console.error('No filePath returned from server.');
            observer.error('No filePath in response');
          }
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          observer.error('Error uploading image: ' + error);
        }
      });
    });
  }

  // Get theme colors based on the selected theme
  getThemeColors(theme: string): ThemeColors {
    switch (theme) {
      case 'default-theme':
        return { backgroundStart: '#F5F5F7', backgroundEnd: '#FFFFFF', textColor: 'black' };
      case 'light-theme':
        return { backgroundStart: '#FFFFFF', backgroundEnd: '#EEEEEE', textColor: '#333333' };
      case 'blue-to-pink':
        return { backgroundStart: '#1e3c72', backgroundEnd: '#2a5298', textColor: 'white' };
      case 'purple-to-blue':
        return { backgroundStart: '#6a11cb', backgroundEnd: '#2575fc', textColor: 'white' };
      case 'red-to-orange':
        return { backgroundStart: '#ff416c', backgroundEnd: '#ff4b2b', textColor: 'white' };
      case 'green-to-blue':
        return { backgroundStart: '#00b09b', backgroundEnd: '#96c93d', textColor: 'white' };
      case 'yellow-to-red':
        return { backgroundStart: '#f6d365', backgroundEnd: '#fda085', textColor: 'white' };
      case 'blue-to-turquoise':
        return { backgroundStart: '#4facfe', backgroundEnd: '#00f2fe', textColor: 'white' };
      case 'pink-to-purple':
        return { backgroundStart: '#ff9a9e', backgroundEnd: '#fad0c4', textColor: 'white' };
      case 'orange-to-yellow':
        return { backgroundStart: '#ff7e5f', backgroundEnd: '#feb47b', textColor: 'white' };
      case 'blue-to-green':
        return { backgroundStart: '#00c6ff', backgroundEnd: '#0072ff', textColor: 'white' };
      case 'dark-purple-to-red':
        return { backgroundStart: '#5f2c82', backgroundEnd: '#49a09d', textColor: 'white' };
      default:
        return { backgroundStart: '#FFFFFF', backgroundEnd: '#EEEEEE', textColor: 'black' };
    }
  }

  // Konvertera hex till RGB
  hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0]; // Default till svart om ogiltig hex
  }
}
