import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'customer-view-membership-modal',
  templateUrl: './customer-view-membership-modal.component.html',
  styleUrls: ['./customer-view-membership-modal.component.css']
})
export class CustomerViewMembershipModalComponent implements OnInit {
  @Input() detailUser:any;
  @Output() submitted: EventEmitter<any> = new EventEmitter();

  displayData:any[] = new Array(10).fill(undefined);
  loading:boolean = false;
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.load();
    this.loading = false;
  }
  async load(){
    await this.mainService.getMember(this.detailUser.id).then((result)=>{
      if(result["response"]=="success"){
        for(var i=0;i<result['member']['memberships'].length;i++){
          if(i<this.detailUser.length){
            this.displayData[i] = result['member']['memberships'][i];
          }else{
            this.displayData.push(result['member']['memberships'][i]);
          }
        }
      }else{
        alert(result["response"]);
      }
      
    });
  }
  
  openModal(id: string) {
    let displayData = new Array(10).fill(undefined);    
    this.modalService.open(id);
}

closeModal(id: string) {
    this.submitted.emit(true);
    this.modalService.close(id);
}
dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getUTCDate()+1) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
  }
}  
dateFromISO(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getUTCDate()+1) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear();
  }else{
    return "-";
  }
}
}
