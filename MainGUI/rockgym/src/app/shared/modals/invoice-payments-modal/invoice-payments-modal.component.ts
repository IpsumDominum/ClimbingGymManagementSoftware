import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'invoice-payment-modal',
  templateUrl: './invoice-payments-modal.component.html',
  styleUrls: ['./invoice-payments-modal.component.css']
})
export class InvoicePaymentsModalComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();

  customer:any;
  loading:boolean = false;
  selectedInvoice:any;
  invoiceData:any;
  displayData:any = new Array(10).fill(undefined);
  
  filterKey:string = "all";

  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { 
    
  }

  ngOnInit(): void {
    this.openModalEvent.subscribe(customer=>{
      this.customer = customer;        
      this.openModal('invoice-payment-modal');
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
  filterInvoiceArray(){
    this.selectedInvoice = undefined;
    this.displayData = new Array(10).fill(undefined);
    let filteredArray = [];
    if(this.filterKey=="all"){
      filteredArray = this.invoiceData;
    }else{
      filteredArray = this.invoiceData.filter(invoice=>invoice.status==this.filterKey);
    }
    this.insertIntoPlaceHolderArray(this.displayData,filteredArray);
  }

  async load(){
    if(!this.customer){
      return;
    }
    this.loading = true;
    await this.mainService.getInvoicesByUser(this.customer.id).then((result)=>{
      if(result["response"]=="success"){
        this.invoiceData = result["data"];    
        this.filterInvoiceArray();
      }else{
        alert(result["response"]);
      }
    });    
    this.loading = false;
  }

async openModal(id: string) {
    await this.load();
    this.modalService.open(id);
}

closeModal(id: string) {
    this.submitted.emit(this.customer.id);
    this.modalService.close(id);
}

expandInvoice(invoice){
  if(invoice){
    this.selectedInvoice = invoice;
  }
}
isSelectedInvoice(invoice){
  if(this.selectedInvoice){
    return this.selectedInvoice.id==invoice.id;
  }else{
    return false;
  }
}

getColorFromStatus(invoice){
  if(invoice){
    if(invoice.status=="paid"){
      return "green";
    }else if(invoice.status=="pending"){
      return "blue";
    }else if(invoice.status=="void"){
      return "gray";
    }else{
      return "red";
    }
  }
}
/*
Void an invoice
*/
voidInvoice(){
  if(!this.selectedInvoice){
    return;
  }else{
    if(this.selectedInvoice.status=="pending"){
      let confirmation = confirm("Are you sure to void this invoice?");
      if(confirmation){
        /*Proceed to void invoice*/
        this.mainService.voidInvoice(this.selectedInvoice.id).then((result)=>{
          if(result["response"]=="success"){
            alert("Successfully voided invoice...");            
            this.load();            
          }else{
            alert(result["response"]);
          }
        });
      }else{
        /*Canceled*/
        return;
      }

    }else{
      alert("Cannot void invoice with status { "+this.selectedInvoice.status + " }");
    }
  }
  
}

/*
filter by
*/
filterBy(filterKey){  
  this.filterKey = filterKey;
  this.filterInvoiceArray();
}

dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
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
    return (date_parsed.getUTCDate()) +" - "+this.monthToString((date_parsed.getMonth()+1)) + " -" + date_parsed.getFullYear();
  }else{
    return "-";
  }
}
getAmountPending(){
  let pendingAmount = 0;
  if(this.invoiceData){
    this.invoiceData.forEach(invoice => {
      if(invoice.status=="pending"){
        pendingAmount +=invoice.expected_amount;
      }
    });
  }
  return pendingAmount;
}

}
