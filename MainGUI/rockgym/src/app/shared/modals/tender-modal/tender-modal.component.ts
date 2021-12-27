import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'tender-modal',
  templateUrl: './tender-modal.component.html',
  styleUrls: ['./tender-modal.component.css']
})
export class TenderModalComponent implements OnInit {

  @Output() submitted: EventEmitter<any> = new EventEmitter();

  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();

  displayTray:any[] = [];
  discountApplied:number;
  discountAmountApplied:number;
  tenderOption:string = "Cash"
  total:number;
  page:number = 1;
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

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
  ngOnInit(): void {
    this.openModalEvent.subscribe(data=>{
      this.displayTray = data["saleTray"];
      //this.discountApplied = data["discountApplied"];
      //this.discountAmountApplied = data["discountAmountApplied"];
      //this.insertIntoPlaceHolderArray(this.displayTray,data);
      this.page = 1;
      this.openModal('tender-modal');
    });
  }

  createSales(){
    //this.page = 2;
    this.page = 3;
      try{
          this.displayTray.forEach(async sale => {
          sale['expected_amount'] = this.roundUp(this.getSalePrice(sale) * (1- sale.discount_percentage/100) - sale.discount_amount);
          sale['paid_amount'] = this.roundUp(this.getSalePrice(sale) * (1- sale.discount_percentage/100) - sale.discount_amount);
          sale["discount_percentage"] = sale.discount_percentage;
          sale["discount_amount"] = sale.discount_amount;
          sale["status"] = "pending";
          if(sale["saleType"]=="membership"){
            await this.createMembership(sale);
            if(sale["status"]=="success"){
              sale["payment_method"] = this.tenderOption;
              await this.mainService.confirmSale(sale).then(result=>{
                  sale["status"] = result;
                });
            }else{
              return;
            }
          }else{
            sale["payment_method"] = this.tenderOption;
            await this.mainService.confirmSale(sale).then(result=>{
                sale["status"] = result;
              });
          }
        });
      }
      catch{
        alert("Error::Unknown error... Try restarting database or contact developer.");
      }
  }
  isAllSuccess(){
    let allSuccess = true;
    this.displayTray.forEach(sale => {
      if(sale.status!="success"){
        allSuccess = false;
        if(sale.status=="error"){
          return "Some error has occurred...";
        }
      }
      
    });
    return allSuccess;
    
  }
  roundUp(num){
    return Math.round((num+Number.EPSILON)*100)/100;
  }
getTotalRaw(){
  let total = 0;
  this.displayTray.forEach(sale => {
    if(sale){
      if(sale.productType=="membership"){
        total += sale.price
      }else{
        total += sale.price * sale.quantity;
      }
    }
  });
  return this.roundUp(total);
}
getTotal(){
  let total = 0;
  this.displayTray.forEach(sale => {
    if(sale){
      if(sale.productType=="membership"){
        total += this.roundUp((sale.price)*(1-sale.discount_percentage/100)- sale.discount_amount);
      }else{
        total += this.roundUp((sale.price * sale.quantity)*(1-sale.discount_percentage/100)- sale.discount_amount);
      }
    }
  });
  return this.roundUp(total);
}

  async createMembership(sale){
     if(sale["paymentOption"]==1){
      //Prepaid In Full 
      //Prepaid with cash or eftpos, no need for calling Stripe
        await this.mainService.createMembership({
          "paymentOption":"prepaidCash",
          "paidFull":true,
          "customer":sale["member"],
          "membership_description":sale["productName"],
          "membership_duration":sale["quantity"], 
          "membership_duration_unit": "month", 
          "billing_frequency":"weekly",
          "membership_type":sale["type"],
          "autoRenew":sale["autoRenew"]
        }).then(result=>{
          sale["status"] = result["response"];
        });
    }else if(sale["paymentOption"]==2){
      //Prepay using card via stripe
      sale["member"].card_id = sale["card_id"]
      await this.mainService.createMembership({
        "paymentOption":"recurring",
        "paidFull":false,
        "customer":sale["member"],
        "membership_duration": sale["quantity"], 
        "membership_description":sale["productName"],
        "membership_duration_unit": "month",
        "billing_frequency":sale["billing_frequency"],
        "membership_type":sale["type"],
        "autoRenew":sale["autoRenew"]
      }).then(result=>{
        sale["status"] = result["response"];
      });
    } 
   }
  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
    if(!this.isAllSuccess()){
      let confirmation = confirm("Items still pending, are you sure to close tender panel?");
      if(confirmation==true){
        /*pass*/
      }else{
        return;
      }
    }
    this.submitted.emit(this.isAllSuccess());
    this.modalService.close(id);
}

getRentalDueDate(sale){
  if(sale.rental_due_date_mode=="specifyTime"){
    return `@${sale.rental_due_date["days"]}:${sale.rental_due_date["hours"]}:${sale.rental_due_date["minutes"]} `;
  }else if(sale.rental_due_date_mode=="selectEndDate"){
    return sale.rental_due_date;
  }
}
getSalePrice(sale){
  if(sale["saleType"]=="membership"){
    return sale.price;
  }else{
    return sale.price * sale.quantity;
  }
}
}