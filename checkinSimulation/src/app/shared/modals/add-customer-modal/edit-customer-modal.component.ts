import { Component, ElementRef, EventEmitter, OnInit, Output, Input, AfterViewInit, AfterContentChecked } from '@angular/core'
import { MainService } from 'src/app/shared/main.service';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'edit-customer-modal',
  templateUrl: './edit-customer-modal.component.html',
styleUrls: ['./add-customer-modal.component.css']
})
export class EditCustomerModalComponent implements OnInit{
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() customer:any;
    

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

    cardSelection:string;
    page:number = 1;
    card_number:string = "";
    card_expiry_month:number = 0;
    card_expiry_year:number = 0;
    card_cvc:string = "";
    loading:boolean = false;
    addingNewPaymentMethod:boolean = false;
    invalid:boolean[] = new Array(6).fill(false);
    /*Current User data fields, used for editing mode*/
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) {        
       }

    ngOnInit(){
      this.loading = true;
      this.load();
      this.loading = false;
    }
    async load(){      
      this.addingNewPaymentMethod = false;
      await this.mainService.getMember(this.customer.id).then((result=>{
        if(result["response"]=="success"){
          this.customer = result["member"];
        }else{
          alert(result["response"]);
        }
      }));
      this.title = this.customer.title;
      this.firstName = this.customer.firstName;
      this.lastName = this.customer.lastName;
      this.middleName = this.customer.middleName;
      this.address1 = this.customer.address1;
      this.address2 = this.customer.address2;
      this.postalCode = this.customer.postalCode;
      this.city = this.customer.city;
      this.state = this.customer.state;
      this.country = this.customer.country;
      this.cellphone = this.customer.cellphone;
      this.homephone = this.customer.homephone;
      this.workphone = this.customer.workphone;
      this.birthday = this.stringDateFromISO(this.customer.birthday);     
      this.email = this.customer.email;
      this.emergencyContact = this.customer.email;
      this.emergencyContactRelation = this.customer.emergencyContactRelation;
      this.emergencyContactPhone = this.customer.emergencyContactPhone;
      this.accessAfterHours = this.customer.access_after_hours;
      if(this.customer.paymentMethods.length==0){
        this.cardSelection = "nocard";
      }else{
        this.cardSelection = this.customer.paymentMethods[0].id;
      }
    }
    stringDateFromISO(date_iso){
      let date_obj = new Date(date_iso);
      let month_string = (date_obj.getUTCMonth()+1).toString();
      if(month_string.length==1){
        month_string = "0" + month_string;
      }
      let date_string = (date_obj.getDate()).toString();
      if(date_string.length==1){
        date_string = "0" + date_string;
      }
      let string_date = date_obj.getUTCFullYear()+"-" +month_string+"-"+ date_string;
      return string_date;
    }
  parseDate(date){
    let tokens = date.split("-");
        let date_obj = new Date(tokens[0],tokens[1]-1,tokens[2]);
    return date_obj;
  } 
    async editMember(){
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
        "id":this.customer.id,
        "title":this.title,
        "firstName": this.firstName,
        "lastName": this.lastName,
        "middleName": this.middleName ? this.middleName : "",
        "address1": this.address1 ? this.address1 : "",
        "address2": this.address2 ? this.address2 : "",
        "postalCode": this.postalCode ? this.postalCode : "",
        "city": this.city ? this.city : "",
        "state": this.state ? this.state : "",
        "country": this.country ? this.country : "",
        "cellphone": this.cellphone ? this.cellphone : "",
        "homephone": this.homephone ? this.homephone : "",
        "workphone": this.workphone ? this.workphone : "",
        "birthday": parsed,
        "email": this.email,
        "emergencyContact": this.emergencyContact,
        "emergencyContactRelation": this.emergencyContactRelation,
        "emergencyContactPhone": this.emergencyContactPhone,
        "access_after_hours":this.accessAfterHours
      }
      await this.mainService.editMember(data).then(result=>{
        if(result=="success"){
          this.closeModal("edit-customer-modal")
          this.submitted.emit(true)
        }else{

        }
      });
    }
    async addNewPaymentMethod(){      
      let data = {
        "customer":this.customer,
        "number":this.card_number,
        "exp_month":this.card_expiry_month,
        "exp_year":this.card_expiry_year,
        "cvc":this.card_cvc
      }
      await this.mainService.createPaymentMethod(data).then(result=>{
        if(result=="success"){
          alert("Success! New card added.");
          this.load();
        }else{
          alert(result);
        }
      });
    }
    openModal(id: string) {
      this.load();      
      this.page = 2;
      this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
}