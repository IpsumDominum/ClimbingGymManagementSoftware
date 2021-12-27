import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { MainService } from '../../main.service';

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

    uploadUrl: 'http://localhost:5000/Image',
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',

};
  emailTemplates: any;
  focusedTemplate: any;
  mailHeader:string;
  chosenTemplateSelect:string = "empty";
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  ngOnInit(){
    this.load();
  }
  async load(){
    await this.mainService.getAllEmailTemplates().then((result)=>{
      this.emailTemplates = result;      
    });
    if(this.focusedTemplate){
      this.emailTemplates.forEach(template => {
        if(template.id==this.focusedTemplate.id){
          this.setAsFocusedTemplate(template)
        }
      });
    }
  }
  setAsFocusedTemplate(template: any) {
    throw new Error("Method not implemented.");
  }
  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}
loadTemplate(){
  if(this.chosenTemplateSelect=="empty"){
    this.htmlContent = ""
  }else{
    this.emailTemplates.forEach(email => {
      if(email.id == this.chosenTemplateSelect){
        this.htmlContent = email.template_content;
        this.mailHeader = email.template_header;
      }
    });
  }
}
sendMail(){
  this.mainService.sendArbitaryEmail(this.htmlContent).then((result)=>{
  });

}
}
