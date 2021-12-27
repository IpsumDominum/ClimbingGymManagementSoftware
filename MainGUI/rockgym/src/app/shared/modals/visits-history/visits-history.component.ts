import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'visits-history-modal',
  templateUrl: './visits-history.component.html',
  styleUrls: ['./visits-history.component.css']
})
export class VisitsHistoryComponent implements OnInit {
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Output() submitted: EventEmitter<any> = new EventEmitter();

  customer:any;
  loading:boolean = false;

  pageSize = 10;
  totalPage:number = 0;
  currentPage:number = 0;
  totalAmount:number = 0;

  queryMode = "sinceMonth";
  sinceDate:string = "";
  sinceMonthAgo:number = 3;
  checkinHistory:any[] = new Array(this.pageSize).fill(undefined);

  
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  async ngOnInit(){
    this.openModalEvent.subscribe(async customer=>{
      this.customer = customer;
      this.openModal('visit-history-modal');
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
    this.loading = true;
    let data = {
      "id":this.customer.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage,
    }
    await this.queryCustomerCheckIn(data);
    this.loading = false;
  }

  async queryCustomerCheckIn(data){
    this.checkinHistory = new Array(this.pageSize).fill(undefined);
    if(this.customer){
      await this.mainService.getCheckinHistoryByMember(
        data
        ).then(async (result)=>{
          if(result["response"]=="success"){
            this.totalPage = result["total_pages"]
            this.totalAmount = result["total_amount"]
            this.currentPage = result["current_page"]
            await this.insertIntoPlaceHolderArray(this.checkinHistory,result["data"]);
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
        "id":this.customer.id,
        "queryMode":this.queryMode,
        "sinceDate":this.sinceDate,
        "sinceMonthAgo":this.sinceMonthAgo,
        "pageSize":this.pageSize,
        "currentPage":1,
      }
      await this.queryCustomerCheckIn(data);
      this.loading = false;
    }
  }
  async filterBySinceMonth(months){
    this.sinceMonthAgo = months;
    this.queryMode = "sinceMonth";
    this.loading = true;
    let data = {
      "id":this.customer.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":1,
    }
    await this.queryCustomerCheckIn(data);
    this.loading = false;
  }

  async nextPage(){
    if(this.currentPage>=this.totalPage){
      this.currentPage = this.totalPage;
      return;
    }
    this.loading = true;
    let data = {
      "id":this.customer.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage+1,
    }
    await this.queryCustomerCheckIn(data);
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
      "id":this.customer.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage-1,
    }
    await this.queryCustomerCheckIn(data);
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
      "id":this.customer.id,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage,
    }
    await this.queryCustomerCheckIn(data);
  }
  openModal(id: string) {
    this.load();
    this.modalService.open(id);
}

closeModal(id: string) {
    this.submitted.emit(this.customer.id);
    this.modalService.close(id);
}
getVisitAmount(){
  let amount = 0;
  this.checkinHistory.forEach(ele => {
    if(ele){
      amount +=1;
    }
  });
  return amount;
}
dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
  }
}  
dateFromISO(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear();
  }else{
    return "-";
  }
}
isBirthday(birthday){
    let date = new Date(birthday);
    let today = new Date();
    let month_diff = today.getMonth() - date.getMonth();
    let day_diff = today.getUTCDate() - date.getUTCDate()-1;        
    if(month_diff==0 && day_diff==0){
      return true;
    }else{
      return false;
    }
}
getAgeGroup(customer){
  let today = new Date();
  if(customer.birthday){
    let date = new Date(customer.birthday);
    let year_diff = today.getFullYear() - date.getFullYear();
    let month_diff = today.getMonth() - date.getMonth();
    if(month_diff>0){
    }else if(month_diff==0){
      let day_diff = today.getUTCDate() - date.getUTCDate();        
      if(day_diff >=0){
      }else{
        year_diff -=1;
      }
    }else{
      year_diff -=1;
    }
    if(year_diff<13){
      return "Child"
    }else if(year_diff>=13 && year_diff <18){
      return "Young Adult"
    }else{
      return "Adult"
    }
  }else{
    return "-";
  }
}
}
