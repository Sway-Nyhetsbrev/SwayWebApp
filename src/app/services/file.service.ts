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
  async createAndUploadPdf(title: string, sections: string[], images: newsletterSectionImages[][], theme: string, newsletterId: string): Promise<Observable<string>> {
    return new Observable<string>((observer) => {
      (async () => {
        try {
          const pdfDoc = await PDFDocument.create();
          let page = pdfDoc.addPage([600, 800]);
          let yOffset = 700; // Start position for content
  
          // Get theme colors
          const { backgroundStart, backgroundEnd, textColor } = this.getThemeColors(theme);
          const gradientSteps = 100;
  
          // Add gradient background to the first page
          this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);
  
          // Add title
          const [rTitle, gTitle, bTitle] = this.hexToRgb(textColor).map(val => val / 255);
          page.drawText(title, { x: 50, y: 750, size: 24, color: rgb(rTitle, gTitle, bTitle) });
  
          // Loop through sections and images
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
  
            // Calculate the total height needed for the section (text + images)
            let sectionHeight = 35; // Initial height for the text (40 px)
  
            if (images[i]) {
              for (const image of images[i]) {
                if (image.url) {
                  const imageBuffer = await this.httpClient.get(image.url, { responseType: 'arraybuffer' }).toPromise();
                  if (!imageBuffer) {
                    console.error(`Failed to load image from URL ${image.url}`);
                    continue;
                  }
  
                  const embeddedImage = await pdfDoc.embedJpg(imageBuffer);
                  const imgDims = this.scaleImageToFit(embeddedImage, page.getWidth() - 100);
                  sectionHeight += imgDims.height + 10; // Add the height of the image + spacing
                }
              }
            }
  
            // Check if the section fits on the current page
            if (yOffset - sectionHeight < 50) { // If not enough space, add a new page
              page = pdfDoc.addPage([600, 800]); // Add a new page
              yOffset = 750; // Reset yOffset for the new page
  
              // Reapply the gradient background on the new page
              this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);
            }
  
            // Draw the text for the section
            page.drawText(section, { x: 50, y: yOffset, size: 12, color: rgb(rTitle, gTitle, bTitle) });
            yOffset -= 20;
  
            // Draw images for this section
            if (images[i]) {
              for (const image of images[i]) {
                if (image.url) {
                  try {
                    const imageBuffer = await this.httpClient.get(image.url, { responseType: 'arraybuffer' }).toPromise();
                    if (!imageBuffer) {
                      console.error(`Failed to load image from URL ${image.url}`);
                      continue;
                    }
  
                    const embeddedImage = await pdfDoc.embedJpg(imageBuffer);
                    const imgDims = this.scaleImageToFit(embeddedImage, page.getWidth() - 100);
  
                    page.drawImage(embeddedImage, {
                      x: 50,
                      y: yOffset - imgDims.height,
                      width: imgDims.width,
                      height: imgDims.height,
                    });
  
                    yOffset -= imgDims.height + 22; // Add spacing after the image
                  } catch (imageError) {
                    console.error(`Error embedding image from URL ${image.url}:`, imageError);
                  }
                }
              }
            }
          }
  
          // Save PDF as bytes
          const pdfBytes = await pdfDoc.save();
          console.log('Generated PDF bytes:', pdfBytes);
  
          // Create FormData and append the PDF file
          const formData = new FormData();
          const fileBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
          formData.append('file', fileBlob, fileName);
          formData.append('newsletterId', newsletterId);
  
          // Upload the PDF to the server
          this.httpClient.post('http://localhost:7126/api/Upload?containerName=newsletterpdf', formData).subscribe({
            next: (response) => {
              const fileUrl = response ? (response as any).filePath : '';
              if (fileUrl) {
                observer.next(fileUrl);
                observer.complete();
              } else {
                observer.error('No fileUrl returned from server');
              }
            },
            error: (error) => {
              observer.error('Error uploading PDF: ' + error);
            }
          });
        } catch (error) {
          observer.error('Error creating PDF: ' + error);
        }
      })();
    });
  }

  // Method to scale image to fit within the page, only scale large images
  private scaleImageToFit(embeddedImage: any, maxWidth: number): { width: number, height: number } {
    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    // Only scale the image if it's larger than the maximum width
    if (imgWidth > maxWidth) {
      const scaleFactor = maxWidth / imgWidth;
      const scaledWidth = maxWidth;
      const scaledHeight = imgHeight * scaleFactor;
      return { width: scaledWidth, height: scaledHeight };
    }

    // If the image is small, return its original dimensions
    return { width: imgWidth, height: imgHeight };
  }

  // Method to add gradient to the page, ensuring it fills the entire page
  private addGradientToPage(page: any, backgroundStart: string, backgroundEnd: string, gradientSteps: number): void {
    const startColor = this.hexToRgb(backgroundStart);
    const endColor = this.hexToRgb(backgroundEnd);
  
    const pageHeight = page.getHeight();
    const stepHeight = pageHeight / gradientSteps;
  
    for (let i = 0; i < gradientSteps; i++) {
      const r = startColor[0] + ((endColor[0] - startColor[0]) / gradientSteps) * i;
      const g = startColor[1] + ((endColor[1] - startColor[1]) / gradientSteps) * i;
      const b = startColor[2] + ((endColor[2] - startColor[2]) / gradientSteps) * i;
  
      // Justera höjden och lägg till en liten överlappning mellan stegen
      const yStart = pageHeight - (i + 1) * stepHeight;
      const adjustedHeight = stepHeight + 1; // Lägg till 1 pixel för att säkerställa överlappning
  
      page.drawRectangle({
        x: 0,
        y: yStart,
        width: page.getWidth(),
        height: adjustedHeight, // Gör rektangeln något högre
        color: rgb(r / 255, g / 255, b / 255),
      });
    }
  
    // Säkerställ att vi fyller längst ner
    const finalColor = rgb(endColor[0] / 255, endColor[1] / 255, endColor[2] / 255);
    page.drawRectangle({
      x: 0,
      y: 0, // Längst ner
      width: page.getWidth(),
      height: 1, // 1 pixel extra för att täcka allt
      color: finalColor,
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
        return { name: 'default-theme', backgroundStart: '#F5F5F7', backgroundEnd: '#FFFFFF', textColor: 'black', className: 'default-theme' };
      case 'light-theme':
        return { name: 'light-theme', backgroundStart: '#FFFFFF', backgroundEnd: '#EEEEEE', textColor: '#333333', className: 'light-theme' };
      case 'blue-to-pink':
        return { name: 'blue-to-pink', backgroundStart: '#1e3c72', backgroundEnd: '#2a5298', textColor: 'white', className: 'blue-to-pink' };
      case 'purple-to-blue':
        return { name: 'purple-to-blue', backgroundStart: '#6a11cb', backgroundEnd: '#2575fc', textColor: 'white', className: 'purple-to-blue' };
      case 'red-to-orange':
        return { name: 'red-to-orange', backgroundStart: '#ff416c', backgroundEnd: '#ff4b2b', textColor: 'white', className: 'red-to-orange' };
      case 'green-to-blue':
        return { name: 'green-to-blue', backgroundStart: '#00b09b', backgroundEnd: '#96c93d', textColor: 'white', className: 'green-to-blue' };
      case 'yellow-to-red':
        return { name: 'yellow-to-red', backgroundStart: '#f6d365', backgroundEnd: '#fda085', textColor: 'white', className: 'yellow-to-red' };
      case 'blue-to-turquoise':
        return { name: 'blue-to-turquoise', backgroundStart: '#4facfe', backgroundEnd: '#00f2fe', textColor: 'white', className: 'blue-to-turquoise' };
      case 'pink-to-purple':
        return { name: 'pink-to-purple', backgroundStart: '#ff9a9e', backgroundEnd: '#fad0c4', textColor: 'white', className: 'pink-to-purple' };
      case 'orange-to-yellow':
        return { name: 'orange-to-yellow', backgroundStart: '#ff7e5f', backgroundEnd: '#feb47b', textColor: 'white', className: 'orange-to-yellow' };
      case 'blue-to-green':
        return { name: 'blue-to-green', backgroundStart: '#00c6ff', backgroundEnd: '#0072ff', textColor: 'white', className: 'blue-to-green' };
      case 'dark-purple-to-red':
        return { name: 'dark-purple-to-red', backgroundStart: '#5f2c82', backgroundEnd: '#49a09d', textColor: 'white', className: 'dark-purple-to-red' };
      default:
        return { name: 'default-theme', backgroundStart: '#FFFFFF', backgroundEnd: '#EEEEEE', textColor: 'black', className: 'default-theme'  };
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
