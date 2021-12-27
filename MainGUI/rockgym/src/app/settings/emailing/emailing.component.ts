import { Component, OnInit, Input } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { ModalService } from 'src/app/shared/modals/modal/modal.service';

@Component({
  selector: 'app-emailing',
  templateUrl: './emailing.component.html',
  styleUrls: ['./emailing.component.css']
})
export class EmailingComponent implements OnInit {
  @Input() detailUser;
  htmlContent:string = "";
  emailTemplates:any;
 focusedTemplate:any;
 templateHeader:string = "";
editorConfig: AngularEditorConfig = {
    editable: true,
      spellcheck: true,
      height: 'auto',
      minHeight: '380px',
      maxHeight: '380px',
      width: '800px',
      minWidth: '0',
      translate: 'yes',
      enableToolbar: true,
      showToolbar: true,
      placeholder: 'Enter text here...',
      defaultParagraphSeparator: '',
      defaultFontName: '',
      defaultFontSize: '',

   
    sanitize:false,
    toolbarPosition: 'top',

};
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  async ngOnInit() {
    await this.load();
    if(this.emailTemplates.length>0){
      this.setAsFocusedTemplate(this.emailTemplates[0])
    }
  }
  setAsFocusedTemplate(template){
    this.focusedTemplate = template;
    this.htmlContent = template.template_content;
    this.templateHeader = template.template_header;
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

  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}
editTemplate(){
  this.mainService.editEmailTemplate(
    {"template_id":this.focusedTemplate.id,
     "template_html":this.htmlContent,
     "template_header":this.templateHeader,
     "template_active":this.focusedTemplate.active
    }
    ).then((result)=>{
      if(result=="success"){
        this.load();
      }
      alert(result);
  });
}
restoreToDefaultTemplate(){
  this.mainService.editEmailTemplate(
    {"template_id":this.focusedTemplate.id,
     "template_html":this.focusedTemplate.template_content_default,
     "template_header":this.focusedTemplate.template_header_default,
     "template_active":true
    }
    ).then((result)=>{
      if(result=="success"){
        this.load();
      }
      alert(result);
  });
}

dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getFullYear()) +"-"+(date_parsed.getMonth()+1) + "-" + date_parsed.getUTCDate() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
  }
}  

}
