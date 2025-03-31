import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PDFDocument, PDFImage, rgb } from 'pdf-lib';
import { firstValueFrom, Observable } from 'rxjs';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private httpClient = inject(HttpClient);
  private themeService = inject(ThemeService);

  /* 
   Creates a PDF from the provided title, sections, and theme,
   then uploads the PDF and returns an observable with the file URL.
  */
  async createAndUploadPdf(title: string, sections: string[], theme: string, newsletterId: string): Promise<Observable<string>> {
    console.log("Creating PDF for:", title);
    return new Observable<string>((observer) => {(async () => {
        try {
          // Retrieve the theme from ThemeService
          const themeData = await firstValueFrom(this.themeService.getOneNewsletterTheme(theme));

          if (!themeData) {
            observer.error('Failed to retrieve theme from ThemeService');
            return;
          }

          const { backgroundStart, backgroundEnd, textColor } = themeData;
          const pdfDoc = await PDFDocument.create();
          let page = pdfDoc.addPage([600, 800]);
          let yOffset = 750;

          const gradientSteps = 100;

          this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);

          const [rTitle, gTitle, bTitle] = this.hexToRgb(textColor).map((val) => val / 255);
          page.drawText(title, { x: 50, y: 770, size: 24, color: rgb(rTitle, gTitle, bTitle) });

          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            let sectionHeight = 35;

            const isUrlImage = section.startsWith('https');
            const isVideoUrl = section.endsWith('.mp4');

            // Handle image sections
            if (isUrlImage) {
              const embeddedImage = await this.embedImageFromUrl(section, pdfDoc);
              if (embeddedImage) {
                const imgDims = this.scaleImageToFit(embeddedImage, page.getWidth() - 100);
                sectionHeight += imgDims.height + 10;
                if (yOffset - sectionHeight < 50) {
                  page = pdfDoc.addPage([600, 800]);
                  yOffset = 750;
                  this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);
                }
                page.drawImage(embeddedImage, {
                  x: 50,
                  y: yOffset - imgDims.height,
                  width: imgDims.width,
                  height: imgDims.height,
                });
                yOffset -= imgDims.height + 22;
                continue;
              }
            }

            // Handle video links
            if (isVideoUrl) {
              if (yOffset - sectionHeight < 50) {
                page = pdfDoc.addPage([600, 800]);
                yOffset = 750;
                this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);
              }
              page.drawText('Video: ' + section, {
                x: 50,
                y: yOffset,
                size: 12,
                color: rgb(rTitle, gTitle, bTitle),
              });
              yOffset -= 20;
              continue;
            }

            // Handle regular text (non image/video sections)
            if (yOffset - sectionHeight < 50) {
              page = pdfDoc.addPage([600, 800]);
              yOffset = 750;
              this.addGradientToPage(page, backgroundStart, backgroundEnd, gradientSteps);
            }
            page.drawText(section, { x: 50, y: yOffset, size: 12, color: rgb(rTitle, gTitle, bTitle) });
            yOffset -= 20;
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
              } 
              else {
                observer.error('Error uploading PDF');
              }
            },
            error: (err) => {
              observer.error('Error uploading PDF');
            },
          });
        } catch (error) {
          observer.error('Error generating PDF');
        }
      })();
    });
  }

  /* 
   Embeds an image from a URL into the PDF document.
   Validates the content type and returns the embedded image or null.
  */
  async embedImageFromUrl(imageUrl: string, pdfDoc: PDFDocument): Promise<PDFImage | null> {
    try {
      const response = await fetch(imageUrl);
      console.log("FileService::embedImageFromUrl-Response:", response);

      // Check if the resource is an image
      const contentType = response.headers.get('Content-Type');
      console.log("FileService::embedImageFromUrl-contentType:", contentType);

      // Allow both image/jpeg and application/jpg
      if (!contentType || (!contentType.startsWith('image/jpeg') && !contentType.startsWith('image/png') && !contentType.startsWith('application/jpg'))) {
        console.error('Not a valid image type. Expected JPEG or PNG.');
        return null;
      }

      // Retrieve the image byte array
      const imageBuffer = await response.arrayBuffer();
      console.log('Image Buffer:', imageBuffer);

      // Ensure proper JPEG or PNG and attempt to embed accordingly
      if (contentType.startsWith('image/jpeg') || contentType.startsWith('application/jpg')) {
        // For JPEG images
        try {
          return await pdfDoc.embedPng(imageBuffer);
        } catch (error) {
          console.error('Failed to embed JPEG image:', error);
          return null;
        }
      } else if (contentType.startsWith('image/png')) {
        // For PNG images
        try {
          return await pdfDoc.embedPng(imageBuffer);
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

  /* 
   Creates and uploads a section image.
   Converts the image blob into a file and uploads it, returning an observable with the file URL.
  */
  createAndUploadSectionImage(newsletterSectionImage: BlobPart): Observable<string> {
    return new Observable<string>((observer) => {
      const formData = new FormData();

      const uniqueFileName = `image_${Date.now()}.png`;
      const fileBlob = new Blob([newsletterSectionImage], {
        type: 'image/png',
      });

      // Append the file
      formData.append('file', fileBlob, uniqueFileName);

      console.log('Uploading file:', uniqueFileName);

      this.httpClient
        .post('http://localhost:7126/api/Upload?containerName=newsletterimages', formData)
        .subscribe({
          next: (response) => {
            console.log('Server response:', response);
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
  
  /* 
   Creates and uploads a section.
   Converts the section blob into a file, appends the newsletterId,
   uploads it, and returns an observable with the file URL.
  */
  createAndUploadSection(newsletterSection: BlobPart, newsletterId: string): Observable<string> {
    return new Observable<string>((observer) => {
      const formData = new FormData();

      const uniqueFileName = `image_${Date.now()}.png`;
      const fileBlob = new Blob([newsletterSection], {
        type: 'image/png',
      });

      // Append the file and newsletterId
      formData.append('file', fileBlob, uniqueFileName);
      formData.append('newsletterId', newsletterId);
      
      console.log('Uploading file:', uniqueFileName);
      
      this.httpClient
        .post('http://localhost:7126/api/Upload?containerName=newslettersections', formData)
        .subscribe({
          next: (response) => {
            console.log('Server response:', response);
            // Check if the server returns a valid file path
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

  /* 
   Scales the embedded image to fit within the maximum width.
   Returns the new width and height for the image.
  */
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

  /* 
   Adds a gradient to the PDF page.
   Draws multiple rectangles with gradually changing colors from backgroundStart to backgroundEnd.
  */
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
      const r = startColor[0] + ((endColor[0] - startColor[0]) / gradientSteps) * i;
      const g = startColor[1] + ((endColor[1] - startColor[1]) / gradientSteps) * i;
      const b = startColor[2] + ((endColor[2] - startColor[2]) / gradientSteps) * i;

      const yStart = pageHeight - (i + 1) * stepHeight;
      const adjustedHeight = stepHeight + 1; 

      page.drawRectangle({
        x: 0,
        y: yStart,
        width: page.getWidth(),
        height: adjustedHeight, 
        color: rgb(r / 255, g / 255, b / 255),
      });
    }

    const finalColor = rgb(endColor[0] / 255, endColor[1] / 255, endColor[2] / 255);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: 1,
      color: finalColor,
    });
  }

  /* 
   Converts a hexadecimal color string to an RGB array.
   Returns an array with the red, green, and blue values, or defaults to black if invalid.
  */
  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0]; // Default to black if hex is invalid
  }
}
