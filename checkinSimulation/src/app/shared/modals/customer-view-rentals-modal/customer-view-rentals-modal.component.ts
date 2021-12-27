import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'customer-view-rentals-modal',
  templateUrl: './customer-view-rentals-modal.component.html',
  styleUrls: ['./customer-view-rentals-modal.component.css']
})
export class CustomerViewRentalsModalComponent implements OnInit {
  @Input() member_ref:any;
  mode:string = "outstandingRentals";
  rentalsBufferArray:any[];
  rentalsOutstanding:any[] = new Array(8).fill(undefined);
  rentalsHistory:any[] = new Array(8).fill(undefined);
  filter_by:string = "all";
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  ngOnInit(): void {
    this.load();
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
    await this.mainService.getRentalsByMember(this.member_ref.id).then((result)=>{
      if(!result["response"]){
        alert("Error::Unknown Error");
      }else{        
        if(result["response"]!="success"){
          alert(result["response"]);
          return;
        }
      }
      this.rentalsBufferArray = result["data"];
      this.rentalsOutstanding = this.insertIntoPlaceHolderArray(this.rentalsOutstanding,result["data"]);      
    });
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


getStatus(rental){
  let status = rental.status;
  if(status=="overdue"){
    return "Overdue";
  }else if(status=="outstanding"){
    return "Outstanding";
  }
}

getStatusColor(rental){
  let status = rental.status;
  if(status=="overdue"){
    return "brown";
  }else if(status=="outstanding"){
    return "red";
  }else{
    return "green";
  }
}

}
