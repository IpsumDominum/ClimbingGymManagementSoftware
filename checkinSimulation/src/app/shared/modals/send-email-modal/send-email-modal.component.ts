import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';

@Component({
  selector: 'send-email-modal',
  templateUrl: './send-email-modal.component.html',
  styleUrls: ['./send-email-modal.component.css']
})
export class SendEmailModalComponent implements OnInit {
  @Input() detailUser;
  htmlContent:string = "";
 
 
editorConfig: AngularEditorConfig = {
    editable: true,
      spellcheck: true,
      height: 'auto',
      minHeight: '380px',
      maxHeight: '380px',
      width: 'auto',
      minWidth: '0',
      translate: 'yes',
      enableToolbar: true,
      showToolbar: true,
      placeholder: 'Enter text here...',
      defaultParagraphSeparator: '',
      defaultFontName: '',
      defaultFontSize: '',

    uploadUrl: 'v1/image',
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',

};
  constructor(
    private modalService:ModalService
  ) { }

  ngOnInit(): void {
  }
  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}
