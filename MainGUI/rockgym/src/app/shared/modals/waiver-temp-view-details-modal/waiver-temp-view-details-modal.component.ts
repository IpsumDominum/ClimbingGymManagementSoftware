import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'waiver-temp-view-details-modal',
  templateUrl: './waiver-temp-view-details-modal.component.html',
  styleUrls: ['./waiver-temp-view-details-modal.component.css']
})
export class WaiverTempViewDetailsModalComponent implements OnInit {
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Input() waiverTemp:any;
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

    dataIndex:any;
    /*Current User data fields, used for editing mode*/
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) {        
       }

    ngOnInit() {
      this.openModalEvent.subscribe(data=>{        
          this.waiverTemp = data;
          this.openModal('waiver-temp-view-details-modal');        
      });
      this.loading = true;
      this.load();
      this.loading = false;
    }
    async load(){
      this.resultData = [];
      this.displayData = new Array(12).fill(undefined);  
      this.waitForUnique = false;      
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
       this.page = 1;       
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
dateFromISO(date:string){
      let date_parsed = new Date(date);
      return this.stringDateFromObj(date_parsed);
  }
    openModal(id: string) {
      this.load();      
      this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
}
 