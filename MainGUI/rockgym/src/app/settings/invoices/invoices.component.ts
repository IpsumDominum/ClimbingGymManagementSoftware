import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit {

  currentPage:number = 1;
  totalPage:number = 0;
  pageNum:number = 0;
  pageSize:number = 20;  
  searchPrompt:string = "";
  
  invoiceDisplayData:any = new Array(this.pageSize).fill(undefined);
  offset:number =0;
  resultDate:Date = new Date();

  stringDate:string ="";

  loading:boolean = false;

  lookUpKey:string = "Common";
  
  queryMode = "sinceMonth";
  sinceDate:string = "";
  sinceMonthAgo:number = 3;

  purchasesDisplay: any[];
  totalAmount: any;

  constructor(
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
    let data = { 
      "lookUpKey": this.lookUpKey,
      "searchPrompt":this.searchPrompt,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage,
    }
    await this.getInvoicesData(data);      
  }


  async filterBySinceDate(){
    if(this.sinceDate=="" || this.sinceDate==undefined){
      alert("please select a valid date");
    }else{
      this.queryMode = "sinceDate";
      this.loading = true;
      let data = { 
        "lookUpKey": this.lookUpKey,
        "searchPrompt":this.searchPrompt,
        "queryMode":this.queryMode,
        "sinceDate":this.sinceDate,
        "sinceMonthAgo":this.sinceMonthAgo,
        "pageSize":this.pageSize,
        "currentPage":1,
      }
      await this.getInvoicesData(data);
      this.loading = false;
    }
  }
 
  async filterBySinceMonth(months){
    this.sinceMonthAgo = months;
    this.queryMode = "sinceMonth";
    this.loading = true;
    let data = { 
      "lookUpKey": this.lookUpKey,
      "searchPrompt":this.searchPrompt,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":1,
    }
    await this.getInvoicesData(data);
    this.loading = false;
  }
  async nextPage(){
    if(this.currentPage>=this.totalPage){
      this.currentPage = this.totalPage;
      return;
    }
    this.loading = true;
    let data = { 
        "lookUpKey": this.lookUpKey,
      "searchPrompt":this.searchPrompt,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage+1,
    }
    await this.getInvoicesData(data);
    this.loading = false;
  }
  async search(){
    this.loading = true;
    let data = { 
      "lookUpKey": this.lookUpKey,
      "searchPrompt":this.searchPrompt,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":1,
    }
    await this.getInvoicesData(data);
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
        "lookUpKey": this.lookUpKey,
      "searchPrompt":this.searchPrompt,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage-1,
    }
    await this.getInvoicesData(data);
    this.loading = false;
  }

  handleKeyboardEventSearch(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.search();      
    }
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
        "lookUpKey": this.lookUpKey,
      "searchPrompt":this.searchPrompt,
      "queryMode":this.queryMode,
      "sinceDate":this.sinceDate,
      "sinceMonthAgo":this.sinceMonthAgo,
      "pageSize":this.pageSize,
      "currentPage":this.currentPage,
    }
    await this.getInvoicesData(data);
  }
 
  async nextDay(){
    this.offset +=1;
    //await this.getInvoicesData(this.queryDate);
  }

  async previousDay(){
    this.offset -=1;
    //await this.getInvoicesData(this.queryDate);
  }
  async getInvoicesData(data){      
    this.invoiceDisplayData = new Array(this.pageSize).fill(undefined);
    await this.mainService.searchInvoices(data).then(result=>{
          if(result["response"]=="success"){
            this.totalPage = result["total_pages"]
            this.totalAmount = result["total_amount"]
            this.currentPage = result["current_page"]
            this.insertIntoPlaceHolderArray(this.invoiceDisplayData,result["data"]);
          }else{
            alert(result["response"]);
          }
    });
  }


  dateFromISODetailed(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getFullYear()) +"-"+(date_parsed.getMonth()+1) + "-" + date_parsed.getUTCDate() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
    }else{
      return "-";
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

async export_to_csv(){
  this.loading = true;
  let data = { 
    "lookUpKey": this.lookUpKey,
    "searchPrompt":this.searchPrompt,
    "queryMode":this.queryMode,
    "sinceDate":this.sinceDate,
    "sinceMonthAgo":this.sinceMonthAgo,
    "pageSize":this.pageSize,
    "currentPage":1,
    "export":true
  }
  
  await this.getInvoicesData(data);
  this.loading = false;
}
}
