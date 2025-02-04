import { Component, Input, ViewChild } from '@angular/core';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-edit-newsletter-section',
  imports: [QuillModule, FormsModule],
  templateUrl: './edit-newsletter-section.component.html',
  styleUrl: './edit-newsletter-section.component.scss'
})
export class EditNewsletterSectionComponent {
  isUpdating = false;
  closeSection = false;

  @ViewChild(QuillEditorComponent) quillEditor?: QuillEditorComponent;

  // Tar emot sektionen från föräldern
  @Input() newsletterId: string = "";

  editSection() {
    if (this.quillEditor?.quillEditor) {
      const quillContent = this.quillEditor.quillEditor.root;
  
      // Visa en laddningsindikator eller inaktivera knappen under uppladdning
      this.isUpdating = true;
      
      console.log("NewsletterId",this.newsletterId)
    }
  }
  
  // Konfiguration för Quill-editorn
  editorModules = {
    toolbar: [
      [{ font: ['bebas', 'dm-sans', 'inter', 'poppins', 'roboto', 'roboto-mono', 'roboto-slab', 'oswald'] }],
      [{'header': [1, 2, 3, 4, 5, 6, false]}],
      ['bold', 'italic', 'underline', 'strike'],
      [{background: []}, {color: []}],
      ['link', 'image'],
      ['code-block'],
      [{'header': 1}, {'header': 2}],
      [{list: 'ordered'}],
      [{'script': 'sub'}, {'script': 'super'}],     
      [{'indent': '-1'}, {'indent': '+1'}],         
      [{ 'align': [] }],
      [{'direction': 'rtl'}],                     

    ],
    imageHandler: {
      // upload: (file: Blob) => this.uploadSectionImage(file),
      accepts: ['png', 'jpg', 'jpeg', 'jfif'],
      allowDrop: true,
    },
    
  };
}
