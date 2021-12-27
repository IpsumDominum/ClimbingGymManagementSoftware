import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';
import {Subject, Observable} from 'rxjs';
import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';

@Component({
  selector: 'convert-to-customer-modal',
  templateUrl: './convert-to-customer-modal.component.html',
  styleUrls: ['./convert-to-customer-modal.component.css']
})
export class ConvertToCustomerModalComponent implements OnInit {
  
  @Output() submitted: EventEmitter<any> = new EventEmitter();  
  @Output() alert_relay: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Input() waiverTemp:any;
  @Input() index:number;


  private trigger: Subject<void> = new Subject<void>();
  public webcamImage: WebcamImage = null;
  shooting:boolean = true;
  tab:string = "add";

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
    

    /*Mailing Info*/
    do_not_send_mail:boolean = false;
    mail_on_internal_events:boolean = true;
    mail_promotions:boolean = true;

    /*Promotional Filter Info*/
    proficiency_level:string = "beginner";
    got_to_know_channel:string = "newspaper";
    
    totalPage:number = 0;
    currentPage:number = 1;
    totalAmount:number = 0;

    paxton_card_id:string = "";
    dataIndex:any;
    profile_photo:string = null;
    notes:string = "";
    /*Current User data fields, used for editing mode*/
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) {        
       }

    ngOnInit() {
      this.openModalEvent.subscribe(data=>{        
          this.waiverTemp = data;
          this.openModal('convert-to-customer-modal');        
      });
      this.loading = true;
      this.load();
      this.loading = false;
    }
    async load(){
      this.loading = true;
      this.resultData = [];
      this.displayData = new Array(12).fill(undefined);  
      this.waitForUnique = false;      
      this.title = this.waiverTemp.title;
      this.lastName = this.waiverTemp.lastName;
      this.firstName = this.waiverTemp.firstName;
      this.middleName = this.waiverTemp.middleName;
      this.address1 = this.waiverTemp.street;
      this.address2 = this.waiverTemp.street2;
      this.postalCode = this.waiverTemp.postalCode;
      this.city = this.waiverTemp.city;
      this.state = this.waiverTemp.state;
      this.country = this.waiverTemp.country;
      this.cellphone = this.waiverTemp.phone;
      this.homephone = this.waiverTemp.phone;
      this.workphone = this.waiverTemp.workphone;
      this.birthday = this.dateFromISO(this.waiverTemp.birthday);
      this.email = this.waiverTemp.email;
      this.emergencyContact = this.waiverTemp.emergencyContactName;
      this.emergencyContactPhone = this.waiverTemp.emergencyContactPhone;
      this.emergencyContactRelation = this.waiverTemp.emergencyContactRelation;
      this.profile_photo = null;
      this.mail_on_internal_events = true;
      this.accessAfterHours = false;
      this.mail_promotions = true;
      this.do_not_send_mail = false;
      this.notes = "";
      this.page = 1;       
      this.loading = false;
    }
    prev(){
      this.page = 1;
    }
    next(){
      if(this.firstName==""){
        this.alert_relay.emit({
          "message":"please fill in at least first and last name",
          "idx":this.index
        });
        return;
      }
      if(this.lastName==""){
        this.alert_relay.emit({
          "message":"please fill in at least first and last name",
          "idx":this.index
        });
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
          this.alert_relay.emit({
            "message":"please ensure new customer is unique",
            "idx":this.index})
          return;
        }
      }
      this.search({"firstName":this.firstName,
      "middleName":this.middleName,
      "lastName":this.lastName,
      "pageSize":12,
      "currentPage":1,
      "searchType":"name",
       },true);
    }
  async search(searchQuery,check){    
      this.resultData = [];
      this.displayData = new Array(12).fill(undefined);
      await this.mainService.searchMember(
      searchQuery).then((result=>{
           if(result["response"]=="success"){
              result["data"].forEach(ele => {
                this.resultData.push(ele);
              });
              this.currentPage = result["current_page"];
              this.totalPage = result["total_pages"];
              this.totalAmount = result["total_amount"];
           }else{
             alert(result["response"]);
           }
      }));
  
        for(var i=0;i<this.resultData.length;i++){
          if(i<this.displayData.length){
            this.displayData[i] = this.resultData[i];
          }else{
            this.displayData.push(this.resultData[i]);
          }
        }
        
      if(check){
      /*
        Good if no contradicting customer found
      */
      if(this.resultData.length==0){
        this.page = 2;
        this.waitForUnique = false;
      }else{
        this.alert_relay.emit(
            {"message":"Existing Customer Found, If this is not a mistake, Please Specifiy a unique Middle Name.",
            "idx":this.index})
        this.waitForUnique = true;
      }}
      else{
        return;
      }
  } 
  parseDate(date){
    let tokens = date.split("-");
        let date_obj = new Date(tokens[0],tokens[1]-1,tokens[2]);
    return date_obj;
  } 
    async createMember(){ 
      if(this.loading){
        return;
      }

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
       this.alert_relay.emit(
         {"message":"please fill in all required fields!",
         "idx":this.index});
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
        "birthday": this.birthday,
        "email": this.email,
        "emergencyContact": this.emergencyContact,
        "emergencyContactRelation": this.emergencyContactRelation,
        "emergencyContactPhone": this.emergencyContactPhone,
        "access_after_hours":this.accessAfterHours,        
        "signatureImage":this.waiverTemp.signatureImage,
        "do_not_send_mail":this.do_not_send_mail,
        "got_to_know_channel":this.got_to_know_channel,
        "proficiency_level":this.proficiency_level,
        "mail_on_internal_events":this.mail_on_internal_events,
        "mail_promotions":this.mail_promotions,
        "paxton_card_id":this.paxton_card_id,
        "profile_photo":this.profile_photo,
        "notes":this.notes
      }
      this.loading = true;
      await this.mainService.createMember(data).then(result=>{
        if(result["response"]=="success"){
          this.closeModal("convert-to-customer-modal");
          this.submitted.emit({"waiver":this.waiverTemp,"member_id":result["member_id"]});
        }else{
          alert(result["response"]);
        }
      });
      this.loading = false;
    }
    nextPage(){      
      if(this.firstName==""){
        return;
      }
      if(this.lastName==""){
        return;
      }
      if(this.currentPage==this.totalPage){
        return;
      }
      this.search(
        {"firstName":this.firstName,
        "middleName":this.middleName,
        "lastName":this.lastName,
        "pageSize":12,
        "currentPage":this.currentPage+1,
        "searchType":"name",
         },false
      );
    }
    previousPage(){
      if(this.firstName==""){
        return;
      }
      if(this.lastName==""){
        return;
      }
      if(this.currentPage==1 || this.currentPage==0){
        return;
      }
      this.search(
        {"firstName":this.firstName,
        "middleName":this.middleName,
        "lastName":this.lastName,
        "pageSize":12,
        "currentPage":this.currentPage-1,
        "searchType":"name",
         },false
      );
    }
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
        {"firstName":this.firstName,
        "middleName":this.middleName,
        "lastName":this.lastName,
        "pageSize":12,
        "currentPage":this.currentPage,
        "searchType":"name",
         },false
      );
    }
    stringDateFromObj(date_obj){
      let month_string = (date_obj.getMonth()+1).toString();
      if(month_string.length==1){
        month_string = "0" + month_string;
      }
      let date_string = (date_obj.getDate()).toString();
      if(date_string.length==1){
        date_string = "0" + date_string;
      }
      let string_date = date_obj.getFullYear()+"-" +month_string+"-"+ date_string;
      return string_date;
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
      let date_parsed = new Date(date);
      return this.stringDateFromObj(date_parsed);
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
    openModal(id: string) {
      this.load();      
      this.next();
      this.modalService.open(id);
    }
   
    closeModal(id: string) {
        this.modalService.close(id);
    }
    handleKeyboardEvent(event:KeyboardEvent){
      if(event.key=="Enter"){
        this.next();
      }
    }  
    handleKeyboardEventKeyFob(event:KeyboardEvent){
      if(event.key=="Enter"){
        this.setKeyFob();
      }
    }  
    setKeyFob(){

    }
    clearKeyFob(){
      
    }

    
    public triggerSnapshot(): void {
      this.trigger.next();
    }
    
  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }
    public handleImage(webcamImage: WebcamImage): void {
      //console.info('received webcam image', webcamImage);
      this.shooting = false;
      this.profile_photo = webcamImage.imageAsDataUrl;
      this.webcamImage = webcamImage;
    }
}