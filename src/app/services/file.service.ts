import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PDFDocument, PDFImage, rgb } from 'pdf-lib';
import { Observable } from 'rxjs';
import { ThemeColors } from '../models/themecolor';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private httpClient = inject(HttpClient);

  async createAndUploadPdf(title: string, sections: string[], theme: string, newsletterId: string): Promise<Observable<string>> {
    console.log("Skapar PDF för:", title);
    return new Observable<string>((observer) => {
      (async () => {
        try {
          const pdfDoc = await PDFDocument.create();
          let page = pdfDoc.addPage([600, 800]);
          let yOffset = 750;
  
          const { backgroundStart, backgroundEnd, textColor } = this.getThemeColors(
            theme
          );
          const gradientSteps = 100;
  
          this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);
  
          const [rTitle, gTitle, bTitle] = this.hexToRgb(textColor).map((val) => val / 255);
          page.drawText(title, { x: 50, y: 770, size: 24, color: rgb(rTitle, gTitle, bTitle) });
  
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            let sectionHeight = 35;
  
            const isUrlImage = section.startsWith('https');
            const isVideoUrl = section.endsWith('.mp4');

            if (isUrlImage) {
              const embeddedImage = await this.embedImageFromUrl(section, pdfDoc);
              if (embeddedImage) {
                const imgDims = this.scaleImageToFit(embeddedImage, page.getWidth() - 100);
                sectionHeight += imgDims.height + 10;
              }
            }

            if (isVideoUrl) {
              // Lägg till en länk för videon
              page.drawText('Video: ' + section, {
                x: 50,
                y: yOffset,
                size: 12,
                color: rgb(rTitle, gTitle, bTitle)
              });
              yOffset -= 20;
              sectionHeight += 20;
            }

            if (yOffset - sectionHeight < 50) {
              page = pdfDoc.addPage([600, 800]);
              yOffset = 750;
              this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);
            }
  
            if (!isUrlImage && !isVideoUrl) {
              page.drawText(section, { x: 50, y: yOffset, size: 12, color: rgb(rTitle, gTitle, bTitle) });
              yOffset -= 20;
            }
  
            if (isUrlImage) {
              const embeddedImage = await this.embedImageFromUrl(section, pdfDoc);
              if (embeddedImage) {
                const imgDims = this.scaleImageToFit(embeddedImage, page.getWidth() - 100);
                page.drawImage(embeddedImage, {
                  x: 50,
                  y: yOffset - imgDims.height,
                  width: imgDims.width,
                  height: imgDims.height,
                });
                yOffset -= imgDims.height + 22;
              }
            }
          }
  
          const pdfBytes = await pdfDoc.save();
          const formData = new FormData();
          const fileBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
          formData.append('file', fileBlob, fileName);
          formData.append('newsletterId', newsletterId);
          console.log('HTTP POST request sent for:', fileName);
  
          this.httpClient.post('http://localhost:7126/api/Upload?containerName=newsletterpdf', formData).subscribe({
            next: (response) => {
              const fileUrl = response ? (response as any).filePath : '';
              if (fileUrl) {
                observer.next(fileUrl);
                observer.complete();
              } else {
                observer.error('Error uploading PDF');
              }
            },
            error: (err) => {
              observer.error('Error uploading PDF');
            }
          });
        } catch (error) {
          observer.error('Error generating PDF');
        }
      })();
    });
  }

  async embedImageFromUrl(imageUrl: string, pdfDoc: PDFDocument): Promise<PDFImage | null> {
    try {
      const response = await fetch(imageUrl);
      console.log("FileService::embedImageFromUrl-Response:", response);
  
      // Kontrollera om det är en bild
      const contentType = response.headers.get('Content-Type');
      console.log("FileService::embedImageFromUrl-contentType:", contentType);
  
      // Tillåt både image/jpeg och application/jpg
      if (!contentType || (!contentType.startsWith('image/jpeg') && !contentType.startsWith('image/png') && !contentType.startsWith('application/jpg'))) {
        console.error('Not a valid image type. Expected JPEG or PNG.');
        return null;
      }
  
      // Hämta bildens byte-array
      const imageBuffer = await response.arrayBuffer();
      console.log('Image Buffer:', imageBuffer);
  
      // Kontrollera att vi har en korrekt JPEG eller PNG och försök att läsa in den korrekt
      if (contentType.startsWith('image/jpeg') || contentType.startsWith('application/jpg')) {
        // För JPEG-bilder
        try {
          return await pdfDoc.embedPng(imageBuffer);  // För JPEG
        } catch (error) {
          console.error('Failed to embed JPEG image:', error);
          return null;
        }
      } else if (contentType.startsWith('image/png')) {
        // För PNG-bilder
        try {
          return await pdfDoc.embedPng(imageBuffer);  // För PNG
        } catch (error) {
          console.error('Failed to embed PNG image:', error);
          return null;
        }
      }
  
      console.error('Unsupported image format');
      return null;
    } catch (error) {
      console.error('Error embedding image from URL:', error);
      return null;
    }
  }

  createAndUploadSectionImage(newsletterSectionImage: BlobPart): Observable<string> {
    return new Observable<string>((observer) => {
      const formData = new FormData();

      // Skapa ett nytt filnamn baserat på ett unikt ID
      const uniqueFileName = `image_${Date.now()}.jpg`; // Eller använd någon annan logik för att skapa filnamn

      // Skapa en Blob från den faktiska filen
      const fileBlob = new Blob([newsletterSectionImage], {
        type: 'application/jpg',
      });

      // Lägg till filen med det nya unika filnamnet
      formData.append('file', fileBlob, uniqueFileName);

      console.log('Uploading file:', uniqueFileName);

      // Skicka FormData till API
      this.httpClient
        .post(
          'http://localhost:7126/api/Upload?containerName=newsletterimages',
          formData
        )
        .subscribe({
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
          },
        });
    });
  }
  
  createAndUploadSection(newsletterSection: BlobPart, newsletterId: string): Observable<string> {
    return new Observable<string>((observer) => {
      const formData = new FormData();

      // Skapa ett nytt filnamn baserat på ett unikt ID
      const uniqueFileName = `image_${Date.now()}.jpg`; // Eller använd någon annan logik för att skapa filnamn

      // Skapa en Blob från den faktiska filen
      const fileBlob = new Blob([newsletterSection], {
        type: 'application/jpg',
      });

      // Lägg till filen med det nya unika filnamnet
      formData.append('file', fileBlob, uniqueFileName);
      formData.append('newsletterId', newsletterId);
      
      console.log('Uploading file:', uniqueFileName);
      
      // Skicka FormData till API
      this.httpClient
        .post(
          'http://localhost:7126/api/Upload?containerName=newslettersections',
          formData
        )
        .subscribe({
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
          },
        });
    });
  }

  private scaleImageToFit(
    embeddedImage: any,
    maxWidth: number
  ): { width: number; height: number } {
    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;
  
    if (!imgWidth || !imgHeight) {
      console.error('Invalid image dimensions:', embeddedImage);
      return { width: 0, height: 0 };
    }
  
    if (imgWidth > maxWidth) {
      const scaleFactor = maxWidth / imgWidth;
      return { width: maxWidth, height: imgHeight * scaleFactor };
    }
  
    return { width: imgWidth, height: imgHeight };
  }

  // Method to add gradient to the page, ensuring it fills the entire page
  private addGradientToPage(
    page: any,
    backgroundStart: string,
    backgroundEnd: string,
    gradientSteps: number
  ): void {
    const startColor = this.hexToRgb(backgroundStart);
    const endColor = this.hexToRgb(backgroundEnd);

    const pageHeight = page.getHeight();
    const stepHeight = pageHeight / gradientSteps;

    for (let i = 0; i < gradientSteps; i++) {
      const r =
        startColor[0] + ((endColor[0] - startColor[0]) / gradientSteps) * i;
      const g =
        startColor[1] + ((endColor[1] - startColor[1]) / gradientSteps) * i;
      const b =
        startColor[2] + ((endColor[2] - startColor[2]) / gradientSteps) * i;

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
    const finalColor = rgb(
      endColor[0] / 255,
      endColor[1] / 255,
      endColor[2] / 255
    );
    page.drawRectangle({
      x: 0,
      y: 0, // Längst ner
      width: page.getWidth(),
      height: 1, // 1 pixel extra för att täcka allt
      color: finalColor,
    });
  }

  // Get theme colors based on the selected theme
  private getThemeColors(theme: string): ThemeColors {
    switch (theme) {
      case 'default-theme':
        return {
          name: 'default-theme',
          backgroundStart: '#F5F5F7',
          backgroundEnd: '#FFFFFF',
          textColor: 'black',
          className: 'default-theme',
        };
      case 'light-theme':
        return {
          name: 'light-theme',
          backgroundStart: '#FFFFFF',
          backgroundEnd: '#EEEEEE',
          textColor: '#333333',
          className: 'light-theme',
        };
      case 'blue-to-pink':
        return {
          name: 'blue-to-pink',
          backgroundStart: '#1e3c72',
          backgroundEnd: '#2a5298',
          textColor: 'white',
          className: 'blue-to-pink',
        };
      case 'purple-to-blue':
        return {
          name: 'purple-to-blue',
          backgroundStart: '#6a11cb',
          backgroundEnd: '#2575fc',
          textColor: 'white',
          className: 'purple-to-blue',
        };
      case 'red-to-orange':
        return {
          name: 'red-to-orange',
          backgroundStart: '#ff416c',
          backgroundEnd: '#ff4b2b',
          textColor: 'white',
          className: 'red-to-orange',
        };
      case 'green-to-blue':
        return {
          name: 'green-to-blue',
          backgroundStart: '#00b09b',
          backgroundEnd: '#96c93d',
          textColor: 'white',
          className: 'green-to-blue',
        };
      case 'yellow-to-red':
        return {
          name: 'yellow-to-red',
          backgroundStart: '#f6d365',
          backgroundEnd: '#fda085',
          textColor: 'white',
          className: 'yellow-to-red',
        };
      case 'blue-to-turquoise':
        return {
          name: 'blue-to-turquoise',
          backgroundStart: '#4facfe',
          backgroundEnd: '#00f2fe',
          textColor: 'white',
          className: 'blue-to-turquoise',
        };
      case 'pink-to-purple':
        return {
          name: 'pink-to-purple',
          backgroundStart: '#ff9a9e',
          backgroundEnd: '#fad0c4',
          textColor: 'white',
          className: 'pink-to-purple',
        };
      case 'orange-to-yellow':
        return {
          name: 'orange-to-yellow',
          backgroundStart: '#ff7e5f',
          backgroundEnd: '#feb47b',
          textColor: 'white',
          className: 'orange-to-yellow',
        };
      case 'blue-to-green':
        return {
          name: 'blue-to-green',
          backgroundStart: '#00c6ff',
          backgroundEnd: '#0072ff',
          textColor: 'white',
          className: 'blue-to-green',
        };
      case 'dark-purple-to-red':
        return {
          name: 'dark-purple-to-red',
          backgroundStart: '#5f2c82',
          backgroundEnd: '#49a09d',
          textColor: 'white',
          className: 'dark-purple-to-red',
        };
      default:
        return {
          name: 'default-theme',
          backgroundStart: '#FFFFFF',
          backgroundEnd: '#EEEEEE',
          textColor: 'black',
          className: 'default-theme',
        };
    }
  }

  // Konvertera hex till RGB
  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0]; // Default till svart om ogiltig hex
  }
}
