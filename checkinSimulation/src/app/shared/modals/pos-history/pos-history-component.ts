import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'pos-history-modal',
  templateUrl: './pos-history.component.html',
  styleUrls: ['./pos-history.component.css']
})
export class POSHistoryComponent implements OnInit {

  loading:boolean = false;
  today:Date = new Date();
  salesData:any = new Array(33).fill(undefined);
  saleSelection:any = {"id":"none"};

  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }
  
  ngOnInit(): void {
    this.load();
  }
  async load(){
    this.loading = true;
    this.getSalesData();
    this.loading = false;
  }
  async getSalesData(){    
    let date = {
      "year":this.today.getFullYear(),
      "month":this.today.getUTCMonth()+1,
      "day":this.today.getUTCDate(),
      "offset":0
    };
    
    await this.mainService.getSalesToday(date).then(result=>{
      result = result["data"];
      this.salesData = new Array(33).fill(undefined);
      if(this.salesData.length<=result.length){
        this.salesData = result.reverse();
      }else{
        for(var i=0;i<this.salesData.length;i++){
          if(i<result.length){
            this.salesData[i] = result[result.length-i-1];
          }else{
            break;
          }
        }
      }      
    });
  }
 /*
  Select Sale
  */
 selectSale(sale){
   if(sale){
    this.saleSelection = sale;
   }
 }
  
  /*
  Check if sale is selected
  */
 saleSelected(sale){
  if(sale){
    if(this.saleSelection){
     return this.saleSelection.id == sale.id ? "gray" : "";
    }else{
     return "";
    }    
  }else{
   return "";
  }
}
  /*
  Delete Sale Entry
  */
  async delete_sale(){
    if(!this.saleSelection){
      alert("Please select a sale entry first");
    }else{
      await this.mainService.deleteSaleEntry(this.saleSelection);
      this.load();  
    }
  }
  parseDate(isoDate){
    let parsed = new Date(isoDate);
    return parsed.getHours().toString() + ":" +
          parsed.getMinutes().toString() + ":" +
          parsed.getSeconds().toString() + " ";;
  }
  /*
  Get Total
  */
 getTotal(){
  let total = 0;
  this.salesData.forEach(sale => {
    if(sale){
      if(sale.product){
        if(sale.product.price){
          total += sale.product.price;  
        }
      }
    }

  });
  return total
}

  openModal(id: string) {
    this.load();
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}
