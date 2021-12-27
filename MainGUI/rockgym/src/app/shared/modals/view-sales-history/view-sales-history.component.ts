import { Component, Input, OnInit } from '@angular/core';
import { MainService } from '../../main.service';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'view-sales-history-modal',
  templateUrl: './view-sales-history.component.html',
  styleUrls: ['./view-sales-history.component.css']
})
export class ViewSalesHistoryComponent implements OnInit {
  @Input() sub_product_ref:any;
  subProductRental:any[] = new Array(10).fill(undefined);
  rentalSelect:any;
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  ngOnInit(
    
  ): void {
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
    this.mainService.getRentalsBySubProduct(this.sub_product_ref.id).then((result)=>{
      if(!result["response"]){
        alert("Error::Unknown Error");
      }else{        
        if(result["response"]!="success"){
          alert(result["response"]);
          return;
        }
      }
      this.subProductRental = this.insertIntoPlaceHolderArray(this.subProductRental,result["data"]);
    });
  }
  openModal(id: string) {
    if(this.sub_product_ref.parent_product.productType=='Retail'){

    }else{
      this.modalService.open(id);
    }
}

closeModal(id: string) {
    this.modalService.close(id);
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
  if(this.rentalSelect){
    this.mainService.rentalMarkAsReturned(this.rentalSelect.id).then((result)=>{
      if(result["response"]=="success"){
        alert("success!");          
        this.rentalSelect.status="returned";
      }else{
        alert(result["response"]);
      }
    });
  }
}

markAsLost(){
  if(this.rentalSelect){
    this.mainService.rentalMarkAsLost(this.rentalSelect.id).then((result)=>{
      if(result["response"]=="success"){
        alert("success!");
        this.rentalSelect.status="lost";
      }else{
        alert(result["response"]);
      }
    });
  }
}
markAsDamaged(){
  if(this.rentalSelect){
    this.mainService.rentalMarkAsDamaged(this.rentalSelect.id).then((result)=>{
      if(result["response"]=="success"){
        alert("success!");
        this.rentalSelect.status="damaged";
      }else{
        alert(result["response"]);
      }
    });
  }
}

dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
  }
}

}
