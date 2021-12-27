import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'customer-view-membership-modal',
  templateUrl: './customer-view-membership-modal.component.html',
  styleUrls: ['./customer-view-membership-modal.component.css']
})
export class CustomerViewMembershipModalComponent implements OnInit {
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  detailUser:any;

  displayData:any[] = new Array(10).fill(undefined);

  filterByKey:string = "all";

  membershipData:any;

  loading:boolean = false;
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { 
   
  }

  ngOnInit(): void {
    this.loading = true;
    this.openModalEvent.subscribe(customer=>{
      this.detailUser = customer;
      this.openModal('customer-view-membership-modal');
    });
    this.load();
    this.loading = false;
  }
  insertIntoPlaceHolderArray(placeHolderArray,array){
    for(var i=0;i<array.length;i++){
      if(i<placeHolderArray.length){
        placeHolderArray[i] = array[i];
      }else{
        placeHolderArray.push(array[i]);
      }
    }
    return placeHolderArray;
}
  async load(){
    this.displayData = new Array(10).fill(undefined);    
    if(!this.detailUser){
      return;
    }
    await this.mainService.getMember(this.detailUser.id).then((result)=>{
      if(result["response"]=="success"){
        this.membershipData = result["member"]["memberships"];
      }else{
        alert(result["response"]);
      }
      this.insertIntoPlaceHolderArray(this.displayData,this.membershipData);
    });
  }

  filterBy(key){
    if(["all","active","in-active"].includes(key)){
      this.filterByKey = key;
      this.displayData = new Array(10).fill(undefined);    
      let filtered;
      if(this.filterByKey=="all"){
        filtered = this.membershipData;
      }else if(this.filterByKey=="active"){
        filtered = this.membershipData.filter((membership)=>membership.active==true);
      }else if(this.filterByKey=="in-active"){
        filtered = this.membershipData.filter((membership)=>membership.active==false);
      }
      this.insertIntoPlaceHolderArray(this.displayData,filtered);
    }else{
      alert("Error::Invalid Filter Key.");
    }
    
  }
  
  openModal(id: string) {
    this.load();
    this.modalService.open(id);
}

closeModal(id: string) {
    this.submitted.emit(this.detailUser.id);
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
