import { Component, OnInit } from '@angular/core';
import { MainService } from '../../main.service';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'view-all-overdue-rentals-modal',
  templateUrl: './create-coupon-modal.component.html',
  styleUrls: ['./create-coupon-modal.component.css']
})
export class CreateCouponModalComponent implements OnInit {
  mode:string = "outstandingRentals";
  
  filterByKey:string = "outstanding";
  selectedRental:any;

  searchPrompt:string = "";

  lookUpKey:string = "Common";

  totalPage:number = 0;
  currentPage:number = 1;
  totalAmount:number = 0;

  pageSize:number = 8;

  rentalsBufferArray:any[];
  rentalsOutstanding:any[] = new Array(this.pageSize).fill(undefined);

  loading:boolean = false;

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
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":this.pageSize,
    "currentPage":this.currentPage,
    "searchType":"normal",
    "filterByKey":this.filterByKey
     }
  );
}
filterBy(filterByKey){
  this.filterByKey=filterByKey;
  this.searchNew();
}
async search(searchQuery){
  this.mode = "outstandingRentals";
  this.rentalsBufferArray = new Array(this.pageSize).fill(undefined);
  this.rentalsOutstanding = new Array(this.pageSize).fill(undefined);
  await this.mainService.getOverdueRentals(searchQuery).then((result)=>{
    if(!result["response"]){
      alert("Error::Unknown Error");
    }else{        
      if(result["response"]!="success"){
        alert(result["response"]);
        return;
      }else{
        this.rentalsBufferArray = result["data"];
        this.totalPage = result["total_pages"];
        this.currentPage = result["current_page"];
        this.totalAmount = result["total_amount"];
        this.rentalsOutstanding = this.insertIntoPlaceHolderArray(this.rentalsOutstanding,result["data"]);
      }
    }
  });
}


searchNew(){      
  this.search(
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":this.pageSize,
    "currentPage":1,
    "searchType":"normal",
    "filterByKey":this.filterByKey
     }
  );
}
nextPage(){      
  if(this.currentPage==this.totalPage){
    return;
  }
  this.search(
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":this.pageSize,
    "currentPage":this.currentPage+1,
    "searchType":"normal",
    "filterByKey":this.filterByKey
     }
  );
}
previousPage(){
  if(this.currentPage==1 || this.currentPage==0){
    return;
  }
  this.search(
    {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":this.pageSize,
    "currentPage":this.currentPage-1,
    "searchType":"normal",
    "filterByKey":this.filterByKey
     }
  );
}

handleKeyboardEvent(event:KeyboardEvent){
  if(event.key=="Enter"){
    this.search(
      {"searchPrompt":this.searchPrompt,
    "lookUpKey":this.lookUpKey,
    "pageSize":this.pageSize,
    "currentPage":1,
    "searchType":"normal",
    "filterByKey":this.filterByKey
     }
    );
  }
}  

async load(){
  this.loading = true;
  await this.searchNew();
  this.loading = false;
}
  openModal(id: string) {
    this.load();
    this.modalService.open(id);
}

closeModal(id: string) {
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

async markAllAsReturned(){
    await this.mainService.rentalMarkAllAsReturned().then((result)=>{
      if(result["response"]=="success"){
        alert("success!");
        this.load();
      }else{
        alert(result["response"]);
      }
    });
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
