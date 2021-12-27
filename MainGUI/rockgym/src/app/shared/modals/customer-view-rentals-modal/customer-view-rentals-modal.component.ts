import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'customer-view-rentals-modal',
  templateUrl: './customer-view-rentals-modal.component.html',
  styleUrls: ['./customer-view-rentals-modal.component.css']
})
export class CustomerViewRentalsModalComponent implements OnInit {
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Output() submitted: EventEmitter<any> = new EventEmitter();

  member_ref:any;
  mode:string = "outstandingRentals";
  rentalsBufferArray:any[];
  rentalsOutstanding:any[] = new Array(8).fill(undefined);
  rentalsHistory:any[] = new Array(8).fill(undefined);
  filterByKey:string = "all";
  selectedRental:any;

  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { 
    
  }

  ngOnInit(): void {
    this.openModalEvent.subscribe(customer=>{
      this.member_ref = customer;
      this.filterByKey = "all";
      this.openModal('customer-view-rentals-modal');
    });    
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

  filterBy(key){
    this.filterByKey = key;
    let filtered = [];
    if(key!="all"){
      filtered = this.rentalsBufferArray.filter((rental)=>rental.status==key);
    }else{
      filtered = this.rentalsBufferArray;
    }
    this.rentalsOutstanding = new Array(8).fill(undefined);
    this.rentalsOutstanding = this.insertIntoPlaceHolderArray(this.rentalsOutstanding,filtered);      
  }
  async load(){
    this.mode = "outstandingRentals";
    this.rentalsBufferArray;
    this.rentalsOutstanding = new Array(8).fill(undefined);
    this.rentalsHistory = new Array(8).fill(undefined);    
    if(!this.member_ref){
      return;
    }
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
    this.load();
    this.modalService.open(id);
}

closeModal(id: string) {
    this.submitted.emit(this.member_ref.id);
    this.modalService.close(id);
}

dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return date_parsed.getDate() +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
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
  }else if(status=="lost"){
    return "Lost";
  }else if(status=="damaged"){
    return "Damaged";
  }else if(status=="returned"){
    return "Returned";
  }else{
    return status;
  }
}

getStatusColor(rental){
  let status = rental.status;
  if(status=="overdue"){
    return "brown";
  }else if(status=="outstanding"){
    return "red";
  }else if(status=="lost"){
    return "black";
  } else if(status=="damaged"){
    return "black";
  }else{
    return "green";
  }
}

markAsReturned(){
  if(this.selectedRental){
    this.mainService.rentalMarkAsReturned(this.selectedRental.id).then((result)=>{
      if(result["response"]=="success"){
        alert("success!");
        this.load();
      }else{
        alert(result["response"]);
      }
    });
  }
}

markAsLost(){
  if(this.selectedRental){
    this.mainService.rentalMarkAsLost(this.selectedRental.id).then((result)=>{
      if(result["response"]=="success"){
        alert("success!");
        this.load();
      }else{
        alert(result["response"]);
      }
    });
  }
}
markAsDamaged(){
  if(this.selectedRental){
    this.mainService.rentalMarkAsDamaged(this.selectedRental.id).then((result)=>{
      if(result["response"]=="success"){
        alert("success!");
        this.load();
      }else{
        alert(result["response"]);
      }
    });
  }
}

}
