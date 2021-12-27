import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'view-purchase-history-modal',
  templateUrl: './view-purchase-history.component.html',
  styleUrls: ['./view-purchase-history.component.css']
})
export class ViewPurchaseHistoryComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  member_ref:any;

  purchasesBufferArray:any[];
  purchasesDisplay:any[] = new Array(10).fill(undefined);

  pageSize = 10;
  totalPage:number = 0;
  currentPage:number = 0;
  totalAmount:number = 0;

  queryMode = "sinceMonth";
  sinceDate:string = "";
  sinceMonthAgo:number = 3;
  checkinHistory:any[] = new Array(this.pageSize).fill(undefined);

  loading:boolean = false;

  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) {}
  ngOnInit(): void {
    this.openModalEvent.subscribe(customer=>{
      this.member_ref = customer;
      this.openModal('view-purchase-history-modal');
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

  async load(){
    this.purchasesBufferArray;    
    if(!this.member_ref){
      return;
    }
    let data = {
      "id":this.member_ref.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage,
    }
    await this.queryCustomerPurchaseHistory(data);      
  }

  async queryCustomerPurchaseHistory(data){
    this.purchasesDisplay = new Array(this.pageSize).fill(undefined);
    if(this.member_ref){
      await this.mainService.getSalesByMember(
        data
        ).then(async (result)=>{
          if(result["response"]=="success"){
            this.totalPage = result["total_pages"]
            this.totalAmount = result["total_amount"]
            this.currentPage = result["current_page"]
            this.purchasesDisplay = this.insertIntoPlaceHolderArray(this.purchasesDisplay,result["data"]);
          }else{
            alert(result["response"]);
          }
        
      });
    }
  }
  async filterBySinceDate(){
    if(this.sinceDate=="" || this.sinceDate==undefined){
      alert("please select a valid date");
    }else{
      this.queryMode = "sinceDate";
      this.loading = true;
      let data = {
        "id":this.member_ref.id,
        "queryMode":this.queryMode,
        "sinceDate":this.sinceDate,
        "sinceMonthAgo":this.sinceMonthAgo,
        "pageSize":this.pageSize,
        "currentPage":1,
      }
      await this.queryCustomerPurchaseHistory(data);
      this.loading = false;
    }
  }
  async filterBySinceMonth(months){
    this.sinceMonthAgo = months;
    this.queryMode = "sinceMonth";
    this.loading = true;
    let data = {
      "id":this.member_ref.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":1,
    }
    await this.queryCustomerPurchaseHistory(data);
    this.loading = false;
  }

  async nextPage(){
    if(this.currentPage>=this.totalPage){
      this.currentPage = this.totalPage;
      return;
    }
    this.loading = true;
    let data = {
      "id":this.member_ref.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage+1,
    }
    await this.queryCustomerPurchaseHistory(data);
    this.loading = false;
  }

  async previousPage(){
    if(this.currentPage<=1){
      if(this.totalPage==0){
        this.currentPage =0;
      }else{
        this.currentPage = 1;
      }
      return;
    }
    this.loading = true;
    let data = {
      "id":this.member_ref.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage-1,
    }
    await this.queryCustomerPurchaseHistory(data);
    this.loading = false;
  }

  handleKeyboardEvent(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.filterBySinceDate();
    }
  }  
  isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    // @ts-ignore
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    // @ts-ignore
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }
  async onSearchChange($event){  
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
    let data = {
      "id":this.member_ref.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage,
    }
    await this.queryCustomerPurchaseHistory(data);
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
    return (date_parsed.getFullYear()) +"-"+(date_parsed.getMonth()+1) + "-" + date_parsed.getUTCDate() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
  }
}  
}
