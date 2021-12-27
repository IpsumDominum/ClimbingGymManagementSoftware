import { Component, ElementRef, EventEmitter, OnInit, Output, Input } from '@angular/core'
import { ifError } from 'assert';
import { MainService } from 'src/app/shared/main.service';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'add-customer-modal',
  templateUrl: './add-customer-modal.component.html',
styleUrls: ['./add-customer-modal.component.css']
})
export class AddCustomerModalComponent implements OnInit {
  
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() customer:any;
  @Input() mode:string = "new";
  @Input() size:string="small";
  displayData:any = new Array(12).fill(undefined);
  resultData:any = [];
  searchPrompt:string = "";
  invalid:boolean[] = new Array(6).fill(false);
    /*
    Basic Info
    */
    title:string = "";
    lastName:string = "";
    firstName:string = "";
    middleName:string = "";
    birthday:string = "";
    /*
    Address Info
    */
    address1:string = "";
    address2:string = "";
    postalCode:string = "";
    city:string = "";
    state:string = "";
    country:string = "";
    /*
    Contact Info
    */
    cellphone:string = "";
    homephone:string = "";
    workphone:string = "";    
    email:string = "";
    /*
    Emergency Contact
    */
    emergencyContact:string = "";
    emergencyContactRelation:string = "";
    emergencyContactPhone:string = "";

    /*
    Other Info
    */
    accessAfterHours:boolean = false;
    page:number = 1;
    loading:boolean = false;

    waitForUnique:boolean = false;
    /*Current User data fields, used for editing mode*/
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) {        
       }

    ngOnInit() {
      this.loading = true;
      this.load();
      this.loading = false;
    }
    async load(){
      if(this.mode=="new"){
        this.page = 1;
      }else if(this.mode=="edit"){
          this.page = 2;      
      }
    }
    prev(){
      this.page = 1;
    }
    next(){
      if(this.firstName==""){
        alert("please fill in at least first and last name");
        return;
      }
      if(this.lastName==""){
        alert("please fill in at least first and last name");
        return;
      }
      if(this.waitForUnique){
        let unique = true;
        this.resultData.forEach(result => {
          if(result.middleName==this.middleName ){
            unique = false;
          }
        });
        if(unique==true){
          this.page = 2;
          return;
        }else{
          alert("please ensure new customer is unique")
          return;
        }
      }
      this.search();
    }
  async search(){    
    this.resultData = [];
    this.displayData = new Array(12).fill(undefined);        

    await this.mainService.searchMember(
      {"firstName":this.firstName,
      "middleName":this.middleName,
      "lastName":this.lastName,
      "searchType":"name",
       }).then((result=>{
         result.forEach(ele => {
          this.resultData.push(ele);
         });
    }));

      for(var i=0;i<this.resultData.length;i++){
        if(i<this.displayData.length){
          this.displayData[i] = this.resultData[i];
        }else{
          this.displayData.push(this.resultData[i]);
        }
      }
    /*
      Good if no contradicting customer found
    */
    if(this.resultData.length==0){
      this.page = 2;
      this.waitForUnique = false;
    }else{
      alert("Existing Customer Found, If this is not a mistake, Please Specifiy a unique Middle Name.")
      this.waitForUnique = true;
    }
  } 
  parseDate(date){
    let tokens = date.split("-");
        let date_obj = new Date(tokens[0],tokens[1]-1,tokens[2]);
    return date_obj;
  } 
    async createMember(){
            /*
      I apologize, sincerely, for this code...
      I apologize.
      If you ask for answers,
      just know,
      I apologize.
      */
     this.invalid = new Array(6).fill(false);
     let any_invalid = false;
     if(this.title==""){  
      this.invalid[0] = true;
      any_invalid = true;
     }
     if(this.birthday==""){  
      this.invalid[1] = true;
      any_invalid = true;
     }
     if( this.email==""){
       this.invalid[2] = true;
       any_invalid = true;
     }
     if(this.emergencyContact==""){
       this.invalid[3] = true;
       any_invalid = true;
     }     
     if(this.emergencyContactRelation==""){
       this.invalid[4] = true;
       any_invalid = true;
     }
     if(this.emergencyContactPhone==""){
      this.invalid[5] = true;
      any_invalid = true;
    }
     if(any_invalid==true){
       alert("please fill in all required fields!");
       return;
     }
     
      let parsed = this.parseDate(this.birthday).toISOString();
      

      let data = {     
        "title":this.title,
        "firstName": this.firstName,
        "lastName": this.lastName,
        "middleName": this.middleName,
        "address1": this.address1,
        "address2": this.address2,
        "postalCode": this.postalCode,
        "city": this.city,
        "state": this.state,
        "country": this.country,
        "cellphone": this.cellphone,
        "homephone": this.homephone,
        "workphone": this.workphone,
        "birthday": parsed,
        "email": this.email,
        "emergencyContact": this.emergencyContact,
        "emergencyContactRelation": this.emergencyContactRelation,
        "emergencyContactPhone": this.emergencyContactPhone,
        "access_after_hours":this.accessAfterHours
      }
      await this.mainService.createMember(data).then(result=>{
        if(result=="success"){
          this.closeModal("add-customer-modal")
          this.submitted.emit(true)
        }else{

        }
      });
    }
    openModal(id: string) {
      this.resultData = [];
      this.displayData = new Array(12).fill(undefined);  
      this.waitForUnique = false;      
      this.lastName = "";
      this.firstName = "";
      this.middleName = "";
      this.address1 = "";
      this.address2 = "";
      this.postalCode = "";
      this.city = "";
      this.state = "";
      this.country = "";
      this.cellphone = "";
      this.homephone = "";
      this.workphone = "";
      this.birthday = "";
      this.email = "";
      this.emergencyContact = "";
      this.emergencyContactPhone = "";
       this.page = 1;
      this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
}