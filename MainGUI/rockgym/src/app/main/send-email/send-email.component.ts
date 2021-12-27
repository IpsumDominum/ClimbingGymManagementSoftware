import { Component, OnInit, Input } from '@angular/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-send-email',
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.css']
})
export class SendEmailComponent implements OnInit {
  @Input() detailUser;
  htmlContent:string = "";
  today = new Date();

 
displayData:any = new Array(12).fill(undefined);
resultData:any = [];
searchPrompt:string = "";
chosenCustomer:any = {'id':""};
mailJobs:any =[];
editorConfig: AngularEditorConfig = {
    editable: true,
      spellcheck: true,
      height: 'auto',
      minHeight: '380px',
      maxHeight: '380px',
      width: '750px',
      minWidth: '0',
      translate: 'yes',
      enableToolbar: true,
      showToolbar: true,
      placeholder: 'Enter text here...',
      defaultParagraphSeparator: '',
      defaultFontName: '',
      defaultFontSize: '',

   
    sanitize: false,
    toolbarPosition: 'top',

};
  emailTemplates: any;
  focusedTemplate: any;
  mailHeader:string = "";
  chosenTemplateSelect:string = "empty";
  recipients:any[] = [];

  lookUpKey:string = "Common";

  totalPage:number = 0;
  currentPage:number = 0;
  totalAmount:number = 0;
  
  loading:boolean = false;
  constructor(
    private mainService:MainService
  ) {
    /*setInterval( async () => {
      this.today = new Date();
      await this.mainService.getMailQueue().then((result)=>{
        this.mailJobs = result;
      })
    }, 1000);*/
   }

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
    this.mainService.getMailQueue().then((result)=>{
      this.mailJobs = result;
    });
  }
  setAsFocusedTemplate(template: any) {
    throw new Error("Method not implemented.");
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
  if(this.recipients.length==0){
    alert("No recipients selected.");
    return;
  }  
  this.mainService.sendArbitaryEmail({
    "msg_html":this.htmlContent,
    "msg_header":this.mailHeader,
    "recipients":this.recipients
  }).then((result)=>{
    alert(result);
    this.mainService.getMailQueue().then((result)=>{
      this.mailJobs = result;
    });
  });  
  this.mainService.getMailQueue().then((result)=>{
    this.mailJobs = result;
  });
}

/* CHOOSE CUSTOMERS...*/


isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  // @ts-ignore
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
  // @ts-ignore
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
onSearchChange($event): void {  
  if($event.target.value==""){
    return;
  }
  
  if(! this.isNumeric($event.target.value)){
    $event.target.value = "";
  }else{
    let parsed = parseInt($event.target.value);
    if(parsed>this.totalPage){
      parsed = this.totalPage;
      $event.target.value = this.totalPage;
    }
    this.currentPage = parsed;
  }
  
  
  this.search(
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":12,
    "currentPage":this.currentPage,
    "searchType":"normal"
     }
  );
}
search(searchQuery){
  
  this.mainService.searchMember(
    searchQuery
    ).then((result=>{
      this.displayData = new Array(12).fill(undefined);
      if(result["response"]=="success"){            
        this.resultData = result["data"];
        this.totalPage = result["total_pages"];
        this.currentPage = result["current_page"];
        this.totalAmount = result["total_amount"];
        for(var i=0;i<this.resultData.length;i++){
          if(i<this.displayData.length){
            this.displayData[i] = this.resultData[i];
          }else{
            this.displayData.push(this.resultData[i]);
          }
        }             
      }else{
        alert(result["response"]);
      }
  }));
}

searchNew(){      
  this.search(
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":12,
    "currentPage":1,
    "searchType":"normal"
     }
  );
}
nextPage(){      
  if(this.currentPage==this.totalPage){
    return;
  }
  this.search(
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":12,
    "currentPage":this.currentPage+1,
    "searchType":"normal"
     }
  );
}
previousPage(){
  if(this.currentPage==1 || this.currentPage==0){
    return;
  }
  this.search(
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":12,
    "currentPage":this.currentPage-1,
    "searchType":"normal"
     }
  );
}

handleKeyboardEvent(event:KeyboardEvent){
  if(event.key=="Enter"){
    this.search(
      {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":12,
    "currentPage":1,
    "searchType":"normal"
     }
    );
  }
}  

chooseCustomer(customer){
  if(customer!=undefined){
    this.chosenCustomer = customer;
  }
}
/*
Confirm and emit customer to above component
*/
confirm(){
  
}

dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
  }
}  
dateFromISO(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear();
  }else{
    return "-";
  }
}
isBirthday(birthday){
    let date = new Date(birthday);
    let today = new Date();
    let month_diff = today.getMonth() - date.getMonth();
    let day_diff = today.getUTCDate() - date.getUTCDate()-1;        
    if(month_diff==0 && day_diff==0){
      return true;
    }else{
      return false;
    }
}
getAgeGroup(customer){
  let today = new Date();
  if(customer.birthday){
    let date = new Date(customer.birthday);
    let year_diff = today.getFullYear() - date.getFullYear();
    let month_diff = today.getMonth() - date.getMonth();
    if(month_diff>0){
    }else if(month_diff==0){
      let day_diff = today.getUTCDate() - date.getUTCDate();        
      if(day_diff >=0){
      }else{
        year_diff -=1;
      }
    }else{
      year_diff -=1;
    }
    if(year_diff<13){
      return "Child"
    }else if(year_diff>=13 && year_diff <18){
      return "Young Adult"
    }else{
      return "Adult"
    }
  }else{
    return "-";
  }
}
getShortened(family){
  if(family){
    return family.slice(0,6)
  }else{
    return "-";
  }
}

addToRecipients(){
if(!this.chosenCustomer || this.chosenCustomer.id==""){
  alert("please choose a customer first");
}else{
  let found = this.recipients.find(recp_current=>recp_current.id==this.chosenCustomer.id);
  if(found){
    return;
  }else{
    this.recipients.push(this.chosenCustomer);
  }
}
}

removeRecipient(recp){
  this.recipients = this.recipients.filter(recp_current=>recp_current.id!=recp.id);
}
cancelMailQueueJob(job){
  this.mainService.cancelMailingJob(job.id).then((result)=>{
    alert(result);
  })
}

}
