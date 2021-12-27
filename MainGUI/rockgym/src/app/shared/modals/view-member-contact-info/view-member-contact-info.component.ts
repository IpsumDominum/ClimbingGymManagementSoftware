import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'view-member-contact-info-modal',
  templateUrl: './view-member-contact-info.component.html',
  styleUrls: ['./view-member-contact-info.component.css']
})
export class ViewMemberContactInfoComponent implements OnInit {
  @Input() rental_ref:any;
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
}
