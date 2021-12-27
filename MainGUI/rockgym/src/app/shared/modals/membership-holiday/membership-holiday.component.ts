import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'membership-holiday-modal',
  templateUrl: './membership-holiday.component.html',
  styleUrls: ['./membership-holiday.component.css']
})
export class MembershipHolidayComponent implements OnInit {

  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();

  mode:string = "specifyTime";
  minutes:number = 0;
  hours:number = 0;
  days:number = 0;
  endDate:string;
  membership_ref:any;
  actionMode:string = "freezeall";
  showDurationSelect:boolean = true;
  infoMessage:string = "";
  nothing_to_do:boolean = false;
  loading:boolean = false;
  password:string = "";
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  ngOnInit(): void {
    this.openModalEvent.subscribe(r=>{
      this.membership_ref = r['membership'];    
      this.actionMode = r['mode']; 
      this.showDurationSelect = true;
      this.mode = "specifyTime";
      this.days = 0;
      this.endDate = undefined;
      this.infoMessage = "";
      this.password = "";
      this.nothing_to_do = false;
      this.openModal('membership-holiday-modal');
    });      
  }
  getActionModeString(){
    if(this.actionMode=="freezeAll"){
      this.showDurationSelect = false;      
      this.infoMessage = "Warning!!! This action will freeze all the memberships indefinately. Regardless of them being active or not. Are you sure to commence this action?";
      return "Freeze All";
    }else if(this.actionMode=="unfreezeAll"){
      this.infoMessage = "Warning!!! This action will Un-freeze all the memberships indefinately. Regardless of them being active or not. Are you sure to commence this action?";
      this.showDurationSelect = false;
      return "Un-Freeze All";
    }else if(this.actionMode=="holidayAll"){
      this.showDurationSelect = false;
      this.infoMessage = "Warning!!! This action will put all the memberships on holiday indefinately. Regardless of them being active or not. Are you sure to commence this action?";
      return "Holiday All";
    }else if(this.actionMode=="holidayOne"){
      if(this.membership_ref.on_holiday){
        this.showDurationSelect = false;
        this.nothing_to_do = true;
        this.infoMessage = "Membership Already On Holiday.";
      }else{
        this.showDurationSelect = true;
        this.infoMessage = "Making a membership go on holiday would postpone indefinitely its due date, as well as its invoices."
      }
      return "Holiday One";
    }else if(this.actionMode=="freezeOne"){
      if(this.membership_ref.frozen){
        this.showDurationSelect = false;
        this.nothing_to_do = true;
        this.infoMessage = "Membership Already Frozen.";
      }else{
        this.showDurationSelect = true;
        this.infoMessage = "Freezing a membership will cause it to be unable to checkin. However, end date and invoices are not effected."
      }
      return "Freeze One";
    }else if(this.actionMode=="unfreezeOne"){
      this.infoMessage = "Please confirm to unfreeze the membership."
      this.showDurationSelect = false;
      return "Un-Freeze One";
    }else if(this.actionMode=="cancelOne"){
      if(!this.membership_ref.active){
        this.nothing_to_do = true;
        this.infoMessage = "Membership already expired or cancelled...";
      }else{
        this.infoMessage = "Cancelling the membership will set its end date to today. Making it in-active";
      }
      this.showDurationSelect = false;
      return "Cancel One";
    }else if(this.actionMode=="terminateHolidayAll"){
      this.showDurationSelect = false;
      this.infoMessage = "Warning!!! This action will terminate all the membership holidays. Regardless of them being active or not. Are you sure to commence this action?";
      return "Terminate All Holidays";
    }else if(this.actionMode=="terminateHolidayOne"){
      this.infoMessage = "Please confirm to terminate the holiday."
      this.showDurationSelect = false;
      return "Terminate Holiday One";
    }else{
      return ""
    }
  }
  monthToString(month){
    switch (month){
      case 1:{
        return "Jan";
      }
      case 2:{
        return "Feb";
      }
      case 3:{
        return "Mar";
      }
      case 4:{
        return "Apr";
      } 
      case 5:{
        return "May";      
      } 
      case 6:{
        return "Jun";
      }
      case 7:{
        return "Jul";
      }
      case 8:{
        return "Aug";
      }
      case 9:{
        return "Sep";
      }
      case 10:{
        return "Oct";
      }
      case 11:{
        return "Nov";
      }
      case 12:{
        return "Dec";
      }
      default:{
        return month;
      }
    }
      
  }
  dateFromISO(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getDate()) +" - "+this.monthToString((date_parsed.getMonth()+1)) + " -" + date_parsed.getFullYear();
    }else{
      return "-";
    }
  }
  async confirm(){    
    if(this.password!="enhancedhybrid"){
      alert("incorrect password");
      return;
    }
    if(this.mode=="specifyTime"){
      if(this.days<0 || this.days >365){
        return;
      }
    }else if(this.mode=="selectEndDate"){
      if(this.endDate==undefined){
        return;
      }else{
        /*pass*/
      }
    }else if (this.mode=="indefinately"){
        /*pass*/
    }else{
        /*weird...*/
        return;
    }

    let data = {

    }
    this.loading = true;
    if(this.membership_ref){
      data = {
        "days":this.days,
        "endDate":this.endDate,
        "mode":this.mode,
        "membership_id":this.membership_ref.id
      }
    }else{
       data = {

      }
    }
    if(this.actionMode=="freezeOne"){
      data["actionMode"] = "freeze";
      await this.mainService.MembershipFreeze(data).then((result)=>{
        if(result["response"]=="success"){          
          alert("success");
          this.submitted.emit(true);
          this.modalService.close('membership-holiday-modal');  
        }else{
          alert(result["response"]);
        }
      })
    }else if(this.actionMode=="unfreezeOne"){
      data["actionMode"] = "unFreeze";
      await this.mainService.MembershipFreeze(data).then((result)=>{
        if(result["response"]=="success"){          
          alert("success");
          this.submitted.emit(true);
          this.modalService.close('membership-holiday-modal');  
        }else{
          alert(result["response"]);
        }
      })
    }else if(this.actionMode=="holidayOne"){
      data["actionMode"] = "holiday";
      await this.mainService.MembershipHoliday(data).then((result)=>{
        if(result["response"]=="success"){          
          alert("success");
          this.submitted.emit(true);
          this.modalService.close('membership-holiday-modal');  
        }else{
          alert(result["response"]);
        }
      })
    }
    else if(this.actionMode=="terminateHolidayOne"){
      data["actionMode"] = "terminateHoliday";
      await this.mainService.MembershipHoliday(data).then((result)=>{
        if(result["response"]=="success"){          
          alert("success");
          this.submitted.emit(true);
          this.modalService.close('membership-holiday-modal');  
        }else{
          alert(result["response"]);
        }
      })
    }else if(this.actionMode=="cancelOne"){
      /* Cancel Membership*/
      await this.mainService.cancelMembership(this.membership_ref.id).then((result)=>{
          if(result["response"]=="success"){          
            alert("success");
            this.submitted.emit(true);
            this.modalService.close('membership-holiday-modal');  
          }else{
            alert(result["response"]);
          }
        })
      }else if(this.actionMode=="holidayAll"){
      await this.mainService.MembershipHolidayAll().then((result)=>{
          if(result["response"]=="success"){          
            alert("success");
            this.submitted.emit(true);
            this.modalService.close('membership-holiday-modal');  
          }else{
            alert(result["response"]);
          }
        })
      }else if(this.actionMode=="freezeAll"){
      await this.mainService.MembershipFreezeAll().then((result)=>{
          if(result["response"]=="success"){          
            alert("success");
            this.submitted.emit(true);
            this.modalService.close('membership-holiday-modal');  
          }else{
            alert(result["response"]);
          }
        })
      }else if(this.actionMode=="terminateHolidayAll"){
      await this.mainService.MembershipTerminateHolidayAll().then((result)=>{
          if(result["response"]=="success"){          
            alert("success");
            this.submitted.emit(true);
            this.modalService.close('membership-holiday-modal');  
          }else{
            alert(result["response"]);
          }
        })

      }else if(this.actionMode=="unfreezeAll"){
      await this.mainService.MembershipUnFreezeAll().then((result)=>{
          if(result["response"]=="success"){          
            alert("success");
            this.submitted.emit(true);
            this.modalService.close('membership-holiday-modal');  
          }else{
            alert(result["response"]);
          }
        })
      }
      this.loading = false;
  }
  openModal(id: string) {    
    this.modalService.open(id);
}

closeModal(id: string) {
  this.modalService.close(id);
}
}
